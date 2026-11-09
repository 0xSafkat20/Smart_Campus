using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;

namespace SchoolAdmission.Api.Features.Holds;

[ApiController]
[Route("me/holds")]
public sealed class MyHoldsController(
    AdmissionDbContext dbContext,
    TimeProvider timeProvider) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<MyHoldResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<MyHoldResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        if (!StudentIdentity.TryRead(Request, out var studentId))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid student identity",
                detail: $"The {StudentIdentity.HeaderName} header must contain exactly 17 digits.");
        }

        await HoldState.ExpireForStudentAsync(
            dbContext,
            studentId,
            timeProvider.GetUtcNow(),
            cancellationToken);

        var holds = await dbContext.Holds
            .AsNoTracking()
            .Where(hold => hold.StudentId == studentId)
            .OrderByDescending(hold => hold.CreatedAt)
            .Select(hold => new MyHoldResponse(
                hold.Id,
                hold.ClassId,
                hold.Class.Name,
                HoldState.ToApiValue(hold.Status),
                hold.ExpiresAt))
            .ToListAsync(cancellationToken);

        return Ok(holds);
    }
}
