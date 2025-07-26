# AI-First SaaS Accounting Platform

> **🇮🇱 Smart Accounting Assistant for Israeli Businesses** - Multi-tenant cloud-native platform with Azure OpenAI integration, Hebrew RTL support, and full Israeli Tax Authority compliance (מבנה אחיד).

[![.NET 8](https://img.shields.io/badge/.NET-8-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Azure](https://img.shields.io/badge/Azure-Cloud--Native-0078D4?logo=microsoftazure)](https://azure.microsoft.com/)
[![OpenAI](https://img.shields.io/badge/Azure_OpenAI-GPT--4o--mini-00A67E?logo=openai)](https://azure.microsoft.com/en-us/products/ai-services/openai-service)

## 🎯 Overview

An AI-powered, cloud-native SaaS accounting platform designed specifically for small-to-medium Israeli businesses. Features intelligent automation through Azure OpenAI, comprehensive financial management, point-of-sale integration, and mandatory Israeli Tax Authority compliance.

### ✨ Key Features

- **🤖 AI-Powered Assistant**: Azure OpenAI GPT-4o-mini with Hebrew language support for automated document processing, financial insights, and natural language queries
- **📄 Smart OCR**: Azure Form Recognizer for automatic invoice and receipt data extraction
- **🏢 Multi-Tenant Architecture**: Secure row-level data isolation with BaseService pattern
- **🇮🇱 Israeli Compliance**: Full מבנה אחיד (Unified Format) export support for Tax Authority reporting
- **💰 Complete Financial Suite**: Sales, purchasing, inventory, POS, recurring billing, and banking
- **🌓 Modern UI**: Material-UI with Hebrew RTL support and dark/light themes
- **📱 Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices

## 🛠️ Technology Stack

### Backend (.NET 8)

```yaml
Framework: ASP.NET Core 8.0
Database: Azure SQL Server with Entity Framework Core
Authentication: JWT Bearer tokens with Azure AD integration
AI Services: Azure OpenAI, Azure Form Recognizer
Storage: Azure Blob Storage for document attachments
Security: Azure Key Vault, Managed Identity
```

### Frontend (React 19)

```yaml
Framework: React 19.1 + TypeScript 5.8
Build Tool: Vite 7.0 for fast development
UI Library: Material-UI (MUI) 7.2 with RTL support
State Management: Zustand for lightweight, scalable state
Router: React Router 7.6 for navigation
Testing: Vitest + Testing Library
```

### Azure Services

```yaml
Compute: Azure App Service / Container Apps
Database: Azure SQL with Elastic Pools
AI/ML: Azure OpenAI Service, Form Recognizer
Storage: Azure Blob Storage
Security: Azure Key Vault, Managed Identity
Monitoring: Azure Monitor, Application Insights
```

## 🏗️ Architecture Overview

### Multi-Tenant Security Model

Every tenant entity inherits from `TenantEntity` with automatic `CompanyId` filtering:

```csharp
// All queries automatically filtered by company
var customers = await _context.Customers
    .Where(c => c.CompanyId == currentCompanyId) // REQUIRED
    .ToListAsync();
```

### BaseService Pattern

Standardized CRUD operations with built-in multi-tenancy:

```csharp
public class CustomerService : BaseService<Customer>, ICustomerService
{
    protected override DbSet<Customer> DbSet => _context.Customers;
    protected override string CompanyIdPropertyName => nameof(Customer.CompanyId);
}
```

### Database Design

- **Table-Per-Type (TPT)** inheritance preventing foreign key conflicts
- **Soft delete** with global query filters
- **Audit logging** for all entity operations
- **Optimistic concurrency** with RowVersion
- **Unique constraints** for business documents per company

## 🚀 Quick Start

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server LocalDB](https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb) or Azure SQL Database
- [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service) (optional for AI features)

### 1. Clone and Setup

```powershell
git clone <repository-url>
cd botaccount

# Backend setup
cd backend
dotnet restore
dotnet ef database update

# Frontend setup
cd ../front
npm install
```

### 2. Configuration

Update `backend/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=AccountingSaaS_Dev;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true;"
  },
  "AI": {
    "AzureOpenAI": {
      "Endpoint": "https://your-openai-resource.openai.azure.com/",
      "ApiKey": "your-api-key",
      "DeploymentName": "gpt-4o-mini"
    }
  }
}
```

### 3. Run the Application

```powershell
# Terminal 1 - Backend API (Port 5121)
cd backend
dotnet run

# Terminal 2 - Frontend (Port 5173)
cd front
npm run dev
```

Navigate to `http://localhost:5173` to access the application.

## 📁 Project Structure

```text
├── backend/                    # .NET 8 Web API
│   ├── Controllers/           # API endpoints with pagination
│   ├── Services/Core/         # BaseService pattern implementation
│   ├── Services/Interfaces/   # Service contracts
│   ├── Models/               # EF Core entities (TenantEntity pattern)
│   ├── DTOs/                 # Data transfer objects
│   ├── Data/                 # DbContext and migrations
│   ├── Configuration/        # Azure services configuration
│   └── Migrations/           # EF Core database migrations
│
├── front/                     # React 19 + TypeScript frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route-level components
│   │   ├── services/        # API clients
│   │   ├── stores/          # Zustand state management
│   │   ├── types/           # TypeScript interfaces
│   │   ├── styles/          # Material-UI theme and styles
│   │   └── utils/           # Helper functions
│   └── public/              # Static assets
│
├── .github/                   # GitHub workflows and documentation
└── docs/                     # Additional documentation
```

## 🔧 Development Workflow

### Database Migrations

```powershell
# Add new migration
dotnet ef migrations add YourMigrationName

# Apply migrations to database
dotnet ef database update

# Production deployment
dotnet ef database update --environment Production
```

### API Development

- All controllers return `PaginatedResponse<T>` for list endpoints
- Frontend services MUST extract `.data` property from responses
- Multi-tenant security enforced via `BaseService<T>` pattern

### Frontend Development

- Use unified styles from `src/styles/formStyles.ts`
- Always use DataGrid (not Table) for data listing
- Import and apply consistent Material-UI themes
- Support both Hebrew (RTL) and English (LTR) layouts

## 🇮🇱 Israeli Compliance Features

### Tax Authority Integration (מבנה אחיד)

Automatic generation of required export files:

- **INI.TXT**: Index file with record counts
- **BKMVDATA.TXT**: Complete business data export
- **Formatted for Israeli Tax Authority** specifications v1.31

### Localization Support

- **Currency**: Israeli Shekel (₪) with proper formatting
- **VAT**: 18% Israeli VAT rate built-in
- **Tax ID**: Israeli business number validation with check digit
- **Hebrew UI**: Full RTL support with conditional text rendering

## 🤖 AI Features

### Intelligent Assistant

- **Natural Language Queries**: "What was our revenue last quarter?"
- **Document Processing**: Automatic invoice and receipt data extraction
- **Financial Insights**: AI-powered analytics and trend analysis
- **Hebrew Language Support**: Native Hebrew conversation capabilities

### Azure OpenAI Integration

```csharp
public class AIAssistantService
{
    // Function calling with Hebrew descriptions
    public List<FunctionDefinition> GetFunctions() => new()
    {
        new() { Name = "getCustomersList", Description = "קבלת רשימת לקוחות" },
        new() { Name = "generateReport", Description = "יצירת דוח כספי" }
    };
}
```

## 🔒 Security & Data Protection

### Multi-Tenant Security

- **Row-level security** with automatic CompanyId filtering
- **Data isolation** preventing cross-tenant data access
- **Audit logging** for all business operations
- **Soft deletes** maintaining data integrity

### Azure Security Features

- **Managed Identity** for service-to-service authentication
- **Key Vault** for secrets management
- **TLS encryption** for all data in transit
- **Transparent Data Encryption (TDE)** for data at rest

## 📊 Business Modules

### Core Accounting

- Chart of Accounts with hierarchical structure
- Journal entries with automatic posting
- Financial reports (P&L, Balance Sheet)
- Multi-currency support

### Sales Management

- Customer database with contact management
- Sales orders and invoicing
- Quote generation and conversion
- Receipt tracking and payments

### Purchasing

- Supplier management
- Purchase orders and receiving
- Vendor invoice processing
- Payment scheduling

### Inventory Control

- Item master with SKU management
- Stock level tracking and alerts
- Bill of Materials (BOM) for manufacturing
- Transaction history and auditing

### Point of Sale (POS)

- Touch-friendly cashier interface
- Offline mode with sync capability
- Multiple payment methods
- Real-time inventory updates

## 🚀 Deployment

### Azure Deployment

The platform is designed for Azure cloud deployment with:

- **Azure App Service** or **Container Apps** for hosting
- **Azure SQL Database** with elastic pools for multi-tenancy
- **Azure Storage** for document attachments
- **Azure Monitor** for observability and alerting

### Development Environment

```powershell
# Quick development setup
cd backend ; dotnet run  # Port 5121 (HTTPS required)
cd front ; npm run dev   # Port 5173
```

## 📈 Scalability & Performance

### Auto-scaling Architecture

- **Horizontal scaling** with Azure App Service plans
- **Database elasticity** with Azure SQL elastic pools
- **CDN integration** with Azure Front Door
- **Caching layer** with Azure Cache for Redis

### Performance Optimizations

- **Database indexing** for common query patterns
- **Paginated APIs** to prevent large data transfers
- **Lazy loading** in React components
- **Optimistic concurrency** for data consistency

## 🤝 Contributing

### Development Guidelines

1. Follow the established **BaseService pattern** for all business logic
2. Ensure **multi-tenant security** in all data operations
3. Use **Material-UI components** with unified styling
4. Implement proper **error handling** and **validation**
5. Write **comprehensive tests** for new features

### Code Style

- **Backend**: Follow C# conventions with XML documentation
- **Frontend**: Use TypeScript strict mode with ESLint
- **Database**: Use descriptive naming with proper indexing
- **API**: RESTful design with consistent response patterns

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support and documentation:

- 📧 Email: [support@example.com](mailto:support@example.com)
- 📖 Documentation: [Project Wiki](./docs)
- 🐛 Issues: [GitHub Issues](./issues)

---

**Built with ❤️ for Israeli businesses** • Supporting local commerce with cutting-edge technology
