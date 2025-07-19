import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  LocalShipping as ShippingIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Route as RouteIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Today as TodayIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

import { deliveryNotesApi } from '../services/deliveryNotesApi';
import { customersApi } from '../services/customersApi';
import type { DeliveryNote, Customer } from '../types/entities';
import { useAuthStore } from '../stores';
import CreateDeliveryNoteDialog from '../components/delivery/CreateDeliveryNoteDialog';
import { dialogStyles, paperStyles, buttonStyles } from '../styles/formStyles';
import { enhancedDataGridStyles } from '../styles/enhancedStyles';

// Helper function to get status label
const getStatusLabel = (status: string): string => {
  // Map delivery note statuses to display labels
  const deliveryStatusLabels: Record<string, string> = {
    'Draft': 'טיוטה',
    'Prepared': 'מוכנה למשלוח',
    'InTransit': 'בדרך',
    'Delivered': 'נמסרה',
    'Returned': 'הוחזרה',
    'Cancelled': 'בוטלה'
  };
  return deliveryStatusLabels[status] || status;
};

// Helper function to get status color
const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  const deliveryStatusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    'Draft': 'default',
    'Prepared': 'info',
    'InTransit': 'warning',
    'Delivered': 'success',
    'Returned': 'error',
    'Cancelled': 'error'
  };
  return deliveryStatusColors[status] || 'default';
};

const DeliveryNotesPage: React.FC = () => {
  const theme = useTheme();
  const isRTL = theme.direction === 'rtl';
  const { company: currentCompany } = useAuthStore();
  const [searchParams] = useSearchParams();

  // State
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  
  // Pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [totalCount, setTotalCount] = useState(0);

  // UI State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState<DeliveryNote | null>(null);

  // Load data
  const loadDeliveryNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        customerId: customerFilter || undefined,
        status: statusFilter || undefined,
        fromDate: fromDate?.toISOString().split('T')[0],
        toDate: toDate?.toISOString().split('T')[0],
        searchTerm: searchTerm || undefined
      };

      const data = await deliveryNotesApi.getDeliveryNotes(
        currentCompany?.id || 1,
        filters,
        paginationModel.page + 1,
        paginationModel.pageSize
      );
      
      setDeliveryNotes(data);
      // Note: API should return totalCount, for now we use data length
      setTotalCount(data.length);
    } catch (err) {
      console.error('Error loading delivery notes:', err);
      setError('שגיאה בטעינת תעודות המשלוח');
    } finally {
      setLoading(false);
    }
  }, [currentCompany, customerFilter, statusFilter, fromDate, toDate, searchTerm, paginationModel]);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await customersApi.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    loadDeliveryNotes();
  }, [loadDeliveryNotes]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Check if we should auto-open create dialog
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setCreateDialogOpen(true);
    }
  }, [searchParams]);

  // Handle pagination changes
  const handlePaginationChange = (newPaginationModel: { page: number; pageSize: number }) => {
    setPaginationModel(newPaginationModel);
  };

  // Handle search with debouncing
  const handleSearch = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    const newPaginationModel = { ...paginationModel, page: 0 };
    setPaginationModel(newPaginationModel);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadDeliveryNotes();
  };

  // Action handlers
  const handleEdit = (deliveryNote: DeliveryNote) => {
    // TODO: Implement edit functionality
    console.log('Edit delivery note:', deliveryNote.id);
    setSuccess(`עריכת תעודת משלוח ${deliveryNote.deliveryNoteNumber}`);
  };

  const handleDelete = async () => {
    if (!selectedDeliveryNote) return;

    try {
      await deliveryNotesApi.deleteDeliveryNote(
        selectedDeliveryNote.id, 
        currentCompany?.id || 1
      );
      
      setSuccess(`תעודת משלוח ${selectedDeliveryNote.deliveryNoteNumber} נמחקה בהצלחה`);
      setDeleteDialogOpen(false);
      setSelectedDeliveryNote(null);
      loadDeliveryNotes();
    } catch (err) {
      console.error('Error deleting delivery note:', err);
      setError('שגיאה במחיקת תעודת המשלוח');
    }
  };

  const handleStatusUpdate = async (status: 'Draft' | 'Prepared' | 'InTransit' | 'Delivered' | 'Returned' | 'Cancelled', deliveryNote: DeliveryNote) => {
    try {
      await deliveryNotesApi.updateDeliveryNoteStatus(
        deliveryNote.id,
        status,
        currentCompany?.id || 1,
        status === 'Delivered' ? {
          actualDeliveryTime: new Date(),
          receivedAt: new Date()
        } : undefined
      );
      
      setSuccess(`סטטוס תעודת משלוח ${deliveryNote.deliveryNoteNumber} עודכן ל${getStatusLabel(status)}`);
      loadDeliveryNotes();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('שגיאה בעדכון הסטטוס');
    }
  };

  const handlePrint = (deliveryNote: DeliveryNote) => {
    // TODO: Implement print functionality
    console.log('Print delivery note:', deliveryNote.id);
    setSuccess(`הדפסת תעודת משלוח ${deliveryNote.deliveryNoteNumber}`);
  };

  const handleEmail = (deliveryNote: DeliveryNote) => {
    // TODO: Implement email functionality
    console.log('Email delivery note:', deliveryNote.id);
    setSuccess(`שליחת תעודת משלוח ${deliveryNote.deliveryNoteNumber} במייל`);
  };

  // Filter handlers
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCustomerFilter('');
    setFromDate(null);
    setToDate(null);
    const newPaginationModel = { ...paginationModel, page: 0 };
    setPaginationModel(newPaginationModel);
  };

  const canEdit = (deliveryNote: DeliveryNote) => {
    return deliveryNote.status === 'Draft' || deliveryNote.status === 'Prepared';
  };

  const canCancel = (deliveryNote: DeliveryNote) => {
    return deliveryNote.status !== 'Delivered' && deliveryNote.status !== 'Cancelled';
  };

  const canMarkAsDelivered = (deliveryNote: DeliveryNote) => {
    return deliveryNote.status === 'InTransit';
  };

  const canMarkInTransit = (deliveryNote: DeliveryNote) => {
    return deliveryNote.status === 'Prepared';
  };

  // Define DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'deliveryNoteNumber',
      headerName: 'מספר תעודה',
      flex: 1,
      minWidth: 150,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          מספר תעודה
        </Typography>
      ),
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 'medium' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'customerName',
      headerName: 'לקוח',
      flex: 1,
      minWidth: 180,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          לקוח
        </Typography>
      ),
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body1" sx={{ fontSize: '1rem' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'deliveryDate',
      headerName: 'תאריך משלוח',
      width: 130,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          תאריך משלוח
        </Typography>
      ),
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <TodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body1" sx={{ fontSize: '1rem' }}>
            {new Date(params.value).toLocaleDateString('he-IL')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'סטטוס',
      width: 120,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          סטטוס
        </Typography>
      ),
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value)}
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
      field: 'deliveryAddress',
      headerName: 'כתובת משלוח',
      flex: 1,
      minWidth: 200,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          כתובת משלוח
        </Typography>
      ),
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body1" sx={{ fontSize: '1rem' }} noWrap>
            {params.value || 'לא צוין'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'driverName',
      headerName: 'נהג',
      width: 120,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          נהג
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {params.value || 'לא צוין'}
        </Typography>
      ),
    },
    {
      field: 'totalQuantity',
      headerName: 'כמות כוללת',
      width: 120,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          כמות כוללת
        </Typography>
      ),
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 'medium' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'פעולות',
      width: 150,
      renderHeader: () => (
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          פעולות
        </Typography>
      ),
      getActions: (params) => {
        const deliveryNote = params.row as DeliveryNote;
        const actions = [];

        // Edit action for draft and prepared orders
        if (canEdit(deliveryNote)) {
          actions.push(
            <GridActionsCellItem
              key="edit"
              icon={<EditIcon sx={{ fontSize: 20 }} />}
              label="עריכה"
              onClick={() => handleEdit(deliveryNote)}
            />
          );
        }

        // Status update actions
        if (canMarkInTransit(deliveryNote)) {
          actions.push(
            <GridActionsCellItem
              key="in-transit"
              icon={<RouteIcon sx={{ fontSize: 20 }} />}
              label="סמן כבדרך"
              onClick={() => handleStatusUpdate('InTransit', deliveryNote)}
            />
          );
        }

        if (canMarkAsDelivered(deliveryNote)) {
          actions.push(
            <GridActionsCellItem
              key="delivered"
              icon={<CheckCircleIcon sx={{ fontSize: 20 }} />}
              label="סמן כנמסר"
              onClick={() => handleStatusUpdate('Delivered', deliveryNote)}
            />
          );
        }

        // Print action
        actions.push(
          <GridActionsCellItem
            key="print"
            icon={<PrintIcon sx={{ fontSize: 20 }} />}
            label="הדפסה"
            onClick={() => handlePrint(deliveryNote)}
          />
        );

        // Email action
        actions.push(
          <GridActionsCellItem
            key="email"
            icon={<EmailIcon sx={{ fontSize: 20 }} />}
            label="שליחה במייל"
            onClick={() => handleEmail(deliveryNote)}
          />
        );

        // Cancel action
        if (canCancel(deliveryNote)) {
          actions.push(
            <GridActionsCellItem
              key="cancel"
              icon={<CancelIcon sx={{ fontSize: 20, color: 'error.main' }} />}
              label="ביטול"
              onClick={() => handleStatusUpdate('Cancelled', deliveryNote)}
            />
          );
        }

        // Delete action for draft and prepared orders
        if (canEdit(deliveryNote)) {
          actions.push(
            <GridActionsCellItem
              key="delete"
              icon={<DeleteIcon sx={{ fontSize: 20, color: 'error.main' }} />}
              label="מחיקה"
              onClick={() => {
                setSelectedDeliveryNote(deliveryNote);
                setDeleteDialogOpen(true);
              }}
            />
          );
        }

        return actions;
      },
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Box sx={{ 
        p: { xs: 3, md: 4 }, 
        backgroundColor: 'background.default',
        minHeight: '100vh'
      }} dir={isRTL ? 'rtl' : 'ltr'}>
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
            <ShippingIcon sx={{ fontSize: 40 }} />
            תעודות משלוח
          </Typography>
          
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              sx={buttonStyles.secondary}
            >
              רענן
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              disabled={loading}
              sx={buttonStyles.primary}
            >
              תעודת משלוח חדשה
            </Button>
          </Box>
        </Box>

        <Paper sx={paperStyles}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Filters */}
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={4}>
            <TextField
              placeholder="חיפוש תעודות משלוח..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              size="small"
              sx={{
                minWidth: 200,
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
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>סטטוס</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="סטטוס"
              >
                <SelectMenuItem value="">הכל</SelectMenuItem>
                <SelectMenuItem value="Draft">טיוטה</SelectMenuItem>
                <SelectMenuItem value="Prepared">מוכנה למשלוח</SelectMenuItem>
                <SelectMenuItem value="InTransit">בדרך</SelectMenuItem>
                <SelectMenuItem value="Delivered">נמסרה</SelectMenuItem>
                <SelectMenuItem value="Returned">הוחזרה</SelectMenuItem>
                <SelectMenuItem value="Cancelled">בוטלה</SelectMenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>לקוח</InputLabel>
              <Select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value as number | '')}
                label="לקוח"
              >
                <SelectMenuItem value="">הכל</SelectMenuItem>
                {customers.map((customer) => (
                  <SelectMenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectMenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="מתאריך"
              value={fromDate}
              onChange={setFromDate}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
            />

            <DatePicker
              label="עד תאריך"
              value={toDate}
              onChange={setToDate}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
            />

            <Button
              variant="outlined"
              onClick={handleClearFilters}
              startIcon={<FilterIcon />}
            >
              נקה מסננים
            </Button>
          </Box>

          {/* Data Grid */}
          <Box sx={enhancedDataGridStyles}>
            <DataGrid
              rows={deliveryNotes}
              columns={columns}
              loading={loading}
              pagination
              paginationMode="server"
              rowCount={totalCount}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationChange}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              localeText={{
                noRowsLabel: loading ? 'טוען...' : 'אין תעודות משלוח',
                paginationRowsPerPage: 'שורות בעמוד:',
              }}
            />
          </Box>
        </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} sx={dialogStyles}>
          <DialogTitle sx={{ 
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'text.primary',
            pb: 2
          }}>
            אישור מחיקה
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              האם אתה בטוח שברצונך למחוק את תעודת המשלוח{' '}
              {selectedDeliveryNote?.deliveryNoteNumber}?
              <br />
              פעולה זו אינה הפיכה.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              sx={buttonStyles.secondary}
            >
              ביטול
            </Button>
            <Button 
              onClick={handleDelete} 
              color="error" 
              variant="contained"
              sx={buttonStyles.primary}
            >
              מחק
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={Boolean(success)}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSuccess(null)} 
            severity="success" 
            sx={{ width: '100%' }}
          >
            {success}
          </Alert>
        </Snackbar>

        {/* Create Delivery Note Dialog */}
        <CreateDeliveryNoteDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={(deliveryNote) => {
            setSuccess(`תעודת משלוח ${deliveryNote.deliveryNoteNumber} נוצרה בהצלחה`);
            setCreateDialogOpen(false);
            loadDeliveryNotes(); // Refresh the list
          }}
          companyId={currentCompany?.id || 0}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default DeliveryNotesPage;
