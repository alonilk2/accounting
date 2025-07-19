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

### Document Separation (July 2025 Update)

- **SalesOrder**: Quotations & order management (`Quote → Confirmed → Shipped → Completed`)
- **Invoice**: Separate billing documents (`Draft → Sent → Paid → Overdue`)
- **Migration**: `SeparateInvoicesFromSalesOrders` - invoices no longer tied to sales order status

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

```bash
# Backend (HTTPS required)
cd backend && dotnet run  # Port 5121
dotnet ef migrations add MigrationName && dotnet ef database update

# Frontend
cd front && npm run dev  # Port 5173
```

## Service Registration Pattern

```csharp
// Services/ServiceRegistration.cs - register ALL services here
services.AddScoped<ISalesOrderService, SalesOrderService>();
services.AddScoped<IInvoiceService, InvoiceService>();
// AI Services with Azure Managed Identity
services.AddScoped<IAIAssistantService, AIAssistantService>();
services.AddScoped<ICustomerFunctionService, CustomerFunctionService>();
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

## Israeli Compliance & Localization

- **Tax ID**: Use `CompanyService.ValidateTaxIdAsync()` (Israeli check digit algorithm)
- **VAT Rate**: 17% standard Israeli VAT in service calculations
- **Currency**: Default "ILS" for all Israeli businesses, format with ₪
- **Print Templates**: Hebrew RTL support in `src/components/print/`
- **Hebrew UI**: All text uses conditional `language === 'he' ? 'עברית' : 'English'`

## Frontend Stack

- **State**: Zustand stores in `src/stores/index.ts` (AuthStore, UIStore pattern)
- **Types**: TypeScript interfaces in `src/types/entities.ts` mirror backend models exactly
- **UI**: Material-UI with Hebrew RTL theme support in `AppThemeProvider.tsx`
- **Print**: `react-to-print` for browser-based document printing
- **Routing**: React Router with navigation in `MainLayout.tsx`

## UI Conventions

- **RTL Support**: Theme auto-configures for Hebrew `direction: 'rtl'`
- **Dark Mode**: Supports both light and dark themes with automatic toggle
- **Modern Design**: Custom theme with rounded corners, elevated shadows
- **Colors**: Israeli business context (blue primary, amber secondary)
- **Typography**: Hebrew fonts (`Noto Sans Hebrew`) with English fallbacks
- **MUI Grid**: ALWAYS use MUI Grid with the following format:
```
<Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
{Array.from(Array(6)).map((_, index) => (
<Grid key={index} size={{ xs: 2, sm: 4, md: 4 }}>
<Item>{index + 1}</Item>
</Grid>
))}
</Grid>
```

## Component Design System (Dark/Light Mode Compatible)

### Page Layout Structure
```tsx
// Main container for all pages
<Box sx={{ 
  p: { xs: 3, md: 4 }, 
  backgroundColor: 'background.default',
  minHeight: '100vh'
}}>
  {/* Page Header */}
  <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
    <Typography variant="h3" sx={{ 
      display: "flex", alignItems: "center", gap: 2,
      fontWeight: 600, color: 'primary.main'
    }}>
      <IconComponent sx={{ fontSize: 40 }} />
      {language === 'he' ? 'עברית' : 'English'}
    </Typography>
    <Box display="flex" gap={2}>
      {/* Action buttons */}
    </Box>
  </Box>

  {/* Main Content Paper */}
  <Paper sx={paperStyles}>
    {/* Content */}
  </Paper>
</Box>
```

### Form & Input Styles (Import from `../styles/formStyles`)
```tsx
// Unified text field styling
export const textFieldStyles: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    fontSize: '1.1rem',
    backgroundColor: 'background.paper',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: (theme) => theme.palette.mode === 'light' 
        ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)',
      transform: 'translateY(-1px)',
      boxShadow: (theme) => theme.palette.mode === 'light'
        ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.3)',
    },
    '&.Mui-focused': {
      backgroundColor: 'background.paper',
      transform: 'translateY(-1px)',
      boxShadow: (theme) => `0 2px 12px ${theme.palette.primary.main}40`,
    }
  },
  '& .MuiInputLabel-root': {
    fontSize: '1rem',
    fontWeight: 500,
  }
};

// Paper container styling
export const paperStyles: SxProps<Theme> = {
  p: 4, borderRadius: 3,
  backgroundColor: 'background.paper',
  border: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : theme.palette.divider}`,
  boxShadow: (theme) => theme.palette.mode === 'light' 
    ? '0 2px 12px rgba(0,0,0,0.04)' : '0 4px 20px rgba(0,0,0,0.3)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
};
```

### Button Styling Standards
```tsx
// Primary action buttons
sx={buttonStyles.primary} = {
  borderRadius: 3, px: 4, py: 1.5,
  fontSize: '1rem', fontWeight: 600,
  boxShadow: (theme) => theme.palette.mode === 'light'
    ? '0 4px 12px rgba(25, 118, 210, 0.3)'
    : '0 4px 12px rgba(59, 130, 246, 0.4)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: (theme) => theme.palette.mode === 'light'
      ? '0 6px 20px rgba(25, 118, 210, 0.4)'
      : '0 6px 20px rgba(59, 130, 246, 0.5)',
  }
}

// Secondary/outlined buttons
sx={buttonStyles.secondary} = {
  borderRadius: 3, px: 3, py: 1.5,
  fontSize: '1rem', fontWeight: 500,
  '&:hover': {
    transform: 'translateY(-1px)',
    backgroundColor: (theme) => theme.palette.mode === 'light' 
      ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
  }
}
```

### DataGrid Styling (Dark/Light Compatible)
```tsx
export const dataGridStyles: SxProps<Theme> = {
  height: 600, width: '100%',
  '& .MuiDataGrid-root': {
    borderRadius: 2, fontSize: '1rem',
    backgroundColor: 'background.paper',
    border: (theme) => `1px solid ${theme.palette.divider}`,
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: (theme) => theme.palette.mode === 'light' 
      ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)',
    '& .MuiDataGrid-columnHeaderTitle': {
      color: 'text.primary', fontWeight: 600,
    }
  },
  '& .MuiDataGrid-row': {
    '&:hover': {
      backgroundColor: (theme) => theme.palette.mode === 'light'
        ? 'rgba(25, 118, 210, 0.04)' : 'rgba(59, 130, 246, 0.08)',
    }
  }
};
```

### Dialog & Modal Styling
```tsx
export const dialogStyles: SxProps<Theme> = {
  '& .MuiDialog-paper': {
    borderRadius: 3, p: 2,
    backgroundColor: 'background.paper',
    border: (theme) => `1px solid ${theme.palette.divider}`,
    boxShadow: (theme) => theme.palette.mode === 'light'
      ? '0 8px 32px rgba(0,0,0,0.12)' : '0 8px 32px rgba(0,0,0,0.4)',
  }
};
```

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

### Component Standards & Best Practices

#### Search Fields
```tsx
<TextField
  fullWidth variant="outlined"
  placeholder={language === 'he' ? 'חיפוש...' : 'Search...'}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: 2, fontSize: '1.1rem',
      backgroundColor: 'background.paper',
      '&:hover': {
        backgroundColor: (theme) => theme.palette.mode === 'light' 
          ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)',
      }
    }
  }}
  InputProps={{
    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
  }}
/>
```

#### Status Chips
```tsx
<Chip
  label={isActive ? (language === 'he' ? 'פעיל' : 'Active') : (language === 'he' ? 'לא פעיל' : 'Inactive')}
  color={isActive ? 'success' : 'default'}
  size="small"
  sx={{ fontSize: '0.875rem', fontWeight: 500, borderRadius: 2 }}
/>
```

#### Action Buttons Layout
```tsx
<Box display="flex" gap={2}>
  <Button variant="outlined" startIcon={<RefreshIcon />} sx={buttonStyles.secondary}>
    {language === 'he' ? 'רענן' : 'Refresh'}
  </Button>
  <Button variant="contained" startIcon={<AddIcon />} sx={buttonStyles.primary}>
    {language === 'he' ? 'הוסף' : 'Add'}
  </Button>
</Box>
```

#### Form Dialog Structure
```tsx
<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={dialogStyles}>
  <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 600, color: 'text.primary', pb: 2 }}>
    {language === 'he' ? 'כותרת' : 'Title'}
  </DialogTitle>
  <DialogContent>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
      {/* Form fields with textFieldStyles */}
    </Box>
  </DialogContent>
  <DialogActions sx={{ p: 3, gap: 2 }}>
    <Button variant="outlined" sx={buttonStyles.secondary}>Cancel</Button>
    <Button variant="contained" sx={buttonStyles.primary}>Save</Button>
  </DialogActions>
</Dialog>
```

#### Loading States
```tsx
<Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
  <Box sx={{ 
    display: "flex", justifyContent: "center", alignItems: "center", 
    minHeight: 300, flexDirection: "column", gap: 2 
  }}>
    <CircularProgress size={48} />
    <Typography variant="body1" color="inherit" sx={{ fontSize: '1.1rem' }}>
      {language === 'he' ? 'טוען...' : 'Loading...'}
    </Typography>
  </Box>
</Backdrop>
```

#### Error Handling
```tsx
<Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
  {errorMessage}
</Alert>

<Snackbar open={snackbar.open} autoHideDuration={6000} onClose={closeSnackbar}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
  <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
    {snackbar.message}
  </Alert>
</Snackbar>
```

### CRITICAL DESIGN RULES
1. **Always import styles**: `import { textFieldStyles, dialogStyles, paperStyles, dataGridStyles, buttonStyles } from '../styles/formStyles';`
2. **Use theme-aware colors**: Never hardcode colors, always use theme palette
3. **Consistent spacing**: Use theme spacing (multiples of 0.25rem)
4. **Hover effects**: All interactive elements must have subtle hover animations
5. **Border radius**: Standard 2-3 units for inputs, 3 for dialogs/papers
6. **Typography**: Consistent font weights (500 for labels, 600 for headers)
7. **RTL support**: All layouts must work in both Hebrew (RTL) and English (LTR)

## API Conventions

- RESTful: `/api/[controller]/[action]`
- DTOs for data transfer (never expose entities directly)
- Multi-tenant: `companyId` parameter on ALL tenant operations
- Document endpoints: `/api/sales`, `/api/invoices`, `/api/invoices/from-sales-order/{id}`
