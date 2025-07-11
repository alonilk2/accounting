# AI-First SaaS Accounting Platform - Database Schema

This document describes the comprehensive database schema for the Israeli AI-First SaaS Accounting Platform, designed to support multi-tenant operations with full compliance to Israeli Tax Authority requirements.

## Overview

The database schema implements:
- **Multi-tenant architecture** with row-level security
- **Full double-entry bookkeeping** system
- **Israeli Tax Authority compliance** (מבנה אחיד format support)
- **Comprehensive audit trail** for all operations
- **AI-ready data structures** for document processing and analytics
- **Performance optimizations** with strategic indexing

## Core Architecture

### Base Entities

All entities inherit from `BaseEntity` providing:
- Primary key (`Id`)
- Audit timestamps (`CreatedAt`, `UpdatedAt`)
- User tracking (`CreatedBy`, `UpdatedBy`)
- Soft delete support (`IsDeleted`)
- Optimistic concurrency control (`RowVersion`)

Tenant-specific entities inherit from `TenantEntity`, adding:
- Multi-tenant isolation (`CompanyId`)
- Company foreign key relationship

### Security Features

1. **Row-Level Security**: All tenant data is isolated by `CompanyId`
2. **Soft Deletes**: Records are marked as deleted, not physically removed
3. **Audit Trail**: Complete history of all user actions
4. **Optimistic Concurrency**: Prevents data conflicts in multi-user scenarios

## Entity Relationship Overview

```
Companies (Multi-tenant root)
├── Users (Many-to-many via UserCompanies)
├── ChartOfAccounts (Hierarchical)
├── Customers
├── Suppliers
├── Agents
├── Items (Inventory)
├── SalesOrders → SalesOrderLines
├── PurchaseOrders → PurchaseOrderLines
├── StandingOrders (Recurring billing)
├── POSSales → POSSaleLines
├── InventoryTransactions
├── JournalEntries
└── AuditLogs
```

## Core Entities

### Identity & Access Management

#### `Users`
- System users with role-based access control
- Supports multi-factor authentication fields
- Account lockout and security monitoring
- Multi-tenant access via `UserCompanies`

#### `Roles`
- Predefined roles: System Admin, Business Owner, Accountant, Bookkeeper, Sales User, View Only
- JSON-based permissions for flexible access control
- Used for both authentication and authorization

#### `Companies`
- Multi-tenant root entity
- Israeli business registration (`IsraelTaxId`)
- Subscription and billing information
- Company-specific settings and configurations

### Financial Accounting

#### `ChartOfAccounts`
- Hierarchical account structure (parent-child relationships)
- Israeli accounting standards compliance
- Account types: Asset, Liability, Equity, Revenue, Expense
- Supports both Hebrew and English names
- Control accounts for summary reporting

#### `JournalEntries`
- Double-entry bookkeeping implementation
- Balanced debit/credit entries
- Source document references
- Sequential numbering for audit trail
- Posted status for approval workflows

### Sales Management

#### `Customers`
- Customer master data with Israeli tax IDs
- Credit limits and payment terms
- Support for both Hebrew and English names
- Contact information and preferences

#### `SalesOrders` & `SalesOrderLines`
- Complete sales document lifecycle
- Order status tracking (Draft → Order → Delivery → Invoiced → Paid)
- Multi-currency support with exchange rates
- Line-level pricing, discounts, and tax calculations
- Integration with inventory and accounting

#### `Receipts`
- Customer payment tracking
- Multiple payment methods support
- Reference number tracking
- Automatic GL posting integration

#### `StandingOrders`
- Recurring billing automation
- Flexible frequency options (Weekly, Monthly, Quarterly, Yearly)
- Automatic invoice generation
- End date and maximum generation controls

### Procurement Management

#### `Suppliers`
- Vendor master data
- Payment terms and banking information
- VAT registration tracking
- Purchase history integration

#### `PurchaseOrders` & `PurchaseOrderLines`
- Complete procurement lifecycle
- Supplier invoice matching
- Receiving and payment tracking
- Three-way matching support (PO → Receipt → Invoice)

#### `Payments`
- Supplier payment processing
- Payment method tracking
- Reference number management
- Cash flow integration

### Inventory Management

#### `Items`
- Product/service master data
- Multi-level categorization
- Cost and selling price tracking
- Stock level monitoring with reorder points
- Barcode and image support
- Multi-unit tracking

#### `InventoryBOM`
- Bill of Materials for manufacturing
- Component quantity relationships
- Active BOM version control
- Cost roll-up calculations

#### `InventoryTransactions`
- Complete audit trail of stock movements
- Transaction types: Sale, Purchase, Adjustment, Production, Transfer, Return
- Real-time stock balance calculation
- Cost basis tracking (FIFO/LIFO support)

### Point of Sale (POS)

#### `POSSales` & `POSSaleLines`
- Retail transaction processing
- Terminal and cashier tracking
- Multiple payment methods
- Void transaction support
- Real-time inventory updates
- Receipt generation

### Audit & Compliance

#### `AuditLog`
- Complete user action tracking
- IP address and session monitoring
- Severity level classification
- JSON additional data storage
- Compliance reporting support

## Israeli Tax Authority Compliance

The schema fully supports the **מבנה אחיד** (Unified Format) requirements:

### Data Export Capabilities
- **INI.TXT**: Index file with record counts
- **BKMVDATA.TXT**: Complete business data export
- **Record Types**:
  - A100: Opening structure
  - B100: General ledger transactions
  - B110: Chart of accounts
  - C100: Document headers (invoices)
  - D110: Document details (line items)
  - D120: Payment details
  - M100: Inventory items
  - Z900: Closing record

### Compliance Features
- Sequential transaction numbering
- Immutable audit trail
- VAT calculation and tracking
- Israeli date and currency formats
- Hebrew language support
- Tax ID validation

## Performance Optimizations

### Strategic Indexes
- **Primary Operations**: Customer/Supplier lookups, date ranges
- **Financial Reporting**: Account + date combinations
- **Inventory**: Item + transaction date
- **Multi-tenant**: All queries filtered by CompanyId
- **Unique Constraints**: Business rules enforcement

### Query Performance
- **Connection Pooling**: Optimized database connections
- **Batch Operations**: Bulk insert/update support
- **Pagination**: Large dataset handling
- **Caching Strategy**: Frequently accessed master data

## Data Types and Precision

### Financial Amounts
- **Monetary Values**: `decimal(18,2)` for currency amounts
- **Quantities**: `decimal(18,4)` for inventory precision
- **Exchange Rates**: `decimal(10,6)` for currency conversion
- **Percentages**: `decimal(5,2)` for tax rates and discounts

### Text Fields
- **Names/Descriptions**: Varying lengths with Hebrew support
- **IDs/Numbers**: Fixed length for business identifiers
- **JSON Storage**: Flexible configuration and additional data

## AI Integration Points

### Document Processing
- **Receipt Storage**: Blob URLs for scanned documents
- **OCR Results**: Structured data extraction storage
- **Confidence Scores**: AI processing quality metrics
- **Manual Override**: Human verification workflow

### Analytics Preparation
- **Historical Data**: Time-series ready structure
- **Category Classification**: AI-friendly categorization
- **Pattern Recognition**: Anomaly detection support
- **Forecasting Data**: Predictive analytics preparation

## Migration and Deployment

### Entity Framework Migrations
```bash
# Add migration
dotnet ef migrations add InitialCreate

# Update database
dotnet ef database update

# Production deployment
dotnet ef database update --environment Production
```

### Data Seeding
- Default roles and permissions
- Chart of accounts templates
- System configuration data
- Demo data for development

## Security Considerations

### Data Protection
- **Encryption at Rest**: Azure SQL TDE enabled
- **Encryption in Transit**: TLS 1.2+ required
- **Key Management**: Azure Key Vault integration
- **Backup Encryption**: Automated encrypted backups

### Access Control
- **Managed Identity**: Azure AD integration
- **Row-Level Security**: Tenant data isolation
- **Column Encryption**: Sensitive data protection
- **Audit Logging**: Complete access monitoring

## Scalability Design

### Multi-tenant Scaling
- **Elastic Pools**: Resource sharing optimization
- **Read Replicas**: Query performance distribution
- **Partitioning**: Large table management
- **Archiving**: Historical data management

### Performance Monitoring
- **Query Analysis**: Slow query identification
- **Index Usage**: Optimization recommendations
- **Resource Utilization**: Capacity planning
- **Connection Monitoring**: Pool optimization

This database schema provides a robust foundation for the AI-First SaaS Accounting Platform, ensuring scalability, compliance, and performance while maintaining data integrity and security standards required for financial applications.
