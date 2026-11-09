namespace SchoolAdmission.Api.Features.Holds;

public sealed record HoldOptions(TimeSpan Duration)
{
    public const int DefaultDurationSeconds = 600;
}
