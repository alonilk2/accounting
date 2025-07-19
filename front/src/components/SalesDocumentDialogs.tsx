import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Autocomplete,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useUIStore } from '../stores';
import { salesAPI } from '../services/api';
import { customersApi } from '../services/customersApi';
import { itemsAPI } from '../services/api';
import type { SalesOrderStatus, Customer, Item, CreateSalesOrderForm } from '../types/entities';

interface SalesDocumentDialogsProps {
  open: boolean;
  onClose: () => void;
  documentType?: 'Quote' | 'Confirmed' | 'Shipped';
  onSuccess?: () => void;
}

const SalesDocumentDialogs: React.FC<SalesDocumentDialogsProps> = ({
  open,
  onClose,
  documentType = 'Quote',
  onSuccess
}) => {
  const { language } = useUIStore();
  
  // States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    customerId: 0,
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    deliveryDate: '',
    status: documentType as SalesOrderStatus,
    notes: ''
  });

  // Line items state
  interface OrderLine {
    itemId: number;
    itemName?: string;
    itemSku?: string;
    quantity: number;
    unitPrice: number;
    description: string;
    lineTotal?: number;
  }

  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [newLineData, setNewLineData] = useState({
    itemId: 0,
    quantity: 1,
    unitPrice: 0,
    description: ''
  });

  // Load data
  const loadCustomers = async () => {
    try {
      const data = await customersApi.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadItems = async () => {
    try {
      const data = await itemsAPI.getAll({ isActive: true });
      setItems(data);
    } catch (err) {
      console.error('Error loading items:', err);
    }
  };

  // Effects
  useEffect(() => {
    if (open) {
      loadCustomers();
      loadItems();
    }
  }, [open]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, status: documentType }));
  }, [documentType]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const orderData: CreateSalesOrderForm = {
        customerId: formData.customerId,
        orderDate: new Date(formData.orderDate),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
        status: formData.status,
        notes: formData.notes,
        lines: orderLines.map((line) => ({
          itemId: line.itemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          description: line.description,
        }))
      };

      await salesAPI.createOrder(orderData);
      resetForm();
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(language === 'he' ? 'שגיאה בשמירת המסמך' : 'Error saving document');
      console.error('Error saving document:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      customerId: 0,
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      deliveryDate: '',
      status: documentType,
      notes: ''
    });
    setOrderLines([]);
    setNewLineData({
      itemId: 0,
      quantity: 1,
      unitPrice: 0,
      description: ''
    });
    setError(null);
  };

  // Handle dialog close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Line items handlers
  const addOrderLine = () => {
    if (newLineData.itemId === 0) return;
    
    const selectedItem = items.find(item => item.id === newLineData.itemId);
    const newLine: OrderLine = {
      itemId: newLineData.itemId,
      itemName: selectedItem?.name,
      itemSku: selectedItem?.sku,
      quantity: newLineData.quantity,
      unitPrice: newLineData.unitPrice,
      description: newLineData.description || selectedItem?.description || '',
      lineTotal: newLineData.quantity * newLineData.unitPrice
    };
    
    setOrderLines([...orderLines, newLine]);
    setNewLineData({
      itemId: 0,
      quantity: 1,
      unitPrice: 0,
      description: ''
    });
  };

  const updateOrderLine = (index: number, field: keyof OrderLine, value: string | number) => {
    const newLines = [...orderLines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Recalculate line total if quantity or price changed
    if (field === 'quantity' || field === 'unitPrice') {
      newLines[index].lineTotal = newLines[index].quantity * newLines[index].unitPrice;
    }
    
    setOrderLines(newLines);
  };

  const removeOrderLine = (index: number) => {
    const newLines = orderLines.filter((_, i) => i !== index);
    setOrderLines(newLines);
  };

  // Get document title based on type
  const getDocumentTitle = () => {
    if (language === 'he') {
      switch (documentType) {
        case 'Quote': return 'הצעת מחיר חדשה';
        case 'Confirmed': return 'הזמנה חדשה';
        case 'Shipped': return 'תעודת משלוח חדשה';
        default: return 'מסמך חדש';
      }
    } else {
      switch (documentType) {
        case 'Quote': return 'New Quote';
        case 'Confirmed': return 'New Order';
        case 'Shipped': return 'New Delivery Note';
        default: return 'New Document';
      }
    }
  };

  const text = {
    title: getDocumentTitle(),
    customer: language === 'he' ? 'לקוח' : 'Customer',
    orderDate: language === 'he' ? 'תאריך הזמנה' : 'Order Date',
    dueDate: language === 'he' ? 'תאריך יעד' : 'Due Date',
    deliveryDate: language === 'he' ? 'תאריך משלוח' : 'Delivery Date',
    status: language === 'he' ? 'סטטוס' : 'Status',
    cancel: language === 'he' ? 'ביטול' : 'Cancel',
    save: language === 'he' ? 'שמירה' : 'Save',
    selectCustomer: language === 'he' ? 'בחר לקוח' : 'Select Customer',
    notes: language === 'he' ? 'הערות' : 'Notes',
    items: language === 'he' ? 'פריטים' : 'Items',
    item: language === 'he' ? 'פריט' : 'Item',
    description: language === 'he' ? 'תיאור' : 'Description',
    quantity: language === 'he' ? 'כמות' : 'Quantity',
    unitPrice: language === 'he' ? 'מחיר יחידה' : 'Unit Price',
    total: language === 'he' ? 'סה"כ' : 'Total',
    addItem: language === 'he' ? 'הוסף פריט' : 'Add Item',
    selectItem: language === 'he' ? 'בחר פריט' : 'Select Item',
    actions: language === 'he' ? 'פעולות' : 'Actions'
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        {text.title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Customer Selection */}
          <Autocomplete
            options={customers}
            getOptionLabel={(option) => option.name}
            value={customers.find(c => c.id === formData.customerId) || null}
            onChange={(_, newValue) => {
              setFormData({ ...formData, customerId: newValue?.id || 0 });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={text.selectCustomer}
                required
              />
            )}
          />

          {/* Dates */}
          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
            <Grid size={{ xs: 4, sm: 8, md: 4 }}>
              <TextField
                fullWidth
                label={text.orderDate}
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{ xs: 4, sm: 8, md: 4 }}>
              <TextField
                fullWidth
                label={text.dueDate}
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 4, sm: 8, md: 4 }}>
              <TextField
                fullWidth
                label={text.deliveryDate}
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {/* Status */}
          <FormControl fullWidth>
            <InputLabel>{text.status}</InputLabel>
            <Select
              value={formData.status}
              label={text.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as SalesOrderStatus })}
            >
              <MenuItem value="Quote">הצעת מחיר</MenuItem>
              <MenuItem value="Confirmed">הזמנה מאושרת</MenuItem>
              <MenuItem value="Shipped">נשלח</MenuItem>
              <MenuItem value="Completed">הושלם</MenuItem>
              <MenuItem value="Cancelled">מבוטל</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={text.notes}
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          {/* Order Lines Table */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {text.items}
            </Typography>
            
            {orderLines.length > 0 && (
              <Card sx={{ mb: 2 }}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{text.item}</TableCell>
                        <TableCell>{text.description}</TableCell>
                        <TableCell align="center">{text.quantity}</TableCell>
                        <TableCell align="center">{text.unitPrice}</TableCell>
                        <TableCell align="center">{text.total}</TableCell>
                        <TableCell align="center">{text.actions}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderLines.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {line.itemName || `ID: ${line.itemId}`}
                              </Typography>
                              {line.itemSku && (
                                <Typography variant="caption" color="textSecondary">
                                  SKU: {line.itemSku}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={line.description || ''}
                              onChange={(e) => updateOrderLine(index, 'description', e.target.value)}
                              placeholder={text.description}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={line.quantity}
                              onChange={(e) => updateOrderLine(index, 'quantity', Number(e.target.value))}
                              inputProps={{ min: 0, step: 1 }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={line.unitPrice}
                              onChange={(e) => updateOrderLine(index, 'unitPrice', Number(e.target.value))}
                              inputProps={{ min: 0, step: 0.01 }}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="medium">
                              {(line.quantity * line.unitPrice).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              onClick={() => removeOrderLine(index)}
                              size="small"
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
              </Card>
            )}

            {/* Add New Item */}
            <Card sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                {text.addItem}
              </Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>{text.selectItem}</InputLabel>
                    <Select
                      value={newLineData.itemId}
                      label={text.selectItem}
                      onChange={(e) => {
                        const itemId = Number(e.target.value);
                        const selectedItem = items.find(item => item.id === itemId);
                        setNewLineData({ 
                          ...newLineData, 
                          itemId,
                          unitPrice: selectedItem?.sellPrice || 0,
                          description: selectedItem?.description || ''
                        });
                      }}
                    >
                      <MenuItem value={0}>
                        <em>{text.selectItem}</em>
                      </MenuItem>
                      {items.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          <Box>
                            <Typography variant="body2">{item.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {item.sku} - ₪{item.sellPrice}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    type="number"
                    label={text.quantity}
                    value={newLineData.quantity}
                    onChange={(e) => setNewLineData({ ...newLineData, quantity: Number(e.target.value) })}
                    inputProps={{ min: 1, step: 1 }}
                    sx={{ minWidth: 120 }}
                  />

                  <TextField
                    type="number"
                    label={text.unitPrice}
                    value={newLineData.unitPrice}
                    onChange={(e) => setNewLineData({ ...newLineData, unitPrice: Number(e.target.value) })}
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ minWidth: 120 }}
                  />
                </Stack>

                <TextField
                  fullWidth
                  label={text.description}
                  value={newLineData.description}
                  onChange={(e) => setNewLineData({ ...newLineData, description: e.target.value })}
                  placeholder={text.description}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={addOrderLine}
                    disabled={newLineData.itemId === 0}
                    startIcon={<AddIcon />}
                  >
                    {text.addItem}
                  </Button>
                </Box>
              </Stack>
            </Card>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {text.cancel}
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={formData.customerId === 0 || orderLines.length === 0 || loading}
        >
          {text.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalesDocumentDialogs;
