using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SchoolAdmission.Api.Data;

public sealed class AdmissionDbContextFactory : IDesignTimeDbContextFactory<AdmissionDbContext>
{
    private const string LocalConnectionString =
        "Host=localhost;Port=5432;Database=school_admission;Username=postgres;Password=postgres";

    public AdmissionDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable(
            "ConnectionStrings__DefaultConnection") ?? LocalConnectionString;

        var options = new DbContextOptionsBuilder<AdmissionDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AdmissionDbContext(options);
    }
}
