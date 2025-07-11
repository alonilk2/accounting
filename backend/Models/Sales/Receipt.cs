using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;

namespace backend.Models.Sales;

/// <summary>
/// Customer payment receipts for invoices
/// Represents actual payments received against invoices
/// </summary>
public class Receipt : TenantEntity
{
    [Required]
    public int InvoiceId { get; set; }

    /// <summary>
    /// Receipt number (sequential format: REC-YYYY-NNNN)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string ReceiptNumber { get; set; } = string.Empty;

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Payment method (Cash, CreditCard, BankTransfer, Check, etc.)
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

    /// <summary>
    /// Currency code
    /// </summary>
    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    // Navigation properties
    public virtual Invoice Invoice { get; set; } = null!;
}
