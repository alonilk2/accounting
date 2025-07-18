using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Suppliers;
using backend.Models.Inventory;

namespace backend.Models.Purchasing;

/// <summary>
/// Document status for purchase orders and bills
/// </summary>
public enum PurchaseOrderStatus
{
    Draft = 1,
    Confirmed = 2,
    Received = 3,
    Invoiced = 4,
    Paid = 5,
    Cancelled = 6
}

/// <summary>
/// Purchase orders and supplier bills
/// Represents vendor orders and incoming invoices
/// </summary>
public class PurchaseOrder : TenantEntity
{
    [Required]
    public int SupplierId { get; set; }

    /// <summary>
    /// Purchase order/bill number
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty;

    /// <summary>
    /// Supplier's invoice number
    /// </summary>
    [MaxLength(50)]
    public string? SupplierInvoiceNumber { get; set; }

    [Required]
    public DateTime OrderDate { get; set; }

    /// <summary>
    /// Due date for payment
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// Expected delivery date
    /// </summary>
    public DateTime? DeliveryDate { get; set; }

    [Required]
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;

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
    /// Delivery address
    /// </summary>
    [MaxLength(500)]
    public string? DeliveryAddress { get; set; }

    /// <summary>
    /// Alias for OrderDate property (backward compatibility)
    /// </summary>
    [NotMapped]
    public DateTime Date => OrderDate;

    // Navigation properties
    public virtual Supplier Supplier { get; set; } = null!;
    public virtual ICollection<PurchaseOrderLine> Lines { get; set; } = new List<PurchaseOrderLine>();
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public virtual ICollection<PurchaseInvoice> PurchaseInvoices { get; set; } = new List<PurchaseInvoice>();
}

/// <summary>
/// Line items for purchase orders
/// </summary>
public class PurchaseOrderLine : TenantEntity
{
    [Required]
    public int PurchaseOrderId { get; set; }

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
    public decimal UnitCost { get; set; }

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

    /// <summary>
    /// Quantity received so far
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal ReceivedQuantity { get; set; } = 0;

    /// <summary>
    /// Alias for ReceivedQuantity property (backward compatibility)
    /// </summary>
    [NotMapped]
    public decimal ReceivedQty 
    { 
        get => ReceivedQuantity; 
        set => ReceivedQuantity = value; 
    }

    // Navigation properties
    public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
    public virtual Item Item { get; set; } = null!;
}

/// <summary>
/// Supplier payments
/// </summary>
public class Payment : TenantEntity
{
    [Required]
    public int PurchaseOrderId { get; set; }

    /// <summary>
    /// Payment number
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string PaymentNumber { get; set; } = string.Empty;

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Payment method (Check, Bank Transfer, Credit Card, etc.)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    /// <summary>
    /// Reference number (check number, transaction ID, etc.)
    /// </summary>
    [MaxLength(100)]
    public string? ReferenceNumber { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
}
