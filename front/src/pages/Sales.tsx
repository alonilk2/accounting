import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Grid,
} from '@mui/material';

import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Assignment as QuoteIcon,
  CheckCircle as ConfirmedIcon,
  LocalShipping as ShippedIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useUIStore } from '../stores';
import { salesAPI, customersAPI } from '../services/api';
import type { SalesOrder, SalesOrderStatus, Customer, Company } from '../types/entities';
import SalesOrderForm from '../components/sales/SalesOrderForm';
import { PrintButton, PrintableSalesOrder } from '../components/print';
import { ModernButton, ModernFab } from '../components/ui';

const Sales = () => {
  const { language } = useUIStore();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<SalesOrderStatus>('Quote');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [company, setCompany] = useState<Company | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | ''>('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersData, customersData] = await Promise.all([
        salesAPI.getOrders({
          status: statusFilter || undefined,
        }),
        customersAPI.getAll(),
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
      
      // Load company data if not already loaded
      if (!company) {
        try {
          const companyData = {
            id: '1',
            name: 'החברה שלי',
            address: 'רחוב הראשי 123, תל אביב',
            israelTaxId: '123456789',
            phone: '03-1234567',
            email: 'info@mycompany.co.il',
            currency: 'ILS',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Company;
          setCompany(companyData);
        } catch (err) {
          console.warn('Could not load company data:', err);
        }
      }
    } catch (err) {
      setError('Failed to load sales orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, company]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleNewDocument = (documentType: SalesOrderStatus) => {
    setSelectedDocumentType(documentType);
    setShowForm(true);
  };

  const handleStatusChange = async (orderId: number, newStatus: SalesOrderStatus) => {
    try {
      await salesAPI.updateStatus(orderId, newStatus);
      await loadOrders(); // Refresh the list
    } catch (err) {
      setError('Failed to update order status');
      console.error('Error updating status:', err);
    }
  };

  const getPrintableOrderComponent = (order: SalesOrder) => {
    const customer = customers.find(c => c.id === order.customerId);
    if (!customer || !company) {
      return null;
    }

    return () => (
      <PrintableSalesOrder
        salesOrder={order}
        customer={customer}
        company={company}
      />
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'orderNumber',
      headerName: 'מספר הזמנה',
      width: 150,
      minWidth: 120,
    },
    {
      field: 'customerName',
      headerName: 'לקוח',
      width: 200,
      minWidth: 150,
      flex: 1,
    },
    {
      field: 'orderDate',
      headerName: 'תאריך',
      width: 120,
      minWidth: 100,
      valueFormatter: (value: unknown) => {
        if (value instanceof Date) {
          return value.toLocaleDateString('he-IL');
        }
        if (typeof value === 'string') {
          return new Date(value).toLocaleDateString('he-IL');
        }
        return '-';
      },
    },
    {
      field: 'dueDate',
      headerName: 'תאריך יעד',
      width: 120,
      minWidth: 100,
      valueFormatter: (value: unknown) => {
        if (!value) return '-';
        if (value instanceof Date) {
          return value.toLocaleDateString('he-IL');
        }
        if (typeof value === 'string') {
          return new Date(value).toLocaleDateString('he-IL');
        }
        return '-';
      },
    },
    {
      field: 'status',
      headerName: 'סטטוס',
      width: 180,
      minWidth: 140,
      renderCell: (params) => {
        const order = params.row as SalesOrder;
        return (
          <TextField
            select
            value={params.value}
            onChange={(e) => handleStatusChange(order.id, e.target.value as SalesOrderStatus)}
            size="small"
            variant="outlined"
            sx={{ minWidth: 120, width: '100%' }}
          >
            <MenuItem value="Quote">הצעת מחיר</MenuItem>
            <MenuItem value="Confirmed">הזמנה</MenuItem>
            <MenuItem value="Shipped">תעודת משלוח</MenuItem>
            <MenuItem value="Completed">הושלם</MenuItem>
            <MenuItem value="Cancelled">בוטל</MenuItem>
          </TextField>
        );
      },
    },
    {
      field: 'totalAmount',
      headerName: 'סכום כולל',
      width: 120,
      minWidth: 100,
      type: 'number',
      valueFormatter: (value: unknown) => `₪${Number(value).toLocaleString()}`,
    },
    {
      field: 'paidAmount',
      headerName: 'שולם',
      width: 120,
      minWidth: 100,
      type: 'number',
      valueFormatter: (value: unknown) => `₪${Number(value).toLocaleString()}`,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'פעולות',
      width: 260,
      minWidth: 240,
      renderCell: (params) => {
        const order = params.row as SalesOrder;
        const actions = [];

        actions.push({
          icon: <EditIcon />,
          label: "עריכה",
          onClick: () => {
            // TODO: Implement edit functionality
            console.log('Edit order:', order.id);
          }
        });

        // Add print button
        const PrintableComponent = getPrintableOrderComponent(order);
        if (PrintableComponent) {
          actions.push({
            icon: <PrintIcon />,
            label: "הדפס",
            onClick: () => {
              setSelectedOrder(order);
              setShowPrintDialog(true);
            }
          });
        }

        return (
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            alignItems: 'center',
            height: '100%',
            py: 0.5
          }}>
            {actions.map((action, index) => (
              <Box
                key={index}
                onClick={action.onClick}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  minWidth: '48px',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}
              >
                <Box sx={{ 
                  color: 'primary.main',
                  mb: 0.25,
                  fontSize: '16px',
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: 'primary.dark',
                  }
                }}>
                  {action.icon}
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '9px',
                    fontWeight: 500,
                    textAlign: 'center',
                    lineHeight: 1,
                    color: 'text.secondary',
                    transition: 'color 0.2s ease',
                    '&:hover': {
                      color: 'text.primary',
                    }
                  }}
                >
                  {action.label}
                </Typography>
              </Box>
            ))}
          </Box>
        );
      },
    },
  ];

  const statusOptions = [
    { value: '', label: 'כל הסטטוסים' },
    { value: 'Quote', label: 'הצעת מחיר' },
    { value: 'Confirmed', label: 'הזמנה' },
    { value: 'Shipped', label: 'תעודת משלוח' },
    { value: 'Completed', label: 'הושלם' },
    { value: 'Cancelled', label: 'בוטל' },
  ];

  if (showForm) {
    return (
      <SalesOrderForm
        onSave={() => {
          setShowForm(false);
          setSelectedDocumentType('Quote'); // Reset to default
          loadOrders();
        }}
        onCancel={() => {
          setShowForm(false);
          setSelectedDocumentType('Quote'); // Reset to default
        }}
        initialDocumentType={selectedDocumentType}
      />
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {language === 'he' ? 'מכירות' : 'Sales'}
        </Typography>
        <Box display="flex" gap={1}>
          <ModernButton
            variant="outline"
            icon={<RefreshIcon />}
            onClick={loadOrders}
            disabled={loading}
          >
            {language === 'he' ? 'רענן' : 'Refresh'}
          </ModernButton>
          
          {/* Document Type Buttons */}
          <Box display="flex" gap={1} sx={{ ml: 2 }}>
            <ModernButton
              variant="primary"
              icon={<QuoteIcon />}
              onClick={() => handleNewDocument('Quote')}
              sx={{ 
                backgroundColor: '#2196f3',
                '&:hover': { backgroundColor: '#1976d2' }
              }}
            >
              {language === 'he' ? 'הצעת מחיר' : 'Quote'}
            </ModernButton>
            
            <ModernButton
              variant="primary"
              icon={<ConfirmedIcon />}
              onClick={() => handleNewDocument('Confirmed')}
              sx={{ 
                backgroundColor: '#4caf50',
                '&:hover': { backgroundColor: '#388e3c' }
              }}
            >
              {language === 'he' ? 'הזמנה' : 'Confirmed'}
            </ModernButton>
            
            <ModernButton
              variant="primary"
              icon={<ShippedIcon />}
              onClick={() => handleNewDocument('Shipped')}
              sx={{ 
                backgroundColor: '#ff9800',
                '&:hover': { backgroundColor: '#f57c00' }
              }}
            >
              {language === 'he' ? 'תעודת משלוח' : 'Shipped'}
            </ModernButton>
          </Box>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {language === 'he' ? 'סינון' : 'Filters'}
          </Typography>
          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} alignItems="center">
            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <TextField
                select
                label="סטטוס"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SalesOrderStatus | '')}
                fullWidth
                size="small"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <DatePicker
                label="מתאריך"
                value={dateFrom}
                onChange={setDateFrom}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <DatePicker
                label="עד תאריך"
                value={dateTo}
                onChange={setDateTo}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <ModernButton
                variant="ghost"
                onClick={() => {
                  setStatusFilter('');
                  setDateFrom(null);
                  setDateTo(null);
                }}
                fullWidth
              >
                נקה סינון
              </ModernButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent>
          <DataGrid
            rows={orders}
            columns={columns}
            loading={loading}
            autoHeight
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            sx={{
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'background.paper',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-actionsCell': {
                gap: '4px',
                justifyContent: 'flex-start',
                paddingLeft: '8px',
                paddingRight: '8px',
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiDataGrid-actionsCell .MuiButtonBase-root': {
                minWidth: '32px',
                minHeight: '32px',
                padding: '4px',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Print Dialog */}
      {selectedOrder && (
        <Dialog
          open={showPrintDialog}
          onClose={() => {
            setShowPrintDialog(false);
            setSelectedOrder(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            הדפסת מסמך - הזמנה {selectedOrder.orderNumber}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                בחר את פעולת ההדפסה הרצויה:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                {(() => {
                  const PrintableComponent = getPrintableOrderComponent(selectedOrder);
                  if (!PrintableComponent) {
                    return (
                      <Typography color="error">
                        לא ניתן להדפיס את המסמך - חסרים נתונים
                      </Typography>
                    );
                  }

                  return (
                    <>
                      <PrintButton
                        variant="contained"
                        size="large"
                        printableContent={PrintableComponent}
                        documentTitle={`הזמנה-${selectedOrder.orderNumber}`}
                        onAfterPrint={() => {
                          setShowPrintDialog(false);
                          setSelectedOrder(null);
                        }}
                      >
                        הדפס הזמנה
                      </PrintButton>
                    </>
                  );
                })()}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <ModernButton 
              variant="ghost" 
              onClick={() => {
                setShowPrintDialog(false);
                setSelectedOrder(null);
              }}
            >
              סגור
            </ModernButton>
          </DialogActions>
        </Dialog>
      )}

      {/* Floating Action Button for Quick Add */}
      <ModernFab
        variant="ai"
        icon={<AddIcon />}
        tooltip="הזמנה חדשה"
        onClick={() => setShowForm(true)}
        glow
        pulse
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      />
    </Box>
  );
};

export default Sales;
