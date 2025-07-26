using backend.Services.Interfaces;
using backend.Services.Core;
using backend.Services.Sales;
using backend.Services.Purchasing;
using backend.Services.Suppliers;
using backend.Services.Inventory;
using backend.Services.Accounting;
using backend.Services.Printing;
using backend.Services.AI;
using backend.Services.Reports;
using Azure.Identity;

namespace backend.Services;

/// <summary>
/// Service registration extensions for dependency injection
/// Registers all business logic services with appropriate lifetimes
/// </summary>
public static class ServiceRegistration
{
    /// <summary>
    /// Register all business services in the DI container
    /// Organized by functional areas for better maintainability
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Application configuration</param>
    /// <returns>Service collection for chaining</returns>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Core business services
        services.AddCoreServices();
        
        // Sales and customer management
        services.AddSalesServices();
        
        // Purchasing and supplier management  
        services.AddPurchasingServices();
        
        // Inventory management
        services.AddInventoryServices();
        
        // Accounting and financial services
        services.AddAccountingServices();
        
        // AI and document processing services
        services.AddAIServices();
        
        // Printing and reporting services
        services.AddPrintingServices();
        
        // Azure services
        services.AddAzureServices(configuration);

        return services;
    }

    /// <summary>
    /// Register core business services
    /// </summary>
    private static IServiceCollection AddCoreServices(this IServiceCollection services)
    {
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<ICustomerService, backend.Services.Core.CustomerService>();
        services.AddScoped<ISupplierService, backend.Services.Suppliers.SupplierService>();
        
        return services;
    }

    /// <summary>
    /// Register sales and customer management services
    /// </summary>
    private static IServiceCollection AddSalesServices(this IServiceCollection services)
    {
        services.AddScoped<ISalesOrderService, SalesOrderService>();
        services.AddScoped<ICustomerDocumentService, CustomerDocumentService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<IQuoteService, QuoteService>();
        services.AddScoped<ITaxInvoiceReceiptService, TaxInvoiceReceiptService>();
        
        return services;
    }

    /// <summary>
    /// Register purchasing services
    /// </summary>
    private static IServiceCollection AddPurchasingServices(this IServiceCollection services)
    {
        services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
        
        return services;
    }

    /// <summary>
    /// Register inventory management services
    /// </summary>
    private static IServiceCollection AddInventoryServices(this IServiceCollection services)
    {
        services.AddScoped<IInventoryService, InventoryService>();
        
        return services;
    }

    /// <summary>
    /// Register accounting and financial services
    /// </summary>
    private static IServiceCollection AddAccountingServices(this IServiceCollection services)
    {
        services.AddScoped<IChartOfAccountsService, ChartOfAccountsService>();
        services.AddScoped<IJournalEntryService, JournalEntryService>();
        services.AddScoped<IExpenseService, ExpenseService>();
        
        return services;
    }

    /// <summary>
    /// Register AI and document processing services
    /// </summary>
    private static IServiceCollection AddAIServices(this IServiceCollection services)
    {
        services.AddScoped<IAIAssistantService, AIAssistantService>();
        services.AddScoped<IOpenAIService, OpenAIService>();
        services.AddScoped<IDocumentScanService, DocumentScanService>();
        services.AddScoped<ICustomerFunctionService, CustomerFunctionService>();
        services.AddScoped<IInvoiceFunctionService, InvoiceFunctionService>();
        
        // Azure Identity and Key Vault
        services.AddScoped<DefaultAzureCredential>();
        
        return services;
    }

    /// <summary>
    /// Register printing and reporting services
    /// </summary>
    private static IServiceCollection AddPrintingServices(this IServiceCollection services)
    {
        services.AddScoped<IPrintService, PrintService>();
        services.AddScoped<ICustomerStatementService, CustomerStatementService>();
        
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
