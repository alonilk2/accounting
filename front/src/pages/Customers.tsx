import { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useUIStore } from '../stores';
import { useCustomers } from '../hooks/useCustomers';
import type { Customer } from '../types/entities';
import { ModernButton } from '../components/ui';

const Customers = () => {
  const { language } = useUIStore();
  const { 
    customers, 
    loading, 
    error, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer, 
    refreshCustomers 
  } = useCustomers();

  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.taxId && customer.taxId.includes(searchTerm))
  );

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: language === 'he' ? 'שם הלקוח' : 'Customer Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'contact',
      headerName: language === 'he' ? 'איש קשר' : 'Contact',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'taxId',
      headerName: language === 'he' ? 'ח.פ./ת.ז.' : 'Tax ID',
      width: 120,
    },
    {
      field: 'email',
      headerName: language === 'he' ? 'אימייל' : 'Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'phone',
      headerName: language === 'he' ? 'טלפון' : 'Phone',
      width: 150,
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
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label={language === 'he' ? 'עריכה' : 'Edit'}
          onClick={() => handleOpenDialog(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label={language === 'he' ? 'מחיקה' : 'Delete'}
          onClick={() => handleDelete(params.id as number)}
        />,
      ],
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {language === 'he' ? 'לקוחות' : 'Customers'}
        </Typography>
        <Box display="flex" gap={1}>
          <ModernButton
            variant="outline"
            icon={<RefreshIcon />}
            onClick={refreshCustomers}
            disabled={loading}
          >
            {language === 'he' ? 'רענן' : 'Refresh'}
          </ModernButton>
          <ModernButton
            variant="primary"
            icon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
            glow
          >
            {language === 'he' ? 'הוסף לקוח' : 'Add Customer'}
          </ModernButton>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => window.location.reload()}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Box mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={language === 'he' ? 'חיפוש לקוחות...' : 'Search customers...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {/* Data Grid */}
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredCustomers}
          columns={columns}
          loading={loading}
          pagination
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
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

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer
            ? (language === 'he' ? 'עריכת לקוח' : 'Edit Customer')
            : (language === 'he' ? 'הוספת לקוח חדש' : 'Add New Customer')
          }
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label={language === 'he' ? 'שם הלקוח' : 'Customer Name'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label={language === 'he' ? 'כתובת' : 'Address'}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label={language === 'he' ? 'איש קשר' : 'Contact Person'}
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
            <TextField
              fullWidth
              label={language === 'he' ? 'ח.פ./ת.ז.' : 'Tax ID'}
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            />
            <TextField
              fullWidth
              label={language === 'he' ? 'אימייל' : 'Email'}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              fullWidth
              label={language === 'he' ? 'טלפון' : 'Phone'}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />              <TextField
                fullWidth
                label={language === 'he' ? 'אתר אינטרנט' : 'Website'}
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label={language === 'he' ? 'תנאי תשלום (ימים)' : 'Payment Terms (days)'}
                  type="number"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 0 })}
                />
                <TextField
                  fullWidth
                  label={language === 'he' ? 'מסגרת אשראי' : 'Credit Limit'}
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                />
              </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <ModernButton 
            variant="ghost" 
            onClick={handleCloseDialog} 
            disabled={saving}
          >
            {language === 'he' ? 'ביטול' : 'Cancel'}
          </ModernButton>
          <ModernButton 
            variant="primary"
            onClick={handleSave} 
            disabled={saving}
            icon={saving ? <CircularProgress size={16} /> : undefined}
            glow
          >
            {saving 
              ? (language === 'he' ? 'שומר...' : 'Saving...') 
              : (language === 'he' ? 'שמירה' : 'Save')
            }
          </ModernButton>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={saving}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="inherit" />
          <Typography>
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
    </Box>
  );
};

export default Customers;
