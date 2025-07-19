// Sales Orders List - רשימת הזמנות מכירה
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Toolbar,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  Alert,
  Skeleton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  FileCopy as CopyIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import type { SalesOrder, SalesOrderStatus, Customer } from '../../types/entities';
import salesOrdersApi from '../../services/salesOrdersApi';
import { customersApi } from '../../services/customersApi';
import CreateSalesOrderDialog from './CreateSalesOrderDialog';
import { SALES_ORDER_STATUS_LABELS } from '../../constants';

interface SalesOrdersListProps {
  companyId?: number;
}

// Status colors mapping - now using shared constants
const getStatusColor = (status: SalesOrderStatus): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  switch (status) {
    case 'Quote': return 'info';
    case 'Confirmed': return 'primary';
    case 'Shipped': return 'warning';
    case 'Completed': return 'success';
    case 'Cancelled': return 'error';
    default: return 'default';
  }
};

// Status labels - now using shared constants
const getStatusLabel = (status: SalesOrderStatus, isHebrew: boolean): string => {
  const language = isHebrew ? 'he' : 'en';
  return SALES_ORDER_STATUS_LABELS[language][status] || status;
};

export default function SalesOrdersList({ companyId = 1 }: SalesOrdersListProps): React.ReactElement {
  const theme = useTheme();
  const isHebrew = theme.direction === 'rtl';

  // Data state
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | ''>('');
  const [customerFilter, setCustomerFilter] = useState<number | ''>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Load data
  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, [companyId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const ordersList = await salesOrdersApi.getSalesOrders({
        companyId,
        status: statusFilter || undefined,
        customerId: customerFilter || undefined
      });
      setOrders(ordersList);
    } catch (err) {
      console.error('Error loading sales orders:', err);
      setError(isHebrew ? 'שגיאה בטעינת רשימת ההזמנות' : 'Error loading sales orders');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const customersList = await customersApi.getCustomers();
      setCustomers(customersList);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(search) ||
      order.customerName.toLowerCase().includes(search) ||
      (order.notes && order.notes.toLowerCase().includes(search))
    );
  });

  // Apply filters when they change
  useEffect(() => {
    loadOrders();
  }, [statusFilter, customerFilter]);

  const handleCreateSuccess = (newOrder: SalesOrder) => {
    setOrders([newOrder, ...orders]);
    setCreateDialogOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: SalesOrder) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleViewOrder = (order: SalesOrder) => {
    // TODO: Implement view order details
    console.log('View order:', order);
    handleMenuClose();
  };

  const handleEditOrder = (order: SalesOrder) => {
    // TODO: Implement edit order
    console.log('Edit order:', order);
    handleMenuClose();
  };

  const handleDeleteOrder = async (order: SalesOrder) => {
    if (window.confirm(isHebrew ? 'האם אתה בטוח שברצונך למחוק הזמנה זו?' : 'Are you sure you want to delete this order?')) {
      try {
        await salesOrdersApi.deleteSalesOrder(order.id, companyId);
        setOrders(orders.filter(o => o.id !== order.id));
      } catch (err) {
        console.error('Error deleting order:', err);
        setError(isHebrew ? 'שגיאה במחיקת ההזמנה' : 'Error deleting order');
      }
    }
    handleMenuClose();
  };

  const handlePrintOrder = (order: SalesOrder) => {
    // TODO: Implement print order
    console.log('Print order:', order);
    handleMenuClose();
  };

  const handleEmailOrder = (order: SalesOrder) => {
    // TODO: Implement email order
    console.log('Email order:', order);
    handleMenuClose();
  };

  const handleCopyOrder = (order: SalesOrder) => {
    // TODO: Implement copy order
    console.log('Copy order:', order);
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box p={3}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={80} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Toolbar sx={{ px: 0 }}>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            {isHebrew ? 'הזמנות מכירה' : 'Sales Orders'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            {isHebrew ? 'הזמנה חדשה' : 'New Order'}
          </Button>
        </Toolbar>

        <Divider sx={{ my: 2 }} />

        {/* Filters */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label={isHebrew ? 'חיפוש' : 'Search'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: <SearchIcon />
              }}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{isHebrew ? 'סטטוס' : 'Status'}</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SalesOrderStatus | '')}
                label={isHebrew ? 'סטטוס' : 'Status'}
              >
                <MenuItem value="">
                  {isHebrew ? 'כל הסטטוסים' : 'All Statuses'}
                </MenuItem>
                <MenuItem value="Quote">{getStatusLabel('Quote', isHebrew)}</MenuItem>
                <MenuItem value="Confirmed">{getStatusLabel('Confirmed', isHebrew)}</MenuItem>
                <MenuItem value="Shipped">{getStatusLabel('Shipped', isHebrew)}</MenuItem>
                <MenuItem value="Completed">{getStatusLabel('Completed', isHebrew)}</MenuItem>
                <MenuItem value="Cancelled">{getStatusLabel('Cancelled', isHebrew)}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{isHebrew ? 'לקוח' : 'Customer'}</InputLabel>
              <Select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value as number | '')}
                label={isHebrew ? 'לקוח' : 'Customer'}
              >
                <MenuItem value="">
                  {isHebrew ? 'כל הלקוחות' : 'All Customers'}
                </MenuItem>
                {customers.map(customer => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={loadOrders}
              fullWidth
              size="small"
            >
              {isHebrew ? 'סנן' : 'Filter'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {isHebrew ? 'סה״כ הזמנות' : 'Total Orders'}
              </Typography>
              <Typography variant="h4" component="div">
                {filteredOrders.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {isHebrew ? 'הזמנות פעילות' : 'Active Orders'}
              </Typography>
              <Typography variant="h4" component="div">
                {filteredOrders.filter(o => o.status === 'Confirmed' || o.status === 'Shipped').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {isHebrew ? 'ערך כולל' : 'Total Value'}
              </Typography>
              <Typography variant="h4" component="div">
                ₪{filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {isHebrew ? 'הצעות מחיר' : 'Quotes'}
              </Typography>
              <Typography variant="h4" component="div">
                {filteredOrders.filter(o => o.status === 'Quote').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Orders Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{isHebrew ? 'מספר הזמנה' : 'Order #'}</TableCell>
                <TableCell>{isHebrew ? 'לקוח' : 'Customer'}</TableCell>
                <TableCell>{isHebrew ? 'תאריך' : 'Date'}</TableCell>
                <TableCell>{isHebrew ? 'סטטוס' : 'Status'}</TableCell>
                <TableCell align="right">{isHebrew ? 'סכום' : 'Amount'}</TableCell>
                <TableCell>{isHebrew ? 'תאריך יעד' : 'Due Date'}</TableCell>
                <TableCell align="center" width={80}>{isHebrew ? 'פעולות' : 'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      {isHebrew ? 'לא נמצאו הזמנות' : 'No orders found'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {isHebrew ? 'לחץ על "הזמנה חדשה" כדי ליצור הזמנה ראשונה' : 'Click "New Order" to create your first order'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(order.orderDate, 'dd/MM/yyyy', { 
                          locale: isHebrew ? he : undefined 
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(order.status, isHebrew)}
                        color={getStatusColor(order.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {order.currency === 'ILS' ? '₪' : order.currency} {order.totalAmount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={order.dueDate && order.dueDate < new Date() ? 'error' : 'textPrimary'}>
                        {order.dueDate ? format(order.dueDate, 'dd/MM/yyyy', { 
                          locale: isHebrew ? he : undefined 
                        }) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={isHebrew ? 'פעולות' : 'Actions'}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, order)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 180 }
        }}
      >
        <MenuItem onClick={() => selectedOrder && handleViewOrder(selectedOrder)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {isHebrew ? 'צפייה' : 'View'}
          </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => selectedOrder && handleEditOrder(selectedOrder)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {isHebrew ? 'עריכה' : 'Edit'}
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={() => selectedOrder && handleCopyOrder(selectedOrder)}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {isHebrew ? 'העתק' : 'Copy'}
          </ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => selectedOrder && handlePrintOrder(selectedOrder)}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {isHebrew ? 'הדפס' : 'Print'}
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={() => selectedOrder && handleEmailOrder(selectedOrder)}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {isHebrew ? 'שלח במייל' : 'Email'}
          </ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem 
          onClick={() => selectedOrder && handleDeleteOrder(selectedOrder)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>
            {isHebrew ? 'מחק' : 'Delete'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Order Dialog */}
      <CreateSalesOrderDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
        companyId={companyId}
      />
    </Box>
  );
}
