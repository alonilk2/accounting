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
- **Controllers**: Thin REST controllers in `Controllers/` - delegate to services
- **Multi-tenant queries**: Always filter by `CompanyId` in service methods
- **Database**: Use `AccountingDbContext` with proper Include() for navigation properties
- **Validation**: Data annotations + service-level validation for business rules

### Frontend (React)
- **State Management**: Zustand stores in `stores/index.ts` (AuthStore, UIStore pattern)
- **Types**: TypeScript interfaces in `types/entities.ts` mirror backend models
- **Services**: API communication layer in `services/` with axios
- **Components**: Material-UI based, feature-organized in `components/`
- **Routing**: React Router for navigation between modules

### Service Registration Pattern
```csharp
// In Services/ServiceRegistration.cs
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

### Database Patterns
- **Entity relationships**: Use navigation properties with proper FK constraints
- **Soft deletes**: Set `IsDeleted = true`, never physically delete records
- **Audit trail**: `CreatedAt/UpdatedAt` automatically managed by `BaseEntity`
- **Concurrency**: Use `RowVersion` for optimistic concurrency control

### API Conventions
- RESTful endpoints: `/api/[controller]/[action]`
- DTOs for data transfer (avoid exposing entity models directly)
- Consistent error responses with proper HTTP status codes
- Multi-tenant filtering: `companyId` parameter on all tenant operations

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
