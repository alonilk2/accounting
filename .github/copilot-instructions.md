# AI-First SaaS Accounting Platform

**🇮🇱 Smart Accounting Assistant for Israeli Businesses** - Multi-tenant cloud-native platform with Azure OpenAI integration, Hebrew RTL support, and full Israeli Tax Authority compliance (מבנה אחיד).

## 🚨 CRITICAL RULES (NEVER SKIP)

### 1. Multi-Tenant Security
```csharp
// ALWAYS filter by CompanyId - NEVER SKIP
var customers = await _context.Customers
    .Where(c => c.CompanyId == currentCompanyId) // REQUIRED
    .ToListAsync();
```

### 2. Pagination Data Extraction
```typescript
// Frontend MUST extract .data property to prevent runtime errors
const paginatedResponse: PaginatedResponse<Customer> = await response.json();
return paginatedResponse.data || []; // Prevents "customers.map is not a function"
```

### 3. Service Inheritance
```csharp
// All services inherit from BaseService<T>
public class CustomerService : BaseService<Customer>, ICustomerService
{
    protected override DbSet<Customer> DbSet => _context.Customers;
    protected override string CompanyIdPropertyName => nameof(Customer.CompanyId);
}
```

### 4. UI Components
```tsx
// ALWAYS use DataGrid for data tables, NEVER MUI Table
import { dataGridStyles } from '../styles/formStyles';
<DataGrid sx={dataGridStyles} rows={data} columns={columns} />

// ALWAYS use theme-aware colors
backgroundColor: 'background.paper',  // ✅ Good
backgroundColor: '#ffffff',          // ❌ Bad
```

## Quick Reference

### Development Commands
```powershell
# Backend (Port 5121)
cd backend ; dotnet run

# Frontend (Port 5173)  
cd front ; npm run dev

# Database migrations
dotnet ef migrations add MigrationName ; dotnet ef database update
```

### Frontend State Management
```typescript
// Zustand stores - centralized in src/stores/index.ts
const { theme, language, setTheme, setLanguage } = useUIStore();
const isHebrew = language === 'he';
```

### Hebrew RTL Support
```tsx
// Conditional text direction
<Typography sx={{ 
  textAlign: isHebrew ? 'right' : 'left',
  direction: isHebrew ? 'rtl' : 'ltr' 
}}>
  {isHebrew ? 'עברית' : 'English'}
</Typography>
```

### Service Registration
```csharp
// ALL services MUST be registered in Services/ServiceRegistration.cs
services.AddScoped<ICustomerService, CustomerService>();
services.AddScoped<IAIAssistantService, AIAssistantService>();
```

## Israeli Business Features

- **Tax ID**: Use `CompanyService.ValidateTaxIdAsync()` (Israeli check digit)
- **VAT Rate**: 18% standard Israeli VAT
- **Currency**: Default "ILS", format with ₪ symbol
- **AI Assistant**: Hebrew function calling with Azure OpenAI

## 📚 Detailed Documentation

- **[Architecture Patterns](./architecture-patterns.md)** - BaseService, AI patterns, Azure integration
- **[UI Design System](./ui-design-system.md)** - Material-UI styles, Hebrew RTL, glass effects

## API Conventions

- RESTful: `/api/[controller]/[action]`  
- DTOs for data transfer (never expose entities)
- Multi-tenant: `companyId` parameter on ALL operations
- Documents: `/api/sales`, `/api/invoices`, `/api/invoices/from-sales-order/{id}`
