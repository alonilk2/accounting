using backend.DTOs.AI;

namespace backend.Services.Interfaces;

/// <summary>
/// Azure Form Recognizer service interface for document processing
/// Processes invoices, receipts, and financial documents for Israeli businesses
/// </summary>
public interface IFormRecognizerService
{
    /// <summary>
    /// Analyze a receipt or invoice document
    /// </summary>
    /// <param name="documentStream">Document stream (PDF, image, etc.)</param>
    /// <param name="fileName">Original file name</param>
    /// <param name="companyId">Company ID for multi-tenant isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Extracted document data</returns>
    Task<DocumentScanResponse> AnalyzeDocumentAsync(
        Stream documentStream, 
        string fileName, 
        int companyId, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Analyze an Israeli tax invoice/receipt
    /// </summary>
    /// <param name="documentStream">Document stream</param>
    /// <param name="fileName">Original file name</param>
    /// <param name="companyId">Company ID for multi-tenant isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Extracted tax invoice data with Israeli-specific fields</returns>
    Task<DocumentScanResponse> AnalyzeTaxInvoiceAsync(
        Stream documentStream, 
        string fileName, 
        int companyId, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if Form Recognizer service is available
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if service is available</returns>
    Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default);
}
