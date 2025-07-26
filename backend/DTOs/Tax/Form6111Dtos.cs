using System.ComponentModel.DataAnnotations;
using backend.Models.Tax;

namespace backend.DTOs.Tax;

/// <summary>
/// Request DTO for generating Form 6111 report
/// </summary>
public class Form6111RequestDto
{
    /// <summary>
    /// Tax year for the report
    /// </summary>
    [Required]
    [Range(2000, 2100)]
    public int TaxYear { get; set; } = DateTime.Now.Year;

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
    /// Include draft transactions (default: false)
    /// </summary>
    public bool IncludeDraftTransactions { get; set; } = false;

    /// <summary>
    /// Report currency (default: ILS)
    /// </summary>
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    /// <summary>
    /// Additional notes for the report
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }
}

/// <summary>
/// Response DTO for Form 6111 report
/// </summary>
public class Form6111ResponseDto
{
    /// <summary>
    /// Report ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Company ID
    /// </summary>
    public int CompanyId { get; set; }

    /// <summary>
    /// Tax year
    /// </summary>
    public int TaxYear { get; set; }

    /// <summary>
    /// Report period start date
    /// </summary>
    public DateTime PeriodStartDate { get; set; }

    /// <summary>
    /// Report period end date
    /// </summary>
    public DateTime PeriodEndDate { get; set; }

    /// <summary>
    /// Generation timestamp
    /// </summary>
    public DateTime GeneratedAt { get; set; }

    /// <summary>
    /// User who generated the report
    /// </summary>
    public string GeneratedBy { get; set; } = string.Empty;

    /// <summary>
    /// Report status
    /// </summary>
    public Form6111Status Status { get; set; }

    /// <summary>
    /// Part A: Profit & Loss data
    /// </summary>
    public Form6111ProfitLossDto ProfitLoss { get; set; } = new();

    /// <summary>
    /// Part B: Tax Adjustment data
    /// </summary>
    public Form6111TaxAdjustmentDto TaxAdjustment { get; set; } = new();

    /// <summary>
    /// Part C: Balance Sheet data
    /// </summary>
    public Form6111BalanceSheetDto BalanceSheet { get; set; } = new();

    /// <summary>
    /// Additional notes
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Data validation results
    /// </summary>
    public List<string> ValidationWarnings { get; set; } = new();

    /// <summary>
    /// Data integrity hash
    /// </summary>
    public string? DataHash { get; set; }
}

/// <summary>
/// Part A: Profit & Loss Report DTO
/// </summary>
public class Form6111ProfitLossDto
{
    // Revenue section
    public decimal TotalRevenue { get; set; }
    public decimal SalesRevenue { get; set; }
    public decimal ServiceRevenue { get; set; }
    public decimal OtherRevenue { get; set; }

    // Cost of Sales section
    public decimal TotalCostOfSales { get; set; }
    public decimal OpeningInventory { get; set; }
    public decimal Purchases { get; set; }
    public decimal ClosingInventory { get; set; }

    // Operating Expenses section
    public decimal TotalManufacturingCosts { get; set; }
    public decimal RAndDExpenses { get; set; }
    public decimal TotalSalesExpenses { get; set; }
    public decimal TotalAdministrativeExpenses { get; set; }

    // Finance section
    public decimal TotalFinanceExpenses { get; set; }
    public decimal TotalFinanceIncome { get; set; }

    // Other section
    public decimal OtherIncome { get; set; }
    public decimal OtherExpenses { get; set; }

    // Bottom line
    public decimal TotalProfitLoss { get; set; }

    // Tax section
    public decimal CurrentTaxExpense { get; set; }
    public decimal DeferredTaxExpense { get; set; }

    /// <summary>
    /// Calculated gross profit (Revenue - Cost of Sales)
    /// </summary>
    public decimal GrossProfit => TotalRevenue - TotalCostOfSales;

    /// <summary>
    /// Calculated operating profit (Gross Profit - Operating Expenses)
    /// </summary>
    public decimal OperatingProfit => GrossProfit - TotalManufacturingCosts - RAndDExpenses - TotalSalesExpenses - TotalAdministrativeExpenses;

    /// <summary>
    /// Net finance result (Finance Income - Finance Expenses)
    /// </summary>
    public decimal NetFinanceResult => TotalFinanceIncome - TotalFinanceExpenses;
}

/// <summary>
/// Part B: Tax Adjustment Report DTO
/// </summary>
public class Form6111TaxAdjustmentDto
{
    public decimal ProfitLossBeforeTax { get; set; }
    public decimal IFRSAdjustments { get; set; }
    public decimal IsraeliGAAPProfit { get; set; }
    public decimal NonDeductibleExpenses { get; set; }
    public decimal TimingDifferencesAdditions { get; set; }
    public decimal DepreciationDifferences { get; set; }
    public decimal TotalTaxAdjustments { get; set; }
    public decimal TaxableIncome { get; set; }
    public decimal FinalTaxableIncome { get; set; }
    public decimal PartnershipShare { get; set; }

    /// <summary>
    /// List of tax adjustment details for audit trail
    /// </summary>
    public List<TaxAdjustmentDetailDto> AdjustmentDetails { get; set; } = new();
}

/// <summary>
/// Tax adjustment detail DTO
/// </summary>
public class TaxAdjustmentDetailDto
{
    public string FieldCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// Part C: Balance Sheet Report DTO
/// </summary>
public class Form6111BalanceSheetDto
{
    // Assets
    public decimal TotalCurrentAssets { get; set; }
    public decimal CashAndEquivalents { get; set; }
    public decimal Securities { get; set; }
    public decimal AccountsReceivable { get; set; }
    public decimal OtherReceivables { get; set; }
    public decimal Inventory { get; set; }
    public decimal TotalFixedAssets { get; set; }
    public decimal TotalAssets { get; set; }

    // Liabilities
    public decimal TotalCurrentLiabilities { get; set; }
    public decimal BanksAndShortTermLoans { get; set; }
    public decimal SuppliersAndServices { get; set; }
    public decimal OtherPayables { get; set; }
    public decimal TotalLongTermLiabilities { get; set; }

    // Equity
    public decimal TotalEquity { get; set; }
    public decimal ShareCapital { get; set; }
    public decimal RetainedEarnings { get; set; }
    public decimal TotalLiabilitiesAndEquity { get; set; }

    /// <summary>
    /// Balance verification - assets should equal liabilities + equity
    /// </summary>
    public bool IsBalanced => Math.Abs(TotalAssets - TotalLiabilitiesAndEquity) < 0.01m;

    /// <summary>
    /// Balance difference (should be zero)
    /// </summary>
    public decimal BalanceDifference => TotalAssets - TotalLiabilitiesAndEquity;
}

/// <summary>
/// Form 6111 export format DTO
/// </summary>
public class Form6111ExportDto
{
    /// <summary>
    /// Company identifying information
    /// </summary>
    public CompanyIdentificationDto CompanyInfo { get; set; } = new();

    /// <summary>
    /// Report metadata
    /// </summary>
    public ReportMetadataDto ReportMetadata { get; set; } = new();

    /// <summary>
    /// Part A: Profit & Loss
    /// </summary>
    public Form6111ProfitLossDto ProfitLoss { get; set; } = new();

    /// <summary>
    /// Part B: Tax Adjustments
    /// </summary>
    public Form6111TaxAdjustmentDto TaxAdjustment { get; set; } = new();

    /// <summary>
    /// Part C: Balance Sheet
    /// </summary>
    public Form6111BalanceSheetDto BalanceSheet { get; set; } = new();

    /// <summary>
    /// Export format (JSON, XML, TXT)
    /// </summary>
    public string ExportFormat { get; set; } = "JSON";

    /// <summary>
    /// Generated file content (for download)
    /// </summary>
    public byte[]? FileContent { get; set; }

    /// <summary>
    /// Generated filename
    /// </summary>
    public string FileName { get; set; } = string.Empty;
}

/// <summary>
/// Company identification for tax reporting
/// </summary>
public class CompanyIdentificationDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string IsraelTaxId { get; set; } = string.Empty;
    public string BusinessDescription { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int BusinessSectorCode { get; set; }
}

/// <summary>
/// Report metadata for tax filing
/// </summary>
public class ReportMetadataDto
{
    public int TaxYear { get; set; }
    public DateTime PeriodStartDate { get; set; }
    public DateTime PeriodEndDate { get; set; }
    public DateTime GeneratedAt { get; set; }
    public string GeneratedBy { get; set; } = string.Empty;
    public string ReportingMethod { get; set; } = "Accrual"; // Cash or Accrual
    public string AccountingMethod { get; set; } = "Double"; // Single or Double
    public bool IsPartnership { get; set; } = false;
    public bool UsesIFRS { get; set; } = false;
    public string Currency { get; set; } = "ILS";
}

/// <summary>
/// Form 6111 validation result DTO
/// </summary>
public class Form6111ValidationResultDto
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public List<string> InfoMessages { get; set; } = new();

    /// <summary>
    /// Critical validation failures that prevent submission
    /// </summary>
    public bool HasCriticalErrors => Errors.Any();

    /// <summary>
    /// Balance sheet validation
    /// </summary>
    public bool IsBalanceSheetBalanced { get; set; }

    /// <summary>
    /// Required fields validation
    /// </summary>
    public bool AllRequiredFieldsPresent { get; set; }

    /// <summary>
    /// Data consistency validation
    /// </summary>
    public bool DataConsistencyPassed { get; set; }
}