import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Grid,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Autocomplete,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { 
  CreateSalesOrderForm, 
  CreateSalesOrderLineForm, 
  Customer, 
  Item, 
  SalesOrderStatus 
} from '../../types/entities';
import { customersAPI, itemsAPI, salesAPI } from '../../services/api';

interface SalesOrderFormProps {
  onSave: () => void;
  onCancel: () => void;
}

const initialLine: CreateSalesOrderLineForm = {
  itemId: 0,
  description: '',
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  taxRate: 17, // Default Israeli VAT
};

const statusOptions: { value: SalesOrderStatus; label: string }[] = [
  { value: 'Draft', label: 'טיוטה' },
  { value: 'Confirmed', label: 'מאושר' },
  { value: 'Shipped', label: 'נשלח' },
  { value: 'Invoiced', label: 'חשבונית' },
];

const SalesOrderForm: React.FC<SalesOrderFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState<CreateSalesOrderForm>({
    customerId: 0,
    orderDate: new Date(),
    dueDate: undefined,
    status: 'Draft',
    currency: 'ILS',
    notes: '',
    lines: [{ ...initialLine }],
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersData, itemsData] = await Promise.all([
          customersAPI.getAll(),
          itemsAPI.getAll(),
        ]);
        setCustomers(customersData);
        setItems(itemsData);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (field: keyof CreateSalesOrderForm, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLineChange = (index: number, field: keyof CreateSalesOrderLineForm, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      ),
    }));
  };

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { ...initialLine }],
    }));
  };

  const removeLine = (index: number) => {
    if (formData.lines.length > 1) {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index),
      }));
    }
  };

  const handleItemSelect = (index: number, item: Item | null) => {
    if (item) {
      handleLineChange(index, 'itemId', item.id);
      handleLineChange(index, 'description', item.name);
      handleLineChange(index, 'unitPrice', item.price);
    }
  };

  const calculateLineTotal = (line: CreateSalesOrderLineForm) => {
    const subtotal = line.quantity * line.unitPrice;
    const discount = subtotal * (line.discountPercent || 0) / 100;
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (line.taxRate || 0) / 100;
    return afterDiscount + tax;
  };

  const calculateTotals = () => {
    const subtotal = formData.lines.reduce((sum, line) => {
      return sum + (line.quantity * line.unitPrice);
    }, 0);

    const discount = formData.lines.reduce((sum, line) => {
      return sum + (line.quantity * line.unitPrice * (line.discountPercent || 0) / 100);
    }, 0);

    const afterDiscount = subtotal - discount;

    const tax = formData.lines.reduce((sum, line) => {
      const lineSubtotal = line.quantity * line.unitPrice;
      const lineDiscount = lineSubtotal * (line.discountPercent || 0) / 100;
      const lineAfterDiscount = lineSubtotal - lineDiscount;
      return sum + (lineAfterDiscount * (line.taxRate || 0) / 100);
    }, 0);

    const total = afterDiscount + tax;

    return { subtotal, discount, tax, total };
  };

  const handleSubmit = async () => {
    if (!formData.customerId || formData.lines.length === 0) {
      setError('Please select a customer and add at least one line item');
      return;
    }

    // Validate lines
    const invalidLines = formData.lines.some(line => 
      !line.itemId || line.quantity <= 0 || line.unitPrice < 0
    );

    if (invalidLines) {
      setError('Please ensure all line items have valid item, quantity, and price');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await salesAPI.createOrder(formData);
      onSave();
    } catch (err) {
      setError('Failed to create sales order');
      console.error('Error creating sales order:', err);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          title="הזמנת מכירה חדשה"
          action={
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                שמור
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
                disabled={loading}
              >
                ביטול
              </Button>
            </Box>
          }
        />
        <CardContent>
          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
            <Grid size={{ xs: 4, sm: 4, md: 6 }}>
              <Autocomplete
                options={customers}
                getOptionLabel={(customer) => customer.name}
                value={customers.find(c => c.id === formData.customerId) || null}
                onChange={(_, customer) => handleInputChange('customerId', customer?.id || 0)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="לקוח"
                    required
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 4, md: 6 }}>
              <TextField
                select
                label="סטטוס"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                fullWidth
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <DatePicker
                label="תאריך הזמנה"
                value={formData.orderDate}
                onChange={(date) => handleInputChange('orderDate', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <DatePicker
                label="תאריך יעד"
                value={formData.dueDate}
                onChange={(date) => handleInputChange('dueDate', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <TextField
                label="מטבע"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 8, md: 12 }}>
              <TextField
                label="הערות"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>

          <Box mt={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">פריטים</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addLine}
              >
                הוסף פריט
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>פריט</TableCell>
                    <TableCell>תיאור</TableCell>
                    <TableCell>כמות</TableCell>
                    <TableCell>מחיר יחידה</TableCell>
                    <TableCell>הנחה %</TableCell>
                    <TableCell>מע״מ %</TableCell>
                    <TableCell>סך הכל</TableCell>
                    <TableCell>פעולות</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.lines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          options={items}
                          getOptionLabel={(item) => `${item.sku} - ${item.name}`}
                          value={items.find(item => item.id === line.itemId) || null}
                          onChange={(_, item) => handleItemSelect(index, item)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              style={{ minWidth: 200 }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={line.description}
                          onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          style={{ minWidth: 150 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          style={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          style={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.discountPercent}
                          onChange={(e) => handleLineChange(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                          style={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.taxRate}
                          onChange={(e) => handleLineChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          style={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        ₪{calculateLineTotal(line).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => removeLine(index)}
                          disabled={formData.lines.length === 1}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box mt={2} display="flex" justifyContent="flex-end">
              <Box minWidth={300}>
                <Grid container spacing={{ xs: 1, md: 1 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                  <Grid size={{ xs: 3, sm: 6, md: 8 }}>
                    <Typography>סכום ביניים:</Typography>
                  </Grid>
                  <Grid size={{ xs: 1, sm: 2, md: 4 }}>
                    <Typography align="right">₪{totals.subtotal.toLocaleString()}</Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 3, sm: 6, md: 8 }}>
                    <Typography>הנחה:</Typography>
                  </Grid>
                  <Grid size={{ xs: 1, sm: 2, md: 4 }}>
                    <Typography align="right">₪{totals.discount.toLocaleString()}</Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 3, sm: 6, md: 8 }}>
                    <Typography>מע״מ:</Typography>
                  </Grid>
                  <Grid size={{ xs: 1, sm: 2, md: 4 }}>
                    <Typography align="right">₪{totals.tax.toLocaleString()}</Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 3, sm: 6, md: 8 }}>
                    <Typography variant="h6" fontWeight="bold">סך הכל:</Typography>
                  </Grid>
                  <Grid size={{ xs: 1, sm: 2, md: 4 }}>
                    <Typography variant="h6" fontWeight="bold" align="right">
                      ₪{totals.total.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SalesOrderForm;
