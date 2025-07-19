// Orders List - רשימת הזמנות
import { useState, useEffect, useCallback } from 'react';
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
  Card,
  CardContent,
  Toolbar,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  Alert,
  Skeleton,
  Tooltip,
  Stack,
  Grid
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
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import type { SalesOrder, SalesOrderStatus, Customer } from '../../types/entities';
import salesOrdersApi from '../../services/salesOrdersApi';
import { customersApi } from '../../services/customersApi';
import CreateSalesOrderDialog from './CreateSalesOrderDialog';
import { textFieldStyles, paperStyles, buttonStyles, tableStyles, cardStyles } from '../../styles/formStyles';

interface SalesOrdersListProps {
  companyId?: number;
  shouldOpenCreateDialog?: boolean;
  initialOrderStatus?: SalesOrderStatus | null;
  onDialogClose?: () => void;
}

// Status colors mapping
const getStatusColor = (status: SalesOrderStatus): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  switch (status) {
    case 'Draft': return 'default';
    case 'Confirmed': return 'primary';
    case 'PartiallyShipped': return 'warning';
    case 'Shipped': return 'info';
    case 'Completed': return 'success';
    case 'Cancelled': return 'error';
    default: return 'default';
  }
};

// Status labels
const getStatusLabel = (status: SalesOrderStatus, isHebrew: boolean): string => {
  const labels = {
    Draft: isHebrew ? 'טיוטה' : 'Draft',
    Confirmed: isHebrew ? 'מאושרת' : 'Confirmed',
    PartiallyShipped: isHebrew ? 'נשלחה חלקית' : 'Partially Shipped',
    Shipped: isHebrew ? 'נשלחה' : 'Shipped',
    Completed: isHebrew ? 'הושלמה' : 'Completed',
    Cancelled: isHebrew ? 'בוטלה' : 'Cancelled'
  };
  return labels[status] || status;
};

export default function SalesOrdersList({ 
  companyId = 1, 
  shouldOpenCreateDialog = false,
  initialOrderStatus = null,
  onDialogClose
}: SalesOrdersListProps): React.ReactElement {
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
  const loadOrders = useCallback(async () => {
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
  }, [companyId, statusFilter, customerFilter, isHebrew]);

  const loadCustomers = useCallback(async () => {
    try {
      const customersList = await customersApi.getCustomers();
      setCustomers(customersList);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, [loadOrders, loadCustomers]);

  // Handle external dialog open requests
  useEffect(() => {
    if (shouldOpenCreateDialog) {
      setCreateDialogOpen(true);
    }
  }, [shouldOpenCreateDialog]);

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

  const handleCreateSuccess = (newOrder: SalesOrder) => {
    setOrders([newOrder, ...orders]);
    setCreateDialogOpen(false);
    if (onDialogClose) {
      onDialogClose();
    }
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    if (onDialogClose) {
      onDialogClose();
    }
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

  // Calculate summary stats - updated for sales order statuses only
  const totalOrders = filteredOrders.length;
  const activeOrders = filteredOrders.filter(o => o.status === 'Confirmed' || o.status === 'Shipped' || o.status === 'PartiallyShipped').length;
  const totalValue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const draftOrders = filteredOrders.filter(o => o.status === 'Draft').length;

  return (
    <Box sx={{ 
      p: { xs: 3, md: 4 }, 
      backgroundColor: 'background.default',
      minHeight: '100vh'
    }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3" sx={{ 
          display: "flex", alignItems: "center", gap: 2,
          fontWeight: 600, color: 'primary.main'
        }}>
          <AssessmentIcon sx={{ fontSize: 40 }} />
          {isHebrew ? 'הזמנות' : 'Orders'}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={buttonStyles.primary}
          >
            {isHebrew ? 'הזמנה חדשה' : 'New Order'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters Paper */}
      <Paper sx={{ ...paperStyles, mb: 3 }}>
        {/* Filters */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            label={isHebrew ? 'חיפוש' : 'Search'}
            placeholder={isHebrew ? 'חיפוש לפי מספר הזמנה, לקוח או הערות...' : 'Search by order number, customer or notes...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={textFieldStyles}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>{isHebrew ? 'סטטוס' : 'Status'}</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SalesOrderStatus | '')}
              label={isHebrew ? 'סטטוס' : 'Status'}
              sx={textFieldStyles}
            >
              <MenuItem value="">
                {isHebrew ? 'כל הסטטוסים' : 'All Statuses'}
              </MenuItem>
              <MenuItem value="Draft">{getStatusLabel('Draft', isHebrew)}</MenuItem>
              <MenuItem value="Confirmed">{getStatusLabel('Confirmed', isHebrew)}</MenuItem>
              <MenuItem value="PartiallyShipped">{getStatusLabel('PartiallyShipped', isHebrew)}</MenuItem>
              <MenuItem value="Shipped">{getStatusLabel('Shipped', isHebrew)}</MenuItem>
              <MenuItem value="Completed">{getStatusLabel('Completed', isHebrew)}</MenuItem>
              <MenuItem value="Cancelled">{getStatusLabel('Cancelled', isHebrew)}</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>{isHebrew ? 'לקוח' : 'Customer'}</InputLabel>
            <Select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value as number | '')}
              label={isHebrew ? 'לקוח' : 'Customer'}
              sx={textFieldStyles}
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
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={loadOrders}
            sx={buttonStyles.secondary}
          >
            {isHebrew ? 'סנן' : 'Filter'}
          </Button>
        </Stack>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 3 }}>
        <Grid size={{ xs: 4, sm: 4, md: 3 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'סה״כ הזמנות' : 'Total Orders'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {totalOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, sm: 4, md: 3 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'הזמנות פעילות' : 'Active Orders'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {activeOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, sm: 4, md: 3 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'ערך כולל' : 'Total Value'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'success.main' }}>
                ₪{totalValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, sm: 4, md: 3 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'הזמנות טיוטה' : 'Draft Orders'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {draftOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Orders Table */}
      <Paper sx={paperStyles}>
        <TableContainer>
          <Table sx={tableStyles}>
            <TableHead>
              <TableRow>
                <TableCell>{isHebrew ? 'מספר הזמנה' : 'Order #'}</TableCell>
                <TableCell>{isHebrew ? 'לקוח' : 'Customer'}</TableCell>
                <TableCell>{isHebrew ? 'תאריך' : 'Date'}</TableCell>
                <TableCell>{isHebrew ? 'סטטוס' : 'Status'}</TableCell>
                <TableCell align="right">{isHebrew ? 'סכום' : 'Amount'}</TableCell>
                <TableCell>{isHebrew ? 'תאריך נדרש' : 'Required Date'}</TableCell>
                <TableCell align="center" width={80}>{isHebrew ? 'פעולות' : 'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Box sx={{ 
                      display: "flex", justifyContent: "center", alignItems: "center", 
                      minHeight: 200, flexDirection: "column", gap: 2 
                    }}>
                      <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                      <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 500 }}>
                        {isHebrew ? 'לא נמצאו הזמנות' : 'No orders found'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 400, textAlign: 'center' }}>
                        {isHebrew ? 'לחץ על "הזמנה חדשה" כדי ליצור הזמנה ראשונה או נסה לשנות את המסננים שלך' : 'Click "New Order" to create your first order or try adjusting your filters'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {order.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
                        sx={{ fontSize: '0.875rem', fontWeight: 500, borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {order.currency === 'ILS' ? '₪' : order.currency} {order.totalAmount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: order.requiredDate && order.requiredDate < new Date() ? 'error.main' : 'text.secondary',
                          fontWeight: order.requiredDate && order.requiredDate < new Date() ? 600 : 400
                        }}
                      >
                        {order.requiredDate ? format(order.requiredDate, 'dd/MM/yyyy', { 
                          locale: isHebrew ? he : undefined 
                        }) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={isHebrew ? 'פעולות' : 'Actions'}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, order)}
                          sx={{
                            '&:hover': {
                              backgroundColor: (theme) => theme.palette.mode === 'light'
                                ? 'rgba(25, 118, 210, 0.08)' : 'rgba(59, 130, 246, 0.12)',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
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
          elevation: 8,
          sx: { 
            minWidth: 200,
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: (theme) => theme.palette.mode === 'light'
              ? '0 8px 32px rgba(0,0,0,0.12)' : '0 8px 32px rgba(0,0,0,0.4)',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => selectedOrder && handleViewOrder(selectedOrder)}
          sx={{
            '&:hover': {
              backgroundColor: (theme) => theme.palette.mode === 'light'
                ? 'rgba(25, 118, 210, 0.08)' : 'rgba(59, 130, 246, 0.12)',
            }
          }}
        >
          <ListItemIcon>
            <ViewIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}>
            {isHebrew ? 'צפייה' : 'View'}
          </ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => selectedOrder && handleEditOrder(selectedOrder)}
          sx={{
            '&:hover': {
              backgroundColor: (theme) => theme.palette.mode === 'light'
                ? 'rgba(25, 118, 210, 0.08)' : 'rgba(59, 130, 246, 0.12)',
            }
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}>
            {isHebrew ? 'עריכה' : 'Edit'}
          </ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={() => selectedOrder && handleCopyOrder(selectedOrder)}
          sx={{
            '&:hover': {
              backgroundColor: (theme) => theme.palette.mode === 'light'
                ? 'rgba(25, 118, 210, 0.08)' : 'rgba(59, 130, 246, 0.12)',
            }
          }}
        >
          <ListItemIcon>
            <CopyIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}>
            {isHebrew ? 'העתק' : 'Copy'}
          </ListItemText>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem 
          onClick={() => selectedOrder && handlePrintOrder(selectedOrder)}
          sx={{
            '&:hover': {
              backgroundColor: (theme) => theme.palette.mode === 'light'
                ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
            }
          }}
        >
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}>
            {isHebrew ? 'הדפס' : 'Print'}
          </ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={() => selectedOrder && handleEmailOrder(selectedOrder)}
          sx={{
            '&:hover': {
              backgroundColor: (theme) => theme.palette.mode === 'light'
                ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
            }
          }}
        >
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}>
            {isHebrew ? 'שלח במייל' : 'Email'}
          </ListItemText>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem 
          onClick={() => selectedOrder && handleDeleteOrder(selectedOrder)}
          sx={{ 
            color: 'error.main',
            '&:hover': {
              backgroundColor: (theme) => theme.palette.mode === 'light'
                ? 'rgba(211, 47, 47, 0.08)' : 'rgba(244, 67, 54, 0.12)',
            }
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}>
            {isHebrew ? 'מחק' : 'Delete'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Order Dialog */}
      <CreateSalesOrderDialog
        open={createDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleCreateSuccess}
        companyId={companyId}
        initialStatus={initialOrderStatus}
      />
    </Box>
  );
}
