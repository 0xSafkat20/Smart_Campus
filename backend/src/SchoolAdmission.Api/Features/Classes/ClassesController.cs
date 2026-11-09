using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Domain;

namespace SchoolAdmission.Api.Features.Classes;

[ApiController]
[Route("classes")]
public sealed class ClassesController(
    AdmissionDbContext dbContext,
    TimeProvider timeProvider) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<CreateClassResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CreateClassResponse>> Create(
        [FromBody] CreateClassRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            ModelState.AddModelError(nameof(request.Name), "Class name is required.");
            return ValidationProblem(ModelState);
        }

        var admissionClass = new AdmissionClass
        {
            Id = Guid.NewGuid(),
            Name = name,
            TotalSeats = request.TotalSeats,
            CreatedAt = timeProvider.GetUtcNow()
        };

        dbContext.Classes.Add(admissionClass);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new CreateClassResponse(
            admissionClass.Id,
            admissionClass.Name,
            admissionClass.TotalSeats);

        return CreatedAtAction(
            nameof(GetById),
            new { classId = admissionClass.Id },
            response);
    }

    [HttpGet]
    [ProducesResponseType<IReadOnlyList<ClassResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ClassResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        var classes = await QueryClasses().ToListAsync(cancellationToken);

        return Ok(classes.Select(ToResponse).ToList());
    }

    [HttpGet("{classId:guid}")]
    [ProducesResponseType<ClassResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClassResponse>> GetById(
        Guid classId,
        CancellationToken cancellationToken)
    {
        var admissionClass = await QueryClasses(classId)
            .SingleOrDefaultAsync(cancellationToken);

        return admissionClass is null
            ? NotFound()
            : Ok(ToResponse(admissionClass));
    }

    private IQueryable<ClassSeatSnapshot> QueryClasses(Guid? classId = null)
    {
        var now = timeProvider.GetUtcNow();
        var classes = dbContext.Classes.AsNoTracking();

        if (classId.HasValue)
        {
            classes = classes.Where(admissionClass => admissionClass.Id == classId.Value);
        }

        return classes
            .OrderBy(admissionClass => admissionClass.CreatedAt)
            .ThenBy(admissionClass => admissionClass.Name)
            .Select(admissionClass => new ClassSeatSnapshot(
                admissionClass.Id,
                admissionClass.Name,
                admissionClass.TotalSeats,
                admissionClass.CreatedAt,
                admissionClass.Holds.Count(hold =>
                    hold.Status == HoldStatus.Held && hold.ExpiresAt > now),
                admissionClass.Holds.Count(hold =>
                    hold.Status == HoldStatus.Confirmed)));
    }

    private static ClassResponse ToResponse(ClassSeatSnapshot admissionClass)
    {
        var availableSeats = admissionClass.TotalSeats
            - admissionClass.HeldSeats
            - admissionClass.ConfirmedSeats;

        return new ClassResponse(
            admissionClass.Id,
            admissionClass.Name,
            admissionClass.TotalSeats,
            admissionClass.HeldSeats,
            admissionClass.ConfirmedSeats,
            availableSeats);
    }

    private sealed record ClassSeatSnapshot(
        Guid Id,
        string Name,
        int TotalSeats,
        DateTimeOffset CreatedAt,
        int HeldSeats,
        int ConfirmedSeats);
}
