import { useState, useEffect } from 'react';
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
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useUIStore } from '../stores';
import { purchaseOrdersAPI } from '../services/purchaseOrdersApi';
import { suppliersAPI } from '../services/suppliersApi';
import { itemsAPI } from '../services/api';
import type { PurchaseOrder, PurchaseOrderStatus, Supplier, Item } from '../types/entities';

const Purchases = () => {
  const { language } = useUIStore();
  
  // State management
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'All'>('All');
  
  // Items state for purchase order lines - temporary interface for form
  const [items, setItems] = useState<Item[]>([]);
  const [orderLines, setOrderLines] = useState<Array<{
    id?: number;
    itemId: number;
    itemName?: string;
    itemSku?: string;
    quantity: number;
    unitPrice: number;
    description?: string;
    lineTotal?: number;
  }>>([]);
  const [newLineData, setNewLineData] = useState({
    itemId: 0,
    quantity: 1,
    unitPrice: 0,
    description: ''
  });
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    supplierId: 0,
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    expectedDeliveryDate: '',
    reference: '',
    notes: ''
  });

  // Load data
  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {
        status: statusFilter !== 'All' ? [statusFilter] : undefined,
        searchTerm: searchTerm || undefined
      };
      const data = await purchaseOrdersAPI.getAll(filters);
      setPurchaseOrders(data);
    } catch (err) {
      setError(language === 'he' ? 'שגיאה בטעינת הזמנות הרכש' : 'Error loading purchase orders');
      console.error('Error loading purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await suppliersAPI.getActive();
      setSuppliers(data);
    } catch (err) {
      console.error('Error loading suppliers:', err);
    }
  };

  const loadItems = async () => {
    try {
      const data = await itemsAPI.getAll({ isActive: true });
      setItems(data);
    } catch (err) {
      console.error('Error loading items:', err);
    }
  };

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => {
      const loadData = async () => {
        try {
          setLoading(true);
          setError(null);
          const filters = {
            status: statusFilter !== 'All' ? [statusFilter] : undefined,
            searchTerm: searchTerm || undefined
          };
          const data = await purchaseOrdersAPI.getAll(filters);
          setPurchaseOrders(data);
        } catch (err) {
          setError(language === 'he' ? 'שגיאה בטעינת הזמנות הרכש' : 'Error loading purchase orders');
          console.error('Error loading purchase orders:', err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, searchTerm, language]);

  useEffect(() => {
    loadSuppliers();
    loadItems();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const orderData = {
        ...formData,
        orderDate: new Date(formData.orderDate),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        expectedDeliveryDate: formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate) : undefined,
        lines: orderLines.map((line) => ({
          id: line.id,
          itemId: line.itemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          description: line.description,
        }))
      };

      if (editingOrder) {
        await purchaseOrdersAPI.update(editingOrder.id, orderData);
      } else {
        await purchaseOrdersAPI.create(orderData);
      }
      setOpenDialog(false);
      resetForm();
      loadPurchaseOrders();
    } catch (err) {
      setError(language === 'he' ? 'שגיאה בשמירת הזמנת הרכש' : 'Error saving purchase order');
      console.error('Error saving purchase order:', err);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!orderToDelete) return;
    
    try {
      await purchaseOrdersAPI.delete(orderToDelete.id);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      loadPurchaseOrders();
    } catch (err) {
      setError(language === 'he' ? 'שגיאה במחיקת הזמנת הרכש' : 'Error deleting purchase order');
      console.error('Error deleting purchase order:', err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      supplierId: 0,
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      expectedDeliveryDate: '',
      reference: '',
      notes: ''
    });
    setEditingOrder(null);
    setOrderLines([]);
  };

  // Open edit dialog
  const openEditDialog = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setFormData({
      supplierId: order.supplierId,
      orderDate: new Date(order.orderDate).toISOString().split('T')[0],
      dueDate: order.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : '',
      expectedDeliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
      reference: order.supplierInvoiceNumber || '',
      notes: order.notes || ''
    });
    // Convert PurchaseOrderLine to our form format
    const formattedLines = order.lines?.map(line => ({
      id: line.id,
      itemId: line.itemId,
      itemName: line.itemName,
      itemSku: line.itemSku,
      quantity: line.quantity,
      unitPrice: line.unitCost, // Convert unitCost to unitPrice for form
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
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: PurchaseOrder) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  // Status helpers
  const getStatusColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Confirmed': return 'primary';
      case 'Received': return 'success';
      case 'Invoiced': return 'info';
      case 'Paid': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const text = {
    title: language === 'he' ? 'רכש והזמנות' : 'Purchases & Orders',
    addOrder: language === 'he' ? 'הזמנת רכש חדשה' : 'New Purchase Order',
    editOrder: language === 'he' ? 'ערוך הזמנת רכש' : 'Edit Purchase Order',
    search: language === 'he' ? 'חיפוש הזמנות...' : 'Search orders...',
    statusFilter: language === 'he' ? 'סינון לפי סטטוס' : 'Filter by Status',
    all: language === 'he' ? 'הכל' : 'All',
    orderNumber: language === 'he' ? 'מספר הזמנה' : 'Order Number',
    supplier: language === 'he' ? 'ספק' : 'Supplier',
    orderDate: language === 'he' ? 'תאריך הזמנה' : 'Order Date',
    dueDate: language === 'he' ? 'תאריך יעד' : 'Due Date',
    deliveryDate: language === 'he' ? 'תאריך אספקה' : 'Delivery Date',
    amount: language === 'he' ? 'סכום' : 'Amount',
    status: language === 'he' ? 'סטטוס' : 'Status',
    actions: language === 'he' ? 'פעולות' : 'Actions',
    reference: language === 'he' ? 'אסמכתא' : 'Reference',
    notes: language === 'he' ? 'הערות' : 'Notes',
    edit: language === 'he' ? 'עריכה' : 'Edit',
    delete: language === 'he' ? 'מחיקה' : 'Delete',
    approve: language === 'he' ? 'אישור' : 'Approve',
    cancel: language === 'he' ? 'ביטול' : 'Cancel',
    save: language === 'he' ? 'שמור' : 'Save',
    deleteConfirm: language === 'he' ? 'האם אתה בטוח שברצונך למחוק את הזמנת הרכש?' : 'Are you sure you want to delete this purchase order?',
    noOrders: language === 'he' ? 'לא נמצאו הזמנות רכש' : 'No purchase orders found',
    refresh: language === 'he' ? 'רענן' : 'Refresh',
    // New texts for items
    items: language === 'he' ? 'פריטים' : 'Items',
    addItem: language === 'he' ? 'הוסף פריט' : 'Add Item',
    item: language === 'he' ? 'פריט' : 'Item',
    quantity: language === 'he' ? 'כמות' : 'Quantity',
    unitPrice: language === 'he' ? 'מחיר יחידה' : 'Unit Price',
    total: language === 'he' ? 'סה"כ' : 'Total',
    description: language === 'he' ? 'תיאור' : 'Description',
    selectItem: language === 'he' ? 'בחר פריט' : 'Select Item',
    noItems: language === 'he' ? 'לא נוספו פריטים' : 'No items added'
  };

  // Purchase order line management
  const addOrderLine = () => {
    if (newLineData.itemId === 0) return;
    
    const selectedItem = items.find(item => item.id === newLineData.itemId);
    const newLine = {
      itemId: newLineData.itemId,
      itemName: selectedItem?.name,
      itemSku: selectedItem?.sku,
      quantity: newLineData.quantity,
      unitPrice: newLineData.unitPrice,
      description: newLineData.description,
      lineTotal: newLineData.quantity * newLineData.unitPrice
    };
    
    setOrderLines([...orderLines, newLine]);
    setNewLineData({ itemId: 0, quantity: 1, unitPrice: 0, description: '' });
  };

  const removeOrderLine = (index: number) => {
    const newLines = orderLines.filter((_, i) => i !== index);
    setOrderLines(newLines);
  };

  const updateOrderLine = (index: number, field: string, value: string | number) => {
    const newLines = [...orderLines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Recalculate line total when quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      newLines[index].lineTotal = newLines[index].quantity * newLines[index].unitPrice;
    }
    
    setOrderLines(newLines);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {text.title}
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title={text.refresh}>
            <IconButton onClick={loadPurchaseOrders} disabled={loading}>
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
              onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | 'All')}
            >
              <MenuItem value="All">{text.all}</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Confirmed">Confirmed</MenuItem>
              <MenuItem value="Received">Received</MenuItem>
              <MenuItem value="Invoiced">Invoiced</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
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

      {/* Purchase Orders Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{text.orderNumber}</TableCell>
                <TableCell>{text.supplier}</TableCell>
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
              ) : purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary">
                      {text.noOrders}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.supplierName || '-'}
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
                        label={order.status}
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingOrder ? text.editOrder : text.addOrder}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>{text.supplier}</InputLabel>
              <Select
                value={formData.supplierId}
                label={text.supplier}
                onChange={(e) => setFormData({ ...formData, supplierId: Number(e.target.value) })}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label={text.orderDate}
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label={text.dueDate}
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <TextField
              fullWidth
              label={text.deliveryDate}
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label={text.reference}
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />

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
              
              {orderLines.length > 0 ? (
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
                        <TableRow>
                          <TableCell colSpan={4} align="right">
                            <Typography variant="h6">
                              {text.total}:
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="h6" fontWeight="bold">
                              {orderLines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    {text.noItems}
                  </Typography>
                </Box>
              )}

              {/* Add New Line */}
              <Card sx={{ p: 2 }}>
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
                            unitPrice: selectedItem?.costPrice || 0,
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
                                SKU: {item.sku} | {item.costPrice.toFixed(2)}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label={text.quantity}
                      type="number"
                      value={newLineData.quantity}
                      onChange={(e) => setNewLineData({ ...newLineData, quantity: Number(e.target.value) })}
                      inputProps={{ min: 1, step: 1 }}
                      sx={{ minWidth: 120 }}
                    />

                    <TextField
                      label={text.unitPrice}
                      type="number"
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
          <Button variant="contained" onClick={handleSubmit}>
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

export default Purchases;
