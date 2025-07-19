using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Sales;
using backend.Models.Inventory;

namespace backend.Models.Sales;

/// <summary>
/// Document status for sales orders (NOT quotes or invoices)
/// </summary>
public enum SalesOrderStatus
{
    Draft = 1,
    Confirmed = 2,
    PartiallyShipped = 3,
    Shipped = 4,
    Completed = 5,
    Cancelled = 6
}

/// <summary>
/// Sales orders - confirmed customer orders only
/// Separate from quotes and invoices which are separate documents
/// </summary>
public class SalesOrder : TenantEntity
{
    [Required]
    public int CustomerId { get; set; }

    public int? AgentId { get; set; }

    /// <summary>
    /// Reference to original quote (if converted from quote)
    /// </summary>
    public int? QuoteId { get; set; }

    /// <summary>
    /// Order number (sequential)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty;

    [Required]
    public DateTime OrderDate { get; set; }

    /// <summary>
    /// Required delivery date
    /// </summary>
    public DateTime? RequiredDate { get; set; }

    /// <summary>
    /// Promised delivery date
    /// </summary>
    public DateTime? PromisedDate { get; set; }

    [Required]
    public SalesOrderStatus Status { get; set; } = SalesOrderStatus.Draft;

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
    /// Amount paid so far
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidAmount { get; set; } = 0;

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
    /// Shipping address if different from customer
    /// </summary>
    [MaxLength(500)]
    public string? ShippingAddress { get; set; }

    /// <summary>
    /// Payment terms for this order
    /// </summary>
    [MaxLength(100)]
    public string? PaymentTerms { get; set; }

    /// <summary>
    /// Shipping method
    /// </summary>
    [MaxLength(100)]
    public string? ShippingMethod { get; set; }

    /// <summary>
    /// Shipping cost
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal ShippingCost { get; set; } = 0;

    /// <summary>
    /// Priority level (1=Low, 2=Normal, 3=High, 4=Urgent)
    /// </summary>
    public int Priority { get; set; } = 2;

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual Agent? Agent { get; set; }
    public virtual Quote? Quote { get; set; }
    public virtual ICollection<SalesOrderLine> Lines { get; set; } = new List<SalesOrderLine>();
    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public virtual ICollection<DeliveryNote> DeliveryNotes { get; set; } = new List<DeliveryNote>();
}

/// <summary>
/// Line items for sales orders
/// </summary>
public class SalesOrderLine : TenantEntity
{
    [Required]
    public int SalesOrderId { get; set; }

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
    public virtual SalesOrder SalesOrder { get; set; } = null!;
    public virtual Item Item { get; set; } = null!;
    public virtual ICollection<DeliveryNoteLine> DeliveryNoteLines { get; set; } = new List<DeliveryNoteLine>();
}


