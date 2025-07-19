// Quotes Page - עמוד הצעות מחיר
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Backdrop,
  TextField,
  InputAdornment
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem, type GridRowParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as CopyIcon,
  ShoppingCart as ConvertIcon,
  Search as SearchIcon,
  RequestQuote as QuoteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import type { Quote, QuoteStatus } from '../types/entities';
import { STATUS_LABELS, STATUS_COLORS } from '../types/salesDocuments';
import CreateQuoteDialog from '../components/quotes/CreateQuoteDialog';
import { useCompany } from '../hooks/useCompany';
import { useUIStore } from '../stores';
import { quotesApi } from '../services/quotesApi';
import { 
  paperStyles, 
  buttonStyles, 
  textFieldStyles, 
  dialogStyles 
} from '../styles/formStyles';

const QuotesPage: React.FC = () => {
  const { language } = useUIStore();
  const { company: currentCompany } = useCompany();

  // State
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Define DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'quoteNumber',
      headerName: language === 'he' ? 'מספר הצעה' : 'Quote Number',
      width: 150,
      cellClassName: 'font-weight-500'
    },
    {
      field: 'customerName',
      headerName: language === 'he' ? 'לקוח' : 'Customer',
      width: 200
    },
    {
      field: 'quoteDate',
      headerName: language === 'he' ? 'תאריך' : 'Date',
      width: 120,
      valueFormatter: (params) => format(new Date(params), 'dd/MM/yyyy', { locale: he })
    },
    {
      field: 'validUntil',
      headerName: language === 'he' ? 'תוקף עד' : 'Valid Until',
      width: 120,
      valueFormatter: (params) => params ? format(new Date(params), 'dd/MM/yyyy', { locale: he }) : '-'
    },
    {
      field: 'status',
      headerName: language === 'he' ? 'סטטוס' : 'Status',
      width: 120,
      renderCell: (params) => getStatusChip(params.value as QuoteStatus)
    },
    {
      field: 'totalAmount',
      headerName: language === 'he' ? 'סכום' : 'Amount',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 500 }}>
          ₪{params.value.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      field: 'currency',
      headerName: language === 'he' ? 'מטבע' : 'Currency',
      width: 80
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: language === 'he' ? 'פעולות' : 'Actions',
      width: 100,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          key="menu"
          icon={<MoreVertIcon />}
          label="Actions"
          onClick={(e) => handleActionMenuClick(e, params.row as Quote)}
        />
      ]
    }
  ];

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentCompany?.id) {
        setError(language === 'he' ? 'לא נמצאה חברה פעילה' : 'No active company found');
        return;
      }

      const quotesData = await quotesApi.getQuotes(currentCompany.id, {
        searchTerm: searchTerm || undefined
      });
      
      setQuotes(quotesData);
    } catch (err: unknown) {
      console.error('Error loading quotes:', err);
      
      // Check if it's a network error
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('Network Error') || errorMessage.includes('ECONNREFUSED')) {
        setError(language === 'he' 
          ? 'לא ניתן להתחבר לשרת. אנא בדוק שהשרת רץ.'
          : 'Cannot connect to server. Please check if the server is running.');
      } else {
        setError(language === 'he' ? 'שגיאה בטעינת הצעות המחיר' : 'Error loading quotes');
      }
    } finally {
      setLoading(false);
    }
  }, [currentCompany, language, searchTerm]);

  // Load quotes on mount
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleCreateQuote = async (quote: Quote) => {
    try {
      if (!currentCompany?.id) {
        setError(language === 'he' ? 'לא נמצאה חברה פעילה' : 'No active company found');
        return;
      }

      const createRequest = {
        customerId: quote.customerId,
        agentId: quote.agentId,
        quoteDate: quote.quoteDate.toISOString(),
        validUntil: quote.validUntil?.toISOString(),
        status: quote.status,
        currency: quote.currency,
        notes: quote.notes,
        terms: quote.terms,
        deliveryTerms: quote.deliveryTerms,
        paymentTerms: quote.paymentTerms,
        lines: quote.lines.map(line => ({
          itemId: line.itemId,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          taxRate: line.taxRate
        }))
      };

      const newQuote = await quotesApi.createQuote(createRequest, currentCompany.id);
      
      setQuotes([newQuote, ...quotes]);
      setSuccessMessage(language === 'he' ? 'הצעת המחיר נוצרה בהצלחה' : 'Quote created successfully');
    } catch (err) {
      console.error('Error creating quote:', err);
      setError(language === 'he' ? 'שגיאה ביצירת הצעת המחיר' : 'Error creating quote');
    }
  };

  const handleDeleteQuote = async () => {
    if (!selectedQuote || !currentCompany?.id) return;

    try {
      await quotesApi.deleteQuote(selectedQuote.id, currentCompany.id);
      
      setQuotes(quotes.filter(q => q.id !== selectedQuote.id));
      setDeleteDialogOpen(false);
      setSelectedQuote(null);
      setSuccessMessage(language === 'he' ? 'הצעת המחיר נמחקה בהצלחה' : 'Quote deleted successfully');
    } catch (err) {
      console.error('Error deleting quote:', err);
      setError(language === 'he' ? 'שגיאה במחיקת הצעת המחיר' : 'Error deleting quote');
    }
  };

  const handleConvertToOrder = async (quote: Quote) => {
    try {
      if (!currentCompany?.id) {
        setError(language === 'he' ? 'לא נמצאה חברה פעילה' : 'No active company found');
        return;
      }

      const result = await quotesApi.convertToSalesOrder(quote.id, currentCompany.id);
      
      setSuccessMessage(language === 'he' 
        ? `הצעת מחיר ${quote.quoteNumber} הומרה להזמנה מספר ${result.salesOrderId}` 
        : `Quote ${quote.quoteNumber} converted to order #${result.salesOrderId}`);
      
      // Update quote status to 'Converted'
      const updatedQuotes = quotes.map(q => 
        q.id === quote.id ? { ...q, status: 'Converted' as QuoteStatus } : q
      );
      setQuotes(updatedQuotes);
    } catch (err) {
      console.error('Error converting quote:', err);
      setError(language === 'he' ? 'שגיאה בהמרת הצעת המחיר' : 'Error converting quote');
    }
  };

  const handleDuplicateQuote = async (quote: Quote) => {
    try {
      if (!currentCompany?.id) {
        setError(language === 'he' ? 'לא נמצאה חברה פעילה' : 'No active company found');
        return;
      }

      const duplicatedQuote = await quotesApi.duplicateQuote(quote.id, currentCompany.id);
      
      setQuotes([duplicatedQuote, ...quotes]);
      setSuccessMessage(language === 'he' 
        ? `הצעת מחיר ${quote.quoteNumber} שוכפלה בהצלחה` 
        : `Quote ${quote.quoteNumber} duplicated successfully`);
    } catch (err) {
      console.error('Error duplicating quote:', err);
      setError(language === 'he' ? 'שגיאה בשכפול הצעת המחיר' : 'Error duplicating quote');
    }
  };

  // Update quotes list when search term changes
  useEffect(() => {
    if (currentCompany?.id) {
      loadQuotes();
    }
  }, [loadQuotes, searchTerm, currentCompany?.id]);

  const handleActionMenuClick = (event: React.MouseEvent<HTMLElement>, quote: Quote) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedQuote(quote);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedQuote(null);
  };

  const getStatusChip = (status: QuoteStatus) => {
    const label = STATUS_LABELS[status] || status;
    const color = STATUS_COLORS[status] || 'default';
    
    return (
      <Chip 
        label={label}
        color={color}
        size="small"
      />
    );
  };

  const canConvert = (quote: Quote) => {
    return quote.status === 'Accepted' || quote.status === 'Sent';
  };

  const canEdit = (quote: Quote) => {
    return quote.status === 'Draft' || quote.status === 'Sent';
  };

  if (loading) {
    return (
      <Backdrop 
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} 
        open={loading}
      >
        <Box sx={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: 300, 
          flexDirection: "column", 
          gap: 2 
        }}>
          <CircularProgress size={48} />
          <Typography variant="body1" color="inherit" sx={{ fontSize: '1.1rem' }}>
            {language === 'he' ? 'טוען הצעות מחיר...' : 'Loading quotes...'}
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  // Filtered quotes based on search term
  const filteredQuotes = quotes.filter(quote =>
    quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Text labels
  const labels = {
    title: language === 'he' ? 'הצעות מחיר' : 'Quotes',
    newQuote: language === 'he' ? 'הצעת מחיר חדשה' : 'New Quote',
    search: language === 'he' ? 'חיפוש הצעות מחיר...' : 'Search quotes...',
    refresh: language === 'he' ? 'רענן' : 'Refresh',
    view: language === 'he' ? 'הצג' : 'View',
    edit: language === 'he' ? 'ערוך' : 'Edit',
    duplicate: language === 'he' ? 'שכפל' : 'Duplicate',
    convertToOrder: language === 'he' ? 'המר להזמנה' : 'Convert to Order',
    print: language === 'he' ? 'הדפס' : 'Print',
    email: language === 'he' ? 'שלח במייל' : 'Send Email',
    downloadPDF: language === 'he' ? 'הורד PDF' : 'Download PDF',
    delete: language === 'he' ? 'מחק' : 'Delete',
    deleteConfirmTitle: language === 'he' ? 'מחיקת הצעת מחיר' : 'Delete Quote',
    deleteConfirmMessage: language === 'he' 
      ? 'האם אתה בטוח שברצונך למחוק את הצעת המחיר'
      : 'Are you sure you want to delete quote',
    deleteWarning: language === 'he' 
      ? 'פעולה זו לא ניתנת לביטול.'
      : 'This action cannot be undone.',
    cancel: language === 'he' ? 'ביטול' : 'Cancel'
  };

  return (
    <Box sx={{ 
      p: { xs: 3, md: 4 }, 
      backgroundColor: 'background.default',
      minHeight: '100vh'
    }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h3" sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 2,
          fontWeight: 600, 
          color: 'primary.main'
        }}>
          <QuoteIcon sx={{ fontSize: 40 }} />
          {labels.title}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadQuotes}
            sx={buttonStyles.secondary}
          >
            {labels.refresh}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={buttonStyles.primary}
          >
            {labels.newQuote}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper sx={{ ...paperStyles, mb: 3, p: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            placeholder={labels.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={textFieldStyles}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      {/* Quotes DataGrid */}
      <Paper sx={paperStyles}>
        <DataGrid
          rows={filteredQuotes}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          disableRowSelectionOnClick
          autoHeight
          localeText={{
            noRowsLabel: language === 'he' ? 'לא נמצאו הצעות מחיר' : 'No quotes found',
            toolbarFilters: language === 'he' ? 'מסננים' : 'Filters',
            toolbarFiltersLabel: language === 'he' ? 'הצג מסננים' : 'Show filters',
            toolbarDensity: language === 'he' ? 'צפיפות' : 'Density',
            toolbarDensityLabel: language === 'he' ? 'צפיפות' : 'Density',
            toolbarDensityCompact: language === 'he' ? 'קומפקטי' : 'Compact',
            toolbarDensityStandard: language === 'he' ? 'רגיל' : 'Standard',
            toolbarDensityComfortable: language === 'he' ? 'נוח' : 'Comfortable',
            toolbarColumns: language === 'he' ? 'עמודות' : 'Columns',
            toolbarColumnsLabel: language === 'he' ? 'בחר עמודות' : 'Select columns',
          }}
          sx={{
            height: 600,
            width: '100%',
            '& .MuiDataGrid-root': {
              borderRadius: 2,
              fontSize: '1rem',
              backgroundColor: 'background.paper',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: (theme) => theme.palette.mode === 'light' 
                ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)',
              '& .MuiDataGrid-columnHeaderTitle': {
                color: 'text.primary',
                fontWeight: 600,
              }
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: (theme) => theme.palette.mode === 'light'
                  ? 'rgba(25, 118, 210, 0.04)' : 'rgba(59, 130, 246, 0.08)',
              }
            },
            '& .font-weight-500': {
              fontWeight: 500
            },
            '& .MuiDataGrid-cell': {
              borderColor: (theme) => theme.palette.divider,
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            }
          }}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: (theme) => theme.palette.mode === 'light'
              ? '0 4px 20px rgba(0,0,0,0.1)'
              : '0 4px 20px rgba(0,0,0,0.3)',
          }
        }}
      >
        <MenuItem onClick={handleActionMenuClose}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{labels.view}</ListItemText>
        </MenuItem>
        
        {selectedQuote && canEdit(selectedQuote) && (
          <MenuItem onClick={handleActionMenuClose}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{labels.edit}</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          if (selectedQuote) {
            handleDuplicateQuote(selectedQuote);
          }
          handleActionMenuClose();
        }}>
          <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{labels.duplicate}</ListItemText>
        </MenuItem>
        
        {selectedQuote && canConvert(selectedQuote) && (
          <MenuItem onClick={() => {
            handleConvertToOrder(selectedQuote);
            handleActionMenuClose();
          }}>
            <ListItemIcon><ConvertIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{labels.convertToOrder}</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={handleActionMenuClose}>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{labels.print}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleActionMenuClose}>
          <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{labels.email}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleActionMenuClose}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{labels.downloadPDF}</ListItemText>
        </MenuItem>
        
        {selectedQuote && canEdit(selectedQuote) && (
          <MenuItem 
            onClick={() => {
              setDeleteDialogOpen(true);
              handleActionMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>{labels.delete}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Create Quote Dialog */}
      <CreateQuoteDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateQuote}
        companyId={currentCompany?.id || 1}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={dialogStyles}
      >
        <DialogTitle sx={{ 
          fontSize: '1.5rem', 
          fontWeight: 600, 
          color: 'text.primary', 
          pb: 2 
        }}>
          {labels.deleteConfirmTitle}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            {labels.deleteConfirmMessage} {selectedQuote?.quoteNumber}?
          </Typography>
          <Typography sx={{ 
            fontSize: '1rem', 
            color: 'text.secondary', 
            mt: 1,
            fontStyle: 'italic'
          }}>
            {labels.deleteWarning}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={buttonStyles.secondary}
          >
            {labels.cancel}
          </Button>
          <Button 
            onClick={handleDeleteQuote} 
            color="error" 
            variant="contained"
            sx={{
              ...buttonStyles.primary,
              backgroundColor: 'error.main',
              '&:hover': {
                backgroundColor: 'error.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(211, 47, 47, 0.4)',
              }
            }}
          >
            {labels.delete}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccessMessage(null)}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            fontSize: '1rem'
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuotesPage;
