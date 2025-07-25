namespace backend.DTOs.AI;

/// <summary>
/// Request for scanning and processing a document (invoice, receipt, etc.)
/// </summary>
public class DocumentScanRequest
{
    /// <summary>
    /// Base64 encoded image data or file content
    /// </summary>
    public string FileData { get; set; } = string.Empty;
    
    /// <summary>
    /// File name with extension
    /// </summary>
    public string FileName { get; set; } = string.Empty;
    
    /// <summary>
    /// MIME type of the file (image/jpeg, image/png, application/pdf)
    /// </summary>
    public string ContentType { get; set; } = string.Empty;
    
    /// <summary>
    /// Type of document to scan (invoice, receipt, bill)
    /// </summary>
    public DocumentType DocumentType { get; set; } = DocumentType.Invoice;
    
    /// <summary>
    /// Optional: Supplier ID if known
    /// </summary>
    public int? SupplierId { get; set; }
}

/// <summary>
/// Response from document scanning with extracted data
/// </summary>
public class DocumentScanResponse
{
    /// <summary>
    /// Whether the scan was successful
    /// </summary>
    public bool IsSuccess { get; set; } = true;
    
    /// <summary>
    /// Error message if scan failed
    /// </summary>
    public string? ErrorMessage { get; set; }
    
    /// <summary>
    /// Confidence score of the extraction (0.0 to 1.0)
    /// </summary>
    public decimal ConfidenceScore { get; set; }
    
    /// <summary>
    /// Processing time in milliseconds
    /// </summary>
    public int ProcessingTimeMs { get; set; }
    
    /// <summary>
    /// Extracted expense data ready for review
    /// </summary>
    public ScannedExpenseData? ExtractedData { get; set; }
    
    /// <summary>
    /// Original document URL for reference
    /// </summary>
    public string? DocumentUrl { get; set; }
    
    /// <summary>
    /// Fields that need manual review/correction
    /// </summary>
    public List<string>? ReviewRequired { get; set; }
}

/// <summary>
/// Extracted expense data from scanned document
/// </summary>
public class ScannedExpenseData
{
    /// <summary>
    /// Supplier/vendor information
    /// </summary>
    public SupplierInfo? Supplier { get; set; }
    
    /// <summary>
    /// Document date
    /// </summary>
    public DateTime? DocumentDate { get; set; }
    
    /// <summary>
    /// Invoice/receipt number
    /// </summary>
    public string? DocumentNumber { get; set; }
    
    /// <summary>
    /// Total amount including tax
    /// </summary>
    public decimal? TotalAmount { get; set; }
    
    /// <summary>
    /// Net amount before tax
    /// </summary>
    public decimal? NetAmount { get; set; }
    
    /// <summary>
    /// VAT/tax amount
    /// </summary>
    public decimal? VatAmount { get; set; }
    
    /// <summary>
    /// VAT rate percentage
    /// </summary>
    public decimal? VatRate { get; set; }
    
    /// <summary>
    /// Currency code (ILS, USD, EUR)
    /// </summary>
    public string? Currency { get; set; }
    
    /// <summary>
    /// Detected expense category
    /// </summary>
    public int? SuggestedCategory { get; set; }
    
    /// <summary>
    /// Description/notes from the document
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Hebrew description if detected
    /// </summary>
    public string? DescriptionHebrew { get; set; }
    
    /// <summary>
    /// Payment method if mentioned
    /// </summary>
    public string? PaymentMethod { get; set; }
    
    /// <summary>
    /// Expense status - Draft, Submitted, Approved, etc.
    /// </summary>
    public int? Status { get; set; }
    
    /// <summary>
    /// Line items from the document
    /// </summary>
    public List<ScannedLineItem>? LineItems { get; set; }
}

/// <summary>
/// Supplier information extracted from document
/// </summary>
public class SupplierInfo
{
    /// <summary>
    /// Supplier ID if matched with existing supplier
    /// </summary>
    public int? SupplierId { get; set; }
    
    /// <summary>
    /// Supplier name
    /// </summary>
    public string? Name { get; set; }
    
    /// <summary>
    /// Supplier tax ID
    /// </summary>
    public string? TaxId { get; set; }
    
    /// <summary>
    /// Supplier address
    /// </summary>
    public string? Address { get; set; }
    
    /// <summary>
    /// Supplier phone
    /// </summary>
    public string? Phone { get; set; }
    
    /// <summary>
    /// Whether this is a new supplier that needs to be created
    /// </summary>
    public bool IsNewSupplier { get; set; }
}

/// <summary>
/// Individual line item from scanned document
/// </summary>
public class ScannedLineItem
{
    /// <summary>
    /// Item description
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Quantity
    /// </summary>
    public decimal? Quantity { get; set; }
    
    /// <summary>
    /// Unit price
    /// </summary>
    public decimal? UnitPrice { get; set; }
    
    /// <summary>
    /// Line total
    /// </summary>
    public decimal? Total { get; set; }
    
    /// <summary>
    /// VAT rate for this line
    /// </summary>
    public decimal? VatRate { get; set; }
}

/// <summary>
/// Types of documents that can be scanned
/// </summary>
public enum DocumentType
{
    Invoice = 1,
    Receipt = 2,
    Bill = 3,
    CreditNote = 4
}

/// <summary>
/// Request to create expense from scanned data after user review
/// </summary>
public class CreateExpenseFromScanRequest
{
    /// <summary>
    /// Reviewed and validated expense data
    /// </summary>
    public ScannedExpenseData ExpenseData { get; set; } = new();
    
    /// <summary>
    /// Original document URL for attachment
    /// </summary>
    public string? DocumentUrl { get; set; }
    
    /// <summary>
    /// Additional notes from user review
    /// </summary>
    public string? ReviewNotes { get; set; }
    
    /// <summary>
    /// Whether to create supplier if new
    /// </summary>
    public bool CreateNewSupplier { get; set; } = true;
}
