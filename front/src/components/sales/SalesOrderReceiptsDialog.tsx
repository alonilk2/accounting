import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Receipt as ReceiptIcon } from "@mui/icons-material";
import { invoiceService } from "../../services/invoiceService";
import { useUIStore } from "../../stores";
import ReceiptsDialog from "./ReceiptsDialog";
import type {
  SalesOrder,
  Invoice,
  Customer,
  Company,
} from "../../types/entities";

interface SalesOrderReceiptsDialogProps {
  open: boolean;
  onClose: () => void;
  salesOrder: SalesOrder;
  customer?: Customer;
  company?: Company;
}

const SalesOrderReceiptsDialog = ({
  open,
  onClose,
  salesOrder,
  customer,
  company,
}: SalesOrderReceiptsDialogProps) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useUIStore();

  // Translations
  const t = {
    title: language === "he" ? "קבלות ותשלומים" : "Receipts & Payments",
    salesOrder: language === "he" ? "הזמנת מכירה מס׳" : "Sales Order #",
    loadingInvoice: language === "he" ? "טוען חשבונית..." : "Loading invoice...",
    noInvoice: 
      language === "he" 
        ? "לא נמצאה חשבונית עבור הזמנת מכירה זו. יש ליצור חשבונית כדי לרשום תשלומים."
        : "No invoice found for this sales order. Create an invoice to record payments.",
    errorLoading: 
      language === "he" 
        ? "שגיאה בטעינת החשבונית"
        : "Failed to load invoice",
    close: language === "he" ? "סגור" : "Close",
  };

  useEffect(() => {
    const loadInvoice = async () => {
      if (!open || !salesOrder.id) return;

      try {
        setLoading(true);
        setError(null);
        const invoiceData = await invoiceService.getInvoiceBySalesOrder(salesOrder.id);
        setInvoice(invoiceData);
      } catch (err) {
        console.error("Error loading invoice:", err);
        setError(
          language === "he" ? "שגיאה בטעינת החשבונית" : "Failed to load invoice"
        );
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [open, salesOrder.id, language]);

  // If we have an invoice, show the regular receipts dialog
  if (invoice && !loading && !error) {
    return (
      <ReceiptsDialog
        open={open}
        onClose={onClose}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        totalAmount={invoice.totalAmount}
        paidAmount={invoice.paidAmount}
        invoice={invoice}
        customer={customer}
        company={company}
      />
    );
  }

  // Otherwise show loading/error state
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          direction: language === "he" ? "rtl" : "ltr",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ReceiptIcon />
        <Typography variant="h6" component="span">
          {t.title} - {t.salesOrder}
          {salesOrder.orderNumber}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              {t.loadingInvoice}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && !invoice && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t.noInvoice}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t.close}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalesOrderReceiptsDialog;
