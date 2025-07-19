using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models.Core;

/// <summary>
/// Base entity for business contacts (customers, suppliers) with common fields
/// Implements the DRY principle by centralizing shared contact information
/// </summary>
public abstract class BusinessEntity : TenantEntity
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

    [MaxLength(100)]
    public string? Contact { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }

    /// <summary>
    /// Israeli tax ID number (תעודת זהות / ח.פ.)
    /// </summary>
    [MaxLength(15)]
    public string? TaxId { get; set; }

    /// <summary>
    /// VAT registration number if applicable
    /// </summary>
    [MaxLength(15)]
    public string? VatNumber { get; set; }

    /// <summary>
    /// Payment terms in days (e.g., Net 30)
    /// </summary>
    public int PaymentTermsDays { get; set; } = 30;

    /// <summary>
    /// Entity is active for new transactions
    /// </summary>
    public bool IsActive { get; set; } = true;

    [MaxLength(1000)]
    public string? Notes { get; set; }
}