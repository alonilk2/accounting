# AI Accounting SaaS Project - Copilot Instructions

This is an AI-First SaaS Accounting Platform for Israeli businesses with React frontend + .NET backend, designed for Israeli Tax Authority compliance and multi-tenant operations.

## Architecture Overview

### Multi-Tenant SaaS Structure
- **Backend**: .NET 9 Web API with Entity Framework Core + Azure SQL
- **Frontend**: React 18 + TypeScript + Vite + Material-UI + Zustand
- **Multi-tenancy**: Row-level security with `CompanyId` on all tenant entities
- **Base entities**: All models inherit from `BaseEntity` (audit fields) or `TenantEntity` (+ CompanyId)

### Key Business Domains
- **Sales**: `SalesOrder` → `SalesOrderLine` with customer/agent relationships
- **Purchasing**: `PurchaseOrder` → `PurchaseOrderLine` with supplier relationships  
- **Inventory**: `Item` tracking with `InventoryTransaction` movements
- **Accounting**: `ChartOfAccount` (hierarchical) + `JournalEntry` for double-entry bookkeeping
- **POS**: Point-of-sale transactions (`POSSale` → `POSSaleLines`)
- **Compliance**: Israeli Tax Authority "מבנה אחיד" export (INI.TXT/BKMVDATA.TXT format)

## Development Patterns

### Backend (.NET)
- **Service Layer**: Business logic in `Services/` with interface contracts (`IBaseService<T>`)
- **Controllers**: Thin REST controllers in `Controllers/` - delegate to services directly
- **Multi-tenant queries**: ALWAYS filter by `CompanyId` - use `ApplyCompanyFilter()` in base service
- **Database**: Use `AccountingDbContext` with proper Include() for navigation properties
- **Validation**: Data annotations + service-level validation for business rules

### Critical Multi-Tenant Pattern
All tenant entities inherit from `TenantEntity` which includes `CompanyId`. Base service automatically filters:
```csharp
// BaseService<T> automatically applies company filtering
protected virtual IQueryable<T> ApplyCompanyFilter(IQueryable<T> query, int companyId)
{
    return query.Where(e => EF.Property<int>(e, CompanyIdPropertyName) == companyId);
}

// Controllers must pass companyId to all service methods
[HttpGet]
public async Task<ActionResult<IEnumerable<CustomerDto>>> GetCustomers([FromQuery] int? companyId = null)
{
    var currentCompanyId = companyId ?? 1; // Get from auth context in real app
    var customers = await _context.Customers
        .Where(c => c.CompanyId == currentCompanyId) // REQUIRED filtering
        .ToListAsync();
}
```

### Frontend (React)
- **State Management**: Zustand stores in `stores/index.ts` (AuthStore, UIStore pattern)
- **Types**: TypeScript interfaces in `types/entities.ts` mirror backend models exactly
- **Services**: API communication layer in `services/` with axios
- **Components**: Material-UI based, feature-organized in `components/`
- **Routing**: React Router for navigation between modules

### Service Registration Pattern
```csharp
// In Services/ServiceRegistration.cs - register ALL services here
services.AddScoped<ISalesOrderService, SalesOrderService>();
services.ConfigureDatabase(builder.Configuration, builder.Environment);
```

## Critical Workflows

### Development Commands
```bash
# Backend
cd backend ; dotnet run --launch-profile https  # HTTPS on port 7275
dotnet ef migrations add MigrationName           # Database changes
dotnet ef database update                        # Apply migrations

# Frontend  
cd front ; npm run dev                          # Vite dev server on port 5173
npm run test                                     # Vitest unit tests
npm run build                                    # Production build
```

### Database Entity Patterns
- **Entity relationships**: Use navigation properties with proper FK constraints
- **Soft deletes**: Set `IsDeleted = true`, never physically delete records
- **Audit trail**: `CreatedAt/UpdatedAt` automatically managed by `BaseEntity`
- **Concurrency**: Use `RowVersion` for optimistic concurrency control
- **Company setup**: Use `CompanyService.InitializeCompanyAsync()` - auto-creates Israeli chart of accounts

### API Development Conventions
- RESTful endpoints: `/api/[controller]/[action]`
- DTOs for data transfer (avoid exposing entity models directly)
- Consistent error responses with proper HTTP status codes
- Multi-tenant filtering: `companyId` parameter on ALL tenant operations
- Dev endpoint pattern: `GET /api/customers/dev/first-company` returns test company ID

### Israeli Business Logic (Critical)
- **Tax ID Validation**: Use `CompanyService.ValidateTaxIdAsync()` - implements Israeli check digit algorithm
- **Chart of Accounts**: Auto-generated per Israeli standards (100-199 Assets, 200-299 Liabilities, etc.)
- **Default Currency**: "ILS" for all Israeli businesses
- **Fiscal Year**: Default January 1st start (customizable per company)

## Israeli Tax Compliance (Critical)
- **מבנה אחיד Export**: Generate INI.TXT + BKMVDATA.TXT files per Income Tax Instruction 1.31
- **Record types**: C100 (documents), D110 (lines), B100 (GL transactions), M100 (inventory)
- **VAT handling**: Proper tax calculations and reporting
- **Audit requirements**: All financial changes must be logged in `AuditLog` table

## AI Integration Points
- **Azure Form Recognizer**: OCR for receipt/invoice scanning (`/api/ai/scan-receipt`)
- **Azure OpenAI**: Chatbot assistant for financial queries (`/api/ai/query`)
- **Future**: Anomaly detection, forecasting, automated categorization

## Testing & Quality
- **Unit tests**: Vitest + React Testing Library for frontend, xUnit for backend
- **Integration tests**: Test full user workflows through API endpoints
- **Database tests**: Use in-memory SQLite for isolated testing
- **Type safety**: Strict TypeScript with proper entity type definitions

## Document Printing & Export Features

### Current Print Implementation (React-based)
- **Frontend-Only Printing**: Uses `react-to-print` library for browser-based printing
- **Print Components**: Existing components in `src/components/print/`:
  - `PrintButton` - Reusable print button with Material-UI integration
  - `PrintableReceipt` - Hebrew receipt template for customer payments
  - `PrintableSalesOrder` - Sales order/invoice printing template
  - `PrintableDocument` - Base template with Hebrew company header
- **Current Usage**: Sales orders and receipts can be printed directly from UI
- **Sequential Numbering**: Already implemented (REC-YYYY-#### for receipts, SO-YYYY-#### for sales orders)

### Extending Print Functionality (To Match Instructions)
- **Backend PDF Service**: Create `IPrintService` interface for server-side PDF generation:
```csharp
// Backend: IPrintService interface (NOT YET IMPLEMENTED)
public interface IPrintService
{
    Task<byte[]> GenerateInvoicePdfAsync(int invoiceId, int companyId, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateReceiptPdfAsync(int receiptId, int companyId, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateReportPdfAsync(string reportType, int companyId, object parameters, CancellationToken cancellationToken = default);
}
```
- **Print API Endpoints** (To be implemented):
  - `GET /api/print/invoice/{id}` - Returns PDF stream
  - `GET /api/print/receipt/{id}` - Returns receipt PDF
  - `GET /api/print/report/{type}` - Returns report PDF with query parameters

### Israeli Document Standards (הדפסת מסמכים לפי תקנות ישראליות)
- **Current Implementation**: Existing templates already include Hebrew support and RTL layout
- **Tax Compliance**: Current receipt template includes required Israeli fields:
  - Company name, address, tax ID (מס׳ עוסק מורשה)
  - Customer details and tax ID
  - Receipt number and date
  - Payment method and amount in ILS
  - Sequential numbering per year (REC-YYYY-####)
- **VAT Integration**: Uses 17% tax rate from existing `SalesOrderService.ValidateAndProcessLineItemsAsync()`

### Print Service Pattern (Current vs Planned)
```typescript
// Current: Frontend component printing
<PrintButton
  printableContent={() => (
    <PrintableReceipt receipt={receipt} salesOrder={order} customer={customer} company={company} />
  )}
  documentTitle={`קבלה-${receipt.receiptNumber}`}
/>

// Planned: Backend PDF service
const pdfBytes = await printService.GenerateReceiptPdfAsync(receiptId, companyId);
```
