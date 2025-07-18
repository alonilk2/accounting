using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Suppliers;
using backend.Models.Inventory;

namespace backend.Models.Purchasing;

/// <summary>
/// Purchase invoice status
/// </summary>
public enum PurchaseInvoiceStatus
{
    Draft = 1,
    Received = 2,
    Approved = 3,
    Paid = 4,
    Cancelled = 5
}

/// <summary>
/// Purchase Invoice - bills received from suppliers
/// Separate from PurchaseOrder to handle invoicing workflow
/// </summary>
public class PurchaseInvoice : TenantEntity
{
    [Required]
    public int SupplierId { get; set; }

    /// <summary>
    /// Optional reference to original purchase order
    /// </summary>
    public int? PurchaseOrderId { get; set; }

    /// <summary>
    /// Supplier's invoice number
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string SupplierInvoiceNumber { get; set; } = string.Empty;

    /// <summary>
    /// Our internal reference number
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string InternalReferenceNumber { get; set; } = string.Empty;

    [Required]
    public DateTime InvoiceDate { get; set; }

    /// <summary>
    /// Due date for payment
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// Date we received the invoice
    /// </summary>
    public DateTime? ReceivedDate { get; set; }

    [Required]
    public PurchaseInvoiceStatus Status { get; set; } = PurchaseInvoiceStatus.Draft;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal SubtotalAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidAmount { get; set; } = 0;

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// VAT rate applied (usually 17% in Israel)
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal VatRate { get; set; } = 17.00m;

    // Navigation properties
    public virtual Supplier Supplier { get; set; } = null!;
    public virtual PurchaseOrder? PurchaseOrder { get; set; }
    public virtual ICollection<PurchaseInvoiceLine> Lines { get; set; } = new List<PurchaseInvoiceLine>();
    public virtual ICollection<SupplierPayment> Payments { get; set; } = new List<SupplierPayment>();

    // Calculated properties
    [NotMapped]
    public decimal RemainingAmount => TotalAmount - PaidAmount;

    [NotMapped]
    public bool IsFullyPaid => RemainingAmount <= 0;

    [NotMapped]
    public bool IsOverdue => !IsFullyPaid && DueDate.HasValue && DueDate.Value < DateTime.Today;
}

/// <summary>
/// Purchase invoice line items
/// </summary>
public class PurchaseInvoiceLine : TenantEntity
{
    [Required]
    public int PurchaseInvoiceId { get; set; }

    public int? ItemId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    [Required]
    [MaxLength(50)]
    public string Unit { get; set; } = "יח'";

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountPercent { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal TaxRate { get; set; } = 17.00m;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }

    // Navigation properties
    public virtual PurchaseInvoice PurchaseInvoice { get; set; } = null!;
    public virtual Item? Item { get; set; }

    // Calculated properties
    [NotMapped]
    public decimal SubtotalAmount => Quantity * UnitCost - DiscountAmount;

    [NotMapped]
    public decimal TaxAmount => SubtotalAmount * (TaxRate / 100);
}

/// <summary>
/// Payments made to suppliers for purchase invoices
/// </summary>
public class SupplierPayment : TenantEntity
{
    [Required]
    public int PurchaseInvoiceId { get; set; }

    [Required]
    public int SupplierId { get; set; }

    [Required]
    [MaxLength(50)]
    public string PaymentNumber { get; set; } = string.Empty;

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty; // Bank Transfer, Check, Cash, etc.

    [MaxLength(100)]
    public string? ReferenceNumber { get; set; } // Check number, transaction ID, etc.

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual PurchaseInvoice PurchaseInvoice { get; set; } = null!;
    public virtual Supplier Supplier { get; set; } = null!;
}
