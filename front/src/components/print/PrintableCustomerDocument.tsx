import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import type { Customer, CustomerDocumentsResponse } from '../../types/entities';

interface PrintableCustomerDocumentProps {
  customer: Customer;
  documentsData: CustomerDocumentsResponse;
  fromDate?: Date | null;
  toDate?: Date | null;
  documentType?: string;
  className?: string;
}

const getDocumentTypeLabel = (documentType: string) => {
  switch (documentType) {
    case "SalesOrder":
      return "מכירות";
    case "Invoice":
      return "חשבונית";
    case "Receipt":
      return "קבלה";
    case "POSSale":
      return "מכירת קופה";
    default:
      return documentType;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
  }).format(amount);
};

const formatDate = (date: Date) => {
  return format(date, "dd/MM/yyyy", { locale: he });
};

const PrintableCustomerDocument: React.FC<PrintableCustomerDocumentProps> = ({
  customer,
  documentsData,
  fromDate,
  toDate,
  documentType,
  className,
}) => {
  const currentDate = new Date();
  
  return (
    <Box
      className={className}
      sx={{
        padding: 3,
        backgroundColor: 'white !important',
        color: 'black !important',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: 1.4,
        direction: 'rtl',
        minHeight: '100vh',
        width: '100%',
        display: 'block !important',
        visibility: 'visible !important',
        '@media print': {
          padding: '20px !important',
          margin: '0 !important',
          boxShadow: 'none !important',
          backgroundColor: 'white !important',
          color: 'black !important',
          fontSize: '12px !important',
          width: '100% !important',
          height: 'auto !important',
          display: 'block !important',
          visibility: 'visible !important',
          position: 'static !important',
          left: 'auto !important',
          top: 'auto !important',
          transform: 'none !important',
          '& *': {
            visibility: 'visible !important',
            display: 'revert !important',
            color: 'black !important',
            backgroundColor: 'transparent !important',
          },
          '& .MuiPaper-root': {
            backgroundColor: '#f5f5f5 !important',
            boxShadow: 'none !important',
            border: '1px solid #ddd !important',
          },
          '& .MuiTable-root': {
            border: '1px solid #000 !important',
          },
          '& .MuiTableCell-root': {
            border: '1px solid #000 !important',
            padding: '8px !important',
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            backgroundColor: '#f0f0f0 !important',
            fontWeight: 'bold !important',
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
          דוח מסמכי לקוח
        </Typography>
        <Typography variant="h6" sx={{ color: 'gray' }}>
          נוצר בתאריך: {formatDate(currentDate)}
        </Typography>
      </Box>

      {/* Customer Information */}
      <Paper sx={{ padding: 2, marginBottom: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
          פרטי הלקוח
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Typography><strong>שם הלקוח:</strong> {customer.name}</Typography>
          <Typography><strong>מספר לקוח:</strong> {customer.id}</Typography>
          {customer.email && (
            <Typography><strong>אימייל:</strong> {customer.email}</Typography>
          )}
          {customer.phone && (
            <Typography><strong>טלפון:</strong> {customer.phone}</Typography>
          )}
          {customer.address && (
            <Typography><strong>כתובת:</strong> {customer.address}</Typography>
          )}
          {customer.taxId && (
            <Typography><strong>מספר עוסק מורשה:</strong> {customer.taxId}</Typography>
          )}
        </Box>
      </Paper>

      {/* Filter Information */}
      {(fromDate || toDate || documentType) && (
        <Paper sx={{ padding: 2, marginBottom: 3, backgroundColor: '#f0f8ff' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
            פילטרים
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {fromDate && (
              <Typography><strong>מתאריך:</strong> {formatDate(fromDate)}</Typography>
            )}
            {toDate && (
              <Typography><strong>עד תאריך:</strong> {formatDate(toDate)}</Typography>
            )}
            {documentType && (
              <Typography><strong>סוג מסמך:</strong> {getDocumentTypeLabel(documentType)}</Typography>
            )}
          </Box>
        </Paper>
      )}

      {/* Summary */}
      <Paper sx={{ padding: 2, marginBottom: 3, backgroundColor: '#fff8e1' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
          סיכום
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Typography><strong>סה"כ מסמכים:</strong> {documentsData.totalDocuments}</Typography>
          <Typography><strong>סה"כ סכום:</strong> {formatCurrency(documentsData.totalAmount)}</Typography>
        </Box>
      </Paper>

      {/* Documents Table */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
        רשימת מסמכים
      </Typography>
      
      {documentsData.documents.length === 0 ? (
        <Box sx={{ textAlign: 'center', padding: 4, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" color="textSecondary">
            לא נמצאו מסמכים
          </Typography>
        </Box>
      ) : (
        <Table 
          size="small" 
          sx={{ 
            border: '2px solid #000',
            borderCollapse: 'collapse',
            width: '100%',
            '& .MuiTableCell-root': {
              border: '1px solid #000',
              padding: '8px',
              fontSize: '12px',
            },
            '@media print': {
              '& .MuiTableCell-root': {
                border: '1px solid #000 !important',
                padding: '6px !important',
                fontSize: '10px !important',
              },
            },
          }}
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000' }}>סוג מסמך</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000' }}>מספר מסמך</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000' }}>תאריך</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000' }}>סכום</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000' }}>סטטוס</TableCell>
              <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000' }}>תיאור</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documentsData.documents.map((doc, index) => (
              <TableRow key={`${doc.documentType}-${doc.id}-${index}`}>
                <TableCell sx={{ border: '1px solid #000' }}>
                  {getDocumentTypeLabel(doc.documentType)}
                </TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>
                  {doc.documentNumber}
                </TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>
                  {formatDate(doc.documentDate)}
                </TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>
                  {formatCurrency(doc.totalAmount)}
                </TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>
                  {doc.status}
                </TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>
                  {doc.description || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Footer */}
      <Box sx={{ marginTop: 4, textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: 2 }}>
        <Typography variant="body2" color="textSecondary">
          דוח זה נוצר אוטומטית על ידי מערכת הנהלת החשבונות
        </Typography>
      </Box>
    </Box>
  );
};

export default PrintableCustomerDocument;
