using Microsoft.EntityFrameworkCore;

namespace SchoolAdmission.Api.Data;

public sealed class AdmissionDbContext(DbContextOptions<AdmissionDbContext> options)
    : DbContext(options)
{
    // Entity sets and database constraints will be added in the next implementation step.
}
