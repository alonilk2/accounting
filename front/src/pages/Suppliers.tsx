import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  FormControlLabel,
  Switch,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useUIStore } from '../stores';
import { suppliersAPI } from '../services/suppliersApi';
import type { Supplier } from '../types/entities';

const Suppliers = () => {
  const { language } = useUIStore();
  
  // State management
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
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

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {
        isActive: showActiveOnly ? true : undefined,
        searchTerm: searchTerm || undefined
      };
      const data = await suppliersAPI.getAll(filters);
      setSuppliers(data);
    } catch (err) {
      setError(language === 'he' ? 'שגיאה בטעינת הספקים' : 'Error loading suppliers');
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effect for initial load and search
  useEffect(() => {
    const timer = setTimeout(() => {
      const loadData = async () => {
        try {
          setLoading(true);
          setError(null);
          const filters = {
            isActive: showActiveOnly ? true : undefined,
            searchTerm: searchTerm || undefined
          };
          const data = await suppliersAPI.getAll(filters);
          setSuppliers(data);
        } catch (err) {
          setError(language === 'he' ? 'שגיאה בטעינת הספקים' : 'Error loading suppliers');
          console.error('Error loading suppliers:', err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [showActiveOnly, searchTerm, language]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier.id, formData);
      } else {
        await suppliersAPI.create(formData);
      }
      setOpenDialog(false);
      resetForm();
      loadSuppliers();
    } catch (err) {
      setError(language === 'he' ? 'שגיאה בשמירת הספק' : 'Error saving supplier');
      console.error('Error saving supplier:', err);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!supplierToDelete) return;
    
    try {
      await suppliersAPI.delete(supplierToDelete.id);
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
      loadSuppliers();
    } catch (err) {
      setError(language === 'he' ? 'שגיאה במחיקת הספק' : 'Error deleting supplier');
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
    setAnchorEl(null);
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, supplier: Supplier) => {
    setAnchorEl(event.currentTarget);
    setSelectedSupplier(supplier);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSupplier(null);
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
      backgroundColor: '#fafafa',
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
              onClick={loadSuppliers} 
              disabled={loading}
              sx={{
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              <RefreshIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}
          >
            {text.addSupplier}
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ 
        p: 4,
        mb: 4,
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        backgroundColor: 'white'
      }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
          <TextField
            fullWidth
            placeholder={text.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '1.1rem'
              },
              '& .MuiInputLabel-root': {
                fontSize: '1rem'
              }
            }}
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
                onChange={(e) => setShowActiveOnly(e.target.checked)}
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
          onClose={() => setError(null)}
        >
          <Typography sx={{ fontSize: '1rem' }}>
            {error}
          </Typography>
        </Alert>
      )}

      {/* Suppliers Table */}
      <Paper sx={{ 
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        backgroundColor: 'white'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {text.name}
                </TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {text.taxId}
                </TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {text.contact}
                </TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {text.email}
                </TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {text.phone}
                </TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {text.status}
                </TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {text.actions}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
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
                        color="text.secondary"
                        sx={{ fontSize: '1.1rem' }}
                      >
                        {language === 'he' ? 'טוען ספקים...' : 'Loading suppliers...'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ 
                      textAlign: "center", 
                      py: 6,
                      backgroundColor: 'grey.50',
                      borderRadius: 2
                    }}>
                      <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{ fontSize: '1.1rem' }}
                      >
                        {text.noSuppliers}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <BusinessIcon color="action" sx={{ fontSize: 24 }} />
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: '1.1rem'
                          }}
                        >
                          {supplier.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body1"
                        sx={{ fontSize: '1rem' }}
                      >
                        {supplier.taxId || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body1"
                        sx={{ fontSize: '1rem' }}
                      >
                        {supplier.contact || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {supplier.email ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon color="action" sx={{ fontSize: 20 }} />
                          <Typography 
                            variant="body1"
                            sx={{ fontSize: '1rem' }}
                          >
                            {supplier.email}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography 
                          variant="body1" 
                          color="text.secondary"
                          sx={{ fontSize: '1rem' }}
                        >
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.phone ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <PhoneIcon color="action" sx={{ fontSize: 20 }} />
                          <Typography 
                            variant="body1"
                            sx={{ fontSize: '1rem' }}
                          >
                            {supplier.phone}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography 
                          variant="body1" 
                          color="text.secondary"
                          sx={{ fontSize: '1rem' }}
                        >
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.isActive ? text.active : text.inactive}
                        color={supplier.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ fontSize: '0.875rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, supplier)}
                        sx={{
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        <MoreVertIcon sx={{ fontSize: 24 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }
        }}
      >
        <MenuItem 
          onClick={() => selectedSupplier && openEditDialog(selectedSupplier)}
          sx={{ fontSize: '1rem', py: 1.5 }}
        >
          <EditIcon sx={{ mr: 1.5, fontSize: 20 }} />
          {text.edit}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSupplierToDelete(selectedSupplier);
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ fontSize: '1rem', py: 1.5 }}
        >
          <DeleteIcon sx={{ mr: 1.5, fontSize: 20 }} />
          {text.delete}
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
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
              <TextField
                fullWidth
                label={text.taxId}
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
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
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label={text.contact}
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
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
              <TextField
                fullWidth
                label={text.email}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label={text.phone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              <TextField
                fullWidth
                label={text.website}
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
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
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
              <TextField
                fullWidth
                label={text.vatNumber}
                value={formData.vatNumber}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
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
              <TextField
                fullWidth
                label={text.bankBranch}
                value={formData.bankBranch}
                onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
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
              <TextField
                fullWidth
                label={text.bankAccount}
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
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
            </Stack>

            <TextField
              fullWidth
              label={text.paymentTerms}
              type="number"
              value={formData.paymentTermsDays}
              onChange={(e) => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) || 0 })}
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

            <TextField
              fullWidth
              label={text.notes}
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            sx={{ 
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            {text.cancel}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}
          >
            {text.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
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
            sx={{ 
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            {text.cancel}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
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
