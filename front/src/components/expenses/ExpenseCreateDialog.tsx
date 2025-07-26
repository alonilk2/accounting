import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Box,
  Alert,
  FormControlLabel,
  Switch,
  Divider,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { 
  expensesApi,
  type CreateExpenseRequest,
  type ExpenseCategory,
  type ExpenseStatus,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  ExpenseCategoryNames,
  ExpenseStatusNames
} from '../../services/expensesService';
import { suppliersAPI } from '../../services/api';
import { type Supplier } from '../../types/entities';
import { useUIStore } from '../../stores/index';
import { 
  textFieldStyles, 
  dialogStyles, 
  buttonStyles 
} from '../../styles/formStyles';
import type { 
  DocumentScanResponse, 
  CreateExpenseFromScanRequest 
} from '../../types/documentScan';
import { documentScanApi } from '../../services/documentScanService';

interface ExpenseCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (expenseId: number) => void;
  initialSupplierId?: number;
  // Document scan mode props
  scanResult?: DocumentScanResponse | null;
  mode?: 'create' | 'review';
}

const DEFAULT_FORM_DATA: CreateExpenseRequest = {
  expenseDate: new Date().toISOString().split('T')[0],
  category: EXPENSE_CATEGORIES.LOCAL_PURCHASES,
  description: '',
  amount: 0,
  vatRate: 17, // Default Israeli VAT rate (18% -> 17% for calculation)
  currency: 'ILS',
  status: EXPENSE_STATUSES.DRAFT,
  isTaxDeductible: true,
  isRecurring: false,
};

const ExpenseCreateDialog: React.FC<ExpenseCreateDialogProps> = ({
  open,
  onClose,
  onSuccess,
  initialSupplierId,
  scanResult,
  mode = 'create',
}) => {
  const { language } = useUIStore();
  const [formData, setFormData] = useState<CreateExpenseRequest>(DEFAULT_FORM_DATA);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [createNewSupplier, setCreateNewSupplier] = useState(true);

  const isReviewMode = mode === 'review' && scanResult;

  // Calculate VAT and total amounts
  const vatAmount = (formData.amount * (formData.vatRate || 0)) / 100;
  const totalAmount = formData.amount + vatAmount;

  // Load suppliers
  const loadSuppliers = useCallback(async () => {
    try {
      const response = await suppliersAPI.getAll({ isActive: true });
      setSuppliers(response.data);
    } catch (err) {
      console.error('Error loading suppliers:', err);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadSuppliers();
      
      // Initialize form data based on mode
      if (isReviewMode && scanResult?.extractedData) {
        // Convert scanned data to form data
        const scannedData = scanResult.extractedData;
        
        setFormData({
          expenseDate: scannedData.documentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          category: scannedData.suggestedCategory as ExpenseCategory || EXPENSE_CATEGORIES.LOCAL_PURCHASES,
          description: scannedData.description || '',
          descriptionHebrew: scannedData.descriptionHebrew || '',
          amount: scannedData.netAmount || 0,
          vatRate: scannedData.vatRate || 17,
          currency: scannedData.currency || 'ILS',
          status: EXPENSE_STATUSES.DRAFT,
          isTaxDeductible: true,
          isRecurring: false,
          paymentMethod: scannedData.paymentMethod || '',
          receiptNumber: scannedData.documentNumber || '',
          supplierId: scannedData.supplier?.supplierId,
          supplierName: scannedData.supplier?.name,
        });
        
        setCreateNewSupplier(scannedData.supplier?.isNewSupplier || false);
      } else {
        // Reset form when dialog opens in create mode
        setFormData({
          ...DEFAULT_FORM_DATA,
          supplierId: initialSupplierId,
        });
      }
      
      setError('');
    }
  }, [open, initialSupplierId, isReviewMode, scanResult, loadSuppliers]);

  // Separate effect to handle supplier selection when suppliers load
  useEffect(() => {
    if (suppliers.length > 0) {
      // Set initial supplier if provided
      if (initialSupplierId) {
        const supplier = suppliers.find(s => s.id === initialSupplierId);
        if (supplier) {
          setSelectedSupplier(supplier);
        }
      }
      
      // Set supplier from scan result if in review mode
      if (isReviewMode && scanResult?.extractedData?.supplier?.supplierId) {
        const supplier = suppliers.find(s => s.id === scanResult.extractedData?.supplier?.supplierId);
        if (supplier) {
          setSelectedSupplier(supplier);
        }
      }
    }
  }, [suppliers, initialSupplierId, isReviewMode, scanResult]);

  // Handle form field changes
  const handleChange = (field: keyof CreateExpenseRequest, value: string | number | boolean | ExpenseCategory | ExpenseStatus) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle supplier selection
  const handleSupplierChange = (supplier: Supplier | null) => {
    setSelectedSupplier(supplier);
    setFormData(prev => ({
      ...prev,
      supplierId: supplier?.id,
      supplierName: supplier?.name,
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      setError(language === 'he' ? 'תיאור ההוצאה חובה' : 'Expense description is required');
      return;
    }

    if (formData.amount <= 0) {
      setError(language === 'he' ? 'סכום ההוצאה חייב להיות גדול מ-0' : 'Expense amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isReviewMode) {
        // Handle document scan review mode
        const request: CreateExpenseFromScanRequest = {
          expenseData: {
            supplier: {
              supplierId: formData.supplierId,
              name: formData.supplierName || '',
              isNewSupplier: createNewSupplier,
            },
            documentDate: formData.expenseDate,
            documentNumber: formData.receiptNumber || '',
            totalAmount: totalAmount,
            netAmount: formData.amount,
            vatAmount: vatAmount,
            vatRate: formData.vatRate || 0,
            currency: formData.currency || 'ILS',
            suggestedCategory: formData.category,
            description: formData.description,
            descriptionHebrew: formData.descriptionHebrew || '',
            paymentMethod: formData.paymentMethod || '',
            status: formData.status,
          },
          documentUrl: scanResult?.documentUrl,
          reviewNotes: reviewNotes || undefined,
          createNewSupplier
        };

        const result = await documentScanApi.createExpenseFromScan(request);
        
        if (onSuccess) {
          onSuccess(result.expenseId);
        }
      } else {
        // Handle normal expense creation mode
        const expenseData: CreateExpenseRequest = {
          ...formData,
          vatRate: formData.vatRate || 0,
        };

        const expense = await expensesApi.createExpense(expenseData);
        
        if (onSuccess) {
          onSuccess(expense.id);
        }
      }
      
      onClose();
    } catch (err: unknown) {
      console.error('Error creating expense:', err);
      const errorMessage = err instanceof Error && 'response' in err && 
        typeof err.response === 'object' && err.response !== null && 
        'data' in err.response && typeof err.response.data === 'object' && 
        err.response.data !== null && 'message' in err.response.data
        ? String(err.response.data.message)
        : (language === 'he' ? 'שגיאה ביצירת ההוצאה' : 'Error creating expense');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!loading) {
      setFormData(DEFAULT_FORM_DATA);
      setSelectedSupplier(null);
      setError('');
      onClose();
    }
  };

  // Text labels
  const text = {
    title: isReviewMode 
      ? (language === 'he' ? 'בדיקת נתוני המסמך הסרוק' : 'Review Scanned Document Data')
      : (language === 'he' ? 'הוצאה חדשה' : 'New Expense'),
    subtitle: isReviewMode 
      ? (language === 'he' ? 'בדוק ועדכן את הנתונים לפני יצירת ההוצאה' : 'Review and update the data before creating the expense')
      : undefined,
    confidence: language === 'he' ? 'רמת ביטחון' : 'Confidence',
    reviewRequired: language === 'he' ? 'שדות הדורשים בדיקה' : 'Fields requiring review',
    lowConfidence: language === 'he' ? 'רמת ביטחון נמוכה - יש לבדוק את כל השדות' : 'Low confidence - please review all fields',
    expenseDetails: language === 'he' ? 'פרטי ההוצאה' : 'Expense Details',
    supplierInfo: language === 'he' ? 'פרטי ספק' : 'Supplier Information',
    documentDetails: language === 'he' ? 'פרטי המסמך' : 'Document Details',
    amounts: language === 'he' ? 'סכומים' : 'Amounts',
    date: language === 'he' ? 'תאריך' : 'Date',
    supplier: language === 'he' ? 'ספק' : 'Supplier',
    category: language === 'he' ? 'קטגוריה' : 'Category',
    description: language === 'he' ? 'תיאור' : 'Description',
    descriptionHebrew: language === 'he' ? 'תיאור בעברית' : 'Hebrew Description',
    amount: language === 'he' ? 'סכום (ללא מע"מ)' : 'Amount (excl. VAT)',
    vatRate: language === 'he' ? 'שיעור מע"מ (%)' : 'VAT Rate (%)',
    vatAmount: language === 'he' ? 'סכום מע"מ' : 'VAT Amount',
    totalAmount: language === 'he' ? 'סכום כולל' : 'Total Amount',
    currency: language === 'he' ? 'מטבע' : 'Currency',
    paymentMethod: language === 'he' ? 'אמצעי תשלום' : 'Payment Method',
    receiptNumber: language === 'he' ? 'מספר קבלה' : 'Receipt Number',
    status: language === 'he' ? 'סטטוס' : 'Status',
    notes: language === 'he' ? 'הערות' : 'Notes',
    tags: language === 'he' ? 'תגיות' : 'Tags',
    isTaxDeductible: language === 'he' ? 'מוכר במס' : 'Tax Deductible',
    isRecurring: language === 'he' ? 'הוצאה קבועה' : 'Recurring Expense',
    createNewSupplier: language === 'he' ? 'צור ספק חדש' : 'Create New Supplier',
    reviewNotes: language === 'he' ? 'הערות בדיקה' : 'Review Notes',
    save: isReviewMode 
      ? (language === 'he' ? 'צור הוצאה' : 'Create Expense')
      : (language === 'he' ? 'שמור' : 'Save'),
    cancel: language === 'he' ? 'ביטול' : 'Cancel',
    creating: isReviewMode
      ? (language === 'he' ? 'יוצר הוצאה...' : 'Creating expense...')
      : (language === 'he' ? 'שומר...' : 'Saving...'),
    selectSupplier: language === 'he' ? 'בחר ספק...' : 'Select supplier...',
    selectCategory: language === 'he' ? 'בחר קטגוריה' : 'Select Category',
    selectStatus: language === 'he' ? 'בחר סטטוס' : 'Select Status',
  };

  const paymentMethods = [
    { value: 'Cash', label: language === 'he' ? 'מזומן' : 'Cash' },
    { value: 'Credit Card', label: language === 'he' ? 'כרטיס אשראי' : 'Credit Card' },
    { value: 'Bank Transfer', label: language === 'he' ? 'העברה בנקאית' : 'Bank Transfer' },
    { value: 'Check', label: language === 'he' ? 'צ\'ק' : 'Check' },
    { value: 'Other', label: language === 'he' ? 'אחר' : 'Other' },
  ];

  // Helper functions for review mode
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        sx={dialogStyles}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2
        }}>
          <Box>
            <Box display="flex" alignItems="center" gap={2}>
              <ReceiptIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {text.title}
              </Typography>
            </Box>
            {text.subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {text.subtitle}
              </Typography>
            )}
          </Box>
          {isReviewMode && (
            <IconButton onClick={handleClose} disabled={loading}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Confidence Score - Review Mode Only */}
          {isReviewMode && scanResult && (
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2" color="text.secondary">
                    {text.confidence}
                  </Typography>
                  <Chip
                    label={`${Math.round(scanResult.confidenceScore * 100)}%`}
                    color={getConfidenceColor(scanResult.confidenceScore)}
                    size="small"
                    icon={scanResult.confidenceScore < 0.7 ? <WarningIcon /> : <CheckIcon />}
                  />
                </Box>
                {scanResult.confidenceScore < 0.7 && (
                  <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                    {text.lowConfidence}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review Required Fields - Review Mode Only */}
          {isReviewMode && scanResult?.reviewRequired && scanResult.reviewRequired.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {text.reviewRequired}:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {scanResult.reviewRequired.map((field, index) => (
                  <Chip key={index} label={field} size="small" />
                ))}
              </Box>
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            {/* Supplier Information - Review Mode Only */}
            {isReviewMode && (
              <>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  fontWeight: 600,
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <EditIcon />
                  {text.supplierInfo}
                </Typography>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={text.supplier}
                      value={formData.supplierName || ''}
                      onChange={(e) => handleChange('supplierName', e.target.value)}
                      sx={textFieldStyles}
                    />
                  </Grid>
                  
                  {scanResult?.extractedData?.supplier?.isNewSupplier && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={createNewSupplier}
                            onChange={(e) => setCreateNewSupplier(e.target.checked)}
                          />
                        }
                        label={text.createNewSupplier}
                      />
                    </Grid>
                  )}
                </Grid>
                <Divider sx={{ mb: 3 }} />
              </>
            )}

            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <AttachMoneyIcon />
              {isReviewMode ? text.documentDetails : text.expenseDetails}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* First Row - Date and Supplier */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label={text.date}
                  value={new Date(formData.expenseDate)}
                  onChange={(date) => 
                    handleChange('expenseDate', date?.toISOString().split('T')[0] || '')
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: textFieldStyles,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={suppliers}
                  getOptionLabel={(option) => option.name}
                  value={selectedSupplier}
                  onChange={(_, newValue) => handleSupplierChange(newValue)}
                  disabled={mode === 'review'} // Disable in review mode as supplier is from scan
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={text.supplier}
                      placeholder={text.selectSupplier}
                      sx={textFieldStyles}
                    />
                  )}
                />
              </Grid>

              {/* Second Row - Category and Description */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth sx={textFieldStyles}>
                  <InputLabel>{text.category}</InputLabel>
                  <Select
                    value={formData.category}
                    label={text.category}
                    onChange={(e) => handleChange('category', e.target.value as ExpenseCategory)}
                  >
                    {Object.entries(ExpenseCategoryNames).map(([value, names]) => (
                      <MenuItem key={value} value={Number(value) as ExpenseCategory}>
                        {language === 'he' ? names.he : names.en}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={text.description}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  required
                  sx={textFieldStyles}
                />
              </Grid>

              {/* Third Row - Hebrew Description */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={text.descriptionHebrew}
                  value={formData.descriptionHebrew || ''}
                  onChange={(e) => handleChange('descriptionHebrew', e.target.value)}
                  sx={textFieldStyles}
                />
              </Grid>

              {/* Fourth Row - Financial Details */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={text.amount}
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', Number(e.target.value))}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                  }}
                  sx={textFieldStyles}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={text.vatRate}
                  type="number"
                  value={formData.vatRate}
                  onChange={(e) => handleChange('vatRate', Number(e.target.value))}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  sx={textFieldStyles}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={text.totalAmount}
                  value={totalAmount.toFixed(2)}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                  }}
                  sx={{
                    ...textFieldStyles,
                    '& .MuiInputBase-input': {
                      fontWeight: 600,
                      color: 'primary.main',
                    },
                  }}
                />
              </Grid>

              {/* Fifth Row - Payment Details */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth sx={textFieldStyles}>
                  <InputLabel>{text.paymentMethod}</InputLabel>
                  <Select
                    value={formData.paymentMethod || ''}
                    label={text.paymentMethod}
                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={text.receiptNumber}
                  value={formData.receiptNumber || ''}
                  onChange={(e) => handleChange('receiptNumber', e.target.value)}
                  sx={textFieldStyles}
                />
              </Grid>

              {/* Sixth Row - Status */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth sx={textFieldStyles}>
                  <InputLabel>{text.status}</InputLabel>
                  <Select
                    value={formData.status}
                    label={text.status}
                    onChange={(e) => handleChange('status', e.target.value as ExpenseStatus)}
                  >
                    {Object.entries(ExpenseStatusNames).map(([value, names]) => (
                      <MenuItem key={value} value={Number(value) as ExpenseStatus}>
                        {language === 'he' ? names.he : names.en}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Seventh Row - Notes and Tags */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={text.notes}
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  multiline
                  rows={3}
                  sx={textFieldStyles}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={text.tags}
                  value={formData.tags || ''}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder={language === 'he' ? 'תגיות מופרדות בפסיק' : 'Comma-separated tags'}
                  sx={textFieldStyles}
                />
              </Grid>

              {/* Review Notes - Review Mode Only */}
              {isReviewMode && (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label={text.reviewNotes}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    multiline
                    rows={3}
                    placeholder={language === 'he' 
                      ? 'הערות נוספות או תיקונים שנעשו...'
                      : 'Additional notes or corrections made...'
                    }
                    sx={textFieldStyles}
                  />
                </Grid>
              )}

              {/* Eighth Row - Switches */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isTaxDeductible}
                      onChange={(e) => handleChange('isTaxDeductible', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={text.isTaxDeductible}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isRecurring}
                      onChange={(e) => handleChange('isRecurring', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={text.isRecurring}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          borderTop: 1, 
          borderColor: 'divider',
          gap: 2 
        }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            startIcon={<CancelIcon />}
            sx={buttonStyles.secondary}
          >
            {text.cancel}
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={buttonStyles.primary}
          >
            {loading ? text.creating : text.save}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ExpenseCreateDialog;
