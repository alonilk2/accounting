import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Backdrop,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useUIStore } from '../stores';
import { useItems } from '../hooks/useItems';
import type { Item } from '../types/entities';
import { ModernButton } from '../components/ui';
import ItemFormDialog from '../components/items/ItemFormDialog';
import StockAdjustmentDialog from '../components/items/StockAdjustmentDialog';

const Inventory = () => {
  const { language } = useUIStore();
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

  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
        showSnackbar(language === 'he' ? 'המוצר עודכן בהצלחה' : 'Item updated successfully');
      } else {
        await createItem(itemWithAliases);
        showSnackbar(language === 'he' ? 'המוצר נוצר בהצלחה' : 'Item created successfully');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      showSnackbar(
        language === 'he' ? 'שגיאה בשמירת המוצר' : 'Error saving item',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: Item) => {
    if (window.confirm(language === 'he' ? `האם למחוק את המוצר "${item.name}"?` : `Delete item "${item.name}"?`)) {
      try {
        await deleteItem(item.id);
        showSnackbar(language === 'he' ? 'המוצר נמחק בהצלחה' : 'Item deleted successfully');
      } catch (error) {
        console.error('Error deleting item:', error);
        showSnackbar(
          language === 'he' ? 'שגיאה במחיקת המוצר' : 'Error deleting item',
          'error'
        );
      }
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
      showSnackbar(language === 'he' ? 'המלאי עודכן בהצלחה' : 'Stock updated successfully');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      showSnackbar(
        language === 'he' ? 'שגיאה בעדכון המלאי' : 'Error updating stock',
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

  // Calculate statistics
  const totalItems = filteredItems.length;
  const activeItems = filteredItems.filter(item => item.isActive).length;
  const lowStockItems = filteredItems.filter(item => item.currentStockQty <= item.reorderPoint).length;
  const outOfStockItems = filteredItems.filter(item => item.currentStockQty === 0).length;
  const totalValue = filteredItems.reduce((sum, item) => sum + (item.currentStockQty * item.costPrice), 0);

  const columns: GridColDef[] = [
    {
      field: 'sku',
      headerName: language === 'he' ? 'מק״ט' : 'SKU',
      width: 120,
    },
    {
      field: 'name',
      headerName: language === 'he' ? 'שם המוצר' : 'Product Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'category',
      headerName: language === 'he' ? 'קטגוריה' : 'Category',
      width: 120,
      renderCell: (params) => (
        params.value ? (
          <Chip label={params.value} size="small" variant="outlined" />
        ) : null
      ),
    },
    {
      field: 'currentStockQty',
      headerName: language === 'he' ? 'מלאי נוכחי' : 'Current Stock',
      width: 120,
      type: 'number',
      renderCell: (params) => {
        const item = params.row as Item;
        const isLowStock = item.currentStockQty <= item.reorderPoint;
        const isOutOfStock = item.currentStockQty === 0;
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              color={isOutOfStock ? 'error' : isLowStock ? 'warning.main' : 'text.primary'}
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
      headerName: language === 'he' ? 'נקודת הזמנה' : 'Reorder Point',
      width: 120,
      type: 'number',
      renderCell: (params) => `${params.value} ${params.row.unit}`,
    },
    {
      field: 'sellPrice',
      headerName: language === 'he' ? 'מחיר מכירה' : 'Sell Price',
      width: 120,
      type: 'number',
      renderCell: (params) => `₪${params.value.toFixed(2)}`,
    },
    {
      field: 'costPrice',
      headerName: language === 'he' ? 'מחיר עלות' : 'Cost Price',
      width: 120,
      type: 'number',
      renderCell: (params) => `₪${params.value.toFixed(2)}`,
    },
    {
      field: 'isActive',
      headerName: language === 'he' ? 'סטטוס' : 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? (language === 'he' ? 'פעיל' : 'Active') : (language === 'he' ? 'לא פעיל' : 'Inactive')}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: language === 'he' ? 'פעולות' : 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label={language === 'he' ? 'עריכה' : 'Edit'}
          onClick={() => handleOpenDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<InventoryIcon />}
          label={language === 'he' ? 'עדכון מלאי' : 'Adjust Stock'}
          onClick={() => handleOpenStockDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label={language === 'he' ? 'מחיקה' : 'Delete'}
          onClick={() => handleDeleteItem(params.row)}
        />,
      ],
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {language === 'he' ? 'ניהול מוצרים' : 'Product Management'}
        </Typography>
        <Box display="flex" gap={1}>
          <ModernButton
            variant="outline"
            startIcon={<RefreshIcon />}
            onClick={refreshItems}
            disabled={loading}
          >
            {language === 'he' ? 'רענן' : 'Refresh'}
          </ModernButton>
          <ModernButton
            variant="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {language === 'he' ? 'מוצר חדש' : 'New Item'}
          </ModernButton>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box display="flex" gap={2} mb={3} sx={{ overflowX: 'auto' }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <InventoryIcon color="primary" />
              <Box>
                <Typography variant="h6">{totalItems}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {language === 'he' ? 'סה״כ מוצרים' : 'Total Items'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUpIcon color="success" />
              <Box>
                <Typography variant="h6">{activeItems}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {language === 'he' ? 'מוצרים פעילים' : 'Active Items'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <WarningIcon color="warning" />
              <Box>
                <Typography variant="h6">{lowStockItems}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {language === 'he' ? 'מלאי נמוך' : 'Low Stock'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingDownIcon color="error" />
              <Box>
                <Typography variant="h6">{outOfStockItems}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {language === 'he' ? 'אזל מהמלאי' : 'Out of Stock'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box>
              <Typography variant="h6">₪{totalValue.toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {language === 'he' ? 'ערך מלאי' : 'Inventory Value'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Search */}
      <Box mb={2}>
        <TextField
          fullWidth
          placeholder={language === 'he' ? 'חיפוש מוצרים...' : 'Search items...'}
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
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Data Grid */}
      <Box height={600}>
        <DataGrid
          rows={filteredItems}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
            },
          }}
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f8f9fa',
            },
          }}
        />
      </Box>

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

      {/* Loading Backdrop */}
      <Backdrop open={loading} sx={{ zIndex: 1000 }}>
        <CircularProgress />
      </Backdrop>

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
