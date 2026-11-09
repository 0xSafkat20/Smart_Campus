namespace SchoolAdmission.Api.Features.Holds;

public sealed record CreateHoldResponse(
    Guid HoldId,
    Guid ClassId,
    string StudentId,
    string Status,
    DateTimeOffset ExpiresAt);
