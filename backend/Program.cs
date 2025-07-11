using backend.Configuration;
using backend.Data;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

// Configure database with Azure SQL and multi-tenant support
builder.Services.ConfigureDatabase(builder.Configuration, builder.Environment);

// Register all business services
builder.Services.AddApplicationServices(builder.Configuration);

// Add health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AccountingDbContext>();

// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173") // Vite dev server
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add controllers for API endpoints
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization for enums - allow both string and integer
        var enumConverter = new System.Text.Json.Serialization.JsonStringEnumConverter(
            System.Text.Json.JsonNamingPolicy.CamelCase, allowIntegerValues: true);
        options.JsonSerializerOptions.Converters.Add(enumConverter);
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        
        // Handle circular references by ignoring them
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

// Add routing
app.UseRouting();

// Map controllers
app.MapControllers();

// Initialize database
await app.Services.InitializeDatabaseAsync();

// Health check endpoint
app.MapHealthChecks("/health");

// Sample API endpoint for testing
app.MapGet("/api/test", () => new { 
    message = "AI-First SaaS Accounting Platform API is running",
    timestamp = DateTime.UtcNow,
    version = "1.0.0",
    features = new[] { "Multi-tenant", "Double-entry accounting", "Israeli compliance", "AI-powered" }
})
.WithName("GetApiTest")
.WithTags("System");

app.Run();
