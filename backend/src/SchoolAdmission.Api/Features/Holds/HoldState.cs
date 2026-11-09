using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Domain;

namespace SchoolAdmission.Api.Features.Holds;

public static class HoldState
{
    public static string ToApiValue(HoldStatus status)
    {
        return status.ToString().ToUpperInvariant();
    }

    public static Task<int> ExpireForHoldAsync(
        AdmissionDbContext dbContext,
        Guid holdId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        return ExpireAsync(
            dbContext.Holds.Where(hold => hold.Id == holdId),
            now,
            cancellationToken);
    }

    public static Task<int> ExpireForStudentAsync(
        AdmissionDbContext dbContext,
        string studentId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        return ExpireAsync(
            dbContext.Holds.Where(hold => hold.StudentId == studentId),
            now,
            cancellationToken);
    }

    private static Task<int> ExpireAsync(
        IQueryable<AdmissionHold> holds,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        return holds
            .Where(hold =>
                hold.Status == HoldStatus.Held
                && hold.ExpiresAt <= now)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(hold => hold.Status, HoldStatus.Expired),
                cancellationToken);
    }
}
