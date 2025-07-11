using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Identity;
using backend.Models.Inventory;

namespace backend.Models.POS;

/// <summary>
/// Point of Sale transactions for retail operations
/// </summary>
public class POSSale : TenantEntity
{
    /// <summary>
    /// POS terminal identifier
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string POSTerminalId { get; set; } = string.Empty;

    /// <summary>
    /// Cashier user who processed the sale
    /// </summary>
    [Required]
    public int CashierUserId { get; set; }

    /// <summary>
    /// Sale transaction number
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string TransactionNumber { get; set; } = string.Empty;

    [Required]
    public DateTime SaleDateTime { get; set; }

    /// <summary>
    /// Total amount before tax
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal SubtotalAmount { get; set; } = 0;

    /// <summary>
    /// Total tax amount
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; } = 0;

    /// <summary>
    /// Total amount including tax
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; } = 0;

    /// <summary>
    /// Amount tendered by customer
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TenderedAmount { get; set; } = 0;

    /// <summary>
    /// Change given to customer
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal ChangeAmount { get; set; } = 0;

    /// <summary>
    /// Payment method (Cash, Credit Card, Debit Card, etc.)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = "Cash";

    /// <summary>
    /// Credit card or payment reference
    /// </summary>
    [MaxLength(100)]
    public string? PaymentReference { get; set; }

    /// <summary>
    /// Customer ID if known
    /// </summary>
    public int? CustomerId { get; set; }

    /// <summary>
    /// Transaction was voided
    /// </summary>
    public bool IsVoided { get; set; } = false;

    /// <summary>
    /// Void reason
    /// </summary>
    [MaxLength(500)]
    public string? VoidReason { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual User CashierUser { get; set; } = null!;
    public virtual ICollection<POSSaleLine> Lines { get; set; } = new List<POSSaleLine>();
}

/// <summary>
/// Line items for POS sales
/// </summary>
public class POSSaleLine : BaseEntity
{
    [Required]
    public int POSSaleId { get; set; }

    [Required]
    public int ItemId { get; set; }

    /// <summary>
    /// Line sequence number
    /// </summary>
    public int LineNumber { get; set; } = 1;

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
    /// Discount amount
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; } = 0;

    /// <summary>
    /// Tax rate percentage
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal TaxRate { get; set; } = 17;

    /// <summary>
    /// Line total before tax and discount
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
    public virtual POSSale POSSale { get; set; } = null!;
    public virtual Item Item { get; set; } = null!;
}
