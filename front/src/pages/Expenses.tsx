import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Chip,
  InputAdornment,
  Alert,
  Tooltip,
  Stack,
  Grid,
  Card,
  CardContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Scanner as ScanIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../utils/format.ts';
import type { DocumentScanResponse } from '../types/documentScan';
import { 
  expensesApi, 
  type Expense, 
  type ExpenseFilters, 
  type ExpenseSummary,
  type ExpenseCategory,
  type ExpenseStatus,
  EXPENSE_STATUSES,
  ExpenseCategoryNames,
  ExpenseStatusNames
} from '../services/expensesService';
import { useUIStore } from '../stores/index.ts';
import { 
  textFieldStyles, 
  paperStyles, 
  dataGridStyles, 
  buttonStyles,
  cardStyles 
} from '../styles/formStyles';
import ExpenseCreateDialog from '../components/expenses/ExpenseCreateDialog';
import ExpenseEditDialog from '../components/expenses/ExpenseEditDialog';
import DocumentScanDialog from '../components/DocumentScanDialog';

const ExpensesPage: React.FC = () => {
  const { language } = useUIStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [scanResult, setScanResult] = useState<DocumentScanResponse | null>(null);

  // Handle scan completion
  const handleScanComplete = (result: DocumentScanResponse) => {
    setScanResult(result);
    setShowScanDialog(false);
    setShowReviewDialog(true);
  };

  // Handle expense created from scan
  const handleExpenseCreatedFromScan = (expenseId: number) => {
    setShowReviewDialog(false);
    setScanResult(null);
    loadExpenses(); // Refresh the list
    loadSummary();
    console.log('Expense created from scan with ID:', expenseId);
  };
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Filters
  const [filters, setFilters] = useState<ExpenseFilters>({
    page: 1,
    pageSize: pageSize,
    sortBy: 'expenseDate',
    sortDirection: 'desc'
  });

  // Load expenses
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await expensesApi.getExpenses({
        ...filters,
        page: currentPage,
        pageSize: pageSize
      });
      
      setExpenses(response.data);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(language === 'he' ? 'שגיאה בטעינת ההוצאות' : 'Error loading expenses');
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize, language]);

  // Load summary
  const loadSummary = async () => {
    try {
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 12);
      const toDate = new Date();
      
      const summaryData = await expensesApi.getExpenseSummary(
        fromDate.toISOString().split('T')[0],
        toDate.toISOString().split('T')[0]
      );
      
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  };

  useEffect(() => {
    loadExpenses();
    loadSummary();
  }, [currentPage, filters, loadExpenses]);

  // Filter handlers
  const handleFilterChange = (newFilters: Partial<ExpenseFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Handle successful expense creation
  const handleExpenseCreated = () => {
    loadExpenses();
    loadSummary();
    setShowCreateDialog(false);
  };

  // Handle edit expense
  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowEditDialog(true);
  };

  // Handle successful expense edit
  const handleExpenseUpdated = () => {
    loadExpenses();
    loadSummary();
    setShowEditDialog(false);
    setSelectedExpense(null);
  };

  // CRUD operations would be implemented here when modals are added
  
  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm(language === 'he' ? 'האם אתה בטוח שברצונך למחוק הוצאה זו?' : 'Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expensesApi.deleteExpense(expenseId);
      loadExpenses();
      loadSummary();
    } catch (error) {
      setError(language === 'he' ? 'שגיאה במחיקת ההוצאה' : 'Error deleting expense');
      console.error('Error deleting expense:', error);
    }
  };

  // DataGrid columns
  const getColumns = (): GridColDef[] => [
    {
      field: 'expenseNumber',
      headerName: language === 'he' ? 'מספר הוצאה' : 'Expense Number',
      width: 140,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <ReceiptIcon color="action" sx={{ fontSize: 20 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'expenseDate',
      headerName: language === 'he' ? 'תאריך' : 'Date',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {formatDate(params.value)}
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: language === 'he' ? 'תיאור' : 'Description',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography 
          variant="body1" 
          sx={{ 
            fontSize: '1rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
          title={language === 'he' ? params.row.descriptionHebrew || params.value : params.value}
        >
          {language === 'he' ? params.row.descriptionHebrew || params.value : params.value}
        </Typography>
      ),
    },
    {
      field: 'category',
      headerName: language === 'he' ? 'קטגוריה' : 'Category',
      width: 150,
      renderCell: (params) => {
        // Use categoryName from server (Hebrew) or fall back to local mapping
        let categoryName: string;
        if (params.row.categoryName) {
          // Server provides Hebrew name - use it for Hebrew, translate for English
          if (language === 'he') {
            categoryName = params.row.categoryName;
          } else {
            // Use local mapping for English
            const categoryInfo = ExpenseCategoryNames[params.value];
            categoryName = categoryInfo?.en || `Category ${params.value}`;
          }
        } else {
          // Fallback to local mapping
          const categoryInfo = ExpenseCategoryNames[params.value];
          categoryName = categoryInfo 
            ? (language === 'he' ? categoryInfo.he : categoryInfo.en)
            : `Category ${params.value}`;
        }

        return (
          <Box display="flex" alignItems="center" height="100%">
            <Chip
              label={categoryName}
              color="secondary"
              size="small"
              sx={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                borderRadius: 2,
                height: 'auto',
                '& .MuiChip-label': {
                  px: 1.5,
                  py: 0.5
                }
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'supplierName',
      headerName: language === 'he' ? 'ספק' : 'Supplier',
      width: 180,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <BusinessIcon color="action" sx={{ fontSize: 20 }} />
          <Typography variant="body1" sx={{ fontSize: '1rem' }}>
            {params.value || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'totalAmount',
      headerName: language === 'he' ? 'סכום' : 'Amount',
      width: 120,
      renderCell: (params) => (
        <Typography 
          variant="body1" 
          sx={{ 
            fontSize: '1rem', 
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: language === 'he' ? 'סטטוס' : 'Status',
      width: 140,
      renderCell: (params) => {
        const getStatusColor = (status: number) => {
          switch (status) {
            case EXPENSE_STATUSES.DRAFT: return 'default';
            case EXPENSE_STATUSES.PENDING: return 'warning';
            case EXPENSE_STATUSES.APPROVED: return 'info';
            case EXPENSE_STATUSES.PAID: return 'success';
            case EXPENSE_STATUSES.REJECTED: return 'error';
            case EXPENSE_STATUSES.CANCELLED: return 'default';
            default: return 'default';
          }
        };

        // Use statusName from the server (Hebrew) or fall back to local mapping
        let statusName: string;
        if (params.row.statusName) {
          // Server provides Hebrew name - use it for Hebrew, translate for English
          if (language === 'he') {
            statusName = params.row.statusName;
          } else {
            // Use local mapping for English
            const statusInfo = ExpenseStatusNames[params.value];
            statusName = statusInfo?.en || `Status ${params.value}`;
          }
        } else {
          // Fallback to local mapping
          const statusInfo = ExpenseStatusNames[params.value];
          statusName = statusInfo 
            ? (language === 'he' ? statusInfo.he : statusInfo.en)
            : `Status ${params.value}`;
        }

        return (
          <Box display="flex" alignItems="center" height="100%">
            <Chip
              label={statusName}
              color={getStatusColor(params.value)}
              size="small"
              sx={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                borderRadius: 2,
                height: 'auto',
                '& .MuiChip-label': {
                  px: 1.5,
                  py: 0.5
                }
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: language === 'he' ? 'פעולות' : 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label={language === 'he' ? 'עריכה' : 'Edit'}
          onClick={() => handleEditExpense(params.row)}
        />,
        ...(params.row.status === EXPENSE_STATUSES.DRAFT ? [
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label={language === 'he' ? 'מחיקה' : 'Delete'}
            onClick={() => handleDeleteExpense(params.row.id)}
          />
        ] : []),
      ],
    },
  ];

  // Text labels
  const text = {
    title: language === 'he' ? 'ניהול הוצאות' : 'Expense Management',
    subtitle: language === 'he' ? 'ניהול וייעוד הוצאות עסקיות' : 'Manage and track business expenses',
    addExpense: language === 'he' ? 'הוצאה חדשה' : 'New Expense',
    search: language === 'he' ? 'חיפוש הוצאות...' : 'Search expenses...',
    showFilters: language === 'he' ? 'הצג מסננים' : 'Show Filters',
    hideFilters: language === 'he' ? 'הסתר מסננים' : 'Hide Filters',
    refresh: language === 'he' ? 'רענן' : 'Refresh',
    totalExpenses: language === 'he' ? 'סך הוצאות' : 'Total Expenses',
    numberOfExpenses: language === 'he' ? 'מספר הוצאות' : 'Number of Expenses',
    averageExpense: language === 'he' ? 'ממוצע הוצאה' : 'Average Expense',
    totalVat: language === 'he' ? 'מ"ע כולל' : 'Total VAT',
    allCategories: language === 'he' ? 'כל הקטגוריות' : 'All Categories',
    allStatuses: language === 'he' ? 'כל הסטטוסים' : 'All Statuses',
    fromDate: language === 'he' ? 'מתאריך' : 'From Date',
    toDate: language === 'he' ? 'עד תאריך' : 'To Date',
    noExpenses: language === 'he' ? 'לא נמצאו הוצאות' : 'No expenses found',
    deleteConfirm: language === 'he' ? 'האם אתה בטוח שברצונך למחוק הוצאה זו?' : 'Are you sure you want to delete this expense?'
  };

  return (
    <Box sx={{ 
      p: { xs: 3, md: 4 }, 
      backgroundColor: 'background.default',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography
            variant="h3"
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 2,
              fontWeight: 600,
              color: 'primary.main',
              mb: 1
            }}
          >
            <ReceiptIcon sx={{ fontSize: 40 }} />
            {text.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            {text.subtitle}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Tooltip title={text.refresh}>
            <IconButton 
              onClick={loadExpenses} 
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
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={buttonStyles.secondary}
          >
            {showFilters ? text.hideFilters : text.showFilters}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
            sx={buttonStyles.primary}
          >
            {text.addExpense}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ScanIcon />}
            onClick={() => setShowScanDialog(true)}
            sx={buttonStyles.secondary}
          >
            {language === 'he' ? 'סרוק מסמך' : 'Scan Document'}
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 4 }}>
          <Grid size={{ xs: 4, sm: 4, md: 3 }}>
            <Card sx={cardStyles}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" sx={{ fontSize: '1rem', mb: 1 }}>
                      {text.totalExpenses}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {formatCurrency(summary.totalAmount)}
                    </Typography>
                  </Box>
                  <AttachMoneyIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 4, sm: 4, md: 3 }}>
            <Card sx={cardStyles}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" sx={{ fontSize: '1rem', mb: 1 }}>
                      {text.numberOfExpenses}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {summary.totalExpenses.toLocaleString()}
                    </Typography>
                  </Box>
                  <ReceiptIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 4, sm: 4, md: 3 }}>
            <Card sx={cardStyles}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" sx={{ fontSize: '1rem', mb: 1 }}>
                      {text.averageExpense}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {formatCurrency(summary.averageExpense)}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 4, sm: 4, md: 3 }}>
            <Card sx={cardStyles}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" sx={{ fontSize: '1rem', mb: 1 }}>
                      {text.totalVat}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {formatCurrency(summary.totalVat)}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ ...paperStyles, mb: 3 }}>
          <Stack spacing={3}>
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
              <Grid size={{ xs: 4, sm: 8, md: 6 }}>
                <TextField
                  fullWidth
                  placeholder={text.search}
                  value={filters.searchTerm || ''}
                  onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                  sx={textFieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 4, sm: 4, md: 3 }}>
                <FormControl fullWidth sx={textFieldStyles}>
                  <InputLabel>{language === 'he' ? 'קטגוריה' : 'Category'}</InputLabel>
                  <Select
                    value={filters.category || ''}
                    label={language === 'he' ? 'קטגוריה' : 'Category'}
                    onChange={(e) => handleFilterChange({ 
                      category: e.target.value ? Number(e.target.value) as ExpenseCategory : undefined 
                    })}
                  >
                    <MenuItem value="">
                      {text.allCategories}
                    </MenuItem>
                    {Object.entries(ExpenseCategoryNames).map(([value, names]) => (
                      <MenuItem key={value} value={value}>
                        {language === 'he' ? names.he : names.en}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 4, sm: 4, md: 3 }}>
                <FormControl fullWidth sx={textFieldStyles}>
                  <InputLabel>{language === 'he' ? 'סטטוס' : 'Status'}</InputLabel>
                  <Select
                    value={filters.status || ''}
                    label={language === 'he' ? 'סטטוס' : 'Status'}
                    onChange={(e) => handleFilterChange({ 
                      status: e.target.value ? Number(e.target.value) as ExpenseStatus : undefined 
                    })}
                  >
                    <MenuItem value="">
                      {text.allStatuses}
                    </MenuItem>
                    {Object.entries(ExpenseStatusNames).map(([value, names]) => (
                      <MenuItem key={value} value={value}>
                        {language === 'he' ? names.he : names.en}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
              <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={text.fromDate}
                  value={filters.fromDate || ''}
                  onChange={(e) => handleFilterChange({ fromDate: e.target.value })}
                  sx={textFieldStyles}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={text.toDate}
                  value={filters.toDate || ''}
                  onChange={(e) => handleFilterChange({ toDate: e.target.value })}
                  sx={textFieldStyles}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '1rem' }}>
            {error}
          </Typography>
        </Alert>
      )}

      {/* Expenses DataGrid */}
      <Paper sx={paperStyles}>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={expenses}
            columns={getColumns()}
            loading={loading}
            sx={dataGridStyles}
            localeText={{
              noRowsLabel: text.noExpenses,
            }}
            initialState={{
              pagination: {
                paginationModel: { page: currentPage - 1, pageSize: pageSize },
              },
            }}
            paginationMode="server"
            rowCount={totalCount}
            onPaginationModelChange={(model) => {
              setCurrentPage(model.page + 1);
            }}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
          />
        </Box>
      </Paper>

      {/* Create/Edit Modals would go here */}
      {/* For brevity, I'm not including the full modal components in this response */}
      {/* They would be similar to other forms in the application */}
      
      {/* Create Expense Dialog */}
      <ExpenseCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => handleExpenseCreated()}
      />

      {/* Edit Expense Dialog */}
      <ExpenseEditDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedExpense(null);
        }}
        onSuccess={() => handleExpenseUpdated()}
        expense={selectedExpense}
      />

      {/* Document Scan Dialog */}
      <DocumentScanDialog
        open={showScanDialog}
        onClose={() => setShowScanDialog(false)}
        onScanComplete={handleScanComplete}
        language={language}
      />

      {/* Document Review Dialog - Using ExpenseCreateDialog in review mode */}
      <ExpenseCreateDialog
        open={showReviewDialog}
        onClose={() => {
          setShowReviewDialog(false);
          setScanResult(null);
        }}
        scanResult={scanResult}
        mode="review"
        onSuccess={handleExpenseCreatedFromScan}
      />
    </Box>
  );
};

export default ExpensesPage;
