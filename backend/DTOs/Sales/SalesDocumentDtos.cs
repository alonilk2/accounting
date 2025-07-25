using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Sales;

/// <summary>
/// DTO for unified sales document
/// </summary>
public class SalesDocumentDto
{
    public int Id { get; set; }
    public string DocumentType { get; set; } = string.Empty; // SalesOrder, Invoice, TaxInvoiceReceipt, Receipt
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime DocumentDate { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Currency { get; set; } = "ILS";
    public string? Notes { get; set; }
    
    // Action permissions
    public bool CanGenerateReceipt { get; set; }
    public bool CanCancel { get; set; }
    public bool CanEdit { get; set; }
    public bool CanEmail { get; set; }
    public bool CanPrint { get; set; }
    public bool CanExportPdf { get; set; }
}

/// <summary>
/// DTO for monthly grouped documents
/// </summary>
public class MonthlyDocumentsDto
{
    public string MonthKey { get; set; } = string.Empty; // YYYY-MM
    public string MonthDisplay { get; set; } = string.Empty; // Hebrew month name
    public List<SalesDocumentDto> Documents { get; set; } = new();
    public int TotalCount { get; set; }
    public decimal TotalAmount { get; set; }
}

/// <summary>
/// DTO for sales documents response
/// </summary>
public class SalesDocumentsResponseDto
{
    public List<MonthlyDocumentsDto> MonthlyGroups { get; set; } = new();
    public int TotalDocuments { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? DocumentType { get; set; }
    public string? SearchTerm { get; set; }
    public int? CustomerId { get; set; }
}

/// <summary>
/// DTO for paginated sales documents response
/// </summary>
public class PaginatedSalesDocumentsResponseDto
{
    public List<SalesDocumentDto> Documents { get; set; } = new();
    public int TotalCount { get; set; }
    public decimal TotalAmount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? DocumentType { get; set; }
    public string? SearchTerm { get; set; }
    public int? CustomerId { get; set; }
}

/// <summary>
/// Request model for generating a receipt
/// </summary>
public class GenerateReceiptRequest
{
    public decimal? Amount { get; set; } // If null, pays the full remaining amount
    public DateTime? PaymentDate { get; set; } // If null, uses current date
    public string? PaymentMethod { get; set; } = "מזומן";
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Request model for sending document by email
/// </summary>
public class SendEmailRequest
{
    [Required]
    [EmailAddress]
    public string EmailAddress { get; set; } = string.Empty;
    
    public string? Subject { get; set; }
    public string? Message { get; set; }
}
