import { Box, Typography, Button, Grid, Card, CardContent, Tabs, Tab } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useUIStore } from '../stores';
import CustomerStatementGenerator from '../components/reports/CustomerStatementGenerator';
import IsraeliTaxReporting from '../components/tax/IsraeliTaxReporting';

const Reports = () => {
  const { language } = useUIStore();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const reportTypes = [
    {
      title: language === 'he' ? 'דוח רווח והפסד' : 'Profit & Loss',
      description: language === 'he' ? 'דוח על הכנסות והוצאות' : 'Revenue and expenses report',
    },
    {
      title: language === 'he' ? 'מאזן' : 'Balance Sheet',
      description: language === 'he' ? 'דוח על נכסים והתחייבויות' : 'Assets and liabilities report',
    },
    {
      title: language === 'he' ? 'דוח תזרים מזומנים' : 'Cash Flow',
      description: language === 'he' ? 'דוח על תנועות מזומנים' : 'Cash movements report',
    },
    {
      title: language === 'he' ? 'דוח מע"מ' : 'VAT Report',
      description: language === 'he' ? 'דוח מע"מ לרשויות המס' : 'VAT report for tax authorities',
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {language === 'he' ? 'דוחות' : 'Reports'}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<DownloadIcon />}
          onClick={() => setActiveTab(2)}
        >
          {language === 'he' ? 'ייצוא מבנה אחיד' : 'Export Unified Format'}
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="report tabs">
          <Tab label={language === 'he' ? 'דוחות כלליים' : 'General Reports'} />
          <Tab label={language === 'he' ? 'כרטסת לקוח' : 'Customer Statement'} />
          <Tab label={language === 'he' ? 'מבנה אחיד (טופס 6111)' : 'Form 6111 (Tax Reporting)'} />
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
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {report.description}
                  </Typography>
                  <Button variant="outlined" size="small">
                    {language === 'he' ? 'הפק דוח' : 'Generate Report'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <CustomerStatementGenerator />
      )}

      {activeTab === 2 && (
        <IsraeliTaxReporting />
      )}
    </Box>
  );
};

export default Reports;
