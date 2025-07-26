# UI Design System - AI Accounting SaaS

Modern Material-UI design system with Hebrew RTL support and dark/light mode compatibility.

## Style Files Architecture

- **`src/styles/formStyles.ts`**: Standard form components, buttons, dialogs, data grids
- **`src/styles/enhancedStyles.ts`**: Larger proportions for enhanced user experience (700px grids, 64px inputs)
- **`src/styles/globalStyles.css`**: Global overrides for minimum component sizes
- **`src/components/AppThemeProvider.tsx`**: Theme configuration with Hebrew RTL support

## Usage Pattern

```tsx
// Import unified styles from formStyles.ts
import { textFieldStyles, dialogStyles, paperStyles, dataGridStyles, buttonStyles } from '../styles/formStyles';
// OR import enhanced styles for larger components
import { enhancedDataGridStyles, enhancedButtonStyles, enhancedCardStyles } from '../styles/enhancedStyles';

// Apply consistently across components
<TextField sx={textFieldStyles} />
<Button sx={buttonStyles.primary} />
<Paper sx={paperStyles} />
<Dialog sx={dialogStyles} />
<DataGrid sx={dataGridStyles} /> // Or enhancedDataGridStyles for larger grids
```

## Color Usage Guidelines

- **Backgrounds**: Always use `'background.default'` and `'background.paper'`
- **Text**: Use `'text.primary'` and `'text.secondary'`
- **Borders**: Use `theme.palette.divider` for consistent borders
- **Interactive elements**: Conditional styling `theme.palette.mode === 'light'` checks
- **Glass effects**: Semi-transparent backgrounds with `backdropFilter: 'blur(20px)'`

## CRITICAL DESIGN RULES

1. **Always use DataGrid for data tables**: NEVER use MUI Table for listing data. Always use DataGrid from `@mui/x-data-grid` with proper styling
2. **Always import unified styles**: Choose between `formStyles` (standard) or `enhancedStyles` (larger) consistently
3. **Theme-aware colors**: Never hardcode colors, always use theme palette properties
4. **Glass morphism effects**: Use semi-transparent backgrounds with backdrop filters for modern UI
5. **Hover animations**: All interactive elements need `transform: 'translateY(-1px)'` and enhanced shadows
6. **Consistent border radius**: 2-3 for inputs, 3-4 for cards, 5+ for dialogs
7. **RTL support**: Conditional `isHebrew ? 'right' : 'left'` for text alignment and direction
8. **Responsive typography**: Font sizes range from 1rem (base) to 1.25rem+ (headers)

## Hebrew RTL Support

```tsx
const { language } = useUIStore();
const isHebrew = language === 'he';

// Text direction
<Typography sx={{ 
  textAlign: isHebrew ? 'right' : 'left',
  direction: isHebrew ? 'rtl' : 'ltr' 
}}>
  {isHebrew ? 'עברית' : 'English'}
</Typography>

// Conditional styling
<Box sx={{
  marginLeft: isHebrew ? 0 : 2,
  marginRight: isHebrew ? 2 : 0,
}}>
```

## Component Examples

### Standard TextField
```tsx
<TextField
  sx={textFieldStyles}
  label={isHebrew ? 'שם הלקוח' : 'Customer Name'}
  value={customerName}
  onChange={(e) => setCustomerName(e.target.value)}
/>
```

### Enhanced DataGrid
```tsx
<DataGrid
  sx={enhancedDataGridStyles}
  rows={customers}
  columns={columns}
  paginationMode="server"
  localeText={{
    // Hebrew localization
    noRowsLabel: isHebrew ? 'אין נתונים' : 'No rows',
    toolbarDensityLabel: isHebrew ? 'צפיפות' : 'Density',
  }}
/>
```

## Glass Morphism Effects

```tsx
// Modern glass container
<Box sx={{
  background: theme.palette.mode === 'dark' 
    ? 'rgba(18, 18, 18, 0.7)'
    : 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px)',
  borderRadius: 4,
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
    : '0 8px 32px rgba(0, 0, 0, 0.1)',
}}>
```
