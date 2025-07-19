using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;

namespace backend.Models.Sales;

/// <summary>
/// Customer master data for sales operations
/// Extends BusinessEntity with customer-specific fields
/// </summary>
public class Customer : BusinessEntity
{
    /// <summary>
    /// Credit limit for this customer
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal CreditLimit { get; set; } = 0;

    /// <summary>
    /// Customer discount percentage
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal DiscountPercent { get; set; } = 0;

    // Navigation properties
    public virtual ICollection<Quote> Quotes { get; set; } = new List<Quote>();
    public virtual ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
    public virtual ICollection<DeliveryNote> DeliveryNotes { get; set; } = new List<DeliveryNote>();
    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public virtual ICollection<StandingOrder> StandingOrders { get; set; } = new List<StandingOrder>();
    public virtual ICollection<TaxInvoiceReceipt> TaxInvoiceReceipts { get; set; } = new List<TaxInvoiceReceipt>();
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
    public virtual ICollection<Quote> Quotes { get; set; } = new List<Quote>();
    public virtual ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
}
