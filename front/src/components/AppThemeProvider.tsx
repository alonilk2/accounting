import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { heIL, enUS } from '@mui/material/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he, enUS as enUSDateFns } from 'date-fns/locale';
import type { ReactNode } from 'react';
import { useUIStore } from '../stores';

// Define modern color palette for Israeli business context
const customColors = {
  primary: {
    main: '#3b82f6', // Modern blue
    light: '#60a5fa',
    dark: '#2563eb',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#f59e0b', // Warm amber
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#000000',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  info: {
    main: '#06b6d4',
    light: '#22d3ee',
    dark: '#0891b2',
  },
  grey: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

// Hebrew RTL theme configuration
const createAppTheme = (mode: 'light' | 'dark', language: 'en' | 'he') => {
  const isRTL = language === 'he';
  const locale = language === 'he' ? heIL : enUS;

  return createTheme(
    {
      direction: isRTL ? 'rtl' : 'ltr',
      palette: {
        mode,
        ...customColors,
        background: {
          default: mode === 'light' ? '#f8fafc' : '#0f172a',
          paper: mode === 'light' ? '#ffffff' : '#1e293b',
        },
        text: {
          primary: mode === 'light' ? '#1f2937' : '#f9fafb',
          secondary: mode === 'light' ? '#6b7280' : '#9ca3af',
        },
        divider: mode === 'light' ? '#e5e7eb' : '#374151',
      },
      typography: {
        fontFamily: [
          'Inter',
          // Hebrew fonts
          'Segoe UI',
          'Tahoma',
          'Arial Hebrew',
          // English fonts
          'Roboto',
          '"Helvetica Neue"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ].join(','),
        h1: {
          fontSize: '3.25rem',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.025em',
        },
        h2: {
          fontSize: '2.75rem',
          fontWeight: 600,
          lineHeight: 1.25,
          letterSpacing: '-0.015em',
        },
        h3: {
          fontSize: '2.25rem',
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
        },
        h4: {
          fontSize: '1.875rem',
          fontWeight: 600,
          lineHeight: 1.35,
        },
        h5: {
          fontSize: '1.5rem',
          fontWeight: 600,
          lineHeight: 1.4,
        },
        h6: {
          fontSize: '1.375rem',
          fontWeight: 600,
          lineHeight: 1.45,
        },
        body1: {
          fontSize: '1.125rem',
          lineHeight: 1.6,
          letterSpacing: '0.00938em',
        },
        body2: {
          fontSize: '1rem',
          lineHeight: 1.57,
          letterSpacing: '0.00714em',
        },
        button: {
          textTransform: 'none',
          fontWeight: 500,
          letterSpacing: '0.02em',
          fontSize: '1.125rem',
        },
        caption: {
          fontSize: '0.875rem',
          lineHeight: 1.66,
          letterSpacing: '0.03333em',
        },
      },
      spacing: (factor: number) => `${0.375 * factor}rem`, // 6px base unit (increased from 4px)
      shape: {
        borderRadius: 16, // More rounded default (increased from 12)
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              direction: isRTL ? 'rtl' : 'ltr',
              background: mode === 'light' 
                ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              minHeight: '100vh',
            },
            '*': {
              boxSizing: 'border-box',
            },
            html: {
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: mode === 'light' 
                ? '0 4px 20px rgba(0, 0, 0, 0.08)' 
                : '0 4px 20px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(20px)',
              backgroundColor: mode === 'light' 
                ? 'rgba(255, 255, 255, 0.95)' 
                : 'rgba(30, 41, 59, 0.95)',
              borderBottom: `1px solid ${mode === 'light' ? '#e5e7eb' : '#374151'}`,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              boxShadow: mode === 'light'
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
              borderRadius: 16,
              border: `1px solid ${mode === 'light' ? '#f1f5f9' : '#334155'}`,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: mode === 'light'
                  ? '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  : '0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.2)',
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              textTransform: 'none',
              fontWeight: 500,
              padding: '16px 32px',
              fontSize: '1rem',
              lineHeight: 1.5,
              minHeight: 52,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            },
            contained: {
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(0)',
              },
            },
            outlined: {
              borderWidth: '2px',
              '&:hover': {
                borderWidth: '2px',
                backgroundColor: mode === 'light' ? '#f8fafc' : '#334155',
              },
            },
            text: {
              '&:hover': {
                backgroundColor: mode === 'light' ? '#f8fafc' : '#334155',
              },
            },
            sizeSmall: {
              padding: '12px 24px',
              fontSize: '0.9375rem',
              minHeight: 44,
            },
            sizeLarge: {
              padding: '20px 40px',
              fontSize: '1.125rem',
              minHeight: 60,
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 16,
                fontSize: '1.125rem',
                minHeight: '56px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                },
                '&.Mui-focused': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                },
              },
              '& .MuiInputLabel-root': {
                fontWeight: 500,
                fontSize: '1.125rem',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              border: `1px solid ${mode === 'light' ? '#e5e7eb' : '#374151'}`,
            },
            elevation1: {
              boxShadow: mode === 'light'
                ? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
                : '0 4px 6px rgba(0, 0, 0, 0.3)',
            },
            elevation4: {
              boxShadow: mode === 'light'
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              fontWeight: 500,
              fontSize: '0.875rem',
              height: 36,
              '& .MuiChip-label': {
                padding: '0 16px',
                fontSize: '0.875rem',
              },
            },
            sizeSmall: {
              height: 28,
              fontSize: '0.75rem',
              '& .MuiChip-label': {
                padding: '0 12px',
                fontSize: '0.75rem',
              },
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 20,
              padding: '8px',
            },
          },
        },
        MuiDivider: {
          styleOverrides: {
            root: {
              borderColor: mode === 'light' ? '#e5e7eb' : '#374151',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              borderRadius: isRTL ? '0 20px 20px 0' : '0 0 20px 20px',
              border: 'none',
              boxShadow: mode === 'light' 
                ? '4px 0 20px rgba(0, 0, 0, 0.08)' 
                : '4px 0 20px rgba(0, 0, 0, 0.3)',
              background: mode === 'light' 
                ? 'rgba(255, 255, 255, 0.95)' 
                : 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(20px)',
              ...(isRTL ? {
                borderLeft: `1px solid ${mode === 'light' ? '#e5e7eb' : '#374151'}`,
                borderRight: 'none',
              } : {
                borderRight: `1px solid ${mode === 'light' ? '#e5e7eb' : '#374151'}`,
                borderLeft: 'none',
              }),
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              margin: '4px 8px',
              padding: '12px 16px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: mode === 'light' ? '#f1f5f9' : '#334155',
                transform: 'translateX(4px)',
              },
              '&.Mui-selected': {
                backgroundColor: mode === 'light' ? '#dbeafe' : '#1e40af',
                '&:hover': {
                  backgroundColor: mode === 'light' ? '#bfdbfe' : '#1d4ed8',
                },
              },
            },
          },
        },
        MuiListItemIcon: {
          styleOverrides: {
            root: {
              minWidth: 40,
              color: 'inherit',
            },
          },
        },
        MuiTable: {
          styleOverrides: {
            root: {
              borderCollapse: 'separate',
              borderSpacing: '0 8px',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderBottom: 'none',
              padding: '16px',
            },
            head: {
              fontWeight: 600,
              backgroundColor: mode === 'light' ? '#f8fafc' : '#1e293b',
              color: mode === 'light' ? '#374151' : '#e2e8f0',
            },
            body: {
              backgroundColor: mode === 'light' ? '#ffffff' : '#334155',
              '&:first-of-type': {
                borderTopLeftRadius: 12,
                borderBottomLeftRadius: 12,
              },
              '&:last-of-type': {
                borderTopRightRadius: 12,
                borderBottomRightRadius: 12,
              },
            },
          },
        },
      },
    },
    locale
  );
};

interface AppThemeProviderProps {
  children: ReactNode;
}

export const AppThemeProvider = ({ children }: AppThemeProviderProps) => {
  const { theme, language } = useUIStore();
  const appTheme = createAppTheme(theme, language);
  const dateLocale = language === 'he' ? he : enUSDateFns;

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default AppThemeProvider;
