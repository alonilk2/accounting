import React, { useState, useEffect, useCallback, useRef, useTransition } from 'react';
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
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  DateRange as DateIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useUIStore } from '../../stores';
import { invoicesAPI } from '../../services/api';
import receiptsService from '../../services/receiptsService';
import type { CreateReceiptRequest, PaymentMethod } from '../../types/receipt';
import { textFieldStyles, dialogStyles, buttonStyles } from '../../styles/formStyles';

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
  const [isPending, startTransition] = useTransition();
  
  // Tab state - 0 for invoice-based, 1 for standalone
  const [tabValue, setTabValue] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState<CreateReceiptRequest>({
    invoiceId: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'מזומן',
    referenceNumber: '',
    notes: '',
    currency: 'ILS',
    // Standalone receipt fields
    customerName: '',
    customerTaxId: '',
    description: '',
  });
  
  // Data state
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceOption | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 10;
  
  // Debounce timer
  const searchTimeoutRef = useRef<number | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const text = {
    title: language === 'he' ? 'יצירת קבלה' : 'Create Receipt',
    // Tab labels
    invoiceBasedTab: language === 'he' ? 'קבלה עבור חשבונית' : 'Receipt for Invoice',
    standaloneTab: language === 'he' ? 'קבלה עצמאית' : 'Standalone Receipt',
    // Common fields
    invoice: language === 'he' ? 'חשבונית' : 'Invoice',
    customer: language === 'he' ? 'לקוח' : 'Customer',
    customerName: language === 'he' ? 'שם הלקוח' : 'Customer Name',
    customerTaxId: language === 'he' ? 'ח.פ./ע.מ.' : 'Tax ID',
    description: language === 'he' ? 'תיאור' : 'Description',
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
    customerInfo: language === 'he' ? 'פרטי הלקוח' : 'Customer Information',
    amountExceedsRemaining: language === 'he' ? 'הסכום עולה על היתרה' : 'Amount exceeds remaining balance',
    pleaseSelectInvoice: language === 'he' ? 'אנא בחר חשבונית' : 'Please select an invoice',
    pleaseEnterAmount: language === 'he' ? 'אנא הזן סכום' : 'Please enter an amount',
    pleaseEnterCustomerName: language === 'he' ? 'אנא הזן שם לקוח' : 'Please enter customer name',
    amountMustBePositive: language === 'he' ? 'הסכום חייב להיות חיובי' : 'Amount must be positive',
    searchInvoice: language === 'he' ? 'חפש חשבונית...' : 'Search invoice...',
    noInvoicesFound: language === 'he' ? 'לא נמצאו חשבוניות' : 'No invoices found',
    startTypingToSearch: language === 'he' ? 'התחל להקליד לחיפוש חשבוניות' : 'Start typing to search invoices',
    loadMore: language === 'he' ? 'טען עוד' : 'Load more',
    loading: language === 'he' ? 'טוען...' : 'Loading...',
    standaloneReceiptDescription: language === 'he' ? 'תיאור התשלום' : 'Payment description',
  };

  const loadInvoices = useCallback(async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      console.log('Loading invoices with search:', search);
      const response = await invoicesAPI.getAll({
        // Remove status filter to see all invoices
        // status: 'Sent',
        page,
        pageSize,
        search: search || undefined
      });
      
      // Filter unpaid invoices and transform to options
      const unpaidInvoices = response.data
        .filter(invoice => invoice.totalAmount > invoice.paidAmount)
        .map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName || 'N/A',
          totalAmount: invoice.totalAmount,
          paidAmount: invoice.paidAmount,
          remainingAmount: invoice.totalAmount - invoice.paidAmount,
          currency: invoice.currency || 'ILS',
        }));
      
      // Use a callback to prevent focus loss
      setInvoices(prev => {
        if (page === 1) {
          return unpaidInvoices;
        } else {
          return [...prev, ...unpaidInvoices];
        }
      });
      
      setHasMore(response.hasNextPage);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError(language === 'he' ? 'שגיאה בטעינת החשבוניות' : 'Error loading invoices');
    } finally {
      setLoading(false);
    }
  }, [language, pageSize]);

  const resetForm = () => {
    setFormData({
      invoiceId: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'מזומן',
      referenceNumber: '',
      notes: '',
      currency: 'ILS',
      // Standalone receipt fields
      customerName: '',
      customerTaxId: '',
      description: '',
    });
    setSelectedInvoice(null);
    setSearchTerm('');
    setInputValue('');
    setCurrentPage(1);
    setInvoices([]);
    setError('');
    setTabValue(0); // Reset to invoice-based tab
    
    // Clear search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (open) {
      resetForm();
      loadInvoices(1, '');
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

  const handleInvoiceSelect = (invoice: InvoiceOption | null) => {
    setSelectedInvoice(invoice);
    if (invoice) {
      setFormData(prev => ({
        ...prev,
        invoiceId: invoice.id,
        amount: invoice.remainingAmount, // Default to full remaining amount
        currency: invoice.currency,
      }));
      // Update input value to show selected invoice
      setInputValue(`${invoice.invoiceNumber} - ${invoice.customerName}`);
    } else {
      setFormData(prev => ({
        ...prev,
        invoiceId: 0,
        amount: 0,
        currency: 'ILS',
      }));
      setInputValue('');
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(''); // Clear any validation errors when switching tabs
    
    // Reset form data appropriately for the selected tab
    if (newValue === 0) {
      // Invoice-based receipt
      setFormData(prev => ({
        ...prev,
        invoiceId: 0,
        customerName: '',
        customerTaxId: '',
        description: '',
      }));
      setSelectedInvoice(null);
      setInputValue('');
    } else {
      // Standalone receipt
      setFormData(prev => ({
        ...prev,
        invoiceId: undefined,
        amount: 0,
      }));
      setSelectedInvoice(null);
      setInputValue('');
    }
  };

  const handleFieldChange = (field: keyof CreateReceiptRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearchChange = useCallback((searchValue: string) => {
    setInputValue(searchValue); // Update input immediately for responsive UI
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = window.setTimeout(async () => {
      setSearchTerm(searchValue); // Update search term after delay
      setCurrentPage(1);
      
      // Load invoices without blocking the input
      try {
        console.log('Searching invoices with:', searchValue);
        const response = await invoicesAPI.getAll({
          page: 1,
          pageSize,
          search: searchValue || undefined
        });
        
        console.log('Search response:', response);
        
        // Filter unpaid invoices and transform to options
        const unpaidInvoices = response.data
          .filter(invoice => invoice.totalAmount > invoice.paidAmount)
          .map(invoice => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customerName || 'N/A',
            totalAmount: invoice.totalAmount,
            paidAmount: invoice.paidAmount,
            remainingAmount: invoice.totalAmount - invoice.paidAmount,
            currency: invoice.currency || 'ILS',
          }));
        
        // Update invoices without causing re-render that loses focus
        startTransition(() => {
          setInvoices(unpaidInvoices);
          setHasMore(response.hasNextPage);
        });
      } catch (err) {
        console.error('Error loading invoices:', err);
        setError(language === 'he' ? 'שגיאה בטעינת החשבוניות' : 'Error loading invoices');
      }
    }, 300); // 300ms delay
  }, [pageSize, language]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadInvoices(nextPage, searchTerm); // Use searchTerm for consistent results
    }
  };

  const validateForm = (): boolean => {
    if (tabValue === 0) {
      // Invoice-based receipt validation
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
    } else {
      // Standalone receipt validation
      if (!formData.customerName?.trim()) {
        setError(text.pleaseEnterCustomerName);
        return false;
      }

      if (!formData.amount || formData.amount <= 0) {
        setError(text.amountMustBePositive);
        return false;
      }
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
      sx={dialogStyles}
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

        {/* Tab Selection */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            dir={isRTL ? 'rtl' : 'ltr'}
            sx={{
              '& .MuiTab-root': {
                minWidth: 120,
                fontWeight: 600,
              }
            }}
          >
            <Tab
              label={text.invoiceBasedTab}
              icon={<ReceiptIcon />}
              iconPosition="start"
            />
            <Tab
              label={text.standaloneTab}
              icon={<PersonIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
          {/* Invoice-based Receipt Tab */}
          {tabValue === 0 && (
            <>
              {/* Invoice Selection */}
              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
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
              </Grid>

              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <Autocomplete
                  key="invoice-autocomplete"
                  freeSolo
                  options={invoices}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return `${option.invoiceNumber} - ${option.customerName} (יתרה: ₪${option.remainingAmount.toFixed(2)})`;
                  }}
                  value={selectedInvoice}
                  onChange={(_, newValue) => {
                    if (newValue && typeof newValue !== 'string') {
                      handleInvoiceSelect(newValue);
                    }
                  }}
                  onInputChange={(_, value, reason) => {
                    if (reason === 'input') {
                      handleSearchChange(value);
                    }
                  }}
                  filterOptions={(options) => options}
                  inputValue={inputValue}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={text.selectInvoice}
                      fullWidth
                      required
                      sx={textFieldStyles}
                      placeholder={text.searchInvoice}
                    />
                  )}
                  renderOption={(props, option, { index }) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1">
                          {option.invoiceNumber} - {option.customerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          יתרה: ₪{option.remainingAmount.toFixed(2)} מתוך ₪{option.totalAmount.toFixed(2)}
                        </Typography>
                        {index === invoices.length - 1 && hasMore && (
                          <Box sx={{ pt: 1, textAlign: 'center' }}>
                            <Button
                              size="small"
                              onClick={handleLoadMore}
                              disabled={loading}
                              sx={{ fontSize: '0.75rem' }}
                            >
                              {loading ? text.loading : text.loadMore}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </li>
                  )}
                  loading={loading || isPending}
                  disabled={loading}
                  noOptionsText={
                    inputValue ? text.noInvoicesFound : text.startTypingToSearch
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Grid>

              {/* Invoice Details */}
              {selectedInvoice && (
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Grid container spacing={{ xs: 1, md: 2 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                      <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            {text.customer}:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {selectedInvoice.customerName}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            {text.totalAmount}:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            ₪{selectedInvoice.totalAmount.toFixed(2)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            {text.paidAmount}:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            ₪{selectedInvoice.paidAmount.toFixed(2)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            {text.remainingAmount}:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium" color="primary.main">
                            ₪{selectedInvoice.remainingAmount.toFixed(2)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </>
          )}

          {/* Standalone Receipt Tab */}
          {tabValue === 1 && (
            <>
              {/* Customer Information */}
              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  fontWeight: 600,
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <PersonIcon />
                  {text.customerInfo}
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                <TextField
                  label={text.customerName}
                  value={formData.customerName || ''}
                  onChange={(e) => handleFieldChange('customerName', e.target.value)}
                  fullWidth
                  required
                  sx={textFieldStyles}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>
                  }}
                />
              </Grid>

              <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                <TextField
                  label={text.customerTaxId}
                  value={formData.customerTaxId || ''}
                  onChange={(e) => handleFieldChange('customerTaxId', e.target.value)}
                  fullWidth
                  sx={textFieldStyles}
                  disabled={loading}
                  placeholder="ח.פ./ע.מ. (אופציונלי)"
                />
              </Grid>

              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <TextField
                  label={text.standaloneReceiptDescription}
                  value={formData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  sx={textFieldStyles}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><DescriptionIcon /></InputAdornment>
                  }}
                  placeholder="תיאור התשלום או השירות"
                />
              </Grid>
            </>
          )}

          {/* Payment Details - Common for both tabs */}
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
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
          </Grid>

          <Grid size={{ xs: 4, sm: 4, md: 6 }}>
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
                  sx: textFieldStyles,
                  InputProps: {
                    startAdornment: <InputAdornment position="start"><DateIcon /></InputAdornment>
                  }
                }
              }}
              disabled={loading}
            />
          </Grid>

          <Grid size={{ xs: 4, sm: 4, md: 6 }}>
            <TextField
              label={text.amount}
              type="number"
              value={formData.amount}
              onChange={(e) => handleFieldChange('amount', Number(e.target.value))}
              fullWidth
              required
              inputProps={{ 
                min: 0, 
                step: 0.01, 
                max: tabValue === 0 ? selectedInvoice?.remainingAmount : undefined 
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₪</InputAdornment>
              }}
              sx={textFieldStyles}
              disabled={loading}
              helperText={
                tabValue === 0 && selectedInvoice 
                  ? `מקסימום: ₪${selectedInvoice.remainingAmount.toFixed(2)}`
                  : undefined
              }
            />
          </Grid>

          <Grid size={{ xs: 4, sm: 4, md: 6 }}>
            <TextField
              select
              label={text.paymentMethod}
              value={formData.paymentMethod}
              onChange={(e) => handleFieldChange('paymentMethod', e.target.value as PaymentMethod)}
              fullWidth
              required
              sx={textFieldStyles}
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
          </Grid>

          <Grid size={{ xs: 4, sm: 4, md: 6 }}>
            <TextField
              label={text.referenceNumber}
              value={formData.referenceNumber}
              onChange={(e) => handleFieldChange('referenceNumber', e.target.value)}
              fullWidth
              sx={textFieldStyles}
              disabled={loading}
              placeholder="מספר עסקה, מספר צ'ק וכו'"
            />
          </Grid>

          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <TextField
              label={text.notes}
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={textFieldStyles}
              disabled={loading}
            />
          </Grid>
        </Grid>
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
          onClick={handleSave}
          disabled={loading || 
            (tabValue === 0 && (!selectedInvoice || !formData.amount)) ||
            (tabValue === 1 && (!formData.customerName || !formData.amount))
          }
          variant="contained"
          startIcon={<SaveIcon />}
          sx={buttonStyles.primary}
        >
          {loading ? (language === 'he' ? 'שומר...' : 'Saving...') : text.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptCreateDialog;
