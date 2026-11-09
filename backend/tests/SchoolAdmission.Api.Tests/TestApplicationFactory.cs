using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SchoolAdmission.Api.Data;

namespace SchoolAdmission.Api.Tests;

public sealed class TestApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"school-admission-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AdmissionDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AdmissionDbContext>>();
            services.RemoveAll<AdmissionDbContext>();
            services.AddDbContext<AdmissionDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));
        });
    }
}
