using backend.Models.Sales;

namespace backend.Services.Interfaces;

/// <summary>
/// Print service interface for generating PDF documents
/// Handles document generation for invoices, receipts, and reports
/// </summary>
public interface IPrintService
{
    /// <summary>
    /// Generate invoice PDF
    /// </summary>
    /// <param name="invoiceId">Invoice ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>PDF bytes</returns>
    Task<byte[]> GenerateInvoicePdfAsync(int invoiceId, int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate receipt PDF
    /// </summary>
    /// <param name="receiptId">Receipt ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>PDF bytes</returns>
    Task<byte[]> GenerateReceiptPdfAsync(int receiptId, int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate customer documents report PDF
    /// </summary>
    /// <param name="customerId">Customer ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="fromDate">Optional start date filter</param>
    /// <param name="toDate">Optional end date filter</param>
    /// <param name="documentType">Optional document type filter</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>PDF bytes</returns>
    Task<byte[]> GenerateCustomerDocumentsReportPdfAsync(
        int customerId, 
        int companyId, 
        DateTime? fromDate = null, 
        DateTime? toDate = null, 
        string? documentType = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get document HTML for viewing (for browser display)
    /// </summary>
    /// <param name="documentType">Document type (SalesOrder, Receipt, POSSale)</param>
    /// <param name="documentId">Document ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>HTML content</returns>
    Task<string> GetDocumentHtmlAsync(string documentType, int documentId, int companyId, CancellationToken cancellationToken = default);
}
