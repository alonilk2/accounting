import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
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
  TextField,
  InputAdornment,
  Stack,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Invoice, InvoiceStatus } from '../types/entities';
import InvoiceCreateDialog from '../components/invoices/InvoiceCreateDialog';
import InvoicePaymentDialog from '../components/invoices/InvoicePaymentDialog';
import InvoiceReceiptsDialog from '../components/invoices/InvoiceReceiptsDialog';
import { invoicesAPI } from '../services/api';

const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptsDialog, setShowReceiptsDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesAPI.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, invoice: Invoice) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  const getStatusColor = (status: InvoiceStatus): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Sent': return 'info';
      case 'Paid': return 'success';
      case 'Overdue': return 'error';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: InvoiceStatus): string => {
    switch (status) {
      case 'Draft': return 'טיוטה';
      case 'Sent': return 'נשלחה';
      case 'Paid': return 'שולמה';
      case 'Overdue': return 'פגת תוקף';
      case 'Cancelled': return 'בוטלה';
      default: return status;
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintInvoice = (invoice: Invoice) => {
    // Navigate to print view
    navigate(`/invoices/${invoice.id}/print`);
    handleMenuClose();
  };

  const handleEditInvoice = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}/edit`);
    handleMenuClose();
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את החשבונית?')) {
      try {
        await invoicesAPI.delete(invoice.id);
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          חשבוניות
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
        >
          חשבונית חדשה
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="חיפוש לפי שם לקוח או מספר חשבונית..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>מספר חשבונית</TableCell>
                <TableCell>לקוח</TableCell>
                <TableCell>תאריך</TableCell>
                <TableCell>סכום</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    טוען...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    לא נמצאו חשבוניות
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {invoice.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {invoice.invoiceDate.toLocaleDateString('he-IL')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ₪{invoice.totalAmount.toFixed(2)}
                      </Typography>
                      {invoice.paidAmount > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          שולם: ₪{invoice.paidAmount.toFixed(2)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(invoice.status)}
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5, 
                        alignItems: 'center',
                        height: '100%',
                        py: 0.5
                      }}>
                        {/* Payment button - only if balance remains */}
                        {invoice.totalAmount > invoice.paidAmount && (
                          <Box
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setPaymentAmount((invoice.totalAmount - invoice.paidAmount).toString());
                              setShowPaymentDialog(true);
                            }}
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
                              <PaymentIcon />
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
                              תשלום
                            </Typography>
                          </Box>
                        )}

                        {/* Receipts button - only if there are payments */}
                        {invoice.paidAmount > 0 && (
                          <Box
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowReceiptsDialog(true);
                            }}
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
                              <ReceiptIcon />
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
                              קבלות
                            </Typography>
                          </Box>
                        )}

                        {/* Menu button for other actions */}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, invoice)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedInvoice && handlePrintInvoice(selectedInvoice)}>
          <PrintIcon sx={{ mr: 1 }} />
          הדפס
        </MenuItem>
        <MenuItem onClick={() => selectedInvoice && handleEditInvoice(selectedInvoice)}>
          <EditIcon sx={{ mr: 1 }} />
          ערוך
        </MenuItem>
        <MenuItem 
          onClick={() => selectedInvoice && handleDeleteInvoice(selectedInvoice)}
          disabled={selectedInvoice?.status === 'Paid'}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          מחק
        </MenuItem>
      </Menu>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowCreateDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Invoice Create Dialog */}
      <InvoiceCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={(invoiceId) => {
          console.log('Invoice created with ID:', invoiceId);
          setShowCreateDialog(false);
          fetchInvoices(); // Refresh the list
        }}
      />

      {/* Payment Dialog */}
      {selectedInvoice && (
        <InvoicePaymentDialog
          open={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            setSelectedInvoice(null);
            setPaymentAmount('');
          }}
          invoice={selectedInvoice}
          onPaymentSuccess={() => {
            fetchInvoices(); // Refresh the list
          }}
        />
      )}

      {/* Receipts Dialog */}
      {selectedInvoice && (
        <InvoiceReceiptsDialog
          open={showReceiptsDialog}
          onClose={() => {
            setShowReceiptsDialog(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
        />
      )}
    </Box>
  );
};

export default InvoicesPage;
