import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Grid,
} from '@mui/material';

import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useUIStore } from '../stores';
import { salesAPI } from '../services/api';
import type { SalesOrder, SalesOrderStatus } from '../types/entities';
import SalesOrderForm from '../components/sales/SalesOrderForm';
import ReceiptsDialog from '../components/sales/ReceiptsDialog';
import { ModernButton, ModernFab } from '../components/ui';

const Sales = () => {
  const { language } = useUIStore();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showReceiptsDialog, setShowReceiptsDialog] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | ''>('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const ordersData = await salesAPI.getOrders({
        status: statusFilter || undefined,
      });
      setOrders(ordersData);
    } catch (err) {
      setError('Failed to load sales orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: number, newStatus: SalesOrderStatus) => {
    try {
      await salesAPI.updateStatus(orderId, newStatus);
      await loadOrders(); // Refresh the list
    } catch (err) {
      setError('Failed to update order status');
      console.error('Error updating status:', err);
    }
  };

  const handlePayment = async () => {
    if (!selectedOrder || !paymentAmount) return;

    try {
      const amount = parseFloat(paymentAmount);
      if (amount <= 0) {
        setError('Payment amount must be greater than 0');
        return;
      }

      await salesAPI.processPayment(selectedOrder.id, amount, paymentMethod);
      setShowPaymentDialog(false);
      setSelectedOrder(null);
      setPaymentAmount('');
      await loadOrders(); // Refresh the list
    } catch (err) {
      setError('Failed to process payment');
      console.error('Error processing payment:', err);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'orderNumber',
      headerName: 'מספר הזמנה',
      width: 150,
    },
    {
      field: 'customerName',
      headerName: 'לקוח',
      width: 200,
    },
    {
      field: 'orderDate',
      headerName: 'תאריך',
      width: 120,
      valueFormatter: (value: unknown) => {
        if (value instanceof Date) {
          return value.toLocaleDateString('he-IL');
        }
        if (typeof value === 'string') {
          return new Date(value).toLocaleDateString('he-IL');
        }
        return '-';
      },
    },
    {
      field: 'dueDate',
      headerName: 'תאריך יעד',
      width: 120,
      valueFormatter: (value: unknown) => {
        if (!value) return '-';
        if (value instanceof Date) {
          return value.toLocaleDateString('he-IL');
        }
        if (typeof value === 'string') {
          return new Date(value).toLocaleDateString('he-IL');
        }
        return '-';
      },
    },
    {
      field: 'status',
      headerName: 'סטטוס',
      width: 180,
      renderCell: (params) => {
        const order = params.row as SalesOrder;
        return (
          <TextField
            select
            value={params.value}
            onChange={(e) => handleStatusChange(order.id, e.target.value as SalesOrderStatus)}
            size="small"
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="Draft">טיוטה</MenuItem>
            <MenuItem value="Confirmed">מאושר</MenuItem>
            <MenuItem value="Shipped">נשלח</MenuItem>
            <MenuItem value="Invoiced">חשבונית</MenuItem>
            <MenuItem value="Paid">שולם</MenuItem>
            <MenuItem value="Cancelled">בוטל</MenuItem>
          </TextField>
        );
      },
    },
    {
      field: 'totalAmount',
      headerName: 'סכום כולל',
      width: 120,
      type: 'number',
      valueFormatter: (value: unknown) => `₪${Number(value).toLocaleString()}`,
    },
    {
      field: 'paidAmount',
      headerName: 'שולם',
      width: 120,
      type: 'number',
      valueFormatter: (value: unknown) => `₪${Number(value).toLocaleString()}`,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'פעולות',
      width: 120,
      getActions: (params) => {
        const order = params.row as SalesOrder;
        const actions = [];

        if (order.status !== 'Paid' && order.status !== 'Cancelled') {
          actions.push(
            <GridActionsCellItem
              icon={<PaymentIcon />}
              label="תשלום"
              onClick={() => {
                setSelectedOrder(order);
                setPaymentAmount((order.totalAmount - order.paidAmount).toString());
                setShowPaymentDialog(true);
              }}
            />
          );
        }

        // Always show receipts button if there are any payments
        if (order.paidAmount > 0) {
          actions.push(
            <GridActionsCellItem
              icon={<ReceiptIcon />}
              label="קבלות"
              onClick={() => {
                setSelectedOrder(order);
                setShowReceiptsDialog(true);
              }}
            />
          );
        }

        actions.push(
          <GridActionsCellItem
            icon={<EditIcon />}
            label="עריכה"
            onClick={() => {
              // TODO: Implement edit functionality
              console.log('Edit order:', order.id);
            }}
          />
        );

        return actions;
      },
    },
  ];

  const statusOptions = [
    { value: '', label: 'כל הסטטוסים' },
    { value: 'Draft', label: 'טיוטה' },
    { value: 'Confirmed', label: 'מאושר' },
    { value: 'Shipped', label: 'נשלח' },
    { value: 'Invoiced', label: 'חשבונית' },
    { value: 'Paid', label: 'שולם' },
    { value: 'Cancelled', label: 'בוטל' },
  ];

  const paymentMethods = [
    { value: 'Cash', label: 'מזומן' },
    { value: 'CreditCard', label: 'כרטיס אשראי' },
    { value: 'BankTransfer', label: 'העברה בנקאית' },
    { value: 'Check', label: 'צ\'ק' },
  ];

  if (showForm) {
    return (
      <SalesOrderForm
        onSave={() => {
          setShowForm(false);
          loadOrders();
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {language === 'he' ? 'מכירות והזמנות' : 'Sales & Orders'}
        </Typography>
        <Box display="flex" gap={1}>
          <ModernButton
            variant="outline"
            icon={<RefreshIcon />}
            onClick={loadOrders}
            disabled={loading}
          >
            {language === 'he' ? 'רענן' : 'Refresh'}
          </ModernButton>
          <ModernButton
            variant="primary"
            icon={<AddIcon />}
            onClick={() => setShowForm(true)}
            glow
          >
            {language === 'he' ? 'הזמנה חדשה' : 'New Order'}
          </ModernButton>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {language === 'he' ? 'סינון' : 'Filters'}
          </Typography>
          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} alignItems="center">
            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <TextField
                select
                label="סטטוס"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SalesOrderStatus | '')}
                fullWidth
                size="small"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <DatePicker
                label="מתאריך"
                value={dateFrom}
                onChange={setDateFrom}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <DatePicker
                label="עד תאריך"
                value={dateTo}
                onChange={setDateTo}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <ModernButton
                variant="ghost"
                onClick={() => {
                  setStatusFilter('');
                  setDateFrom(null);
                  setDateTo(null);
                }}
                fullWidth
              >
                נקה סינון
              </ModernButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent>
          <DataGrid
            rows={orders}
            columns={columns}
            loading={loading}
            autoHeight
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            sx={{
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'background.paper',
                fontWeight: 'bold',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>רישום תשלום</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {selectedOrder && (
              <Typography variant="body2" color="textSecondary" gutterBottom>
                הזמנה: {selectedOrder.orderNumber} | לקוח: {selectedOrder.customerName}
              </Typography>
            )}
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <TextField
                  label="סכום תשלום"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                <TextField
                  select
                  label="אמצעי תשלום"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  fullWidth
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <ModernButton 
            variant="ghost" 
            onClick={() => setShowPaymentDialog(false)}
          >
            ביטול
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handlePayment}
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            glow
          >
            רשום תשלום
          </ModernButton>
        </DialogActions>
      </Dialog>

      {/* Receipts Dialog */}
      {selectedOrder && (
        <ReceiptsDialog
          open={showReceiptsDialog}
          onClose={() => setShowReceiptsDialog(false)}
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.orderNumber}
          totalAmount={selectedOrder.totalAmount}
          paidAmount={selectedOrder.paidAmount}
        />
      )}

      {/* Floating Action Button for Quick Add */}
      <ModernFab
        variant="ai"
        icon={<AddIcon />}
        tooltip="הזמנה חדשה"
        onClick={() => setShowForm(true)}
        glow
        pulse
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      />
    </Box>
  );
};

export default Sales;
