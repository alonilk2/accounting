# AI Accounting SaaS Project - Copilot Instructions

AI-First SaaS Accounting Platform for Israeli businesses with React frontend + .NET backend, fully compliant with Israeli regulations including "מסמך אחיד" (Unified Document) requirements.

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: React + TypeScript, Material-UI, Zustand state management
- **Backend**: .NET 8 Web API, Entity Framework Core
- **Database**: Azure SQL Database with managed identity
- **AI**: Azure OpenAI with function calling for Hebrew business assistant
- **Infrastructure**: Azure App Service, Key Vault, Application Insights

### Project Structure
```
/
├── backend/                 # .NET 8 Web API
│   ├── Controllers/        # API endpoints with multi-tenant filtering
│   ├── Services/          # Business logic inheriting BaseService<T>
│   ├── Models/            # Entity models with BaseEntity/TenantEntity
│   ├── DTOs/              # Data transfer objects
│   ├── Migrations/        # EF Core database migrations
│   └── AI/                # Azure OpenAI integration & function services
├── front/                  # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components with Hebrew RTL support
│   │   ├── stores/        # Zustand state management
│   │   ├── types/         # TypeScript interfaces matching backend
│   │   ├── utils/         # Helpers for formatting, validation
│   │   └── api/           # API client services
│   └── public/            # Static assets
```

## 🔐 Critical Architecture Patterns

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
## 🤖 AI Function Calling Pattern
Extensible function routing for Azure OpenAI function calls with Hebrew descriptions:
```csharp
public class CustomerFunctionService : ICustomerFunctionService
{
    public List<FunctionDefinition> GetCustomerFunctions() => new()
    {
        new() { Name = "getCustomersList", Description = "קבלת רשימת לקוחות" },
        new() { Name = "createCustomer", Description = "יצירת לקוח חדש" },
        new() { Name = "searchCustomers", Description = "חיפוש לקוחות לפי שם או מס' ח.פ" }
    };
    
    public async Task<FunctionResult> ExecuteCustomerFunctionAsync(
        FunctionCall functionCall, int companyId, CancellationToken cancellationToken)
    {
        return functionCall.Name switch
        {
            "getCustomersList" => await GetCustomersListAsync(functionCall.Arguments, companyId, cancellationToken),
            "createCustomer" => await CreateCustomerAsync(functionCall.Arguments, companyId, cancellationToken),
            _ => new FunctionResult { IsSuccess = false, ErrorMessage = "Unknown function" }
        };
    }
}
```

## 🇮🇱 Israeli Compliance & Regulations

### מסמך אחיד (Unified Document) Requirements
- **Format**: Standardized invoice format per Israeli Tax Authority regulations
- **Fields**: All mandatory fields including מס' עוסק מורשה, invoice serial number
- **QR Code**: Optional QR code for digital validation
- **Implementation**: `UnifiedDocumentService` handles format compliance

### Tax & Financial Compliance
- **Tax ID**: Use `CompanyService.ValidateTaxIdAsync()` (Israeli check digit algorithm)
- **VAT Rate**: 18% standard Israeli VAT (מע"מ) in service calculations
- **Currency**: Default "ILS" for all Israeli businesses, format with ₪
- **Invoice Numbering**: Sequential, company-specific, reset yearly option
- **Tax Reports**: Export formats compatible with Israeli Tax Authority systems

### Document Management
- **Print Templates**: Hebrew RTL support in `src/components/print/`
  - Invoice template with מסמך אחיד compliance
  - Receipt template (קבלה)
  - Quote template (הצעת מחיר)
- **PDF Export**: Using `iTextSharp` for Hebrew PDF generation with proper RTL
- **Excel Export**: EPPlus for financial reports with Hebrew headers

## 📧 Email Integration
```csharp
public interface IEmailService
{
    Task SendInvoiceAsync(int invoiceId, string recipientEmail, int companyId);
    Task SendQuoteAsync(int quoteId, string recipientEmail, int companyId);
    Task SendStatementAsync(int customerId, DateTime fromDate, DateTime toDate, int companyId);
}
```
- **SMTP Configuration**: Azure Communication Services or SendGrid
- **Templates**: Hebrew/English email templates with company branding
- **Attachments**: Auto-attach PDF documents

## 💾 Backup & Restore
```csharp
public interface IBackupService
{
    Task<BackupResult> CreateBackupAsync(int companyId);
    Task<RestoreResult> RestoreBackupAsync(int companyId, string backupId);
    Task<List<BackupInfo>> GetBackupsAsync(int companyId);
}
```
- **Automated Backups**: Daily Azure SQL automated backups
- **Manual Backups**: On-demand company-specific data export
- **Restore**: Point-in-time recovery with audit trail
- **Storage**: Azure Blob Storage with encryption

## 🎨 Design System

### UI/UX Principles
- **Modern Israeli Business Design**: Clean, professional, mobile-responsive
- **Color Palette**:
  - Primary: #1976d2 (Professional Blue)
  - Secondary: #FFA726 (Warm Amber)
  - Success: #4CAF50
  - Error: #F44336
- **Typography**: 
  - Hebrew: Noto Sans Hebrew, Heebo
  - English: Roboto, Inter
- **Spacing**: Material Design 8px grid system

### RTL Support
```typescript
// AppThemeProvider.tsx
const theme = createTheme({
  direction: language === 'he' ? 'rtl' : 'ltr',
  typography: {
    fontFamily: language === 'he' 
      ? '"Noto Sans Hebrew", "Heebo", sans-serif'
      : '"Roboto", "Inter", sans-serif'
  }
});
```

## 🚀 Development Workflow

### Backend Development
```bash
cd backend
dotnet run                          # Runs on https://localhost:5121
dotnet ef migrations add [Name]     # Create new migration
dotnet ef database update           # Apply migrations
dotnet test                         # Run unit tests
```

### Frontend Development
```bash
cd front
npm install                         # Install dependencies
npm run dev                         # Runs on http://localhost:5173
npm run build                       # Production build
npm test                           # Run tests
```

### Service Registration Pattern
```csharp
// Services/ServiceRegistration.cs - register ALL services here
services.AddScoped<ISalesOrderService, SalesOrderService>();
services.AddScoped<IInvoiceService, InvoiceService>();
services.AddScoped<IEmailService, EmailService>();
services.AddScoped<IBackupService, BackupService>();
services.AddScoped<IUnifiedDocumentService, UnifiedDocumentService>();
// AI Services with Azure Managed Identity
services.AddScoped<IAIAssistantService, AIAssistantService>();
services.AddScoped<ICustomerFunctionService, CustomerFunctionService>();
```

## 📋 API Conventions
- **RESTful Routes**: `/api/[controller]/[action]`
- **Multi-tenant**: `companyId` parameter on ALL tenant operations
- **Document Endpoints**: 
  - `/api/sales` - Sales orders management
  - `/api/invoices` - Invoice operations
  - `/api/invoices/from-sales-order/{id}` - Convert order to invoice
  - `/api/invoices/{id}/send-email` - Email invoice
  - `/api/invoices/{id}/export-pdf` - Export as PDF
  - `/api/reports/export-excel` - Excel reports
- **Backup Endpoints**:
  - `/api/backup/create` - Create backup
  - `/api/backup/restore/{backupId}` - Restore from backup
  - `/api/backup/list` - List available backups

## 🔧 Entity Patterns
```csharp
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; } = false; // Soft delete only
    public byte[]? RowVersion { get; set; } // Optimistic concurrency
}

public abstract class TenantEntity : BaseEntity
{
    public int CompanyId { get; set; } // Multi-tenant key
    public virtual Company Company { get; set; }
}
```

## 🔒 Security Checklist
- [ ] Always filter by CompanyId in queries
- [ ] Use DTOs, never expose entities directly
- [ ] Validate Israeli tax IDs and document formats
- [ ] Implement proper authentication/authorization
- [ ] Encrypt sensitive data in transit and at rest
- [ ] Audit all financial operations

## 🌐 Localization
- All UI text uses conditional: `language === 'he' ? 'עברית' : 'English'`
- Date formats: DD/MM/YYYY for Israeli standard
- Number formats: 1,234.56 with ₪ symbol
- Right-to-left layout for Hebrew interface

## 📊 Reporting & Analytics
- **Financial Reports**: P&L, Balance Sheet, Cash Flow
- **VAT Reports**: Format for Israeli Tax Authority submission
- **Customer Statements**: Account activity summaries
- **Export Formats**: PDF for viewing, Excel for analysis
- **Dashboard**: Real-time KPIs with Hebrew labels