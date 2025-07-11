import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  PointOfSale as POSIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  PrintOutlined as PrintAllIcon,
  TableChart as ExcelIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { he } from "date-fns/locale";
import { format } from "date-fns";
import { customersAPI, printService } from "../../services";
import { ModernButton } from "../ui";
import type {
  Customer,
  CustomerDocumentsResponse,
  CustomerDocumentStats,
} from "../../types/entities";

interface CustomerDocumentsDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer;
  companyId?: number;
}

const getDocumentIcon = (documentType: string) => {
  switch (documentType) {
    case "SalesOrder":
      return <ShoppingCartIcon />;
    case "Receipt":
      return <ReceiptIcon />;
    case "POSSale":
      return <POSIcon />;
    default:
      return <ReceiptIcon />;
  }
};

const getDocumentTypeLabel = (documentType: string) => {
  switch (documentType) {
    case "SalesOrder":
      return "מכירות";
    case "Receipt":
      return "קבלה";
    case "POSSale":
      return "מכירת קופה";
    default:
      return documentType;
  }
};

const getStatusColor = (status: string): "success" | "warning" | "error" | "default" | "primary" | "secondary" | "info" => {
  switch (status.toLowerCase()) {
    case "paid":
    case "completed":
      return "success";
    case "pending":
    case "confirmed":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

const CustomerDocumentsDialog: React.FC<CustomerDocumentsDialogProps> = ({
  open,
  onClose,
  customer,
  companyId = 1,
}) => {
  const [documentsData, setDocumentsData] =
    useState<CustomerDocumentsResponse | null>(null);
  const [statsData, setStatsData] = useState<CustomerDocumentStats | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [documentType, setDocumentType] = useState<string>("");

  const fetchData = useCallback(async () => {
    if (!open) return;

    setLoading(true);
    setError(null);

    try {
      const [documents, stats] = await Promise.all([
        customersAPI.getDocuments(
          customer.id,
          companyId,
          fromDate || undefined,
          toDate || undefined,
          documentType || undefined
        ),
        customersAPI.getDocumentStats(customer.id, companyId),
      ]);

      setDocumentsData(documents);
      setStatsData(stats);
    } catch (err) {
      console.error("Error fetching customer documents:", err);
      setError("שגיאה בטעינת המסמכים. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  }, [open, customer.id, companyId, fromDate, toDate, documentType]);

  useEffect(() => {
    fetchData();
  }, [open, customer.id, companyId, fromDate, toDate, documentType, fetchData]);

  const handleFilterReset = () => {
    setFromDate(null);
    setToDate(null);
    setDocumentType("");
  };

  const handleViewDocument = async (documentId: number, documentType: string) => {
    try {
      await printService.viewDocument(documentType, documentId, companyId);
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('שגיאה בפתיחת המסמך לצפייה');
    }
  };

  const handlePrintDocument = async (documentId: number, documentType: string) => {
    if (!documentsData) return;
    
    const document = documentsData.documents.find(
      doc => doc.id === documentId && doc.documentType === documentType
    );
    
    if (document) {
      try {
        // Open print dialog by viewing the document first
        await printService.viewDocument(documentType, documentId, companyId);
      } catch (error) {
        console.error('Error opening document for printing:', error);
        alert('שגיאה בפתיחת המסמך להדפסה');
      }
    }
  };

  const handleDownloadDocument = async (documentId: number, documentType: string) => {
    try {
      await printService.downloadDocument(documentType, documentId, companyId);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('שגיאה בהורדת המסמך');
    }
  };

  const handlePrintAllDocuments = async () => {
    try {
      await printService.downloadCustomerReport(
        customer.id,
        customer.name,
        companyId,
        fromDate || undefined,
        toDate || undefined,
        documentType || undefined
      );
    } catch (error) {
      console.error('Error downloading customer report:', error);
      alert('שגיאה בהורדת דוח כל המסמכים');
    }
  };

  const handleExportToExcel = async () => {
    try {
      // For now, we'll create a CSV export which can be opened in Excel
      if (!documentsData) return;
      
      const csvContent = [
        // Header row
        ['סוג מסמך', 'מספר מסמך', 'תאריך', 'סכום', 'סטטוס', 'תיאור'].join(','),
        // Data rows
        ...documentsData.documents.map(doc => [
          getDocumentTypeLabel(doc.documentType),
          doc.documentNumber,
          formatDate(doc.documentDate),
          `"${formatCurrency(doc.totalAmount)}"`,
          doc.status,
          `"${doc.description || '-'}"`
        ].join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `customer-documents-${customer.name}-${customer.id}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('שגיאה ביצוא לאקסל');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale: he });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            minHeight: "80vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ReceiptIcon color="primary" />
            <Box>
              <Typography variant="h5" component="div" fontWeight="bold">
                מסמכי הלקוח
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {customer.name}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              {/* Statistics Cards */}
              {statsData && (
                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 4, sm: 4, md: 3 }}>
                    <Card sx={{ borderRadius: "12px" }}>
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <TrendingUpIcon color="primary" />
                          <Typography variant="h6" fontWeight="bold">
                            {statsData.totalSalesOrders}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          מכירות
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 4, sm: 4, md: 3 }}>
                    <Card sx={{ borderRadius: "12px" }}>
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <ReceiptIcon color="secondary" />
                          <Typography variant="h6" fontWeight="bold">
                            {statsData.totalReceipts}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          קבלות
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 4, sm: 4, md: 3 }}>
                    <Card sx={{ borderRadius: "12px" }}>
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <POSIcon color="success" />
                          <Typography variant="h6" fontWeight="bold">
                            {statsData.totalPOSSales}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          מכירות קופה
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 4, sm: 4, md: 3 }}>
                    <Card sx={{ borderRadius: "12px" }}>
                      <CardContent>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <MoneyIcon color="warning" />
                          <Typography variant="h6" fontWeight="bold">
                            {formatCurrency(statsData.totalAmount)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          סה"כ סכום
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Filters */}
              <Card sx={{ mb: 3, borderRadius: "12px" }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FilterIcon />
                      <Typography variant="h6">סינון מסמכים</Typography>
                    </Box>
                    {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>

                  <Collapse in={showFilters}>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={{ xs: 2, md: 2 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                      <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                        <DatePicker
                          label="מתאריך"
                          value={fromDate}
                          onChange={(newValue) => setFromDate(newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: "outlined",
                            },
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                        <DatePicker
                          label="עד תאריך"
                          value={toDate}
                          onChange={(newValue) => setToDate(newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: "outlined",
                            },
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                        <FormControl fullWidth>
                          <InputLabel>סוג מסמך</InputLabel>
                          <Select
                            value={documentType}
                            label="סוג מסמך"
                            onChange={(e) => setDocumentType(e.target.value)}
                          >
                            <MenuItem value="">הכל</MenuItem>
                            <MenuItem value="SalesOrder">מכירות</MenuItem>
                            <MenuItem value="Receipt">קבלה</MenuItem>
                            <MenuItem value="POSSale">מכירת קופה</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                      <ModernButton
                        variant="outline"
                        onClick={handleFilterReset}
                        size="small"
                      >
                        איפוס
                      </ModernButton>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>

              {/* Documents Table */}
              {documentsData && (
                <Card sx={{ borderRadius: "12px" }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        רשימת מסמכים
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          סה"כ {documentsData.totalDocuments} מסמכים |{" "}
                          {formatCurrency(documentsData.totalAmount)}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="הדפסת כל המסמכים" arrow>
                            <IconButton
                              size="small"
                              onClick={handlePrintAllDocuments}
                              sx={{
                                color: "secondary.main",
                                "&:hover": { bgcolor: "secondary.50" }
                              }}
                            >
                              <PrintAllIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="יצוא לאקסל" arrow>
                            <IconButton
                              size="small"
                              onClick={handleExportToExcel}
                              sx={{
                                color: "success.main",
                                "&:hover": { bgcolor: "success.50" }
                              }}
                            >
                              <ExcelIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>

                    {documentsData.documents.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="h6" color="text.secondary">
                          לא נמצאו מסמכים
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          נסה לשנות את הפילטרים או להוסיף מסמכים חדשים
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer
                        component={Paper}
                        sx={{ borderRadius: "8px" }}
                      >
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: "primary.50" }}>
                              <TableCell>
                                <strong>סוג</strong>
                              </TableCell>
                              <TableCell>
                                <strong>מספר מסמך</strong>
                              </TableCell>
                              <TableCell>
                                <strong>תאריך</strong>
                              </TableCell>
                              <TableCell>
                                <strong>סכום</strong>
                              </TableCell>
                              <TableCell>
                                <strong>סטטוס</strong>
                              </TableCell>
                              <TableCell>
                                <strong>תיאור</strong>
                              </TableCell>
                              <TableCell align="center">
                                <strong>פעולות</strong>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {documentsData.documents.map((document) => (
                              <TableRow
                                key={`${document.documentType}-${document.id}`}
                                hover
                                sx={{ "&:hover": { bgcolor: "action.hover" } }}
                              >
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    {getDocumentIcon(document.documentType)}
                                    <Typography variant="body2">
                                      {getDocumentTypeLabel(
                                        document.documentType
                                      )}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    fontWeight="medium"
                                  >
                                    {document.documentNumber}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <CalendarIcon
                                      fontSize="small"
                                      color="action"
                                    />
                                    <Typography variant="body2">
                                      {formatDate(document.documentDate)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    fontWeight="medium"
                                  >
                                    {formatCurrency(document.totalAmount)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={document.status}
                                    color={getStatusColor(document.status)}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {document.description || "-"}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                                    <Tooltip title="צפייה במסמך" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleViewDocument(document.id, document.documentType)}
                                        sx={{ 
                                          color: "primary.main",
                                          "&:hover": { bgcolor: "primary.50" }
                                        }}
                                      >
                                        <ViewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="הדפסת מסמך" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => handlePrintDocument(document.id, document.documentType)}
                                        sx={{ 
                                          color: "secondary.main",
                                          "&:hover": { bgcolor: "secondary.50" }
                                        }}
                                      >
                                        <PrintIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="הורדת מסמך כ-PDF" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDownloadDocument(document.id, document.documentType)}
                                        sx={{ 
                                          color: "success.main",
                                          "&:hover": { bgcolor: "success.50" }
                                        }}
                                      >
                                        <DownloadIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{ p: 3, borderTop: "1px solid", borderColor: "divider" }}
        >
          <ModernButton variant="outline" onClick={onClose}>
            סגור
          </ModernButton>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CustomerDocumentsDialog;
