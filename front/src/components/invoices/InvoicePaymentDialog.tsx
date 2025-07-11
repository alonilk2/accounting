import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { Payment as PaymentIcon } from "@mui/icons-material";
import { invoicesAPI } from "../../services/api";
import { useUIStore } from "../../stores";
import type { Invoice } from "../../types/entities";

interface InvoicePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
  onPaymentSuccess: () => void;
}

const InvoicePaymentDialog = ({
  open,
  onClose,
  invoice,
  onPaymentSuccess,
}: InvoicePaymentDialogProps) => {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useUIStore();

  // Translations
  const t = {
    title: language === "he" ? "רישום תשלום" : "Record Payment",
    invoice: language === "he" ? "חשבונית מס׳" : "Invoice #",
    customerName: language === "he" ? "שם הלקוח" : "Customer Name",
    totalAmount: language === "he" ? "סכום כולל" : "Total Amount",
    paidAmount: language === "he" ? "סכום ששולם" : "Paid Amount",
    balanceRemaining: language === "he" ? "יתרה לתשלום" : "Balance Remaining",
    paymentAmount: language === "he" ? "סכום התשלום" : "Payment Amount",
    paymentMethod: language === "he" ? "אמצעי תשלום" : "Payment Method",
    notes: language === "he" ? "הערות" : "Notes",
    cancel: language === "he" ? "ביטול" : "Cancel",
    recordPayment: language === "he" ? "רשום תשלום" : "Record Payment",
    cash: language === "he" ? "מזומן" : "Cash",
    creditCard: language === "he" ? "כרטיס אשראי" : "Credit Card",
    bankTransfer: language === "he" ? "העברה בנקאית" : "Bank Transfer",
    check: language === "he" ? "צ׳ק" : "Check",
    notesPlaceholder:
      language === "he"
        ? "הערות נוספות (אופציונלי)"
        : "Additional notes (optional)",
  };

  const paymentMethods = [
    { value: "Cash", label: t.cash },
    { value: "CreditCard", label: t.creditCard },
    { value: "BankTransfer", label: t.bankTransfer },
    { value: "Check", label: t.check },
  ];

  const balanceRemaining = invoice.totalAmount - invoice.paidAmount;
  const maxPaymentAmount = balanceRemaining;

  const handleSubmit = async () => {
    if (!paymentAmount) return;

    try {
      setLoading(true);
      setError(null);

      const amount = parseFloat(paymentAmount);
      if (amount <= 0) {
        setError(
          language === "he"
            ? "סכום התשלום חייב להיות גדול מ-0"
            : "Payment amount must be greater than 0"
        );
        return;
      }

      if (amount > maxPaymentAmount) {
        setError(
          language === "he"
            ? "סכום התשלום לא יכול להיות גדול מהיתרה"
            : "Payment amount cannot exceed the remaining balance"
        );
        return;
      }

      await invoicesAPI.processPayment(
        invoice.id,
        amount,
        paymentMethod,
        notes || undefined
      );

      // Reset form
      setPaymentAmount("");
      setNotes("");
      setPaymentMethod("Cash");

      onPaymentSuccess();
      onClose();
    } catch (err) {
      console.error("Error processing payment:", err);
      setError(
        language === "he"
          ? "שגיאה ברישום התשלום"
          : "Failed to record payment"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(amount);
  };

  // Set default payment amount to remaining balance when dialog opens
  useEffect(() => {
    if (open && balanceRemaining > 0) {
      setPaymentAmount(balanceRemaining.toString());
    }
  }, [open, balanceRemaining]);

  const isRTL = language === "he";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          direction: isRTL ? "rtl" : "ltr",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <PaymentIcon />
        <Typography variant="h6" component="span">
          {t.title} - {t.invoice}
          {invoice.invoiceNumber}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Invoice Summary */}
        <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t.customerName}: {invoice.customerName}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
              mt: 1,
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t.totalAmount}
              </Typography>
              <Typography variant="h6">
                {formatCurrency(invoice.totalAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t.paidAmount}
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatCurrency(invoice.paidAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t.balanceRemaining}
              </Typography>
              <Typography variant="h6" color="warning.main">
                {formatCurrency(balanceRemaining)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Payment Form */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label={t.paymentAmount}
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            fullWidth
            required
            inputProps={{
              min: 0.01,
              max: maxPaymentAmount,
              step: 0.01,
            }}
            helperText={`${language === "he" ? "מקסימום" : "Maximum"}: ${formatCurrency(
              maxPaymentAmount
            )}`}
          />

          <TextField
            select
            label={t.paymentMethod}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            fullWidth
            required
          >
            {paymentMethods.map((method) => (
              <MenuItem key={method.value} value={method.value}>
                {method.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={t.notes}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder={t.notesPlaceholder}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !paymentAmount}
        >
          {loading
            ? language === "he"
              ? "מעבד..."
              : "Processing..."
            : t.recordPayment}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoicePaymentDialog;
