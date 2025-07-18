import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TablePagination,
  Box,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import taxInvoiceReceiptService from '../services/taxInvoiceReceiptService';
import type {
  TaxInvoiceReceiptListItem,
  TaxInvoiceReceiptFilter,
  TaxInvoiceReceiptStatus
} from '../types/taxInvoiceReceipt';
import { TaxInvoiceReceiptStatus as StatusEnum, TAX_INVOICE_RECEIPT_STATUS_LABELS } from '../types/taxInvoiceReceipt';

interface Customer {
  id: number;
  name: string;
}

const TaxInvoiceReceiptsPage: React.FC = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<TaxInvoiceReceiptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [filters, setFilters] = useState<TaxInvoiceReceiptFilter>({
    page: 1,
    pageSize: 25,
    sortBy: 'documentDate',
    sortDescending: true
  });

  // Dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);

  // Search state
  const [searchDocumentNumber, setSearchDocumentNumber] = useState('');
  const [searchCustomerId, setSearchCustomerId] = useState<number | ''>('');
  const [searchStatus, setSearchStatus] = useState<TaxInvoiceReceiptStatus | ''>('');
  const [searchFromDate, setSearchFromDate] = useState('');
  const [searchToDate, setSearchToDate] = useState('');

  // Load data
  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await taxInvoiceReceiptService.getTaxInvoiceReceipts(filters);
      setReceipts(response.items);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  // Load customers for search filter
  const loadCustomers = async () => {
    try {
      // This would be replaced with actual customer service call
      // For now, just empty array
      setCustomers([]);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  useEffect(() => {
    loadReceipts();
    loadCustomers();
  }, [filters]);

  const handleSearch = () => {
    setFilters({
      ...filters,
      documentNumber: searchDocumentNumber || undefined,
      customerId: searchCustomerId || undefined,
      status: searchStatus || undefined,
      fromDate: searchFromDate || undefined,
      toDate: searchToDate || undefined,
      page: 1
    });
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchDocumentNumber('');
    setSearchCustomerId('');
    setSearchStatus('');
    setSearchFromDate('');
    setSearchToDate('');
    setFilters({
      page: 1,
      pageSize: rowsPerPage,
      sortBy: 'documentDate',
      sortDescending: true
    });
    setPage(0);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
    setFilters({ ...filters, page: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setFilters({ ...filters, page: 1, pageSize: newRowsPerPage });
  };

  const handleCancelReceipt = async () => {
    if (!selectedReceiptId) return;

    try {
      await taxInvoiceReceiptService.cancelTaxInvoiceReceipt(selectedReceiptId);
      setShowCancelDialog(false);
      setSelectedReceiptId(null);
      loadReceipts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בביטול החשבונית');
    }
  };

  const handleDeleteReceipt = async () => {
    if (!selectedReceiptId) return;

    try {
      await taxInvoiceReceiptService.deleteTaxInvoiceReceipt(selectedReceiptId);
      setShowDeleteDialog(false);
      setSelectedReceiptId(null);
      loadReceipts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת החשבונית');
    }
  };

  const getStatusChip = (status: TaxInvoiceReceiptStatus) => {
    const color = status === StatusEnum.Paid ? 'success' : 'default';
    return (
      <Chip
        label={TAX_INVOICE_RECEIPT_STATUS_LABELS[status]}
        color={color}
        size="small"
      />
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          חשבוניות מס-קבלה
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/tax-invoice-receipts/create')}
          sx={{ mb: 2 }}
        >
          חשבונית מס-קבלה חדשה
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          חיפוש וסינון
        </Typography>
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} alignItems="center">
          <Grid size={{ xs: 4, md: 3 }}>
            <TextField
              fullWidth
              label="מספר מסמך"
              value={searchDocumentNumber}
              onChange={(e) => setSearchDocumentNumber(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <TextField
              fullWidth
              select
              label="לקוח"
              value={searchCustomerId}
              onChange={(e) => setSearchCustomerId(e.target.value as number | '')}
              size="small"
            >
              <MenuItem value="">כל הלקוחות</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <TextField
              fullWidth
              select
              label="סטטוס"
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value as TaxInvoiceReceiptStatus | '')}
              size="small"
            >
              <MenuItem value="">כל הסטטוסים</MenuItem>
              <MenuItem value={StatusEnum.Paid}>שולם</MenuItem>
              <MenuItem value={StatusEnum.Cancelled}>בוטל</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <TextField
              fullWidth
              type="date"
              label="מתאריך"
              value={searchFromDate}
              onChange={(e) => setSearchFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <TextField
              fullWidth
              type="date"
              label="עד תאריך"
              value={searchToDate}
              onChange={(e) => setSearchToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 4, md: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={handleSearch} color="primary">
                <SearchIcon />
              </IconButton>
              <IconButton onClick={handleClearSearch} color="secondary">
                <ClearIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>מספר מסמך</TableCell>
              <TableCell>תאריך</TableCell>
              <TableCell>לקוח</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>אופן תשלום</TableCell>
              <TableCell align="right">סכום</TableCell>
              <TableCell align="center">פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  טוען...
                </TableCell>
              </TableRow>
            ) : receipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  לא נמצאו חשבוניות מס-קבלה
                </TableCell>
              </TableRow>
            ) : (
              receipts.map((receipt) => (
                <TableRow key={receipt.id} hover>
                  <TableCell>{receipt.documentNumber}</TableCell>
                  <TableCell>{dayjs(receipt.documentDate).format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{receipt.customerName}</TableCell>
                  <TableCell>{getStatusChip(receipt.status)}</TableCell>
                  <TableCell>{receipt.paymentMethod}</TableCell>
                  <TableCell align="right">{formatCurrency(receipt.totalAmount)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => navigate(`/tax-invoice-receipts/${receipt.id}`)}
                      size="small"
                      title="צפייה"
                    >
                      <ViewIcon />
                    </IconButton>
                    {receipt.status === StatusEnum.Paid && (
                      <>
                        <IconButton
                          onClick={() => navigate(`/tax-invoice-receipts/${receipt.id}/edit`)}
                          size="small"
                          title="עריכה"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setSelectedReceiptId(receipt.id);
                            setShowCancelDialog(true);
                          }}
                          size="small"
                          title="ביטול"
                          color="warning"
                        >
                          <CancelIcon />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      onClick={() => {
                        setSelectedReceiptId(receipt.id);
                        setShowDeleteDialog(true);
                      }}
                      size="small"
                      title="מחיקה"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="שורות לעמוד:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        />
      </TableContainer>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>ביטול חשבונית מס-קבלה</DialogTitle>
        <DialogContent>
          האם אתה בטוח שברצונך לבטל את החשבונית? פעולה זו תחזיר את המלאי ותסמן את המסמך כמבוטל.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>ביטול</Button>
          <Button onClick={handleCancelReceipt} color="warning" variant="contained">
            אישור ביטול
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>מחיקת חשבונית מס-קבלה</DialogTitle>
        <DialogContent>
          האם אתה בטוח שברצונך למחוק את החשבונית? פעולה זו בלתי הפיכה.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>ביטול</Button>
          <Button onClick={handleDeleteReceipt} color="error" variant="contained">
            מחיקה
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TaxInvoiceReceiptsPage;
