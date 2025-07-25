import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Autocomplete,
  MenuItem,
  Box,
  Alert,
  InputAdornment,
  Divider,
  Paper,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  DateRange as DateIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useUIStore } from '../../stores';
import { invoicesAPI } from '../../services/api';
import receiptsService from '../../services/receiptsService';
import type { CreateReceiptRequest, PaymentMethod } from '../../types/receipt';

const PAYMENT_METHODS = [
  'מזומן',
  'כרטיס אשראי',
  'העברה בנקאית',
  'צ\'ק',
  'ביט',
  'פייפאל',
  'אחר'
] as const;

interface ReceiptCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (receiptId: number) => void;
  initialInvoiceId?: number;
}

interface InvoiceOption {
  id: number;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
}

const ReceiptCreateDialog: React.FC<ReceiptCreateDialogProps> = ({
  open,
  onClose,
  onSuccess,
  initialInvoiceId,
}) => {
  const { language } = useUIStore();
  const isRTL = language === 'he';
  
  // Form state
  const [formData, setFormData] = useState<CreateReceiptRequest>({
    invoiceId: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'מזומן',
    referenceNumber: '',
    notes: '',
    currency: 'ILS',
  });
  
  // Data state
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceOption | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const text = {
    title: language === 'he' ? 'יצירת קבלה' : 'Create Receipt',
    invoice: language === 'he' ? 'חשבונית' : 'Invoice',
    customer: language === 'he' ? 'לקוח' : 'Customer',
    paymentDate: language === 'he' ? 'תאריך תשלום' : 'Payment Date',
    amount: language === 'he' ? 'סכום' : 'Amount',
    paymentMethod: language === 'he' ? 'אופן תשלום' : 'Payment Method',
    referenceNumber: language === 'he' ? 'מספר אסמכתא' : 'Reference Number',
    notes: language === 'he' ? 'הערות' : 'Notes',
    totalAmount: language === 'he' ? 'סכום כולל' : 'Total Amount',
    paidAmount: language === 'he' ? 'סכום ששולם' : 'Paid Amount',
    remainingAmount: language === 'he' ? 'יתרה' : 'Remaining Amount',
    save: language === 'he' ? 'שמור' : 'Save',
    cancel: language === 'he' ? 'ביטול' : 'Cancel',
    selectInvoice: language === 'he' ? 'בחר חשבונית' : 'Select Invoice',
    receiptDetails: language === 'he' ? 'פרטי הקבלה' : 'Receipt Details',
    invoiceInfo: language === 'he' ? 'פרטי החשבונית' : 'Invoice Information',
    paymentInfo: language === 'he' ? 'פרטי התשלום' : 'Payment Information',
    amountExceedsRemaining: language === 'he' ? 'הסכום עולה על היתרה' : 'Amount exceeds remaining balance',
    pleaseSelectInvoice: language === 'he' ? 'אנא בחר חשבונית' : 'Please select an invoice',
    pleaseEnterAmount: language === 'he' ? 'אנא הזן סכום' : 'Please enter an amount',
    amountMustBePositive: language === 'he' ? 'הסכום חייב להיות חיובי' : 'Amount must be positive',
  };

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const invoicesData = await invoicesAPI.getAll();
      
      // Filter unpaid invoices and transform to options
      const unpaidInvoices = invoicesData
        .filter(invoice => invoice.status === 'Sent' && invoice.totalAmount > invoice.paidAmount)
        .map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName || 'N/A',
          totalAmount: invoice.totalAmount,
          paidAmount: invoice.paidAmount,
          remainingAmount: invoice.totalAmount - invoice.paidAmount,
          currency: invoice.currency || 'ILS',
        }));
      
      setInvoices(unpaidInvoices);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError(language === 'he' ? 'שגיאה בטעינת החשבוניות' : 'Error loading invoices');
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    if (open) {
      loadInvoices();
      resetForm();
    }
  }, [open, loadInvoices]);

  useEffect(() => {
    if (open && initialInvoiceId && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === initialInvoiceId);
      if (invoice) {
        setSelectedInvoice(invoice);
        setFormData(prev => ({
          ...prev,
          invoiceId: invoice.id,
          amount: invoice.remainingAmount,
          currency: invoice.currency,
        }));
      }
    }
  }, [open, initialInvoiceId, invoices]);

  const resetForm = () => {
    setFormData({
      invoiceId: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'מזומן',
      referenceNumber: '',
      notes: '',
      currency: 'ILS',
    });
    setSelectedInvoice(null);
    setError('');
  };

  const handleInvoiceSelect = (invoice: InvoiceOption | null) => {
    setSelectedInvoice(invoice);
    if (invoice) {
      setFormData(prev => ({
        ...prev,
        invoiceId: invoice.id,
        amount: invoice.remainingAmount, // Default to full remaining amount
        currency: invoice.currency,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        invoiceId: 0,
        amount: 0,
        currency: 'ILS',
      }));
    }
  };

  const handleFieldChange = (field: keyof CreateReceiptRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!selectedInvoice) {
      setError(text.pleaseSelectInvoice);
      return false;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError(text.amountMustBePositive);
      return false;
    }

    if (formData.amount > selectedInvoice.remainingAmount) {
      setError(text.amountExceedsRemaining);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      const receipt = await receiptsService.createReceipt(formData);
      
      if (onSuccess) {
        onSuccess(receipt.id);
      }
      
      handleClose();
    } catch (err: unknown) {
      console.error('Error creating receipt:', err);
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      setError(errorMessage || 
        (language === 'he' ? 'שגיאה ביצירת הקבלה' : 'Error creating receipt'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      dir={isRTL ? 'rtl' : 'ltr'}
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <ReceiptIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {text.title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Invoice Selection */}
          <Box>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <ReceiptIcon />
              {text.invoiceInfo}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Autocomplete
              options={invoices}
              getOptionLabel={(option) => 
                `${option.invoiceNumber} - ${option.customerName} (יתרה: ₪${option.remainingAmount.toFixed(2)})`
              }
              value={selectedInvoice}
              onChange={(_, newValue) => handleInvoiceSelect(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={text.selectInvoice}
                  fullWidth
                  required
                />
              )}
              disabled={loading}
            />
          </Box>

          {/* Invoice Details */}
          {selectedInvoice && (
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {text.customer}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedInvoice.customerName}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {text.totalAmount}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    ₪{selectedInvoice.totalAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {text.paidAmount}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    ₪{selectedInvoice.paidAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {text.remainingAmount}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="primary.main">
                    ₪{selectedInvoice.remainingAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Payment Details */}
          <Box>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <MoneyIcon />
              {text.paymentInfo}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={3}>
              <Box display="flex" gap={2}>
                <DatePicker
                  label={text.paymentDate}
                  value={new Date(formData.paymentDate)}
                  onChange={(date) => 
                    handleFieldChange('paymentDate', date?.toISOString().split('T')[0] || '')
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      InputProps: {
                        startAdornment: <InputAdornment position="start"><DateIcon /></InputAdornment>
                      }
                    }
                  }}
                  disabled={loading}
                />

                <TextField
                  label={text.amount}
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleFieldChange('amount', Number(e.target.value))}
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 0.01, max: selectedInvoice?.remainingAmount }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₪</InputAdornment>
                  }}
                  disabled={loading}
                  helperText={
                    selectedInvoice 
                      ? `מקסימום: ₪${selectedInvoice.remainingAmount.toFixed(2)}`
                      : undefined
                  }
                />
              </Box>

              <Box display="flex" gap={2}>
                <TextField
                  select
                  label={text.paymentMethod}
                  value={formData.paymentMethod}
                  onChange={(e) => handleFieldChange('paymentMethod', e.target.value as PaymentMethod)}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><PaymentIcon /></InputAdornment>
                  }}
                  disabled={loading}
                >
                  {(PAYMENT_METHODS as readonly string[]).map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label={text.referenceNumber}
                  value={formData.referenceNumber}
                  onChange={(e) => handleFieldChange('referenceNumber', e.target.value)}
                  fullWidth
                  disabled={loading}
                  placeholder="מספר עסקה, מספר צ'ק וכו'"
                />
              </Box>

              <TextField
                label={text.notes}
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                fullWidth
                multiline
                rows={3}
                disabled={loading}
              />
            </Stack>
          </Box>
        </Stack>
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
        >
          {text.cancel}
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={loading || !selectedInvoice || !formData.amount}
          variant="contained"
          startIcon={<SaveIcon />}
        >
          {loading ? (language === 'he' ? 'שומר...' : 'Saving...') : text.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptCreateDialog;
