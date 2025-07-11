using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;

namespace backend.Models.Sales;

/// <summary>
/// Customer master data for sales operations
/// </summary>
public class Customer : TenantEntity
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
    /// Credit limit for this customer
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal CreditLimit { get; set; } = 0;

    /// <summary>
    /// Payment terms in days (e.g., Net 30)
    /// </summary>
    public int PaymentTermsDays { get; set; } = 30;

    /// <summary>
    /// Customer discount percentage
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal DiscountPercent { get; set; } = 0;

    /// <summary>
    /// Customer is active for new transactions
    /// </summary>
    public bool IsActive { get; set; } = true;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public virtual ICollection<StandingOrder> StandingOrders { get; set; } = new List<StandingOrder>();
}

/// <summary>
/// Sales agents/representatives for commission tracking
/// </summary>
public class Agent : TenantEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(150)]
    [EmailAddress]
    public string? Email { get; set; }

    /// <summary>
    /// Commission rate as percentage
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal CommissionRate { get; set; } = 0;

    /// <summary>
    /// Agent is active for new sales
    /// </summary>
    public bool IsActive { get; set; } = true;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
}
