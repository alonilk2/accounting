import React, { useState, useEffect } from "react";
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
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useUIStore } from "../../stores";
import { purchaseInvoicesAPI, suppliersAPI, itemsAPI } from "../../services/api";
import type {
  PurchaseInvoice,
  PurchaseInvoiceStatus,
  Supplier,
  Item,
} from "../../types/entities";
import {
  textFieldStyles,
  dialogStyles,
  buttonStyles,
} from "../../styles/formStyles";

interface PurchaseInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  invoice?: PurchaseInvoice | null;
}

interface InvoiceFormData {
  supplierId: number;
  purchaseOrderId?: number;
  supplierInvoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
  receivedDate?: Date;
  currency: string;
  notes?: string;
  description?: string;
  vatRate: number;
  status: PurchaseInvoiceStatus;
}

interface InvoiceLineItem {
  id?: number;
  itemId?: number;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
}

export const PurchaseInvoiceDialog: React.FC<PurchaseInvoiceDialogProps> = ({
  open,
  onClose,
  onSave,
  invoice,
}) => {
  const { language } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  // Form data
  const [formData, setFormData] = useState<InvoiceFormData>({
    supplierId: 0,
    supplierInvoiceNumber: "",
    invoiceDate: new Date(),
    currency: "ILS",
    vatRate: 17,
    status: "Draft",
  });

  // Line items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [newLineItem, setNewLineItem] = useState<InvoiceLineItem>({
    description: "",
    quantity: 1,
    unit: "יח'",
    unitCost: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxRate: 17,
  });

  useEffect(() => {
    if (open) {
      fetchSuppliers();
      fetchItems();
      if (invoice) {
        populateFormData(invoice);
      } else {
        resetForm();
      }
    }
  }, [open, invoice]);

  const fetchSuppliers = async () => {
    try {
      const data = await suppliersAPI.getAll();
      setSuppliers(data);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const fetchItems = async () => {
    try {
      const data = await itemsAPI.getAll();
      setItems(data);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  const populateFormData = (invoiceData: PurchaseInvoice) => {
    setFormData({
      supplierId: invoiceData.supplierId,
      purchaseOrderId: invoiceData.purchaseOrderId,
      supplierInvoiceNumber: invoiceData.supplierInvoiceNumber,
      invoiceDate: new Date(invoiceData.invoiceDate),
      dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : undefined,
      receivedDate: invoiceData.receivedDate
        ? new Date(invoiceData.receivedDate)
        : undefined,
      currency: invoiceData.currency,
      notes: invoiceData.notes,
      description: invoiceData.description,
      vatRate: invoiceData.vatRate,
      status: invoiceData.status,
    });

    if (invoiceData.lines) {
      setLineItems(
        invoiceData.lines.map((line) => ({
          id: line.id,
          itemId: line.itemId,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitCost: line.unitCost,
          discountPercent: line.discountPercent,
          discountAmount: line.discountAmount,
          taxRate: line.taxRate,
        }))
      );
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: 0,
      supplierInvoiceNumber: "",
      invoiceDate: new Date(),
      currency: "ILS",
      vatRate: 17,
      status: "Draft",
    });
    setLineItems([]);
    setNewLineItem({
      description: "",
      quantity: 1,
      unit: "יח'",
      unitCost: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxRate: 17,
    });
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.supplierId) {
        throw new Error(
          language === "he" ? "יש לבחור ספק" : "Please select a supplier"
        );
      }

      if (!formData.supplierInvoiceNumber.trim()) {
        throw new Error(
          language === "he"
            ? "יש להזין מספר חשבונית ספק"
            : "Please enter supplier invoice number"
        );
      }

      const invoiceData = {
        ...formData,
        invoiceDate: formData.invoiceDate.toISOString(),
        dueDate: formData.dueDate?.toISOString(),
        receivedDate: formData.receivedDate?.toISOString(),
        lines: lineItems.map((line) => ({
          itemId: line.itemId,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitCost: line.unitCost,
          discountPercent: line.discountPercent,
          discountAmount: line.discountAmount,
          taxRate: line.taxRate,
        })),
      };

      if (invoice) {
        await purchaseInvoicesAPI.updateStatus(invoice.id, {
          status: formData.status,
        });
      } else {
        await purchaseInvoicesAPI.create(invoiceData);
      }

      onSave();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : language === "he"
          ? "שגיאה בשמירת החשבונית"
          : "Error saving invoice";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    if (!newLineItem.description.trim()) return;

    const subtotal =
      newLineItem.quantity * newLineItem.unitCost - newLineItem.discountAmount;
    const taxAmount = subtotal * (newLineItem.taxRate / 100);

    setLineItems([...lineItems, { ...newLineItem }]);
    setNewLineItem({
      description: "",
      quantity: 1,
      unit: "יח'",
      unitCost: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxRate: 18,
    });
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleItemSelect = (item: Item | null) => {
    if (item) {
      setNewLineItem({
        ...newLineItem,
        itemId: item.id,
        description: item.name,
        unitCost: item.purchasePrice || 0,
        unit: item.unit || "יח'",
      });
    }
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((total, line) => {
      const subtotal = line.quantity * line.unitCost - line.discountAmount;
      return total + subtotal;
    }, 0);
  };

  const calculateTotalTax = () => {
    return lineItems.reduce((total, line) => {
      const subtotal = line.quantity * line.unitCost - line.discountAmount;
      const taxAmount = subtotal * (line.taxRate / 100);
      return total + taxAmount;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalTax();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        sx={dialogStyles}
      >
        <DialogTitle
          sx={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "text.primary",
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {invoice
            ? language === "he"
              ? "עריכת חשבונית רכש"
              : "Edit Purchase Invoice"
            : language === "he"
            ? "חשבונית רכש חדשה"
            : "New Purchase Invoice"}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
            {/* Basic Information */}
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "primary.main" }}
            >
              {language === "he" ? "פרטי חשבונית" : "Invoice Details"}
            </Typography>

            <Grid
              container
              spacing={{ xs: 2, md: 3 }}
              columns={{ xs: 4, sm: 8, md: 12 }}
            >
              <Grid size={{ xs: 4, sm: 8, md: 6 }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>
                    {language === "he" ? "ספק" : "Supplier"}
                  </InputLabel>
                  <Select
                    value={formData.supplierId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplierId: Number(e.target.value),
                      })
                    }
                    label={language === "he" ? "ספק" : "Supplier"}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value={0}>
                      {language === "he" ? "בחר ספק" : "Select Supplier"}
                    </MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 4, sm: 8, md: 6 }}>
                <TextField
                  fullWidth
                  label={
                    language === "he"
                      ? "מספר חשבונית ספק"
                      : "Supplier Invoice Number"
                  }
                  value={formData.supplierInvoiceNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplierInvoiceNumber: e.target.value,
                    })
                  }
                  sx={textFieldStyles}
                  required
                />
              </Grid>

              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <DatePicker
                  label={language === "he" ? "תאריך חשבונית" : "Invoice Date"}
                  value={formData.invoiceDate}
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      invoiceDate: date || new Date(),
                    })
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: textFieldStyles,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <DatePicker
                  label={language === "he" ? "תאריך פירעון" : "Due Date"}
                  value={formData.dueDate || null}
                  onChange={(date) =>
                    setFormData({ ...formData, dueDate: date || undefined })
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: textFieldStyles,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <DatePicker
                  label={language === "he" ? "תאריך קבלה" : "Received Date"}
                  value={formData.receivedDate || null}
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      receivedDate: date || undefined,
                    })
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: textFieldStyles,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 4, sm: 8, md: 6 }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>
                    {language === "he" ? "סטטוס" : "Status"}
                  </InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as PurchaseInvoiceStatus,
                      })
                    }
                    label={language === "he" ? "סטטוס" : "Status"}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="Draft">
                      {language === "he" ? "טיוטה" : "Draft"}
                    </MenuItem>
                    <MenuItem value="Received">
                      {language === "he" ? "התקבלה" : "Received"}
                    </MenuItem>
                    <MenuItem value="Approved">
                      {language === "he" ? "מאושרת" : "Approved"}
                    </MenuItem>
                    <MenuItem value="Paid">
                      {language === "he" ? "שולמה" : "Paid"}
                    </MenuItem>
                    <MenuItem value="Cancelled">
                      {language === "he" ? "בוטלה" : "Cancelled"}
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 4, sm: 8, md: 6 }}>
                <TextField
                  fullWidth
                  label={language === "he" ? 'שיעור מע"מ (%)' : "VAT Rate (%)"}
                  type="number"
                  value={formData.vatRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vatRate: Number(e.target.value),
                    })
                  }
                  sx={textFieldStyles}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>

              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label={language === "he" ? "הערות" : "Notes"}
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  sx={textFieldStyles}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Line Items */}
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "primary.main" }}
            >
              {language === "he" ? "פריטי חשבונית" : "Invoice Items"}
            </Typography>

            {/* Add New Line Item */}
            <Box
              sx={{
                p: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                backgroundColor: "background.paper",
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                {language === "he" ? "הוסף פריט" : "Add Item"}
              </Typography>

              <Grid
                container
                spacing={{ xs: 2, md: 3 }}
                columns={{ xs: 4, sm: 8, md: 12 }}
              >
                <Grid size={{ xs: 4, sm: 8, md: 4 }}>
                  <Autocomplete
                    options={items}
                    getOptionLabel={(option) =>
                      `${option.name} (${option.sku || "N/A"})`
                    }
                    value={
                      items.find((item) => item.id === newLineItem.itemId) ||
                      null
                    }
                    onChange={(_, value) => handleItemSelect(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={language === "he" ? "פריט" : "Item"}
                        sx={textFieldStyles}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 4, sm: 8, md: 4 }}>
                  <TextField
                    fullWidth
                    label={language === "he" ? "תיאור" : "Description"}
                    value={newLineItem.description}
                    onChange={(e) =>
                      setNewLineItem({
                        ...newLineItem,
                        description: e.target.value,
                      })
                    }
                    sx={textFieldStyles}
                  />
                </Grid>

                <Grid size={{ xs: 2, sm: 4, md: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label={language === "he" ? "כמות" : "Quantity"}
                    value={newLineItem.quantity}
                    onChange={(e) =>
                      setNewLineItem({
                        ...newLineItem,
                        quantity: Number(e.target.value),
                      })
                    }
                    sx={textFieldStyles}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                <Grid size={{ xs: 2, sm: 4, md: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label={language === "he" ? "מחיר יחידה" : "Unit Cost"}
                    value={newLineItem.unitCost}
                    onChange={(e) =>
                      setNewLineItem({
                        ...newLineItem,
                        unitCost: Number(e.target.value),
                      })
                    }
                    sx={textFieldStyles}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                <Grid size={{ xs: 2, sm: 4, md: 2 }}>
                  <TextField
                    fullWidth
                    label={language === "he" ? "יחידה" : "Unit"}
                    value={newLineItem.unit}
                    onChange={(e) =>
                      setNewLineItem({ ...newLineItem, unit: e.target.value })
                    }
                    sx={textFieldStyles}
                  />
                </Grid>

                <Grid size={{ xs: 2, sm: 4, md: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label={language === "he" ? "הנחה (%)" : "Discount (%)"}
                    value={newLineItem.discountPercent}
                    onChange={(e) =>
                      setNewLineItem({
                        ...newLineItem,
                        discountPercent: Number(e.target.value),
                      })
                    }
                    sx={textFieldStyles}
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                  />
                </Grid>

                <Grid size={{ xs: 2, sm: 4, md: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label={language === "he" ? 'מע"מ (%)' : "Tax (%)"}
                    value={newLineItem.taxRate}
                    onChange={(e) =>
                      setNewLineItem({
                        ...newLineItem,
                        taxRate: Number(e.target.value),
                      })
                    }
                    sx={textFieldStyles}
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                  />
                </Grid>

                <Grid size={{ xs: 2, sm: 4, md: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={addLineItem}
                    sx={{ ...buttonStyles.primary, height: "56px" }}
                    disabled={!newLineItem.description.trim()}
                  >
                    {language === "he" ? "הוסף" : "Add"}
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Line Items List */}
            {lineItems.length > 0 && (
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "background.default",
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {language === "he" ? "פריטים בחשבונית" : "Invoice Items"}
                  </Typography>
                </Box>

                <Box sx={{ p: 2 }}>
                  {lineItems.map((line, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        backgroundColor: "background.paper",
                        borderRadius: 1,
                        mb: index < lineItems.length - 1 ? 2 : 0,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {line.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {line.quantity} {line.unit} × ₪
                          {line.unitCost.toLocaleString()} = ₪
                          {(line.quantity * line.unitCost).toLocaleString()}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => removeLineItem(index)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}

                  {/* Totals */}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Box sx={{ minWidth: 300 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body1">
                          {language === "he" ? "סכום ביניים:" : "Subtotal:"}
                        </Typography>
                        <Typography variant="body1">
                          ₪{calculateSubtotal().toLocaleString()}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body1">
                          {language === "he" ? 'מע"מ:' : "Tax:"}
                        </Typography>
                        <Typography variant="body1">
                          ₪{calculateTotalTax().toLocaleString()}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {language === "he" ? 'סה"כ:' : "Total:"}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          ₪{calculateTotal().toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={buttonStyles.secondary}
            disabled={loading}
          >
            {language === "he" ? "ביטול" : "Cancel"}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={buttonStyles.primary}
            disabled={
              loading ||
              !formData.supplierId ||
              !formData.supplierInvoiceNumber.trim()
            }
          >
            {loading
              ? language === "he"
                ? "שומר..."
                : "Saving..."
              : language === "he"
              ? "שמור"
              : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
