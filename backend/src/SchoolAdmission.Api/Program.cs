using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Features.Holds;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Set the ConnectionStrings__DefaultConnection environment variable.");

var frontendOrigin = builder.Configuration["FRONTEND_ORIGIN"] ?? "http://localhost:5173";
var holdDurationSeconds = builder.Configuration.GetValue<int?>("HOLD_DURATION_SECONDS")
    ?? HoldOptions.DefaultDurationSeconds;

if (holdDurationSeconds <= 0)
{
    throw new InvalidOperationException("HOLD_DURATION_SECONDS must be greater than zero.");
}

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton(new HoldOptions(TimeSpan.FromSeconds(holdDurationSeconds)));
builder.Services.AddDbContext<AdmissionDbContext>(options =>
    options.UseNpgsql(connectionString));
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(frontendOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

if (!app.Environment.IsEnvironment("Testing"))
{
    await using var scope = app.Services.CreateAsyncScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
    await dbContext.Database.MigrateAsync();
    if (builder.Configuration.GetValue<bool>("SEED_DEMO_DATA"))
    {
        await DemoDataSeeder.SeedAsync(dbContext, TimeProvider.System,
            TimeSpan.FromSeconds(holdDurationSeconds));
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

public partial class Program;
