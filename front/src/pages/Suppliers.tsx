import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUIStore } from '../stores';

const Suppliers = () => {
  const { language } = useUIStore();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {language === 'he' ? 'ספקים' : 'Suppliers'}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          {language === 'he' ? 'הוסף ספק' : 'Add Supplier'}
        </Button>
      </Box>
      
      <Typography variant="body1" color="textSecondary">
        {language === 'he' 
          ? 'מודול ניהול ספקים - בפיתוח'
          : 'Suppliers management module - Under development'
        }
      </Typography>
    </Box>
  );
};

export default Suppliers;
