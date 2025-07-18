using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Inventory;

namespace backend.Models.Sales;

/// <summary>
/// Tax Invoice Receipt status
/// חשבונית מס-קבלה - מסמך שמשלב יחד חשבונית מס וקבלה
/// מתאים לעסקים שמקבלים תשלום מיידי
/// </summary>
public enum TaxInvoiceReceiptStatus
{
    Paid = 1,        // שולם - המסמך נוצר רק לאחר קבלת התשלום
    Cancelled = 2    // בוטל
}

/// <summary>
/// Tax Invoice Receipt - משלב חשבונית מס וקבלה יחד
/// מסמך שנוצר לאחר קבלת התשלום, מתאים לעסקים שמקבלים תשלום מיידי
/// כמו חנויות קמעונאיות, מסעדות, וכו'
/// </summary>
public class TaxInvoiceReceipt : TenantEntity
{
    [Required]
    public int CustomerId { get; set; }

    /// <summary>
    /// מספר חשבונית מס-קבלה (מספור רציף שנתי)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string DocumentNumber { get; set; } = string.Empty;

    /// <summary>
    /// תאריך ההפקה והתשלום
    /// </summary>
    [Required]
    public DateTime DocumentDate { get; set; }

    /// <summary>
    /// סטטוס המסמך
    /// </summary>
    [Required]
    public TaxInvoiceReceiptStatus Status { get; set; } = TaxInvoiceReceiptStatus.Paid;

    /// <summary>
    /// סכום כולל לפני מע"מ
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal SubTotal { get; set; }

    /// <summary>
    /// סכום מע"מ
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal VatAmount { get; set; }

    /// <summary>
    /// סכום כולל כולל מע"מ
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// אופן התשלום (מזומן, כרטיס אשראי, העברה בנקאית, וכו')
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    /// <summary>
    /// מספר אסמכתא (מספר עסקה, מספר צ'ק, וכו')
    /// </summary>
    [MaxLength(100)]
    public string? ReferenceNumber { get; set; }

    /// <summary>
    /// מטבע
    /// </summary>
    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    /// <summary>
    /// שער החליפין (אם לא ILS)
    /// </summary>
    [Column(TypeName = "decimal(18,6)")]
    public decimal? ExchangeRate { get; set; }

    /// <summary>
    /// הערות
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }

    // Navigation properties
    [ForeignKey("CustomerId")]
    public virtual Customer Customer { get; set; } = null!;

    /// <summary>
    /// פריטי החשבונית מס-קבלה
    /// </summary>
    public virtual ICollection<TaxInvoiceReceiptLine> Lines { get; set; } = new List<TaxInvoiceReceiptLine>();
}

/// <summary>
/// שורת פריט בחשבונית מס-קבלה
/// </summary>
public class TaxInvoiceReceiptLine : TenantEntity
{
    [Required]
    public int TaxInvoiceReceiptId { get; set; }

    [Required]
    public int ItemId { get; set; }

    /// <summary>
    /// כמות
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,3)")]
    public decimal Quantity { get; set; }

    /// <summary>
    /// מחיר יחידה לפני מע"מ
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// אחוז הנחה
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal DiscountPercent { get; set; } = 0;

    /// <summary>
    /// סכום הנחה
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; } = 0;

    /// <summary>
    /// אחוז מע"מ
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal VatRate { get; set; } = 17; // Israeli standard VAT rate

    /// <summary>
    /// סכום שורה לפני מע"מ (לאחר הנחה)
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal LineSubTotal { get; set; }

    /// <summary>
    /// סכום מע"מ לשורה
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal LineVatAmount { get; set; }

    /// <summary>
    /// סכום שורה כולל מע"מ
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotalAmount { get; set; }

    // Navigation properties
    [ForeignKey("TaxInvoiceReceiptId")]
    public virtual TaxInvoiceReceipt TaxInvoiceReceipt { get; set; } = null!;

    [ForeignKey("ItemId")]
    public virtual Item Item { get; set; } = null!;
}
