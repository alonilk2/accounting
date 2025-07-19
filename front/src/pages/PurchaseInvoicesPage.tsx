import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Backdrop,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Payment as PaymentIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useUIStore } from '../stores';
import { purchaseInvoicesAPI, suppliersAPI } from '../services/api';
import { PurchaseInvoiceDialog } from '../components/purchasing/PurchaseInvoiceDialog';
import type { PurchaseInvoice, PurchaseInvoiceStatus, Supplier } from '../types/entities';
import { textFieldStyles, paperStyles, dataGridStyles, buttonStyles } from '../styles/formStyles';

const PurchaseInvoicesPage: React.FC = () => {
  const { language } = useUIStore();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<PurchaseInvoiceStatus | ''>('');
  const [supplierFilter, setSupplierFilter] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        ...(statusFilter && { status: statusFilter }),
        ...(supplierFilter && { supplierId: supplierFilter }),
        ...(searchTerm && { searchTerm })
      };
      const data = await purchaseInvoicesAPI.getAll(filters);
      setInvoices(data);
    } catch (err) {
      setError(language === 'he' ? 'שגיאה בטעינת חשבוניות הרכש' : 'Error loading purchase invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, supplierFilter, searchTerm, language]);

  useEffect(() => {
    fetchInvoices();
    fetchSuppliers();
  }, [fetchInvoices]);

  const fetchSuppliers = async () => {
    try {
      const data = await suppliersAPI.getAll();
      setSuppliers(data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const handleCreate = () => {
    setSelectedInvoice(null);
    setShowDialog(true);
  };

  const handleEdit = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setShowDialog(true);
  };

  const handleSave = async () => {
    setShowDialog(false);
    await fetchInvoices();
    setSnackbar({
      open: true,
      message: language === 'he' ? 'חשבונית הרכש נשמרה בהצלחה' : 'Purchase invoice saved successfully',
      severity: 'success'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    fetchInvoices();
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusChip = (status: PurchaseInvoiceStatus) => {
    const statusConfig = {
      Draft: { 
        label: language === 'he' ? 'טיוטה' : 'Draft', 
        color: 'default' as const 
      },
      Received: { 
        label: language === 'he' ? 'התקבלה' : 'Received', 
        color: 'primary' as const 
      },
      Approved: { 
        label: language === 'he' ? 'מאושרת' : 'Approved', 
        color: 'info' as const 
      },
      Paid: { 
        label: language === 'he' ? 'שולמה' : 'Paid', 
        color: 'success' as const 
      },
      Cancelled: { 
        label: language === 'he' ? 'בוטלה' : 'Cancelled', 
        color: 'error' as const 
      },
    };

    const config = statusConfig[status];
    return (
      <Chip
        label={config?.label}
        color={config?.color}
        size="small"
        sx={{ fontSize: '0.875rem', fontWeight: 500, borderRadius: 2 }}
      />
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'internalReferenceNumber',
      headerName: language === 'he' ? 'מספר פנימי' : 'Internal Number',
      width: 150,
      sortable: true
    },
    {
      field: 'supplierInvoiceNumber',
      headerName: language === 'he' ? 'מספר ספק' : 'Supplier Number',
      width: 150,
      sortable: true
    },
    {
      field: 'supplierName',
      headerName: language === 'he' ? 'ספק' : 'Supplier',
      width: 200,
      sortable: true
    },
    {
      field: 'invoiceDate',
      headerName: language === 'he' ? 'תאריך חשבונית' : 'Invoice Date',
      width: 130,
      type: 'date',
      valueGetter: (_value, row: PurchaseInvoice) => new Date(row.invoiceDate)
    },
    {
      field: 'dueDate',
      headerName: language === 'he' ? 'תאריך פירעון' : 'Due Date',
      width: 130,
      type: 'date',
      valueGetter: (_value, row: PurchaseInvoice) => row.dueDate ? new Date(row.dueDate) : null
    },
    {
      field: 'status',
      headerName: language === 'he' ? 'סטטוס' : 'Status',
      width: 120,
      renderCell: (params) => getStatusChip(params.value as PurchaseInvoiceStatus)
    },
    {
      field: 'totalAmount',
      headerName: language === 'he' ? 'סכום כולל' : 'Total Amount',
      width: 130,
      type: 'number',
      valueFormatter: (value: number) => `₪${value?.toLocaleString()}`
    },
    {
      field: 'paidAmount',
      headerName: language === 'he' ? 'סכום ששולם' : 'Paid Amount',
      width: 130,
      type: 'number',
      valueFormatter: (value: number) => `₪${value?.toLocaleString()}`
    },
    {
      field: 'remainingAmount',
      headerName: language === 'he' ? 'יתרה' : 'Remaining',
      width: 130,
      type: 'number',
      valueFormatter: (value: number) => `₪${value?.toLocaleString()}`
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: language === 'he' ? 'פעולות' : 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label={language === 'he' ? 'ערוך' : 'Edit'}
          onClick={() => handleEdit(params.row)}
        />,
        <GridActionsCellItem
          icon={<PaymentIcon />}
          label={language === 'he' ? 'תשלום' : 'Payment'}
          onClick={() => {/* TODO: Add payment dialog */}}
          disabled={params.row.isFullyPaid}
        />,
        <GridActionsCellItem
          icon={<PrintIcon />}
          label={language === 'he' ? 'הדפס' : 'Print'}
          onClick={() => handlePrint()}
        />
      ]
    }
  ];

  return (
    <Box sx={{ 
      p: { xs: 3, md: 4 }, 
      backgroundColor: 'background.default',
      minHeight: '100vh'
    }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h3" sx={{ 
          display: "flex", alignItems: "center", gap: 2,
          fontWeight: 600, color: 'primary.main'
        }}>
          <ReceiptIcon sx={{ fontSize: 40 }} />
          {language === 'he' ? 'חשבוניות רכש' : 'Purchase Invoices'}
        </Typography>
        <Box display="flex" gap={2}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh}
            sx={buttonStyles.secondary}
          >
            {language === 'he' ? 'רענן' : 'Refresh'}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleCreate}
            sx={buttonStyles.primary}
          >
            {language === 'he' ? 'הוסף חשבונית רכש' : 'Add Purchase Invoice'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ ...paperStyles, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {language === 'he' ? 'סינון תוצאות' : 'Filter Results'}
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
            gap: 3 
          }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={language === 'he' ? 'חיפוש...' : 'Search...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={textFieldStyles}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            
            <FormControl fullWidth variant="outlined">
              <InputLabel>{language === 'he' ? 'סטטוס' : 'Status'}</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PurchaseInvoiceStatus | '')}
                label={language === 'he' ? 'סטטוס' : 'Status'}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">
                  {language === 'he' ? 'הכל' : 'All'}
                </MenuItem>
                <MenuItem value="Draft">
                  {language === 'he' ? 'טיוטה' : 'Draft'}
                </MenuItem>
                <MenuItem value="Received">
                  {language === 'he' ? 'התקבלה' : 'Received'}
                </MenuItem>
                <MenuItem value="Approved">
                  {language === 'he' ? 'מאושרת' : 'Approved'}
                </MenuItem>
                <MenuItem value="Paid">
                  {language === 'he' ? 'שולמה' : 'Paid'}
                </MenuItem>
                <MenuItem value="Cancelled">
                  {language === 'he' ? 'בוטלה' : 'Cancelled'}
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <InputLabel>{language === 'he' ? 'ספק' : 'Supplier'}</InputLabel>
              <Select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value as number | '')}
                label={language === 'he' ? 'ספק' : 'Supplier'}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">
                  {language === 'he' ? 'הכל' : 'All'}
                </MenuItem>
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Data Grid */}
      <Paper sx={paperStyles}>
        <DataGrid
          rows={invoices}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'invoiceDate', sort: 'desc' }] }
          }}
          disableRowSelectionOnClick
          sx={dataGridStyles}
        />
      </Paper>

      {/* Loading Backdrop */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <Box sx={{ 
          display: "flex", justifyContent: "center", alignItems: "center", 
          minHeight: 300, flexDirection: "column", gap: 2 
        }}>
          <CircularProgress size={48} />
          <Typography variant="body1" color="inherit" sx={{ fontSize: '1.1rem' }}>
            {language === 'he' ? 'טוען...' : 'Loading...'}
          </Typography>
        </Box>
      </Backdrop>

      {/* Purchase Invoice Dialog */}
      <PurchaseInvoiceDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onSave={handleSave}
        invoice={selectedInvoice}
      />

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

export default PurchaseInvoicesPage;
