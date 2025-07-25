import { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  Home,
  Business,
  Inventory,
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
  Assignment,
  LocalShipping,
  CorporateFare,
  Payment,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../stores';
import { AIAssistant, AIAssistantFab } from './ai';
import DocumentCreationFab from './ui/DocumentCreationFab';

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

const drawerWidth = 240;

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
  { text: 'Home Page', textHe: 'עמוד ראשי', icon: <Home />, path: '/home' },
  { text: 'Dashboard', textHe: 'לוח בקרה', icon: <Dashboard />, path: '/', isAI: true },
  { text: 'AI Assistant', textHe: 'עוזר AI', icon: <SmartToy />, path: '/ai-assistant', section: 'AI Analytics', isAI: true, badge: 'AI' },
  { text: 'AI Insights', textHe: 'תובנות AI', icon: <Insights />, path: '/ai-insights', section: 'AI Analytics', isAI: true, badge: 'AI' },
  { text: 'Smart Analytics', textHe: 'אנליטיקה חכמה', icon: <TrendingUp />, path: '/smart-analytics', section: 'AI Analytics', isAI: true, badge: 'AI' },
  { text: 'Customers', textHe: 'לקוחות', icon: <People />, path: '/customers', section: 'Sales' },
  { text: 'Quotes', textHe: 'הצעות מחיר', icon: <Assignment />, path: '/quotes', section: 'Sales' },
  { text: 'Orders', textHe: 'הזמנות', icon: <ShoppingCart />, path: '/sales-orders', section: 'Sales' },
  { text: 'Delivery Notes', textHe: 'תעודות משלוח', icon: <LocalShipping />, path: '/delivery-notes', section: 'Sales' },
  { text: 'Sales Documents', textHe: 'מסמכי מכירות', icon: <Business />, path: '/sales-documents', section: 'Sales' },
  { text: 'Suppliers', textHe: 'ספקים', icon: <Business />, path: '/suppliers', section: 'Purchasing' },
  { text: 'Purchase Orders', textHe: 'הזמנות רכש', icon: <ShoppingCart />, path: '/purchases', section: 'Purchasing' },
  { text: 'Purchase Invoices', textHe: 'חשבוניות רכש', icon: <AccountBalance />, path: '/purchase-invoices', section: 'Purchasing' },
  { text: 'Expenses', textHe: 'הוצאות', icon: <Payment />, path: '/expenses', section: 'Purchasing' },
  { text: 'Inventory', textHe: 'מלאי', icon: <Inventory />, path: '/inventory', section: 'Inventory' },
  { text: 'Chart of Accounts', textHe: 'תרשים חשבונות', icon: <AccountBalance />, path: '/accounts', section: 'Accounting' },
  { text: 'Reports', textHe: 'דוחות', icon: <BarChart />, path: '/reports', section: 'Reports' },
  { text: 'Company Management', textHe: 'ניהול חברה', icon: <CorporateFare />, path: '/company-management', section: 'System' },
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
  
  const { user, logout } = useAuthStore();
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
            mb: 1,
            py: 1.5,
            px: 0.5,
            minHeight: 80,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
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
            transform: isActive ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          <Box sx={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: 40,
          }}>
            <Box
              sx={{
                color: isActive ? theme.palette.primary.main : 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& svg': {
                  fontSize: 28,
                  filter: item.isAI ? 'drop-shadow(0 0 4px rgba(25, 118, 210, 0.3))' : 'none',
                },
              }}
            >
              {item.icon}
            </Box>
            {item.badge && (
              <Chip
                label={item.badge}
                size="small"
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  height: 16,
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: 'white',
                  '& .MuiChip-label': {
                    px: 0.5,
                  },
                }}
              />
            )}
            {item.isAI && (
              <AutoAwesome 
                sx={{ 
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  fontSize: 14, 
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
          <Typography
            variant="caption"
            sx={{
              fontWeight: isActive ? 600 : 500,
              color: isActive ? theme.palette.primary.main : 'inherit',
              textAlign: 'center',
              lineHeight: 1.1,
              fontSize: '0.7rem',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayText}
          </Typography>
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
      {/* Profile Section */}
      <Box sx={{ 
        p: 1.5, 
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}10)`,
        borderBottom: `1px solid ${theme.palette.divider}`,
        position: 'relative',
        overflow: 'visible',
      }}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            gap: 1,
            cursor: 'pointer',
            p: 1,
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}15)`,
              transform: 'scale(1.02)',
            },
          }}
          onClick={handleProfileMenuOpen}
        >
          <Avatar sx={{ 
            width: 42, 
            height: 42, 
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            border: `2px solid ${theme.palette.primary.main}30`,
          }}>
            {user?.name?.charAt(0) || <AccountCircle />}
          </Avatar>
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="caption" 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                lineHeight: 1.2,
                fontSize: '0.8rem',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
              title={user?.name || (language === 'he' ? 'משתמש' : 'User')}
            >
              {user?.name || (language === 'he' ? 'משתמש' : 'User')}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                lineHeight: 1.2,
                fontSize: '0.65rem',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
              title={user?.email || (language === 'he' ? 'מנהל מערכת' : 'System Admin')}
            >
              {user?.email || (language === 'he' ? 'מנהל מערכת' : 'System Admin')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        {Object.entries(groupedItems).map(([section, items]) => (
          <Box key={section}>
            {section !== 'Main' && (
              <Box sx={{ 
                px: 1, 
                py: 1, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                gap: 0.5,
              }}>
                {section === 'AI Analytics' && (
                  <AutoAwesome sx={{ 
                    fontSize: 14, 
                    color: theme.palette.primary.main,
                    animation: 'pulse 2s infinite',
                  }} />
                )}
                <Typography
                  variant="overline"
                  sx={{
                    color: section === 'AI Analytics' ? theme.palette.primary.main : 'text.secondary',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                    textAlign: 'center',
                    lineHeight: 1,
                  }}
                >
                  {sectionTitles[section as keyof typeof sectionTitles]?.[language] || section}
                </Typography>
              </Box>
            )}
            <List dense>
              {items.map(renderNavItem)}
            </List>
            {section !== 'System' && <Divider sx={{ my: 1, mx: 2 }} />}
          </Box>
        ))}
      </Box>

      {/* Theme and Language Controls */}
      <Box sx={{ 
        p: 1.5, 
        borderTop: `1px solid ${theme.palette.divider}`,
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1,
          alignItems: 'center',
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            p: 1,
            borderRadius: 2,
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${theme.palette.divider}`,
            width: '100%',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              {currentTheme === 'dark' ? <Brightness4 sx={{ fontSize: 16 }} /> : <Brightness7 sx={{ fontSize: 16 }} />}
              <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                {language === 'he' ? 'כהה' : 'Dark'}
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
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            p: 1,
            borderRadius: 2,
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${theme.palette.divider}`,
            width: '100%',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Language sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
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
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      position: 'relative',
      backgroundImage: theme.palette.mode === 'dark' 
        ? 'url(/images/background.png)' 
        : 'url(/images/background-light.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(0, 0, 0, 0.3)' 
          : 'rgba(255, 255, 255, 0.1)',
        zIndex: 1,
        pointerEvents: 'none'
      }
    }}>
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
        sx={{ 
          width: { md: drawerWidth }, 
          flexShrink: { md: 0 },
          position: 'relative',
          zIndex: 5
        }}
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
          width: '100%',
          position: 'relative',
          zIndex: 2,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          background: 'transparent', // Remove background so global background shows
          minHeight: '100vh',
          [theme.breakpoints.down('md')]: {
            width: '100%',
            marginLeft: 0,
            marginRight: 0,
          },
        }}
      >
        <Box sx={{ 
          px: location.pathname === '/home' ? 0 : { xs: 1, sm: 2, md: 3, lg: 5, xl: 7 }, // No padding for home page
          py: location.pathname === '/home' ? 0 : 1.5, // No padding for home page
          height: '100vh', // שינוי ל-100vh כי אין יותר AppBar
          overflow: 'auto',
          position: 'relative',
          '&::before': location.pathname === '/home' ? {} : {
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
          
          <Box sx={{ 
            position: 'relative', 
            zIndex: 1,
            maxWidth: '1600px', // הגבלת רוחב מקסימלי לקריאות טובה יותר
            mx: 'auto', // מרכוז התוכן
            // Glass container effect for all pages except home
            ...(location.pathname !== '/home' && {
              background: theme.palette.mode === 'dark' 
                ? 'rgba(18, 18, 18, 0.7)'
                : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: `1px solid ${theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.1)'}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              p: { xs: 2, sm: 3, md: 4 },
              my: 2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  : '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1)',
                transform: 'translateY(-2px)',
              },
            }),
          }}>
            {children}
          </Box>
        </Box>
      </Box>
      
      {/* AI Assistant Components */}
      <AIAssistant />
      <AIAssistantFab />
      
      {/* Document Creation FAB */}
      <DocumentCreationFab />
    </Box>
  );
};

export default MainLayout;
