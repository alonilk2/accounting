import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  TablePagination,
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
  ListItemIcon,
  ListItemText,
  useTheme,
  Divider
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
  LocalShipping as ShippingIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Route as RouteIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';

import { deliveryNotesApi } from '../services/deliveryNotesApi';
import { customersApi } from '../services/customersApi';
import type { DeliveryNote, Customer } from '../types/entities';
import { useAuthStore } from '../stores';

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // UI State
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState<DeliveryNote | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
        page + 1,
        rowsPerPage
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
  }, [currentCompany, customerFilter, statusFilter, fromDate, toDate, searchTerm, page, rowsPerPage]);

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

  // Action handlers
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, deliveryNote: DeliveryNote) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedDeliveryNote(deliveryNote);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedDeliveryNote(null);
  };

  const handleEdit = (deliveryNote: DeliveryNote) => {
    // TODO: Implement edit functionality
    console.log('Edit delivery note:', deliveryNote.id);
    setSuccess(`עריכת תעודת משלוח ${deliveryNote.deliveryNoteNumber}`);
    handleActionMenuClose();
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

  const handleStatusUpdate = async (status: 'Draft' | 'Prepared' | 'InTransit' | 'Delivered' | 'Returned' | 'Cancelled') => {
    if (!selectedDeliveryNote) return;

    try {
      await deliveryNotesApi.updateDeliveryNoteStatus(
        selectedDeliveryNote.id,
        status,
        currentCompany?.id || 1,
        status === 'Delivered' ? {
          actualDeliveryTime: new Date(),
          receivedAt: new Date()
        } : undefined
      );
      
      setSuccess(`סטטוס תעודת משלוח ${selectedDeliveryNote.deliveryNoteNumber} עודכן ל${getStatusLabel(status)}`);
      handleActionMenuClose();
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
    handleActionMenuClose();
  };

  const handleEmail = (deliveryNote: DeliveryNote) => {
    // TODO: Implement email functionality
    console.log('Email delivery note:', deliveryNote.id);
    setSuccess(`שליחת תעודת משלוח ${deliveryNote.deliveryNoteNumber} במייל`);
    handleActionMenuClose();
  };

  // Filter handlers
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCustomerFilter('');
    setFromDate(null);
    setToDate(null);
    setPage(0);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  if (loading && deliveryNotes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>טוען תעודות משלוח...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Box p={3} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            <ShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            תעודות משלוח
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            size="large"
          >
            תעודת משלוח חדשה
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              placeholder="חיפוש תעודות משלוח..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
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
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>מספר תעודה</TableCell>
                <TableCell>לקוח</TableCell>
                <TableCell>תאריך משלוח</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell>כתובת משלוח</TableCell>
                <TableCell>נהג</TableCell>
                <TableCell>כמות כוללת</TableCell>
                <TableCell align="center">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deliveryNotes.map((deliveryNote) => (
                <TableRow key={deliveryNote.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight="medium">
                        {deliveryNote.deliveryNoteNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      {deliveryNote.customerName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <TodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      {deliveryNote.deliveryDate.toLocaleDateString('he-IL')}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(deliveryNote.status)}
                      color={getStatusColor(deliveryNote.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap>
                        {deliveryNote.deliveryAddress || 'לא צוין'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {deliveryNote.driverName || 'לא צוין'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {deliveryNote.totalQuantity}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleActionMenuOpen(e, deliveryNote)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="שורות בעמוד:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        />

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionMenuClose}
        >
          {selectedDeliveryNote && canEdit(selectedDeliveryNote) && (
            <MenuItem onClick={() => handleEdit(selectedDeliveryNote)}>
              <ListItemIcon><EditIcon /></ListItemIcon>
              <ListItemText>עריכה</ListItemText>
            </MenuItem>
          )}

          {selectedDeliveryNote && canMarkInTransit(selectedDeliveryNote) && (
            <MenuItem onClick={() => handleStatusUpdate('InTransit')}>
              <ListItemIcon><RouteIcon /></ListItemIcon>
              <ListItemText>סמן כבדרך</ListItemText>
            </MenuItem>
          )}

          {selectedDeliveryNote && canMarkAsDelivered(selectedDeliveryNote) && (
            <MenuItem onClick={() => handleStatusUpdate('Delivered')}>
              <ListItemIcon><CheckCircleIcon /></ListItemIcon>
              <ListItemText>סמן כנמסר</ListItemText>
            </MenuItem>
          )}

          <Divider />

          <MenuItem onClick={() => selectedDeliveryNote && handlePrint(selectedDeliveryNote)}>
            <ListItemIcon><PrintIcon /></ListItemIcon>
            <ListItemText>הדפסה</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => selectedDeliveryNote && handleEmail(selectedDeliveryNote)}>
            <ListItemIcon><EmailIcon /></ListItemIcon>
            <ListItemText>שליחה במייל</ListItemText>
          </MenuItem>

          <Divider />

          {selectedDeliveryNote && canCancel(selectedDeliveryNote) && (
            <MenuItem 
              onClick={() => handleStatusUpdate('Cancelled')}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon><CancelIcon color="error" /></ListItemIcon>
              <ListItemText>ביטול</ListItemText>
            </MenuItem>
          )}

          {selectedDeliveryNote && canEdit(selectedDeliveryNote) && (
            <MenuItem 
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
              <ListItemText>מחיקה</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>אישור מחיקה</DialogTitle>
          <DialogContent>
            <DialogContentText>
              האם אתה בטוח שברצונך למחוק את תעודת המשלוח{' '}
              {selectedDeliveryNote?.deliveryNoteNumber}?
              <br />
              פעולה זו אינה הפיכה.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              מחק
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={Boolean(success)}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          message={success}
        />

        {/* TODO: Add Create/Edit Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>תעודת משלוח חדשה</DialogTitle>
          <DialogContent>
            <DialogContentText>
              פונקציונליות יצירת תעודת משלוח תתווסף בקרוב...
              <br />
              API: /api/delivery-notes
              <br />
              הטופס יכלול:
              <br />
              • בחירת לקוח
              <br />
              • פרטי משלוח (כתובת, תאריך, נהג)
              <br />
              • רשימת פריטים למשלוח
              <br />
              • הערות והוראות משלוח
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>סגור</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                setSuccess('תעודת משלוח דוגמא נוצרה בהצלחה');
                setCreateDialogOpen(false);
              }}
            >
              צור תעודה (דוגמא)
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default DeliveryNotesPage;
