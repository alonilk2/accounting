import api from './api';
import type { Invoice, InvoiceStatus, Receipt } from '../types/entities';

interface RawInvoice {
  id: number;
  companyId: number;
  customerId: number;
  salesOrderId?: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  status: InvoiceStatus;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  notes?: string;
  customerName: string;
  customerAddress: string;
  customerTaxId?: string;
  customerContact?: string;
  lines: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  customerId: number;
  salesOrderId?: number;
  invoiceDate: string;
  dueDate?: string;
  currency?: string;
  notes?: string;
  lines: CreateInvoiceLineRequest[];
}

export interface CreateInvoiceLineRequest {
  itemId?: number;
  lineNumber: number;
  description: string;
  itemSku?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
}

export interface UpdateInvoiceRequest {
  dueDate?: string;
  status: InvoiceStatus;
  notes?: string;
}

export const invoiceService = {
  // Get all invoices
  async getInvoices(): Promise<Invoice[]> {
    const response = await api.get('/invoices');
    return response.data.map((invoice: RawInvoice) => ({
      ...invoice,
      invoiceDate: new Date(invoice.invoiceDate),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt),
      lines: invoice.lines as Invoice['lines'],
    }));
  },

  // Get a specific invoice
  async getInvoice(id: number, companyId?: number): Promise<Invoice> {
    const params: Record<string, unknown> = {};
    if (companyId) params.companyId = companyId;
    
    const response = await api.get<Invoice>(`/invoices/${id}`, { params });
    return {
      ...response.data,
      invoiceDate: new Date(response.data.invoiceDate),
      dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  // Create a new invoice
  async createInvoice(invoice: CreateInvoiceRequest): Promise<Invoice> {
    const response = await api.post<Invoice>('/invoices', invoice);
    return {
      ...response.data,
      invoiceDate: new Date(response.data.invoiceDate),
      dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  // Update an invoice
  async updateInvoice(id: number, invoice: UpdateInvoiceRequest): Promise<void> {
    await api.put(`/invoices/${id}`, invoice);
  },

  // Delete an invoice
  async deleteInvoice(id: number): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },

  // Create invoice from sales order
  async createInvoiceFromSalesOrder(salesOrderId: number): Promise<Invoice> {
    const response = await api.post<Invoice>(`/invoices/from-sales-order/${salesOrderId}`);
    return {
      ...response.data,
      invoiceDate: new Date(response.data.invoiceDate),
      dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  // Get invoices by customer
  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    const response = await api.get<Invoice[]>(`/invoices?customerId=${customerId}`);
    return response.data.map(invoice => ({
      ...invoice,
      invoiceDate: new Date(invoice.invoiceDate),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt),
    }));
  },

  // Get overdue invoices
  async getOverdueInvoices(): Promise<Invoice[]> {
    const response = await api.get<Invoice[]>('/invoices?status=overdue');
    return response.data.map(invoice => ({
      ...invoice,
      invoiceDate: new Date(invoice.invoiceDate),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt),
    }));
  },

  // Get receipts for an invoice
  async getInvoiceReceipts(invoiceId: number): Promise<Receipt[]> {
    const response = await api.get(`/invoices/${invoiceId}/receipts`);
    return response.data.map((receipt: Receipt) => ({
      ...receipt,
      paymentDate: new Date(receipt.paymentDate),
      createdAt: new Date(receipt.createdAt),
    }));
  },

  // Process payment for an invoice
  async processPayment(
    invoiceId: number,
    amount: number,
    paymentMethod: string,
    notes?: string
  ): Promise<Receipt> {
    const response = await api.post(`/invoices/${invoiceId}/payment`, {
      amount,
      paymentMethod,
      notes,
    });
    return {
      ...response.data,
      paymentDate: new Date(response.data.paymentDate),
      createdAt: new Date(response.data.createdAt),
    };
  },

  // Get invoice by sales order ID
  async getInvoiceBySalesOrder(salesOrderId: number): Promise<Invoice | null> {
    try {
      const response = await api.get<Invoice[]>(`/invoices?salesOrderId=${salesOrderId}`);
      const invoices = response.data;
      if (invoices.length > 0) {
        const invoice = invoices[0];
        return {
          ...invoice,
          invoiceDate: new Date(invoice.invoiceDate),
          dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt),
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching invoice by sales order:', error);
      return null;
    }
  },
};
