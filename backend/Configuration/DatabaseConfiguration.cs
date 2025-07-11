using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using backend.Data;

namespace backend.Configuration;

/// <summary>
/// Database configuration with Azure SQL and Key Vault integration
/// Follows Azure security best practices with managed identity
/// </summary>
public static class DatabaseConfiguration
{
    /// <summary>
    /// Configures Entity Framework with Azure SQL Database
    /// Uses managed identity for secure authentication
    /// </summary>
    public static void ConfigureDatabase(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        var connectionString = GetConnectionString(configuration, environment);

        services.AddDbContext<AccountingDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                // Configure SQL Server specific options
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);

                // Configure command timeout
                sqlOptions.CommandTimeout(120);

                // Enable migrations assembly
                sqlOptions.MigrationsAssembly("backend");
            });

            // Configure EF Core options
            if (environment.IsDevelopment())
            {
                options.EnableSensitiveDataLogging();
                options.EnableDetailedErrors();
            }

            // Configure logging
            options.LogTo(Console.WriteLine, LogLevel.Information);
        });

        // Add health checks for database connectivity
        services.AddHealthChecks()
            .AddDbContextCheck<AccountingDbContext>("database", tags: new[] { "ready" });
    }

    /// <summary>
    /// Gets the database connection string from configuration or Azure Key Vault
    /// Supports both development and production scenarios
    /// </summary>
    private static string GetConnectionString(IConfiguration configuration, IWebHostEnvironment environment)
    {
        if (environment.IsDevelopment())
        {
            // Use local connection string for development
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            if (!string.IsNullOrEmpty(connectionString))
            {
                return connectionString;
            }
        }

        // For production, get connection string from Azure Key Vault
        try
        {
            var keyVaultUrl = configuration["KeyVault:Url"];
            if (!string.IsNullOrEmpty(keyVaultUrl))
            {
                var credential = new DefaultAzureCredential();
                var client = new SecretClient(new Uri(keyVaultUrl), credential);
                
                var secret = client.GetSecret("DatabaseConnectionString");
                return secret.Value.Value;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to retrieve connection string from Key Vault: {ex.Message}");
        }

        // Fallback to environment variable
        var envConnectionString = Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING");
        if (!string.IsNullOrEmpty(envConnectionString))
        {
            return envConnectionString;
        }

        throw new InvalidOperationException(
            "Database connection string not found. Configure 'ConnectionStrings:DefaultConnection' " +
            "in appsettings.json for development or 'KeyVault:Url' for production.");
    }

    /// <summary>
    /// Initializes the database and applies migrations
    /// Seeds initial data if needed
    /// </summary>
    public static async Task InitializeDatabaseAsync(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AccountingDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AccountingDbContext>>();

        try
        {
            // Apply migrations
            logger.LogInformation("Applying database migrations...");
            await context.Database.MigrateAsync();

            // Seed initial data
            logger.LogInformation("Seeding initial data...");
            await DataSeeder.SeedAsync(context);

            logger.LogInformation("Database initialization completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing the database.");
            throw;
        }
    }
}

/// <summary>
/// Multi-tenant database context factory for design-time operations
/// Used by EF Core tools for migrations
/// </summary>
public class AccountingDbContextFactory : IDesignTimeDbContextFactory<AccountingDbContext>
{
    public AccountingDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<AccountingDbContext>();
        
        // Use connection string from configuration
        var connectionString = configuration.GetConnectionString("DefaultConnection") ??
            throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        optionsBuilder.UseSqlServer(connectionString, options =>
        {
            options.MigrationsAssembly("backend");
        });

        return new AccountingDbContext(optionsBuilder.Options);
    }
}
