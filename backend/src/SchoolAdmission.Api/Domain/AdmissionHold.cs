namespace SchoolAdmission.Api.Domain;

public sealed class AdmissionHold
{
    public Guid Id { get; set; }

    public Guid ClassId { get; set; }

    public AdmissionClass Class { get; set; } = null!;

    public string StudentId { get; set; } = string.Empty;

    public HoldStatus Status { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? ConfirmedAt { get; set; }

    public DateTimeOffset? CancelledAt { get; set; }
}
