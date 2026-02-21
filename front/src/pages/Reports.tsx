import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Download as DownloadIcon, Lock as LockIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import CustomerStatementGenerator from '../components/reports/CustomerStatementGenerator';
import IsraeliTaxReporting from '../components/tax/IsraeliTaxReporting';
import UnifiedFormatExport from '../components/tax/UnifiedFormatExport';

const Reports = () => {
  const { language } = useUIStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const { hasAccess, reason, currentPlan, loading } = useFeatureAccess('double-entry-accounting');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const reportTypes = [
    {
      title: language === 'he' ? 'Profit & Loss' : 'Profit & Loss',
      description: language === 'he' ? 'Revenue and expenses report' : 'Revenue and expenses report',
    },
    {
      title: language === 'he' ? 'Balance Sheet' : 'Balance Sheet',
      description: language === 'he' ? 'Assets and liabilities report' : 'Assets and liabilities report',
    },
    {
      title: language === 'he' ? 'Cash Flow' : 'Cash Flow',
      description: language === 'he' ? 'Cash movements report' : 'Cash movements report',
    },
    {
      title: language === 'he' ? 'VAT Report' : 'VAT Report',
      description: language === 'he' ? 'VAT report for tax authorities' : 'VAT report for tax authorities',
    },
  ];

  const isAccountingTab = activeTab === 2 || activeTab === 3;

  const renderLockedState = () => (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2} alignItems="flex-start">
        <Box display="flex" alignItems="center" gap={1}>
          <LockIcon color="warning" />
          <Typography variant="h6">
            {language === 'he' ? 'Accounting reports are locked' : 'Accounting reports are locked'}
          </Typography>
        </Box>

        <Typography color="text.secondary">
          {language === 'he'
            ? 'Unified format export and Form 6111 are available on Pro or Enterprise.'
            : 'Unified format export and Form 6111 are available on Pro or Enterprise.'}
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

        <Button variant="contained" onClick={() => navigate('/company-management')}>
          {language === 'he' ? 'Upgrade plan' : 'Upgrade plan'}
        </Button>
      </Stack>
    </Paper>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {language === 'he' ? 'Reports' : 'Reports'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => setActiveTab(2)}
        >
          {language === 'he' ? 'Export Unified Format' : 'Export Unified Format'}
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="report tabs">
          <Tab label={language === 'he' ? 'General Reports' : 'General Reports'} />
          <Tab label={language === 'he' ? 'Customer Statement' : 'Customer Statement'} />
          <Tab label={language === 'he' ? 'Unified Format Export' : 'Unified Format Export'} />
          <Tab label={language === 'he' ? 'Form 6111' : 'Form 6111'} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
          {reportTypes.map((report, index) => (
            <Grid key={index} size={{ xs: 4, sm: 8, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {report.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {report.description}
                  </Typography>
                  <Button variant="outlined" size="small">
                    {language === 'he' ? 'Generate Report' : 'Generate Report'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && <CustomerStatementGenerator />}

      {isAccountingTab && loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {isAccountingTab && !loading && !hasAccess && renderLockedState()}

      {activeTab === 2 && !loading && hasAccess && <UnifiedFormatExport />}

      {activeTab === 3 && !loading && hasAccess && <IsraeliTaxReporting />}
    </Box>
  );
};

export default Reports;
