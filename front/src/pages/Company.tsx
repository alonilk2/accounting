import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  PhotoCamera as PhotoCameraIcon,
  Security as SecurityIcon,
  Print as PrintIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { useCompany } from "../hooks/useCompany";
import type { UpdateCompanyRequest } from "../services/companyApi";

const CURRENCY_OPTIONS = [
  { value: "ILS", label: "₪ שקל ישראלי" },
  { value: "USD", label: "$ דולר אמריקאי" },
  { value: "EUR", label: "€ יורו" },
];

const MONTH_OPTIONS = [
  { value: 1, label: "ינואר" },
  { value: 2, label: "פברואר" },
  { value: 3, label: "מרץ" },
  { value: 4, label: "אפריל" },
  { value: 5, label: "מאי" },
  { value: 6, label: "יוני" },
  { value: 7, label: "יולי" },
  { value: 8, label: "אוגוסט" },
  { value: 9, label: "ספטמבר" },
  { value: 10, label: "אוקטובר" },
  { value: 11, label: "נובמבר" },
  { value: 12, label: "דצמבר" },
];

const TIMEZONE_OPTIONS = [
  { value: "Israel Standard Time", label: "זמן ישראל" },
  { value: "GMT Standard Time", label: "GMT" },
  { value: "Eastern Standard Time", label: 'EST (ארה"ב מזרח)' },
  { value: "Central European Standard Time", label: "CET (אירופה)" },
];

const Company = () => {
  const {
    company,
    stats,
    loading,
    error,
    getCompany,
    updateCompany,
    getDashboardStats,
    validateTaxId,
  } = useCompany();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [taxIdValidation, setTaxIdValidation] = useState<{
    isValid?: boolean;
    message?: string;
  }>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState<UpdateCompanyRequest>({
    name: "",
    israelTaxId: "",
    address: "",
    city: "",
    postalCode: "",
    country: "ישראל",
    phone: "",
    email: "",
    website: "",
    currency: "ILS",
    fiscalYearStartMonth: 1,
    timeZone: "Israel Standard Time",
  });

  // Additional settings state
  const [additionalSettings, setAdditionalSettings] = useState({
    businessLicense: "",
    vatRate: 17,
    autoVatCalculation: true,
    printTemplateStyle: "modern",
    autoPrintInvoices: false,
    emailNotifications: true,
    smsNotifications: false,
    weeklyReports: true,
    monthlyBackup: true,
    twoFactorAuth: false,
  });

  // System info state
  const [systemInfo] = useState({
    version: "2.1.0",
    lastUpdate: "2025-01-13",
    buildNumber: "20250113.1",
    environment: "Production",
  });

  // Change history state
  const [changeHistory] = useState([
    {
      id: 1,
      date: "2025-01-13",
      user: "מנהל מערכת",
      action: "עדכון פרטי חברה",
      details: "עדכון כתובת ומספר טלפון",
    },
    {
      id: 2,
      date: "2025-01-10",
      user: "מנהל מערכת", 
      action: "שינוי הגדרות מע״מ",
      details: "עדכון שיעור מע״מ ל-17%",
    },
    {
      id: 3,
      date: "2025-01-05",
      user: "מנהל מערכת",
      action: "יצירת חברה",
      details: "יצירת פרופיל חברה ראשוני",
    },
  ]);

  // For demo purposes, using company ID 1
  const currentCompanyId = 1;

  const loadCompanyData = useCallback(async () => {
    await Promise.all([
      getCompany(currentCompanyId),
      getDashboardStats(currentCompanyId),
    ]);
  }, [getCompany, getDashboardStats, currentCompanyId]);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        israelTaxId: company.israelTaxId,
        address: company.address || "",
        city: company.city || "",
        postalCode: company.postalCode || "",
        country: company.country || "ישראל",
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        currency: company.currency,
        fiscalYearStartMonth: company.fiscalYearStartMonth,
        timeZone: company.timeZone,
      });
    }
  }, [company]);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleInputChange = (
    field: keyof UpdateCompanyRequest,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear tax ID validation when tax ID changes
    if (field === "israelTaxId") {
      setTaxIdValidation({});
    }
  };

  const handleAdditionalSettingChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setAdditionalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTaxIdValidation = async () => {
    if (!formData.israelTaxId.trim()) {
      setTaxIdValidation({ isValid: false, message: "נדרש מספר עוסק מורשה" });
      return;
    }

    const result = await validateTaxId(formData.israelTaxId, currentCompanyId);
    setTaxIdValidation({
      isValid: result.isValid,
      message:
        result.errorMessage ||
        (result.isValid ? "מספר עוסק תקין" : "מספר עוסק לא תקין"),
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.name.trim()) {
        showSnackbar("נדרש שם החברה", "error");
        return;
      }

      if (!formData.israelTaxId.trim()) {
        showSnackbar("נדרש מספר עוסק מורשה", "error");
        return;
      }

      // Validate tax ID if not already validated
      if (taxIdValidation.isValid === undefined) {
        await handleTaxIdValidation();
        if (!taxIdValidation.isValid) {
          showSnackbar("מספר עוסק לא תקין", "error");
          return;
        }
      }

      const result = await updateCompany(currentCompanyId, formData);
      if (result) {
        setEditing(false);
        showSnackbar("פרטי החברה נשמרו בהצלחה");
        // Refresh stats after update
        await getDashboardStats(currentCompanyId);
      }
    } catch {
      showSnackbar("שגיאה בשמירת פרטי החברה", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (company) {
      setFormData({
        name: company.name,
        israelTaxId: company.israelTaxId,
        address: company.address || "",
        city: company.city || "",
        postalCode: company.postalCode || "",
        country: company.country || "ישראל",
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        currency: company.currency,
        fiscalYearStartMonth: company.fiscalYearStartMonth,
        timeZone: company.timeZone,
      });
    }
    setEditing(false);
    setTaxIdValidation({});
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: company?.currency || "ILS",
    }).format(amount);
  };

  const handleExportData = () => {
    // Export company data as JSON
    const dataToExport = {
      company: company,
      stats: stats,
      settings: additionalSettings,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `company-data-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showSnackbar('נתוני החברה יוצאו בהצלחה');
  };

  if (loading && !company) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 3, md: 4 }, 
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          p: 3,
          backgroundColor: 'white',
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <Typography
          variant="h3"
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 2,
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          <BusinessIcon sx={{ fontSize: 40 }} />
          ניהול פרטי החברה
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadCompanyData}
            disabled={loading}
            sx={{ 
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            רענן
          </Button>
          <Button
            variant="outlined"
            onClick={handleExportData}
            disabled={loading}
            sx={{ 
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            ייצא נתונים
          </Button>
          {!editing ? (
            <Button
              variant="contained"
              startIcon={<InfoIcon />}
              onClick={() => setEditing(true)}
              sx={{ 
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
              }}
            >
              ערוך פרטים
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={saving}
                sx={{ 
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500
                }}
              >
                ביטול
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
                onClick={handleSave}
                sx={{ 
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                }}
              >
                {saving ? "שומר..." : "שמור"}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 3,
            fontSize: '1.1rem',
            p: 2
          }}
        >
          {error}
        </Alert>
      )}

      {/* Tabs Navigation */}
      <Paper sx={{ 
        mb: 4,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: "divider",
            backgroundColor: 'white'
          }}
        >
          <Tab
            icon={<BusinessIcon />}
            label="פרטי החברה"
            sx={{ 
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 500,
              px: 3,
              py: 2
            }}
          />
          <Tab
            icon={<SettingsIcon />}
            label="הגדרות נוספות"
            sx={{ 
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 500,
              px: 3,
              py: 2
            }}
          />
          <Tab
            icon={<PrintIcon />}
            label="הגדרות הדפסה"
            sx={{ 
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 500,
              px: 3,
              py: 2
            }}
          />
          <Tab
            icon={<SecurityIcon />}
            label="אבטחה וגיבוי"
            sx={{ 
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 500,
              px: 3,
              py: 2
            }}
          />
          <Tab
            icon={<NotificationsIcon />}
            label="התראות"
            sx={{ 
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 500,
              px: 3,
              py: 2
            }}
          />
          <Tab
            icon={<AssessmentIcon />}
            label="סטטיסטיקות"
            sx={{ 
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 500,
              px: 3,
              py: 2
            }}
          />
          <Tab
            icon={<InfoIcon />}
            label="מידע מערכת"
            sx={{ 
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 500,
              px: 3,
              py: 2
            }}
          />
          <Tab
            icon={<RefreshIcon />}
            label="היסטוריה"
            sx={{ 
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 500,
              px: 3,
              py: 2
            }}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {!editing && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 4, 
            borderRadius: 3,
            p: 3,
            fontSize: '1.1rem',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)'
          }}
          icon={<InfoIcon sx={{ fontSize: 28 }} />}
          action={
            <Button 
              color="inherit" 
              size="large"
              onClick={() => setEditing(true)}
              startIcon={<InfoIcon />}
              sx={{ 
                fontWeight: 600,
                fontSize: '1rem',
                borderRadius: 2
              }}
            >
              ערוך פרטים
            </Button>
          }
        >
          <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
            השדות במצב קריאה בלבד. לחץ על <strong>"ערוך פרטים"</strong> כדי לעבור למצב עריכה ולשנות את פרטי החברה.
          </Typography>
        </Alert>
      )}
      
      {activeTab === 0 && (
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          {/* Company Logo Section */}
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Paper sx={{ 
              p: 4, 
              mb: 4,
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white'
            }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                לוגו החברה
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Avatar
                  src={logoPreview || "/default-company-logo.png"}
                  sx={{ 
                    width: 100, 
                    height: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 50 }} />
                </Avatar>
                <Box>
                  <Box
                    component="input"
                    accept="image/*"
                    sx={{ display: "none" }}
                    id="logo-upload"
                    type="file"
                    onChange={handleLogoUpload}
                    disabled={!editing}
                    aria-label="העלה לוגו חברה"
                  />
                  <label htmlFor="logo-upload">
                    <Tooltip title="העלה לוגו חברה">
                      <IconButton
                        color="primary"
                        aria-label="העלה לוגו"
                        component="span"
                        disabled={!editing}
                        sx={{ 
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: 'primary.light',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.main'
                          }
                        }}
                      >
                        <PhotoCameraIcon sx={{ fontSize: 24 }} />
                      </IconButton>
                    </Tooltip>
                  </label>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ mt: 2, fontSize: '1rem' }}
                  >
                    גודל מומלץ: 200x200 פיקסלים
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Company Details */}
          <Grid size={{ xs: 4, sm: 8, md: 8 }}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white'
            }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                פרטי החברה
              </Typography>

              <Grid
                container
                spacing={{ xs: 3, md: 3 }}
                columns={{ xs: 4, sm: 8, md: 12 }}
              >
              <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                <TextField
                  fullWidth
                  label="שם החברה"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!editing}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                <TextField
                  fullWidth
                  label="מספר עוסק מורשה"
                  value={formData.israelTaxId}
                  onChange={(e) =>
                    handleInputChange("israelTaxId", e.target.value)
                  }
                  onBlur={handleTaxIdValidation}
                  disabled={!editing}
                  required
                  error={taxIdValidation.isValid === false}
                  helperText={taxIdValidation.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <TextField
                  fullWidth
                  label="כתובת"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!editing}
                  multiline
                  rows={2}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <TextField
                  fullWidth
                  label="עיר"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  disabled={!editing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <TextField
                  fullWidth
                  label="מיקוד"
                  value={formData.postalCode}
                  onChange={(e) =>
                    handleInputChange("postalCode", e.target.value)
                  }
                  disabled={!editing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <TextField
                  fullWidth
                  label="מדינה"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  disabled={!editing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                <TextField
                  fullWidth
                  label="טלפון"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!editing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                <TextField
                  fullWidth
                  label="דוא״ל"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!editing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <TextField
                  fullWidth
                  label="אתר אינטרנט"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  disabled={!editing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography 
              variant="h5" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                mb: 3
              }}
            >
              הגדרות מערכת
            </Typography>

            <Grid
              container
              spacing={{ xs: 3, md: 3 }}
              columns={{ xs: 4, sm: 8, md: 12 }}
            >
              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ fontSize: '1rem' }}>מטבע</InputLabel>
                  <Select
                    value={formData.currency}
                    label="מטבע"
                    onChange={(e) =>
                      handleInputChange("currency", e.target.value)
                    }
                    disabled={!editing}
                    sx={{
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    }}
                  >
                    {CURRENCY_OPTIONS.map((option) => (
                      <MenuItem 
                        key={option.value} 
                        value={option.value}
                        sx={{ fontSize: '1rem' }}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ fontSize: '1rem' }}>חודש תחילת שנה כספית</InputLabel>
                  <Select
                    value={formData.fiscalYearStartMonth}
                    label="חודש תחילת שנה כספית"
                    onChange={(e) =>
                      handleInputChange(
                        "fiscalYearStartMonth",
                        Number(e.target.value)
                      )
                    }
                    disabled={!editing}
                    sx={{
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    }}
                  >
                    {MONTH_OPTIONS.map((option) => (
                      <MenuItem 
                        key={option.value} 
                        value={option.value}
                        sx={{ fontSize: '1rem' }}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ fontSize: '1rem' }}>אזור זמן</InputLabel>
                  <Select
                    value={formData.timeZone}
                    label="אזור זמן"
                    onChange={(e) =>
                      handleInputChange("timeZone", e.target.value)
                    }
                    disabled={!editing}
                    sx={{
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    }}
                  >
                    {TIMEZONE_OPTIONS.map((option) => (
                      <MenuItem 
                        key={option.value} 
                        value={option.value}
                        sx={{ fontSize: '1rem' }}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Company Statistics */}
        <Grid size={{ xs: 4, sm: 8, md: 4 }}>
          <Paper sx={{ 
            p: 4,
            borderRadius: 3,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            backgroundColor: 'white'
          }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 2,
                fontWeight: 600,
                color: 'text.primary',
                mb: 3
              }}
            >
              <AssessmentIcon sx={{ fontSize: 28 }} />
              סטטיסטיקות החברה
            </Typography>

            {stats ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem', mb: 1 }}
                    >
                      הכנסות השנה
                    </Typography>
                    <Typography 
                      variant="h5" 
                      color="success.main"
                      sx={{ fontWeight: 600 }}
                    >
                      {formatCurrency(stats.totalRevenue)}
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem', mb: 1 }}
                    >
                      הוצאות השנה
                    </Typography>
                    <Typography 
                      variant="h5" 
                      color="error.main"
                      sx={{ fontWeight: 600 }}
                    >
                      {formatCurrency(stats.totalExpenses)}
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem', mb: 1 }}
                    >
                      רווח נקי
                    </Typography>
                    <Typography
                      variant="h5"
                      color={
                        stats.netProfit >= 0 ? "success.main" : "error.main"
                      }
                      sx={{ fontWeight: 600 }}
                    >
                      {formatCurrency(stats.netProfit)}
                    </Typography>
                  </CardContent>
                </Card>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}
                  >
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem' }}
                    >
                      לקוחות
                    </Typography>
                    <Chip 
                      label={stats.totalCustomers} 
                      size="medium"
                      sx={{ fontSize: '0.9rem' }}
                    />
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}
                  >
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem' }}
                    >
                      ספקים
                    </Typography>
                    <Chip 
                      label={stats.totalSuppliers} 
                      size="medium"
                      sx={{ fontSize: '0.9rem' }}
                    />
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}
                  >
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem' }}
                    >
                      חשבוניות ממתינות
                    </Typography>
                    <Chip
                      label={stats.pendingInvoices}
                      size="medium"
                      color="warning"
                      sx={{ fontSize: '0.9rem' }}
                    />
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}
                  >
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem' }}
                    >
                      חשבוניות פגות מועד
                    </Typography>
                    <Chip
                      label={stats.overdueInvoices}
                      size="medium"
                      color="error"
                      sx={{ fontSize: '0.9rem' }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}
                  >
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem' }}
                    >
                      יתרת מזומנים
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: '1rem', fontWeight: 500 }}
                    >
                      {formatCurrency(stats.cashBalance)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}
                  >
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem' }}
                    >
                      חובות לקוחות
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: '1rem', fontWeight: 500 }}
                    >
                      {formatCurrency(stats.accountsReceivable)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}
                  >
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem' }}
                    >
                      חובות לספקים
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: '1rem', fontWeight: 500 }}
                    >
                      {formatCurrency(stats.accountsPayable)}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 3, fontSize: '0.95rem' }}
                >
                  עודכן לאחרונה:{" "}
                  {new Date(stats.lastUpdated).toLocaleString("he-IL")}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CircularProgress size={32} />
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 2, fontSize: '1rem' }}
                >
                  טוען נתונים...
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      )}

      {/* Tab 2: Additional Settings */}
      {activeTab === 1 && (
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white'
            }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                הגדרות נוספות
              </Typography>

              <Grid
                container
                spacing={{ xs: 3, md: 3 }}
                columns={{ xs: 4, sm: 8, md: 12 }}
              >
                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <TextField
                    fullWidth
                    label="מספר רישיון עסק"
                    value={additionalSettings.businessLicense}
                    onChange={(e) =>
                      handleAdditionalSettingChange("businessLicense", e.target.value)
                    }
                    disabled={!editing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '1.1rem'
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1rem'
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <TextField
                    fullWidth
                    label="שיעור מע״מ (%)"
                    type="number"
                    value={additionalSettings.vatRate}
                    onChange={(e) =>
                      handleAdditionalSettingChange("vatRate", Number(e.target.value))
                    }
                    disabled={!editing}
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '1.1rem'
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1rem'
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={additionalSettings.autoVatCalculation}
                        onChange={(e) =>
                          handleAdditionalSettingChange("autoVatCalculation", e.target.checked)
                        }
                        disabled={!editing}
                        size="medium"
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '1.1rem' }}>
                        חישוב מע״מ אוטומטי
                      </Typography>
                    }
                    sx={{ mt: 2 }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 3: Print Settings */}
      {activeTab === 2 && (
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white'
            }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                הגדרות הדפסה
              </Typography>

              <Grid
                container
                spacing={{ xs: 3, md: 3 }}
                columns={{ xs: 4, sm: 8, md: 12 }}
              >
                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ fontSize: '1rem' }}>סגנון תבנית הדפסה</InputLabel>
                    <Select
                      value={additionalSettings.printTemplateStyle}
                      label="סגנון תבנית הדפסה"
                      onChange={(e) =>
                        handleAdditionalSettingChange("printTemplateStyle", e.target.value)
                      }
                      disabled={!editing}
                      sx={{
                        borderRadius: 2,
                        fontSize: '1.1rem'
                      }}
                    >
                      <MenuItem 
                        value="modern"
                        sx={{ fontSize: '1rem' }}
                      >
                        מודרני
                      </MenuItem>
                      <MenuItem 
                        value="classic"
                        sx={{ fontSize: '1rem' }}
                      >
                        קלאסי
                      </MenuItem>
                      <MenuItem 
                        value="minimal"
                        sx={{ fontSize: '1rem' }}
                      >
                        מינימליסטי
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={additionalSettings.autoPrintInvoices}
                        onChange={(e) =>
                          handleAdditionalSettingChange("autoPrintInvoices", e.target.checked)
                        }
                        disabled={!editing}
                        size="medium"
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '1.1rem' }}>
                        הדפסה אוטומטית של חשבוניות
                      </Typography>
                    }
                    sx={{ mt: 2 }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 4: Security & Backup */}
      {activeTab === 3 && (
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white'
            }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                אבטחה וגיבוי
              </Typography>

              <Grid
                container
                spacing={{ xs: 3, md: 3 }}
                columns={{ xs: 4, sm: 8, md: 12 }}
              >
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={additionalSettings.monthlyBackup}
                        onChange={(e) =>
                          handleAdditionalSettingChange("monthlyBackup", e.target.checked)
                        }
                        disabled={!editing}
                        size="medium"
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '1.1rem' }}>
                        גיבוי חודשי אוטומטי
                      </Typography>
                    }
                    sx={{ mb: 3 }}
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={additionalSettings.twoFactorAuth}
                        onChange={(e) =>
                          handleAdditionalSettingChange("twoFactorAuth", e.target.checked)
                        }
                        disabled={!editing}
                        size="medium"
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '1.1rem' }}>
                        אימות דו-שלבי
                      </Typography>
                    }
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 5: Notifications */}
      {activeTab === 4 && (
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white'
            }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                הגדרות התראות
              </Typography>

              <Grid
                container
                spacing={{ xs: 3, md: 3 }}
                columns={{ xs: 4, sm: 8, md: 12 }}
              >
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={additionalSettings.emailNotifications}
                        onChange={(e) =>
                          handleAdditionalSettingChange("emailNotifications", e.target.checked)
                        }
                        disabled={!editing}
                        size="medium"
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '1.1rem' }}>
                        התראות אימייל
                      </Typography>
                    }
                    sx={{ mb: 3 }}
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={additionalSettings.smsNotifications}
                        onChange={(e) =>
                          handleAdditionalSettingChange("smsNotifications", e.target.checked)
                        }
                        disabled={!editing}
                        size="medium"
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '1.1rem' }}>
                        התראות SMS
                      </Typography>
                    }
                    sx={{ mb: 3 }}
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={additionalSettings.weeklyReports}
                        onChange={(e) =>
                          handleAdditionalSettingChange("weeklyReports", e.target.checked)
                        }
                        disabled={!editing}
                        size="medium"
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '1.1rem' }}>
                        דוחות שבועיים
                      </Typography>
                    }
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 6: Statistics - existing content moved here */}
      {activeTab === 5 && (
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          {/* Company Statistics */}
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white'
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2,
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                <AssessmentIcon sx={{ fontSize: 28 }} />
                סטטיסטיקות החברה
              </Typography>

              {stats ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{ fontSize: '1rem', mb: 1 }}
                      >
                        הכנסות השנה
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color="success.main"
                        sx={{ fontWeight: 600 }}
                      >
                        {formatCurrency(stats.totalRevenue)}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{ fontSize: '1rem', mb: 1 }}
                      >
                        הוצאות השנה
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color="error.main"
                        sx={{ fontWeight: 600 }}
                      >
                        {formatCurrency(stats.totalExpenses)}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{ fontSize: '1rem', mb: 1 }}
                      >
                        רווח נקי
                      </Typography>
                      <Typography
                        variant="h5"
                        color={
                          stats.netProfit >= 0 ? "success.main" : "error.main"
                        }
                        sx={{ fontWeight: 600 }}
                      >
                        {formatCurrency(stats.netProfit)}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography 
                            variant="body1" 
                            color="text.secondary"
                            sx={{ fontSize: '1rem', mb: 1 }}
                          >
                            לקוחות
                          </Typography>
                          <Typography 
                            variant="h5" 
                            color="primary.main"
                            sx={{ fontWeight: 600 }}
                          >
                            {stats.totalCustomers}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography 
                            variant="body1" 
                            color="text.secondary"
                            sx={{ fontSize: '1rem', mb: 1 }}
                          >
                            ספקים
                          </Typography>
                          <Typography 
                            variant="h5" 
                            color="primary.main"
                            sx={{ fontWeight: 600 }}
                          >
                            {stats.totalSuppliers}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography 
                            variant="body1" 
                            color="text.secondary"
                            sx={{ fontSize: '1rem', mb: 1 }}
                          >
                            חשבוניות ממתינות
                          </Typography>
                          <Typography 
                            variant="h5" 
                            color="warning.main"
                            sx={{ fontWeight: 600 }}
                          >
                            {stats.pendingInvoices}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography 
                            variant="body1" 
                            color="text.secondary"
                            sx={{ fontSize: '1rem', mb: 1 }}
                          >
                            חשבוניות פגות מועד
                          </Typography>
                          <Typography 
                            variant="h5" 
                            color="error.main"
                            sx={{ fontWeight: 600 }}
                          >
                            {stats.overdueInvoices}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography 
                            variant="body1" 
                            color="text.secondary"
                            sx={{ fontSize: '1rem', mb: 1 }}
                          >
                            יתרת מזומנים
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color="success.main"
                            sx={{ fontWeight: 600 }}
                          >
                            {formatCurrency(stats.cashBalance)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography 
                            variant="body1" 
                            color="text.secondary"
                            sx={{ fontSize: '1rem', mb: 1 }}
                          >
                            חובות לקוחות
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color="info.main"
                            sx={{ fontWeight: 600 }}
                          >
                            {formatCurrency(stats.accountsReceivable)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography 
                            variant="body1" 
                            color="text.secondary"
                            sx={{ fontSize: '1rem', mb: 1 }}
                          >
                            חובות לספקים
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color="warning.main"
                            sx={{ fontWeight: 600 }}
                          >
                            {formatCurrency(stats.accountsPayable)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box sx={{ 
                    mt: 3, 
                    p: 2, 
                    backgroundColor: 'grey.50', 
                    borderRadius: 2,
                    textAlign: 'center'
                  }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.95rem' }}
                    >
                      עודכן לאחרונה:{" "}
                      {new Date(stats.lastUpdated).toLocaleString("he-IL")}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  display: "flex", 
                  justifyContent: "center", 
                  alignItems: "center", 
                  minHeight: 300,
                  flexDirection: "column",
                  gap: 2 
                }}>
                  <CircularProgress size={48} />
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ fontSize: '1.1rem' }}
                  >
                    טוען סטטיסטיקות...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 7: System Information */}
      {activeTab === 6 && (
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          <Grid size={{ xs: 4, sm: 8, md: 6 }}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white'
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2,
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                <InfoIcon sx={{ fontSize: 28 }} />
                מידע מערכת
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem', mb: 1 }}
                    >
                      גרסת מערכת
                    </Typography>
                    <Chip 
                      label={systemInfo.version} 
                      size="medium"
                      color="primary"
                      sx={{ fontSize: '0.95rem', fontWeight: 600 }}
                    />
                  </CardContent>
                </Card>
                
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem', mb: 1 }}
                    >
                      מספר בנייה
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: '1.1rem', fontWeight: 500 }}
                    >
                      {systemInfo.buildNumber}
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem', mb: 1 }}
                    >
                      סביבה
                    </Typography>
                    <Chip 
                      label={systemInfo.environment} 
                      size="medium"
                      color={systemInfo.environment === "Production" ? "success" : "warning"}
                      sx={{ fontSize: '0.95rem', fontWeight: 600 }}
                    />
                  </CardContent>
                </Card>
                
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1rem', mb: 1 }}
                    >
                      עדכון אחרון
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: '1.1rem', fontWeight: 500 }}
                    >
                      {new Date(systemInfo.lastUpdate).toLocaleDateString("he-IL")}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 4, sm: 8, md: 6 }}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white'
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2,
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                <SettingsIcon sx={{ fontSize: 28 }} />
                פעולות מערכת
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleExportData}
                  fullWidth
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 500,
                    height: 56
                  }}
                >
                  ייצא את כל נתוני החברה
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => showSnackbar("פונקציה זו תהיה זמינה בקרוב")}
                  fullWidth
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 500,
                    height: 56
                  }}
                >
                  יצירת גיבוי מלא
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => showSnackbar("פונקציה זו תהיה זמינה בקרוב")}
                  fullWidth
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 500,
                    height: 56
                  }}
                >
                  בדיקת תקינות נתונים
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 8: Change History */}
      {activeTab === 7 && (
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Paper sx={{ 
              p: 4,
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white'
            }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2,
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                <HistoryIcon sx={{ fontSize: 28 }} />
                היסטוריית שינויים
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {changeHistory.map((change) => (
                  <Card 
                    key={change.id} 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            gutterBottom
                            sx={{ 
                              fontSize: '1.1rem',
                              fontWeight: 600,
                              color: 'text.primary'
                            }}
                          >
                            {change.action}
                          </Typography>
                          <Typography 
                            variant="body1" 
                            color="text.secondary" 
                            gutterBottom
                            sx={{ fontSize: '1rem', lineHeight: 1.6, mb: 2 }}
                          >
                            {change.details}
                          </Typography>
                          <Chip
                            label={`על ידי: ${change.user}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: '0.85rem' }}
                          />
                        </Box>
                        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                          <Chip 
                            label={new Date(change.date).toLocaleDateString("he-IL")} 
                            size="medium"
                            color="default"
                            sx={{ 
                              fontSize: '0.9rem',
                              fontWeight: 500,
                              backgroundColor: 'grey.100'
                            }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
                
                {changeHistory.length === 0 && (
                  <Box sx={{ 
                    textAlign: "center", 
                    py: 6,
                    backgroundColor: 'grey.50',
                    borderRadius: 2
                  }}>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: '1.1rem' }}
                    >
                      אין היסטוריית שינויים זמינה
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Company Status */}
      {company && activeTab === 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            סטטוס החברה
          </Typography>

          <Grid
            container
            spacing={{ xs: 2, md: 2 }}
            columns={{ xs: 4, sm: 8, md: 12 }}
          >
            <Grid size={{ xs: 4, sm: 4, md: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  סטטוס:
                </Typography>
                <Chip
                  label={company.isActive ? "פעילה" : "לא פעילה"}
                  color={company.isActive ? "success" : "error"}
                  size="small"
                />
              </Box>
            </Grid>

            {company.subscriptionPlan && (
              <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    תוכנית מנוי:
                  </Typography>
                  <Chip label={company.subscriptionPlan} size="small" />
                </Box>
              </Grid>
            )}

            <Grid size={{ xs: 4, sm: 4, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                נוצרה: {new Date(company.createdAt).toLocaleDateString("he-IL")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 4, sm: 4, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                עודכנה לאחרונה:{" "}
                {new Date(company.updatedAt).toLocaleDateString("he-IL")}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Company;
