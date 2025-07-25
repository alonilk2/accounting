using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Suppliers;

namespace backend.Models.Accounting;

/// <summary>
/// Expense categories for Israeli business classification
/// </summary>
public enum ExpenseCategory
{
    Salary = 1306,        // שיפור קרקעות ומבנים 
    SalaryAddons = 1307,      // הוצאות הובלה
    EmployeesOptions = 1308,         // הוצאות ציוד ביצועיים
    ThirdPartyJobs = 1310,    // דמי מדים וביגוד
    LocalPurchases = 1320,         // הוצאות קשר
    RawMaterialsPurchases = 1330,            // הוצאות השכרת משרד
    ForeignSupply = 1340,      // הוצאות חברת ביטוח
    CurrencyRatesPurchases = 1350,           // הוצאות שיווק
    WarrantsExpenses = 1360,  // הוצאות שירותים מקצועיים
    RelatedLocalExpenses = 1371,     // הוצאות שכר בנק
    RelatedForeignExpenses = 1372, // הוצאות פיננסיות אחרות
    OtherExpenses = 1390,         // הוצאות שונות
    InventoryStart = 1400,         // הוצאות שונות

    InventoryEnd = 1450           // פחת בציוד המשרד
}

/// <summary>
/// Expense payment status
/// </summary>
public enum ExpenseStatus
{
    Draft = 1,        // טיוטה
    Pending = 2,      // ממתין לאישור
    Approved = 3,     // מאושר
    Paid = 4,         // שולם
    Rejected = 5,     // נדחה
    Cancelled = 6     // בוטל
}

/// <summary>
/// Business expense record for Israeli tax compliance
/// Represents all business expenses including receipts and invoices
/// </summary>
public class Expense : TenantEntity
{
    /// <summary>
    /// Expense reference number
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string ExpenseNumber { get; set; } = string.Empty;

    /// <summary>
    /// Date the expense was incurred
    /// </summary>
    [Required]
    public DateTime ExpenseDate { get; set; }

    /// <summary>
    /// Supplier/vendor (optional for cash expenses)
    /// </summary>
    public int? SupplierId { get; set; }

    /// <summary>
    /// Supplier name for display (denormalized for performance)
    /// </summary>
    [MaxLength(200)]
    public string? SupplierName { get; set; }

    /// <summary>
    /// Supplier tax ID (ח.פ) for Israeli compliance
    /// </summary>
    [MaxLength(20)]
    public string? SupplierTaxId { get; set; }

    /// <summary>
    /// Expense category for reporting
    /// </summary>
    [Required]
    public ExpenseCategory Category { get; set; }

    /// <summary>
    /// Description of the expense
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Hebrew description for local compliance
    /// </summary>
    [MaxLength(500)]
    public string? DescriptionHebrew { get; set; }

    /// <summary>
    /// Gross amount before VAT
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    /// <summary>
    /// VAT rate applied (Israeli standard is 18%)
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal VatRate { get; set; } = 18.00m;

    /// <summary>
    /// VAT amount calculated
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal VatAmount { get; set; }

    /// <summary>
    /// Total amount including VAT
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Currency (default ILS for Israeli businesses)
    /// </summary>
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    /// <summary>
    /// Payment method
    /// </summary>
    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    /// <summary>
    /// Receipt/invoice number from supplier
    /// </summary>
    [MaxLength(100)]
    public string? ReceiptNumber { get; set; }

    /// <summary>
    /// Reference to purchase order if applicable
    /// </summary>
    public int? PurchaseOrderId { get; set; }

    /// <summary>
    /// Chart of account for expense posting
    /// </summary>
    public int? AccountId { get; set; }

    /// <summary>
    /// Expense status for approval workflow
    /// </summary>
    [Required]
    public ExpenseStatus Status { get; set; } = ExpenseStatus.Draft;

    /// <summary>
    /// Date when expense was approved
    /// </summary>
    public DateTime? ApprovedDate { get; set; }

    /// <summary>
    /// User who approved the expense
    /// </summary>
    [MaxLength(100)]
    public string? ApprovedBy { get; set; }

    /// <summary>
    /// Date when expense was paid
    /// </summary>
    public DateTime? PaidDate { get; set; }

    /// <summary>
    /// Payment reference number
    /// </summary>
    [MaxLength(100)]
    public string? PaymentReference { get; set; }

    /// <summary>
    /// Additional notes
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Attachment path for scanned receipts/invoices
    /// </summary>
    [MaxLength(500)]
    public string? AttachmentPath { get; set; }

    /// <summary>
    /// Tags for categorization and search
    /// </summary>
    [MaxLength(200)]
    public string? Tags { get; set; }

    /// <summary>
    /// Whether this expense is tax deductible
    /// </summary>
    public bool IsTaxDeductible { get; set; } = true;

    /// <summary>
    /// Whether this expense is recurring
    /// </summary>
    public bool IsRecurring { get; set; } = false;

    /// <summary>
    /// Created by user
    /// </summary>
    [Required]
    [MaxLength(100)]
    public new string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Last updated by user
    /// </summary>
    [Required]
    [MaxLength(100)]
    public new string UpdatedBy { get; set; } = string.Empty;

    // Navigation properties
    public virtual Supplier? Supplier { get; set; }
    public virtual ChartOfAccount? Account { get; set; }
}
