import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Menu,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Autocomplete,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useUIStore } from '../stores';
import { salesAPI } from '../services/api';
import { customersApi } from '../services/customersApi';
import { itemsAPI } from '../services/api';
import type { SalesOrder, SalesOrderStatus, Customer, Item, CreateSalesOrderForm } from '../types/entities';
import { useLocation, useNavigate } from 'react-router-dom';

const Sales = () => {
  const { language } = useUIStore();
  const location = useLocation();
  // const navigate = useNavigate(); // unused
  
  // States
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | 'All'>('All');
  
  // Pagination states
  // const [page, setPage] = useState(0); // unused
  // const [rowsPerPage, setRowsPerPage] = useState(10); // unused

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<SalesOrder | null>(null);
  // const [createDialogOpen, setCreateDialogOpen] = useState(false); // unused
  // const [createDocumentType, setCreateDocumentType] = useState(...); // unused
  // const [speedDialOpen, setSpeedDialOpen] = useState(false); // unused
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    customerId: 0,
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    deliveryDate: '',
    status: 'Quote' as SalesOrderStatus,
    notes: ''
  });

  // Line items state
  interface OrderLine {
    id?: number;
    itemId: number;
    itemName?: string;
    itemSku?: string;
    quantity: number;
    unitPrice: number;
    description: string;
    lineTotal?: number;
  }

  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [newLineData, setNewLineData] = useState({
    itemId: 0,
    quantity: 1,
    unitPrice: 0,
    description: ''
  });

  // Check URL parameters for action and type
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const action = urlParams.get('action');
    const type = urlParams.get('type');
    
    if (action === 'create' && type) {
      const statusMap: Record<string, SalesOrderStatus> = {
        'Quote': 'Quote',
        'Confirmed': 'Confirmed',
        'Shipped': 'Shipped'
      };
      
      if (statusMap[type]) {
        setFormData(prev => ({ ...prev, status: statusMap[type] }));
        openAddDialog();
      }
    }
  }, [location.search]);

  // Load data
  const loadSalesOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {
        status: statusFilter !== 'All' ? statusFilter : undefined,
        searchTerm: searchTerm || undefined
      };
      const data = await salesAPI.getOrders(filters);
      setSalesOrders(data);
    } catch (err) {
      setError(language === 'he' ? 'שגיאה בטעינת הזמנות המכירות' : 'Error loading sales orders');
      console.error('Error loading sales orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await customersApi.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadItems = async () => {
    try {
      const response = await itemsAPI.getAll({ isActive: true });
      // CRITICAL: Extract .data property from PaginatedResponse
      setItems(response.data || []);
    } catch (err) {
      console.error('Error loading items:', err);
    }
  };

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSalesOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, searchTerm, language]);

  useEffect(() => {
    loadCustomers();
    loadItems();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const orderData: CreateSalesOrderForm = {
        customerId: formData.customerId,
        orderDate: new Date(formData.orderDate),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
        status: formData.status,
        notes: formData.notes,
        lines: orderLines.map((line) => ({
          itemId: line.itemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          description: line.description,
        }))
      };

      if (editingOrder) {
        await salesAPI.updateOrder(editingOrder.id, orderData);
      } else {
        await salesAPI.createOrder(orderData);
      }
      setOpenDialog(false);
      resetForm();
      loadSalesOrders();
    } catch (err) {
      setError(language === 'he' ? 'שגיאה בשמירת הזמנת המכירות' : 'Error saving sales order');
      console.error('Error saving sales order:', err);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!orderToDelete) return;
    
    try {
      await salesAPI.deleteOrder(orderToDelete.id);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      loadSalesOrders();
    } catch (err) {
      setError(language === 'he' ? 'שגיאה במחיקת הזמנת המכירות' : 'Error deleting sales order');
      console.error('Error deleting sales order:', err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      customerId: 0,
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      deliveryDate: '',
      status: 'Quote',
      notes: ''
    });
    setEditingOrder(null);
    setOrderLines([]);
    
    // Clear URL parameters
    const url = new URL(window.location.href);
    url.searchParams.delete('action');
    url.searchParams.delete('type');
    window.history.replaceState({}, '', url.toString());
  };

  // Open edit dialog
  const openEditDialog = (order: SalesOrder) => {
    setEditingOrder(order);
    setFormData({
      customerId: order.customerId,
      orderDate: new Date(order.orderDate).toISOString().split('T')[0],
      dueDate: order.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : '',
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
      status: order.status,
      notes: order.notes || ''
    });
    // Convert SalesOrderLine to our form format
    const formattedLines = order.lines?.map(line => ({
      id: line.id,
      itemId: line.itemId,
      itemName: line.itemName,
      itemSku: line.itemSku,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      description: line.description,
      lineTotal: line.lineTotal
    })) || [];
    setOrderLines(formattedLines);
    setOpenDialog(true);
    setAnchorEl(null);
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: SalesOrder) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  // Line items handlers
  const addOrderLine = () => {
    if (newLineData.itemId === 0) return;
    
    const selectedItem = items.find(item => item.id === newLineData.itemId);
    const newLine: OrderLine = {
      itemId: newLineData.itemId,
      itemName: selectedItem?.name,
      itemSku: selectedItem?.sku,
      quantity: newLineData.quantity,
      unitPrice: newLineData.unitPrice,
      description: newLineData.description || selectedItem?.description || '',
      lineTotal: newLineData.quantity * newLineData.unitPrice
    };
    
    setOrderLines([...orderLines, newLine]);
    setNewLineData({
      itemId: 0,
      quantity: 1,
      unitPrice: 0,
      description: ''
    });
  };

  const updateOrderLine = (index: number, field: keyof OrderLine, value: any) => {
    const newLines = [...orderLines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Recalculate line total if quantity or price changed
    if (field === 'quantity' || field === 'unitPrice') {
      newLines[index].lineTotal = newLines[index].quantity * newLines[index].unitPrice;
    }
    
    setOrderLines(newLines);
  };

  const removeOrderLine = (index: number) => {
    const newLines = orderLines.filter((_, i) => i !== index);
    setOrderLines(newLines);
  };

  // Status helpers
  const getStatusColor = (status: SalesOrderStatus) => {
    switch (status) {
      case 'Quote': return 'default';
      case 'Confirmed': return 'primary';
      case 'Shipped': return 'info';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: SalesOrderStatus) => {
    if (language === 'he') {
      switch (status) {
        case 'Quote': return 'הצעת מחיר';
        case 'Confirmed': return 'הזמנה מאושרת';
        case 'Shipped': return 'נשלח';
        case 'Completed': return 'הושלם';
        case 'Cancelled': return 'מבוטל';
        default: return status;
      }
    }
    return status;
  };

  const text = {
    title: language === 'he' ? 'מכירות והזמנות' : 'Sales & Orders',
    addOrder: language === 'he' ? 'הזמנת מכירות חדשה' : 'New Sales Order',
    editOrder: language === 'he' ? 'עריכת הזמנה' : 'Edit Order',
    orderNumber: language === 'he' ? 'מספר הזמנה' : 'Order Number',
    customer: language === 'he' ? 'לקוח' : 'Customer',
    orderDate: language === 'he' ? 'תאריך הזמנה' : 'Order Date',
    dueDate: language === 'he' ? 'תאריך יעד' : 'Due Date',
    deliveryDate: language === 'he' ? 'תאריך משלוח' : 'Delivery Date',
    amount: language === 'he' ? 'סכום' : 'Amount',
    status: language === 'he' ? 'סטטוס' : 'Status',
    actions: language === 'he' ? 'פעולות' : 'Actions',
    edit: language === 'he' ? 'עריכה' : 'Edit',
    delete: language === 'he' ? 'מחיקה' : 'Delete',
    cancel: language === 'he' ? 'ביטול' : 'Cancel',
    save: language === 'he' ? 'שמירה' : 'Save',
    search: language === 'he' ? 'חיפוש...' : 'Search...',
    statusFilter: language === 'he' ? 'סינון לפי סטטוס' : 'Filter by Status',
    all: language === 'he' ? 'הכל' : 'All',
    refresh: language === 'he' ? 'רענון' : 'Refresh',
    selectCustomer: language === 'he' ? 'בחר לקוח' : 'Select Customer',
    notes: language === 'he' ? 'הערות' : 'Notes',
    items: language === 'he' ? 'פריטים' : 'Items',
    item: language === 'he' ? 'פריט' : 'Item',
    description: language === 'he' ? 'תיאור' : 'Description',
    quantity: language === 'he' ? 'כמות' : 'Quantity',
    unitPrice: language === 'he' ? 'מחיר יחידה' : 'Unit Price',
    total: language === 'he' ? 'סה"כ' : 'Total',
    addItem: language === 'he' ? 'הוסף פריט' : 'Add Item',
    selectItem: language === 'he' ? 'בחר פריט' : 'Select Item',
    noOrders: language === 'he' ? 'אין הזמנות' : 'No orders found',
    deleteConfirm: language === 'he' ? 'האם אתה בטוח שברצונך למחוק הזמנה זו?' : 'Are you sure you want to delete this order?',
    print: language === 'he' ? 'הדפסה' : 'Print',
    email: language === 'he' ? 'שלח במייל' : 'Send Email',
    generateReceipt: language === 'he' ? 'צור קבלה' : 'Generate Receipt',
    ship: language === 'he' ? 'שלח' : 'Ship',
    createQuote: language === 'he' ? 'הצעת מחיר' : 'Quote',
    createOrder: language === 'he' ? 'הזמנה' : 'Order',
    createDelivery: language === 'he' ? 'תעודת משלוח' : 'Delivery'
  };

  // FAB handlers
  const handleCreateDocument = (type: 'Quote' | 'Confirmed' | 'Shipped') => {
    setCreateDocumentType(type);
    setCreateDialogOpen(true);
    setSpeedDialOpen(false);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    loadSalesOrders(); // Refresh the orders list
  };

  // Speed Dial actions
  const speedDialActions = [
    {
      icon: <ReceiptIcon />,
      name: text.createQuote,
      onClick: () => handleCreateDocument('Quote'),
    },
    {
      icon: <AssignmentIcon />,
      name: text.createOrder,
      onClick: () => handleCreateDocument('Confirmed'),
    },
    {
      icon: <ShippingIcon />,
      name: text.createDelivery,
      onClick: () => handleCreateDocument('Shipped'),
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {text.title}
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title={text.refresh}>
            <IconButton onClick={loadSalesOrders} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
          >
            {text.addOrder}
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder={text.search}
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
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{text.statusFilter}</InputLabel>
            <Select
              value={statusFilter}
              label={text.statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SalesOrderStatus | 'All')}
            >
              <MenuItem value="All">{text.all}</MenuItem>
              <MenuItem value="Quote">הצעת מחיר</MenuItem>
              <MenuItem value="Confirmed">הזמנה מאושרת</MenuItem>
              <MenuItem value="Shipped">נשלח</MenuItem>
              <MenuItem value="Completed">הושלם</MenuItem>
              <MenuItem value="Cancelled">מבוטל</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Sales Orders Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{text.orderNumber}</TableCell>
                <TableCell>{text.customer}</TableCell>
                <TableCell>{text.orderDate}</TableCell>
                <TableCell>{text.amount}</TableCell>
                <TableCell>{text.status}</TableCell>
                <TableCell>{text.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : salesOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary">
                      {text.noOrders}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                salesOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.customerName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.totalAmount.toLocaleString()} {order.currency}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(order.status)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, order)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedOrder && openEditDialog(selectedOrder)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {text.edit}
        </MenuItem>
        <MenuItem onClick={() => console.log('Print', selectedOrder)}>
          <PrintIcon fontSize="small" sx={{ mr: 1 }} />
          {text.print}
        </MenuItem>
        <MenuItem onClick={() => console.log('Email', selectedOrder)}>
          <EmailIcon fontSize="small" sx={{ mr: 1 }} />
          {text.email}
        </MenuItem>
        {selectedOrder?.status === 'Confirmed' && (
          <MenuItem onClick={() => console.log('Ship', selectedOrder)}>
            <ShippingIcon fontSize="small" sx={{ mr: 1 }} />
            {text.ship}
          </MenuItem>
        )}
        {selectedOrder?.status === 'Shipped' && (
          <MenuItem onClick={() => console.log('Generate Receipt', selectedOrder)}>
            <ReceiptIcon fontSize="small" sx={{ mr: 1 }} />
            {text.generateReceipt}
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            setOrderToDelete(selectedOrder);
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {text.delete}
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingOrder ? text.editOrder : text.addOrder}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Customer Selection */}
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => option.name}
              value={customers.find(c => c.id === formData.customerId) || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, customerId: newValue?.id || 0 });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={text.selectCustomer}
                  required
                />
              )}
            />

            {/* Dates */}
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
              <Grid size={{ xs: 4, sm: 8, md: 4 }}>
                <TextField
                  fullWidth
                  label={text.orderDate}
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 8, md: 4 }}>
                <TextField
                  fullWidth
                  label={text.dueDate}
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 8, md: 4 }}>
                <TextField
                  fullWidth
                  label={text.deliveryDate}
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {/* Status */}
            <FormControl fullWidth>
              <InputLabel>{text.status}</InputLabel>
              <Select
                value={formData.status}
                label={text.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as SalesOrderStatus })}
              >
                <MenuItem value="Quote">הצעת מחיר</MenuItem>
                <MenuItem value="Confirmed">הזמנה מאושרת</MenuItem>
                <MenuItem value="Shipped">נשלח</MenuItem>
                <MenuItem value="Completed">הושלם</MenuItem>
                <MenuItem value="Cancelled">מבוטל</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={text.notes}
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />

            {/* Order Lines Table */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {text.items}
              </Typography>
              
              {orderLines.length > 0 && (
                <Card sx={{ mb: 2 }}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>{text.item}</TableCell>
                          <TableCell>{text.description}</TableCell>
                          <TableCell align="center">{text.quantity}</TableCell>
                          <TableCell align="center">{text.unitPrice}</TableCell>
                          <TableCell align="center">{text.total}</TableCell>
                          <TableCell align="center">{text.actions}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orderLines.map((line, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {line.itemName || `ID: ${line.itemId}`}
                                </Typography>
                                {line.itemSku && (
                                  <Typography variant="caption" color="textSecondary">
                                    SKU: {line.itemSku}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                value={line.description || ''}
                                onChange={(e) => updateOrderLine(index, 'description', e.target.value)}
                                placeholder={text.description}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={line.quantity}
                                onChange={(e) => updateOrderLine(index, 'quantity', Number(e.target.value))}
                                inputProps={{ min: 0, step: 1 }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={line.unitPrice}
                                onChange={(e) => updateOrderLine(index, 'unitPrice', Number(e.target.value))}
                                inputProps={{ min: 0, step: 0.01 }}
                                sx={{ width: 100 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="medium">
                                {(line.quantity * line.unitPrice).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                onClick={() => removeOrderLine(index)}
                                size="small"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )}

              {/* Add New Item */}
              <Card sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {text.addItem}
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>{text.selectItem}</InputLabel>
                      <Select
                        value={newLineData.itemId}
                        label={text.selectItem}
                        onChange={(e) => {
                          const itemId = Number(e.target.value);
                          const selectedItem = items.find(item => item.id === itemId);
                          setNewLineData({ 
                            ...newLineData, 
                            itemId,
                            unitPrice: selectedItem?.sellPrice || 0,
                            description: selectedItem?.description || ''
                          });
                        }}
                      >
                        <MenuItem value={0}>
                          <em>{text.selectItem}</em>
                        </MenuItem>
                        {items.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            <Box>
                              <Typography variant="body2">{item.name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {item.sku} - ₪{item.sellPrice}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      type="number"
                      label={text.quantity}
                      value={newLineData.quantity}
                      onChange={(e) => setNewLineData({ ...newLineData, quantity: Number(e.target.value) })}
                      inputProps={{ min: 1, step: 1 }}
                      sx={{ minWidth: 120 }}
                    />

                    <TextField
                      type="number"
                      label={text.unitPrice}
                      value={newLineData.unitPrice}
                      onChange={(e) => setNewLineData({ ...newLineData, unitPrice: Number(e.target.value) })}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ minWidth: 120 }}
                    />
                  </Stack>

                  <TextField
                    fullWidth
                    label={text.description}
                    value={newLineData.description}
                    onChange={(e) => setNewLineData({ ...newLineData, description: e.target.value })}
                    placeholder={text.description}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={addOrderLine}
                      disabled={newLineData.itemId === 0}
                      startIcon={<AddIcon />}
                    >
                      {text.addItem}
                    </Button>
                  </Box>
                </Stack>
              </Card>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            {text.cancel}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={formData.customerId === 0 || orderLines.length === 0}
          >
            {text.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          {text.delete}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {text.deleteConfirm}
          </Typography>
          {orderToDelete && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              {orderToDelete.orderNumber}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {text.cancel}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
          >
            {text.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sales;
