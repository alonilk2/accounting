using System.ComponentModel.DataAnnotations;
using backend.Models.Sales;

namespace backend.DTOs.Sales;

/// <summary>
/// DTO ליצירת חשבונית מס-קבלה חדשה
/// </summary>
public class CreateTaxInvoiceReceiptDto
{
    [Required]
    public int CustomerId { get; set; }

    /// <summary>
    /// תאריך ההפקה והתשלום
    /// </summary>
    [Required]
    public DateTime DocumentDate { get; set; }

    /// <summary>
    /// אופן התשלום
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    /// <summary>
    /// מספר אסמכתא
    /// </summary>
    [MaxLength(100)]
    public string? ReferenceNumber { get; set; }

    /// <summary>
    /// מטבע
    /// </summary>
    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    /// <summary>
    /// שער החליפין
    /// </summary>
    public decimal? ExchangeRate { get; set; }

    /// <summary>
    /// הערות
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// פריטי החשבונית
    /// </summary>
    [Required]
    public List<CreateTaxInvoiceReceiptLineDto> Lines { get; set; } = new();
}

/// <summary>
/// DTO לשורת פריט בחשבונית מס-קבלה
/// </summary>
public class CreateTaxInvoiceReceiptLineDto
{
    [Required]
    public int ItemId { get; set; }

    [Required]
    [Range(0.001, double.MaxValue, ErrorMessage = "הכמות חייבת להיות גדולה מ-0")]
    public decimal Quantity { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "המחיר חייב להיות גדול או שווה ל-0")]
    public decimal UnitPrice { get; set; }

    [Range(0, 100, ErrorMessage = "אחוז ההנחה חייב להיות בין 0 ל-100")]
    public decimal DiscountPercent { get; set; } = 0;

    [Range(0, double.MaxValue, ErrorMessage = "סכום ההנחה חייב להיות גדול או שווה ל-0")]
    public decimal DiscountAmount { get; set; } = 0;

    [Required]
    [Range(0, 100, ErrorMessage = "אחוז המע\"מ חייב להיות בין 0 ל-100")]
    public decimal VatRate { get; set; } = 17;
}

/// <summary>
/// DTO לעדכון חשבונית מס-קבלה
/// </summary>
public class UpdateTaxInvoiceReceiptDto
{
    /// <summary>
    /// אופן התשלום
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    /// <summary>
    /// מספר אסמכתא
    /// </summary>
    [MaxLength(100)]
    public string? ReferenceNumber { get; set; }

    /// <summary>
    /// הערות
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }
}

/// <summary>
/// DTO להצגת חשבונית מס-קבלה
/// </summary>
public class TaxInvoiceReceiptDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime DocumentDate { get; set; }
    public TaxInvoiceReceiptStatus Status { get; set; }
    public string StatusDisplayName { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal VatAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal? ExchangeRate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<TaxInvoiceReceiptLineDto> Lines { get; set; } = new();
}

/// <summary>
/// DTO לשורת פריט בתצוגת חשבונית מס-קבלה
/// </summary>
public class TaxInvoiceReceiptLineDto
{
    public int Id { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public string ItemUnit { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal VatRate { get; set; }
    public decimal LineSubTotal { get; set; }
    public decimal LineVatAmount { get; set; }
    public decimal LineTotalAmount { get; set; }
}

/// <summary>
/// DTO לרשימת חשבוניות מס-קבלה
/// </summary>
public class TaxInvoiceReceiptListDto
{
    public int Id { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime DocumentDate { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public TaxInvoiceReceiptStatus Status { get; set; }
    public string StatusDisplayName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;
}

/// <summary>
/// DTO לסינון חשבוניות מס-קבלה
/// </summary>
public class TaxInvoiceReceiptFilterDto
{
    public string? DocumentNumber { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? CustomerId { get; set; }
    public TaxInvoiceReceiptStatus? Status { get; set; }
    public string? PaymentMethod { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "DocumentDate";
    public bool SortDescending { get; set; } = true;
}
