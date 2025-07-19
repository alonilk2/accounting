# AI Accounting SaaS Project - Copilot Instructions

AI-First SaaS Accounting Platform for Israeli businesses with React frontend + .NET backend.

**Key Architecture**: Multi-tenant BaseService pattern with paginated APIs, Material-UI components, Hebrew RTL support, AI Bot powered.

## Critical Architecture Patterns

### Multi-Tenant Security (NEVER SKIP)
All tenant entities inherit from `TenantEntity` with `CompanyId`. ALWAYS filter by company:
```csharp
var customers = await _context.Customers
    .Where(c => c.CompanyId == currentCompanyId) // REQUIRED
    .ToListAsync();
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

### BaseService Pattern
Services inherit from `BaseService<T>` with multi-tenant filtering:
```csharp
public class CustomerService : BaseService<Customer>, ICustomerService
{
    protected override DbSet<Customer> DbSet => _context.Customers;
    protected override string CompanyIdPropertyName => nameof(Customer.CompanyId);
}
```

## Development Commands
```bash
cd backend ; dotnet run  # Port 5121 (HTTPS required)
cd front ; npm run dev   # Port 5173
```

## Common Debugging Issues
- **Multi-tenant data leakage** → Missing `companyId` filter in backend queries

## UI Standards
- **Framework**: React + TypeScript + Vite + Material-UI
- **Theme**: Hebrew RTL support, dark/light modes
- **Styles**: Import from `../styles/formStyles` for consistency
- **State**: Zustand stores (AuthStore, UIStore)
- **API**: Native fetch with manual response handling

## Israeli Compliance
- **VAT**: 18% standard Israeli VAT
- **Currency**: Default "ILS" with ₪ symbol  
- **Tax ID**: Israeli check digit validation via `CompanyService.ValidateTaxIdAsync()`
