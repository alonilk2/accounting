using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Sales;

namespace backend.Models.Sales;

/// <summary>
/// Recurring billing orders for subscriptions and regular services
/// </summary>
public class StandingOrder : TenantEntity
{
    [Required]
    public int CustomerId { get; set; }

    /// <summary>
    /// Standing order reference
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string OrderReference { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Frequency: Monthly, Quarterly, Yearly, Weekly
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Frequency { get; set; } = "Monthly";

    /// <summary>
    /// Next invoice generation date
    /// </summary>
    [Required]
    public DateTime NextDate { get; set; }

    /// <summary>
    /// Last invoice generation date
    /// </summary>
    public DateTime? LastGeneratedDate { get; set; }

    /// <summary>
    /// End date for recurring billing (optional)
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Fixed amount for each invoice
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Tax rate percentage
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal TaxRate { get; set; } = 17;

    /// <summary>
    /// Standing order is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Number of invoices generated so far
    /// </summary>
    public int GeneratedCount { get; set; } = 0;

    /// <summary>
    /// Maximum number of invoices (optional limit)
    /// </summary>
    public int? MaxGenerations { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual ICollection<SalesOrder> GeneratedInvoices { get; set; } = new List<SalesOrder>();
}
