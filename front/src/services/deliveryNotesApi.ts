// API service for Delivery Notes - שירות API לתעודות משלוח

import api, { getCompanyIdFromRequestContext } from './api';
import type { DeliveryNote } from '../types/entities';
import type { PaginatedResponse } from '../types/pagination';

// Match the server-side DeliveryNoteStatus enum
export type DeliveryNoteStatus = 'Draft' | 'Prepared' | 'InTransit' | 'Delivered' | 'Returned' | 'Cancelled';

// DTOs for DeliveryNote operations  
export interface CreateDeliveryNoteRequest {
  companyId: number;
  customerId: number;
  salesOrderId?: number;
  deliveryDate: string; // ISO date string
  expectedDeliveryTime?: string; // ISO date string
  status?: DeliveryNoteStatus;
  deliveryAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  driverName?: string;
  vehiclePlate?: string;
  deliveryInstructions?: string;
  notes?: string;
  trackingNumber?: string;
  courierService?: string;
  lines: CreateDeliveryNoteLineRequest[];
}

export interface CreateDeliveryNoteLineRequest {
  itemId: number;
  salesOrderLineId?: number;
  description?: string;
  quantityOrdered: number;
  quantityDelivered: number;
  quantityReturned?: number;
  unit?: string;
  unitWeight?: number;
  unitVolume?: number;
  serialNumbers?: string;
  batchNumbers?: string;
  expiryDate?: string; // ISO date string
  itemCondition?: string;
  notes?: string;
}

export interface UpdateDeliveryNoteRequest extends Partial<CreateDeliveryNoteRequest> {
  status?: 'Draft' | 'Prepared' | 'InTransit' | 'Delivered' | 'Returned' | 'Cancelled';
  actualDeliveryTime?: string; // ISO date string
  receivedByName?: string;
  receivedAt?: string; // ISO date string
  customerSignature?: string;
}

export interface DeliveryNoteResponse {
  id: number;
  companyId: number;
  customerId: number;
  customerName: string;
  salesOrderId?: number;
  salesOrderNumber?: string;
  deliveryNoteNumber: string;
  deliveryDate: string;
  expectedDeliveryTime?: string;
  actualDeliveryTime?: string;
  status: 'Draft' | 'Prepared' | 'InTransit' | 'Delivered' | 'Returned' | 'Cancelled';
  deliveryAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  driverName?: string;
  vehiclePlate?: string;
  totalQuantity: number;
  totalWeight?: number;
  totalVolume?: number;
  deliveryInstructions?: string;
  notes?: string;
  customerSignature?: string;
  receivedByName?: string;
  receivedAt?: string;
  trackingNumber?: string;
  courierService?: string;
  lines: DeliveryNoteLineResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryNoteLineResponse {
  id: number;
  deliveryNoteId: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  salesOrderLineId?: number;
  lineNumber: number;
  description?: string;
  quantityOrdered: number;
  quantityDelivered: number;
  quantityReturned: number;
  unit?: string;
  unitWeight?: number;
  unitVolume?: number;
  serialNumbers?: string;
  batchNumbers?: string;
  expiryDate?: string;
  itemCondition?: string;
  notes?: string;
}

export interface GenerateDeliveryNoteFromOrderRequest {
  deliveryDate?: string;
  deliveryAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  driverName?: string;
  vehiclePlate?: string;
  deliveryInstructions?: string;
  notes?: string;
  lines?: OrderLineDeliveryRequest[];
}

export interface OrderLineDeliveryRequest {
  salesOrderLineId: number;
  quantityToDeliver: number;
  serialNumbers?: string;
  batchNumbers?: string;
  expiryDate?: string;
  itemCondition?: string;
  notes?: string;
}

export interface DeliveryNoteFilters {
  customerId?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

export interface DeliveryNotesListResponse {
  deliveryNotes: DeliveryNoteResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const resolveCompanyId = (companyId: number): number | undefined => {
  if (Number.isFinite(companyId) && companyId > 0) {
    return companyId;
  }

  return getCompanyIdFromRequestContext();
};

const appendCompanyId = (params: URLSearchParams, companyId: number): void => {
  const resolvedCompanyId = resolveCompanyId(companyId);
  if (resolvedCompanyId !== undefined) {
    params.append('companyId', resolvedCompanyId.toString());
  }
};

const withQuery = (path: string, params: URLSearchParams): string => {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

// Helper function to convert DeliveryNoteResponse to DeliveryNote entity
const mapDeliveryNoteResponseToEntity = (response: DeliveryNoteResponse): DeliveryNote => ({
  id: response.id,
  companyId: response.companyId,
  customerId: response.customerId,
  customerName: response.customerName || '',
  salesOrderId: response.salesOrderId,
  salesOrderNumber: response.salesOrderNumber,
  deliveryNoteNumber: response.deliveryNoteNumber || '',
  deliveryDate: new Date(response.deliveryDate),
  expectedDeliveryTime: response.expectedDeliveryTime ? new Date(response.expectedDeliveryTime) : undefined,
  actualDeliveryTime: response.actualDeliveryTime ? new Date(response.actualDeliveryTime) : undefined,
  status: response.status,
  deliveryAddress: response.deliveryAddress,
  contactPerson: response.contactPerson,
  contactPhone: response.contactPhone,
  driverName: response.driverName,
  vehiclePlate: response.vehiclePlate,
  totalQuantity: response.totalQuantity || 0,
  totalWeight: response.totalWeight,
  totalVolume: response.totalVolume,
  deliveryInstructions: response.deliveryInstructions,
  notes: response.notes,
  customerSignature: response.customerSignature,
  receivedByName: response.receivedByName,
  receivedAt: response.receivedAt ? new Date(response.receivedAt) : undefined,
  trackingNumber: response.trackingNumber,
  courierService: response.courierService,
  lines: (response.lines || []).map(line => ({
    id: line.id,
    deliveryNoteId: line.deliveryNoteId,
    itemId: line.itemId,
    itemName: line.itemName || '',
    itemSku: line.itemSku || '',
    salesOrderLineId: line.salesOrderLineId,
    lineNumber: line.lineNumber || 0,
    description: line.description,
    quantityOrdered: line.quantityOrdered || 0,
    quantityDelivered: line.quantityDelivered || 0,
    quantityReturned: line.quantityReturned || 0,
    unit: line.unit,
    unitWeight: line.unitWeight,
    unitVolume: line.unitVolume,
    serialNumbers: line.serialNumbers,
    batchNumbers: line.batchNumbers,
    expiryDate: line.expiryDate ? new Date(line.expiryDate) : undefined,
    itemCondition: line.itemCondition,
    notes: line.notes
  })),
  createdAt: new Date(response.createdAt),
  updatedAt: new Date(response.updatedAt)
});

// Helper function to convert DeliveryNote entity to CreateDeliveryNoteRequest
const mapDeliveryNoteEntityToRequest = (deliveryNote: DeliveryNote): CreateDeliveryNoteRequest => ({
  companyId: deliveryNote.companyId,
  customerId: deliveryNote.customerId,
  salesOrderId: deliveryNote.salesOrderId,
  deliveryDate: deliveryNote.deliveryDate.toISOString(),
  expectedDeliveryTime: deliveryNote.expectedDeliveryTime?.toISOString(),
  status: deliveryNote.status,
  deliveryAddress: deliveryNote.deliveryAddress,
  contactPerson: deliveryNote.contactPerson,
  contactPhone: deliveryNote.contactPhone,
  driverName: deliveryNote.driverName,
  vehiclePlate: deliveryNote.vehiclePlate,
  deliveryInstructions: deliveryNote.deliveryInstructions,
  notes: deliveryNote.notes,
  trackingNumber: deliveryNote.trackingNumber,
  courierService: deliveryNote.courierService,
  lines: deliveryNote.lines.map(line => ({
    itemId: line.itemId,
    salesOrderLineId: line.salesOrderLineId,
    description: line.description,
    quantityOrdered: line.quantityOrdered,
    quantityDelivered: line.quantityDelivered,
    quantityReturned: line.quantityReturned,
    unit: line.unit,
    unitWeight: line.unitWeight,
    unitVolume: line.unitVolume,
    serialNumbers: line.serialNumbers,
    batchNumbers: line.batchNumbers,
    expiryDate: line.expiryDate?.toISOString(),
    itemCondition: line.itemCondition,
    notes: line.notes
  }))
});

export class DeliveryNotesApi {
  private baseUrl = '/delivery-notes';

  /**
   * Get all delivery notes with optional filtering
   */
  async getDeliveryNotes(
    companyId: number,
    filters?: DeliveryNoteFilters,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<DeliveryNote>> {
    try {
      const params = new URLSearchParams();
      appendCompanyId(params, companyId);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      if (filters?.customerId) {
        params.append('customerId', filters.customerId.toString());
      }
      
      if (filters?.status) {
        params.append('status', filters.status);
      }
      
      if (filters?.fromDate) {
        params.append('fromDate', filters.fromDate);
      }
      
      if (filters?.toDate) {
        params.append('toDate', filters.toDate);
      }
      
      if (filters?.searchTerm) {
        params.append('searchTerm', filters.searchTerm);
      }

      const response = await api.get<PaginatedResponse<DeliveryNoteResponse>>(
        withQuery(this.baseUrl, params)
      );

      console.log('API Response received:', response.data);

      // Check if response data exists
      if (!response.data) {
        console.warn('No delivery notes data received from server');
        return {
          data: [],
          page: page,
          pageSize: pageSize,
          totalCount: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false
        };
      }

      // Map the delivery notes from the paginated response
      const mappedDeliveryNotes = (response.data.data || []).map(mapDeliveryNoteResponseToEntity);

      console.log('Mapped delivery notes:', mappedDeliveryNotes);

      return {
        data: mappedDeliveryNotes,
        page: response.data.page || page,
        pageSize: response.data.pageSize || pageSize,
        totalCount: response.data.totalCount || 0,
        totalPages: response.data.totalPages || 0,
        hasPreviousPage: response.data.hasPreviousPage || false,
        hasNextPage: response.data.hasNextPage || false
      };
    } catch (error) {
      console.error('Error fetching delivery notes:', error);
      throw error;
    }
  }

  /**
   * Get a specific delivery note by ID
   */
  async getDeliveryNote(id: number, companyId: number): Promise<DeliveryNote> {
    try {
      const params = new URLSearchParams();
      appendCompanyId(params, companyId);

      const response = await api.get<DeliveryNoteResponse>(
        withQuery(`${this.baseUrl}/${id}`, params)
      );

      // Check if response data exists
      if (!response.data) {
        throw new Error('No delivery note data received from server');
      }

      return mapDeliveryNoteResponseToEntity(response.data);
    } catch (error) {
      console.error('Error fetching delivery note:', error);
      throw error;
    }
  }

  /**
   * Create a new delivery note from request
   */
  async createDeliveryNoteFromRequest(request: CreateDeliveryNoteRequest): Promise<DeliveryNote> {
    try {
      const resolvedCompanyId = resolveCompanyId(request.companyId);
      const payload: CreateDeliveryNoteRequest = {
        ...request,
        companyId: resolvedCompanyId ?? request.companyId,
      };

      const response = await api.post<DeliveryNoteResponse>(
        this.baseUrl,
        payload
      );

      return mapDeliveryNoteResponseToEntity(response.data);
    } catch (error) {
      console.error('Error creating delivery note:', error);
      throw error;
    }
  }

  /**
   * Create a new delivery note
   */
  async createDeliveryNote(deliveryNote: DeliveryNote): Promise<DeliveryNote> {
    try {
      const resolvedCompanyId = resolveCompanyId(deliveryNote.companyId);
      const request = mapDeliveryNoteEntityToRequest({
        ...deliveryNote,
        companyId: resolvedCompanyId ?? deliveryNote.companyId,
      });
      
      const response = await api.post<DeliveryNoteResponse>(
        this.baseUrl,
        request
      );

      return mapDeliveryNoteResponseToEntity(response.data);
    } catch (error) {
      console.error('Error creating delivery note:', error);
      throw error;
    }
  }

  /**
   * Update an existing delivery note
   */
  async updateDeliveryNote(id: number, deliveryNote: Partial<DeliveryNote>): Promise<DeliveryNote> {
    try {
      const resolvedCompanyId =
        deliveryNote.companyId !== undefined
          ? resolveCompanyId(deliveryNote.companyId)
          : undefined;

      // Convert partial entity to partial request
      const request: UpdateDeliveryNoteRequest = {
        companyId: resolvedCompanyId,
        customerId: deliveryNote.customerId,
        salesOrderId: deliveryNote.salesOrderId,
        deliveryDate: deliveryNote.deliveryDate?.toISOString(),
        expectedDeliveryTime: deliveryNote.expectedDeliveryTime?.toISOString(),
        actualDeliveryTime: deliveryNote.actualDeliveryTime?.toISOString(),
        status: deliveryNote.status,
        deliveryAddress: deliveryNote.deliveryAddress,
        contactPerson: deliveryNote.contactPerson,
        contactPhone: deliveryNote.contactPhone,
        driverName: deliveryNote.driverName,
        vehiclePlate: deliveryNote.vehiclePlate,
        deliveryInstructions: deliveryNote.deliveryInstructions,
        notes: deliveryNote.notes,
        receivedByName: deliveryNote.receivedByName,
        receivedAt: deliveryNote.receivedAt?.toISOString(),
        customerSignature: deliveryNote.customerSignature,
        trackingNumber: deliveryNote.trackingNumber,
        courierService: deliveryNote.courierService,
      };

      const response = await api.put<DeliveryNoteResponse>(
        `${this.baseUrl}/${id}`,
        request
      );

      return mapDeliveryNoteResponseToEntity(response.data);
    } catch (error) {
      console.error('Error updating delivery note:', error);
      throw error;
    }
  }

  /**
   * Delete a delivery note (soft delete)
   */
  async deleteDeliveryNote(id: number, companyId: number): Promise<void> {
    try {
      const params = new URLSearchParams();
      appendCompanyId(params, companyId);
      await api.delete(withQuery(`${this.baseUrl}/${id}`, params));
    } catch (error) {
      console.error('Error deleting delivery note:', error);
      throw error;
    }
  }

  /**
   * Update delivery note status
   */
  async updateDeliveryNoteStatus(
    id: number, 
    status: 'Draft' | 'Prepared' | 'InTransit' | 'Delivered' | 'Returned' | 'Cancelled',
    companyId: number,
    additionalData?: {
      actualDeliveryTime?: Date;
      receivedByName?: string;
      receivedAt?: Date;
      customerSignature?: string;
      notes?: string;
    }
  ): Promise<DeliveryNote> {
    try {
      const params = new URLSearchParams();
      appendCompanyId(params, companyId);

      const request = {
        status,
        actualDeliveryTime: additionalData?.actualDeliveryTime?.toISOString(),
        receivedByName: additionalData?.receivedByName,
        receivedAt: additionalData?.receivedAt?.toISOString(),
        customerSignature: additionalData?.customerSignature,
        notes: additionalData?.notes,
      };

      const response = await api.put<DeliveryNoteResponse>(
        withQuery(`${this.baseUrl}/${id}/status`, params),
        request
      );

      return mapDeliveryNoteResponseToEntity(response.data);
    } catch (error) {
      console.error('Error updating delivery note status:', error);
      throw error;
    }
  }

  /**
   * Generate delivery note from sales order
   */
  async generateDeliveryNoteFromOrder(
    salesOrderId: number, 
    request: GenerateDeliveryNoteFromOrderRequest,
    companyId: number
  ): Promise<DeliveryNote> {
    try {
      const params = new URLSearchParams();
      appendCompanyId(params, companyId);

      const response = await api.post<DeliveryNoteResponse>(
        withQuery(`${this.baseUrl}/from-order/${salesOrderId}`, params),
        request
      );

      return mapDeliveryNoteResponseToEntity(response.data);
    } catch (error) {
      console.error('Error generating delivery note from order:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const deliveryNotesApi = new DeliveryNotesApi();
