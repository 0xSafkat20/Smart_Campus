using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Api.Features.Classes;
using SchoolAdmission.Api.Features.Holds;

namespace SchoolAdmission.Api.Tests;

public sealed class HoldLifecycleApiTests(PostgreSqlFixture database)
    : IClassFixture<PostgreSqlFixture>
{
    [Fact]
    public async Task Confirm_IsOwnershipProtectedAndIdempotent()
    {
        var owner = Student(101);
        var otherStudent = Student(102);
        await using var factory = await CreateFactory();
        using var client = factory.CreateClient();
        var admissionClass = await CreateClass(client, "Confirmation Class", 2);
        var hold = await CreateHold(client, admissionClass.Id, owner);

        using var wrongOwner = await SendStudentRequest(
            client,
            HttpMethod.Post,
            $"/holds/{hold.HoldId}/confirm",
            otherStudent);
        Assert.Equal(HttpStatusCode.NotFound, wrongOwner.StatusCode);

        using var firstConfirmation = await SendStudentRequest(
            client,
            HttpMethod.Post,
            $"/holds/{hold.HoldId}/confirm",
            owner);
        Assert.Equal(HttpStatusCode.OK, firstConfirmation.StatusCode);
        var firstBody = await firstConfirmation.Content
            .ReadFromJsonAsync<ConfirmHoldResponse>();
        Assert.Equal(new ConfirmHoldResponse(hold.HoldId, "CONFIRMED"), firstBody);

        using var repeatedConfirmation = await SendStudentRequest(
            client,
            HttpMethod.Post,
            $"/holds/{hold.HoldId}/confirm",
            owner);
        Assert.Equal(HttpStatusCode.OK, repeatedConfirmation.StatusCode);

        var classState = await client.GetFromJsonAsync<ClassResponse>(
            $"/classes/{admissionClass.Id}");
        Assert.NotNull(classState);
        Assert.Equal(0, classState.HeldSeats);
        Assert.Equal(1, classState.ConfirmedSeats);
        Assert.Equal(1, classState.AvailableSeats);

        var holdState = await client.GetFromJsonAsync<HoldResponse>(
            $"/holds/{hold.HoldId}");
        Assert.NotNull(holdState);
        Assert.Equal("CONFIRMED", holdState.Status);
    }

    [Fact]
    public async Task Confirm_AfterExpiry_ReturnsConflictAndPersistsExpiredStatus()
    {
        var owner = Student(201);
        var timeProvider = NewTimeProvider();
        await using var factory = await CreateFactory(timeProvider);
        using var client = factory.CreateClient();
        var admissionClass = await CreateClass(client, "Expiring Class", 1);
        var hold = await CreateHold(client, admissionClass.Id, owner);

        timeProvider.Advance(TimeSpan.FromSeconds(601));

        using var confirmation = await SendStudentRequest(
            client,
            HttpMethod.Post,
            $"/holds/{hold.HoldId}/confirm",
            owner);
        Assert.Equal(HttpStatusCode.Conflict, confirmation.StatusCode);

        var holdState = await client.GetFromJsonAsync<HoldResponse>(
            $"/holds/{hold.HoldId}");
        Assert.NotNull(holdState);
        Assert.Equal("EXPIRED", holdState.Status);

        var classState = await client.GetFromJsonAsync<ClassResponse>(
            $"/classes/{admissionClass.Id}");
        Assert.NotNull(classState);
        Assert.Equal(0, classState.HeldSeats);
        Assert.Equal(1, classState.AvailableSeats);
    }

    [Fact]
    public async Task Cancel_IsOwnershipProtectedAndIdempotent()
    {
        var owner = Student(301);
        var otherStudent = Student(302);
        await using var factory = await CreateFactory();
        using var client = factory.CreateClient();
        var admissionClass = await CreateClass(client, "Cancellation Class", 1);
        var hold = await CreateHold(client, admissionClass.Id, owner);

        using var wrongOwner = await SendStudentRequest(
            client,
            HttpMethod.Delete,
            $"/holds/{hold.HoldId}",
            otherStudent);
        Assert.Equal(HttpStatusCode.NotFound, wrongOwner.StatusCode);

        using var cancellation = await SendStudentRequest(
            client,
            HttpMethod.Delete,
            $"/holds/{hold.HoldId}",
            owner);
        Assert.Equal(HttpStatusCode.NoContent, cancellation.StatusCode);

        using var repeatedCancellation = await SendStudentRequest(
            client,
            HttpMethod.Delete,
            $"/holds/{hold.HoldId}",
            owner);
        Assert.Equal(HttpStatusCode.NoContent, repeatedCancellation.StatusCode);

        var holdState = await client.GetFromJsonAsync<HoldResponse>(
            $"/holds/{hold.HoldId}");
        Assert.NotNull(holdState);
        Assert.Equal("CANCELLED", holdState.Status);

        var classState = await client.GetFromJsonAsync<ClassResponse>(
            $"/classes/{admissionClass.Id}");
        Assert.NotNull(classState);
        Assert.Equal(0, classState.HeldSeats);
        Assert.Equal(1, classState.AvailableSeats);
    }

    [Fact]
    public async Task GetMyHolds_ReturnsOnlyStudentsApplicationsAndRefreshesExpiry()
    {
        var owner = Student(401);
        var otherStudent = Student(402);
        var timeProvider = NewTimeProvider();
        await using var factory = await CreateFactory(timeProvider);
        using var client = factory.CreateClient();
        var confirmedClass = await CreateClass(client, "Confirmed Class", 2);
        var expiringClass = await CreateClass(client, "Expiring Class", 2);
        var confirmedHold = await CreateHold(client, confirmedClass.Id, owner);
        var expiringHold = await CreateHold(client, expiringClass.Id, owner);
        await CreateHold(client, confirmedClass.Id, otherStudent);

        using var confirmation = await SendStudentRequest(
            client,
            HttpMethod.Post,
            $"/holds/{confirmedHold.HoldId}/confirm",
            owner);
        Assert.Equal(HttpStatusCode.OK, confirmation.StatusCode);

        timeProvider.Advance(TimeSpan.FromSeconds(601));

        using var response = await SendStudentRequest(
            client,
            HttpMethod.Get,
            "/me/holds",
            owner);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var applications = await response.Content
            .ReadFromJsonAsync<List<MyHoldResponse>>();
        Assert.NotNull(applications);
        Assert.Equal(2, applications.Count);

        var confirmedApplication = Assert.Single(
            applications,
            application => application.HoldId == confirmedHold.HoldId);
        Assert.Equal(confirmedClass.Name, confirmedApplication.ClassName);
        Assert.Equal("CONFIRMED", confirmedApplication.Status);

        var expiredApplication = Assert.Single(
            applications,
            application => application.HoldId == expiringHold.HoldId);
        Assert.Equal(expiringClass.Name, expiredApplication.ClassName);
        Assert.Equal("EXPIRED", expiredApplication.Status);
    }

    [Theory]
    [InlineData("GET", "/me/holds")]
    [InlineData("POST", "/holds/00000000-0000-0000-0000-000000000001/confirm")]
    [InlineData("DELETE", "/holds/00000000-0000-0000-0000-000000000001")]
    public async Task StudentEndpoints_WithMissingIdentity_ReturnBadRequest(
        string method,
        string path)
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(new HttpMethod(method), path);

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<PostgreSqlApplicationFactory> CreateFactory(
        TimeProvider? timeProvider = null)
    {
        var factory = new PostgreSqlApplicationFactory(
            database.ConnectionString,
            timeProvider);
        factory.CreateClient().Dispose();
        await factory.InitializeDatabaseAsync();
        return factory;
    }

    private static async Task<CreateClassResponse> CreateClass(
        HttpClient client,
        string name,
        int totalSeats)
    {
        using var response = await client.PostAsJsonAsync(
            "/classes",
            new CreateClassRequest
            {
                Name = $"{name} {Guid.NewGuid()}",
                TotalSeats = totalSeats
            });

        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreateClassResponse>())!;
    }

    private static async Task<CreateHoldResponse> CreateHold(
        HttpClient client,
        Guid classId,
        string studentId)
    {
        using var response = await SendStudentRequest(
            client,
            HttpMethod.Post,
            $"/classes/{classId}/holds",
            studentId);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreateHoldResponse>())!;
    }

    private static Task<HttpResponseMessage> SendStudentRequest(
        HttpClient client,
        HttpMethod method,
        string path,
        string studentId)
    {
        var request = new HttpRequestMessage(method, path);
        request.Headers.Add(StudentIdentity.HeaderName, studentId);
        return SendAndDisposeRequest(client, request);
    }

    private static async Task<HttpResponseMessage> SendAndDisposeRequest(
        HttpClient client,
        HttpRequestMessage request)
    {
        using (request)
        {
            return await client.SendAsync(request);
        }
    }

    private static ManualTimeProvider NewTimeProvider()
    {
        return new ManualTimeProvider(
            new DateTimeOffset(2026, 11, 9, 0, 0, 0, TimeSpan.Zero));
    }

    private static string Student(int suffix)
    {
        return $"20152691234{suffix:D6}";
    }
}
