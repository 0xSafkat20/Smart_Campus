using Testcontainers.PostgreSql;

namespace SchoolAdmission.Api.Tests;

public sealed class PostgreSqlFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17-alpine")
        .WithDatabase("school_admission_tests")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public Task InitializeAsync()
    {
        return _container.StartAsync();
    }

    public Task DisposeAsync()
    {
        return _container.DisposeAsync().AsTask();
    }
}
