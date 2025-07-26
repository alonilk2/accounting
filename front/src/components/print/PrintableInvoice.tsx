import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import PrintableDocument from './PrintableDocument';
import type { Invoice, Company } from '../../types/entities';

interface PrintableInvoiceProps {
  invoice: Invoice;
  company: Company;
  className?: string;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  invoice,
  company,
  className,
}) => {
  const calculateLineTotal = (quantity: number, unitPrice: number, discountPercent: number = 0) => {
    const subtotal = quantity * unitPrice;
    const discount = subtotal * (discountPercent / 100);
    return subtotal - discount;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Draft': return 'טיוטה';
      case 'Sent': return 'נשלחה';
      case 'Paid': return 'שולמה';
      case 'Overdue': return 'פגת תוקף';
      case 'Cancelled': return 'בוטלה';
      default: return status;
    }
  };

  return (
    <PrintableDocument
      title="חשבונית מס"
      headerInfo={{
        companyName: company.name,
        companyAddress: company.address,
        companyTaxId: company.israelTaxId,
        companyPhone: company.phone,
        companyEmail: company.email,
      }}
      documentNumber={invoice.invoiceNumber}
      documentDate={invoice.invoiceDate}
      className={className}
    >
      {/* Customer Information */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 1, fontSize: '14px' }}>
          פרטי לקוח
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>שם:</strong> {invoice.customerName}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>כתובת:</strong> {invoice.customerAddress}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>טלפון:</strong> {invoice.customerContact}
            </Typography>
            {invoice.customerTaxId && (
              <Typography variant="body2" sx={{ fontSize: '11px' }}>
                <strong>ח.פ/ע.מ:</strong> {invoice.customerTaxId}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Invoice Details */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 1, fontSize: '14px' }}>
          פרטי חשבונית
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>תאריך חשבונית:</strong> {invoice.invoiceDate.toLocaleDateString('he-IL')}
            </Typography>
            {invoice.dueDate && (
              <Typography variant="body2" sx={{ fontSize: '11px' }}>
                <strong>תאריך פירעון:</strong> {invoice.dueDate.toLocaleDateString('he-IL')}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>סטטוס:</strong> {getStatusText(invoice.status)}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>מטבע:</strong> {invoice.currency}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Invoice Lines Table */}
      <TableContainer component={Paper} sx={{ marginBottom: 3, boxShadow: 'none' }}>
        <Table size="small" sx={{ border: '1px solid #333' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#2c3e50', color: 'white' }}>פריט</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#2c3e50', color: 'white' }}>כמות</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#2c3e50', color: 'white' }}>מחיר יחידה</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#2c3e50', color: 'white' }}>הנחה %</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#2c3e50', color: 'white' }}>מע"מ %</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#2c3e50', color: 'white' }}>סה"כ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.lines?.map((line, index) => {
              const lineTotal = calculateLineTotal(line.quantity, line.unitPrice, line.discountPercent);
              return (
                <TableRow key={index} sx={{ '&:nth-of-type(even)': { backgroundColor: '#f8f9fa' } }}>
                  <TableCell sx={{ border: '1px solid #666', verticalAlign: 'top' }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '11px' }}>{line.description}</Typography>
                    {line.itemSku && (
                      <Box sx={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                        קוד: {line.itemSku}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #666', textAlign: 'center', fontFamily: 'Courier New, monospace' }}>
                    {line.quantity}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #666', textAlign: 'right', fontFamily: 'Courier New, monospace' }}>
                    ₪{line.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #666', textAlign: 'center', fontFamily: 'Courier New, monospace' }}>
                    {line.discountPercent || 0}%
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #666', textAlign: 'center', fontFamily: 'Courier New, monospace' }}>
                    {line.taxRate}%
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #666', textAlign: 'right', fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>
                    ₪{lineTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3 }}>
        <Box sx={{ minWidth: '300px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              סה"כ לפני מע"מ:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              ₪{invoice.subtotalAmount.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              מע"מ:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              ₪{invoice.taxAmount.toFixed(2)}
            </Typography>
          </Box>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '8px 0',
              borderTop: '2px solid #333',
              fontWeight: 'bold'
            }}
          >
            <Typography variant="body1" sx={{ fontSize: '13px', fontWeight: 'bold' }}>
              סה"כ לתשלום:
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '13px', fontWeight: 'bold' }}>
              ₪{invoice.totalAmount.toFixed(2)}
            </Typography>
          </Box>
          {invoice.paidAmount > 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', marginTop: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '11px', color: '#666' }}>
                  שולם:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '11px', color: '#666' }}>
                  ₪{invoice.paidAmount.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
                  יתרה לתשלום:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
                  ₪{(invoice.totalAmount - invoice.paidAmount).toFixed(2)}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Notes */}
      {invoice.notes && (
        <Box sx={{ marginTop: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 1, fontSize: '14px' }}>
            הערות
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
            {invoice.notes}
          </Typography>
        </Box>
      )}

      {/* Payment Terms and Legal Text */}
      <Box sx={{ marginTop: 4, borderTop: '1px solid #ddd', paddingTop: 2 }}>
        <Typography variant="body2" sx={{ fontSize: '9px', color: '#666', textAlign: 'center' }}>
          תנאי תשלום: 30 יום מתאריך החשבונית | חשבונית זו תקפה למע"מ
        </Typography>
      </Box>
    </PrintableDocument>
  );
};

export default PrintableInvoice;
