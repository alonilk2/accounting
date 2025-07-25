import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Checkbox,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PrintRounded, DownloadRounded } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import type { CustomerStatement, CustomerStatementRequest } from '../../types/reports';
import type { Customer } from '../../types/entities';
import { customersAPI, reportsAPI } from '../../services/api';
import CustomerStatementPrint from './CustomerStatementPrint';

const CustomerStatementGenerator: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState<Date | null>(new Date(new Date().getFullYear(), 0, 1));
  const [toDate, setToDate] = useState<Date | null>(new Date());
  const [includeZeroBalance, setIncludeZeroBalance] = useState(true);
  const [statement, setStatement] = useState<CustomerStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Create a light theme for print preview
  const printTheme = createTheme({
    palette: {
      mode: 'light',
      background: {
        default: '#ffffff',
        paper: '#ffffff',
      },
      text: {
        primary: '#000000',
        secondary: '#666666',
      },
      divider: '#e0e0e0',
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: statement ? `כרטסת לקוח - ${statement.customer.name} - ${format(new Date(statement.fromDate), 'dd/MM/yyyy', { locale: he })} - ${format(new Date(statement.toDate), 'dd/MM/yyyy', { locale: he })}` : 'כרטסת לקוח',
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          direction: rtl;
          font-family: 'Arial', sans-serif;
        }
        .print-content {
          width: 100% !important;
          max-width: none !important;
          overflow: visible !important;
        }
        .print-content table {
          border-collapse: collapse !important;
          page-break-inside: avoid;
        }
        .print-content .MuiPaper-root {
          border-radius: 0 !important;
          box-shadow: none !important;
        }
      }
    `,
  });

  // Load customers when component mounts
  React.useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const customerList = await customersAPI.getCustomers();
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('שגיאה בטעינת רשימת הלקוחות');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const generateStatement = async () => {
    if (!selectedCustomerId || !fromDate || !toDate) {
      setError('נא למלא את כל השדות הנדרשים');
      return;
    }

    if (fromDate > toDate) {
      setError('תאריך התחלה חייב להיות לפני תאריך סיום');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: CustomerStatementRequest = {
        customerId: selectedCustomerId as number,
        fromDate: format(fromDate, 'yyyy-MM-dd'),
        toDate: format(toDate, 'yyyy-MM-dd'),
        includeZeroBalanceTransactions: includeZeroBalance,
      };

      const statementData = await reportsAPI.getCustomerStatement(request);
      setStatement(statementData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה ביצירת הכרטסת';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    // This would require a PDF generation library like jsPDF
    // For now, we'll just show an alert
    alert('הורדת PDF תתבצע בגרסה הבאה');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Box sx={{ p: 3, direction: 'rtl' }}>
        <Typography variant="h4" gutterBottom>
          כרטסת לקוח
        </Typography>

        {/* Form Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
              <Grid size={{ xs: 4, sm: 8, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>בחר לקוח</InputLabel>
                  <Select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value as number)}
                    label="בחר לקוח"
                    disabled={loadingCustomers}
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 4, sm: 4, md: 3 }}>
                <DatePicker
                  label="מתאריך"
                  value={fromDate}
                  onChange={(newValue) => setFromDate(newValue)}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 4, sm: 4, md: 3 }}>
                <DatePicker
                  label="עד תאריך"
                  value={toDate}
                  onChange={(newValue) => setToDate(newValue)}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeZeroBalance}
                      onChange={(e) => setIncludeZeroBalance(e.target.checked)}
                    />
                  }
                  label="כלול תנועות עם יתרה אפס"
                />
              </Grid>

              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={generateStatement}
                    disabled={loading || !selectedCustomerId || !fromDate || !toDate}
                    startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  >
                    {loading ? 'יוצר כרטסת...' : 'צור כרטסת'}
                  </Button>

                  {statement && (
                    <>
                      <Button
                        variant="outlined"
                        onClick={handlePrint}
                        startIcon={<PrintRounded />}
                      >
                        הדפס
                      </Button>

                      <Button
                        variant="outlined"
                        onClick={downloadPDF}
                        startIcon={<DownloadRounded />}
                      >
                        הורד PDF
                      </Button>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statement Preview */}
        {statement && (
          <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
              <Typography variant="h6" sx={{ p: 3, borderBottom: '1px solid #eee', m: 0 }}>
                תצוגה מקדימה - כרטסת לקוח
              </Typography>
              
              {/* Print Area */}
              <Box 
                ref={printRef} 
                className="print-content"
                sx={{
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'auto',
                  backgroundColor: 'white',
                  borderRadius: 0
                }}
              >
                <ThemeProvider theme={printTheme}>
                  <CustomerStatementPrint statement={statement} />
                </ThemeProvider>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default CustomerStatementGenerator;
