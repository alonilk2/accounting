using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Purchasing;

namespace backend.Models.Suppliers;

/// <summary>
/// Supplier/vendor master data for procurement operations
/// Extends BusinessEntity with supplier-specific fields
/// </summary>
public class Supplier : BusinessEntity
{
    /// <summary>
    /// Bank account details for payments
    /// </summary>
    [MaxLength(50)]
    public string? BankName { get; set; }

    [MaxLength(20)]
    public string? BankAccount { get; set; }

    [MaxLength(10)]
    public string? BankBranch { get; set; }

    // Navigation properties
    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
    public virtual ICollection<PurchaseInvoice> PurchaseInvoices { get; set; } = new List<PurchaseInvoice>();
    public virtual ICollection<SupplierPayment> SupplierPayments { get; set; } = new List<SupplierPayment>();
}
