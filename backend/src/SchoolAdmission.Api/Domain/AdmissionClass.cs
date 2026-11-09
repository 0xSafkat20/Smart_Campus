namespace SchoolAdmission.Api.Domain;

public sealed class AdmissionClass
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int TotalSeats { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<AdmissionHold> Holds { get; set; } = [];
}
