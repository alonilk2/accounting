// Create Quote Dialog - דיאלוג יצירת הצעת מחיר
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { useTheme } from '@mui/material/styles';

import type { Quote, Customer, Item, QuoteStatus } from '../../types/entities';
import { customersApi } from '../../services/customersApi';
import { itemsApi } from '../../services/itemsApi';
import { quotesApi, type CreateQuoteRequest } from '../../services/quotesApi';

interface CreateQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (quote: Quote) => void;
  companyId: number;
}

interface QuoteLineForm {
  id: string;
  itemId: number;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  lineTotal: number;
  taxAmount: number;
}

const CreateQuoteDialog: React.FC<CreateQuoteDialogProps> = ({
  open,
  onClose,
  onSuccess,
  companyId
}) => {
  const theme = useTheme();
  const isRTL = theme.direction === 'rtl';

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customerId: 0,
    agentId: undefined as number | undefined,
    quoteDate: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as Date | null, // 30 days from now
    status: 'Draft' as QuoteStatus,
    currency: 'ILS',
    exchangeRate: 1,
    notes: '',
    terms: '',
    deliveryTerms: '',
    paymentTerms: ''
  });

  const [lines, setLines] = useState<QuoteLineForm[]>([]);

  // Load customers and items on mount
  useEffect(() => {
    if (open) {
      loadCustomers();
      loadItems();
    }
  }, [open, companyId]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const customersData = await customersApi.getCustomers();
      setCustomers(customersData);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('שגיאה בטעינת רשימת הלקוחות');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadItems = async () => {
    try {
      setLoadingItems(true);
      const itemsData = await itemsApi.getItems();
      setItems(itemsData);
    } catch (err) {
      console.error('Error loading items:', err);
      setError('שגיאה בטעינת רשימת המוצרים');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAddLine = () => {
    const newLine: QuoteLineForm = {
      id: `line-${Date.now()}`,
      itemId: 0,
      itemName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      taxRate: 17, // Default Israeli VAT
      lineTotal: 0,
      taxAmount: 0
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (lineId: string) => {
    setLines(lines.filter(line => line.id !== lineId));
  };

  const handleLineChange = (lineId: string, field: keyof QuoteLineForm, value: string | number) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        const updatedLine = { ...line, [field]: value };
        
        // If item changed, update item name and price
        if (field === 'itemId') {
          const selectedItem = items.find(item => item.id === value);
          if (selectedItem) {
            updatedLine.itemName = selectedItem.name;
            updatedLine.unitPrice = selectedItem.price;
            updatedLine.description = selectedItem.description || '';
          }
        }

        // Recalculate totals
        const lineTotal = updatedLine.quantity * updatedLine.unitPrice * (1 - updatedLine.discountPercent / 100);
        const taxAmount = lineTotal * (updatedLine.taxRate / 100);
        
        return {
          ...updatedLine,
          lineTotal,
          taxAmount
        };
      }
      return line;
    }));
  };

  const calculateTotals = () => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const totalTax = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const total = subtotal + totalTax;
    const discountAmount = lines.reduce((sum, line) => 
      sum + (line.quantity * line.unitPrice * line.discountPercent / 100), 0
    );

    return { subtotal, totalTax, total, discountAmount };
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate form
      if (!formData.customerId) {
        setError('נא לבחור לקוח');
        return;
      }

      if (lines.length === 0) {
        setError('נא להוסיף לפחות שורה אחת');
        return;
      }

      // Validate lines
      for (const line of lines) {
        if (!line.itemId) {
          setError('נא לבחור מוצר בכל השורות');
          return;
        }
        if (line.quantity <= 0) {
          setError('כמות חייבת להיות גדולה מאפס');
          return;
        }
      }

      const request: CreateQuoteRequest = {
        customerId: formData.customerId,
        agentId: formData.agentId,
        quoteDate: formData.quoteDate.toISOString(),
        validUntil: formData.validUntil?.toISOString(),
        status: formData.status,
        currency: formData.currency,
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
        deliveryTerms: formData.deliveryTerms || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        lines: lines.map((line) => ({
          itemId: line.itemId,
          description: line.description || undefined,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          taxRate: line.taxRate
        }))
      };

      // Create quote using API
      const createdQuote = await quotesApi.createQuote(request, companyId);
      
      onSuccess(createdQuote);
      handleClose();
    } catch (err: unknown) {
      console.error('Error creating quote:', err);
      const errorMessage = err instanceof Error ? err.message : 'שגיאה ביצירת הצעת המחיר';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customerId: 0,
      agentId: undefined,
      quoteDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as Date | null,
      status: 'Draft',
      currency: 'ILS',
      exchangeRate: 1,
      notes: '',
      terms: '',
      deliveryTerms: '',
      paymentTerms: ''
    });
    setLines([]);
    setError(null);
    onClose();
  };

  const { subtotal, totalTax, total } = calculateTotals();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">יצירת הצעת מחיר חדשה</Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
            {/* Customer Selection */}
            <Grid size={{ xs: 4, sm: 4, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>לקוח</InputLabel>
                <Select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: Number(e.target.value) })}
                  label="לקוח"
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

            {/* Quote Date */}
            <Grid size={{ xs: 4, sm: 4, md: 6 }}>
              <DatePicker
                label="תאריך הצעת מחיר"
                value={formData.quoteDate}
                onChange={(date) => setFormData({ ...formData, quoteDate: date || new Date() })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>

            {/* Valid Until */}
            <Grid size={{ xs: 4, sm: 4, md: 6 }}>
              <DatePicker
                label="תוקף עד"
                value={formData.validUntil}
                onChange={(date) => setFormData({ ...formData, validUntil: date || null })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            {/* Currency */}
            <Grid size={{ xs: 4, sm: 4, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>מטבע</InputLabel>
                <Select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  label="מטבע"
                >
                  <MenuItem value="ILS">שקל ישראלי (₪)</MenuItem>
                  <MenuItem value="USD">דולר אמריקני ($)</MenuItem>
                  <MenuItem value="EUR">יורו (€)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Terms */}
            <Grid size={{ xs: 4, sm: 8, md: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="תנאי התשלום"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 8, md: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="תנאי אספקה"
                value={formData.deliveryTerms}
                onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 8, md: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="הערות"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Line Items */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">פריטים</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddLine}
                variant="outlined"
                disabled={loadingItems}
              >
                הוסף פריט
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>מוצר</TableCell>
                    <TableCell>תיאור</TableCell>
                    <TableCell>כמות</TableCell>
                    <TableCell>מחיר יחידה</TableCell>
                    <TableCell>הנחה %</TableCell>
                    <TableCell>מס %</TableCell>
                    <TableCell>סה"כ</TableCell>
                    <TableCell width={50}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={line.itemId}
                            onChange={(e) => handleLineChange(line.id, 'itemId', Number(e.target.value))}
                            displayEmpty
                          >
                            <MenuItem value={0}>בחר מוצר</MenuItem>
                            {items.map((item) => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={line.description}
                          onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(line.id, 'quantity', Number(e.target.value))}
                          inputProps={{ min: 0.01, step: 0.01 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(line.id, 'unitPrice', Number(e.target.value))}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.discountPercent}
                          onChange={(e) => handleLineChange(line.id, 'discountPercent', Number(e.target.value))}
                          inputProps={{ min: 0, max: 100, step: 0.01 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.taxRate}
                          onChange={(e) => handleLineChange(line.id, 'taxRate', Number(e.target.value))}
                          inputProps={{ min: 0, max: 100, step: 0.01 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(line.lineTotal + line.taxAmount).toFixed(2)} ₪
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveLine(line.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals */}
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Box width={300}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>סכום חלקי:</Typography>
                  <Typography>{subtotal.toFixed(2)} ₪</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>מס:</Typography>
                  <Typography>{totalTax.toFixed(2)} ₪</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="h6">סה"כ:</Typography>
                  <Typography variant="h6">{total.toFixed(2)} ₪</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>ביטול</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.customerId || lines.length === 0}
          >
            {loading ? <CircularProgress size={20} /> : 'יצירת הצעת מחיר'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateQuoteDialog;
