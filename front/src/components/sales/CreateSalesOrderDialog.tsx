// Create Sales Order Dialog - דיאלוג יצירת הזמנה
import { useState, useEffect, useCallback } from 'react';
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
  Autocomplete,
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

import type { SalesOrder, Customer, Item, SalesOrderStatus } from '../../types/entities';
import salesOrdersApi, { type CreateSalesOrderRequest } from '../../services/salesOrdersApi';
import { customersApi } from '../../services/customersApi';
import { itemsApi } from '../../services/itemsApi';

interface CreateSalesOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (order: SalesOrder) => void;
  companyId: number;
  initialStatus?: SalesOrderStatus | null;
}

interface OrderLine {
  id: string;
  itemId: number | null;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
  totalPrice: number;
  item?: Item;
}

export function CreateSalesOrderDialog({
  open,
  onClose,
  onSuccess,
  companyId,
  initialStatus = null
}: CreateSalesOrderDialogProps): React.ReactElement {
  const theme = useTheme();
  const isHebrew = theme.direction === 'rtl';

  // Form state
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [status, setStatus] = useState<SalesOrderStatus>(initialStatus || 'Draft');
  const [currency, setCurrency] = useState('ILS');
  const [notes, setNotes] = useState('');
  const [orderLines, setOrderLines] = useState<OrderLine[]>([
    {
      id: '1',
      itemId: null,
      itemName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      vatRate: 17,
      totalPrice: 0
    }
  ]);

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  const loadCustomers = useCallback(async () => {
    try {
      const customersList = await customersApi.getCustomers();
      setCustomers(customersList);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(isHebrew ? 'שגיאה בטעינת רשימת הלקוחות' : 'Error loading customers');
    }
  }, [isHebrew]);

  const loadItems = useCallback(async () => {
    try {
      const itemsList = await itemsApi.getItems();
      setItems(itemsList);
    } catch (err) {
      console.error('Error loading items:', err);
      setError(isHebrew ? 'שגיאה בטעינת רשימת המוצרים' : 'Error loading items');
    }
  }, [isHebrew]);

  useEffect(() => {
    if (open) {
      loadCustomers();
      loadItems();
    }
  }, [open, loadCustomers, loadItems]);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const subtotal = orderLines.reduce((sum, line) => {
      const lineTotal = (line.quantity * line.unitPrice) * (1 - line.discount / 100);
      return sum + lineTotal;
    }, 0);

    const vatAmount = orderLines.reduce((sum, line) => {
      const lineTotal = (line.quantity * line.unitPrice) * (1 - line.discount / 100);
      const lineVat = lineTotal * (line.vatRate / 100);
      return sum + lineVat;
    }, 0);

    const total = subtotal + vatAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }, [orderLines]);

  const totals = calculateTotals();

  // Update line totals when line data changes
  useEffect(() => {
    setOrderLines(lines => 
      lines.map(line => ({
        ...line,
        totalPrice: Math.round((line.quantity * line.unitPrice) * (1 - line.discount / 100) * 100) / 100
      }))
    );
  }, []);

  const handleAddLine = () => {
    const newId = (Math.max(...orderLines.map(l => parseInt(l.id))) + 1).toString();
    setOrderLines([
      ...orderLines,
      {
        id: newId,
        itemId: null,
        itemName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        vatRate: 17,
        totalPrice: 0
      }
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (orderLines.length > 1) {
      setOrderLines(orderLines.filter(line => line.id !== id));
    }
  };

  const handleLineChange = (id: string, field: keyof OrderLine, value: string | number | null) => {
    setOrderLines(lines =>
      lines.map(line => {
        if (line.id === id) {
          const updatedLine = { ...line, [field]: value };
          
          // Auto-populate item details when item is selected
          if (field === 'itemId' && value) {
            const selectedItem = items.find(item => item.id === value);
            if (selectedItem) {
              updatedLine.itemName = selectedItem.name;
              updatedLine.description = selectedItem.description || '';
              updatedLine.unitPrice = selectedItem.sellPrice || 0;
              updatedLine.item = selectedItem;
            }
          }

          // Recalculate total when relevant fields change
          if (['quantity', 'unitPrice', 'discount'].includes(field)) {
            updatedLine.totalPrice = Math.round((updatedLine.quantity * updatedLine.unitPrice) * (1 - updatedLine.discount / 100) * 100) / 100;
          }

          return updatedLine;
        }
        return line;
      })
    );
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!customerId) {
        setError(isHebrew ? 'יש לבחור לקוח' : 'Please select a customer');
        return;
      }

      if (orderLines.length === 0 || orderLines.some(line => !line.itemId || line.quantity <= 0)) {
        setError(isHebrew ? 'יש להוסיף לפחות פריט אחד תקין' : 'Please add at least one valid item');
        return;
      }

      const requestData: CreateSalesOrderRequest = {
        customerId,
        orderDate,
        dueDate: dueDate || undefined,
        status,
        currency,
        notes,
        lines: orderLines.map(line => ({
          itemId: line.itemId!,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discount,
          taxRate: line.vatRate
        }))
      };

      const newOrder = await salesOrdersApi.createSalesOrder(requestData, companyId);
      onSuccess(newOrder);
      handleClose();
    } catch (err) {
      console.error('Error creating sales order:', err);
      setError(isHebrew ? 'שגיאה ביצירת ההזמנה' : 'Error creating sales order');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setOrderDate(new Date());
    setDueDate(null);
    setCustomerId(null);
    setStatus(initialStatus || 'Draft');
    setCurrency('ILS');
    setNotes('');
    setOrderLines([{
      id: '1',
      itemId: null,
      itemName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      vatRate: 17,
      totalPrice: 0
    }]);
    setError(null);
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={isHebrew ? he : undefined}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {isHebrew ? 'הזמנה חדשה' : 'New Sales Order'}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
            {/* Header Information */}
            <Grid size={{ xs: 4, sm: 8, md: 12 }}>
              <Typography variant="h6" gutterBottom>
                {isHebrew ? 'פרטי ההזמנה' : 'Order Details'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 4, sm: 8, md: 6 }}>
              <Autocomplete
                options={customers}
                getOptionLabel={(customer) => customer.name}
                value={customers.find(c => c.id === customerId) || null}
                onChange={(_, value) => setCustomerId(value?.id || null)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={isHebrew ? 'לקוח' : 'Customer'}
                    required
                    fullWidth
                  />
                )}
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 8, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{isHebrew ? 'סטטוס' : 'Status'}</InputLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SalesOrderStatus)}
                  label={isHebrew ? 'סטטוס' : 'Status'}
                >
                  <MenuItem value="Draft">{isHebrew ? 'טיוטה' : 'Draft'}</MenuItem>
                  <MenuItem value="Confirmed">{isHebrew ? 'מאושרת' : 'Confirmed'}</MenuItem>
                  <MenuItem value="PartiallyShipped">{isHebrew ? 'נשלחה חלקית' : 'Partially Shipped'}</MenuItem>
                  <MenuItem value="Shipped">{isHebrew ? 'נשלחה' : 'Shipped'}</MenuItem>
                  <MenuItem value="Completed">{isHebrew ? 'הושלמה' : 'Completed'}</MenuItem>
                  <MenuItem value="Cancelled">{isHebrew ? 'בוטלה' : 'Cancelled'}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <DatePicker
                label={isHebrew ? 'תאריך הזמנה' : 'Order Date'}
                value={orderDate}
                onChange={(date) => setOrderDate(date || new Date())}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <DatePicker
                label={isHebrew ? 'תאריך יעד' : 'Due Date'}
                value={dueDate}
                onChange={(date) => setDueDate(date)}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>{isHebrew ? 'מטבע' : 'Currency'}</InputLabel>
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  label={isHebrew ? 'מטבע' : 'Currency'}
                >
                  <MenuItem value="ILS">₪ (שקל)</MenuItem>
                  <MenuItem value="USD">$ (דולר)</MenuItem>
                  <MenuItem value="EUR">€ (יורו)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Order Lines */}
            <Grid size={{ xs: 4, sm: 8, md: 12 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  {isHebrew ? 'פריטי ההזמנה' : 'Order Items'}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddLine}
                  size="small"
                >
                  {isHebrew ? 'הוסף פריט' : 'Add Item'}
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{isHebrew ? 'פריט' : 'Item'}</TableCell>
                      <TableCell>{isHebrew ? 'תיאור' : 'Description'}</TableCell>
                      <TableCell align="center" width={100}>{isHebrew ? 'כמות' : 'Qty'}</TableCell>
                      <TableCell align="right" width={120}>{isHebrew ? 'מחיר יחידה' : 'Unit Price'}</TableCell>
                      <TableCell align="center" width={100}>{isHebrew ? 'הנחה %' : 'Discount %'}</TableCell>
                      <TableCell align="center" width={100}>{isHebrew ? 'מע״מ %' : 'VAT %'}</TableCell>
                      <TableCell align="right" width={120}>{isHebrew ? 'סה״כ' : 'Total'}</TableCell>
                      <TableCell align="center" width={60}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Autocomplete
                            size="small"
                            options={items}
                            getOptionLabel={(item) => item.name}
                            value={items.find(i => i.id === line.itemId) || null}
                            onChange={(_, value) => handleLineChange(line.id, 'itemId', value?.id || null)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder={isHebrew ? 'בחר פריט' : 'Select item'}
                                size="small"
                                sx={{ minWidth: 150 }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={line.description}
                            onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                            placeholder={isHebrew ? 'תיאור' : 'Description'}
                            multiline
                            rows={1}
                            sx={{ minWidth: 120 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(line.id, 'quantity', Number(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.1 }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(line.id, 'unitPrice', Number(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={line.discount}
                            onChange={(e) => handleLineChange(line.id, 'discount', Number(e.target.value) || 0)}
                            inputProps={{ min: 0, max: 100, step: 0.1 }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={line.vatRate}
                            onChange={(e) => handleLineChange(line.id, 'vatRate', Number(e.target.value) || 0)}
                            inputProps={{ min: 0, max: 100, step: 0.1 }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {line.totalPrice.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveLine(line.id)}
                            disabled={orderLines.length === 1}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Totals */}
            <Grid size={{ xs: 4, sm: 8, md: 12 }}>
              <Box display="flex" justifyContent="flex-end">
                <Box minWidth={300}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {isHebrew ? 'סכום ביניים:' : 'Subtotal:'}
                    </Typography>
                    <Typography variant="body2">
                      {currency === 'ILS' ? '₪' : currency} {totals.subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {isHebrew ? 'מע״מ:' : 'VAT:'}
                    </Typography>
                    <Typography variant="body2">
                      {currency === 'ILS' ? '₪' : currency} {totals.vatAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold">
                      {isHebrew ? 'סה״כ:' : 'Total:'}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {currency === 'ILS' ? '₪' : currency} {totals.total.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Notes */}
            <Grid size={{ xs: 4, sm: 8, md: 12 }}>
              <TextField
                label={isHebrew ? 'הערות' : 'Notes'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
                placeholder={isHebrew ? 'הערות נוספות להזמנה...' : 'Additional notes for the order...'}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={saving}>
            {isHebrew ? 'ביטול' : 'Cancel'}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving || !customerId}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving 
              ? (isHebrew ? 'שומר...' : 'Saving...') 
              : (isHebrew ? 'צור הזמנה' : 'Create Order')
            }
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default CreateSalesOrderDialog;
