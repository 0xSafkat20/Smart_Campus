using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SchoolAdmission.Api.Data;

namespace SchoolAdmission.Api.Tests;

public sealed class PostgreSqlApplicationFactory(
    string connectionString,
    TimeProvider? timeProvider = null)
    : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AdmissionDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AdmissionDbContext>>();
            services.RemoveAll<AdmissionDbContext>();
            services.AddDbContext<AdmissionDbContext>(options =>
                options.UseNpgsql(connectionString));

            if (timeProvider is not null)
            {
                services.RemoveAll<TimeProvider>();
                services.AddSingleton(timeProvider);
            }
        });
    }

    public async Task InitializeDatabaseAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
        await dbContext.Database.MigrateAsync();
    }
}
