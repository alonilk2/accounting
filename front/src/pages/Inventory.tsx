import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Chip,
  Alert,
  Snackbar,
  Paper,
  Card,
  CardContent,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Grid,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
  FileCopy as CopyIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useUIStore } from '../stores';
import { useItems } from '../hooks/useItems';
import type { Item } from '../types/entities';
import ItemFormDialog from '../components/items/ItemFormDialog';
import StockAdjustmentDialog from '../components/items/StockAdjustmentDialog';
import { textFieldStyles, paperStyles, buttonStyles, cardStyles } from '../styles/formStyles';
import { enhancedDataGridStyles } from '../styles/enhancedStyles';

const Inventory = () => {
  const { language } = useUIStore();
  const isHebrew = language === 'he';
  
  const { 
    items, 
    loading, 
    error, 
    createItem, 
    updateItem, 
    deleteItem, 
    adjustStock,
    refreshItems 
  } = useItems();

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Snackbar functions
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Pagination functions
  const handlePaginationChange = (newPaginationModel: { page: number; pageSize: number }) => {
    setPaginationModel(newPaginationModel);
  };

  // Menu functions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: Item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleViewItem = (item: Item) => {
    // TODO: Implement view item details
    console.log('View item:', item);
    handleMenuClose();
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDeleteItem = async (item: Item) => {
    if (window.confirm(isHebrew ? `האם אתה בטוח שברצונך למחוק את המוצר "${item.name}"?` : `Are you sure you want to delete item "${item.name}"?`)) {
      try {
        await deleteItem(item.id);
        showSnackbar(isHebrew ? 'המוצר נמחק בהצלחה' : 'Item deleted successfully');
      } catch (error) {
        console.error('Error deleting item:', error);
        showSnackbar(
          isHebrew ? 'שגיאה במחיקת המוצר' : 'Error deleting item',
          'error'
        );
      }
    }
    handleMenuClose();
  };

  const handlePrintItem = (item: Item) => {
    // TODO: Implement print item
    console.log('Print item:', item);
    handleMenuClose();
  };

  const handleCopyItem = (item: Item) => {
    // TODO: Implement copy item
    console.log('Copy item:', item);
    handleMenuClose();
  };

  const handleOpenDialog = (item?: Item) => {
    setEditingItem(item || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
  };

  const handleSaveItem = async (itemData: Omit<Item, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'cost' | 'price'>) => {
    try {
      setSaving(true);
      
      // Add backward compatibility aliases
      const itemWithAliases = {
        ...itemData,
        cost: itemData.costPrice,
        price: itemData.sellPrice,
      };
      
      if (editingItem) {
        await updateItem(editingItem.id, itemWithAliases);
        showSnackbar(isHebrew ? 'המוצר עודכן בהצלחה' : 'Item updated successfully');
      } else {
        await createItem(itemWithAliases);
        showSnackbar(isHebrew ? 'המוצר נוצר בהצלחה' : 'Item created successfully');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      showSnackbar(
        isHebrew ? 'שגיאה בשמירת המוצר' : 'Error saving item',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenStockDialog = (item: Item) => {
    setAdjustingItem(item);
    setOpenStockDialog(true);
  };

  const handleCloseStockDialog = () => {
    setOpenStockDialog(false);
    setAdjustingItem(null);
  };

  const handleAdjustStock = async (quantityChange: number, reason: string) => {
    if (!adjustingItem) return;
    
    try {
      setSaving(true);
      await adjustStock(adjustingItem.id, quantityChange, reason);
      showSnackbar(isHebrew ? 'המלאי עודכן בהצלחה' : 'Stock updated successfully');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      showSnackbar(
        isHebrew ? 'שגיאה בעדכון המלאי' : 'Error updating stock',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns: GridColDef[] = [
    {
      field: 'sku',
      headerName: isHebrew ? 'מק״ט' : 'SKU',
      width: 150,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isHebrew ? 'מק״ט' : 'SKU'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'name',
      headerName: isHebrew ? 'שם המוצר' : 'Product Name',
      flex: 1,
      minWidth: 200,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isHebrew ? 'שם המוצר' : 'Product Name'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'category',
      headerName: isHebrew ? 'קטגוריה' : 'Category',
      width: 150,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isHebrew ? 'קטגוריה' : 'Category'}
        </Typography>
      ),
      renderCell: (params) => (
        params.value ? (
          <Chip 
            label={params.value} 
            size="small" 
            variant="outlined" 
            sx={{ fontSize: '0.875rem', fontWeight: 500, borderRadius: 2 }}
          />
        ) : null
      ),
    },
    {
      field: 'currentStockQty',
      headerName: isHebrew ? 'מלאי נוכחי' : 'Current Stock',
      width: 140,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem', textAlign: 'center', width: '100%' }}>
          {isHebrew ? 'מלאי נוכחי' : 'Current Stock'}
        </Typography>
      ),
      renderCell: (params) => {
        const item = params.row as Item;
        const isLowStock = item.currentStockQty <= item.reorderPoint;
        const isOutOfStock = item.currentStockQty === 0;
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%' }}>
            <Typography
              variant="body2"
              sx={{ 
                color: isOutOfStock ? 'error.main' : isLowStock ? 'warning.main' : 'text.primary',
                fontWeight: isOutOfStock || isLowStock ? 600 : 400,
                fontSize: '1rem'
              }}
            >
              {params.value} {item.unit}
            </Typography>
            {isOutOfStock && <WarningIcon color="error" fontSize="small" />}
            {isLowStock && !isOutOfStock && <WarningIcon color="warning" fontSize="small" />}
          </Box>
        );
      },
    },
    {
      field: 'reorderPoint',
      headerName: isHebrew ? 'נקודת הזמנה' : 'Reorder Point',
      width: 140,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem', textAlign: 'center', width: '100%' }}>
          {isHebrew ? 'נקודת הזמנה' : 'Reorder Point'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '1rem', textAlign: 'center', width: '100%' }}>
          {params.value} {params.row.unit}
        </Typography>
      ),
    },
    {
      field: 'sellPrice',
      headerName: isHebrew ? 'מחיר מכירה' : 'Sell Price',
      width: 130,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem', textAlign: 'right', width: '100%' }}>
          {isHebrew ? 'מחיר מכירה' : 'Sell Price'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          ₪{params.value.toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'costPrice',
      headerName: isHebrew ? 'מחיר עלות' : 'Cost Price',
      width: 130,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem', textAlign: 'right', width: '100%' }}>
          {isHebrew ? 'מחיר עלות' : 'Cost Price'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '1rem' }}>
          ₪{params.value.toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'isActive',
      headerName: isHebrew ? 'סטטוס' : 'Status',
      width: 120,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {isHebrew ? 'סטטוס' : 'Status'}
        </Typography>
      ),
      renderCell: (params) => (
        <Chip
          label={params.value ? (isHebrew ? 'פעיל' : 'Active') : (isHebrew ? 'לא פעיל' : 'Inactive')}
          color={params.value ? 'success' : 'default'}
          size="small"
          sx={{ fontSize: '0.875rem', fontWeight: 500, borderRadius: 2 }}
        />
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
          onClick={(event) => handleMenuOpen(event as React.MouseEvent<HTMLElement>, params.row as Item)}
        />,
      ],
    },
  ];

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        p: { xs: 3, md: 4 }, 
        backgroundColor: 'background.default',
        minHeight: '100vh'
      }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={80} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  // Calculate summary stats
  const totalItems = filteredItems.length;
  const activeItems = filteredItems.filter(item => item.isActive).length;
  const lowStockItems = filteredItems.filter(item => item.currentStockQty <= item.reorderPoint).length;
  const outOfStockItems = filteredItems.filter(item => item.currentStockQty === 0).length;
  const totalValue = filteredItems.reduce((sum, item) => sum + (item.currentStockQty * item.costPrice), 0);

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
          <InventoryIcon sx={{ fontSize: 40 }} />
          {isHebrew ? 'ניהול מוצרים' : 'Product Management'}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refreshItems()}
            disabled={loading}
            sx={buttonStyles.secondary}
          >
            {isHebrew ? 'רענן' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={buttonStyles.primary}
          >
            {isHebrew ? 'מוצר חדש' : 'New Item'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 3 }}>
        <Grid size={{ xs: 4, sm: 4, md: 2.4 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'סה״כ מוצרים' : 'Total Items'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {totalItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, sm: 4, md: 2.4 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'מוצרים פעילים' : 'Active Items'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {activeItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, sm: 4, md: 2.4 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'מלאי נמוך' : 'Low Stock'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {lowStockItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, sm: 4, md: 2.4 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'אזל מהמלאי' : 'Out of Stock'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'error.main' }}>
                {outOfStockItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, sm: 4, md: 2.4 }}>
          <Card sx={cardStyles}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isHebrew ? 'ערך מלאי' : 'Inventory Value'}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'success.main' }}>
                ₪{totalValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Items DataGrid */}
      <Paper sx={paperStyles}>
        {/* Search Bar */}
        <Box sx={{ p: 3, pb: 0 }}>
          <TextField
            fullWidth
            variant="outlined"
            label={isHebrew ? 'חיפוש' : 'Search'}
            placeholder={isHebrew ? 'חיפוש לפי שם, מק״ט או תיאור...' : 'Search by name, SKU or description...'}
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
            rows={filteredItems}
            columns={columns}
            loading={loading}
            pagination
            paginationMode="client"
            rowCount={filteredItems.length}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationChange}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            localeText={
              isHebrew
                ? {
                    noRowsLabel: loading ? 'טוען...' : 'אין מוצרים',
                    paginationRowsPerPage: 'שורות בעמוד:',
                  }
                : {
                    noRowsLabel: loading ? 'Loading...' : 'No items found',
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
          onClick={() => selectedItem && handleViewItem(selectedItem)}
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
          onClick={() => selectedItem && handleEditItem(selectedItem)}
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
          onClick={() => selectedItem && handleOpenStockDialog(selectedItem)}
          sx={{
            '&:hover': {
              backgroundColor: (theme) => theme.palette.mode === 'light'
                ? 'rgba(25, 118, 210, 0.08)' : 'rgba(59, 130, 246, 0.12)',
            }
          }}
        >
          <ListItemIcon>
            <InventoryIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}>
            {isHebrew ? 'עדכון מלאי' : 'Adjust Stock'}
          </ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={() => selectedItem && handleCopyItem(selectedItem)}
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
          onClick={() => selectedItem && handlePrintItem(selectedItem)}
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

        <Divider sx={{ my: 1 }} />

        <MenuItem 
          onClick={() => selectedItem && handleDeleteItem(selectedItem)}
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

      {/* Dialogs */}
      <ItemFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSave={handleSaveItem}
        item={editingItem}
        loading={saving}
      />

      <StockAdjustmentDialog
        open={openStockDialog}
        onClose={handleCloseStockDialog}
        onAdjust={handleAdjustStock}
        item={adjustingItem}
        loading={saving}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventory;
