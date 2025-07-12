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

### Document Separation (July 2025 Update)
- **SalesOrder**: Quotations & order management (`Quote → Confirmed → Shipped → Completed`)
- **Invoice**: Separate billing documents (`Draft → Sent → Paid → Overdue`)  
- **Migration**: `SeparateInvoicesFromSalesOrders` - invoices no longer tied to sales order status

### AI Function Calling Pattern (Unique)
Extensible function routing for OpenAI function calls:
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

## Development Commands
```bash
# Backend (HTTPS required)
cd backend && dotnet run --launch-profile https  # Port 7275
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

## Israeli Compliance
- **Tax ID**: Use `CompanyService.ValidateTaxIdAsync()` (Israeli check digit algorithm)
- **VAT Rate**: 17% standard Israeli VAT in service calculations
- **Currency**: Default "ILS" for all Israeli businesses
- **Print Templates**: Hebrew RTL support in `src/components/print/`

## Frontend Stack
- **State**: Zustand stores in `src/stores/index.ts`
- **Types**: Mirror backend models in `src/types/entities.ts`
- **UI**: Material-UI with Hebrew RTL support
- **Print**: `react-to-print` for browser-based document printing

## API Conventions
- RESTful: `/api/[controller]/[action]`
- DTOs for data transfer (never expose entities directly)
- Multi-tenant: `companyId` parameter on ALL tenant operations
- Document endpoints: `/api/sales`, `/api/invoices`, `/api/invoices/from-sales-order/{id}`
