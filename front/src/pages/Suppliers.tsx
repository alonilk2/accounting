import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  FormControlLabel,
  Switch,
  InputAdornment,
  Alert,
  Tooltip,
  Stack
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useUIStore } from '../stores';
import { useSuppliers } from '../hooks';
import type { Supplier } from '../types/entities';
import type { SupplierFilters } from '../types/pagination';
import { 
  textFieldStyles, 
  dialogStyles, 
  paperStyles, 
  dataGridStyles, 
  buttonStyles 
} from '../styles/formStyles';

const Suppliers = () => {
  const { language } = useUIStore();
  const {
    suppliers,
    totalCount,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    loadSuppliers,
  } = useSuppliers();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // DataGrid columns
  const getColumns = (): GridColDef[] => [
    {
      field: 'name',
      headerName: text.name,
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={2}>
          <BusinessIcon color="action" sx={{ fontSize: 24 }} />
          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'taxId',
      headerName: text.taxId,
      width: 150,
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'contact',
      headerName: text.contact,
      width: 150,
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: text.email,
      width: 200,
      renderCell: (params) => (
        params.value ? (
          <Box display="flex" alignItems="center" gap={1}>
            <EmailIcon color="action" sx={{ fontSize: 20 }} />
            <Typography variant="body1" sx={{ fontSize: '1rem' }}>
              {params.value}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
            -
          </Typography>
        )
      ),
    },
    {
      field: 'phone',
      headerName: text.phone,
      width: 150,
      renderCell: (params) => (
        params.value ? (
          <Box display="flex" alignItems="center" gap={1}>
            <PhoneIcon color="action" sx={{ fontSize: 20 }} />
            <Typography variant="body1" sx={{ fontSize: '1rem' }}>
              {params.value}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
            -
          </Typography>
        )
      ),
    },
    {
      field: 'isActive',
      headerName: text.status,
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? text.active : text.inactive}
          color={params.value ? 'success' : 'default'}
          size="small"
          sx={{ fontSize: '0.875rem', fontWeight: 500, borderRadius: 2 }}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: text.actions,
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label={text.edit}
          onClick={() => openEditDialog(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label={text.delete}
          onClick={() => {
            setSupplierToDelete(params.row);
            setDeleteDialogOpen(true);
          }}
        />,
      ],
    },
  ];
  
  // Form state - matching the actual Supplier interface
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    vatNumber: '',
    bankName: '',
    bankBranch: '',
    bankAccount: '',
    paymentTermsDays: 30,
    notes: '',
    isActive: true
  });

  // Handle search with pagination
  const handleSearch = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    const newPaginationModel = { ...paginationModel, page: 0 };
    setPaginationModel(newPaginationModel);
    loadSuppliers({
      searchTerm: newSearchTerm,
      isActive: showActiveOnly ? true : undefined,
      page: newPaginationModel.page + 1,
      pageSize: newPaginationModel.pageSize,
    });
  };

  // Handle pagination changes
  const handlePaginationChange = (newPaginationModel: { page: number; pageSize: number }) => {
    setPaginationModel(newPaginationModel);
    loadSuppliers({
      searchTerm,
      isActive: showActiveOnly ? true : undefined,
      page: newPaginationModel.page + 1,
      pageSize: newPaginationModel.pageSize,
    });
  };

  // Handle active filter toggle
  const handleActiveFilterChange = (checked: boolean) => {
    setShowActiveOnly(checked);
    const newPaginationModel = { ...paginationModel, page: 0 };
    setPaginationModel(newPaginationModel);
    loadSuppliers({
      searchTerm,
      isActive: checked ? true : undefined,
      page: newPaginationModel.page + 1,
      pageSize: newPaginationModel.pageSize,
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    loadSuppliers({
      searchTerm,
      isActive: showActiveOnly ? true : undefined,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
    });
  };

  // Effect for initial load
  useEffect(() => {
    loadSuppliers({
      isActive: showActiveOnly ? true : undefined,
      page: 1,
      pageSize: 10,
    });
  }, [loadSuppliers, showActiveOnly]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await createSupplier(formData);
      }
      setOpenDialog(false);
      resetForm();
      handleRefresh();
    } catch (err) {
      console.error('Error saving supplier:', err);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!supplierToDelete) return;
    
    try {
      await deleteSupplier(supplierToDelete.id);
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
      handleRefresh();
    } catch (err) {
      console.error('Error deleting supplier:', err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      taxId: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      vatNumber: '',
      bankName: '',
      bankBranch: '',
      bankAccount: '',
      paymentTermsDays: 30,
      notes: '',
      isActive: true
    });
    setEditingSupplier(null);
  };

  // Open edit dialog
  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      taxId: supplier.taxId || '',
      contact: supplier.contact || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      website: supplier.website || '',
      vatNumber: supplier.vatNumber || '',
      bankName: supplier.bankName || '',
      bankBranch: supplier.bankBranch || '',
      bankAccount: supplier.bankAccount || '',
      paymentTermsDays: supplier.paymentTermsDays,
      notes: supplier.notes || '',
      isActive: supplier.isActive
    });
    setOpenDialog(true);
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  const text = {
    title: language === 'he' ? 'ספקים' : 'Suppliers',
    addSupplier: language === 'he' ? 'הוסף ספק' : 'Add Supplier',
    editSupplier: language === 'he' ? 'ערוך ספק' : 'Edit Supplier',
    search: language === 'he' ? 'חיפוש ספקים...' : 'Search suppliers...',
    activeOnly: language === 'he' ? 'פעילים בלבד' : 'Active only',
    name: language === 'he' ? 'שם' : 'Name',
    taxId: language === 'he' ? 'ח.פ./ע.מ.' : 'Tax ID',
    contact: language === 'he' ? 'איש קשר' : 'Contact',
    email: language === 'he' ? 'אימייל' : 'Email',
    phone: language === 'he' ? 'טלפון' : 'Phone',
    address: language === 'he' ? 'כתובת' : 'Address',
    website: language === 'he' ? 'אתר אינטרנט' : 'Website',
    vatNumber: language === 'he' ? 'מספר מע"מ' : 'VAT Number',
    bankDetails: language === 'he' ? 'פרטי בנק' : 'Bank Details',
    bankName: language === 'he' ? 'שם הבנק' : 'Bank Name',
    bankBranch: language === 'he' ? 'סניף' : 'Branch',
    bankAccount: language === 'he' ? 'מספר חשבון' : 'Account Number',
    paymentTerms: language === 'he' ? 'תנאי תשלום (ימים)' : 'Payment Terms (Days)',
    notes: language === 'he' ? 'הערות' : 'Notes',
    status: language === 'he' ? 'סטטוס' : 'Status',
    active: language === 'he' ? 'פעיל' : 'Active',
    inactive: language === 'he' ? 'לא פעיל' : 'Inactive',
    actions: language === 'he' ? 'פעולות' : 'Actions',
    edit: language === 'he' ? 'עריכה' : 'Edit',
    delete: language === 'he' ? 'מחיקה' : 'Delete',
    save: language === 'he' ? 'שמור' : 'Save',
    cancel: language === 'he' ? 'ביטול' : 'Cancel',
    deleteConfirm: language === 'he' ? 'האם אתה בטוח שברצונך למחוק את הספק?' : 'Are you sure you want to delete this supplier?',
    noSuppliers: language === 'he' ? 'לא נמצאו ספקים' : 'No suppliers found',
    refresh: language === 'he' ? 'רענן' : 'Refresh'
  };

  return (
    <Box sx={{ 
      p: { xs: 3, md: 4 }, 
      backgroundColor: 'background.default',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography
          variant="h3"
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 2,
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          <BusinessIcon sx={{ fontSize: 40 }} />
          {text.title}
        </Typography>
        <Box display="flex" gap={2}>
          <Tooltip title={text.refresh}>
            <IconButton 
              onClick={handleRefresh} 
              disabled={loading}
              sx={{
                ...buttonStyles.secondary,
                p: 2
              }}
            >
              <RefreshIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            sx={buttonStyles.primary}
          >
            {text.addSupplier}
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={paperStyles}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
          <TextField
            fullWidth
            placeholder={text.search}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            sx={textFieldStyles}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showActiveOnly}
                onChange={(e) => handleActiveFilterChange(e.target.checked)}
              />
            }
            label={
              <Typography sx={{ fontSize: '1rem' }}>
                {text.activeOnly}
              </Typography>
            }
          />
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
        >
          <Typography sx={{ fontSize: '1rem' }}>
            {error}
          </Typography>
        </Alert>
      )}

      {/* Suppliers DataGrid */}
      <Paper sx={paperStyles}>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={suppliers}
            columns={getColumns()}
            loading={loading}
            pagination
            paginationMode="server"
            rowCount={totalCount}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationChange}
            pageSizeOptions={[10, 25, 50]}
            sx={dataGridStyles}
            localeText={{
              noRowsLabel: text.noSuppliers,
            }}
            disableRowSelectionOnClick
          />
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        sx={dialogStyles}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            {editingSupplier ? text.editSupplier : text.addSupplier}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Stack spacing={4} sx={{ mt: 2 }}>
            {/* Basic Info */}
            <Typography 
              variant="h6"
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                mb: 1
              }}
            >
              {language === 'he' ? 'פרטים כלליים' : 'General Information'}
            </Typography>
            
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label={text.name}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={textFieldStyles}
              />
              <TextField
                fullWidth
                label={text.taxId}
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                sx={textFieldStyles}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label={text.contact}
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                sx={textFieldStyles}
              />
              <TextField
                fullWidth
                label={text.email}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                sx={textFieldStyles}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label={text.phone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                sx={textFieldStyles}
              />
              <TextField
                fullWidth
                label={text.website}
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                sx={textFieldStyles}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
              <TextField
                fullWidth
                label={text.vatNumber}
                value={formData.vatNumber}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                sx={textFieldStyles}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '1rem' }}>
                    {text.active}
                  </Typography>
                }
              />
            </Stack>

            <TextField
              fullWidth
              label={text.address}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              sx={textFieldStyles}
            />

            {/* Bank Details */}
            <Typography 
              variant="h6"
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                mb: 1
              }}
            >
              {text.bankDetails}
            </Typography>
            
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label={text.bankName}
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                sx={textFieldStyles}
              />
              <TextField
                fullWidth
                label={text.bankBranch}
                value={formData.bankBranch}
                onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                sx={textFieldStyles}
              />
              <TextField
                fullWidth
                label={text.bankAccount}
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                sx={textFieldStyles}
              />
            </Stack>

            <TextField
              fullWidth
              label={text.paymentTerms}
              type="number"
              value={formData.paymentTermsDays}
              onChange={(e) => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) || 0 })}
              sx={textFieldStyles}
            />

            <TextField
              fullWidth
              label={text.notes}
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              sx={textFieldStyles}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            sx={buttonStyles.secondary}
          >
            {text.cancel}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            sx={buttonStyles.primary}
          >
            {text.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={dialogStyles}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 600,
              color: 'error.main'
            }}
          >
            {text.delete}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography
            variant="body1"
            sx={{ fontSize: '1.1rem', mb: 2 }}
          >
            {text.deleteConfirm}
          </Typography>
          {supplierToDelete && (
            <Typography 
              variant="body1" 
              sx={{ 
                mt: 2, 
                fontWeight: 600,
                fontSize: '1.1rem',
                color: 'primary.main'
              }}
            >
              {supplierToDelete.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={buttonStyles.secondary}
          >
            {text.cancel}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            sx={{
              ...buttonStyles.primary,
              boxShadow: (theme) => theme.palette.mode === 'light'
                ? '0 4px 12px rgba(211, 47, 47, 0.3)'
                : '0 4px 12px rgba(244, 67, 54, 0.4)',
              '&:hover': {
                ...buttonStyles.primary['&:hover'],
                boxShadow: (theme) => theme.palette.mode === 'light'
                  ? '0 6px 20px rgba(211, 47, 47, 0.4)'
                  : '0 6px 20px rgba(244, 67, 54, 0.5)',
              }
            }}
          >
            {text.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Suppliers;
