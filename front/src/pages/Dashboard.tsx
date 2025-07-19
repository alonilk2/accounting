import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Fade,
  Button,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Inventory as InventoryIcon,
  Refresh,
  SmartToy as AIIcon,
  Send as SendIcon,
  AutoAwesome as SparkleIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useUIStore, useAIAssistantStore } from '../stores';
import { paperStyles, buttonStyles, cardStyles } from '../styles/formStyles';

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
  const { sendMessage, messages, isLoading } = useAIAssistantStore();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [aiInput, setAiInput] = useState('');

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

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isLoading) return;

    const context = {
      currentPage: '/dashboard',
      metadata: {
        timestamp: new Date().toISOString(),
        dashboardMetrics: metrics,
        recentActivities: recentActivities.slice(0, 3), // Send only recent ones
      },
    };

    await sendMessage(aiInput.trim(), context);
    setAiInput('');
  };

  const quickQuestions = [
    {
      text: language === 'he' ? 'מה ההכנסות החודשיות שלי?' : 'What are my monthly revenues?',
      textHe: 'מה ההכנסות החודשיות שלי?',
    },
    {
      text: language === 'he' ? 'איזה חשבוניות עדיין פתוחות?' : 'Which invoices are still outstanding?',
      textHe: 'איזה חשבוניות עדיין פתוחות?',
    },
    {
      text: language === 'he' ? 'הראה לי דוח רווחיות' : 'Show me profitability report',
      textHe: 'הראה לי דוח רווחיות',
    },
  ];

  return (
    <Box 
      sx={{
        p: { xs: 3, md: 4 },
        backgroundColor: 'background.default',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography
          variant="h3"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontWeight: 600,
            color: 'primary.main',
          }}
        >
          <DashboardIcon sx={{ fontSize: 40 }} />
          {language === 'he' ? 'לוח בקרה' : 'Dashboard'}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            sx={buttonStyles.secondary}
          >
            {language === 'he' ? 'רענן' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid key={index} size={{ xs: 4, sm: 2, md: 3 }}>
            <Card sx={cardStyles}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography 
                      color="text.secondary" 
                      gutterBottom 
                      variant="body2"
                      sx={{ fontWeight: 500 }}
                    >
                      {language === 'he' ? metric.titleHe : metric.title}
                    </Typography>
                    <Typography 
                      variant="h5" 
                      component="div"
                      sx={{ 
                        color: 'text.primary',
                        fontWeight: 700,
                      }}
                    >
                      {metric.value}
                    </Typography>
                    {metric.change !== 0 && (
                      <Box display="flex" alignItems="center" mt={1}>
                        {metric.change > 0 ? (
                          <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
                        ) : (
                          <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: metric.change > 0 ? 'success.main' : 'error.main',
                            fontWeight: 600,
                            ml: 0.5,
                          }}
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
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: (theme) => `${theme.palette[metric.color].main}15`,
                      border: (theme) => `1px solid ${theme.palette[metric.color].main}30`,
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

      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 4 }}>
        {/* Recent Activities */}
        <Grid size={{ xs: 4, sm: 8, md: 8 }}>
          <Paper sx={paperStyles}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: 'text.primary',
                fontWeight: 600,
              }}
            >
              {language === 'he' ? 'פעילות אחרונה' : 'Recent Activity'}
            </Typography>
            <List>
              {recentActivities.map((activity) => (
                <ListItem 
                  key={activity.id}
                  sx={{
                    backgroundColor: (theme) => theme.palette.mode === 'light'
                      ? 'rgba(0,0,0,0.02)'
                      : 'rgba(255,255,255,0.05)',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    mb: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.mode === 'light'
                        ? 'rgba(25, 118, 210, 0.04)'
                        : 'rgba(59, 130, 246, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '50%',
                        backgroundColor: (theme) => activity.type === 'sale' 
                          ? `${theme.palette.success.main}15`
                          : activity.type === 'payment' 
                          ? `${theme.palette.primary.main}15`
                          : `${theme.palette.warning.main}15`,
                        border: (theme) => activity.type === 'sale' 
                          ? `1px solid ${theme.palette.success.main}30`
                          : activity.type === 'payment' 
                          ? `1px solid ${theme.palette.primary.main}30`
                          : `1px solid ${theme.palette.warning.main}30`,
                      }}
                    >
                      {activity.type === 'sale' && <Receipt sx={{ color: 'success.main' }} />}
                      {activity.type === 'payment' && <AccountBalance sx={{ color: 'primary.main' }} />}
                      {activity.type === 'purchase' && <TrendingDown sx={{ color: 'warning.main' }} />}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                        {language === 'he' ? activity.descriptionHe : activity.description}
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ color: 'text.secondary' }}>
                        {new Date(activity.date).toLocaleDateString(
                          language === 'he' ? 'he-IL' : 'en-US'
                        )}
                      </Typography>
                    }
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: activity.amount > 0 ? 'success.main' : 'error.main',
                      fontWeight: 700,
                    }}
                  >
                    {activity.amount > 0 ? '+' : ''}₪{Math.abs(activity.amount).toLocaleString()}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Alerts */}
        <Grid size={{ xs: 4, sm: 8, md: 4 }}>
          <Paper sx={paperStyles}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: 'text.primary',
                fontWeight: 600,
              }}
            >
              {language === 'he' ? 'התראות' : 'Alerts'}
            </Typography>
            <Box>
              {alerts.map((alert, index) => (
                <Alert
                  key={index}
                  severity="warning"
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      fontWeight: 500,
                      textAlign: language === 'he' ? 'right' : 'left',
                    },
                  }}
                >
                  {alert}
                </Alert>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Assistant Card - Central placement for AI-first experience */}
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 4 }}>
        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
          <Card 
            className="ai-assistant-card"
            sx={{ 
              background: (theme) => theme.palette.mode === 'light'
                ? `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.primary.main}02)`
                : `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.primary.main}08)`,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              boxShadow: (theme) => theme.palette.mode === 'light'
                ? '0 4px 16px rgba(0, 0, 0, 0.08)'
                : '0 4px 20px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar 
                  sx={{ 
                    bgcolor: (theme) => `${theme.palette.primary.main}15`, 
                    border: (theme) => `2px solid ${theme.palette.primary.main}30`,
                    width: 56,
                    height: 56,
                    boxShadow: (theme) => `0 4px 16px ${theme.palette.primary.main}20`,
                  }}
                >
                  <AIIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 0.5, 
                      color: 'text.primary',
                    }}
                  >
                    {language === 'he' ? 'עוזר חכם פיננסי' : 'AI Financial Assistant'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                    }}
                  >
                    {language === 'he' 
                      ? 'שאל אותי שאלות על הנתונים הפיננסיים שלך' 
                      : 'Ask me questions about your financial data'
                    }
                  </Typography>
                </Box>
              </Box>

              {/* AI Chat Input */}
              <Box component="form" onSubmit={handleAISubmit} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder={language === 'he' 
                    ? 'שאל שאלה על הנתונים הפיננסיים...' 
                    : 'Ask a question about your financial data...'
                  }
                  disabled={isLoading}
                  dir={language === 'he' ? 'rtl' : 'ltr'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      color: 'text.primary',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.mode === 'light'
                          ? 'rgba(0,0,0,0.02)'
                          : 'rgba(255,255,255,0.05)',
                        border: (theme) => `1px solid ${theme.palette.text.secondary}`,
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'background.paper',
                        border: (theme) => `1px solid ${theme.palette.primary.main}`,
                        boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}20`,
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'text.primary',
                      fontSize: '1.1rem',
                      '&::placeholder': {
                        color: 'text.secondary',
                        opacity: 1,
                      },
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="submit"
                          disabled={!aiInput.trim() || isLoading}
                          sx={{ 
                            color: 'primary.main',
                            bgcolor: (theme) => theme.palette.mode === 'light'
                              ? 'rgba(0,0,0,0.04)'
                              : 'rgba(255,255,255,0.08)',
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            width: 48,
                            height: 48,
                            '&:hover': {
                              bgcolor: (theme) => theme.palette.mode === 'light'
                                ? 'rgba(0,0,0,0.08)'
                                : 'rgba(255,255,255,0.12)',
                            },
                            '&:disabled': {
                              color: 'text.secondary',
                            },
                          }}
                        >
                          {isLoading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SparkleIcon sx={{ fontSize: 20 }} />
                            </Box>
                          ) : (
                            <SendIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Quick Questions */}
              <Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 2, 
                    color: 'text.secondary',
                    fontWeight: 500,
                  }}
                >
                  {language === 'he' ? 'שאלות מהירות:' : 'Quick questions:'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {quickQuestions.map((question, index) => (
                    <Chip
                      key={index}
                      className="ai-quick-chip"
                      label={language === 'he' ? question.textHe : question.text}
                      onClick={() => setAiInput(language === 'he' ? question.textHe : question.text)}
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'light'
                          ? 'rgba(0,0,0,0.04)'
                          : 'rgba(255,255,255,0.08)',
                        color: 'text.primary',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        fontWeight: 500,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: (theme) => theme.palette.mode === 'light'
                            ? 'rgba(0,0,0,0.08)'
                            : 'rgba(255,255,255,0.12)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Recent AI Messages Preview */}
              {messages.length > 0 && (
                <Fade in timeout={500}>
                  <Box sx={{ mt: 4, pt: 3, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 2, 
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      {language === 'he' ? 'הודעות אחרונות:' : 'Recent messages:'}
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {messages.slice(-2).map((message) => (
                        <Paper
                          key={message.id}
                          className="ai-message-preview"
                          sx={{
                            p: 3,
                            mb: 2,
                            bgcolor: (theme) => theme.palette.mode === 'light'
                              ? 'rgba(0,0,0,0.02)'
                              : 'rgba(255,255,255,0.05)',
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            boxShadow: (theme) => theme.palette.mode === 'light'
                              ? '0 2px 8px rgba(0, 0, 0, 0.05)'
                              : '0 2px 8px rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.9rem',
                              color: 'text.primary',
                              lineHeight: 1.5,
                              '& strong': {
                                color: 'text.primary',
                              },
                            }}
                          >
                            <strong>
                              {message.sender === 'user' ? 'אתה' : 'AI'}:
                            </strong> {message.content.slice(0, 100)}
                            {message.content.length > 100 && '...'}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                </Fade>
              )}

              {/* Button to Full AI Assistant */}
              <Box sx={{ mt: 3, pt: 3, borderTop: (theme) => `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/ai-assistant')}
                  startIcon={<AIIcon />}
                  sx={buttonStyles.primary}
                >
                  {language === 'he' ? 'פתח עוזר AI מלא' : 'Open Full AI Assistant'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
