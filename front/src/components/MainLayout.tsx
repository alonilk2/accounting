import { useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Switch,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  People,
  Business,
  Inventory,
  Receipt,
  ShoppingCart,
  AccountBalance,
  BarChart,
  Settings,
  Brightness4,
  Brightness7,
  AccountCircle,
  Logout,
  Language,
  AutoAwesome,
  TrendingUp,
  Insights,
  SmartToy,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../stores';
import { AccessibilityButton } from './accessibility';

// Inject global styles for animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 0.5; }
      50% { opacity: 1; }
      100% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}

const drawerWidth = 320;

interface NavItem {
  text: string;
  textHe: string;
  icon: React.ReactElement;
  path: string;
  section?: string;
  isAI?: boolean;
  badge?: string;
}

const navigationItems: NavItem[] = [
  { text: 'Dashboard', textHe: 'לוח בקרה', icon: <Dashboard />, path: '/', isAI: true },
  { text: 'AI Insights', textHe: 'תובנות AI', icon: <Insights />, path: '/ai-insights', section: 'AI Analytics', isAI: true, badge: 'AI' },
  { text: 'Smart Analytics', textHe: 'אנליטיקה חכמה', icon: <TrendingUp />, path: '/smart-analytics', section: 'AI Analytics', isAI: true, badge: 'AI' },
  { text: 'Customers', textHe: 'לקוחות', icon: <People />, path: '/customers', section: 'Sales' },
  { text: 'Sales Orders', textHe: 'הזמנות מכירה', icon: <Receipt />, path: '/sales', section: 'Sales' },
  { text: 'Suppliers', textHe: 'ספקים', icon: <Business />, path: '/suppliers', section: 'Purchasing' },
  { text: 'Purchase Orders', textHe: 'הזמנות רכש', icon: <ShoppingCart />, path: '/purchases', section: 'Purchasing' },
  { text: 'Inventory', textHe: 'מלאי', icon: <Inventory />, path: '/inventory', section: 'Inventory' },
  { text: 'Chart of Accounts', textHe: 'תרשים חשבונות', icon: <AccountBalance />, path: '/accounts', section: 'Accounting' },
  { text: 'Reports', textHe: 'דוחות', icon: <BarChart />, path: '/reports', section: 'Reports' },
  { text: 'AI Assistant', textHe: 'עוזר AI', icon: <SmartToy />, path: '/ai-assistant', section: 'System', isAI: true, badge: 'AI' },
  { text: 'Settings', textHe: 'הגדרות', icon: <Settings />, path: '/settings', section: 'System' },
];

const sectionTitles = {
  'AI Analytics': { en: 'AI Analytics', he: 'אנליטיקה חכמה' },
  Sales: { en: 'Sales', he: 'מכירות' },
  Purchasing: { en: 'Purchasing', he: 'רכש' },
  Inventory: { en: 'Inventory', he: 'מלאי' },
  Accounting: { en: 'Accounting', he: 'הנהלת חשבונות' },
  Reports: { en: 'Reports', he: 'דוחות' },
  System: { en: 'System', he: 'מערכת' },
};

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const { user, company, logout } = useAuthStore();
  const { 
    theme: currentTheme, 
    setTheme, 
    language, 
    setLanguage 
  } = useUIStore();

  const isRTL = language === 'he';
  const sidebarOpen = true; // Always keep sidebar open

  const handleThemeToggle = () => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  };

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'he' : 'en');
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const displayText = language === 'he' ? item.textHe : item.text;
    
    return (
      <ListItem key={item.path} disablePadding>
        <ListItemButton
          selected={isActive}
          onClick={() => navigate(item.path)}
          sx={{
            borderRadius: 2,
            mx: 1,
            mb: 0.5,
            position: 'relative',
            background: item.isAI && !isActive 
              ? `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`
              : 'transparent',
            border: item.isAI ? `1px solid ${theme.palette.primary.main}20` : 'none',
            '&.Mui-selected': {
              background: item.isAI 
                ? `linear-gradient(135deg, ${theme.palette.primary.main}30, ${theme.palette.secondary.main}20)`
                : theme.palette.primary.main + '20',
              '&:hover': {
                background: item.isAI 
                  ? `linear-gradient(135deg, ${theme.palette.primary.main}40, ${theme.palette.secondary.main}30)`
                  : theme.palette.primary.main + '30',
              },
            },
            '&:hover': {
              background: item.isAI && !isActive
                ? `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`
                : undefined,
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isActive ? 'translateX(4px)' : 'translateX(0)',
          }}
        >
          <ListItemIcon
            sx={{
              color: isActive ? theme.palette.primary.main : 'inherit',
              minWidth: 40,
              '& svg': {
                filter: item.isAI ? 'drop-shadow(0 0 4px rgba(25, 118, 210, 0.3))' : 'none',
              },
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? theme.palette.primary.main : 'inherit',
                  }}
                >
                  {displayText}
                </Typography>
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      height: 18,
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      color: 'white',
                      '& .MuiChip-label': {
                        px: 0.75,
                      },
                    }}
                  />
                )}
                {item.isAI && (
                  <AutoAwesome 
                    sx={{ 
                      fontSize: 16, 
                      color: theme.palette.primary.main,
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 0.5 },
                        '50%': { opacity: 1 },
                        '100%': { opacity: 0.5 },
                      },
                    }} 
                  />
                )}
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const groupedItems = navigationItems.reduce((acc, item) => {
    const section = item.section || 'Main';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Company Header */}
      <Box sx={{ 
        p: 2, 
        background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}05)`,
        borderBottom: `1px solid ${theme.palette.divider}`,
        position: 'relative',
        overflow: 'visible',
        minHeight: 'auto',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}05, transparent)`,
          zIndex: 0,
        },
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                flexShrink: 0,
              }}
            >
              {company?.name?.charAt(0) || 'A'}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 700, 
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                  overflow: 'visible',
                }}
              >
                {company?.name || 'AI Accounting System'}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  lineHeight: 1.3,
                  mt: 0.5,
                  wordBreak: 'break-word',
                  overflow: 'visible',
                }}
              >
                {company?.israelTaxId ? `Tax ID: ${company.israelTaxId}` : 'Smart Business Management'}
              </Typography>
            </Box>
          </Box>
          
          {/* AI Status Indicator */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${theme.palette.primary.main}30`,
          }}>
            <SmartToy sx={{ 
              fontSize: 16, 
              color: theme.palette.primary.main,
              animation: 'pulse 2s infinite',
            }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              {language === 'he' ? 'AI פעיל' : 'AI Active'}
            </Typography>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: 'success.main',
              ml: 'auto',
              animation: 'pulse 1.5s infinite',
            }} />
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        {Object.entries(groupedItems).map(([section, items]) => (
          <Box key={section}>
            {section !== 'Main' && (
              <Box sx={{ 
                px: 2, 
                py: 1.5, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
              }}>
                {section === 'AI Analytics' && (
                  <AutoAwesome sx={{ 
                    fontSize: 16, 
                    color: theme.palette.primary.main,
                    animation: 'pulse 2s infinite',
                  }} />
                )}
                <Typography
                  variant="overline"
                  sx={{
                    color: section === 'AI Analytics' ? theme.palette.primary.main : 'text.secondary',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {sectionTitles[section as keyof typeof sectionTitles]?.[language] || section}
                </Typography>
              </Box>
            )}
            <List dense>
              {items.map(renderNavItem)}
            </List>
            {section !== 'System' && <Divider sx={{ my: 1.5, mx: 2 }} />}
          </Box>
        ))}
      </Box>

      {/* Theme and Language Controls */}
      <Box sx={{ 
        p: 2.5, 
        borderTop: `1px solid ${theme.palette.divider}`,
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1.5,
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 1.5,
            borderRadius: 2,
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${theme.palette.divider}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {currentTheme === 'dark' ? <Brightness4 sx={{ fontSize: 18 }} /> : <Brightness7 sx={{ fontSize: 18 }} />}
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {language === 'he' ? 'מצב כהה' : 'Dark Mode'}
              </Typography>
            </Box>
            <Switch
              checked={currentTheme === 'dark'}
              onChange={handleThemeToggle}
              size="small"
              sx={{
                '& .MuiSwitch-thumb': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                },
              }}
            />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 1.5,
            borderRadius: 2,
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${theme.palette.divider}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Language sx={{ fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {language === 'he' ? 'עברית' : 'Hebrew'}
              </Typography>
            </Box>
            <Switch
              checked={language === 'he'}
              onChange={handleLanguageToggle}
              size="small"
              sx={{
                '& .MuiSwitch-thumb': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ...(isRTL ? {
            mr: { md: `${drawerWidth}px` },
          } : {
            ml: { md: `${drawerWidth}px` },
          }),
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.primary.main}10)`
            : `linear-gradient(135deg, rgba(255,255,255,0.95), ${theme.palette.primary.main}05)`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <AutoAwesome sx={{ 
              color: theme.palette.primary.main, 
              fontSize: 24,
              animation: 'pulse 2s infinite',
            }} />
            <Typography variant="h6" noWrap component="div" sx={{ 
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {language === 'he' ? 'מערכת הנהלת חשבונות חכמה' : 'Smart Accounting System'}
            </Typography>
          </Box>

          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            aria-label="account of current user"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
              border: `2px solid ${theme.palette.primary.main}30`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.main}30, ${theme.palette.secondary.main}30)`,
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <Avatar sx={{ 
              width: 36, 
              height: 36, 
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}>
              {user?.name?.charAt(0) || <AccountCircle />}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 20,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.primary.main}05)`
              : `linear-gradient(135deg, rgba(255,255,255,0.95), ${theme.palette.primary.main}03)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.divider}`,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user?.name || (language === 'he' ? 'משתמש' : 'User')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || (language === 'he' ? 'מנהל מערכת' : 'System Admin')}
          </Typography>
        </Box>
        
        <MenuItem 
          onClick={handleProfileMenuClose}
          sx={{ 
            py: 1.5,
            borderRadius: 1,
            mx: 1,
            my: 0.5,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}05)`,
            },
          }}
        >
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {language === 'he' ? 'פרופיל' : 'Profile'}
          </ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            py: 1.5,
            borderRadius: 1,
            mx: 1,
            my: 0.5,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.error.main}10, ${theme.palette.error.main}05)`,
              color: theme.palette.error.main,
            },
          }}
        >
          <ListItemIcon sx={{ '&:hover': { color: theme.palette.error.main } }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {language === 'he' ? 'התנתק' : 'Logout'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          anchor={isRTL ? 'right' : 'left'}
          open={sidebarOpen}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(180deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`
                : `linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,250,0.95))`,
              backdropFilter: 'blur(20px)',
              borderRight: theme.palette.mode === 'dark' 
                ? `1px solid ${theme.palette.divider}`
                : `1px solid rgba(0,0,0,0.08)`,
              boxShadow: theme.palette.mode === 'dark' 
                ? '8px 0 32px rgba(0,0,0,0.3)'
                : '8px 0 32px rgba(0,0,0,0.1)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `100%`,

          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.background.default}, ${theme.palette.background.paper})`
            : `linear-gradient(135deg, #f8fafc, #f1f5f9)`,
          minHeight: '100vh',
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }} /> {/* Spacer for AppBar */}
        <Box sx={{ 
          p: 1.5, 
          height: 'calc(100vh - 70px)', 
          overflow: 'auto',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(180deg, ${theme.palette.primary.main}05, transparent)`
              : `linear-gradient(180deg, ${theme.palette.primary.main}03, transparent)`,
            pointerEvents: 'none',
            zIndex: 0,
          },
        }}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {children}
          </Box>
        </Box>
      </Box>

      {/* Accessibility Button - Always visible floating button */}
      <AccessibilityButton position="bottom-right" size="medium" />
    </Box>
  );
};

export default MainLayout;
