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
import type { SalesOrder, Customer, Company } from '../../types/entities';

interface PrintableSalesOrderProps {
  salesOrder: SalesOrder;
  customer: Customer;
  company: Company;
  className?: string;
}

const PrintableSalesOrder: React.FC<PrintableSalesOrderProps> = ({
  salesOrder,
  customer,
  company,
  className,
}) => {
  const calculateLineTotal = (quantity: number, unitPrice: number, discountPercent: number = 0) => {
    const subtotal = quantity * unitPrice;
    const discount = subtotal * (discountPercent / 100);
    return subtotal - discount;
  };

  const calculateLineTax = (lineTotal: number, taxRate: number) => {
    return lineTotal * (taxRate / 100);
  };

  const calculateOrderTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    salesOrder.lines?.forEach(line => {
      const lineTotal = calculateLineTotal(line.quantity, line.unitPrice, line.discountPercent);
      const lineTax = calculateLineTax(lineTotal, line.taxRate);
      subtotal += lineTotal;
      totalTax += lineTax;
    });

    return {
      subtotal,
      totalTax,
      total: subtotal + totalTax,
    };
  };

  const totals = calculateOrderTotals();

  const getDocumentTitle = () => {
    switch (salesOrder.status) {
      case 'Quote': return 'הצעת מחיר';
      case 'Confirmed': return 'אישור הזמנה';
      case 'Shipped': return 'תעודת משלוח';
      case 'Completed': return 'הזמנה הושלמה';
      default: return 'הזמנה';
    }
  };

  return (
    <PrintableDocument
      title={getDocumentTitle()}
      headerInfo={{
        companyName: company.name,
        companyAddress: company.address,
        companyTaxId: company.israelTaxId,
        companyPhone: company.phone,
        companyEmail: company.email,
      }}
      documentNumber={salesOrder.id.toString()}
      documentDate={salesOrder.orderDate}
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

      {/* Order Details */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 1, fontSize: '14px' }}>
          פרטי הזמנה
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>תאריך הזמנה:</strong> {salesOrder.orderDate.toLocaleDateString('he-IL')}
            </Typography>
            {salesOrder.dueDate && (
              <Typography variant="body2" sx={{ fontSize: '11px' }}>
                <strong>תאריך יעד:</strong> {salesOrder.dueDate.toLocaleDateString('he-IL')}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>סטטוס:</strong> {(() => {
                switch (salesOrder.status) {
                  case 'Quote': return 'הצעת מחיר';
                  case 'Confirmed': return 'הזמנה מאושרת';
                  case 'Shipped': return 'נשלחה';
                  case 'Completed': return 'הושלמה';
                  default: return salesOrder.status;
                }
              })()}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              <strong>מטבע:</strong> {salesOrder.currency}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Order Lines Table */}
      <TableContainer component={Paper} sx={{ marginBottom: 3, boxShadow: 'none', border: '1px solid #ddd' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '8px' }}>פריט</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '8px' }} align="center">כמות</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '8px' }} align="right">מחיר יחידה</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '8px' }} align="right">הנחה %</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '8px' }} align="right">מע"מ %</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '8px' }} align="right">סה"כ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salesOrder.lines?.map((line, index) => {
              const lineTotal = calculateLineTotal(line.quantity, line.unitPrice, line.discountPercent);
              return (
                <TableRow key={index}>
                  <TableCell sx={{ fontSize: '10px', padding: '6px' }}>
                    <div>{line.description || line.itemName}</div>
                    {line.itemSku && (
                      <div style={{ fontSize: '9px', color: '#666' }}>
                        קוד: {line.itemSku}
                      </div>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: '10px', padding: '6px' }} align="center">
                    {line.quantity}
                  </TableCell>
                  <TableCell sx={{ fontSize: '10px', padding: '6px' }} align="right">
                    ₪{line.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '10px', padding: '6px' }} align="right">
                    {line.discountPercent || 0}%
                  </TableCell>
                  <TableCell sx={{ fontSize: '10px', padding: '6px' }} align="right">
                    {line.taxRate}%
                  </TableCell>
                  <TableCell sx={{ fontSize: '10px', padding: '6px' }} align="right">
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
              ₪{totals.subtotal.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              מע"מ:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              ₪{totals.totalTax.toFixed(2)}
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
              ₪{totals.total.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Notes */}
      {salesOrder.notes && (
        <Box sx={{ marginTop: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 1, fontSize: '14px' }}>
            הערות
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
            {salesOrder.notes}
          </Typography>
        </Box>
      )}
    </PrintableDocument>
  );
};

export default PrintableSalesOrder;
