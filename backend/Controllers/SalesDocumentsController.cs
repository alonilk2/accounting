using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Services.Interfaces;
using backend.Models.Sales;
using backend.DTOs.Sales;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// API controller for unified sales documents management
/// מרכז את כל מסמכי המכירות: חשבוניות מס, חשבוניות מס-קבלה, קבלות, תעודות משלוח
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SalesDocumentsController : ControllerBase
{
    private readonly AccountingDbContext _context;
    private readonly IPrintService _printService;
    private readonly ILogger<SalesDocumentsController> _logger;

    public SalesDocumentsController(
        AccountingDbContext context,
        IPrintService printService,
        ILogger<SalesDocumentsController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _printService = printService ?? throw new ArgumentNullException(nameof(printService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all sales documents grouped by month
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="fromDate">Optional start date filter</param>
    /// <param name="toDate">Optional end date filter</param>
    /// <param name="documentType">Optional document type filter</param>
    /// <param name="searchTerm">Optional search term</param>
    /// <param name="customerId">Optional customer filter</param>
    /// <returns>Sales documents grouped by month</returns>
    [HttpGet]
    [ProducesResponseType<SalesDocumentsResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SalesDocumentsResponseDto>> GetSalesDocuments(
        [FromQuery] int? companyId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? documentType = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int? customerId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            
            _logger.LogInformation("Retrieving sales documents for company {CompanyId}", currentCompanyId);

            var documents = new List<SalesDocumentDto>();

            // Get Sales Orders
            if (string.IsNullOrEmpty(documentType) || documentType.Equals("SalesOrder", StringComparison.OrdinalIgnoreCase))
            {
                var salesOrders = await GetSalesOrderDocuments(currentCompanyId, fromDate, toDate, customerId, searchTerm);
                documents.AddRange(salesOrders);
            }

            // Get Invoices
            if (string.IsNullOrEmpty(documentType) || documentType.Equals("Invoice", StringComparison.OrdinalIgnoreCase))
            {
                var invoices = await GetInvoiceDocuments(currentCompanyId, fromDate, toDate, customerId, searchTerm);
                documents.AddRange(invoices);
            }

            // Get Tax Invoice Receipts
            if (string.IsNullOrEmpty(documentType) || documentType.Equals("TaxInvoiceReceipt", StringComparison.OrdinalIgnoreCase))
            {
                var taxInvoiceReceipts = await GetTaxInvoiceReceiptDocuments(currentCompanyId, fromDate, toDate, customerId, searchTerm);
                documents.AddRange(taxInvoiceReceipts);
            }

            // Get Receipts
            if (string.IsNullOrEmpty(documentType) || documentType.Equals("Receipt", StringComparison.OrdinalIgnoreCase))
            {
                var receipts = await GetReceiptDocuments(currentCompanyId, fromDate, toDate, customerId, searchTerm);
                documents.AddRange(receipts);
            }

            // Sort documents by date (newest first)
            documents = documents.OrderByDescending(d => d.DocumentDate).ToList();

            // Group by month
            var monthlyGroups = GroupDocumentsByMonth(documents);

            var response = new SalesDocumentsResponseDto
            {
                MonthlyGroups = monthlyGroups,
                TotalDocuments = documents.Count,
                TotalAmount = documents.Sum(d => d.TotalAmount),
                FromDate = fromDate,
                ToDate = toDate,
                DocumentType = documentType,
                SearchTerm = searchTerm,
                CustomerId = customerId
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales documents");
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Cancel a sales document
    /// </summary>
    /// <param name="documentType">Document type</param>
    /// <param name="documentId">Document ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Success result</returns>
    [HttpPost("{documentType}/{documentId}/cancel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> CancelDocument(
        string documentType,
        int documentId,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;

            switch (documentType.ToLowerInvariant())
            {
                case "salesorder":
                    var salesOrder = await _context.SalesOrders
                        .Where(so => so.Id == documentId && so.CompanyId == currentCompanyId)
                        .FirstOrDefaultAsync();
                    
                    if (salesOrder == null)
                        return NotFound("Sales order not found");

                    if (salesOrder.Status == SalesOrderStatus.Cancelled)
                        return BadRequest("Sales order is already cancelled");

                    salesOrder.Status = SalesOrderStatus.Cancelled;
                    break;

                case "invoice":
                    var invoice = await _context.Invoices
                        .Where(inv => inv.Id == documentId && inv.CompanyId == currentCompanyId)
                        .FirstOrDefaultAsync();
                    
                    if (invoice == null)
                        return NotFound("Invoice not found");

                    if (invoice.Status == InvoiceStatus.Cancelled)
                        return BadRequest("Invoice is already cancelled");

                    if (invoice.Status == InvoiceStatus.Paid)
                        return BadRequest("Cannot cancel a paid invoice");

                    invoice.Status = InvoiceStatus.Cancelled;
                    break;

                case "taxinvoicereceipt":
                    var taxInvoiceReceipt = await _context.TaxInvoiceReceipts
                        .Where(tir => tir.Id == documentId && tir.CompanyId == currentCompanyId)
                        .FirstOrDefaultAsync();
                    
                    if (taxInvoiceReceipt == null)
                        return NotFound("Tax invoice receipt not found");

                    if (taxInvoiceReceipt.Status == TaxInvoiceReceiptStatus.Cancelled)
                        return BadRequest("Tax invoice receipt is already cancelled");

                    taxInvoiceReceipt.Status = TaxInvoiceReceiptStatus.Cancelled;
                    break;

                default:
                    return BadRequest($"Document type '{documentType}' cannot be cancelled");
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Document cancelled successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling document {DocumentType} with ID {DocumentId}", documentType, documentId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Generate receipt for an invoice
    /// </summary>
    /// <param name="invoiceId">Invoice ID</param>
    /// <param name="request">Receipt generation request</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Created receipt</returns>
    [HttpPost("invoice/{invoiceId}/receipt")]
    [ProducesResponseType<ReceiptDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ReceiptDto>> GenerateReceipt(
        int invoiceId,
        [FromBody] GenerateReceiptRequest request,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;

            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Where(inv => inv.Id == invoiceId && inv.CompanyId == currentCompanyId)
                .FirstOrDefaultAsync();

            if (invoice == null)
                return NotFound("Invoice not found");

            if (invoice.Status != InvoiceStatus.Sent)
                return BadRequest("Can only generate receipts for sent invoices");

            var remainingAmount = invoice.TotalAmount - invoice.PaidAmount;
            if (remainingAmount <= 0)
                return BadRequest("Invoice is already fully paid");

            var paymentAmount = request.Amount ?? remainingAmount;
            if (paymentAmount > remainingAmount)
                return BadRequest("Payment amount cannot exceed remaining amount");

            // Generate receipt number
            var receiptCount = await _context.Receipts
                .Where(r => r.CompanyId == currentCompanyId)
                .CountAsync();
            var receiptNumber = $"R{currentCompanyId:D3}-{receiptCount + 1:D6}";

            var receipt = new Receipt
            {
                CompanyId = currentCompanyId,
                InvoiceId = invoiceId,
                ReceiptNumber = receiptNumber,
                PaymentDate = request.PaymentDate ?? DateTime.UtcNow,
                Amount = paymentAmount,
                PaymentMethod = request.PaymentMethod ?? "מזומן",
                ReferenceNumber = request.ReferenceNumber,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Receipts.Add(receipt);

            // Update invoice paid amount
            invoice.PaidAmount += paymentAmount;
            if (invoice.PaidAmount >= invoice.TotalAmount)
            {
                invoice.Status = InvoiceStatus.Paid;
            }

            await _context.SaveChangesAsync();

            var receiptDto = new ReceiptDto
            {
                Id = receipt.Id,
                CompanyId = receipt.CompanyId,
                InvoiceId = receipt.InvoiceId,
                InvoiceNumber = invoice.InvoiceNumber,
                CustomerName = invoice.Customer.Name,
                ReceiptNumber = receipt.ReceiptNumber,
                PaymentDate = receipt.PaymentDate,
                Amount = receipt.Amount,
                PaymentMethod = receipt.PaymentMethod,
                ReferenceNumber = receipt.ReferenceNumber,
                Notes = receipt.Notes,
                CreatedAt = receipt.CreatedAt
            };

            return CreatedAtAction(nameof(GetSalesDocuments), new { }, receiptDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating receipt for invoice {InvoiceId}", invoiceId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Send document by email
    /// </summary>
    /// <param name="documentType">Document type</param>
    /// <param name="documentId">Document ID</param>
    /// <param name="request">Email request</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Success result</returns>
    [HttpPost("{documentType}/{documentId}/send-email")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public ActionResult SendDocumentByEmail(
        string documentType,
        int documentId,
        [FromBody] SendEmailRequest request,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;

            // TODO: Implement email sending logic based on document type
            _logger.LogInformation("Sending {DocumentType} {DocumentId} to email {Email}",
                documentType, documentId, request.EmailAddress);

            // For now, just return success
            return Ok(new { message = "Document sent successfully", email = request.EmailAddress });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending document {DocumentType} with ID {DocumentId} by email", documentType, documentId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Export document to PDF
    /// </summary>
    /// <param name="documentType">Document type</param>
    /// <param name="documentId">Document ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>PDF file</returns>
    [HttpGet("{documentType}/{documentId}/export-pdf")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public ActionResult ExportDocumentToPdf(
        string documentType,
        int documentId,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;

            // TODO: Implement PDF generation logic based on document type
            _logger.LogInformation("Exporting {DocumentType} {DocumentId} to PDF", documentType, documentId);

            // For now, return a simple PDF content
            var pdfContent = System.Text.Encoding.UTF8.GetBytes($"PDF content for {documentType} {documentId}");
            return File(pdfContent, "application/pdf", $"{documentType}_{documentId}.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting document {DocumentType} with ID {DocumentId} to PDF", documentType, documentId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Print document
    /// </summary>
    /// <param name="documentType">Document type</param>
    /// <param name="documentId">Document ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Success result</returns>
    [HttpPost("{documentType}/{documentId}/print")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public ActionResult PrintDocument(
        string documentType,
        int documentId,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;

            // TODO: Implement printing logic based on document type
            // For now, we'll use the print service to get document HTML and simulate printing
            _logger.LogInformation("Printing {DocumentType} {DocumentId}", documentType, documentId);

            // Since there's no direct print method, we can generate PDF and return success
            // This could be extended to integrate with actual printing services
            return Ok(new { message = "Document sent to printer successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error printing document {DocumentType} with ID {DocumentId}", documentType, documentId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    #region Private Methods

    private async Task<List<SalesDocumentDto>> GetSalesOrderDocuments(
        int companyId, DateTime? fromDate, DateTime? toDate, int? customerId, string? searchTerm)
    {
        var query = _context.SalesOrders
            .Include(so => so.Customer)
            .Where(so => so.CompanyId == companyId && !so.IsDeleted);

        if (fromDate.HasValue)
            query = query.Where(so => so.OrderDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(so => so.OrderDate <= toDate.Value);
        if (customerId.HasValue)
            query = query.Where(so => so.CustomerId == customerId.Value);
        if (!string.IsNullOrEmpty(searchTerm))
        {
            var searchLower = searchTerm.ToLower();
            query = query.Where(so => 
                so.OrderNumber.ToLower().Contains(searchLower) ||
                so.Customer.Name.ToLower().Contains(searchLower) ||
                (so.Notes != null && so.Notes.ToLower().Contains(searchLower)));
        }

        var salesOrders = await query
            .Select(so => new SalesDocumentDto
            {
                Id = so.Id,
                DocumentType = "SalesOrder",
                DocumentNumber = so.OrderNumber,
                DocumentDate = so.OrderDate,
                CustomerName = so.Customer.Name,
                CustomerId = so.CustomerId,
                TotalAmount = so.TotalAmount,
                Status = GetSalesOrderStatusInHebrew(so.Status),
                Currency = so.Currency,
                Notes = so.Notes,
                CanGenerateReceipt = false,
                CanCancel = so.Status != SalesOrderStatus.Cancelled && so.Status != SalesOrderStatus.Completed,
                CanEdit = so.Status == SalesOrderStatus.Quote,
                CanEmail = true,
                CanPrint = true,
                CanExportPdf = true
            })
            .ToListAsync();

        return salesOrders;
    }

    private async Task<List<SalesDocumentDto>> GetInvoiceDocuments(
        int companyId, DateTime? fromDate, DateTime? toDate, int? customerId, string? searchTerm)
    {
        var query = _context.Invoices
            .Include(inv => inv.Customer)
            .Where(inv => inv.CompanyId == companyId && !inv.IsDeleted);

        if (fromDate.HasValue)
            query = query.Where(inv => inv.InvoiceDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(inv => inv.InvoiceDate <= toDate.Value);
        if (customerId.HasValue)
            query = query.Where(inv => inv.CustomerId == customerId.Value);
        if (!string.IsNullOrEmpty(searchTerm))
        {
            var searchLower = searchTerm.ToLower();
            query = query.Where(inv => 
                inv.InvoiceNumber.ToLower().Contains(searchLower) ||
                inv.Customer.Name.ToLower().Contains(searchLower) ||
                (inv.Notes != null && inv.Notes.ToLower().Contains(searchLower)));
        }

        var invoices = await query
            .Select(inv => new SalesDocumentDto
            {
                Id = inv.Id,
                DocumentType = "Invoice",
                DocumentNumber = inv.InvoiceNumber,
                DocumentDate = inv.InvoiceDate,
                CustomerName = inv.Customer.Name,
                CustomerId = inv.CustomerId,
                TotalAmount = inv.TotalAmount,
                Status = GetInvoiceStatusInHebrew(inv.Status),
                Currency = inv.Currency,
                Notes = inv.Notes,
                CanGenerateReceipt = inv.Status == InvoiceStatus.Sent && inv.PaidAmount < inv.TotalAmount,
                CanCancel = inv.Status != InvoiceStatus.Cancelled && inv.Status != InvoiceStatus.Paid,
                CanEdit = inv.Status == InvoiceStatus.Draft,
                CanEmail = true,
                CanPrint = true,
                CanExportPdf = true
            })
            .ToListAsync();

        return invoices;
    }

    private async Task<List<SalesDocumentDto>> GetTaxInvoiceReceiptDocuments(
        int companyId, DateTime? fromDate, DateTime? toDate, int? customerId, string? searchTerm)
    {
        var query = _context.TaxInvoiceReceipts
            .Include(tir => tir.Customer)
            .Where(tir => tir.CompanyId == companyId);

        if (fromDate.HasValue)
            query = query.Where(tir => tir.DocumentDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(tir => tir.DocumentDate <= toDate.Value);
        if (customerId.HasValue)
            query = query.Where(tir => tir.CustomerId == customerId.Value);
        if (!string.IsNullOrEmpty(searchTerm))
        {
            var searchLower = searchTerm.ToLower();
            query = query.Where(tir => 
                tir.DocumentNumber.ToLower().Contains(searchLower) ||
                tir.Customer.Name.ToLower().Contains(searchLower) ||
                (tir.Notes != null && tir.Notes.ToLower().Contains(searchLower)));
        }

        var taxInvoiceReceipts = await query
            .Select(tir => new SalesDocumentDto
            {
                Id = tir.Id,
                DocumentType = "TaxInvoiceReceipt",
                DocumentNumber = tir.DocumentNumber,
                DocumentDate = tir.DocumentDate,
                CustomerName = tir.Customer.Name,
                CustomerId = tir.CustomerId,
                TotalAmount = tir.TotalAmount,
                Status = GetTaxInvoiceReceiptStatusInHebrew(tir.Status),
                Currency = tir.Currency,
                Notes = tir.Notes,
                CanGenerateReceipt = false,
                CanCancel = tir.Status != TaxInvoiceReceiptStatus.Cancelled,
                CanEdit = false,
                CanEmail = true,
                CanPrint = true,
                CanExportPdf = true
            })
            .ToListAsync();

        return taxInvoiceReceipts;
    }

    private async Task<List<SalesDocumentDto>> GetReceiptDocuments(
        int companyId, DateTime? fromDate, DateTime? toDate, int? customerId, string? searchTerm)
    {
        var query = _context.Receipts
            .Include(r => r.Invoice)
            .ThenInclude(i => i.Customer)
            .Where(r => r.CompanyId == companyId && !r.IsDeleted);

        if (fromDate.HasValue)
            query = query.Where(r => r.PaymentDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(r => r.PaymentDate <= toDate.Value);
        if (customerId.HasValue)
            query = query.Where(r => r.Invoice.CustomerId == customerId.Value);
        if (!string.IsNullOrEmpty(searchTerm))
        {
            var searchLower = searchTerm.ToLower();
            query = query.Where(r => 
                r.ReceiptNumber.ToLower().Contains(searchLower) ||
                r.Invoice.Customer.Name.ToLower().Contains(searchLower) ||
                (r.Notes != null && r.Notes.ToLower().Contains(searchLower)));
        }

        var receipts = await query
            .Select(r => new SalesDocumentDto
            {
                Id = r.Id,
                DocumentType = "Receipt",
                DocumentNumber = r.ReceiptNumber,
                DocumentDate = r.PaymentDate,
                CustomerName = r.Invoice.Customer.Name,
                CustomerId = r.Invoice.CustomerId,
                TotalAmount = r.Amount,
                Status = "שולם",
                Currency = "ILS", // Default currency
                Notes = r.Notes,
                CanGenerateReceipt = false,
                CanCancel = false,
                CanEdit = false,
                CanEmail = true,
                CanPrint = true,
                CanExportPdf = true
            })
            .ToListAsync();

        return receipts;
    }

    private List<MonthlyDocumentsDto> GroupDocumentsByMonth(List<SalesDocumentDto> documents)
    {
        var groups = documents
            .GroupBy(d => new { Year = d.DocumentDate.Year, Month = d.DocumentDate.Month })
            .OrderByDescending(g => g.Key.Year)
            .ThenByDescending(g => g.Key.Month)
            .Select(g => new MonthlyDocumentsDto
            {
                MonthKey = $"{g.Key.Year}-{g.Key.Month:D2}",
                MonthDisplay = GetHebrewMonthName(g.Key.Year, g.Key.Month),
                Documents = g.OrderByDescending(d => d.DocumentDate).ToList(),
                TotalCount = g.Count(),
                TotalAmount = g.Sum(d => d.TotalAmount)
            })
            .ToList();

        return groups;
    }

    private static string GetHebrewMonthName(int year, int month)
    {
        var monthNames = new[]
        {
            "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
            "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
        };

        return $"{monthNames[month - 1]} {year}";
    }

    private static string GetSalesOrderStatusInHebrew(SalesOrderStatus status)
    {
        return status switch
        {
            SalesOrderStatus.Quote => "הצעת מחיר",
            SalesOrderStatus.Confirmed => "הזמנה",
            SalesOrderStatus.Shipped => "נשלח",
            SalesOrderStatus.Completed => "הושלם",
            SalesOrderStatus.Cancelled => "בוטל",
            _ => status.ToString()
        };
    }

    private static string GetInvoiceStatusInHebrew(InvoiceStatus status)
    {
        return status switch
        {
            InvoiceStatus.Draft => "טיוטה",
            InvoiceStatus.Sent => "נשלחה",
            InvoiceStatus.Paid => "שולמה",
            InvoiceStatus.Overdue => "פגת תוקף",
            InvoiceStatus.Cancelled => "בוטלה",
            _ => status.ToString()
        };
    }

    private static string GetTaxInvoiceReceiptStatusInHebrew(TaxInvoiceReceiptStatus status)
    {
        return status switch
        {
            TaxInvoiceReceiptStatus.Paid => "שולם",
            TaxInvoiceReceiptStatus.Cancelled => "בוטל",
            _ => status.ToString()
        };
    }

    #endregion
}
