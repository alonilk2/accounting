import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { heIL, enUS } from '@mui/material/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he, enUS as enUSDateFns } from 'date-fns/locale';
import type { ReactNode } from 'react';
import { useUIStore } from '../stores';

// Define custom color palette for Israeli business context
const customColors = {
  primary: {
    main: '#1976d2', // Professional blue
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#f57c00', // Orange accent
    light: '#ffb74d',
    dark: '#e65100',
    contrastText: '#000000',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
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
          default: mode === 'light' ? '#f5f5f5' : '#121212',
          paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
        },
      },
      typography: {
        fontFamily: [
          // Hebrew fonts
          'Segoe UI',
          'Tahoma',
          'Arial',
          // English fonts
          'Roboto',
          '"Helvetica Neue"',
          'sans-serif',
        ].join(','),
        h1: {
          fontSize: '2.5rem',
          fontWeight: 600,
          lineHeight: 1.2,
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 600,
          lineHeight: 1.3,
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 600,
          lineHeight: 1.4,
        },
        h4: {
          fontSize: '1.5rem',
          fontWeight: 600,
          lineHeight: 1.4,
        },
        h5: {
          fontSize: '1.25rem',
          fontWeight: 600,
          lineHeight: 1.5,
        },
        h6: {
          fontSize: '1rem',
          fontWeight: 600,
          lineHeight: 1.6,
        },
        body1: {
          fontSize: '1rem',
          lineHeight: 1.5,
        },
        body2: {
          fontSize: '0.875rem',
          lineHeight: 1.43,
        },
        button: {
          textTransform: 'none', // Disable uppercase transformation
          fontWeight: 500,
        },
      },
      spacing: 8,
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              direction: isRTL ? 'rtl' : 'ltr',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 12,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              textTransform: 'none',
              fontWeight: 500,
              padding: '8px 16px',
            },
            contained: {
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              },
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 8,
              },
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              ...(isRTL ? {
                borderLeft: mode === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRight: 'none',
              } : {
                borderRight: mode === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
                borderLeft: 'none',
              }),
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
