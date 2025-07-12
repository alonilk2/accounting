import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Stack,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import type {
  Invoice,
  InvoiceStatus,
  Company,
  Customer,
} from "../types/entities";
import InvoiceCreateDialog from "../components/invoices/InvoiceCreateDialog";
import InvoicePaymentDialog from "../components/invoices/InvoicePaymentDialog";
import InvoiceReceiptsDialog from "../components/invoices/InvoiceReceiptsDialog";
import { PrintButton, PrintableInvoice } from "../components/print";
import { invoicesAPI } from "../services/api";

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptsDialog, setShowReceiptsDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchInvoices();
    fetchCompany();
    fetchCustomers();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesAPI.getAll();
      setInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompany = async () => {
    try {
      const response = await fetch("/api/company");
      if (response.ok) {
        const companyData = await response.json();
        // Convert date strings to Date objects
        companyData.createdAt = new Date(companyData.createdAt);
        companyData.updatedAt = new Date(companyData.updatedAt);
        setCompany(companyData);
      } else {
        // Fallback company data
        setCompany({
          id: "1",
          name: "החברה שלי",
          israelTaxId: "123456789",
          address: "כתובת החברה",
          currency: "ILS",
          phone: "03-1234567",
          email: "info@company.co.il",
          website: "www.company.co.il",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      // Fallback company data
      setCompany({
        id: "1",
        name: "החברה שלי",
        israelTaxId: "123456789",
        address: "כתובת החברה",
        currency: "ILS",
        phone: "03-1234567",
        email: "info@company.co.il",
        website: "www.company.co.il",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const customersData = await response.json();
        setCustomers(customersData);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const getStatusColor = (
    status: InvoiceStatus
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success" => {
    switch (status) {
      case "Draft":
        return "default";
      case "Sent":
        return "info";
      case "Paid":
        return "success";
      case "Overdue":
        return "error";
      case "Cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: InvoiceStatus): string => {
    switch (status) {
      case "Draft":
        return "טיוטה";
      case "Sent":
        return "נשלחה";
      case "Paid":
        return "שולמה";
      case "Overdue":
        return "פגת תוקף";
      case "Cancelled":
        return "בוטלה";
      default:
        return status;
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPrintableInvoiceComponent = (invoice: Invoice) => {
    if (!company) {
      return null;
    }

    return () => <PrintableInvoice invoice={invoice} company={company} />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          חשבוניות
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
        >
          חשבונית חדשה
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="חיפוש לפי שם לקוח או מספר חשבונית..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>מספר חשבונית</TableCell>
                <TableCell>לקוח</TableCell>
                <TableCell>תאריך</TableCell>
                <TableCell>סכום</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    טוען...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    לא נמצאו חשבוניות
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {invoice.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {invoice.invoiceDate.toLocaleDateString("he-IL")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ₪{invoice.totalAmount.toFixed(2)}
                      </Typography>
                      {invoice.paidAmount > 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          שולם: ₪{invoice.paidAmount.toFixed(2)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(invoice.status)}
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          alignItems: "center",
                          height: "100%",
                          py: 0.5,
                        }}
                      >
                        {/* Payment button - only if balance remains */}
                        {invoice.totalAmount > invoice.paidAmount && (
                          <Box
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowPaymentDialog(true);
                            }}
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              cursor: "pointer",
                              padding: "4px 6px",
                              borderRadius: "6px",
                              transition: "all 0.2s ease",
                              minWidth: "48px",
                              "&:hover": {
                                backgroundColor: "action.hover",
                                transform: "translateY(-1px)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              },
                              "&:active": {
                                transform: "translateY(0)",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                color: "primary.main",
                                mb: 0.25,
                                fontSize: "16px",
                                transition: "color 0.2s ease",
                                "&:hover": {
                                  color: "primary.dark",
                                },
                              }}
                            >
                              <PaymentIcon />
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "9px",
                                fontWeight: 500,
                                textAlign: "center",
                                lineHeight: 1,
                                color: "text.secondary",
                                transition: "color 0.2s ease",
                                "&:hover": {
                                  color: "text.primary",
                                },
                              }}
                            >
                              תשלום
                            </Typography>
                          </Box>
                        )}

                        {/* Print button */}
                        <Box
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPrintDialog(true);
                          }}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            cursor: "pointer",
                            padding: "4px 6px",
                            borderRadius: "6px",
                            transition: "all 0.2s ease",
                            minWidth: "48px",
                            "&:hover": {
                              backgroundColor: "action.hover",
                              transform: "translateY(-1px)",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            },
                            "&:active": {
                              transform: "translateY(0)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              color: "primary.main",
                              mb: 0.25,
                              fontSize: "16px",
                              transition: "color 0.2s ease",
                              "&:hover": {
                                color: "primary.dark",
                              },
                            }}
                          >
                            <PrintIcon />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "9px",
                              fontWeight: 500,
                              textAlign: "center",
                              lineHeight: 1,
                              color: "text.secondary",
                              transition: "color 0.2s ease",
                              "&:hover": {
                                color: "text.primary",
                              },
                            }}
                          >
                            הדפס
                          </Typography>
                        </Box>

                        {/* Receipts button - only if there are payments */}
                        {invoice.paidAmount > 0 && (
                          <Box
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowReceiptsDialog(true);
                            }}
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              cursor: "pointer",
                              padding: "4px 6px",
                              borderRadius: "6px",
                              transition: "all 0.2s ease",
                              minWidth: "48px",
                              "&:hover": {
                                backgroundColor: "action.hover",
                                transform: "translateY(-1px)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              },
                              "&:active": {
                                transform: "translateY(0)",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                color: "primary.main",
                                mb: 0.25,
                                fontSize: "16px",
                                transition: "color 0.2s ease",
                                "&:hover": {
                                  color: "primary.dark",
                                },
                              }}
                            >
                              <ReceiptIcon />
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "9px",
                                fontWeight: 500,
                                textAlign: "center",
                                lineHeight: 1,
                                color: "text.secondary",
                                transition: "color 0.2s ease",
                                "&:hover": {
                                  color: "text.primary",
                                },
                              }}
                            >
                              קבלות
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => setShowCreateDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Invoice Create Dialog */}
      <InvoiceCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={(invoiceId) => {
          console.log("Invoice created with ID:", invoiceId);
          setShowCreateDialog(false);
          fetchInvoices(); // Refresh the list
        }}
      />

      {/* Payment Dialog */}
      {selectedInvoice && (
        <InvoicePaymentDialog
          open={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onPaymentSuccess={() => {
            fetchInvoices(); // Refresh the list
          }}
        />
      )}

      {/* Receipts Dialog */}
      {selectedInvoice && (
        <InvoiceReceiptsDialog
          open={showReceiptsDialog}
          onClose={() => {
            setShowReceiptsDialog(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          customer={customers.find((c) => c.id === selectedInvoice.customerId)}
          company={company || undefined}
        />
      )}

      {/* Print Dialog */}
      {showPrintDialog && selectedInvoice && (
        <Dialog
          open={showPrintDialog}
          onClose={() => {
            setShowPrintDialog(false);
            setSelectedInvoice(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" component="div">
              הדפסת חשבונית {selectedInvoice.invoiceNumber}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                py: 2,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                האם ברצונך להדפיס את החשבונית?
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 2,
                }}
              >
                {(() => {
                  const PrintableComponent =
                    getPrintableInvoiceComponent(selectedInvoice);

                  if (!PrintableComponent || !company) {
                    return (
                      <Typography color="error">
                        לא ניתן להדפיס את החשבונית - חסרים נתונים
                      </Typography>
                    );
                  }

                  return (
                    <>
                      <PrintButton
                        variant="contained"
                        size="large"
                        printableContent={PrintableComponent}
                        documentTitle={`חשבונית-${selectedInvoice.invoiceNumber}`}
                        onAfterPrint={() => {
                          setShowPrintDialog(false);
                          setSelectedInvoice(null);
                        }}
                      >
                        הדפס חשבונית
                      </PrintButton>
                    </>
                  );
                })()}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => {
                setShowPrintDialog(false);
                setSelectedInvoice(null);
              }}
            >
              סגור
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default InvoicesPage;
