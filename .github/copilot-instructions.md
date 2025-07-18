# AI Accounting SaaS Project - Copilot Instructions

AI-First SaaS Accounting Platform for Israeli businesses with React frontend + .NET backend.

## Critical Architecture Patterns

### Multi-Tenant Security (NEVER SKIP)
All tenant entities inherit from `TenantEntity` with `CompanyId`. ALWAYS filter by company:
```csharp
// Controllers MUST pass companyId to all service methods
var customers = await _context.Customers
    .Where(c => c.CompanyId == currentCompanyId) // REQUIRED
    .ToListAsync();
```

### BaseService Pattern (Foundation)
All services inherit from `BaseService<T>` providing standardized multi-tenant CRUD:
```csharp
public abstract class BaseService<T> : IBaseService<T> where T : BaseEntity
{
    protected abstract DbSet<T> DbSet { get; }
    protected abstract string CompanyIdPropertyName { get; }
    
    // Auto-applies company filtering via EF.Property<int>(e, CompanyIdPropertyName)
    // Includes audit logging, optimistic concurrency, soft deletes
}
```

### Document Separation (July 2025 Update)
- **SalesOrder**: Quotations & order management (`Quote → Confirmed → Shipped → Completed`)
- **Invoice**: Separate billing documents (`Draft → Sent → Paid → Overdue`)  
- **Migration**: `SeparateInvoicesFromSalesOrders` - invoices no longer tied to sales order status

### AI Function Calling Pattern (Unique)
Extensible function routing for Azure OpenAI function calls with Hebrew descriptions:
```csharp
public class CustomerFunctionService : ICustomerFunctionService
{
    public List<FunctionDefinition> GetCustomerFunctions() => new()
    {
        new() { Name = "getCustomersList", Description = "קבלת רשימת לקוחות" }
    };
    
    public async Task<FunctionResult> ExecuteCustomerFunctionAsync(
        FunctionCall functionCall, int companyId, CancellationToken cancellationToken)
    {
        return functionCall.Name switch
        {
            "getCustomersList" => await GetCustomersListAsync(functionCall.Arguments, companyId, cancellationToken),
            _ => new FunctionResult { IsSuccess = false, ErrorMessage = "Unknown function" }
        };
    }
}
```

### Azure Integration
- **OpenAI**: Uses `DefaultAzureCredential` with fallback to API key for local dev
- **Database**: Azure SQL with retry logic, managed identity auth
- **Configuration**: Azure Key Vault integration via `DatabaseConfiguration.cs`

## Development Commands
```bash
# Backend (HTTPS required)
cd backend && dotnet run  # Port 5121
dotnet ef migrations add MigrationName && dotnet ef database update

# Frontend  
cd front && npm run dev  # Port 5173
```

## Service Registration Pattern
```csharp
// Services/ServiceRegistration.cs - register ALL services here
services.AddScoped<ISalesOrderService, SalesOrderService>();
services.AddScoped<IInvoiceService, InvoiceService>();
// AI Services with Azure Managed Identity
services.AddScoped<IAIAssistantService, AIAssistantService>();
services.AddScoped<ICustomerFunctionService, CustomerFunctionService>();
services.AddScoped<DefaultAzureCredential>();
```

## Entity Patterns
```csharp
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false; // Soft delete only
    public byte[]? RowVersion { get; set; } // Optimistic concurrency
}

public abstract class TenantEntity : BaseEntity
{
    public int CompanyId { get; set; } // Multi-tenant key
}
```

## Israeli Compliance & Localization
- **Tax ID**: Use `CompanyService.ValidateTaxIdAsync()` (Israeli check digit algorithm)
- **VAT Rate**: 17% standard Israeli VAT in service calculations
- **Currency**: Default "ILS" for all Israeli businesses, format with ₪
- **Print Templates**: Hebrew RTL support in `src/components/print/`
- **Hebrew UI**: All text uses conditional `language === 'he' ? 'עברית' : 'English'`

## Frontend Stack
- **State**: Zustand stores in `src/stores/index.ts` (AuthStore, UIStore pattern)
- **Types**: TypeScript interfaces in `src/types/entities.ts` mirror backend models exactly
- **UI**: Material-UI with Hebrew RTL theme support in `AppThemeProvider.tsx`
- **Print**: `react-to-print` for browser-based document printing
- **Routing**: React Router with navigation in `MainLayout.tsx`

## UI Conventions
- **RTL Support**: Theme auto-configures for Hebrew `direction: 'rtl'`
- **Modern Design**: Custom theme with rounded corners, elevated shadows
- **Colors**: Israeli business context (blue primary, amber secondary)
- **Typography**: Hebrew fonts (`Noto Sans Hebrew`) with English fallbacks

## API Conventions
- RESTful: `/api/[controller]/[action]`
- DTOs for data transfer (never expose entities directly)
- Multi-tenant: `companyId` parameter on ALL tenant operations
- Document endpoints: `/api/sales`, `/api/invoices`, `/api/invoices/from-sales-order/{id}`
