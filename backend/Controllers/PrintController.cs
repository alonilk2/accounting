using Microsoft.AspNetCore.Mvc;
using backend.Services.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// API controller for document printing and PDF generation
/// Handles invoice, receipt, and report generation for display and download
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PrintController : ControllerBase
{
    private readonly IPrintService _printService;
    private readonly ILogger<PrintController> _logger;

    public PrintController(
        IPrintService printService,
        ILogger<PrintController> logger)
    {
        _printService = printService ?? throw new ArgumentNullException(nameof(printService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Generate and download invoice PDF
    /// </summary>
    /// <param name="invoiceId">Invoice ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>PDF file for download</returns>
    [HttpGet("invoice/{invoiceId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> GetInvoicePdf(
        int invoiceId,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1; // Default for now
            
            var pdfBytes = await _printService.GenerateInvoicePdfAsync(invoiceId, currentCompanyId);
            
            return File(pdfBytes, "application/pdf", $"invoice-{invoiceId}.pdf");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invoice {InvoiceId} not found", invoiceId);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating invoice PDF for invoice {InvoiceId}", invoiceId);
            return StatusCode(500, new { message = "שגיאה ביצירת PDF" });
        }
    }

    /// <summary>
    /// Generate and download receipt PDF
    /// </summary>
    /// <param name="receiptId">Receipt ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>PDF file for download</returns>
    [HttpGet("receipt/{receiptId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> GetReceiptPdf(
        int receiptId,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1; // Default for now
            
            var pdfBytes = await _printService.GenerateReceiptPdfAsync(receiptId, currentCompanyId);
            
            return File(pdfBytes, "application/pdf", $"receipt-{receiptId}.pdf");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Receipt {ReceiptId} not found", receiptId);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating receipt PDF for receipt {ReceiptId}", receiptId);
            return StatusCode(500, new { message = "שגיאה ביצירת PDF" });
        }
    }

    /// <summary>
    /// Generate and download customer documents report PDF
    /// </summary>
    /// <param name="customerId">Customer ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="fromDate">Optional start date filter</param>
    /// <param name="toDate">Optional end date filter</param>
    /// <param name="documentType">Optional document type filter</param>
    /// <returns>PDF file for download</returns>
    [HttpGet("customer-documents/{customerId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> GetCustomerDocumentsReportPdf(
        int customerId,
        [FromQuery] int? companyId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? documentType = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1; // Default for now
            
            var pdfBytes = await _printService.GenerateCustomerDocumentsReportPdfAsync(
                customerId, currentCompanyId, fromDate, toDate, documentType);
            
            return File(pdfBytes, "application/pdf", $"customer-documents-{customerId}.pdf");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Customer {CustomerId} not found", customerId);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating customer documents report PDF for customer {CustomerId}", customerId);
            return StatusCode(500, new { message = "שגיאה ביצירת PDF" });
        }
    }

    /// <summary>
    /// View document HTML in browser (for preview before print/download)
    /// </summary>
    /// <param name="documentType">Document type (SalesOrder, Receipt, POSSale)</param>
    /// <param name="documentId">Document ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>HTML content for browser display</returns>
    [HttpGet("view/{documentType}/{documentId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> ViewDocument(
        string documentType,
        int documentId,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1; // Default for now
            
            var html = await _printService.GetDocumentHtmlAsync(documentType, documentId, currentCompanyId);
            
            return Content(html, "text/html; charset=utf-8");
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid document type: {DocumentType}", documentType);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Document {DocumentType} {DocumentId} not found", documentType, documentId);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error viewing document {DocumentType} {DocumentId}", documentType, documentId);
            return StatusCode(500, new { message = "שגיאה בטעינת המסמך" });
        }
    }

    /// <summary>
    /// Get document download URL for a specific document
    /// </summary>
    /// <param name="documentType">Document type (SalesOrder, Receipt, POSSale)</param>
    /// <param name="documentId">Document ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>URLs for viewing and downloading the document</returns>
    [HttpGet("urls/{documentType}/{documentId:int}")]
    [ProducesResponseType<DocumentUrlsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<DocumentUrlsDto> GetDocumentUrls(
        string documentType,
        int documentId,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            var baseUrl = $"{Request.Scheme}://{Request.Host}/api/print";

            var urls = new DocumentUrlsDto
            {
                ViewUrl = $"{baseUrl}/view/{documentType}/{documentId}?companyId={currentCompanyId}",
                DownloadUrl = documentType.ToLowerInvariant() switch
                {
                    "salesorder" => $"{baseUrl}/invoice/{documentId}?companyId={currentCompanyId}",
                    "receipt" => $"{baseUrl}/receipt/{documentId}?companyId={currentCompanyId}",
                    _ => $"{baseUrl}/view/{documentType}/{documentId}?companyId={currentCompanyId}"
                }
            };

            return Ok(urls);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating document URLs for {DocumentType} {DocumentId}", documentType, documentId);
            return BadRequest(new { message = "שגיאה ביצירת קישורים למסמך" });
        }
    }
}

/// <summary>
/// DTO for document URLs response
/// </summary>
public class DocumentUrlsDto
{
    /// <summary>
    /// URL for viewing the document in browser
    /// </summary>
    public string ViewUrl { get; set; } = string.Empty;

    /// <summary>
    /// URL for downloading the document as PDF
    /// </summary>
    public string DownloadUrl { get; set; } = string.Empty;
}
