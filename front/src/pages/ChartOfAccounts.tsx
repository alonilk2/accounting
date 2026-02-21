import { Box, Typography, Button, Paper, CircularProgress, Stack } from '@mui/material';
import { Add as AddIcon, Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

const ChartOfAccounts = () => {
  const { language } = useUIStore();
  const navigate = useNavigate();
  const { hasAccess, reason, currentPlan, loading } = useFeatureAccess('double-entry-accounting');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasAccess) {
    return (
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2} alignItems="flex-start">
          <Box display="flex" alignItems="center" gap={1}>
            <LockIcon color="warning" />
            <Typography variant="h5">
              {language === 'he' ? 'Chart of Accounts is locked' : 'Chart of Accounts is locked'}
            </Typography>
          </Box>

          <Typography color="text.secondary">
            {language === 'he'
              ? 'This feature requires Pro or Enterprise subscription.'
              : 'This feature requires Pro or Enterprise subscription.'}
          </Typography>

          {currentPlan && (
            <Typography variant="body2" color="text.secondary">
              {language === 'he' ? `Current plan: ${currentPlan}` : `Current plan: ${currentPlan}`}
            </Typography>
          )}

          {reason && (
            <Typography variant="body2" color="warning.main">
              {reason}
            </Typography>
          )}

          <Button
            variant="contained"
            onClick={() => navigate('/company-management')}
          >
            {language === 'he' ? 'Upgrade plan' : 'Upgrade plan'}
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {language === 'he' ? 'Chart of Accounts' : 'Chart of Accounts'}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          {language === 'he' ? 'Add Account' : 'Add Account'}
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary">
        {language === 'he'
          ? 'Chart of Accounts module - Under development'
          : 'Chart of Accounts module - Under development'}
      </Typography>
    </Box>
  );
};

export default ChartOfAccounts;
