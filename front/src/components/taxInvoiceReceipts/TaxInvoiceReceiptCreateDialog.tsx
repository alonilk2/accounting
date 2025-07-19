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
  Autocomplete,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import taxInvoiceReceiptService from '../../services/taxInvoiceReceiptService';
import { customersApi } from '../../services/customersApi';
import { itemsAPI } from '../../services/api';
import type {
  CreateTaxInvoiceReceipt,
  CreateTaxInvoiceReceiptLine,
  PaymentMethod
} from '../../types/taxInvoiceReceipt';
import { PAYMENT_METHODS } from '../../types/taxInvoiceReceipt';
import type { Customer, Item } from '../../types/entities';

interface LineItem extends CreateTaxInvoiceReceiptLine {
  tempId: string;
  itemName?: string;
  itemSku?: string;
  itemUnit?: string;
  lineSubTotal: number;
  lineVatAmount: number;
  lineTotalAmount: number;
}

interface TaxInvoiceReceiptCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TaxInvoiceReceiptCreateDialog: React.FC<TaxInvoiceReceiptCreateDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
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
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [itemDiscountPercent, setItemDiscountPercent] = useState<number>(0);

  // Calculated totals
  const [subTotal, setSubTotal] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (open) {
      loadData();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setCustomerId(null);
    setDocumentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('מזומן');
    setReferenceNumber('');
    setNotes('');
    setLines([]);
    setError(null);
    setSelectedItemId(null);
    setItemQuantity(1);
    setItemUnitPrice(0);
    setItemDiscountPercent(0);
  };

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
      const [customersData, itemsData] = await Promise.all([
        customersApi.getCustomers(),
        itemsAPI.getAll({ isActive: true })
      ]);
      
      setCustomers(customersData);
      setItems(itemsData);
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

  const handleItemSelect = (item: Item | null) => {
    setSelectedItemId(item?.id || null);
    if (item) {
      setItemUnitPrice(item.sellPrice);
    }
  };

  const handleAddItemToLines = () => {
    const selectedItem = items.find(item => item.id === selectedItemId);
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
    
    // Reset item selection
    setSelectedItemId(null);
    setItemQuantity(1);
    setItemUnitPrice(0);
    setItemDiscountPercent(0);
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
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה ביצירת החשבונית';
      setError(errorMessage);
      console.error('Error creating tax invoice receipt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      dir="rtl"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
          יצירת חשבונית מס-קבלה
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
          {/* Header Information */}
          <Grid size={{ xs: 4, sm: 8, md: 6 }}>
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              )}
              disabled={loading}
            />
          </Grid>
          <Grid size={{ xs: 4, sm: 4, md: 3 }}>
            <TextField
              label="תאריך המסמך *"
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              fullWidth
              required
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 4, sm: 4, md: 3 }}>
            <TextField
              select
              label="אופן תשלום *"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              fullWidth
              required
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
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
              disabled={loading}
              placeholder="מספר עסקה, מספר צ'ק וכו'"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
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
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Add Item Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            הוספת פריט
          </Typography>
          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} alignItems="end">
            <Grid size={{ xs: 4, sm: 8, md: 4 }}>
              <Autocomplete
                options={items}
                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                value={items.find(item => item.id === selectedItemId) || null}
                onChange={(_, newValue) => handleItemSelect(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="בחר פריט"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                )}
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 2, sm: 2, md: 2 }}>
              <TextField
                label="כמות"
                type="number"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Number(e.target.value))}
                fullWidth
                disabled={loading}
                inputProps={{ min: 0, step: 0.1 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 2, sm: 2, md: 2 }}>
              <TextField
                label="מחיר יחידה"
                type="number"
                value={itemUnitPrice}
                onChange={(e) => setItemUnitPrice(Number(e.target.value))}
                fullWidth
                disabled={loading}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 2, sm: 2, md: 2 }}>
              <TextField
                label="הנחה %"
                type="number"
                value={itemDiscountPercent}
                onChange={(e) => setItemDiscountPercent(Number(e.target.value))}
                fullWidth
                disabled={loading}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddItemToLines}
                fullWidth
                disabled={loading || !selectedItemId || itemQuantity <= 0}
                sx={{ borderRadius: 2 }}
              >
                הוסף
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Items Table */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            פריטים
          </Typography>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>פריט</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>כמות</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>מחיר יחידה</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>הנחה %</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>מע"מ %</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>סכום לפני מע"מ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>מע"מ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>סכום כולל</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, width: 80 }}>פעולות</TableCell>
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
                        sx={{ 
                          width: 80,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                          }
                        }}
                        inputProps={{ min: 0, step: 0.1 }}
                        disabled={loading}
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
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      ₪{line.lineTotalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleRemoveLine(line.tempId)}
                        color="error"
                        size="small"
                        disabled={loading}
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
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              סכום לפני מע"מ: ₪{subTotal.toFixed(2)}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              מע"מ: ₪{vatAmount.toFixed(2)}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              סה"כ כולל מע"מ: ₪{totalAmount.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          startIcon={<CancelIcon />}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          ביטול
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading || !customerId || lines.length === 0}
          sx={{ borderRadius: 2 }}
        >
          {loading ? 'שומר...' : 'שמור'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaxInvoiceReceiptCreateDialog;
