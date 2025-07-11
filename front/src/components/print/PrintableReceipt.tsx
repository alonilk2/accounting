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
import type { Receipt, Invoice, Customer, Company } from '../../types/entities';

interface PrintableReceiptProps {
  receipt: Receipt;
  invoice: Invoice;
  customer: Customer;
  company: Company;
  className?: string;
}

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  receipt,
  invoice,
  customer,
  company,
  className,
}) => {
  return (
    <PrintableDocument
      title="קבלה"
      headerInfo={{
        companyName: company.name,
        companyAddress: company.address,
        companyTaxId: company.israelTaxId,
        companyPhone: company.phone,
        companyEmail: company.email,
      }}
      documentNumber={receipt.receiptNumber}
      documentDate={receipt.paymentDate}
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
              <strong>שם:</strong> {customer.name}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>כתובת:</strong> {customer.address}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>טלפון:</strong> {customer.contact}
            </Typography>
            {customer.taxId && (
              <Typography variant="body2" sx={{ fontSize: '11px' }}>
                <strong>ח.פ/ע.מ:</strong> {customer.taxId}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Receipt Details */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 1, fontSize: '14px' }}>
          פרטי קבלה
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>תאריך תשלום:</strong> {receipt.paymentDate.toLocaleDateString('he-IL')}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>מס' חשבונית:</strong> {invoice.invoiceNumber}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>אמצעי תשלום:</strong> {receipt.paymentMethod}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>מטבע:</strong> {invoice.currency}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Payment Details */}
      <TableContainer component={Paper} sx={{ marginBottom: 3, boxShadow: 'none', border: '1px solid #ddd' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '8px' }}>תיאור</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '8px' }} align="right">סכום</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontSize: '10px', padding: '6px' }}>
                תשלום עבור חשבונית מס' {invoice.invoiceNumber}
              </TableCell>
              <TableCell sx={{ fontSize: '10px', padding: '6px' }} align="right">
                ₪{receipt.amount.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Payment Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3 }}>
        <Box sx={{ minWidth: '300px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              סכום שולם:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              ₪{receipt.amount.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              יתרה קודמת:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              ₪{(invoice.totalAmount - invoice.paidAmount + receipt.amount).toFixed(2)}
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
              יתרה נוכחית:
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '13px', fontWeight: 'bold' }}>
              ₪{(invoice.totalAmount - invoice.paidAmount).toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Notes */}
      {receipt.notes && (
        <Box sx={{ marginTop: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 1, fontSize: '14px' }}>
            הערות
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
            {receipt.notes}
          </Typography>
        </Box>
      )}

      {/* Signature */}
      <Box sx={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
          <Typography variant="body2" sx={{ fontSize: '11px', marginBottom: 2 }}>
            ___________________
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '10px' }}>
            חתימת המקבל
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
          <Typography variant="body2" sx={{ fontSize: '11px', marginBottom: 2 }}>
            ___________________
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '10px' }}>
            חתימת המשלם
          </Typography>
        </Box>
      </Box>
    </PrintableDocument>
  );
};

export default PrintableReceipt;
