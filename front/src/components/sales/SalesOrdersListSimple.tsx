// Orders List - רשימת הזמנות
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  Alert,
  Skeleton,
  Tooltip,
  Stack,
  Grid,
  Snackbar
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
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import type { SalesOrder, SalesOrderStatus, Customer } from '../../types/entities';
import type { PaginatedResponse } from '../../types/pagination';
import salesOrdersApi from '../../services/salesOrdersApi';
import { customersApi } from '../../services/customersApi';
import CreateSalesOrderDialog from './CreateSalesOrderDialog';
import { textFieldStyles, paperStyles, buttonStyles, cardStyles } from '../../styles/formStyles';
import { enhancedDataGridStyles } from '../../styles/enhancedStyles';
import { useUIStore } from '../../stores';

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
  const { language } = useUIStore();
  const isHebrew = language === 'he';

  // Data state
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    pageSize: 25,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // UI state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | ''>('');
  const [customerFilter, setCustomerFilter] = useState<number | ''>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Load data
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const paginatedResponse = await salesOrdersApi.getSalesOrders({
        companyId,
        status: statusFilter || undefined,
        customerId: customerFilter || undefined,
        searchTerm: searchTerm || undefined,
        page: paginationInfo.page,
        pageSize: paginationInfo.pageSize
      });
      
      setOrders(paginatedResponse.data);
      setTotalCount(paginatedResponse.totalCount);
      setPaginationInfo(prev => ({
        ...prev,
        totalPages: paginatedResponse.totalPages,
        hasNextPage: paginatedResponse.hasNextPage,
        hasPreviousPage: paginatedResponse.hasPreviousPage
      }));
    } catch (err) {
      console.error('Error loading sales orders:', err);
      setError(isHebrew ? 'שגיאה בטעינת רשימת ההזמנות' : 'Error loading sales orders');
    } finally {
      setLoading(false);
    }
  }, [companyId, statusFilter, customerFilter, searchTerm, paginationInfo.page, paginationInfo.pageSize, isHebrew]);

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

  // Reset pagination when filters change
  useEffect(() => {
    setPaginationInfo(prev => ({
      ...prev,
      page: 1
    }));
  }, [statusFilter, customerFilter, searchTerm]);

  // Handle external dialog open requests
  useEffect(() => {
    if (shouldOpenCreateDialog) {
      setCreateDialogOpen(true);
    }
  }, [shouldOpenCreateDialog]);

  // Snackbar functions
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Pagination functions
  const handlePaginationChange = (newPaginationModel: { page: number; pageSize: number }) => {
    setPaginationInfo(prev => ({
      ...prev,
      page: newPaginationModel.page + 1, // DataGrid uses 0-based page, API uses 1-based
      pageSize: newPaginationModel.pageSize
    }));
  };

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
        showSnackbar(isHebrew ? 'ההזמנה נמחקה בהצלחה' : 'Order deleted successfully');
      } catch (err) {
        console.error('Error deleting order:', err);
        setError(isHebrew ? 'שגיאה במחיקת ההזמנה' : 'Error deleting order');
        showSnackbar(isHebrew ? 'שגיאה במחיקת ההזמנה' : 'Error deleting order', 'error');
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

  // DataGrid columns definition
  const columns: GridColDef[] = [
    {
      field: 'orderNumber',
      headerName: isHebrew ? 'מספר הזמנה' : 'Order #',
      width: 150,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isHebrew ? 'מספר הזמנה' : 'Order #'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'customerName',
      headerName: isHebrew ? 'לקוח' : 'Customer',
      flex: 1,
      minWidth: 200,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isHebrew ? 'לקוח' : 'Customer'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'orderDate',
      headerName: isHebrew ? 'תאריך' : 'Date',
      width: 130,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isHebrew ? 'תאריך' : 'Date'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '1rem' }}>
          {format(new Date(params.value), 'dd/MM/yyyy', { 
            locale: isHebrew ? he : undefined 
          })}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: isHebrew ? 'סטטוס' : 'Status',
      width: 150,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isHebrew ? 'סטטוס' : 'Status'}
        </Typography>
      ),
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value as SalesOrderStatus, isHebrew)}
          color={getStatusColor(params.value as SalesOrderStatus)}
          size="small"
          sx={{ fontSize: '0.875rem', fontWeight: 500, borderRadius: 2 }}
        />
      ),
    },
    {
      field: 'totalAmount',
      headerName: isHebrew ? 'סכום' : 'Amount',
      width: 130,
      align: 'right',
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isHebrew ? 'סכום' : 'Amount'}
        </Typography>
      ),
      renderCell: (params) => {
        const order = params.row as SalesOrder;
        return (
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
            {order.currency === 'ILS' ? '₪' : order.currency} {params.value.toLocaleString()}
          </Typography>
        );
      },
    },
    {
      field: 'requiredDate',
      headerName: isHebrew ? 'תאריך נדרש' : 'Required Date',
      width: 140,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isHebrew ? 'תאריך נדרש' : 'Required Date'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            color: params.value && new Date(params.value) < new Date() ? 'error.main' : 'text.secondary',
            fontWeight: params.value && new Date(params.value) < new Date() ? 600 : 400,
            fontSize: '1rem'
          }}
        >
          {params.value ? format(new Date(params.value), 'dd/MM/yyyy', { 
            locale: isHebrew ? he : undefined 
          }) : '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: isHebrew ? 'פעולות' : 'Actions',
      width: 80,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isHebrew ? 'פעולות' : 'Actions'}
        </Typography>
      ),
      getActions: (params) => [
        <GridActionsCellItem
          key="menu"
          icon={
            <Tooltip title={isHebrew ? 'פעולות' : 'Actions'}>
              <MoreVertIcon />
            </Tooltip>
          }
          label={isHebrew ? 'פעולות' : 'Actions'}
          onClick={(event) => handleMenuOpen(event as React.MouseEvent<HTMLElement>, params.row as SalesOrder)}
        />,
      ],
    },
  ];

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

  // Calculate summary stats - Note: These are based on current page, not all orders  
  const activeOrdersOnPage = orders.filter(o => o.status === 'Confirmed' || o.status === 'Shipped' || o.status === 'PartiallyShipped').length;
  const totalValueOnPage = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const draftOrdersOnPage = orders.filter(o => o.status === 'Draft').length;

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
                {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, sm: 4, md: 3 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'הזמנות פעילות (בעמוד)' : 'Active Orders (on page)'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {activeOrdersOnPage}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, sm: 4, md: 3 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'ערך (בעמוד)' : 'Value (on page)'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'success.main' }}>
                ₪{totalValueOnPage.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, sm: 4, md: 3 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'הזמנות טיוטה (בעמוד)' : 'Draft Orders (on page)'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {draftOrdersOnPage}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Orders DataGrid */}
      <Paper sx={paperStyles}>
        {/* Search Bar */}
        <Box sx={{ p: 3, pb: 0 }}>
          <TextField
            fullWidth
            variant="outlined"
            label={isHebrew ? 'חיפוש' : 'Search'}
            placeholder={isHebrew ? 'חיפוש לפי מספר הזמנה, לקוח או הערות...' : 'Search by order number, customer or notes...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              ...textFieldStyles,
              '& .MuiInputLabel-root': {
                fontSize: '1rem'
              }
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        {/* Data Grid */}
        <Box sx={enhancedDataGridStyles}>
          <DataGrid
            rows={orders}
            columns={columns}
            loading={loading}
            pagination
            paginationMode="server"
            rowCount={totalCount}
            paginationModel={{
              page: paginationInfo.page - 1, // DataGrid uses 0-based page, convert from 1-based
              pageSize: paginationInfo.pageSize
            }}
            onPaginationModelChange={handlePaginationChange}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            localeText={
              isHebrew
                ? {
                    noRowsLabel: loading ? 'טוען...' : 'אין הזמנות',
                    paginationRowsPerPage: 'שורות בעמוד:',
                  }
                : {
                    noRowsLabel: loading ? 'Loading...' : 'No orders found',
                  }
            }
          />
        </Box>
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

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
