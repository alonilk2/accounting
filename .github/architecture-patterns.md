# Architecture Patterns - AI Accounting SaaS

## BaseService Pattern (Foundation)

All services inherit from `BaseService<T>` providing standardized multi-tenant CRUD:

```csharp
public abstract class BaseService<T> : IBaseService<T> where T : BaseEntity
{
    protected abstract DbSet<T> DbSet { get; }
    protected abstract string CompanyIdPropertyName { get; }

    // Auto-applies company filtering via EF.Property<int>(e, CompanyIdPropertyName)
    // Includes audit logging, optimistic concurrency, soft deletes
    
    // Key methods (all with CompanyId isolation):
    public virtual async Task<T?> GetByIdAsync(int id, int companyId)
    public virtual async Task<PaginatedResponse<T>> GetPagedAsync(int page, int pageSize, int companyId)
    public virtual async Task<T> CreateAsync(T entity, int companyId)
    public virtual async Task<T> UpdateAsync(T entity, int companyId)
    public virtual async Task DeleteAsync(int id, int companyId) // Soft delete only
}
```

**CRITICAL**: Service implementations must override `DbSet` and `CompanyIdPropertyName`:
```csharp
public class CustomerService : BaseService<Customer>, ICustomerService
{
    protected override DbSet<Customer> DbSet => _context.Customers;
    protected override string CompanyIdPropertyName => nameof(Customer.CompanyId);
    
    // Custom business logic methods go here
    public async Task<bool> ValidateCustomerEmailAsync(string email, int companyId) { ... }
}
```

## Critical Pagination Pattern (MUST FOLLOW)

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

## AI Function Calling Pattern (Unique)

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

## Service Registration (Critical)

**ALL services must be registered in `Services/ServiceRegistration.cs`**:

```csharp
public static class ServiceRegistration
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Core services (BaseService implementations)
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<ISupplierService, SupplierService>();
        services.AddScoped<IItemService, ItemService>();
        
        // Document services
        services.AddScoped<ISalesOrderService, SalesOrderService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        
        // AI services with Azure integration
        services.AddScoped<IAIAssistantService, AIAssistantService>();
        services.AddScoped<ICustomerFunctionService, CustomerFunctionService>();
        services.AddScoped<DefaultAzureCredential>();
        
        return services;
    }
}
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

## Zustand Store Pattern

```typescript
// src/stores/index.ts - Centralized store exports
export { useAuthStore } from './authStore';
export { useUIStore } from './uiStore';

// Store structure with persistence
interface UIStore {
  theme: 'light' | 'dark';
  language: 'en' | 'he';
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'en' | 'he') => void;
}

// Usage in components
const { theme, language, setTheme, setLanguage } = useUIStore();
const isHebrew = language === 'he';
```

## Azure Integration

- **OpenAI**: Uses `DefaultAzureCredential` with fallback to API key for local dev
- **Database**: Azure SQL with retry logic, managed identity auth
- **Configuration**: Azure Key Vault integration via `DatabaseConfiguration.cs`
