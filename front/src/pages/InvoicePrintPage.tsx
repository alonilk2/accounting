import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { PrintableInvoice, PrintButton } from '../components/print';
import type { Invoice, Company } from '../types/entities';

const InvoicePrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchInvoiceAndCompany(parseInt(id, 10));
    }
  }, [id]);

  const fetchInvoiceAndCompany = async (invoiceId: number) => {
    try {
      setLoading(true);
      
      // Fetch invoice
      const invoiceResponse = await fetch(`/api/invoices/${invoiceId}`);
      if (!invoiceResponse.ok) {
        throw new Error('Failed to fetch invoice');
      }
      const invoiceData = await invoiceResponse.json();
      
      // Convert date strings to Date objects
      invoiceData.invoiceDate = new Date(invoiceData.invoiceDate);
      if (invoiceData.dueDate) {
        invoiceData.dueDate = new Date(invoiceData.dueDate);
      }
      if (invoiceData.createdAt) {
        invoiceData.createdAt = new Date(invoiceData.createdAt);
      }
      if (invoiceData.updatedAt) {
        invoiceData.updatedAt = new Date(invoiceData.updatedAt);
      }
      
      setInvoice(invoiceData);

      // Fetch company data (assuming endpoint exists)
      const companyResponse = await fetch('/api/company');
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        // Convert date strings to Date objects
        companyData.createdAt = new Date(companyData.createdAt);
        companyData.updatedAt = new Date(companyData.updatedAt);
        setCompany(companyData);
      } else {
        // Fallback company data
        setCompany({
          id: '1',
          name: 'החברה שלי',
          israelTaxId: '123456789',
          address: 'כתובת החברה',
          currency: 'ILS',
          phone: '03-1234567',
          email: 'info@company.co.il',
          website: 'www.company.co.il',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice || !company) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error || 'לא ניתן לטעון את החשבונית'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PrintButton 
        printableContent={() => 
          <PrintableInvoice
            invoice={invoice}
            company={company}
            className="printable-invoice"
          />
        }
        documentTitle={`חשבונית ${invoice.invoiceNumber}`}
      />
      <PrintableInvoice
        invoice={invoice}
        company={company}
        className="printable-invoice"
      />
    </Box>
  );
};

export default InvoicePrintPage;
