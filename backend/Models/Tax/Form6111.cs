using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;

namespace backend.Models.Tax;

/// <summary>
/// Israeli Tax Authority Form 6111 - Uniform Structure (מבנה אחיד)
/// Complete financial data export for tax reporting compliance
/// </summary>
public class Form6111 : TenantEntity
{
    /// <summary>
    /// Tax year for this report
    /// </summary>
    [Required]
    public int TaxYear { get; set; }

    /// <summary>
    /// Report period start date
    /// </summary>
    [Required]
    public DateTime PeriodStartDate { get; set; }

    /// <summary>
    /// Report period end date
    /// </summary>
    [Required]
    public DateTime PeriodEndDate { get; set; }

    /// <summary>
    /// Report generation timestamp
    /// </summary>
    [Required]
    public DateTime GeneratedAt { get; set; }

    /// <summary>
    /// User who generated this report
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string GeneratedBy { get; set; } = string.Empty;

    /// <summary>
    /// Report status
    /// </summary>
    [Required]
    public Form6111Status Status { get; set; } = Form6111Status.Draft;

    /// <summary>
    /// Part A: Profit & Loss Report data as JSON
    /// </summary>
    public string? ProfitLossData { get; set; }

    /// <summary>
    /// Part B: Tax Adjustment Report data as JSON
    /// </summary>
    public string? TaxAdjustmentData { get; set; }

    /// <summary>
    /// Part C: Balance Sheet data as JSON
    /// </summary>
    public string? BalanceSheetData { get; set; }

    /// <summary>
    /// Additional metadata and notes
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Hash of the report data for integrity verification
    /// </summary>
    [MaxLength(64)]
    public string? DataHash { get; set; }
}

/// <summary>
/// Form 6111 status enumeration
/// </summary>
public enum Form6111Status
{
    Draft = 1,
    Generated = 2,
    Submitted = 3,
    Accepted = 4,
    Rejected = 5
}

/// <summary>
/// Part A: Profit & Loss Report (דוח רווח והפסד)
/// Based on Israeli Tax Authority Form 6111 structure
/// </summary>
public class Form6111ProfitLoss
{
    // Revenue (הכנסות) - Fields 1000-1099
    /// <summary>
    /// Field 1000: Total revenue
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalRevenue { get; set; } = 0;

    /// <summary>
    /// Field 1010: Sales revenue
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal SalesRevenue { get; set; } = 0;

    /// <summary>
    /// Field 1020: Service revenue
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal ServiceRevenue { get; set; } = 0;

    /// <summary>
    /// Field 1090: Other revenue (including corona grants)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal OtherRevenue { get; set; } = 0;

    // Cost of Sales (עלות המכירות) - Fields 1300-1499
    /// <summary>
    /// Field 1300: Total cost of sales
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCostOfSales { get; set; } = 0;

    /// <summary>
    /// Field 1310: Opening inventory
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal OpeningInventory { get; set; } = 0;

    /// <summary>
    /// Field 1320: Purchases
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal Purchases { get; set; } = 0;

    /// <summary>
    /// Field 1450: Closing inventory
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal ClosingInventory { get; set; } = 0;

    // Manufacturing Costs (עלויות ייצור) - Fields 2000-2099
    /// <summary>
    /// Field 2000: Total manufacturing costs
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalManufacturingCosts { get; set; } = 0;

    // Research & Development (מחקר ופיתוח) - Fields 2500-2599
    /// <summary>
    /// Field 2500: R&D expenses
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal RAndDExpenses { get; set; } = 0;

    // Sales Expenses (הוצאות מכירה) - Fields 3000-3199
    /// <summary>
    /// Field 3000: Total sales expenses
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalSalesExpenses { get; set; } = 0;

    // Administrative Expenses (הוצאות הנהלה וכלליות) - Fields 3500-3699
    /// <summary>
    /// Field 3500: Total administrative expenses
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAdministrativeExpenses { get; set; } = 0;

    // Finance Expenses (הוצאות מימון) - Fields 5000-5099
    /// <summary>
    /// Field 5000: Total finance expenses
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalFinanceExpenses { get; set; } = 0;

    // Finance Income (הכנסות מימון) - Fields 5100-5199
    /// <summary>
    /// Field 5100: Total finance income
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalFinanceIncome { get; set; } = 0;

    // Other Income (הכנסות אחרות) - Fields 5200-5299
    /// <summary>
    /// Field 5200: Other income
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal OtherIncome { get; set; } = 0;

    // Other Expenses (הוצאות אחרות) - Fields 5300-5399
    /// <summary>
    /// Field 5300: Other expenses
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal OtherExpenses { get; set; } = 0;

    /// <summary>
    /// Field 6666: Total profit/loss before tax
    /// Calculated as: 1000 - 1300 - 2000 - 2500 - 3000 - 3500 - 5000 + 5100 + 5200 - 5300
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalProfitLoss { get; set; } = 0;

    // Tax-related fields
    /// <summary>
    /// Field 5610: Current tax expense
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal CurrentTaxExpense { get; set; } = 0;

    /// <summary>
    /// Field 5620: Deferred tax expense
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal DeferredTaxExpense { get; set; } = 0;
}

/// <summary>
/// Part B: Tax Adjustment Report (דוח התאמה למס)
/// Adjustments from accounting profit to taxable income
/// </summary>
public class Form6111TaxAdjustment
{
    /// <summary>
    /// Field 100: Profit/loss before tax from P&L report
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal ProfitLossBeforeTax { get; set; } = 0;

    /// <summary>
    /// Field 103: IFRS accounting adjustments (Alternative 2)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal IFRSAdjustments { get; set; } = 0;

    /// <summary>
    /// Field 104: Accounting profit per Israeli standards (Alternative 2)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal IsraeliGAAPProfit { get; set; } = 0;

    /// <summary>
    /// Field 110: Non-deductible expenses
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal NonDeductibleExpenses { get; set; } = 0;

    /// <summary>
    /// Field 120: Timing differences - additions
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TimingDifferencesAdditions { get; set; } = 0;

    /// <summary>
    /// Field 130: Depreciation differences
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal DepreciationDifferences { get; set; } = 0;

    /// <summary>
    /// Field 370: Total tax adjustments
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalTaxAdjustments { get; set; } = 0;

    /// <summary>
    /// Field 400: Taxable income/loss
    /// Calculated as: 100 + 370 (or adjusted formula for IFRS)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxableIncome { get; set; } = 0;

    /// <summary>
    /// Field 500: Final taxable income after inflation adjustments
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal FinalTaxableIncome { get; set; } = 0;

    /// <summary>
    /// Field 600: Partner's share in partnership (if applicable)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PartnershipShare { get; set; } = 0;
}

/// <summary>
/// Part C: Balance Sheet (המאזן)
/// Assets, Liabilities, and Equity as of report date
/// </summary>
public class Form6111BalanceSheet
{
    // Current Assets (נכסים שוטפים) - Fields 7000-7899
    /// <summary>
    /// Field 7000: Total current assets
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCurrentAssets { get; set; } = 0;

    /// <summary>
    /// Field 7100: Cash and cash equivalents
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal CashAndEquivalents { get; set; } = 0;

    /// <summary>
    /// Field 7200: Securities
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal Securities { get; set; } = 0;

    /// <summary>
    /// Field 7300: Accounts receivable (net)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal AccountsReceivable { get; set; } = 0;

    /// <summary>
    /// Field 7400: Other receivables and prepayments
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal OtherReceivables { get; set; } = 0;

    /// <summary>
    /// Field 7800: Inventory
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal Inventory { get; set; } = 0;

    // Fixed Assets (רכוש קבוע) - Fields 8000-8199
    /// <summary>
    /// Field 8000: Total fixed assets (net)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalFixedAssets { get; set; } = 0;

    // Total Assets
    /// <summary>
    /// Field 8888: Total assets (must equal total liabilities and equity)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAssets { get; set; } = 0;

    // Current Liabilities (התחייבויות שוטפות) - Fields 9000-9599
    /// <summary>
    /// Field 9000: Total current liabilities
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCurrentLiabilities { get; set; } = 0;

    /// <summary>
    /// Field 9100: Banks and short-term loans
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal BanksAndShortTermLoans { get; set; } = 0;

    /// <summary>
    /// Field 9200: Suppliers and service providers
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal SuppliersAndServices { get; set; } = 0;

    /// <summary>
    /// Field 9400: Other payables
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal OtherPayables { get; set; } = 0;

    // Long-term Liabilities (התחייבויות לזמן ארוך) - Fields 9600-9899
    /// <summary>
    /// Field 9600: Total long-term liabilities
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalLongTermLiabilities { get; set; } = 0;

    // Equity (הון עצמי) - Fields 9900-9999
    /// <summary>
    /// Field 9900: Total equity
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalEquity { get; set; } = 0;

    /// <summary>
    /// Field 9910: Share capital
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal ShareCapital { get; set; } = 0;

    /// <summary>
    /// Field 9980: Retained earnings
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal RetainedEarnings { get; set; } = 0;

    /// <summary>
    /// Field 9999: Total liabilities and equity (must equal total assets)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalLiabilitiesAndEquity { get; set; } = 0;
}