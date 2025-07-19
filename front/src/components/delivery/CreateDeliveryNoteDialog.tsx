import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  Typography,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LocalShipping as ShippingIcon,
  Business as BusinessIcon,
  DirectionsCar as CarIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

import { deliveryNotesApi, type CreateDeliveryNoteRequest, type DeliveryNoteStatus } from '../../services/deliveryNotesApi';
import { customersApi } from '../../services/customersApi';
import { itemsApi } from '../../services/itemsApi';
import type { Customer, Item, SalesOrder, DeliveryNote } from '../../types/entities';

export interface CreateDeliveryNoteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (deliveryNote: DeliveryNote) => void;
  companyId: number;
  fromSalesOrder?: SalesOrder; // Optional: create from existing sales order
}

interface DeliveryNoteLineForm {
  id: string;
  itemId: number;
  itemName: string;
  itemSku: string;
  salesOrderLineId?: number;
  description: string;
  quantityOrdered: number;
  quantityDelivered: number;
  quantityReturned: number;
  unit: string;
  unitWeight?: number;
  unitVolume?: number;
  serialNumbers?: string;
  batchNumbers?: string;
  expiryDate?: Date | null;
  itemCondition: string;
  notes?: string;
}

const CreateDeliveryNoteDialog: React.FC<CreateDeliveryNoteDialogProps> = ({
  open,
  onClose,
  onSuccess,
  companyId,
  fromSalesOrder
}) => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [salesOrders] = useState<SalesOrder[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customerId: fromSalesOrder?.customerId || 0,
    salesOrderId: fromSalesOrder?.id,
    deliveryDate: new Date(),
    expectedDeliveryTime: null as Date | null,
    status: 'Draft' as DeliveryNoteStatus,
    deliveryAddress: '',
    contactPerson: '',
    contactPhone: '',
    driverName: '',
    vehiclePlate: '',
    deliveryInstructions: '',
    notes: '',
    trackingNumber: '',
    courierService: ''
  });

  const [lines, setLines] = useState<DeliveryNoteLineForm[]>([]);

  // Load reference data
  const loadReferenceData = async () => {
    try {
      setLoadingData(true);
      
      const [customersData, itemsData] = await Promise.all([
        customersApi.getCustomers(),
        itemsApi.getItems()
      ]);
      
      setCustomers(customersData);
      setItems(itemsData);
      
      // Load sales orders if no specific order provided
      if (!fromSalesOrder) {
        // TODO: Load confirmed sales orders that haven't been fully delivered
        // const ordersData = await salesOrdersApi.getSalesOrders({status: 'Confirmed'});
        // setSalesOrders(ordersData);
      }
    } catch (err) {
      console.error('Error loading reference data:', err);
      setError('שגיאה בטעינת נתונים');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadReferenceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fromSalesOrder]);

  // Populate from sales order if provided
  const populateFromSalesOrder = () => {
    if (!fromSalesOrder) return;

    setFormData(prev => ({
      ...prev,
      customerId: fromSalesOrder.customerId,
      salesOrderId: fromSalesOrder.id,
      deliveryAddress: '', // Could be populated from customer default address
    }));

    // Populate lines from sales order
    const orderLines: DeliveryNoteLineForm[] = fromSalesOrder.lines.map((line, index) => ({
      id: `line-${index}`,
      itemId: line.itemId,
      itemName: line.itemName,
      itemSku: line.itemSku,
      salesOrderLineId: line.id,
      description: line.description || '',
      quantityOrdered: line.quantity,
      quantityDelivered: line.quantity, // Default to full quantity
      quantityReturned: 0,
      unit: line.itemSku, // Could be enhanced with proper unit from item
      unitWeight: 0,
      unitVolume: 0,
      serialNumbers: '',
      batchNumbers: '',
      expiryDate: null,
      itemCondition: 'חדש',
      notes: ''
    }));

    setLines(orderLines);
  };

  useEffect(() => {
    if (fromSalesOrder && open) {
      populateFromSalesOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromSalesOrder, open]);

  const handleAddLine = () => {
    const newLine: DeliveryNoteLineForm = {
      id: `line-${Date.now()}`,
      itemId: 0,
      itemName: '',
      itemSku: '',
      description: '',
      quantityOrdered: 1,
      quantityDelivered: 1,
      quantityReturned: 0,
      unit: 'יחידה',
      unitWeight: 0,
      unitVolume: 0,
      serialNumbers: '',
      batchNumbers: '',
      expiryDate: null,
      itemCondition: 'חדש',
      notes: ''
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (lineId: string) => {
    setLines(lines.filter(line => line.id !== lineId));
  };

  const handleLineChange = (lineId: string, field: keyof DeliveryNoteLineForm, value: unknown) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        const updatedLine = { ...line, [field]: value };
        
        // Auto-populate item details when item is selected
        if (field === 'itemId' && value) {
          const selectedItem = items.find(item => item.id === value);
          if (selectedItem) {
            updatedLine.itemName = selectedItem.name;
            updatedLine.itemSku = selectedItem.sku;
            updatedLine.description = selectedItem.description || '';
            updatedLine.unit = selectedItem.unit;
          }
        }
        
        return updatedLine;
      }
      return line;
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!formData.customerId) {
        setError('יש לבחור לקוח');
        return;
      }

      if (lines.length === 0) {
        setError('יש להוסיף לפחות שורה אחת');
        return;
      }

      // Validate lines
      for (const line of lines) {
        if (!line.itemId) {
          setError('יש לבחור פריט בכל השורות');
          return;
        }
        if (line.quantityDelivered <= 0) {
          setError('כמות למשלוח חייבת להיות גדולה מ-0');
          return;
        }
      }

      const request: CreateDeliveryNoteRequest = {
        companyId,
        customerId: formData.customerId,
        salesOrderId: formData.salesOrderId,
        deliveryDate: formData.deliveryDate.toISOString(),
        expectedDeliveryTime: formData.expectedDeliveryTime?.toISOString(),
        status: formData.status,
        deliveryAddress: formData.deliveryAddress || undefined,
        contactPerson: formData.contactPerson || undefined,
        contactPhone: formData.contactPhone || undefined,
        driverName: formData.driverName || undefined,
        vehiclePlate: formData.vehiclePlate || undefined,
        deliveryInstructions: formData.deliveryInstructions || undefined,
        notes: formData.notes || undefined,
        trackingNumber: formData.trackingNumber || undefined,
        courierService: formData.courierService || undefined,
        lines: lines.map(line => ({
          itemId: line.itemId,
          salesOrderLineId: line.salesOrderLineId,
          description: line.description,
          quantityOrdered: line.quantityOrdered,
          quantityDelivered: line.quantityDelivered,
          quantityReturned: line.quantityReturned,
          unit: line.unit,
          unitWeight: line.unitWeight,
          unitVolume: line.unitVolume,
          serialNumbers: line.serialNumbers,
          batchNumbers: line.batchNumbers,
          expiryDate: line.expiryDate?.toISOString(),
          itemCondition: line.itemCondition,
          notes: line.notes
        }))
      };

      const newDeliveryNote = await deliveryNotesApi.createDeliveryNoteFromRequest(request);

      onSuccess(newDeliveryNote);
      handleClose();
    } catch (err: unknown) {
      console.error('Error creating delivery note:', err);
      setError((err as Error).message || 'שגיאה ביצירת תעודת המשלוח');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      customerId: 0,
      salesOrderId: undefined,
      deliveryDate: new Date(),
      expectedDeliveryTime: null,
      status: 'Draft',
      deliveryAddress: '',
      contactPerson: '',
      contactPhone: '',
      driverName: '',
      vehiclePlate: '',
      deliveryInstructions: '',
      notes: '',
      trackingNumber: '',
      courierService: ''
    });
    setLines([]);
    setError(null);
    onClose();
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <ShippingIcon sx={{ mr: 1, color: 'primary.main' }} />
            {fromSalesOrder 
              ? `תעודת משלוח מהזמנה ${fromSalesOrder.orderNumber}`
              : 'תעודת משלוח חדשה'
            }
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loadingData ? (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography>טוען נתונים...</Typography>
            </Box>
          ) : (
            <Box>
              {/* Customer and Order Information */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 1 }} />
                פרטי לקוח והזמנה
              </Typography>
              
              <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>לקוח</InputLabel>
                    <Select
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value as number })}
                      label="לקוח"
                      disabled={!!fromSalesOrder}
                    >
                      {customers.map((customer) => (
                        <MenuItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {!fromSalesOrder && (
                  <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>הזמנה (אופציונלי)</InputLabel>
                      <Select
                        value={formData.salesOrderId || ''}
                        onChange={(e) => setFormData({ ...formData, salesOrderId: e.target.value as number || undefined })}
                        label="הזמנה (אופציונלי)"
                      >
                        <MenuItem value="">ללא הזמנה</MenuItem>
                        {salesOrders.map((order) => (
                          <MenuItem key={order.id} value={order.id}>
                            {order.orderNumber} - {order.customerName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Delivery Information */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1 }} />
                פרטי משלוח
              </Typography>

              <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <DateTimePicker
                    label="תאריך ושעת משלוח"
                    value={formData.deliveryDate}
                    onChange={(date) => setFormData({ ...formData, deliveryDate: date || new Date() })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>

                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <DateTimePicker
                    label="זמן משלוח צפוי (אופציונלי)"
                    value={formData.expectedDeliveryTime}
                    onChange={(date) => setFormData({ ...formData, expectedDeliveryTime: date })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>סטטוס</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as DeliveryNoteStatus })}
                      label="סטטוס"
                    >
                      <MenuItem value="Draft">טיוטה</MenuItem>
                      <MenuItem value="Prepared">מוכנה למשלוח</MenuItem>
                      <MenuItem value="InTransit">בדרך</MenuItem>
                      <MenuItem value="Delivered">נמסרה</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 4, sm: 4, md: 8 }}>
                  <TextField
                    fullWidth
                    label="כתובת משלוח"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    placeholder={selectedCustomer?.address || 'הזן כתובת משלוח'}
                  />
                </Grid>

                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <TextField
                    fullWidth
                    label="איש קשר"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <TextField
                    fullWidth
                    label="טלפון איש קשר"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Driver and Vehicle Information */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CarIcon sx={{ mr: 1 }} />
                פרטי נהג ורכב
              </Typography>

              <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                  <TextField
                    fullWidth
                    label="שם נהג"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                  <TextField
                    fullWidth
                    label="מספר רכב"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                  <TextField
                    fullWidth
                    label="מספר מעקב"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <TextField
                    fullWidth
                    label="שירות שליחות"
                    value={formData.courierService}
                    onChange={(e) => setFormData({ ...formData, courierService: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="הוראות משלוח"
                    value={formData.deliveryInstructions}
                    onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="הערות"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Line Items */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">פריטים למשלוח</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddLine}
                  size="small"
                >
                  הוסף פריט
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>פריט</TableCell>
                      <TableCell>תיאור</TableCell>
                      <TableCell width={120}>כמות הוזמנה</TableCell>
                      <TableCell width={120}>כמות למשלוח</TableCell>
                      <TableCell width={120}>יחידה</TableCell>
                      <TableCell width={80}>פעולות</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Autocomplete
                            options={items}
                            getOptionLabel={(option) => `${option.sku} - ${option.name}`}
                            value={items.find(item => item.id === line.itemId) || null}
                            onChange={(_, value) => handleLineChange(line.id, 'itemId', value?.id || 0)}
                            renderInput={(params) => (
                              <TextField {...params} size="small" placeholder="בחר פריט" />
                            )}
                            sx={{ minWidth: 200 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={line.description}
                            onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                            placeholder="תיאור"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={line.quantityOrdered}
                            onChange={(e) => handleLineChange(line.id, 'quantityOrdered', parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={line.quantityDelivered}
                            onChange={(e) => handleLineChange(line.id, 'quantityDelivered', parseFloat(e.target.value) || 0)}
                            fullWidth
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={line.unit}
                            onChange={(e) => handleLineChange(line.id, 'unit', e.target.value)}
                            placeholder="יחידה"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveLine(line.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lines.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            לא נוספו פריטים. לחץ על "הוסף פריט" כדי להתחיל.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Summary */}
              {lines.length > 0 && (
                <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="subtitle2">
                    סה"כ פריטים למשלוח: {lines.reduce((sum, line) => sum + line.quantityDelivered, 0)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || loadingData || !formData.customerId || lines.length === 0}
          >
            {loading ? 'יוצר...' : 'צור תעודת משלוח'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateDeliveryNoteDialog;
