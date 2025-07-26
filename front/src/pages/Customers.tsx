import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Backdrop,
  Paper,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useUIStore } from '../stores';
import { useCustomers } from '../hooks/useCustomers';
import { useDebounce } from '../hooks/useDebounce';
import type { Customer } from '../types/entities';
import CustomerDocumentsDialog from '../components/customers/CustomerDocumentsDialog';
import { textFieldStyles, dialogStyles, paperStyles, buttonStyles } from '../styles/formStyles';
import { enhancedDataGridStyles } from '../styles/enhancedStyles';

const Customers = () => {
  const { language } = useUIStore();
  const { 
    customers, 
    totalCount,
    loading, 
    error, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer, 
    loadCustomers 
  } = useCustomers();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms debounce delay
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    taxId: '',
    email: '',
    phone: '',
    website: '',
    paymentTerms: 30,
    creditLimit: 0,
  });
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

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        address: customer.address,
        contact: customer.contact,
        taxId: customer.taxId || '',
        email: customer.email || '',
        phone: customer.phone || '',
        website: customer.website || '',
        paymentTerms: customer.paymentTerms || 30,
        creditLimit: customer.creditLimit || 0,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        address: '',
        contact: '',
        taxId: '',
        email: '',
        phone: '',
        website: '',
        paymentTerms: 30,
        creditLimit: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
  };

  const handleOpenDocumentsDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDocumentsDialogOpen(true);
  };

  const handleCloseDocumentsDialog = () => {
    setDocumentsDialogOpen(false);
    setSelectedCustomer(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.contact.trim() || !formData.address.trim()) {
      showSnackbar(
        language === 'he' 
          ? 'נא למלא את כל השדות הנדרשים' 
          : 'Please fill in all required fields',
        'error'
      );
      return;
    }

    try {
      setSaving(true);
      
      if (editingCustomer) {
        // Update existing customer
        await updateCustomer(editingCustomer.id, {
          ...formData,
          paymentTerms: formData.paymentTerms || 30,
          creditLimit: formData.creditLimit || 0,
        });
        showSnackbar(
          language === 'he' 
            ? 'הלקוח עודכן בהצלחה' 
            : 'Customer updated successfully'
        );
      } else {
        // Create new customer  
        await createCustomer({
          companyId: 1, // This should come from auth context
          ...formData,
          paymentTerms: formData.paymentTerms || 30,
          creditLimit: formData.creditLimit || 0,
          isActive: true,
        });
        showSnackbar(
          language === 'he' 
            ? 'הלקוח נוצר בהצלחה' 
            : 'Customer created successfully'
        );
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving customer:', error);
      showSnackbar(
        language === 'he' 
          ? 'שגיאה בשמירת הלקוח' 
          : 'Error saving customer',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(
      language === 'he' 
        ? 'האם אתה בטוח שברצונך למחוק לקוח זה?' 
        : 'Are you sure you want to delete this customer?'
    )) {
      try {
        await deleteCustomer(id);
        showSnackbar(
          language === 'he' 
            ? 'הלקוח נמחק בהצלחה' 
            : 'Customer deleted successfully'
        );
      } catch (error) {
        console.error('Error deleting customer:', error);
        showSnackbar(
          language === 'he' 
            ? 'שגיאה במחיקת הלקוח' 
            : 'Error deleting customer',
          'error'
        );
      }
    }
  };

  // Handle debounced search effect - reset to page 1 on search
  useEffect(() => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  }, [debouncedSearchTerm]);

  // Load customers when search term or pagination changes
  useEffect(() => {
    loadCustomers({
      searchTerm: debouncedSearchTerm,
      page: paginationModel.page + 1, // API uses 1-based pagination
      pageSize: paginationModel.pageSize,
    });
  }, [debouncedSearchTerm, paginationModel.page, paginationModel.pageSize, loadCustomers]);

  // Handle search input change (immediate UI update, debounced API call)
  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };

  // Handle pagination changes
  const handlePaginationChange = (newPaginationModel: { page: number; pageSize: number }) => {
    setPaginationModel(newPaginationModel);
    loadCustomers({
      searchTerm: debouncedSearchTerm,
      page: newPaginationModel.page + 1, // API uses 1-based pagination
      pageSize: newPaginationModel.pageSize,
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    loadCustomers({
      searchTerm: debouncedSearchTerm,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
    });
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: language === 'he' ? 'שם הלקוח' : 'Customer Name',
      flex: 1,
      minWidth: 200,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {language === 'he' ? 'שם הלקוח' : 'Customer Name'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'contact',
      headerName: language === 'he' ? 'איש קשר' : 'Contact',
      flex: 1,
      minWidth: 150,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {language === 'he' ? 'איש קשר' : 'Contact'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'taxId',
      headerName: language === 'he' ? 'ח.פ./ת.ז.' : 'Tax ID',
      width: 120,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {language === 'he' ? 'ח.פ./ת.ז.' : 'Tax ID'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: language === 'he' ? 'אימייל' : 'Email',
      flex: 1,
      minWidth: 200,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {language === 'he' ? 'אימייל' : 'Email'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'phone',
      headerName: language === 'he' ? 'טלפון' : 'Phone',
      width: 150,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {language === 'he' ? 'טלפון' : 'Phone'}
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'isActive',
      headerName: language === 'he' ? 'סטטוס' : 'Status',
      width: 100,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {language === 'he' ? 'סטטוס' : 'Status'}
        </Typography>
      ),
      renderCell: (params) => (
        <Chip
          label={params.value ? (language === 'he' ? 'פעיל' : 'Active') : (language === 'he' ? 'לא פעיל' : 'Inactive')}
          color={params.value ? 'success' : 'default'}
          size="small"
          sx={{ 
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: 2
          }}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: language === 'he' ? 'פעולות' : 'Actions',
      width: 150,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {language === 'he' ? 'פעולות' : 'Actions'}
        </Typography>
      ),
      getActions: (params) => [
        <GridActionsCellItem
          key="documents"
          icon={<ReceiptIcon sx={{ fontSize: 20 }} />}
          label={language === 'he' ? 'מסמכים' : 'Documents'}
          onClick={() => handleOpenDocumentsDialog(params.row)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon sx={{ fontSize: 20 }} />}
          label={language === 'he' ? 'עריכה' : 'Edit'}
          onClick={() => handleOpenDialog(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon sx={{ fontSize: 20 }} />}
          label={language === 'he' ? 'מחיקה' : 'Delete'}
          onClick={() => handleDelete(params.id as number)}
        />,
      ],
    },
  ];

  return (
    <Box sx={{ 
      p: { xs: 3, md: 4 }, 
      backgroundColor: 'background.default',
      minHeight: '100vh'
    }}>
      {/* Header with Actions */}
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
          <PeopleIcon sx={{ fontSize: 40 }} />
          {language === 'he' ? 'לקוחות' : 'Customers'}
        </Typography>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            sx={buttonStyles.secondary}
          >
            {language === 'he' ? 'רענן' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
            sx={buttonStyles.primary}
          >
            {language === 'he' ? 'הוסף לקוח' : 'Add Customer'}
          </Button>
        </Box>
      </Box>

      <Paper sx={paperStyles}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => window.location.reload()}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Box mb={4}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={language === 'he' ? 'חיפוש לקוחות...' : 'Search customers...'}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '1.1rem',
                backgroundColor: 'background.paper',
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.mode === 'light' 
                    ? 'rgba(0,0,0,0.02)' 
                    : 'rgba(255,255,255,0.05)',
                },
                '&.Mui-focused': {
                  backgroundColor: 'background.paper',
                }
              },
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
            rows={customers}
            columns={columns}
            loading={loading}
            pagination
            paginationMode="server"
            rowCount={totalCount}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationChange}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            localeText={
              language === 'he'
                ? {
                    noRowsLabel: loading ? 'טוען...' : 'אין לקוחות',
                    paginationRowsPerPage: 'שורות בעמוד:',
                  }
                : {
                    noRowsLabel: loading ? 'Loading...' : 'No customers found',
                  }
            }
          />
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        sx={dialogStyles}
      >
        <DialogTitle sx={{ 
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'text.primary',
          pb: 2
        }}>
          {editingCustomer
            ? (language === 'he' ? 'עריכת לקוח' : 'Edit Customer')
            : (language === 'he' ? 'הוספת לקוח חדש' : 'Add New Customer')
          }
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label={language === 'he' ? 'שם הלקוח' : 'Customer Name'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={textFieldStyles}
            />
            <TextField
              fullWidth
              label={language === 'he' ? 'כתובת' : 'Address'}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              rows={2}
              sx={textFieldStyles}
            />
            <TextField
              fullWidth
              label={language === 'he' ? 'איש קשר' : 'Contact Person'}
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              sx={textFieldStyles}
            />
            <TextField
              fullWidth
              label={language === 'he' ? 'ח.פ./ת.ז.' : 'Tax ID'}
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              sx={textFieldStyles}
            />
            <TextField
              fullWidth
              label={language === 'he' ? 'אימייל' : 'Email'}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              sx={textFieldStyles}
            />
            <TextField
              fullWidth
              label={language === 'he' ? 'טלפון' : 'Phone'}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              sx={textFieldStyles}
            />
            <TextField
              fullWidth
              label={language === 'he' ? 'אתר אינטרנט' : 'Website'}
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              sx={textFieldStyles}
            />
            <Box sx={{ display: 'flex', gap: 3 }}>
              <TextField
                fullWidth
                label={language === 'he' ? 'תנאי תשלום (ימים)' : 'Payment Terms (days)'}
                type="number"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 0 })}
                sx={textFieldStyles}
              />
              <TextField
                fullWidth
                label={language === 'he' ? 'מסגרת אשראי' : 'Credit Limit'}
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '1.1rem'
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1rem'
                  }
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            variant="outlined"
            onClick={handleCloseDialog} 
            disabled={saving}
            sx={{ 
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            {language === 'he' ? 'ביטול' : 'Cancel'}
          </Button>
          <Button 
            variant="contained"
            onClick={handleSave} 
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}
          >
            {saving 
              ? (language === 'he' ? 'שומר...' : 'Saving...') 
              : (language === 'he' ? 'שמירה' : 'Save')
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={saving}>
        <Box sx={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: 300,
          flexDirection: "column",
          gap: 2 
        }}>
          <CircularProgress size={48} />
          <Typography 
            variant="body1" 
            color="inherit"
            sx={{ fontSize: '1.1rem' }}
          >
            {language === 'he' ? 'שומר...' : 'Saving...'}
          </Typography>
        </Box>
      </Backdrop>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Customer Documents Dialog */}
      {selectedCustomer && (
        <CustomerDocumentsDialog
          open={documentsDialogOpen}
          onClose={handleCloseDocumentsDialog}
          customer={selectedCustomer}
          companyId={1} // This should come from auth context
        />
      )}
    </Box>
  );
};

export default Customers;
