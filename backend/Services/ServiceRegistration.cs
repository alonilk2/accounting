using backend.Services.Interfaces;
using backend.Services.Core;
using backend.Services.Sales;
using backend.Services.Purchasing;
using backend.Services.Inventory;
using backend.Services.Accounting;

namespace backend.Services;

/// <summary>
/// Service registration extensions for dependency injection
/// Registers all business logic services with appropriate lifetimes
/// </summary>
public static class ServiceRegistration
{
    /// <summary>
    /// Register all business services in the DI container
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Application configuration</param>
    /// <returns>Service collection for chaining</returns>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Core services
        services.AddScoped<ICompanyService, CompanyService>();
        
        // Sales services
        services.AddScoped<ISalesOrderService, SalesOrderService>();
        
        // Purchasing services
        services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
        
        // Inventory services
        services.AddScoped<IInventoryService, InventoryService>();
        
        // Accounting services
        services.AddScoped<IChartOfAccountsService, ChartOfAccountsService>();
        services.AddScoped<IJournalEntryService, JournalEntryService>();
        
        return services;
    }

    /// <summary>
    /// Register audit and monitoring services
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <returns>Service collection for chaining</returns>
    public static IServiceCollection AddAuditServices(this IServiceCollection services)
    {
        // Add audit-related services here
        // Example: services.AddScoped<IAuditService, AuditService>();
        
        return services;
    }

    /// <summary>
    /// Register Azure services (AI, Storage, etc.)
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Configuration</param>
    /// <returns>Service collection for chaining</returns>
    public static IServiceCollection AddAzureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Register Azure services based on configuration
        // Example: Azure Form Recognizer, OpenAI, Storage, etc.
        
        // TODO: Add Azure AI services registration
        // services.AddSingleton<IFormRecognizerService, FormRecognizerService>();
        // services.AddSingleton<IOpenAIService, OpenAIService>();
        // services.AddSingleton<IBlobStorageService, BlobStorageService>();
        
        return services;
    }

    /// <summary>
    /// Register compliance and export services
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <returns>Service collection for chaining</returns>
    public static IServiceCollection AddComplianceServices(this IServiceCollection services)
    {
        // Add Israeli Tax Authority compliance services
        // Example: services.AddScoped<ITaxAuthorityExportService, TaxAuthorityExportService>();
        
        return services;
    }
}
