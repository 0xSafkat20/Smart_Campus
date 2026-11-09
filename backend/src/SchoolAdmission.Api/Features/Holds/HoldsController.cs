using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Domain;

namespace SchoolAdmission.Api.Features.Holds;

[ApiController]
[Route("classes/{classId:guid}/holds")]
public sealed class HoldsController(
    AdmissionDbContext dbContext,
    TimeProvider timeProvider,
    HoldOptions holdOptions) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<CreateHoldResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CreateHoldResponse>> Create(
        Guid classId,
        CancellationToken cancellationToken)
    {
        if (!StudentIdentity.TryRead(Request, out var studentId))
        {
            return BadRequestProblem(
                "Invalid student identity",
                $"The {StudentIdentity.HeaderName} header must contain exactly 17 digits.");
        }

        var now = timeProvider.GetUtcNow();

        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted,
            cancellationToken);

        var admissionClass = await dbContext.Classes
            .FromSqlInterpolated(
                $"SELECT * FROM classes WHERE id = {classId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (admissionClass is null)
        {
            return NotFound();
        }

        await dbContext.Holds
            .Where(hold =>
                hold.ClassId == classId
                && hold.Status == HoldStatus.Held
                && hold.ExpiresAt <= now)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(hold => hold.Status, HoldStatus.Expired),
                cancellationToken);

        var alreadyApplied = await dbContext.Holds.AnyAsync(
            hold =>
                hold.ClassId == classId
                && hold.StudentId == studentId
                && (hold.Status == HoldStatus.Held
                    || hold.Status == HoldStatus.Confirmed),
            cancellationToken);

        if (alreadyApplied)
        {
            return ConflictProblem(
                "Application already exists",
                "This student already has an active or confirmed application for this class.");
        }

        var occupiedSeats = await dbContext.Holds.CountAsync(
            hold =>
                hold.ClassId == classId
                && (hold.Status == HoldStatus.Confirmed
                    || (hold.Status == HoldStatus.Held && hold.ExpiresAt > now)),
            cancellationToken);

        if (occupiedSeats >= admissionClass.TotalSeats)
        {
            return ConflictProblem(
                "No seats available",
                "All seats for this class are currently held or confirmed.");
        }

        var hold = new AdmissionHold
        {
            Id = Guid.NewGuid(),
            ClassId = classId,
            StudentId = studentId,
            Status = HoldStatus.Held,
            CreatedAt = now,
            ExpiresAt = now.Add(holdOptions.Duration)
        };

        dbContext.Holds.Add(hold);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return StatusCode(
            StatusCodes.Status201Created,
            new CreateHoldResponse(
                hold.Id,
                hold.ClassId,
                hold.StudentId,
                HoldState.ToApiValue(hold.Status),
                hold.ExpiresAt));
    }

    private ObjectResult BadRequestProblem(string title, string detail)
    {
        return Problem(
            statusCode: StatusCodes.Status400BadRequest,
            title: title,
            detail: detail);
    }

    private ObjectResult ConflictProblem(string title, string detail)
    {
        return Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: title,
            detail: detail);
    }
}
