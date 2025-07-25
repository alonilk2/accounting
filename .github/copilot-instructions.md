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

### Critical Pagination Pattern (MUST FOLLOW)

Backend returns `PaginatedResponse<T>`, frontend MUST extract `.data`:
```csharp
// Backend Controller
[HttpGet]
public async Task<ActionResult<PaginatedResponse<CustomerDto>>> GetCustomers(...)
```
```typescript
// Frontend Service - CRITICAL: Extract .data property
const paginatedResponse: PaginatedResponse<Customer> = await response.json();
return paginatedResponse.data || []; // Prevents "customers.map is not a function"
```

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

```POWERSHELL
# Backend (HTTPS required)
cd backend ; dotnet run  # Port 5121
dotnet ef migrations add MigrationName ; dotnet ef database update

# Frontend
cd front ; npm run dev  # Port 5173
```

## Service Registration Pattern

```csharp
// Services/ServiceRegistration.cs - register ALL services here
services.AddScoped<ISalesOrderService, SalesOrderService>();
services.AddScoped<IInvoiceService, InvoiceService>();
// AI Services with Azure Managed Identity
services.AddScoped<IAIAssistantService, AIAssistantService>();
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

## תכונות אינטרקטיביות

לפיתוח תכונות אינטרקטיביות ב-AI Assistant (טפסים, אישורים, בחירות), עיין ב:

- [Interactive Features Guidelines](./.github/INTERACTIVE_FEATURES_GUIDELINES.md) - הוראות מפורטות
- [Interactive Features Examples](./.github/INTERACTIVE_FEATURES_EXAMPLES.md) - דוגמאות מהירות ותבניות

**עקרון מרכזי**: כל פעולה שדורשת קלט מהמשתמש צריכה להיות אינטרקטיבית במקום הודעת טקסט.

## Israeli Compliance & Localization

- **Tax ID**: Use `CompanyService.ValidateTaxIdAsync()` (Israeli check digit algorithm)
- **VAT Rate**: 18% standard Israeli VAT in service calculations
- **Currency**: Default "ILS" for all Israeli businesses, format with ₪
- **Print Templates**: Hebrew RTL support in `src/components/print/`
- **Hebrew UI**: All text uses conditional `language === 'he' ? 'עברית' : 'English'`

## Frontend Stack

- **State**: Zustand stores in `src/stores/index.ts` (AuthStore, UIStore pattern)
- **Types**: TypeScript interfaces in `src/types/entities.ts` mirror backend models exactly
- **UI**: Material-UI with Hebrew RTL theme support in `AppThemeProvider.tsx`
- **Print**: `react-to-print` for browser-based document printing
- **Routing**: React Router with navigation in `MainLayout.tsx`

## Component Design System (Dark/Light Mode Compatible)

### Usage Pattern

```tsx
// Import unified styles
import { textFieldStyles, dialogStyles, paperStyles, dataGridStyles, buttonStyles } from '../styles/formStyles';

// Apply consistently across components
<TextField sx={textFieldStyles} />
<Button sx={buttonStyles.primary} />
<Paper sx={paperStyles} />
<Dialog sx={dialogStyles} />
<DataGrid sx={dataGridStyles} />
```

### Color Usage Guidelines

- **Backgrounds**: Always use `'background.default'` and `'background.paper'`
- **Text**: Use `'text.primary'` and `'text.secondary'`
- **Borders**: Use `theme.palette.divider` for consistent borders
- **Interactive elements**: Conditional styling based on `theme.palette.mode`

### CRITICAL DESIGN RULES

1. **Always use DataGrid for data tables**: NEVER use MUI Table for listing data. Always use DataGrid from `@mui/x-data-grid` with `enhancedDataGridStyles`
2. **Always import styles**: `import { textFieldStyles, dialogStyles, paperStyles, dataGridStyles, buttonStyles } from '../styles/formStyles';`
3. **Use theme-aware colors**: Never hardcode colors, always use theme palette
4. **Consistent spacing**: Use theme spacing (multiples of 0.25rem)
5. **Hover effects**: All interactive elements must have subtle hover animations
6. **Border radius**: Standard 2-3 units for inputs, 3 for dialogs/papers
7. **Typography**: Consistent font weights (500 for labels, 600 for headers)
8. **RTL support**: All layouts must work in both Hebrew (RTL) and English (LTR)

## API Conventions

- RESTful: `/api/[controller]/[action]`
- DTOs for data transfer (never expose entities directly)
- Multi-tenant: `companyId` parameter on ALL tenant operations
- Document endpoints: `/api/sales`, `/api/invoices`, `/api/invoices/from-sales-order/{id}`
