import { describe, it, expect } from 'vitest';
import type {
  User,
  Company,
  Customer,
  Item,
  SalesOrder,
  ApiResponse,
  PaginatedResponse,
  CreateCustomerForm,
} from './entities';

describe('Entity Types', () => {
  describe('User interface', () => {
    it('should have all required properties', () => {
      const user: User = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'role-1',
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.id).toBe('1');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.roleId).toBe('role-1');
      expect(user.companyId).toBe('company-1');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Company interface', () => {
    it('should have all required properties', () => {
      const company: Company = {
        id: 1,
        name: 'Test Company Ltd',
        israelTaxId: '123456789',
        address: '123 Test St, Tel Aviv',
        currency: 'ILS',
        fiscalYearStartMonth: 1,
        timeZone: 'Asia/Jerusalem',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(company.id).toBe(1);
      expect(company.name).toBe('Test Company Ltd');
      expect(company.israelTaxId).toBe('123456789');
      expect(company.address).toBe('123 Test St, Tel Aviv');
      expect(company.currency).toBe('ILS');
    });

    it('should allow optional properties', () => {
      const company: Company = {
        id: 1,
        name: 'Test Company Ltd',
        israelTaxId: '123456789',
        address: '123 Test St, Tel Aviv',
        currency: 'ILS',
        fiscalYearStartMonth: 1,
        timeZone: 'Asia/Jerusalem',
        isActive: true,
        phone: '+972-123-456789',
        email: 'info@testcompany.co.il',
        website: 'https://testcompany.co.il',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(company.phone).toBe('+972-123-456789');
      expect(company.email).toBe('info@testcompany.co.il');
      expect(company.website).toBe('https://testcompany.co.il');
    });
  });

  describe('Customer interface', () => {
    it('should have all required properties', () => {
      const customer: Customer = {
        id: 1,
        companyId: 1,
        name: 'Customer Name',
        address: '456 Customer St',
        contact: 'John Customer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(customer.id).toBe(1);
      expect(customer.companyId).toBe(1);
      expect(customer.name).toBe('Customer Name');
      expect(customer.isActive).toBe(true);
    });
  });

  describe('Item interface', () => {
    it('should have correct numeric types', () => {
      const item: Item = {
        id: 1,
        companyId: 1,
        sku: 'SKU-001',
        name: 'Test Item',
        unit: 'piece',
        costPrice: 10.50,
        sellPrice: 15.75,
        currentStockQty: 100,
        reorderPoint: 10,
        maxStockLevel: 500,
        itemType: 'Product',
        isInventoryTracked: true,
        isActive: true,
        isSellable: true,
        isPurchasable: true,
        // Backward compatibility aliases
        cost: 10.50,
        price: 15.75,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(typeof item.cost).toBe('number');
      expect(typeof item.price).toBe('number');
      expect(typeof item.currentStockQty).toBe('number');
      expect(typeof item.reorderPoint).toBe('number');
      expect(item.cost).toBe(10.50);
      expect(item.price).toBe(15.75);
    });
  });

  describe('SalesOrder interface', () => {
    it('should have valid status values', () => {
      const validStatuses: SalesOrder['status'][] = [
        'Draft',
        'Confirmed', 
        'Shipped',
        'Completed',
        'Cancelled'
      ];

      validStatuses.forEach(status => {
        const order: SalesOrder = {
          id: 1,
          companyId: 1,
          customerId: 1,
          customerName: 'Test Customer',
          orderNumber: 'SO-001',
          orderDate: new Date(),
          status,
          subtotalAmount: 90,
          taxAmount: 10,
          totalAmount: 100,
          paidAmount: 0,
          currency: 'ILS',
          notes: '',
          lines: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(order.status).toBe(status);
      });
    });
  });

  describe('ApiResponse interface', () => {
    it('should work with generic types', () => {
      const response: ApiResponse<Customer> = {
        data: {
          id: 1,
          companyId: 1,
          name: 'Test Customer',
          address: 'Test Address',
          contact: 'Test Contact',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        message: 'Success',
        success: true,
      };

      expect(response.success).toBe(true);
      expect(response.data.name).toBe('Test Customer');
      expect(response.message).toBe('Success');
    });
  });

  describe('PaginatedResponse interface', () => {
    it('should have correct pagination properties', () => {
      const response: PaginatedResponse<Item> = {
        data: [],
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10,
      };

      expect(response.total).toBe(100);
      expect(response.page).toBe(1);
      expect(response.pageSize).toBe(10);
      expect(response.totalPages).toBe(10);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('CreateCustomerForm interface', () => {
    it('should validate form structure', () => {
      const form: CreateCustomerForm = {
        name: 'New Customer',
        address: 'New Address',
        contact: 'New Contact',
        taxId: '987654321',
        email: 'customer@example.com',
        phone: '+972-987-654321',
      };

      expect(form.name).toBe('New Customer');
      expect(form.address).toBe('New Address');
      expect(form.contact).toBe('New Contact');
      expect(form.taxId).toBe('987654321');
      expect(form.email).toBe('customer@example.com');
      expect(form.phone).toBe('+972-987-654321');
    });

    it('should allow optional properties to be undefined', () => {
      const form: CreateCustomerForm = {
        name: 'New Customer',
        address: 'New Address',
        contact: 'New Contact',
      };

      expect(form.taxId).toBeUndefined();
      expect(form.email).toBeUndefined();
      expect(form.phone).toBeUndefined();
    });
  });
});
