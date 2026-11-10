using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Domain;

namespace SchoolAdmission.Api.Data;

public static class DemoDataSeeder
{
    public static async Task SeedAsync(AdmissionDbContext db, TimeProvider clock, TimeSpan duration)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();
        // Serialize startup seeding across backend instances without resetting user data.
        await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(73110420)");
        var samples = new[]
        {
            (Id: Guid.Parse("10000000-0000-0000-0000-000000000001"), Name: "Class 6 - Morning Shift", Total: 120, Held: 15, Confirmed: 80),
            (Id: Guid.Parse("10000000-0000-0000-0000-000000000002"), Name: "Class 6 - Day Shift", Total: 60, Held: 2, Confirmed: 10)
        };

        foreach (var sample in samples)
        {
            if (await db.Classes.AnyAsync(c => c.Id == sample.Id || c.Name == sample.Name))
                continue;

            var now = clock.GetUtcNow();
            var admissionClass = new AdmissionClass
            {
                Id = sample.Id, Name = sample.Name, TotalSeats = sample.Total, CreatedAt = now
            };
            for (var index = 0; index < sample.Held + sample.Confirmed; index++)
            {
                var confirmed = index >= sample.Held;
                admissionClass.Holds.Add(new AdmissionHold
                {
                    Id = Guid.NewGuid(), ClassId = sample.Id,
                    // Synthetic demonstration identities, not real student records.
                    StudentId = $"9000000000000{index:D4}",
                    Status = confirmed ? HoldStatus.Confirmed : HoldStatus.Held,
                    CreatedAt = now, ExpiresAt = now.Add(duration),
                    ConfirmedAt = confirmed ? now : null
                });
            }
            db.Classes.Add(admissionClass);
        }
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
    }
}
