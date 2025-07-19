import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Fab
} from '@mui/material';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Receipt as ReceiptIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  FilterList as FilterIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useRTL } from '../hooks/useRTL';
import { salesDocumentsService } from '../services/salesDocumentsService';
import type { 
  SalesDocument, 
  DocumentsFilter, 
  DocumentType
} from '../types/salesDocuments';
import { STATUS_LABELS, STATUS_COLORS } from '../types/salesDocuments';
import { textFieldStyles, paperStyles, buttonStyles } from '../styles/formStyles';
import { enhancedDataGridStyles } from '../styles/enhancedStyles';

// Email Dialog Component
interface EmailDialogProps {
  open: boolean;
  document: SalesDocument | null;
  onClose: () => void;
  onSend: (email: string) => void;
}

const EmailDialog: React.FC<EmailDialogProps> = ({ open, document, onClose, onSend }) => {
  const [email, setEmail] = useState('');

  const handleSend = () => {
    if (email.trim()) {
      onSend(email.trim());
      setEmail('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>שליחת מסמך במייל</DialogTitle>
      <DialogContent>
        {document && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              מסמך: {document.type} {document.number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              לקוח: {document.customerName}
            </Typography>
          </Box>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="כתובת מייל"
          type="email"
          fullWidth
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ borderRadius: 3 }}>
          ביטול
        </Button>
        <Button 
          onClick={handleSend} 
          variant="contained" 
          disabled={!email.trim()}
          sx={{ 
            borderRadius: 3,
            px: 3,
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          שלח
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SalesDocumentsPage: React.FC = () => {
  const { formatCurrency, formatDate } = useRTL();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<SalesDocument[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25
  });
  const [filters, setFilters] = useState<DocumentsFilter>({
    fromDate: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    toDate: new Date() // Today
  });
  const [showFilters, setShowFilters] = useState(false);
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; document: SalesDocument | null }>({
    open: false,
    document: null
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load documents
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filtersWithPagination = {
        ...filters,
        page: paginationModel.page,
        pageSize: paginationModel.pageSize
      };
      
      const response = await salesDocumentsService.getPaginatedSalesDocuments(filtersWithPagination);
      setDocuments(response.documents);
      setTotalCount(response.totalCount);
      setTotalAmount(response.totalAmount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת המסמכים');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, paginationModel]);

  // Load documents on mount and when filters or pagination change
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle document actions
  const handlePrint = async (document: SalesDocument) => {
    try {
      // TODO: Implement print functionality
      console.log('Printing document:', document);
      setSnackbar({ open: true, message: 'המסמך נשלח להדפסה', severity: 'success' });
    } catch (err) {
      console.error('Error printing document:', err);
      setSnackbar({ open: true, message: 'שגיאה בהדפסת המסמך', severity: 'error' });
    }
  };

  const handleExportPdf = async (document: SalesDocument) => {
    try {
      // TODO: Implement PDF export functionality
      console.log('Exporting PDF for document:', document);
      setSnackbar({ open: true, message: 'המסמך יוצא כ-PDF', severity: 'success' });
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setSnackbar({ open: true, message: 'שגיאה ביצוא PDF', severity: 'error' });
    }
  };

  const handleGenerateReceipt = async (document: SalesDocument) => {
    try {
      await salesDocumentsService.generateReceipt(document);
      await loadDocuments(); // Refresh the data
      setSnackbar({ open: true, message: 'קבלה נוצרה בהצלחה', severity: 'success' });
    } catch (err) {
      console.error('Error generating receipt:', err);
      setSnackbar({ open: true, message: 'שגיאה ביצירת הקבלה', severity: 'error' });
    }
  };

  const handleCancel = async (document: SalesDocument) => {
    if (window.confirm('האם אתה בטוח שברצונך לבטל את המסמך?')) {
      try {
        await salesDocumentsService.cancelDocument(document);
        await loadDocuments(); // Refresh the data
        setSnackbar({ open: true, message: 'המסמך בוטל בהצלחה', severity: 'success' });
      } catch (err) {
        console.error('Error cancelling document:', err);
        setSnackbar({ open: true, message: 'שגיאה בביטול המסמך', severity: 'error' });
      }
    }
  };

  const handleEmail = async (document: SalesDocument) => {
    try {
      setEmailDialog({ open: true, document });
    } catch (err) {
      console.error('Error opening email dialog:', err);
    }
  };

  const handleSendEmail = async (email: string) => {
    if (emailDialog.document) {
      try {
        await salesDocumentsService.sendByEmail(emailDialog.document, email);
        setEmailDialog({ open: false, document: null });
        setSnackbar({ open: true, message: 'המסמך נשלח במייל בהצלחה', severity: 'success' });
      } catch (err) {
        console.error('Error sending email:', err);
        setSnackbar({ open: true, message: 'שגיאה בשליחת המייל', severity: 'error' });
      }
    }
  };

  // Get document type display name
  const getDocumentTypeDisplay = (type: DocumentType): string => {
    switch (type) {
      case 'SalesOrder': return 'הזמנה';
      case 'Invoice': return 'חשבונית מס';
      case 'TaxInvoiceReceipt': return 'חשבונית מס-קבלה';
      case 'Receipt': return 'קבלה';
      default: return type;
    }
  };

  // Get status chip color
  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status] || 'default';
  };

  // Define DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'type',
      headerName: 'סוג',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={getDocumentTypeDisplay(params.value)}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'number',
      headerName: 'מספר',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}
        </Typography>
      )
    },
    {
      field: 'date',
      headerName: 'תאריך',
      width: 120,
      type: 'date',
      valueFormatter: (params) => formatDate(params)
    },
    {
      field: 'customerName',
      headerName: 'לקוח',
      width: 200,
      flex: 1
    },
    {
      field: 'amount',
      headerName: 'סכום',
      width: 120,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'סטטוס',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={STATUS_LABELS[params.value] || params.value}
          size="small"
          color={getStatusColor(params.value)}
          variant="outlined"
        />
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'פעולות',
      width: 200,
      getActions: (params: GridRowParams) => {
        const row = params.row as SalesDocument;
        const actions = [];

        if (row.canPrint) {
          actions.push(
            <GridActionsCellItem
              key="print"
              icon={<PrintIcon />}
              label="הדפס"
              onClick={() => handlePrint(row)}
              showInMenu
            />
          );
        }

        if (row.canExportPdf) {
          actions.push(
            <GridActionsCellItem
              key="pdf"
              icon={<PdfIcon />}
              label="יצא ל-PDF"
              onClick={() => handleExportPdf(row)}
              showInMenu
            />
          );
        }

        if (row.canGenerateReceipt) {
          actions.push(
            <GridActionsCellItem
              key="receipt"
              icon={<ReceiptIcon />}
              label="צור קבלה"
              onClick={() => handleGenerateReceipt(row)}
              showInMenu
            />
          );
        }

        if (row.canEmail) {
          actions.push(
            <GridActionsCellItem
              key="email"
              icon={<EmailIcon />}
              label="שלח במייל"
              onClick={() => handleEmail(row)}
              showInMenu
            />
          );
        }

        if (row.canCancel) {
          actions.push(
            <GridActionsCellItem
              key="cancel"
              icon={<CancelIcon />}
              label="בטל"
              onClick={() => handleCancel(row)}
              showInMenu
            />
          );
        }

        return actions;
      }
    }
  ];

  // Render filters
  const renderFilters = () => (
    <Box sx={paperStyles}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FilterIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography 
          variant="h5"
          sx={{ 
            fontWeight: 600,
            color: 'text.primary'
          }}
        >
          סינון מסמכים
        </Typography>
      </Box>
      
      <Grid container spacing={{ xs: 3, md: 4 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        <Grid size={{ xs: 4, sm: 4, md: 3 }}>
          <TextField
            fullWidth
            label="מתאריך"
            type="date"
            value={filters.fromDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => setFilters((prev: DocumentsFilter) => ({
              ...prev,
              fromDate: e.target.value ? new Date(e.target.value) : undefined
            }))}
            InputLabelProps={{ shrink: true }}
            sx={textFieldStyles}
          />
        </Grid>
        
        <Grid size={{ xs: 4, sm: 4, md: 3 }}>
          <TextField
            fullWidth
            label="עד תאריך"
            type="date"
            value={filters.toDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => setFilters((prev: DocumentsFilter) => ({
              ...prev,
              toDate: e.target.value ? new Date(e.target.value) : undefined
            }))}
            InputLabelProps={{ shrink: true }}
            sx={textFieldStyles}
          />
        </Grid>
        
        <Grid size={{ xs: 4, sm: 4, md: 3 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ fontSize: '1rem' }}>סוג מסמך</InputLabel>
            <Select
              value={filters.documentType || ''}
              onChange={(e) => setFilters((prev: DocumentsFilter) => ({
                ...prev,
                documentType: e.target.value as DocumentType || undefined
              }))}
              label="סוג מסמך"
              sx={{
                borderRadius: 2,
                fontSize: '1.1rem'
              }}
            >
              <MenuItem value="" sx={{ fontSize: '1rem' }}>הכל</MenuItem>
              <MenuItem value="SalesOrder" sx={{ fontSize: '1rem' }}>הזמנות מכירה</MenuItem>
              <MenuItem value="Invoice" sx={{ fontSize: '1rem' }}>חשבוניות מס</MenuItem>
              <MenuItem value="TaxInvoiceReceipt" sx={{ fontSize: '1rem' }}>חשבוניות מס-קבלה</MenuItem>
              <MenuItem value="Receipt" sx={{ fontSize: '1rem' }}>קבלות</MenuItem>
              <MenuItem value="DeliveryNote" sx={{ fontSize: '1rem' }}>תעודות משלוח</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid size={{ xs: 4, sm: 4, md: 3 }}>
          <TextField
            fullWidth
            label="מספר מסמך"
            value={filters.searchTerm || ''}
            onChange={(e) => setFilters((prev: DocumentsFilter) => ({
              ...prev,
              searchTerm: e.target.value || undefined
            }))}
            sx={textFieldStyles}
          />
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ 
      p: { xs: 3, md: 4 }, 
      backgroundColor: 'background.default',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
          <DescriptionIcon sx={{ fontSize: 40 }} />
          מסמכי מכירות
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={buttonStyles.secondary}
          >
            {showFilters ? 'הסתר מסננים' : 'הצג מסננים'}
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadDocuments}
            disabled={loading}
            sx={buttonStyles.primary}
          >
            רענן
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      {totalCount > 0 && (
        <Grid container spacing={{ xs: 3, md: 4 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 4 }}>
          <Grid size={{ xs: 4, sm: 4, md: 3 }}>
            <Card variant="outlined" sx={{ 
              borderRadius: 2,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transform: 'translateY(-1px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: '1rem', mb: 1 }}
                >
                  סה"כ מסמכים
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ fontWeight: 600 }}
                >
                  {totalCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 4, sm: 4, md: 3 }}>
            <Card variant="outlined" sx={{ 
              borderRadius: 2,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transform: 'translateY(-1px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: '1rem', mb: 1 }}
                >
                  סכום כולל
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ fontWeight: 600 }}
                >
                  {formatCurrency(totalAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      {showFilters && renderFilters()}

      {/* Loading */}
      {loading && (
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
            טוען נתונים...
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* DataGrid */}
      {!loading && !error && (
        <Box sx={paperStyles}>
          <DataGrid
            rows={documents}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowCount={totalCount}
            paginationMode="server"
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            autoHeight
            sx={enhancedDataGridStyles}
            localeText={{
              // Hebrew localization for DataGrid
              noRowsLabel: 'לא נמצאו מסמכים',
              noResultsOverlayLabel: 'לא נמצאו תוצאות',
              footerRowSelected: (count) =>
                count !== 1
                  ? `${count.toLocaleString()} שורות נבחרו`
                  : `${count.toLocaleString()} שורה נבחרה`,
              footerTotalRows: 'סה"כ שורות:',
              footerTotalVisibleRows: (visibleCount, totalCount) =>
                `${visibleCount.toLocaleString()} מתוך ${totalCount.toLocaleString()}`,
            }}
          />
        </Box>
      )}

      {/* Email Dialog */}
      <EmailDialog
        open={emailDialog.open}
        document={emailDialog.document}
        onClose={() => setEmailDialog({ open: false, document: null })}
        onSend={handleSendEmail}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Quick Actions */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => window.open('/sales', '_blank')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default SalesDocumentsPage;
