using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Sales;
using backend.Models.Inventory;

namespace backend.Models.Sales;

/// <summary>
/// Quote status - separate from order status
/// </summary>
public enum QuoteStatus
{
    Draft = 1,
    Sent = 2,
    Accepted = 3,
    Rejected = 4,
    Expired = 5,
    Converted = 6 // הומר להזמנה
}

/// <summary>
/// Quote - separate document for quotations
/// Independent from sales orders
/// </summary>
public class Quote : TenantEntity
{
    [Required]
    public int CustomerId { get; set; }

    public int? AgentId { get; set; }

    /// <summary>
    /// Quote number (sequential)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string QuoteNumber { get; set; } = string.Empty;

    [Required]
    public DateTime QuoteDate { get; set; }

    /// <summary>
    /// Valid until date
    /// </summary>
    public DateTime? ValidUntil { get; set; }

    [Required]
    public QuoteStatus Status { get; set; } = QuoteStatus.Draft;

    /// <summary>
    /// Subtotal before tax and discounts
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal SubtotalAmount { get; set; } = 0;

    /// <summary>
    /// Total discount amount
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; } = 0;

    /// <summary>
    /// Total tax amount (VAT)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; } = 0;

    /// <summary>
    /// Total amount including tax
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; } = 0;

    /// <summary>
    /// Currency code (usually ILS)
    /// </summary>
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    /// <summary>
    /// Exchange rate if foreign currency
    /// </summary>
    [Column(TypeName = "decimal(10,6)")]
    public decimal ExchangeRate { get; set; } = 1;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Terms and conditions for the quote
    /// </summary>
    [MaxLength(2000)]
    public string? Terms { get; set; }

    /// <summary>
    /// Delivery terms
    /// </summary>
    [MaxLength(500)]
    public string? DeliveryTerms { get; set; }

    /// <summary>
    /// Payment terms
    /// </summary>
    [MaxLength(100)]
    public string? PaymentTerms { get; set; }

    /// <summary>
    /// Reference to converted sales order (if converted)
    /// </summary>
    public int? ConvertedToSalesOrderId { get; set; }

    /// <summary>
    /// Conversion date
    /// </summary>
    public DateTime? ConvertedAt { get; set; }

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual Agent? Agent { get; set; }
    public virtual SalesOrder? ConvertedToSalesOrder { get; set; }
    public virtual ICollection<QuoteLine> Lines { get; set; } = new List<QuoteLine>();
}

/// <summary>
/// Line items for quotes
/// </summary>
public class QuoteLine : TenantEntity
{
    [Required]
    public int QuoteId { get; set; }

    [Required]
    public int ItemId { get; set; }

    /// <summary>
    /// Line sequence number
    /// </summary>
    public int LineNumber { get; set; } = 1;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Discount percentage for this line
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal DiscountPercent { get; set; } = 0;

    /// <summary>
    /// Tax rate percentage (VAT)
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal TaxRate { get; set; } = 17; // Standard Israeli VAT

    /// <summary>
    /// Line total before discount and tax
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; } = 0;

    /// <summary>
    /// Tax amount for this line
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; } = 0;

    /// <summary>
    /// Final line total including tax and discount
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotalWithTax { get; set; } = 0;

    // Navigation properties
    public virtual Quote Quote { get; set; } = null!;
    public virtual Item Item { get; set; } = null!;
}
