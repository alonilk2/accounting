# AI Accounting SaaS Project - Copilot Instructions

This is an AI-First SaaS Accounting Platform for Israeli businesses with React frontend + .NET backend, designed for Israeli Tax Authority compliance and multi-tenant operations.

## Recent Updates (Critical)

### July 2025 - Document Architecture Separation
- **Major Change**: Separated invoices from sales orders into independent entities
- **Before**: Invoices were just a status of SalesOrder (`SalesOrderStatus.Invoiced`)
- **After**: 
  - `Invoice` + `InvoiceLine` entities with separate lifecycle
  - `SalesOrder` focuses on order management (Quote → Confirmed → Shipped → Completed)
  - `Invoice` focuses on billing (Draft → Sent → Paid → Overdue)
- **Migration**: `SeparateInvoicesFromSalesOrders` creates new Invoice tables
- **Impact**: Controllers, services, and UI components now handle invoices separately
- **Benefits**: Better tax compliance, clearer business logic, flexible billing workflows

## Architecture Overview

### Multi-Tenant SaaS Structure
- **Backend**: .NET 9 Web API with Entity Framework Core + Azure SQL
- **Frontend**: React 18 + TypeScript + Vite + Material-UI + Zustand
- **Multi-tenancy**: Row-level security with `CompanyId` on all tenant entities
- **Base entities**: All models inherit from `BaseEntity` (audit fields) or `TenantEntity` (+ CompanyId)

### Key Business Domains
- **Sales**: `SalesOrder` → `SalesOrderLine` with customer/agent relationships (for quotations and order management)
- **Invoicing**: `Invoice` → `InvoiceLine` separate billing documents (not just SalesOrder status)
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
services.AddScoped<IInvoiceService, InvoiceService>();
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
- Document status enums: SalesOrderStatus (`Quote | Confirmed | Shipped | Completed | Cancelled`) and InvoiceStatus (`Draft | Sent | Paid | Overdue | Cancelled`)

### Israeli Business Logic (Critical)
- **Tax ID Validation**: Use `CompanyService.ValidateTaxIdAsync()` - implements Israeli check digit algorithm
- **Chart of Accounts**: Auto-generated per Israeli standards (100-199 Assets, 200-299 Liabilities, etc.)
- **Default Currency**: "ILS" for all Israeli businesses
- **Fiscal Year**: Default January 1st start (customizable per company)
- **Document Separation**: Sales orders (operational) and invoices (billing) are separate entities for tax compliance

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

## Document Architecture (Critical Update)

### Sales Orders vs Invoices - Separate Documents
- **Sales Orders**: Order management and quotations (`SalesOrder` → `SalesOrderLine`)
  - Status: `Quote | Confirmed | Shipped | Completed | Cancelled`
  - Used for: Customer orders, quotations, delivery tracking
  - Not for billing - purely operational
- **Invoices**: Billing documents (`Invoice` → `InvoiceLine`) 
  - Status: `Draft | Sent | Paid | Overdue | Cancelled`  
  - Used for: Tax compliance, customer billing, payment tracking
  - Can reference original SalesOrder but independent lifecycle
  - Sequential numbering: YYYY-NNNNNN format (e.g., 2025-000001)

### Document Relationships
- **One-to-Many**: SalesOrder can generate multiple Invoices (partial billing)
- **Optional Reference**: Invoice can exist without SalesOrder (direct billing)
- **Customer Snapshot**: Invoice stores customer data at time of billing for audit compliance
- **Payment Tracking**: Receipts link to SalesOrders, Payments link to Invoices

### Print Templates
- **PrintableSalesOrder**: For quotes, orders, delivery documents
- **PrintableInvoice**: For tax-compliant billing documents with Israeli requirements
- **PrintableReceipt**: For payment confirmations

### API Endpoints
- `/api/sales` - Sales order management
- `/api/invoices` - Invoice management 
- `/api/invoices/from-sales-order/{id}` - Generate invoice from sales order
- Both support multi-tenant filtering and audit trails

## Document Printing & Export Features

### Current Print Implementation (React-based)
- **Frontend-Only Printing**: Uses `react-to-print` library for browser-based printing
- **Print Components**: Existing components in `src/components/print/`:
  - `PrintButton` - Reusable print button with Material-UI integration
  - `PrintableReceipt` - Hebrew receipt template for customer payments
  - `PrintableSalesOrder` - Sales order/quotation printing template (separate from invoices)
  - `PrintableInvoice` - Tax-compliant invoice template for billing documents
  - `PrintableDocument` - Base template with Hebrew company header
- **Current Usage**: Sales orders, invoices, and receipts can be printed directly from UI
- **Sequential Numbering**: Already implemented (REC-YYYY-#### for receipts, SO-YYYY-#### for sales orders, YYYY-NNNNNN for invoices)

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

// For invoices
<PrintButton
  printableContent={() => (
    <PrintableInvoice invoice={invoice} company={company} />
  )}
  documentTitle={`חשבונית-${invoice.invoiceNumber}`}
/>

// Planned: Backend PDF service
const pdfBytes = await printService.GenerateInvoicePdfAsync(invoiceId, companyId);
```
