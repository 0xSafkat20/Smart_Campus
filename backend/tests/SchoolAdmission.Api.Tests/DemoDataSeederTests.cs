using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Domain;

namespace SchoolAdmission.Api.Tests;

public sealed class DemoDataSeederTests(PostgreSqlFixture database) : IClassFixture<PostgreSqlFixture>
{
    [Fact]
    public async Task Seed_UsesExampleCounts_AndDoesNotResetExpiredHolds()
    {
        var clock = new ManualTimeProvider(DateTimeOffset.UtcNow);
        await using var factory = new PostgreSqlApplicationFactory(database.ConnectionString, clock);
        factory.CreateClient().Dispose();
        await factory.InitializeDatabaseAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
        await DemoDataSeeder.SeedAsync(db, clock, TimeSpan.FromSeconds(600));
        db.ChangeTracker.Clear();
        var id = Guid.Parse("10000000-0000-0000-0000-000000000001");
        var sample = await db.Classes.Include(c => c.Holds).SingleAsync(c => c.Id == id);
        Assert.Equal(120, sample.TotalSeats);
        Assert.Equal(95, sample.Holds.Count);
        var expiry = sample.Holds.First().ExpiresAt;
        var held = sample.Holds.Count(h => h.Status == HoldStatus.Held);
        var confirmed = sample.Holds.Count(h => h.Status == HoldStatus.Confirmed);
        Assert.Equal(15, held);
        Assert.Equal(80, confirmed);
        Assert.Equal(25, sample.TotalSeats - held - confirmed);

        clock.Advance(TimeSpan.FromSeconds(601));
        await DemoDataSeeder.SeedAsync(db, clock, TimeSpan.FromSeconds(600));
        db.ChangeTracker.Clear();
        sample = await db.Classes.Include(c => c.Holds).SingleAsync(c => c.Id == id);
        Assert.Equal(95, sample.Holds.Count);
        Assert.All(sample.Holds, h => Assert.Equal(expiry, h.ExpiresAt));
        Assert.DoesNotContain(sample.Holds, h =>
            h.Status == HoldStatus.Held && h.ExpiresAt > clock.GetUtcNow());
    }
}
