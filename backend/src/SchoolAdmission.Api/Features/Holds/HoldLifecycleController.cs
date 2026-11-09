using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Domain;

namespace SchoolAdmission.Api.Features.Holds;

[ApiController]
[Route("holds")]
public sealed class HoldLifecycleController(
    AdmissionDbContext dbContext,
    TimeProvider timeProvider) : ControllerBase
{
    [HttpGet("{holdId:guid}")]
    [ProducesResponseType<HoldResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<HoldResponse>> GetById(
        Guid holdId,
        CancellationToken cancellationToken)
    {
        await HoldState.ExpireForHoldAsync(
            dbContext,
            holdId,
            timeProvider.GetUtcNow(),
            cancellationToken);

        var hold = await dbContext.Holds
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == holdId, cancellationToken);

        return hold is null
            ? NotFound()
            : Ok(ToResponse(hold));
    }

    [HttpPost("{holdId:guid}/confirm")]
    [ProducesResponseType<ConfirmHoldResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ConfirmHoldResponse>> Confirm(
        Guid holdId,
        CancellationToken cancellationToken)
    {
        if (!StudentIdentity.TryRead(Request, out var studentId))
        {
            return InvalidStudentIdentity();
        }

        var now = timeProvider.GetUtcNow();

        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted,
            cancellationToken);

        var hold = await LockHoldAsync(holdId, cancellationToken);
        if (hold is null || hold.StudentId != studentId)
        {
            return NotFound();
        }

        if (hold.Status == HoldStatus.Confirmed)
        {
            await transaction.CommitAsync(cancellationToken);
            return Ok(new ConfirmHoldResponse(hold.Id, "CONFIRMED"));
        }

        if (hold.Status == HoldStatus.Held && hold.ExpiresAt <= now)
        {
            hold.Status = HoldStatus.Expired;
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return ConflictProblem(
                "Hold expired",
                "This hold expired before the admission fee was confirmed.");
        }

        if (hold.Status != HoldStatus.Held)
        {
            return ConflictProblem(
                "Hold cannot be confirmed",
                $"A {HoldState.ToApiValue(hold.Status)} hold cannot be confirmed.");
        }

        hold.Status = HoldStatus.Confirmed;
        hold.ConfirmedAt = now;
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Ok(new ConfirmHoldResponse(hold.Id, "CONFIRMED"));
    }

    [HttpDelete("{holdId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(
        Guid holdId,
        CancellationToken cancellationToken)
    {
        if (!StudentIdentity.TryRead(Request, out var studentId))
        {
            return InvalidStudentIdentity();
        }

        var now = timeProvider.GetUtcNow();

        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted,
            cancellationToken);

        var hold = await LockHoldAsync(holdId, cancellationToken);
        if (hold is null || hold.StudentId != studentId)
        {
            return NotFound();
        }

        if (hold.Status == HoldStatus.Held && hold.ExpiresAt <= now)
        {
            hold.Status = HoldStatus.Expired;
        }
        else if (hold.Status is HoldStatus.Held or HoldStatus.Confirmed)
        {
            hold.Status = HoldStatus.Cancelled;
            hold.CancelledAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return NoContent();
    }

    private Task<AdmissionHold?> LockHoldAsync(
        Guid holdId,
        CancellationToken cancellationToken)
    {
        return dbContext.Holds
            .FromSqlInterpolated($"SELECT * FROM holds WHERE id = {holdId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);
    }

    private static HoldResponse ToResponse(AdmissionHold hold)
    {
        return new HoldResponse(
            hold.Id,
            hold.ClassId,
            HoldState.ToApiValue(hold.Status),
            hold.ExpiresAt);
    }

    private ObjectResult InvalidStudentIdentity()
    {
        return Problem(
            statusCode: StatusCodes.Status400BadRequest,
            title: "Invalid student identity",
            detail: $"The {StudentIdentity.HeaderName} header must contain exactly 17 digits.");
    }

    private ObjectResult ConflictProblem(string title, string detail)
    {
        return Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: title,
            detail: detail);
    }
}
