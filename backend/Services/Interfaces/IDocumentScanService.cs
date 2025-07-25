using backend.DTOs.AI;

namespace backend.Services.Interfaces;

/// <summary>
/// Service for scanning and processing documents using Azure Form Recognizer
/// </summary>
public interface IDocumentScanService
{
    /// <summary>
    /// Scan a document (invoice, receipt, etc.) and extract data
    /// </summary>
    /// <param name="request">Document scan request with file data</param>
    /// <param name="companyId">Company ID for multi-tenant isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Extracted document data for review</returns>
    Task<DocumentScanResponse> ScanDocumentAsync(
        DocumentScanRequest request, 
        int companyId, 
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Create an expense from scanned and reviewed document data
    /// </summary>
    /// <param name="request">Create expense request with reviewed data</param>
    /// <param name="companyId">Company ID for multi-tenant isolation</param>
    /// <param name="userId">User ID for audit trail</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created expense ID</returns>
    Task<int> CreateExpenseFromScannedDataAsync(
        CreateExpenseFromScanRequest request, 
        int companyId, 
        string userId, 
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Store document file and return URL
    /// </summary>
    /// <param name="fileData">Base64 encoded file data</param>
    /// <param name="fileName">Original file name</param>
    /// <param name="contentType">MIME type</param>
    /// <param name="companyId">Company ID for file organization</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>File URL for reference</returns>
    Task<string> StoreDocumentAsync(
        string fileData, 
        string fileName, 
        string contentType, 
        int companyId, 
        CancellationToken cancellationToken = default);
}
