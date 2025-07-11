using System.ComponentModel.DataAnnotations;
using backend.Models.Core;
using backend.Models.Identity;
using backend.Models.Accounting;
using backend.Models.Sales;
using backend.Models.Suppliers;
using backend.Models.Inventory;
using backend.Models.Purchasing;
using backend.Models.POS;
using backend.Models.Audit;

namespace backend.Models.Core;

/// <summary>
/// Multi-tenant company/organization entity
/// Each client business is represented as a Company
/// </summary>
public class Company : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Israeli Tax Authority ID (מספר עוסק מורשה)
    /// </summary>
    [Required]
    [MaxLength(15)]
    public string IsraelTaxId { get; set; } = string.Empty;

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

    [MaxLength(150)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }

    /// <summary>
    /// Business currency (ILS by default for Israeli businesses)
    /// </summary>
    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    /// <summary>
    /// Current fiscal year start month (1-12)
    /// </summary>
    public int FiscalYearStartMonth { get; set; } = 1;

    /// <summary>
    /// Company timezone for date calculations
    /// </summary>
    [MaxLength(50)]
    public string TimeZone { get; set; } = "Israel Standard Time";

    /// <summary>
    /// Subscription status and billing info
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTime? SubscriptionExpiresAt { get; set; }

    [MaxLength(50)]
    public string? SubscriptionPlan { get; set; }

    /// <summary>
    /// Company settings as JSON
    /// </summary>
    public string? Settings { get; set; }

    // Navigation properties
    public virtual ICollection<UserCompany> UserCompanies { get; set; } = new List<UserCompany>();
    public virtual ICollection<ChartOfAccount> ChartOfAccounts { get; set; } = new List<ChartOfAccount>();
    public virtual ICollection<Customer> Customers { get; set; } = new List<Customer>();
    public virtual ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
    public virtual ICollection<Agent> Agents { get; set; } = new List<Agent>();
    public virtual ICollection<Item> Items { get; set; } = new List<Item>();
    public virtual ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
    public virtual ICollection<StandingOrder> StandingOrders { get; set; } = new List<StandingOrder>();
    public virtual ICollection<POSSale> POSSales { get; set; } = new List<POSSale>();
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
