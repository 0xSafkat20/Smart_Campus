using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Domain;
using SchoolAdmission.Api.Features.Classes;

namespace SchoolAdmission.Api.Tests;

public sealed class ClassesApiTests
{
    [Theory]
    [InlineData("null")]
    [InlineData("{}")]
    [InlineData("{\"name\":null,\"totalSeats\":1}")]
    [InlineData("{\"name\":\"Class\",\"totalSeats\":-1}")]
    [InlineData("{\"name\":\"Class\",\"totalSeats\":1.5}")]
    [InlineData("{\"name\":\"Class\",\"totalSeats\":2147483648}")]
    [InlineData("{invalid")]
    public async Task CreateClass_WithMalformedInput_ReturnsBadRequest(string json)
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();
        using var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        using var response = await client.PostAsync("/classes", content);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateClass_WithValidPayload_ReturnsRequiredContract()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/classes",
            new CreateClassRequest
            {
                Name = "  Class 6 - Morning Shift  ",
                TotalSeats = 120
            });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var body = await response.Content.ReadFromJsonAsync<CreateClassResponse>();
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.Id);
        Assert.Equal("Class 6 - Morning Shift", body.Name);
        Assert.Equal(120, body.TotalSeats);
    }

    [Theory]
    [InlineData("   ", 10)]
    [InlineData("Class 8 - Morning Shift", 0)]
    public async Task CreateClass_WithInvalidPayload_ReturnsBadRequest(
        string name,
        int totalSeats)
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/classes",
            new CreateClassRequest
            {
                Name = name,
                TotalSeats = totalSeats
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetClasses_ReturnsRequiredSeatCounts()
    {
        await using var factory = new TestApplicationFactory();
        var admissionClass = await SeedClassWithHolds(factory.Services);
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/classes");

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<List<ClassResponse>>();
        var item = Assert.Single(Assert.IsType<List<ClassResponse>>(body));
        Assert.Equal(admissionClass.Id, item.Id);
        Assert.Equal(admissionClass.Name, item.Name);
        Assert.Equal(10, item.TotalSeats);
        Assert.Equal(1, item.HeldSeats);
        Assert.Equal(1, item.ConfirmedSeats);
        Assert.Equal(8, item.AvailableSeats);
    }

    [Fact]
    public async Task GetClass_WhenIdExists_ReturnsRequiredSeatCounts()
    {
        await using var factory = new TestApplicationFactory();
        var admissionClass = await SeedClassWithHolds(factory.Services);
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/classes/{admissionClass.Id}");

        response.EnsureSuccessStatusCode();
        var item = await response.Content.ReadFromJsonAsync<ClassResponse>();
        Assert.NotNull(item);
        Assert.Equal(admissionClass.Id, item.Id);
        Assert.Equal(10, item.TotalSeats);
        Assert.Equal(1, item.HeldSeats);
        Assert.Equal(1, item.ConfirmedSeats);
        Assert.Equal(8, item.AvailableSeats);
    }

    [Fact]
    public async Task GetClass_WhenIdDoesNotExist_ReturnsNotFound()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/classes/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static async Task<AdmissionClass> SeedClassWithHolds(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
        var now = DateTimeOffset.UtcNow;
        var admissionClass = new AdmissionClass
        {
            Id = Guid.NewGuid(),
            Name = "Class 7 - Day Shift",
            TotalSeats = 10,
            CreatedAt = now.AddHours(-2)
        };

        dbContext.Classes.Add(admissionClass);
        dbContext.Holds.AddRange(
            CreateHold(admissionClass, "20152691234567890", HoldStatus.Held, now.AddMinutes(5)),
            CreateHold(admissionClass, "20152691234567891", HoldStatus.Held, now.AddMinutes(-5)),
            CreateHold(admissionClass, "20152691234567892", HoldStatus.Confirmed, now.AddMinutes(-5)),
            CreateHold(admissionClass, "20152691234567893", HoldStatus.Cancelled, now.AddMinutes(5)));

        await dbContext.SaveChangesAsync();
        return admissionClass;
    }

    private static AdmissionHold CreateHold(
        AdmissionClass admissionClass,
        string studentId,
        HoldStatus status,
        DateTimeOffset expiresAt)
    {
        return new AdmissionHold
        {
            Id = Guid.NewGuid(),
            ClassId = admissionClass.Id,
            Class = admissionClass,
            StudentId = studentId,
            Status = status,
            CreatedAt = expiresAt.AddMinutes(-10),
            ExpiresAt = expiresAt
        };
    }
}
