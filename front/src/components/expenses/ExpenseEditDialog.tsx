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
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { 
  expensesApi,
  type CreateExpenseRequest,
  type UpdateExpenseRequest,
  type ExpenseCategory,
  type ExpenseStatus,
  type Expense,
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

interface ExpenseEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (expenseId: number) => void;
  expense?: Expense | null;
  initialSupplierId?: number;
}

const DEFAULT_FORM_DATA: CreateExpenseRequest = {
  expenseDate: new Date().toISOString().split('T')[0],
  category: EXPENSE_CATEGORIES.FOREIGN_SUPPLY,
  description: '',
  amount: 0,
  vatRate: 17, // Default Israeli VAT rate (18% -> 17% for calculation)
  currency: 'ILS',
  status: EXPENSE_STATUSES.DRAFT,
  isTaxDeductible: true,
  isRecurring: false,
};

const ExpenseEditDialog: React.FC<ExpenseEditDialogProps> = ({
  open,
  onClose,
  onSuccess,
  expense,
  initialSupplierId,
}) => {
  const { language } = useUIStore();
  const [formData, setFormData] = useState<CreateExpenseRequest>(DEFAULT_FORM_DATA);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const isEditing = !!expense;

  // Calculate VAT and total amounts
  const vatAmount = (formData.amount * (formData.vatRate || 0)) / 100;
  const totalAmount = formData.amount + vatAmount;

  // Load suppliers
  const loadSuppliers = useCallback(async () => {
    try {
      const response = await suppliersAPI.getAll({ isActive: true });
      setSuppliers(response.data);
      
      // Set initial supplier if provided
      const supplierId = expense?.supplierId || initialSupplierId;
      if (supplierId) {
        const supplier = response.data.find(s => s.id === supplierId);
        if (supplier) {
          setSelectedSupplier(supplier);
        }
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
    }
  }, [expense?.supplierId, initialSupplierId]);

  useEffect(() => {
    if (open) {
      loadSuppliers();
      
      // Initialize form data
      if (expense) {
        // Editing existing expense
        setFormData({
          expenseDate: expense.expenseDate.split('T')[0],
          supplierId: expense.supplierId,
          supplierName: expense.supplierName,
          category: expense.category,
          description: expense.description,
          descriptionHebrew: expense.descriptionHebrew,
          amount: expense.amount,
          vatRate: expense.vatRate,
          currency: expense.currency,
          paymentMethod: expense.paymentMethod,
          receiptNumber: expense.receiptNumber,
          purchaseOrderId: expense.purchaseOrderId,
          accountId: expense.accountId,
          status: expense.status,
          notes: expense.notes,
          tags: expense.tags,
          isTaxDeductible: expense.isTaxDeductible,
          isRecurring: expense.isRecurring,
        });
      } else {
        // Creating new expense
        setFormData({
          ...DEFAULT_FORM_DATA,
          supplierId: initialSupplierId,
        });
      }
      
      setError('');
    }
  }, [open, expense, initialSupplierId, loadSuppliers]);

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

      let result: Expense;

      if (isEditing && expense) {
        // Update existing expense
        const updateData: UpdateExpenseRequest = {
          expenseDate: formData.expenseDate,
          supplierId: formData.supplierId,
          supplierName: formData.supplierName,
          category: formData.category,
          description: formData.description,
          descriptionHebrew: formData.descriptionHebrew,
          amount: formData.amount,
          vatRate: formData.vatRate || 0,
          currency: formData.currency,
          paymentMethod: formData.paymentMethod,
          receiptNumber: formData.receiptNumber,
          purchaseOrderId: formData.purchaseOrderId,
          accountId: formData.accountId,
          notes: formData.notes,
          tags: formData.tags,
          isTaxDeductible: formData.isTaxDeductible,
          isRecurring: formData.isRecurring,
        };

        result = await expensesApi.updateExpense(expense.id, updateData);
      } else {
        // Create new expense
        const createData: CreateExpenseRequest = {
          ...formData,
          vatRate: formData.vatRate || 0,
        };

        result = await expensesApi.createExpense(createData);
      }
      
      if (onSuccess) {
        onSuccess(result.id);
      }
      
      onClose();
    } catch (err: unknown) {
      console.error('Error saving expense:', err);
      const errorMessage = err instanceof Error && 'response' in err && 
        typeof err.response === 'object' && err.response !== null && 
        'data' in err.response && typeof err.response.data === 'object' && 
        err.response.data !== null && 'message' in err.response.data
        ? String(err.response.data.message)
        : (language === 'he' ? 'שגיאה בשמירת ההוצאה' : 'Error saving expense');
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
    title: isEditing 
      ? (language === 'he' ? 'עריכת הוצאה' : 'Edit Expense')
      : (language === 'he' ? 'הוצאה חדשה' : 'New Expense'),
    expenseDetails: language === 'he' ? 'פרטי ההוצאה' : 'Expense Details',
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
    save: language === 'he' ? 'שמור' : 'Save',
    cancel: language === 'he' ? 'ביטול' : 'Cancel',
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
          alignItems: 'center', 
          gap: 2,
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2
        }}>
          <ReceiptIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {text.title}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <AttachMoneyIcon />
              {text.expenseDetails}
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
            startIcon={<SaveIcon />}
            sx={buttonStyles.primary}
          >
            {text.save}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ExpenseEditDialog;
