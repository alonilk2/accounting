import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Paper
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import type { CustomerStatement } from '../../types/reports';

interface CustomerStatementPrintProps {
  statement: CustomerStatement;
}

const CustomerStatementPrint: React.FC<CustomerStatementPrintProps> = ({ statement }) => {
  // Debug logging to check if data is being passed correctly
  console.log('CustomerStatementPrint received statement:', statement);

  const formatCurrency = (amount: number, isBalanceField: boolean = false) => {
    let value = amount;
    if (isBalanceField) {
      // For balance fields: show credit balances (negative) as positive, debit balances as negative
      value = amount <= 0 ? Math.abs(amount) : -amount;
    }
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: he });
  };

  const getTransactionTypeHebrew = (type: string) => {
    switch (type) {
      case 'Invoice':
        return 'חשבונית';
      case 'Receipt':
        return 'קבלה';
      case 'Credit Note':
        return 'זכות';
      default:
        return type;
    }
  };

  return (
    <Box 
      className="print-content"
      sx={{ 
        direction: 'rtl', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#ffffff !important',
        color: '#000000 !important',
        p: 3,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        '@media print': {
          p: 2,
          width: '100%',
          maxWidth: 'none'
        },
        // Force light mode colors
        '& .MuiPaper-root': {
          backgroundColor: '#ffffff !important',
          color: '#000000 !important',
        },
        '& .MuiTypography-root': {
          color: 'inherit !important',
        },
        '& .MuiTableCell-root': {
          color: '#000000 !important',
          borderColor: '#e0e0e0 !important',
        },
        '& .MuiTableHead-root .MuiTableCell-root': {
          backgroundColor: '#f5f5f5 !important',
        },
        '& .MuiTableRow-root:nth-of-type(even)': {
          backgroundColor: '#fafafa !important',
        }
      }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
          כרטסת לקוח
        </Typography>
        <Typography variant="h6" sx={{ color: '#666' }}>
          תקופה: {formatDate(statement.fromDate)} - {formatDate(statement.toDate)}
        </Typography>
      </Box>

      {/* Customer Info */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
          פרטי לקוח
        </Typography>
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
          <Grid size={{ xs: 2, sm: 4, md: 6 }}>
            <Typography><strong>שם:</strong> {statement.customer.name}</Typography>
            {statement.customer.taxId && (
              <Typography><strong>ח.פ/ע.מ:</strong> {statement.customer.taxId}</Typography>
            )}
          </Grid>
          <Grid size={{ xs: 2, sm: 4, md: 6 }}>
            {statement.customer.address && (
              <Typography><strong>כתובת:</strong> {statement.customer.address}</Typography>
            )}
            {statement.customer.phone && (
              <Typography><strong>טלפון:</strong> {statement.customer.phone}</Typography>
            )}
            {statement.customer.email && (
              <Typography><strong>אימייל:</strong> {statement.customer.email}</Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Balance Summary */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
          סיכום יתרות
        </Typography>
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
          <Grid size={{ xs: 2, sm: 4, md: 6 }}>
            <Typography><strong>יתרת פתיחה:</strong></Typography>
            <Typography variant="h6" sx={{ color: statement.openingBalance <= 0 ? '#4caf50' : '#f44336' }}>
              {formatCurrency(statement.openingBalance, true)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 2, sm: 4, md: 4 }}>
            <Typography><strong>סך חובות:</strong></Typography>
            <Typography variant="h6" sx={{ color: '#f44336' }}>
              {formatCurrency(statement.summary.totalDebits)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 2, sm: 4, md: 4 }}>
            <Typography><strong>סך זכויות:</strong></Typography>
            <Typography variant="h6" sx={{ color: '#4caf50' }}>
              {formatCurrency(statement.summary.totalCredits)}
            </Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
          <Grid size={{ xs: 2, sm: 4, md: 6 }}>
            <Typography><strong>שינוי נטו:</strong></Typography>
            <Typography variant="h6" sx={{ color: statement.summary.netChange <= 0 ? '#4caf50' : '#f44336' }}>
              {formatCurrency(statement.summary.netChange, true)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 2, sm: 4, md: 6 }}>
            <Typography><strong>יתרת סגירה:</strong></Typography>
            <Typography variant="h6" sx={{ color: statement.closingBalance <= 0 ? '#4caf50' : '#f44336' }}>
              {formatCurrency(statement.closingBalance, true)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Table */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #eee' }}>
          תנועות חשבון ({statement.summary.totalTransactions} תנועות)
        </Typography>
        <Box sx={{ overflowX: 'auto', width: '100%' }}>
          <Table 
            size="small" 
            sx={{ 
              width: '100%',
              minWidth: '800px',
              tableLayout: 'fixed',
              '& .MuiTableCell-root': {
                borderColor: '#eee',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '0.875rem'
              }
            }}
          >
            <TableHead>
              <TableRow 
                sx={{ 
                  backgroundColor: '#f5f5f5',
                  '& .MuiTableCell-head': {
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5'
                  }
                }}
              >
                <TableCell sx={{ width: '100px' }}><strong>תאריך</strong></TableCell>
                <TableCell sx={{ width: '100px' }}><strong>סוג מסמך</strong></TableCell>
                <TableCell sx={{ width: '120px' }}><strong>מס' מסמך</strong></TableCell>
                <TableCell sx={{ width: '200px' }}><strong>תיאור</strong></TableCell>
                <TableCell align="right" sx={{ width: '100px' }}><strong>חובה</strong></TableCell>
                <TableCell align="right" sx={{ width: '100px' }}><strong>זכות</strong></TableCell>
                <TableCell align="right" sx={{ width: '100px' }}><strong>יתרה</strong></TableCell>
                <TableCell sx={{ width: '80px' }}><strong>סטטוס</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statement.transactions.map((transaction, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(transaction.date)}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{getTransactionTypeHebrew(transaction.transactionType)}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{transaction.documentNumber}</TableCell>
                  <TableCell 
                    sx={{ 
                      fontSize: '0.8rem',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={transaction.description}
                  >
                    {transaction.description}
                  </TableCell>
                  <TableCell align="right" sx={{ color: transaction.debit > 0 ? '#f44336' : '#999', fontSize: '0.8rem' }}>
                    {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ color: transaction.credit > 0 ? '#4caf50' : '#999', fontSize: '0.8rem' }}>
                    {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'bold',
                    color: transaction.balance <= 0 ? '#4caf50' : '#f44336',
                    fontSize: '0.8rem'
                  }}>
                    {formatCurrency(transaction.balance, true)}
                  </TableCell>
                  <TableCell>
                    <Box 
                      component="span" 
                      sx={{ 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: '4px', 
                        fontSize: '0.7rem',
                        backgroundColor: transaction.status === 'Completed' || transaction.status === 'Paid' ? '#e8f5e8' : '#fff3e0',
                        color: transaction.status === 'Completed' || transaction.status === 'Paid' ? '#2e7d32' : '#ef6c00',
                        display: 'inline-block',
                        maxWidth: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {transaction.status === 'Completed' ? 'הושלם' : 
                       transaction.status === 'Paid' ? 'שולם' :
                       transaction.status === 'Pending' ? 'ממתין' : 
                       transaction.status}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>      {/* Monthly Summary (if available) */}
      {statement.summary.monthlyActivity.length > 0 && (
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 3, 
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #eee' }}>
            סיכום חודשי
          </Typography>
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <Table 
              size="small"
              sx={{ 
                width: '100%',
                minWidth: '600px',
                tableLayout: 'fixed',
                '& .MuiTableCell-root': {
                  borderColor: '#eee',
                  fontSize: '0.875rem'
                }
              }}
            >
              <TableHead>
                <TableRow 
                  sx={{ 
                    backgroundColor: '#f5f5f5',
                    '& .MuiTableCell-head': {
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  <TableCell sx={{ width: '150px' }}><strong>חודש</strong></TableCell>
                  <TableCell align="right" sx={{ width: '120px' }}><strong>חובות</strong></TableCell>
                  <TableCell align="right" sx={{ width: '120px' }}><strong>זכויות</strong></TableCell>
                  <TableCell align="right" sx={{ width: '120px' }}><strong>נטו</strong></TableCell>
                  <TableCell align="center" sx={{ width: '90px' }}><strong>מס' תנועות</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statement.summary.monthlyActivity.map((month, index) => (
                  <TableRow key={index}>
                    <TableCell>{month.monthName}</TableCell>
                    <TableCell align="right" sx={{ color: '#f44336' }}>
                      {formatCurrency(month.totalDebits)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#4caf50' }}>
                      {formatCurrency(month.totalCredits)}
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      fontWeight: 'bold',
                      color: month.netAmount <= 0 ? '#4caf50' : '#f44336'
                    }}>
                      {formatCurrency(month.netAmount, true)}
                    </TableCell>
                    <TableCell align="center">{month.transactionCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 4, pt: 2, borderTop: '1px solid #ddd' }}>
        <Typography variant="body2" sx={{ color: '#666' }}>
          דו"ח הופק בתאריך: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          מערכת חשבונאות AI - כרטסת לקוח
        </Typography>
      </Box>
    </Box>
  );
};

export default CustomerStatementPrint;
