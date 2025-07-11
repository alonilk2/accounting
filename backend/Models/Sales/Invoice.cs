using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Inventory;
using backend.Models.Purchasing;

namespace backend.Models.Sales;

/// <summary>
/// Invoice status
/// </summary>
public enum InvoiceStatus
{
    Draft = 1,
    Sent = 2,
    Paid = 3,
    Overdue = 4,
    Cancelled = 5
}

/// <summary>
/// Invoice - separate document from SalesOrder
/// Represents billing document issued to customer
/// </summary>
public class Invoice : TenantEntity
{
    [Required]
    public int CustomerId { get; set; }

    /// <summary>
    /// Optional reference to original sales order
    /// </summary>
    public int? SalesOrderId { get; set; }

    /// <summary>
    /// Invoice number (sequential per year)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string InvoiceNumber { get; set; } = string.Empty;

    [Required]
    public DateTime InvoiceDate { get; set; }

    /// <summary>
    /// Due date for payment
    /// </summary>
    public DateTime? DueDate { get; set; }

    [Required]
    public InvoiceStatus Status { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal SubtotalAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidAmount { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual SalesOrder? SalesOrder { get; set; }
    public virtual ICollection<InvoiceLine> Lines { get; set; } = new List<InvoiceLine>();
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public virtual ICollection<Receipt> Receipts { get; set; } = new List<Receipt>();

    /// <summary>
    /// Customer details snapshot at time of invoice
    /// </summary>
    [MaxLength(200)]
    public string CustomerName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string CustomerAddress { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? CustomerTaxId { get; set; }

    [MaxLength(100)]
    public string? CustomerContact { get; set; }
}

/// <summary>
/// Invoice line items
/// </summary>
public class InvoiceLine : BaseEntity
{
    [Required]
    public int InvoiceId { get; set; }

    public int? ItemId { get; set; }

    [Required]
    public int LineNumber { get; set; }

    [Required]
    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ItemSku { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,3)")]
    public decimal Quantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal DiscountPercent { get; set; }

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal TaxRate { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }

    // Navigation properties
    public virtual Invoice Invoice { get; set; } = null!;
    public virtual Item? Item { get; set; }
}
