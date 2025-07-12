import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  Receipt,
  AccountBalance,
  Inventory,
  Assessment,
  People,
} from '@mui/icons-material';

interface QuickQuestionProps {
  onQuestionClick: (question: string) => void;
}

const quickQuestions = [
  {
    id: 'revenue',
    icon: TrendingUp,
    title: 'הכנסות',
    question: 'מה היו ההכנסות שלי החודש?',
    color: '#4caf50',
  },
  {
    id: 'invoices',
    icon: Receipt,
    title: 'חשבוניות',
    question: 'כמה חשבוניות לא שולמו?',
    color: '#ff9800',
  },
  {
    id: 'balance',
    icon: AccountBalance,
    title: 'יתרה',
    question: 'מה היתרה הנוכחית בחשבון הבנק?',
    color: '#2196f3',
  },
  {
    id: 'inventory',
    icon: Inventory,
    title: 'מלאי',
    question: 'אילו מוצרים נמוכים במלאי?',
    color: '#9c27b0',
  },
  {
    id: 'reports',
    icon: Assessment,
    title: 'דוחות',
    question: 'הכן לי דוח רווח והפסד לרבעון האחרון',
    color: '#f44336',
  },
  {
    id: 'customers',
    icon: People,
    title: 'לקוחות',
    question: 'מי הלקוחות הגדולים שלי השנה?',
    color: '#607d8b',
  },
];

export const QuickQuestions: React.FC<QuickQuestionProps> = ({ onQuestionClick }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        שאלות נפוצות
      </Typography>
      
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        {quickQuestions.map((question) => (
          <Grid key={question.id} size={{ xs: 4, sm: 4, md: 6 }}>
            <Card 
              elevation={2}
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardActionArea
                onClick={() => onQuestionClick(question.question)}
                sx={{ 
                  height: '100%',
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <CardContent sx={{ width: '100%', p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <question.icon 
                      sx={{ 
                        fontSize: 20, 
                        color: question.color,
                        mr: 1 
                      }} 
                    />
                    <Chip 
                      label={question.title}
                      size="small"
                      sx={{ 
                        backgroundColor: `${question.color}20`,
                        color: question.color,
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.875rem',
                      lineHeight: 1.4,
                      color: 'text.secondary',
                    }}
                  >
                    {question.question}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
