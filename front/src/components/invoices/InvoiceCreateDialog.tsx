import { useState, useEffect } from "react";
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
  Paper,
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
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import type {
  Customer,
  Item,
  CreateInvoiceForm,
  CreateInvoiceLineForm,
} from "../../types/entities";
import { customersAPI, itemsAPI, invoicesAPI } from "../../services/api";

interface InvoiceCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (invoiceId: number) => void;
  initialCustomerId?: number;
  initialSalesOrderId?: number;
}

const DEFAULT_LINE_ITEM: CreateInvoiceLineForm = {
  description: "",
  itemSku: "",
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  taxRate: 17, // Default Israeli VAT rate
};

const DEFAULT_FORM_DATA: CreateInvoiceForm = {
  customerId: 0,
  invoiceDate: new Date(),
  dueDate: undefined,
  currency: "ILS",
  notes: "",
  lines: [{ ...DEFAULT_LINE_ITEM }],
};

export default function InvoiceCreateDialog({
  open,
  onClose,
  onSuccess,
  initialCustomerId,
  initialSalesOrderId,
}: InvoiceCreateDialogProps) {
  const [formData, setFormData] =
    useState<CreateInvoiceForm>(DEFAULT_FORM_DATA);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Load data on component mount
  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  // Initialize form data when props change
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        customerId: initialCustomerId || 0,
        salesOrderId: initialSalesOrderId,
      }));
    }
  }, [open, initialCustomerId, initialSalesOrderId]);

  const loadInitialData = async () => {
    try {
      const [customersData, itemsData] = await Promise.all([
        customersAPI.getAll(),
        itemsAPI.getAll(),
      ]);
      setCustomers(customersData);
      setItems(itemsData);
    } catch (err) {
      console.error("Failed to load initial data:", err);
      setError("שגיאה בטעינת נתונים");
    }
  };

  const handleSubmit = async () => {
    setError("");

    // Validation
    if (!formData.customerId) {
      setError("יש לבחור לקוח");
      return;
    }

    if (
      formData.lines.length === 0 ||
      formData.lines.every((line) => !line.description.trim())
    ) {
      setError("יש להוסיף לפחות פריט אחד");
      return;
    }

    // Validate all line items
    for (const line of formData.lines) {
      if (!line.description.trim()) {
        setError("כל פריט חייב לכלול תיאור");
        return;
      }
      if (line.quantity <= 0) {
        setError("כמות חייבת להיות גדולה מ-0");
        return;
      }
      if (line.unitPrice < 0) {
        setError("מחיר לא יכול להיות שלילי");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await invoicesAPI.create(formData);
      onSuccess?.(response.id);
      handleClose();
    } catch (err: any) {
      console.error("Error creating invoice:", err);
      setError(err.response?.data?.message || "שגיאה ביצירת החשבונית");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(DEFAULT_FORM_DATA);
    setError("");
    onClose();
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { ...DEFAULT_LINE_ITEM }],
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.lines.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index),
      }));
    }
  };

  const updateLineItem = (
    index: number,
    field: keyof CreateInvoiceLineForm,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      ),
    }));
  };

  const handleItemSelect = (index: number, item: Item | null) => {
    if (item) {
      updateLineItem(index, "itemId", item.id);
      updateLineItem(index, "description", item.name);
      updateLineItem(index, "itemSku", item.sku);
      updateLineItem(index, "unitPrice", item.price);
    } else {
      updateLineItem(index, "itemId", undefined);
      updateLineItem(index, "itemSku", "");
    }
  };

  const calculateLineTotal = (line: CreateInvoiceLineForm): number => {
    const subtotal = line.quantity * line.unitPrice;
    const discount = subtotal * (line.discountPercent / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (line.taxRate / 100);
    return afterDiscount + tax;
  };

  const calculateTotals = () => {
    const subtotal = formData.lines.reduce((sum, line) => {
      return (
        sum + line.quantity * line.unitPrice * (1 - line.discountPercent / 100)
      );
    }, 0);

    const taxAmount = formData.lines.reduce((sum, line) => {
      const lineSubtotal =
        line.quantity * line.unitPrice * (1 - line.discountPercent / 100);
      return sum + lineSubtotal * (line.taxRate / 100);
    }, 0);

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  };

  const totals = calculateTotals();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        dir="rtl"
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            יצירת חשבונית חדשה
          </Typography>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            columns={{ xs: 4, sm: 8, md: 12 }}
          >
            {/* Customer Selection */}
            <Grid size={{ xs: 4, sm: 8, md: 6 }}>
              <Autocomplete
                value={
                  customers.find((c) => c.id === formData.customerId) || null
                }
                onChange={(_, customer) => {
                  setFormData((prev) => ({
                    ...prev,
                    customerId: customer?.id || 0,
                  }));
                }}
                options={customers}
                getOptionLabel={(customer) => customer.name}
                renderInput={(params) => (
                  <TextField {...params} label="לקוח" required fullWidth />
                )}
                disabled={loading}
              />
            </Grid>

            {/* Invoice Date */}
            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <DatePicker
                label="תאריך חשבונית"
                value={formData.invoiceDate}
                onChange={(date) => {
                  if (date) {
                    setFormData((prev) => ({
                      ...prev,
                      invoiceDate: date,
                    }));
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
                disabled={loading}
              />
            </Grid>

            {/* Due Date */}
            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <DatePicker
                label="תאריך פירעון"
                value={formData.dueDate || null}
                onChange={(date) => {
                  setFormData((prev) => ({
                    ...prev,
                    dueDate: date || undefined,
                  }));
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
                disabled={loading}
              />
            </Grid>

            {/* Currency */}
            <Grid size={{ xs: 4, sm: 8, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>מטבע</InputLabel>
                <Select
                  value={formData.currency}
                  label="מטבע"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }));
                  }}
                  disabled={loading}
                >
                  <MenuItem value="ILS">שקל ישראלי (₪)</MenuItem>
                  <MenuItem value="USD">דולר אמריקני ($)</MenuItem>
                  <MenuItem value="EUR">יורו (€)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Notes */}
            <Grid size={{ xs: 4, sm: 8, md: 6 }}>
              <TextField
                label="הערות"
                value={formData.notes}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }));
                }}
                multiline
                rows={2}
                fullWidth
                disabled={loading}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Line Items Section */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">פריטים</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addLineItem}
                variant="outlined"
                size="small"
                disabled={loading}
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
                    <TableCell align="center">כמות</TableCell>
                    <TableCell align="center">מחיר יחידה</TableCell>
                    <TableCell align="center">הנחה %</TableCell>
                    <TableCell align="center">מע"מ %</TableCell>
                    <TableCell align="center">סה"כ</TableCell>
                    <TableCell align="center">פעולות</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.lines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          value={
                            items.find((item) => item.id === line.itemId) ||
                            null
                          }
                          onChange={(_, item) => handleItemSelect(index, item)}
                          options={items}
                          getOptionLabel={(item) =>
                            `${item.sku} - ${item.name}`
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="בחר פריט"
                            />
                          )}
                          sx={{ minWidth: 200 }}
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={line.description}
                          onChange={(e) =>
                            updateLineItem(index, "description", e.target.value)
                          }
                          size="small"
                          fullWidth
                          placeholder="תיאור הפריט"
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          size="small"
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 80 }}
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "unitPrice",
                              Number(e.target.value)
                            )
                          }
                          size="small"
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 100 }}
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={line.discountPercent}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "discountPercent",
                              Number(e.target.value)
                            )
                          }
                          size="small"
                          inputProps={{ min: 0, max: 100, step: 0.01 }}
                          sx={{ width: 80 }}
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={line.taxRate}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "taxRate",
                              Number(e.target.value)
                            )
                          }
                          size="small"
                          inputProps={{ min: 0, max: 100, step: 0.01 }}
                          sx={{ width: 80 }}
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {calculateLineTotal(line).toFixed(2)} ₪
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => removeLineItem(index)}
                          disabled={formData.lines.length <= 1 || loading}
                          size="small"
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
          </Box>

          {/* Totals Section */}
          <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} justifyContent="flex-end">
              <Grid size={{ xs: 4, sm: 8, md: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>סכום ביניים:</Typography>
                  <Typography>{totals.subtotal.toFixed(2)} ₪</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>מע"מ:</Typography>
                  <Typography>{totals.taxAmount.toFixed(2)} ₪</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="h6">סה"כ לתשלום:</Typography>
                  <Typography variant="h6">
                    {totals.total.toFixed(2)} ₪
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? "יוצר חשבונית..." : "צור חשבונית"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
