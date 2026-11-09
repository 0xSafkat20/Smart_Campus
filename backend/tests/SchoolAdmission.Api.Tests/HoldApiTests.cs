using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Api.Features.Classes;
using SchoolAdmission.Api.Features.Holds;

namespace SchoolAdmission.Api.Tests;

public sealed class HoldApiTests(PostgreSqlFixture database)
    : IClassFixture<PostgreSqlFixture>
{
    [Fact]
    public async Task CreateHold_WithValidStudent_ReturnsRequiredContract()
    {
        await using var factory = await CreateFactory();
        using var client = factory.CreateClient();
        var admissionClass = await CreateClass(client, totalSeats: 2);
        var before = DateTimeOffset.UtcNow;

        using var response = await SendHoldRequest(
            client,
            admissionClass.Id,
            "20152691234567890");

        var after = DateTimeOffset.UtcNow;
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<CreateHoldResponse>();
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.HoldId);
        Assert.Equal(admissionClass.Id, body.ClassId);
        Assert.Equal("20152691234567890", body.StudentId);
        Assert.Equal("HELD", body.Status);
        Assert.InRange(
            body.ExpiresAt,
            before.AddSeconds(590),
            after.AddSeconds(610));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("123")]
    [InlineData("2015269123456789A")]
    public async Task CreateHold_WithInvalidStudentHeader_ReturnsBadRequest(string? studentId)
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/classes/{Guid.NewGuid()}/holds");

        if (studentId is not null)
        {
            request.Headers.TryAddWithoutValidation(StudentIdentity.HeaderName, studentId);
        }

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateHold_WhenClassDoesNotExist_ReturnsNotFound()
    {
        await using var factory = await CreateFactory();
        using var client = factory.CreateClient();

        using var response = await SendHoldRequest(
            client,
            Guid.NewGuid(),
            "20152691234567890");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ConcurrentHoldRequests_NeverExceedClassCapacity()
    {
        await using var factory = await CreateFactory();
        using var client = factory.CreateClient();
        var admissionClass = await CreateClass(client, totalSeats: 3);

        var requests = Enumerable.Range(0, 20)
            .Select(index => SendHoldRequest(
                client,
                admissionClass.Id,
                $"2015269123456{index:D4}"))
            .ToArray();

        var responses = await Task.WhenAll(requests);

        try
        {
            Assert.Equal(3, responses.Count(response =>
                response.StatusCode == HttpStatusCode.Created));
            Assert.Equal(17, responses.Count(response =>
                response.StatusCode == HttpStatusCode.Conflict));

            var classResponse = await client.GetFromJsonAsync<ClassResponse>(
                $"/classes/{admissionClass.Id}");
            Assert.NotNull(classResponse);
            Assert.Equal(3, classResponse.HeldSeats);
            Assert.Equal(0, classResponse.ConfirmedSeats);
            Assert.Equal(0, classResponse.AvailableSeats);
        }
        finally
        {
            foreach (var response in responses)
            {
                response.Dispose();
            }
        }
    }

    [Fact]
    public async Task ConcurrentRequests_ForSameStudent_CreateOnlyOneHold()
    {
        await using var factory = await CreateFactory();
        using var client = factory.CreateClient();
        var admissionClass = await CreateClass(client, totalSeats: 2);

        var requests = Enumerable.Range(0, 2)
            .Select(_ => SendHoldRequest(
                client,
                admissionClass.Id,
                "20152691234567890"))
            .ToArray();

        var responses = await Task.WhenAll(requests);

        try
        {
            Assert.Single(responses, response =>
                response.StatusCode == HttpStatusCode.Created);
            Assert.Single(responses, response =>
                response.StatusCode == HttpStatusCode.Conflict);
        }
        finally
        {
            foreach (var response in responses)
            {
                response.Dispose();
            }
        }
    }

    [Fact]
    public async Task ExpiredHold_StopsConsumingSeat_WithoutExpiryEndpoint()
    {
        var timeProvider = new ManualTimeProvider(
            new DateTimeOffset(2026, 11, 9, 0, 0, 0, TimeSpan.Zero));
        await using var factory = await CreateFactory(timeProvider);
        using var client = factory.CreateClient();
        var admissionClass = await CreateClass(client, totalSeats: 1);

        using var firstHold = await SendHoldRequest(
            client,
            admissionClass.Id,
            "20152691234567890");
        Assert.Equal(HttpStatusCode.Created, firstHold.StatusCode);

        timeProvider.Advance(TimeSpan.FromSeconds(601));

        var classAfterExpiry = await client.GetFromJsonAsync<ClassResponse>(
            $"/classes/{admissionClass.Id}");
        Assert.NotNull(classAfterExpiry);
        Assert.Equal(0, classAfterExpiry.HeldSeats);
        Assert.Equal(1, classAfterExpiry.AvailableSeats);

        using var replacementHold = await SendHoldRequest(
            client,
            admissionClass.Id,
            "20152691234567891");
        Assert.Equal(HttpStatusCode.Created, replacementHold.StatusCode);
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
        int totalSeats)
    {
        using var response = await client.PostAsJsonAsync(
            "/classes",
            new CreateClassRequest
            {
                Name = $"Concurrency Test {Guid.NewGuid()}",
                TotalSeats = totalSeats
            });

        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreateClassResponse>())!;
    }

    private static async Task<HttpResponseMessage> SendHoldRequest(
        HttpClient client,
        Guid classId,
        string studentId)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/classes/{classId}/holds");
        request.Headers.Add(StudentIdentity.HeaderName, studentId);
        return await client.SendAsync(request);
    }

}
