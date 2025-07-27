import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import PrintableInvoice from './PrintableInvoice';
import PrintableReceipt from './PrintableReceipt';
import PrintableSalesOrder from './PrintableSalesOrder';
import { invoiceService } from '../../services/invoiceService';
import { salesOrdersApi } from '../../services/salesOrdersApi';
import { receiptsService } from '../../services/receiptsService';
import { companyApi } from '../../services/companyApi';
import type { Invoice, SalesOrder, Receipt, Customer, Company } from '../../types/entities';

interface DocumentData {
  id: number;
  documentType: string;
  documentNumber: string;
  documentDate: Date;
  totalAmount: number;
  status: string;
  description?: string;
}

interface PrintableIndividualDocumentProps {
  document: DocumentData;
  customer: Customer;
  companyId?: number;
  className?: string;
}

const PrintableIndividualDocument: React.FC<PrintableIndividualDocumentProps> = ({
  document,
  customer,
  companyId = 1,
  className,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specificData, setSpecificData] = useState<{
    invoice?: Invoice;
    salesOrder?: SalesOrder;
    receipt?: Receipt;
    company?: Company;
  }>({});

  useEffect(() => {
    const fetchSpecificData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Always fetch company data
        const companyData = await companyApi.getCompany(companyId);
        
        let specificDocumentData = {};

        switch (document.documentType) {
          case 'Invoice': {
            const invoiceData = await invoiceService.getInvoice(document.id);
            specificDocumentData = { invoice: invoiceData };
            break;
          }
          
          case 'SalesOrder': {
            const salesOrderData = await salesOrdersApi.getSalesOrder(document.id, companyId);
            specificDocumentData = { salesOrder: salesOrderData };
            break;
          }
          
          case 'Receipt': {
            const receiptData = await receiptsService.getReceiptById(document.id);
            // Convert ReceiptResponse to Receipt format
            const receipt: Receipt = {
              id: receiptData.id,
              invoiceId: receiptData.invoiceId,
              receiptNumber: receiptData.receiptNumber,
              paymentDate: receiptData.paymentDate,
              amount: receiptData.amount,
              paymentMethod: receiptData.paymentMethod,
              notes: receiptData.notes,
              createdAt: receiptData.createdAt
            };
            specificDocumentData = { receipt };
            break;
          }
          
          case 'POSSale': {
            // For POS sales, create a simple receipt-like structure
            const posReceipt: Receipt = {
              id: document.id,
              invoiceId: 0,
              receiptNumber: document.documentNumber,
              paymentDate: document.documentDate,
              amount: document.totalAmount,
              paymentMethod: 'מזומן',
              notes: document.description || 'מכירת קופה',
              createdAt: document.documentDate
            };
            specificDocumentData = { receipt: posReceipt };
            break;
          }
        }

        setSpecificData({
          ...specificDocumentData,
          company: companyData
        });
      } catch (err) {
        console.error('Error fetching document data:', err);
        setError('שגיאה בטעינת נתוני המסמך');
      } finally {
        setLoading(false);
      }
    };

    fetchSpecificData();
  }, [document, companyId]);

  if (loading) {
    return (
      <Box 
        className={className}
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        className={className}
        sx={{ 
          p: 3,
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Render specific component based on document type
  switch (document.documentType) {
    case 'Invoice':
      if (specificData.invoice && specificData.company) {
        return (
          <PrintableInvoice
            invoice={specificData.invoice}
            company={specificData.company}
            className={className}
          />
        );
      }
      break;
    
    case 'SalesOrder':
      if (specificData.salesOrder && specificData.company) {
        return (
          <PrintableSalesOrder
            salesOrder={specificData.salesOrder}
            customer={customer}
            company={specificData.company}
            className={className}
          />
        );
      }
      break;
    
    case 'Receipt':
    case 'POSSale':
      if (specificData.receipt && specificData.company) {
        // For receipt, we need the related invoice too
        // We'll use a fallback if invoice is not available
        const fallbackInvoice: Invoice = {
          id: 0,
          companyId: companyId,
          customerId: customer.id,
          salesOrderId: undefined,
          invoiceNumber: document.documentNumber,
          invoiceDate: document.documentDate,
          dueDate: document.documentDate,
          status: 'Paid',
          subtotalAmount: document.totalAmount,
          taxAmount: 0,
          totalAmount: document.totalAmount,
          paidAmount: document.totalAmount,
          currency: 'ILS',
          notes: document.description || '',
          customerName: customer.name,
          customerAddress: customer.address || '',
          customerTaxId: customer.taxId,
          customerContact: customer.phone,
          lines: [],
          createdAt: document.documentDate,
          updatedAt: document.documentDate
        };

        return (
          <PrintableReceipt
            receipt={specificData.receipt}
            invoice={fallbackInvoice}
            customer={customer}
            company={specificData.company}
            className={className}
          />
        );
      }
      break;

    default:
      return (
        <Box 
          className={className}
          sx={{ 
            p: 3,
            backgroundColor: 'white',
            color: 'black',
            textAlign: 'center'
          }}
        >
          <Alert severity="error">
            סוג מסמך לא נתמך: {document.documentType}
          </Alert>
        </Box>
      );
  }

  // If we reach here, it means data is missing
  return (
    <Box 
      className={className}
      sx={{ 
        p: 3,
        backgroundColor: 'white',
        color: 'black',
        textAlign: 'center'
      }}
    >
      <Alert severity="error">
        שגיאה: נתונים חסרים להדפסת המסמך
      </Alert>
    </Box>
  );
};

export default PrintableIndividualDocument;
