using System.ComponentModel.DataAnnotations;

namespace SchoolAdmission.Api.Features.Classes;

public sealed class CreateClassRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; init; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int TotalSeats { get; init; }
}

public sealed record CreateClassResponse(
    Guid Id,
    string Name,
    int TotalSeats);

public sealed record ClassResponse(
    Guid Id,
    string Name,
    int TotalSeats,
    int HeldSeats,
    int ConfirmedSeats,
    int AvailableSeats);
