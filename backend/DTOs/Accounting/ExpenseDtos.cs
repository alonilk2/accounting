using System.ComponentModel.DataAnnotations;
using backend.Models.Accounting;

namespace backend.DTOs.Accounting;

/// <summary>
/// DTO להצגת הוצאה
/// </summary>
public class ExpenseDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string ExpenseNumber { get; set; } = string.Empty;
    public DateTime ExpenseDate { get; set; }
    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public ExpenseCategory Category { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DescriptionHebrew { get; set; }
    public decimal Amount { get; set; }
    public decimal VatRate { get; set; }
    public decimal VatAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "ILS";
    public string? PaymentMethod { get; set; }
    public string? ReceiptNumber { get; set; }
    public int? PurchaseOrderId { get; set; }
    public int? AccountId { get; set; }
    public string? AccountName { get; set; }
    public ExpenseStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public DateTime? ApprovedDate { get; set; }
    public string? ApprovedBy { get; set; }
    public DateTime? PaidDate { get; set; }
    public string? PaymentReference { get; set; }
    public string? Notes { get; set; }
    public string? AttachmentPath { get; set; }
    public string? Tags { get; set; }
    public bool IsTaxDeductible { get; set; }
    public bool IsRecurring { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO ליצירת הוצאה חדשה
/// </summary>
public class CreateExpenseDto
{
    [Required]
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;

    public int? SupplierId { get; set; }

    [MaxLength(200)]
    public string? SupplierName { get; set; }

    [Required]
    public ExpenseCategory Category { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? DescriptionHebrew { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "הסכום חייב להיות גדול מ-0")]
    public decimal Amount { get; set; }

    [Range(0, 100)]
    public decimal VatRate { get; set; } = 18.00m;

    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    [MaxLength(100)]
    public string? ReceiptNumber { get; set; }

    public int? PurchaseOrderId { get; set; }

    public int? AccountId { get; set; }

    public ExpenseStatus Status { get; set; } = ExpenseStatus.Draft;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(200)]
    public string? Tags { get; set; }

    public bool IsTaxDeductible { get; set; } = true;

    public bool IsRecurring { get; set; } = false;
}

/// <summary>
/// DTO לעדכון הוצאה
/// </summary>
public class UpdateExpenseDto
{
    public DateTime ExpenseDate { get; set; }

    public int? SupplierId { get; set; }

    [MaxLength(200)]
    public string? SupplierName { get; set; }

    public ExpenseCategory Category { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? DescriptionHebrew { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "הסכום חייב להיות גדול מ-0")]
    public decimal Amount { get; set; }

    [Range(0, 100)]
    public decimal VatRate { get; set; } = 18.00m;

    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    [MaxLength(100)]
    public string? ReceiptNumber { get; set; }

    public int? PurchaseOrderId { get; set; }

    public int? AccountId { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(200)]
    public string? Tags { get; set; }

    public bool IsTaxDeductible { get; set; } = true;

    public bool IsRecurring { get; set; } = false;
}

/// <summary>
/// DTO לעדכון סטטוס הוצאה
/// </summary>
public class UpdateExpenseStatusDto
{
    [Required]
    public ExpenseStatus Status { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    [MaxLength(100)]
    public string? PaymentReference { get; set; }

    public DateTime? PaidDate { get; set; }
}

/// <summary>
/// DTO לדוח הוצאות לפי קטגוריה
/// </summary>
public class ExpenseCategoryReportDto
{
    public ExpenseCategory Category { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryNameHebrew { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal VatAmount { get; set; }
    public int ExpenseCount { get; set; }
    public decimal AverageAmount { get; set; }
}

/// <summary>
/// DTO לדוח הוצאות חודשי
/// </summary>
public class MonthlyExpenseReportDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal VatAmount { get; set; }
    public int ExpenseCount { get; set; }
    public List<ExpenseCategoryReportDto> Categories { get; set; } = new();
}

/// <summary>
/// DTO לסיכום הוצאות
/// </summary>
public class ExpenseSummaryDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TotalVat { get; set; }
    public decimal NetAmount => TotalAmount - TotalVat;
    public int TotalExpenses { get; set; }
    public decimal AverageExpense => TotalExpenses > 0 ? TotalAmount / TotalExpenses : 0;
    public List<ExpenseCategoryReportDto> TopCategories { get; set; } = new();
    public List<MonthlyExpenseReportDto> MonthlyBreakdown { get; set; } = new();
}

/// <summary>
/// DTO לאישור מרובה של הוצאות
/// </summary>
public class BulkApproveExpensesDto
{
    [Required]
    public List<int> ExpenseIds { get; set; } = new();

    [MaxLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// DTO לתשלום מרובה של הוצאות
/// </summary>
public class BulkPayExpensesDto
{
    [Required]
    public List<int> ExpenseIds { get; set; } = new();

    [Required]
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? PaymentReference { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}
