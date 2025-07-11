import { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';
import { salesAPI } from '../../services/api';
import type { Receipt } from '../../types/entities';

interface ReceiptsDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  paidAmount: number;
}

const ReceiptsDialog = ({ 
  open, 
  onClose, 
  orderId, 
  orderNumber, 
  totalAmount, 
  paidAmount 
}: ReceiptsDialogProps) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const receiptsData = await salesAPI.getOrderReceipts(orderId);
      setReceipts(receiptsData);
    } catch (err) {
      console.error('Error loading receipts:', err);
      setError('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (open && orderId) {
      loadReceipts();
    }
  }, [open, orderId, loadReceipts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getPaymentMethodChipColor = (method: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'success';
      case 'credit card':
        return 'primary';
      case 'bank transfer':
        return 'info';
      case 'check':
        return 'warning';
      default:
        return 'default';
    }
  };

  const balanceRemaining = totalAmount - paidAmount;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptIcon />
        <Typography variant="h6" component="span">
          Receipts & Payments - Order #{orderNumber}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Summary Section */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Payment Summary
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Amount
              </Typography>
              <Typography variant="h6">
                {formatCurrency(totalAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Paid Amount
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatCurrency(paidAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Balance Remaining
              </Typography>
              <Typography 
                variant="h6" 
                color={balanceRemaining > 0 ? 'warning.main' : 'success.main'}
              >
                {formatCurrency(balanceRemaining)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
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
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No payments have been recorded for this order yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Receipt #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Payment Method</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {receipts.map((receipt) => (
                      <TableRow key={receipt.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {receipt.receiptNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(receipt.paymentDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(receipt.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={receipt.paymentMethod}
                            size="small"
                            color={getPaymentMethodChipColor(receipt.paymentMethod)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {receipt.notes || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {receipts.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Total {receipts.length} payment{receipts.length !== 1 ? 's' : ''} recorded
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptsDialog;
