import { Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useUIStore } from '../stores';

const Reports = () => {
  const { language } = useUIStore();

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
        <Button variant="contained" startIcon={<DownloadIcon />}>
          {language === 'he' ? 'ייצוא מבנה אחיד' : 'Export Unified Format'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {reportTypes.map((report, index) => (
          <Grid size={{ xs: 12, md: 6 }} key={index}>
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
    </Box>
  );
};

export default Reports;
