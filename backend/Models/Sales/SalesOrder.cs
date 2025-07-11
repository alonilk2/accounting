using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Sales;
using backend.Models.Inventory;

namespace backend.Models.Sales;

/// <summary>
/// Document status for sales orders (NOT invoices)
/// </summary>
public enum SalesOrderStatus
{
    Quote = 1,
    Confirmed = 2,
    Shipped = 3,
    Completed = 4,
    Cancelled = 5
}

/// <summary>
/// Sales orders - represents customer orders and quotations
/// Separate from invoices which are billing documents
/// </summary>
public class SalesOrder : TenantEntity
{
    [Required]
    public int CustomerId { get; set; }

    public int? AgentId { get; set; }

    /// <summary>
    /// Order/Invoice number
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty;

    [Required]
    public DateTime OrderDate { get; set; }

    /// <summary>
    /// Due date for payment
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// Delivery date
    /// </summary>
    public DateTime? DeliveryDate { get; set; }

    [Required]
    public SalesOrderStatus Status { get; set; } = SalesOrderStatus.Quote;

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
    /// Alias for OrderDate property (backward compatibility)
    /// </summary>
    [NotMapped]
    public DateTime Date => OrderDate;

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual Agent? Agent { get; set; }
    public virtual ICollection<SalesOrderLine> Lines { get; set; } = new List<SalesOrderLine>();
    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
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
}


