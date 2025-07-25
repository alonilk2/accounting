import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, IconButton } from '@mui/material';
import { 
  SmartToy, 
  Receipt, 
  Assignment, 
  People, 
  Inventory, 
  Assessment,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';
import { useUIStore } from '../stores';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { language } = useUIStore();
  const navigate = useNavigate();

  // Get greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return {
        hebrew: 'בוקר טוב',
        english: 'Good Morning'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        hebrew: 'צהריים טובים',
        english: 'Good Afternoon'
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        hebrew: 'ערב טוב',
        english: 'Good Evening'
      };
    } else {
      return {
        hebrew: 'לילה טוב',
        english: 'Good Night'
      };
    }
  };

  // Quick actions data
  const quickActions = [
    {
      icon: SmartToy,
      titleHe: 'עוזר AI',
      titleEn: 'AI Assistant',
      descriptionHe: 'שאל שאלות חשבונאיות ותקבל תשובות מקצועיות',
      descriptionEn: 'Ask accounting questions and get professional answers',
      action: () => navigate('/ai-assistant')
    },
    {
      icon: Receipt,
      titleHe: 'יצירת חשבונית',
      titleEn: 'Create Invoice',
      descriptionHe: 'צור חשבונית חדשה במהירות ובקלות',
      descriptionEn: 'Create a new invoice quickly and easily',
      action: () => navigate('/invoices/new')
    },
    {
      icon: Assignment,
      titleHe: 'הצעת מחיר',
      titleEn: 'Create Quote',
      descriptionHe: 'הכן הצעת מחיר מקצועית ללקוח',
      descriptionEn: 'Prepare a professional quote for customer',
      action: () => navigate('/quotes/new')
    },
    {
      icon: People,
      titleHe: 'ניהול לקוחות',
      titleEn: 'Manage Customers',
      descriptionHe: 'הוסף וערוך פרטי לקוחות',
      descriptionEn: 'Add and edit customer details',
      action: () => navigate('/customers')
    },
    {
      icon: Inventory,
      titleHe: 'מלאי',
      titleEn: 'Inventory',
      descriptionHe: 'עקוב אחר מלאי ומוצרים',
      descriptionEn: 'Track inventory and products',
      action: () => navigate('/items')
    },
    {
      icon: Assessment,
      titleHe: 'דוחות',
      titleEn: 'Reports',
      descriptionHe: 'צפה בדוחות כספיים ונתונים',
      descriptionEn: 'View financial reports and data',
      action: () => navigate('/reports')
    }
  ];

  // Random hover effect state
  const [randomHover, setRandomHover] = useState<number | null>(null);

  // Random hover effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Random chance to trigger hover effect (40% chance every 2-4 seconds)
      if (Math.random() < 0.4) {
        const randomIndex = Math.floor(Math.random() * quickActions.length);
        setRandomHover(randomIndex);
        
        // Remove hover effect after 1 second
        setTimeout(() => {
          setRandomHover(null);
        }, 1000);
      }
    }, 2000 + Math.random() * 2000); // Random interval between 2-4 seconds

    return () => clearInterval(interval);
  }, [quickActions.length]);

  const greeting = getGreeting();
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: 0,
        position: 'relative'
      }}
    >
      <Box sx={{ 
        position: 'relative', 
        zIndex: 10, // Increase z-index to be above background
        width: '100%',
        height: '100%',
        p: 0, // Remove all padding
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        overflow: 'auto'
      }}>
        {/* Large time-based greetings positioned at top based on language */}
        <Box sx={{ 
          position: 'absolute',
          top: { xs: '20px', sm: '40px', md: '60px' },
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: language === 'he' ? 'flex-start' : 'flex-end',
          alignItems: 'flex-start',
          px: 0, // Remove horizontal padding
          zIndex: 11 // Higher than parent
        }}>
          {/* Single greeting positioned based on language */}
          <Box sx={{ 
            ...(language === 'he' 
              ? { 
                  pr: { xs: 2, sm: 4, md: 6 } // Simple padding for Hebrew (right side)
                } 
              : { 
                  pl: { xs: 2, sm: 4, md: 6 } // Simple padding for English (left side)
                })
          }}>
            <Typography 
              variant="h1"
              sx={{ 
                color: 'white',
                fontWeight: 700,
                textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5rem' },
                textAlign: language === 'he' ? 'right' : 'left',
                direction: language === 'he' ? 'rtl' : 'ltr'
              }}
            >
              {language === 'he' ? greeting.hebrew : greeting.english}
            </Typography>
          </Box>
        </Box>

        {/* Quick Actions Glass Cards */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 200px)',
          px: 0, // Remove horizontal padding
          py: 4
        }}>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(2, 1fr)', 
              md: 'repeat(3, 1fr)' 
            },
            gap: 3,
            maxWidth: '1200px',
            width: '100%'
          }}>
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              const isRandomlyHovered = randomHover === index;
              
              return (
                <Card
                  key={index}
                  onClick={action.action}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    height: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    // Apply random hover effect
                    ...(isRandomlyHovered && {
                      background: 'rgba(255, 255, 255, 0.13)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                    }),
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.15)',
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }
                  }}
                >
                  <CardContent sx={{ 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    textAlign: 'center',
                    height: '100%',
                    justifyContent: 'space-between'
                  }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <IconComponent sx={{ 
                        fontSize: '3rem', 
                        color: 'white',
                        mb: 2,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                      }} />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'white',
                          fontWeight: 600,
                          mb: 1,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                          direction: language === 'he' ? 'rtl' : 'ltr'
                        }}
                      >
                        {language === 'he' ? action.titleHe : action.titleEn}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.8)',
                          textAlign: 'center',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                          direction: language === 'he' ? 'rtl' : 'ltr',
                          lineHeight: 1.4
                        }}
                      >
                        {language === 'he' ? action.descriptionHe : action.descriptionEn}
                      </Typography>
                    </Box>
                    <IconButton sx={{ 
                      color: 'white',
                      mt: 1,
                      transform: language === 'he' ? 'rotate(180deg)' : 'none',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}>
                      {language === 'he' ? <ArrowBack /> : <ArrowForward />}
                    </IconButton>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
