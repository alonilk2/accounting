using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;

namespace backend.Models.Sales;

/// <summary>
/// Customer payment receipts for invoices or standalone receipts
/// Represents actual payments received against invoices or independent payments
/// </summary>
public class Receipt : TenantEntity
{
    /// <summary>
    /// Invoice ID - null for standalone receipts
    /// </summary>
    public int? InvoiceId { get; set; }

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

    // Fields for standalone receipts (when InvoiceId is null)
    /// <summary>
    /// Customer name for standalone receipts
    /// </summary>
    [MaxLength(200)]
    public string? CustomerName { get; set; }

    /// <summary>
    /// Customer tax ID for standalone receipts
    /// </summary>
    [MaxLength(20)]
    public string? CustomerTaxId { get; set; }

    /// <summary>
    /// Description of the payment for standalone receipts
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    // Navigation properties
    public virtual Invoice Invoice { get; set; } = null!;
}
