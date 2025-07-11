import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Inventory as InventoryIcon,
  Warning,
  Refresh,
} from '@mui/icons-material';
import { useUIStore } from '../stores';
import { ModernButton } from '../components/ui';

interface DashboardMetric {
  title: string;
  titleHe: string;
  value: string;
  change: number;
  icon: React.ReactElement;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'purchase' | 'payment';
  description: string;
  descriptionHe: string;
  amount: number;
  date: string;
}

const Dashboard = () => {
  const { language } = useUIStore();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    // Mock data - In real app, this would come from API
    setMetrics([
      {
        title: 'Total Revenue',
        titleHe: 'סך הכנסות',
        value: '₪125,430',
        change: 12.5,
        icon: <TrendingUp />,
        color: 'success',
      },
      {
        title: 'Outstanding Invoices',
        titleHe: 'חשבוניות פתוחות',
        value: '₪34,200',
        change: -5.2,
        icon: <Receipt />,
        color: 'warning',
      },
      {
        title: 'Cash Balance',
        titleHe: 'יתרת מזומנים',
        value: '₪67,890',
        change: 8.1,
        icon: <AccountBalance />,
        color: 'primary',
      },
      {
        title: 'Low Stock Items',
        titleHe: 'פריטים במלאי נמוך',
        value: '7',
        change: 0,
        icon: <InventoryIcon />,
        color: 'error',
      },
    ]);

    setRecentActivities([
      {
        id: '1',
        type: 'sale',
        description: 'Invoice #INV-001 created for Customer ABC',
        descriptionHe: 'חשבונית מס\' INV-001 נוצרה עבור לקוח ABC',
        amount: 1500,
        date: '2025-01-11',
      },
      {
        id: '2',
        type: 'payment',
        description: 'Payment received from Customer XYZ',
        descriptionHe: 'תשלום התקבל מלקוח XYZ',
        amount: 2300,
        date: '2025-01-10',
      },
      {
        id: '3',
        type: 'purchase',
        description: 'Purchase order PO-001 created',
        descriptionHe: 'הזמנת רכש PO-001 נוצרה',
        amount: -850,
        date: '2025-01-10',
      },
    ]);

    setAlerts([
      language === 'he' ? 'יש לכם 3 חשבוניות שעברו את תאריך הפירעון' : 'You have 3 overdue invoices',
      language === 'he' ? '7 פריטים במלאי נמוך' : '7 items are low in stock',
      language === 'he' ? 'דוח מע"מ יפתח להגשה בעוד 5 ימים' : 'VAT report is due in 5 days',
    ]);
  }, [language]);

  const handleRefresh = () => {
    // In real app, this would refetch data from API
    console.log('Refreshing dashboard data...');
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {language === 'he' ? 'לוח בקרה' : 'Dashboard'}
        </Typography>
        <ModernButton
          variant="outline"
          icon={<Refresh />}
          onClick={handleRefresh}
          glow
        >
          {language === 'he' ? 'רענן' : 'Refresh'}
        </ModernButton>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {metrics.map((metric, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {language === 'he' ? metric.titleHe : metric.title}
                    </Typography>
                    <Typography variant="h5" component="div">
                      {metric.value}
                    </Typography>
                    {metric.change !== 0 && (
                      <Box display="flex" alignItems="center" mt={1}>
                        {metric.change > 0 ? (
                          <TrendingUp color="success" fontSize="small" />
                        ) : (
                          <TrendingDown color="error" fontSize="small" />
                        )}
                        <Typography
                          variant="body2"
                          color={metric.change > 0 ? 'success.main' : 'error.main'}
                          ml={0.5}
                        >
                          {Math.abs(metric.change)}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box
                    sx={{
                      color: `${metric.color}.main`,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {metric.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {language === 'he' ? 'פעילות אחרונה' : 'Recent Activity'}
            </Typography>
            <List>
              {recentActivities.map((activity) => (
                <ListItem key={activity.id}>
                  <ListItemIcon>
                    {activity.type === 'sale' && <Receipt color="success" />}
                    {activity.type === 'payment' && <AccountBalance color="primary" />}
                    {activity.type === 'purchase' && <TrendingDown color="warning" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={language === 'he' ? activity.descriptionHe : activity.description}
                    secondary={new Date(activity.date).toLocaleDateString(
                      language === 'he' ? 'he-IL' : 'en-US'
                    )}
                  />
                  <Typography
                    variant="body2"
                    color={activity.amount > 0 ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {activity.amount > 0 ? '+' : ''}₪{Math.abs(activity.amount).toLocaleString()}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Alerts */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {language === 'he' ? 'התראות' : 'Alerts'}
            </Typography>
            {alerts.map((alert, index) => (
              <Chip
                key={index}
                icon={<Warning />}
                label={alert}
                color="warning"
                variant="outlined"
                sx={{ mb: 1, width: '100%', justifyContent: 'flex-start' }}
              />
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
