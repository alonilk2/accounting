import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Receipt as ReceiptIcon } from "@mui/icons-material";
import { invoicesAPI } from "../../services/api";
import { useUIStore } from "../../stores";
import type {
  Receipt,
  Customer,
  Company,
  Invoice,
} from "../../types/entities";
import { PrintButton, PrintableReceipt } from "../print";

interface InvoiceReceiptsDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
  customer?: Customer;
  company?: Company;
}

const InvoiceReceiptsDialog = ({
  open,
  onClose,
  invoice,
  customer,
  company,
}: InvoiceReceiptsDialogProps) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useUIStore();

  // Translations
  const t = {
    title: language === "he" ? "קבלות ותשלומים" : "Receipts & Payments",
    invoice: language === "he" ? "חשבונית מס׳" : "Invoice #",
    paymentSummary: language === "he" ? "סיכום תשלומים" : "Payment Summary",
    totalAmount: language === "he" ? "סכום כולל" : "Total Amount",
    paidAmount: language === "he" ? "סכום ששולם" : "Paid Amount",
    balanceRemaining: language === "he" ? "יתרה לתשלום" : "Balance Remaining",
    receiptNumber: language === "he" ? "מס׳ קבלה" : "Receipt #",
    date: language === "he" ? "תאריך" : "Date",
    amount: language === "he" ? "סכום" : "Amount",
    paymentMethod: language === "he" ? "אמצעי תשלום" : "Payment Method",
    notes: language === "he" ? "הערות" : "Notes",
    noPayments:
      language === "he"
        ? "עדיין לא נרשמו תשלומים עבור חשבונית זו."
        : "No payments have been recorded for this invoice yet.",
    totalPayments: language === "he" ? "סה״כ" : "Total",
    paymentsRecorded: language === "he" ? "תשלומים נרשמו" : "payments recorded",
    paymentRecorded: language === "he" ? "תשלום נרשם" : "payment recorded",
    close: language === "he" ? "סגור" : "Close",
    errorLoading:
      language === "he" ? "שגיאה בטעינת הקבלות" : "Failed to load receipts",
    cash: language === "he" ? "מזומן" : "Cash",
    creditCard: language === "he" ? "כרטיס אשראי" : "Credit Card",
    bankTransfer: language === "he" ? "העברה בנקאית" : "Bank Transfer",
    check: language === "he" ? "צ׳ק" : "Check",
  };

  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const receiptsData = await invoicesAPI.getInvoiceReceipts(invoice.id);
      setReceipts(receiptsData);
    } catch (err) {
      console.error("Error loading receipts:", err);
      setError(
        language === "he" ? "שגיאה בטעינת הקבלות" : "Failed to load receipts"
      );
    } finally {
      setLoading(false);
    }
  }, [invoice.id, language]);

  useEffect(() => {
    if (open && invoice.id) {
      loadReceipts();
    }
  }, [open, invoice.id, loadReceipts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getPaymentMethodChipColor = (
    method: string
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    switch (method.toLowerCase()) {
      case "cash":
      case "מזומן":
        return "success";
      case "credit card":
      case "כרטיס אשראי":
        return "primary";
      case "bank transfer":
      case "העברה בנקאית":
        return "info";
      case "check":
      case "צ׳ק":
        return "warning";
      default:
        return "default";
    }
  };

  const getPaymentMethodDisplay = (method: string): string => {
    if (language === "he") {
      switch (method.toLowerCase()) {
        case "cash":
          return "מזומן";
        case "credit card":
          return "כרטיס אשראי";
        case "bank transfer":
          return "העברה בנקאית";
        case "check":
          return "צ׳ק";
        default:
          return method;
      }
    }
    return method;
  };

  const balanceRemaining = invoice.totalAmount - invoice.paidAmount;
  const isRTL = language === "he";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "400px",
          direction: isRTL ? "rtl" : "ltr",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ReceiptIcon />
        <Typography variant="h6" component="span">
          {t.title} - {t.invoice}
          {invoice.invoiceNumber}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Summary Section */}
        <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            {t.paymentSummary}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
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
              <Typography
                variant="h6"
                color={balanceRemaining > 0 ? "warning.main" : "success.main"}
              >
                {formatCurrency(balanceRemaining)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Receipts Table */}
        {!loading && !error && (
          <>
            {receipts.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {t.noPayments}
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table sx={{ direction: isRTL ? "rtl" : "ltr" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ textAlign: isRTL ? "right" : "left" }}>
                        {t.receiptNumber}
                      </TableCell>
                      <TableCell sx={{ textAlign: isRTL ? "right" : "left" }}>
                        {t.date}
                      </TableCell>
                      <TableCell sx={{ textAlign: isRTL ? "right" : "left" }}>
                        {t.amount}
                      </TableCell>
                      <TableCell sx={{ textAlign: isRTL ? "right" : "left" }}>
                        {t.paymentMethod}
                      </TableCell>
                      <TableCell sx={{ textAlign: isRTL ? "right" : "left" }}>
                        {t.notes}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center", width: 60 }}>
                        {language === "he" ? "הדפסה" : "Print"}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {receipts.map((receipt) => (
                      <TableRow key={receipt.id} hover>
                        <TableCell sx={{ textAlign: isRTL ? "right" : "left" }}>
                          <Typography variant="body2" fontWeight="medium">
                            {receipt.receiptNumber}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: isRTL ? "right" : "left" }}>
                          <Typography variant="body2">
                            {formatDate(receipt.paymentDate)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: isRTL ? "right" : "left" }}>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(receipt.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: isRTL ? "right" : "left" }}>
                          <Chip
                            label={getPaymentMethodDisplay(
                              receipt.paymentMethod
                            )}
                            size="small"
                            color={getPaymentMethodChipColor(
                              receipt.paymentMethod
                            )}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: isRTL ? "right" : "left" }}>
                          <Typography variant="body2" color="text.secondary">
                            {receipt.notes || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: "center", padding: "8px" }}>
                          {customer && company && (
                            <PrintButton
                              variant="outlined"
                              size="small"
                              iconOnly
                              printableContent={() => (
                                <PrintableReceipt
                                  receipt={receipt}
                                  invoice={invoice}
                                  customer={customer}
                                  company={company}
                                />
                              )}
                              documentTitle={`קבלה-${receipt.receiptNumber}`}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {receipts.length > 0 && (
              <Box
                sx={{ mt: 2, textAlign: language === "he" ? "left" : "right" }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t.totalPayments} {receipts.length}{" "}
                  {receipts.length !== 1
                    ? t.paymentsRecorded
                    : t.paymentRecorded}
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t.close}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceReceiptsDialog;
