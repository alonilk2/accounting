using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using backend.Services.Interfaces;
using backend.Services.Core;
using backend.Services.Sales;
using backend.Services.Purchasing;
using backend.Services.Inventory;
using backend.Services.Accounting;

namespace backend.Services;

/// <summary>
/// Service registration extensions for dependency injection
/// Configures all business services with appropriate lifetimes
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add all application services to the dependency injection container (legacy)
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Application configuration</param>
    /// <returns>Service collection for chaining</returns>
    public static IServiceCollection AddLegacyApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Core services - Scoped lifetime for per-request isolation
        services.AddScoped<ICompanyService, CompanyService>();
        
        // Accounting services
        services.AddScoped<IChartOfAccountsService, ChartOfAccountsService>();
        services.AddScoped<IJournalEntryService, JournalEntryService>();
        
        // Sales services
        services.AddScoped<ISalesOrderService, SalesOrderService>();
        
        // Purchasing services
        services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
        
        // Inventory services
        services.AddScoped<IInventoryService, InventoryService>();
        
        // Add additional services as they are implemented
        // services.AddScoped<ICustomerService, CustomerService>();
        // services.AddScoped<ISupplierService, SupplierService>();
        // services.AddScoped<IReportingService, ReportingService>();
        // services.AddScoped<IComplianceService, ComplianceService>();
        // services.AddScoped<IAIService, AIService>();

        return services;
    }
}
