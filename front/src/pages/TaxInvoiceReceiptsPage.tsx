import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import taxInvoiceReceiptService from '../services/taxInvoiceReceiptService';
import TaxInvoiceReceiptCreateDialog from '../components/taxInvoiceReceipts/TaxInvoiceReceiptCreateDialog';
import type { TaxInvoiceReceiptListItem, TaxInvoiceReceiptStatus } from '../types/taxInvoiceReceipt';
import { TAX_INVOICE_RECEIPT_STATUS_LABELS } from '../types/taxInvoiceReceipt';

const TaxInvoiceReceiptsPage: React.FC = () => {
  const [receipts, setReceipts] = useState<TaxInvoiceReceiptListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taxInvoiceReceiptService.getTaxInvoiceReceipts();
      setReceipts(response.items);
    } catch (err) {
      console.error('Error loading tax invoice receipts:', err);
      setError('שגיאה בטעינת רשימת החשבוניות');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    loadReceipts(); // Refresh the list
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (status: TaxInvoiceReceiptStatus) => {
    const label = TAX_INVOICE_RECEIPT_STATUS_LABELS[status] || 'לא ידוע';
    
    const colorMap = {
      1: 'success' as const, // Paid - שולם
      2: 'error' as const,   // Cancelled - בוטל
    };

    const color = colorMap[status] || 'default' as const;
    
    return (
      <Chip
        label={label}
        color={color}
        size="small"
        variant="outlined"
      />
    );
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.documentNumber?.toString().includes(searchTerm)
  );

  const paginatedReceipts = filteredReceipts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          חשבוניות מס-קבלה
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          חשבונית מס-קבלה חדשה
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Actions */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="חיפוש לפי לקוח או מספר מסמך..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ 
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadReceipts}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            רענן
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>מספר מסמך</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>תאריך</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>לקוח</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>אופן תשלום</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>סכום כולל</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>סטטוס</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: 120 }}>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography>טוען...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">
                      {searchTerm ? 'לא נמצאו תוצאות לחיפוש' : 'אין חשבוניות מס-קבלה עדיין'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReceipts.map((receipt) => (
                  <TableRow 
                    key={receipt.id}
                    hover
                    sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {receipt.documentNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(receipt.documentDate), 'dd/MM/yyyy', { locale: he })}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {receipt.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {receipt.paymentMethod}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        ₪{receipt.totalAmount?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getStatusChip(receipt.status)}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="הצג">
                          <IconButton
                            size="small"
                            onClick={() => {
                              // TODO: Navigate to view page
                              console.log('View receipt', receipt.id);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="הדפס">
                          <IconButton
                            size="small"
                            onClick={() => {
                              // TODO: Print receipt
                              console.log('Print receipt', receipt.id);
                            }}
                          >
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredReceipts.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="שורות בעמוד:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} מתוך ${count !== -1 ? count : `יותר מ ${to}`}`
          }
          sx={{
            '& .MuiTablePagination-selectLabel': {
              fontSize: '0.875rem',
            },
            '& .MuiTablePagination-displayedRows': {
              fontSize: '0.875rem',
            },
          }}
        />
      </Paper>

      {/* Create Dialog */}
      <TaxInvoiceReceiptCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateSuccess}
      />
    </Container>
  );
};

export default TaxInvoiceReceiptsPage;
