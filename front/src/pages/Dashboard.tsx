import { useState, useEffect } from 'react';
import './Dashboard.css';
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
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Inventory as InventoryIcon,
  Warning,
  Refresh,
  SmartToy as AIIcon,
  Send as SendIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import { useUIStore, useAIAssistantStore } from '../stores';
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
  const { sendMessage, messages, isLoading } = useAIAssistantStore();
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
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        p: 3,
      }}
    >
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
        sx={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          p: 3,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography 
          variant="h4" 
          component="h1"
          sx={{
            color: '#333',
            fontWeight: 600,
          }}
        >
          {language === 'he' ? 'לוח בקרה' : 'Dashboard'}
        </Typography>
        <ModernButton
          variant="outline"
          icon={<Refresh />}
          onClick={handleRefresh}
          sx={{
            backgroundColor: 'white',
            border: '1px solid #ddd',
            color: '#666',
            '&:hover': {
              backgroundColor: '#f5f5f5',
              border: '1px solid #bbb',
            },
          }}
        >
          {language === 'he' ? 'רענן' : 'Refresh'}
        </ModernButton>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card
              sx={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography 
                      color="#666" 
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
                        color: '#333',
                        fontWeight: 700,
                      }}
                    >
                      {metric.value}
                    </Typography>
                    {metric.change !== 0 && (
                      <Box display="flex" alignItems="center" mt={1}>
                        {metric.change > 0 ? (
                          <TrendingUp sx={{ color: '#4caf50', fontSize: 20 }} />
                        ) : (
                          <TrendingDown sx={{ color: '#f44336', fontSize: 20 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: metric.change > 0 ? '#4caf50' : '#f44336',
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
                      color: metric.color === 'success' ? '#4caf50' :
                             metric.color === 'warning' ? '#ff9800' :
                             metric.color === 'error' ? '#f44336' :
                             '#2196f3',
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: metric.color === 'success' ? 'rgba(76, 175, 80, 0.1)' :
                                      metric.color === 'warning' ? 'rgba(255, 152, 0, 0.1)' :
                                      metric.color === 'error' ? 'rgba(244, 67, 54, 0.1)' :
                                      'rgba(33, 150, 243, 0.1)',
                      border: `1px solid ${metric.color === 'success' ? 'rgba(76, 175, 80, 0.3)' :
                                         metric.color === 'warning' ? 'rgba(255, 152, 0, 0.3)' :
                                         metric.color === 'error' ? 'rgba(244, 67, 54, 0.3)' :
                                         'rgba(33, 150, 243, 0.3)'}`,
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

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Recent Activities */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper 
            sx={{ 
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: '#333',
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
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    mb: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '50%',
                        backgroundColor: activity.type === 'sale' ? 'rgba(76, 175, 80, 0.1)' :
                                        activity.type === 'payment' ? 'rgba(33, 150, 243, 0.1)' :
                                        'rgba(255, 152, 0, 0.1)',
                        border: activity.type === 'sale' ? '1px solid rgba(76, 175, 80, 0.3)' :
                               activity.type === 'payment' ? '1px solid rgba(33, 150, 243, 0.3)' :
                               '1px solid rgba(255, 152, 0, 0.3)',
                      }}
                    >
                      {activity.type === 'sale' && <Receipt sx={{ color: '#4caf50' }} />}
                      {activity.type === 'payment' && <AccountBalance sx={{ color: '#2196f3' }} />}
                      {activity.type === 'purchase' && <TrendingDown sx={{ color: '#ff9800' }} />}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ color: '#333', fontWeight: 500 }}>
                        {language === 'he' ? activity.descriptionHe : activity.description}
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ color: '#666' }}>
                        {new Date(activity.date).toLocaleDateString(
                          language === 'he' ? 'he-IL' : 'en-US'
                        )}
                      </Typography>
                    }
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: activity.amount > 0 ? '#4caf50' : '#f44336',
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
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper 
            sx={{ 
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              p: 3,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                color: '#333',
                fontWeight: 600,
              }}
            >
              {language === 'he' ? 'התראות' : 'Alerts'}
            </Typography>
            <Box>
              {alerts.map((alert, index) => (
                <Chip
                  key={index}
                  icon={<Warning sx={{ color: '#ff9800' }} />}
                  label={alert}
                  sx={{
                    mb: 2,
                    width: '100%',
                    justifyContent: 'flex-start',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    border: '1px solid rgba(255, 152, 0, 0.3)',
                    color: '#333',
                    fontWeight: 500,
                    p: 2,
                    height: 'auto',
                    '& .MuiChip-label': {
                      whiteSpace: 'normal',
                      textAlign: language === 'he' ? 'right' : 'left',
                    },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 152, 0, 0.2)',
                    },
                  }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Assistant Card - Central placement for AI-first experience */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12 }}>
          <Card 
            className="ai-assistant-card"
            sx={{ 
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(102, 126, 234, 0.1)', 
                    border: '2px solid rgba(102, 126, 234, 0.3)',
                    width: 56,
                    height: 56,
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
                  }}
                >
                  <AIIcon sx={{ fontSize: 32, color: 'rgba(102, 126, 234, 0.8)' }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 0.5, 
                      color: '#333',
                    }}
                  >
                    {language === 'he' ? 'עוזר חכם פיננסי' : 'AI Financial Assistant'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#666',
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
                      bgcolor: '#f9f9f9',
                      borderRadius: 2,
                      color: '#333',
                      border: '1px solid #ddd',
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover': {
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #bbb',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        border: '1px solid #2196f3',
                        boxShadow: '0 0 0 2px rgba(33, 150, 243, 0.2)',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: '#333',
                      fontSize: '1.1rem',
                      '&::placeholder': {
                        color: '#999',
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
                            color: '#2196f3',
                            bgcolor: '#f0f0f0',
                            border: '1px solid #ddd',
                            width: 48,
                            height: 48,
                            '&:hover': {
                              bgcolor: '#e0e0e0',
                            },
                            '&:disabled': {
                              color: '#999',
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
                    color: '#666',
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
                        bgcolor: '#f0f0f0',
                        color: '#333',
                        border: '1px solid #ddd',
                        borderRadius: 2,
                        fontWeight: 500,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#e0e0e0',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Recent AI Messages Preview */}
              {messages.length > 0 && (
                <Fade in timeout={500}>
                  <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 2, 
                        color: '#666',
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
                            bgcolor: '#f9f9f9',
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.9rem',
                              color: '#333',
                              lineHeight: 1.5,
                              '& strong': {
                                color: '#555',
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
