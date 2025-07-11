import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUIStore } from '../stores';

const ChartOfAccounts = () => {
  const { language } = useUIStore();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {language === 'he' ? 'תרשים חשבונות' : 'Chart of Accounts'}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          {language === 'he' ? 'הוסף חשבון' : 'Add Account'}
        </Button>
      </Box>
      
      <Typography variant="body1" color="textSecondary">
        {language === 'he' 
          ? 'מודול תרשים חשבונות - בפיתוח'
          : 'Chart of Accounts module - Under development'
        }
      </Typography>
    </Box>
  );
};

export default ChartOfAccounts;
