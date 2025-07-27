import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  Assessment as ReportIcon,
  CheckCircle as ValidateIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useUIStore } from '../../stores';
import { taxReportingApi } from '../../services/taxReportingApi';

interface Form6111Report {
  id: number;
  taxYear: number;
  periodStartDate: string;
  periodEndDate: string;
  generatedAt: string;
  generatedBy: string;
  status: 'Draft' | 'Generated' | 'Submitted' | 'Accepted' | 'Rejected';
  validationWarnings: string[];
}

interface Form6111Request {
  taxYear: number;
  periodStartDate: string;
  periodEndDate: string;
  notes?: string;
}

const IsraeliTaxReporting: React.FC = () => {
  const { language } = useUIStore();
  const isHebrew = language === 'he';

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Form6111Report[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedReport, setSelectedReport] = useState<Form6111Report | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [generateForm, setGenerateForm] = useState<Form6111Request>({
    taxYear: new Date().getFullYear(),
    periodStartDate: `${new Date().getFullYear()}-01-01`,
    periodEndDate: `${new Date().getFullYear()}-12-31`,
    notes: '',
  });

  React.useEffect(() => {
    loadReports();
  }, [selectedYear]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await taxReportingApi.getForm6111Reports(selectedYear);
      setReports(data);
    } catch (err) {
      setError(isHebrew ? 'שגיאה בטעינת דוחות' : 'Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newReport = await taxReportingApi.generateForm6111(generateForm);
      setReports([newReport, ...reports]);
      setShowGenerateDialog(false);
      setSuccess(isHebrew ? 'הדוח נוצר בהצלחה' : 'Report generated successfully');
      
      // Reset form
      setGenerateForm({
        taxYear: new Date().getFullYear(),
        periodStartDate: `${new Date().getFullYear()}-01-01`,
        periodEndDate: `${new Date().getFullYear()}-12-31`,
        notes: '',
      });
    } catch (err) {
      setError(isHebrew ? 'שגיאה ביצירת הדוח' : 'Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (reportId: number, format: string = 'JSON') => {
    try {
      setLoading(true);
      await taxReportingApi.exportForm6111(reportId, format);
      setSuccess(isHebrew ? 'הדוח יוצא בהצלחה' : 'Report exported successfully');
    } catch (err) {
      setError(isHebrew ? 'שגיאה בייצוא הדוח' : 'Error exporting report');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateReport = async (reportId: number) => {
    try {
      setLoading(true);
      const validation = await taxReportingApi.validateForm6111(reportId);
      
      if (validation.isValid) {
        setSuccess(isHebrew ? 'הדוח תקין' : 'Report is valid');
      } else {
        setError(isHebrew ? 'הדוח מכיל שגיאות' : 'Report contains errors');
      }
    } catch (err) {
      setError(isHebrew ? 'שגיאה באימות הדוח' : 'Error validating report');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Generated': return 'success';
      case 'Submitted': return 'info';
      case 'Accepted': return 'primary';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    if (isHebrew) {
      switch (status) {
        case 'Draft': return 'טיוטה';
        case 'Generated': return 'נוצר';
        case 'Submitted': return 'הוגש';
        case 'Accepted': return 'התקבל';
        case 'Rejected': return 'נדחה';
        default: return status;
      }
    }
    return status;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          {isHebrew ? 'דיווח מבנה אחיד (טופס 6111)' : 'Israeli Tax Reporting (Form 6111)'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ReportIcon />}
          onClick={() => setShowGenerateDialog(true)}
          disabled={loading}
        >
          {isHebrew ? 'צור דוח חדש' : 'Generate New Report'}
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Year Filter */}
      <Box mb={3}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{isHebrew ? 'שנת מס' : 'Tax Year'}</InputLabel>
          <Select
            value={selectedYear}
            label={isHebrew ? 'שנת מס' : 'Tax Year'}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Reports Overview Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {isHebrew ? 'דוחות השנה' : 'This Year Reports'}
              </Typography>
              <Typography variant="h4">
                {reports.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {isHebrew ? 'דוחות שהוגשו' : 'Submitted Reports'}
              </Typography>
              <Typography variant="h4">
                {reports.filter(r => r.status === 'Submitted' || r.status === 'Accepted').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {isHebrew ? 'דוחות מאושרים' : 'Accepted Reports'}
              </Typography>
              <Typography variant="h4">
                {reports.filter(r => r.status === 'Accepted').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {isHebrew ? 'דוחות ממתינים' : 'Pending Reports'}
              </Typography>
              <Typography variant="h4">
                {reports.filter(r => r.status === 'Draft' || r.status === 'Generated').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reports Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {isHebrew ? 'דוחות קיימים' : 'Existing Reports'}
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : reports.length === 0 ? (
            <Typography color="textSecondary" textAlign="center" p={3}>
              {isHebrew ? 'אין דוחות עבור שנה זו' : 'No reports for this year'}
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{isHebrew ? 'שנת מס' : 'Tax Year'}</TableCell>
                    <TableCell>{isHebrew ? 'תקופה' : 'Period'}</TableCell>
                    <TableCell>{isHebrew ? 'נוצר בתאריך' : 'Generated'}</TableCell>
                    <TableCell>{isHebrew ? 'סטטוס' : 'Status'}</TableCell>
                    <TableCell>{isHebrew ? 'אזהרות' : 'Warnings'}</TableCell>
                    <TableCell>{isHebrew ? 'פעולות' : 'Actions'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.taxYear}</TableCell>
                      <TableCell>
                        {new Date(report.periodStartDate).toLocaleDateString()} - {' '}
                        {new Date(report.periodEndDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(report.status)}
                          color={getStatusColor(report.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {report.validationWarnings.length > 0 && (
                          <Chip
                            label={report.validationWarnings.length}
                            color="warning"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            startIcon={<ValidateIcon />}
                            onClick={() => handleValidateReport(report.id)}
                          >
                            {isHebrew ? 'אמת' : 'Validate'}
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleExportReport(report.id)}
                          >
                            {isHebrew ? 'ייצא' : 'Export'}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Generate Report Dialog */}
      <Dialog 
        open={showGenerateDialog} 
        onClose={() => setShowGenerateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isHebrew ? 'יצירת דוח מבנה אחיד חדש' : 'Generate New Form 6111 Report'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={isHebrew ? 'שנת מס' : 'Tax Year'}
                  type="number"
                  value={generateForm.taxYear}
                  onChange={(e) => setGenerateForm({
                    ...generateForm, 
                    taxYear: Number(e.target.value)
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box height="56px" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={isHebrew ? 'תאריך התחלה' : 'Start Date'}
                  type="date"
                  value={generateForm.periodStartDate}
                  onChange={(e) => setGenerateForm({
                    ...generateForm, 
                    periodStartDate: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={isHebrew ? 'תאריך סיום' : 'End Date'}
                  type="date"
                  value={generateForm.periodEndDate}
                  onChange={(e) => setGenerateForm({
                    ...generateForm, 
                    periodEndDate: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={isHebrew ? 'הערות' : 'Notes'}
                  value={generateForm.notes}
                  onChange={(e) => setGenerateForm({
                    ...generateForm, 
                    notes: e.target.value
                  })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerateDialog(false)}>
            {isHebrew ? 'ביטול' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleGenerateReport} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : (isHebrew ? 'צור דוח' : 'Generate Report')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IsraeliTaxReporting;