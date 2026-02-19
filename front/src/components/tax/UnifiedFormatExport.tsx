import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { complianceAPI } from '../../services/api';
import { useUIStore } from '../../stores';

const UnifiedFormatExport = () => {
  const { language } = useUIStore();
  const isHebrew = language === 'he';

  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    if (startDate > endDate) {
      setError(
        isHebrew
          ? 'תאריך התחלה חייב להיות לפני תאריך סיום'
          : 'Start date must be before end date'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const fileBlob = await complianceAPI.exportUnifiedFormat(startDate, endDate);
      const fileName = `OPENFRMT_${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}.zip`;

      const url = window.URL.createObjectURL(fileBlob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      setSuccess(
        isHebrew
          ? 'קובץ הייצוא הורד בהצלחה'
          : 'Unified format package downloaded successfully'
      );
    } catch {
      setError(
        isHebrew
          ? 'שגיאה בייצוא מבנה אחיד'
          : 'Failed to export unified format package'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {isHebrew ? 'ייצוא מבנה אחיד לרשות המסים' : 'Israeli Unified Format Export'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isHebrew
              ? 'מייצא חבילת ZIP עם INI.TXT ו-BKMVDATA.TXT בפורמט OPENFRMT.'
              : 'Exports a ZIP package containing INI.TXT and BKMVDATA.TXT in OPENFRMT format.'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label={isHebrew ? 'תאריך התחלה' : 'Start Date'}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label={isHebrew ? 'תאריך סיום' : 'End Date'}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
                disabled={loading}
                sx={{ height: '56px' }}
                onClick={handleExport}
              >
                {isHebrew ? 'ייצא מבנה אחיד' : 'Export Unified Format'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UnifiedFormatExport;

