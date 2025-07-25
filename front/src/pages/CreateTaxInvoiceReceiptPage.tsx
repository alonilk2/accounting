import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  Box,
  Autocomplete,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Card,
  CardContent,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import taxInvoiceReceiptService from '../services/taxInvoiceReceiptService';
import { customersApi } from '../services/customersApi';
import { itemsAPI } from '../services/api';
import type {
  CreateTaxInvoiceReceipt,
  CreateTaxInvoiceReceiptLine,
  PaymentMethod
} from '../types/taxInvoiceReceipt';
import { PAYMENT_METHODS } from '../types/taxInvoiceReceipt';
import type { Customer, Item } from '../types/entities';

interface LineItem extends CreateTaxInvoiceReceiptLine {
  tempId: string;
  itemName?: string;
  itemSku?: string;
  itemUnit?: string;
  lineSubTotal: number;
  lineVatAmount: number;
  lineTotalAmount: number;
}

const CreateTaxInvoiceReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [documentDate, setDocumentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('מזומן');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  
  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [itemDiscountPercent, setItemDiscountPercent] = useState<number>(0);

  // Calculated totals
  const [subTotal, setSubTotal] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const calculateTotals = useCallback(() => {
    const totals = lines.reduce(
      (acc, line) => ({
        subTotal: acc.subTotal + line.lineSubTotal,
        vatAmount: acc.vatAmount + line.lineVatAmount,
        totalAmount: acc.totalAmount + line.lineTotalAmount
      }),
      { subTotal: 0, vatAmount: 0, totalAmount: 0 }
    );

    setSubTotal(totals.subTotal);
    setVatAmount(totals.vatAmount);
    setTotalAmount(totals.totalAmount);
  }, [lines]);

  useEffect(() => {
    calculateTotals();
  }, [lines, calculateTotals]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load customers and items in parallel
      const [customersData, itemsResponse] = await Promise.all([
        customersApi.getCustomers(),
        itemsAPI.getAll({ isActive: true })
      ]);
      
      setCustomers(customersData);
      // CRITICAL: Extract .data property from PaginatedResponse
      setItems(itemsResponse.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const calculateLineAmounts = (
    quantity: number,
    unitPrice: number,
    discountPercent: number,
    vatRate: number
  ) => {
    const lineSubTotalBeforeDiscount = quantity * unitPrice;
    const discountAmount = (lineSubTotalBeforeDiscount * discountPercent) / 100;
    const lineSubTotal = lineSubTotalBeforeDiscount - discountAmount;
    const lineVatAmount = (lineSubTotal * vatRate) / 100;
    const lineTotalAmount = lineSubTotal + lineVatAmount;

    return {
      lineSubTotal,
      lineVatAmount,
      lineTotalAmount,
      discountAmount
    };
  };

  const handleAddItem = () => {
    setShowItemDialog(true);
    setSelectedItem(null);
    setItemQuantity(1);
    setItemUnitPrice(0);
    setItemDiscountPercent(0);
  };

  const handleItemSelect = (item: Item | null) => {
    setSelectedItem(item);
    if (item) {
      setItemUnitPrice(item.sellPrice);
    }
  };

  const handleAddItemToLines = () => {
    if (!selectedItem) return;

    const vatRate = 17; // Default Israeli VAT rate
    const amounts = calculateLineAmounts(
      itemQuantity,
      itemUnitPrice,
      itemDiscountPercent,
      vatRate
    );

    const newLine: LineItem = {
      tempId: Date.now().toString(),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemSku: selectedItem.sku,
      itemUnit: selectedItem.unit,
      quantity: itemQuantity,
      unitPrice: itemUnitPrice,
      discountPercent: itemDiscountPercent,
      discountAmount: amounts.discountAmount,
      vatRate,
      lineSubTotal: amounts.lineSubTotal,
      lineVatAmount: amounts.lineVatAmount,
      lineTotalAmount: amounts.lineTotalAmount
    };

    setLines([...lines, newLine]);
    setShowItemDialog(false);
  };

  const handleRemoveLine = (tempId: string) => {
    setLines(lines.filter(line => line.tempId !== tempId));
  };

  const handleUpdateLineQuantity = (tempId: string, newQuantity: number) => {
    setLines(lines.map(line => {
      if (line.tempId === tempId) {
        const amounts = calculateLineAmounts(
          newQuantity,
          line.unitPrice,
          line.discountPercent || 0,
          line.vatRate || 17
        );
        return {
          ...line,
          quantity: newQuantity,
          ...amounts
        };
      }
      return line;
    }));
  };

  const handleSave = async () => {
    try {
      if (!customerId) {
        setError('יש לבחור לקוח');
        return;
      }

      if (!documentDate) {
        setError('יש להזין תאריך');
        return;
      }

      if (lines.length === 0) {
        setError('יש להוסיף לפחות פריט אחד');
        return;
      }

      setLoading(true);
      setError(null);

      const receiptData: CreateTaxInvoiceReceipt = {
        customerId,
        documentDate: documentDate, // Already in YYYY-MM-DD format
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        lines: lines.map(line => ({
          itemId: line.itemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          discountAmount: line.discountAmount,
          vatRate: line.vatRate
        }))
      };

      await taxInvoiceReceiptService.createTaxInvoiceReceipt(receiptData);
      navigate('/tax-invoice-receipts');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה ביצירת החשבונית';
      setError(errorMessage);
      console.error('Error creating tax invoice receipt:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/tax-invoice-receipts')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          יצירת חשבונית מס-קבלה
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
          {/* Header Information */}
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                פרטי המסמך
              </Typography>
              <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                <Grid size={{ xs: 4, sm: 8, md: 4 }}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(option) => option.name}
                    value={customers.find(c => c.id === customerId) || null}
                    onChange={(_, newValue) => setCustomerId(newValue?.id || null)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="לקוח *"
                        fullWidth
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 8, md: 4 }}>
                  <TextField
                    label="תאריך המסמך *"
                    type="date"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    fullWidth
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 8, md: 4 }}>
                  <TextField
                    select
                    label="אופן תשלום *"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    fullWidth
                    required
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <TextField
                    label="מספר אסמכתא"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    fullWidth
                    placeholder="מספר עסקה, מספר צ'ק וכו'"
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <TextField
                    label="הערות"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Items */}
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  פריטים
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                >
                  הוסף פריט
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>פריט</TableCell>
                      <TableCell align="center">כמות</TableCell>
                      <TableCell align="center">מחיר יחידה</TableCell>
                      <TableCell align="center">הנחה %</TableCell>
                      <TableCell align="center">מע"מ %</TableCell>
                      <TableCell align="center">סכום לפני מע"מ</TableCell>
                      <TableCell align="center">מע"מ</TableCell>
                      <TableCell align="center">סכום כולל</TableCell>
                      <TableCell align="center">פעולות</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.tempId}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {line.itemName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {line.itemSku} | {line.itemUnit}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            value={line.quantity}
                            onChange={(e) => handleUpdateLineQuantity(line.tempId, Number(e.target.value))}
                            size="small"
                            sx={{ width: 80 }}
                            inputProps={{ min: 0, step: 0.1 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          ₪{line.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          {line.discountPercent?.toFixed(1)}%
                        </TableCell>
                        <TableCell align="center">
                          {line.vatRate?.toFixed(0)}%
                        </TableCell>
                        <TableCell align="center">
                          ₪{line.lineSubTotal.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          ₪{line.lineVatAmount.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          ₪{line.lineTotalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handleRemoveLine(line.tempId)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lines.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography color="text.secondary">
                            לא נוספו פריטים עדיין
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Summary */}
          <Grid size={{ xs: 4, sm: 4, md: 8 }}>
            {/* Empty space */}
          </Grid>
          <Grid size={{ xs: 4, sm: 4, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  סיכום
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>סכום לפני מע"מ:</Typography>
                  <Typography>₪{subTotal.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>מע"מ:</Typography>
                  <Typography>₪{vatAmount.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">סכום כולל:</Typography>
                  <Typography variant="h6" color="primary">
                    ₪{totalAmount.toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Actions */}
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Box display="flex" gap={2} justifyContent="flex-start">
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading || !customerId || lines.length === 0}
              >
                {loading ? 'שומר...' : 'שמור וסגור'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/tax-invoice-receipts')}
              >
                ביטול
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Add Item Dialog */}
        <Dialog
          open={showItemDialog}
          onClose={() => setShowItemDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>הוספת פריט</DialogTitle>
          <DialogContent>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mt: 1 }}>
              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <Autocomplete
                  options={items}
                  getOptionLabel={(option) => `${option.name} (${option.sku})`}
                  value={selectedItem}
                  onChange={(_, newValue) => handleItemSelect(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="בחר פריט *"
                      fullWidth
                      required
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 2, sm: 4, md: 6 }}>
                <TextField
                  label="כמות *"
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Number(e.target.value))}
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid size={{ xs: 2, sm: 4, md: 6 }}>
                <TextField
                  label="מחיר יחידה *"
                  type="number"
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(Number(e.target.value))}
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <TextField
                  label="הנחה %"
                  type="number"
                  value={itemDiscountPercent}
                  onChange={(e) => setItemDiscountPercent(Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
              </Grid>
              {selectedItem && (
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>פריט:</strong> {selectedItem.name}<br />
                      <strong>קוד:</strong> {selectedItem.sku}<br />
                      <strong>יחידה:</strong> {selectedItem.unit}<br />
                      <strong>מחיר מומלץ:</strong> ₪{selectedItem.sellPrice.toFixed(2)}<br />
                      <strong>מע"מ:</strong> 17%
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowItemDialog(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleAddItemToLines}
              variant="contained"
              disabled={!selectedItem || itemQuantity <= 0}
            >
              הוסף
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button for Quick Save */}
        <Fab
          color="primary"
          aria-label="save"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleSave}
          disabled={loading || !customerId || lines.length === 0}
        >
          <SaveIcon />
        </Fab>
      </Container>
  );
};

export default CreateTaxInvoiceReceiptPage;
