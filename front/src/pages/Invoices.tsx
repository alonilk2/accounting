import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUIStore } from '../stores';

const Invoices = () => {
  const { language } = useUIStore();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {language === 'he' ? 'חשבוניות' : 'Invoices'}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          {language === 'he' ? 'חשבונית חדשה' : 'New Invoice'}
        </Button>
      </Box>
      
      <Typography variant="body1" color="textSecondary">
        {language === 'he' 
          ? 'מודול ניהול חשבוניות - בפיתוח'
          : 'Invoices management module - Under development'
        }
      </Typography>
    </Box>
  );
};

export default Invoices;
