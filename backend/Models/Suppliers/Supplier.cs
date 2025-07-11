using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Purchasing;

namespace backend.Models.Suppliers;

/// <summary>
/// Supplier/vendor master data for procurement operations
/// </summary>
public class Supplier : TenantEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? NameHebrew { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(10)]
    public string? PostalCode { get; set; }

    [MaxLength(50)]
    public string? Country { get; set; } = "Israel";

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(20)]
    public string? Mobile { get; set; }

    [MaxLength(150)]
    [EmailAddress]
    public string? Email { get; set; }

    /// <summary>
    /// Israeli tax ID number (תעודת זהות / ח.פ.)
    /// </summary>
    [MaxLength(15)]
    public string? TaxId { get; set; }

    /// <summary>
    /// VAT registration number
    /// </summary>
    [MaxLength(15)]
    public string? VatNumber { get; set; }

    /// <summary>
    /// Payment terms we have with this supplier (days)
    /// </summary>
    public int PaymentTermsDays { get; set; } = 30;

    /// <summary>
    /// Supplier is active for new transactions
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Bank account details for payments
    /// </summary>
    [MaxLength(50)]
    public string? BankName { get; set; }

    [MaxLength(20)]
    public string? BankAccount { get; set; }

    [MaxLength(10)]
    public string? BankBranch { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
}
