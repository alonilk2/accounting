using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Models.Tax;
using backend.Models.Accounting;
using backend.DTOs.Tax;
using backend.Services.Interfaces;

namespace backend.Services.Tax;

/// <summary>
/// Israeli Tax Reporting Service
/// Implements Form 6111 generation and Israeli Tax Authority compliance
/// </summary>
public class IsraeliTaxReportingService : IIsraeliTaxReportingService
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<IsraeliTaxReportingService> _logger;

    public IsraeliTaxReportingService(
        AccountingDbContext context, 
        ILogger<IsraeliTaxReportingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Form6111ResponseDto> GenerateForm6111Async(
        Form6111RequestDto request, 
        int companyId, 
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating Form 6111 for company {CompanyId}, tax year {TaxYear}", 
                companyId, request.TaxYear);

            // Validate request
            if (request.PeriodStartDate >= request.PeriodEndDate)
            {
                throw new ArgumentException("Period start date must be before end date");
            }

            // Calculate all three parts of Form 6111
            var profitLoss = await CalculateProfitLossAsync(companyId, request.PeriodStartDate, request.PeriodEndDate, cancellationToken);
            var balanceSheet = await CalculateBalanceSheetAsync(companyId, request.PeriodEndDate, cancellationToken);
            var taxAdjustment = await CalculateTaxAdjustmentsAsync(companyId, profitLoss.TotalProfitLoss, request.PeriodStartDate, request.PeriodEndDate, cancellationToken);

            // Create Form 6111 entity
            var form6111 = new Form6111
            {
                CompanyId = companyId,
                TaxYear = request.TaxYear,
                PeriodStartDate = request.PeriodStartDate,
                PeriodEndDate = request.PeriodEndDate,
                GeneratedAt = DateTime.UtcNow,
                GeneratedBy = userId,
                Status = Form6111Status.Generated,
                ProfitLossData = JsonSerializer.Serialize(profitLoss),
                TaxAdjustmentData = JsonSerializer.Serialize(taxAdjustment),
                BalanceSheetData = JsonSerializer.Serialize(balanceSheet),
                Notes = request.Notes,
                CreatedBy = userId,
                UpdatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            // Calculate data hash for integrity
            form6111.DataHash = CalculateDataHash(form6111);

            // Save to database
            _context.Set<Form6111>().Add(form6111);
            await _context.SaveChangesAsync(cancellationToken);

            // Validate the generated report
            var validation = await ValidateForm6111Async(form6111.Id, companyId, cancellationToken);

            var response = new Form6111ResponseDto
            {
                Id = form6111.Id,
                CompanyId = form6111.CompanyId,
                TaxYear = form6111.TaxYear,
                PeriodStartDate = form6111.PeriodStartDate,
                PeriodEndDate = form6111.PeriodEndDate,
                GeneratedAt = form6111.GeneratedAt,
                GeneratedBy = form6111.GeneratedBy,
                Status = form6111.Status,
                ProfitLoss = profitLoss,
                TaxAdjustment = taxAdjustment,
                BalanceSheet = balanceSheet,
                Notes = form6111.Notes,
                ValidationWarnings = validation.Warnings,
                DataHash = form6111.DataHash
            };

            _logger.LogInformation("Successfully generated Form 6111 {Form6111Id} for company {CompanyId}", 
                form6111.Id, companyId);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating Form 6111 for company {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<Form6111ProfitLossDto> CalculateProfitLossAsync(
        int companyId, 
        DateTime startDate, 
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Calculating Profit & Loss for company {CompanyId} from {StartDate} to {EndDate}", 
                companyId, startDate, endDate);

            var profitLoss = new Form6111ProfitLossDto();

            // Get revenue accounts (Type = Revenue)
            var revenueAccounts = await _context.ChartOfAccounts
                .Where(a => a.CompanyId == companyId && a.Type == AccountType.Revenue && !a.IsDeleted)
                .ToListAsync(cancellationToken);

            // Calculate revenue from journal entries
            foreach (var account in revenueAccounts)
            {
                var revenue = await _context.Set<JournalEntry>()
                    .Where(je => je.CompanyId == companyId && 
                               je.AccountId == account.Id &&
                               je.TransactionDate >= startDate && 
                               je.TransactionDate <= endDate &&
                               je.IsPosted)
                    .SumAsync(je => je.CreditAmount - je.DebitAmount, cancellationToken);

                // Map to specific revenue categories based on account name/number
                if (account.Name.Contains("Sales") || account.AccountNumber.StartsWith("400"))
                {
                    profitLoss.SalesRevenue += revenue;
                }
                else if (account.Name.Contains("Service") || account.AccountNumber.StartsWith("410"))
                {
                    profitLoss.ServiceRevenue += revenue;
                }
                else
                {
                    profitLoss.OtherRevenue += revenue;
                }
            }

            profitLoss.TotalRevenue = profitLoss.SalesRevenue + profitLoss.ServiceRevenue + profitLoss.OtherRevenue;

            // Calculate Cost of Sales from expense accounts
            var costOfSalesAccounts = await _context.ChartOfAccounts
                .Where(a => a.CompanyId == companyId && 
                          a.Type == AccountType.Expense && 
                          (a.Name.Contains("Cost of") || a.AccountNumber.StartsWith("500")) &&
                          !a.IsDeleted)
                .ToListAsync(cancellationToken);

            foreach (var account in costOfSalesAccounts)
            {
                var cost = await _context.Set<JournalEntry>()
                    .Where(je => je.CompanyId == companyId && 
                               je.AccountId == account.Id &&
                               je.TransactionDate >= startDate && 
                               je.TransactionDate <= endDate &&
                               je.IsPosted)
                    .SumAsync(je => je.DebitAmount - je.CreditAmount, cancellationToken);

                profitLoss.TotalCostOfSales += cost;
            }

            // Calculate inventory movement
            var inventoryAccount = await _context.ChartOfAccounts
                .FirstOrDefaultAsync(a => a.CompanyId == companyId && 
                                        a.Type == AccountType.Asset &&
                                        a.Name.Contains("Inventory") &&
                                        !a.IsDeleted, cancellationToken);

            if (inventoryAccount != null)
            {
                // Opening inventory (beginning of period)
                profitLoss.OpeningInventory = await GetAccountBalanceAsync(inventoryAccount.Id, startDate.AddDays(-1), cancellationToken);
                
                // Closing inventory (end of period)
                profitLoss.ClosingInventory = await GetAccountBalanceAsync(inventoryAccount.Id, endDate, cancellationToken);
            }

            // Calculate other operating expenses
            var operatingExpenseAccounts = await _context.ChartOfAccounts
                .Where(a => a.CompanyId == companyId && 
                          a.Type == AccountType.Expense && 
                          !a.Name.Contains("Cost of") &&
                          !a.AccountNumber.StartsWith("500") &&
                          !a.IsDeleted)
                .ToListAsync(cancellationToken);

            foreach (var account in operatingExpenseAccounts)
            {
                var expense = await _context.Set<JournalEntry>()
                    .Where(je => je.CompanyId == companyId && 
                               je.AccountId == account.Id &&
                               je.TransactionDate >= startDate && 
                               je.TransactionDate <= endDate &&
                               je.IsPosted)
                    .SumAsync(je => je.DebitAmount - je.CreditAmount, cancellationToken);

                // Categorize expenses based on account names/numbers
                if (account.Name.Contains("Salary") || account.Name.Contains("Wage") || account.AccountNumber.StartsWith("510"))
                {
                    profitLoss.TotalAdministrativeExpenses += expense;
                }
                else if (account.Name.Contains("Rent") || account.Name.Contains("Utilities") || account.AccountNumber.StartsWith("520"))
                {
                    profitLoss.TotalAdministrativeExpenses += expense;
                }
                else if (account.Name.Contains("R&D") || account.Name.Contains("Research"))
                {
                    profitLoss.RAndDExpenses += expense;
                }
                else if (account.Name.Contains("Sales") || account.Name.Contains("Marketing"))
                {
                    profitLoss.TotalSalesExpenses += expense;
                }
                else
                {
                    profitLoss.TotalAdministrativeExpenses += expense;
                }
            }

            // Calculate finance income and expenses
            // This would typically come from interest income/expense accounts
            // For now, setting to zero - would need specific account mapping

            // Calculate total profit/loss (Field 6666)
            profitLoss.TotalProfitLoss = profitLoss.TotalRevenue 
                                       - profitLoss.TotalCostOfSales 
                                       - profitLoss.TotalManufacturingCosts 
                                       - profitLoss.RAndDExpenses
                                       - profitLoss.TotalSalesExpenses 
                                       - profitLoss.TotalAdministrativeExpenses 
                                       - profitLoss.TotalFinanceExpenses
                                       + profitLoss.TotalFinanceIncome 
                                       + profitLoss.OtherIncome 
                                       - profitLoss.OtherExpenses;

            return profitLoss;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating profit & loss for company {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<Form6111BalanceSheetDto> CalculateBalanceSheetAsync(
        int companyId, 
        DateTime asOfDate,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Calculating Balance Sheet for company {CompanyId} as of {AsOfDate}", 
                companyId, asOfDate);

            var balanceSheet = new Form6111BalanceSheetDto();

            // Get all accounts for the company
            var accounts = await _context.ChartOfAccounts
                .Where(a => a.CompanyId == companyId && !a.IsDeleted)
                .ToListAsync(cancellationToken);

            // Calculate balances for each account as of the specified date
            foreach (var account in accounts)
            {
                var balance = await GetAccountBalanceAsync(account.Id, asOfDate, cancellationToken);

                switch (account.Type)
                {
                    case AccountType.Asset:
                        await ClassifyAssetAccount(account, balance, balanceSheet);
                        break;
                    case AccountType.Liability:
                        await ClassifyLiabilityAccount(account, balance, balanceSheet);
                        break;
                    case AccountType.Equity:
                        await ClassifyEquityAccount(account, balance, balanceSheet);
                        break;
                }
            }

            // Calculate totals
            balanceSheet.TotalCurrentAssets = balanceSheet.CashAndEquivalents 
                                            + balanceSheet.Securities 
                                            + balanceSheet.AccountsReceivable 
                                            + balanceSheet.OtherReceivables 
                                            + balanceSheet.Inventory;

            balanceSheet.TotalAssets = balanceSheet.TotalCurrentAssets + balanceSheet.TotalFixedAssets;

            balanceSheet.TotalCurrentLiabilities = balanceSheet.BanksAndShortTermLoans 
                                                 + balanceSheet.SuppliersAndServices 
                                                 + balanceSheet.OtherPayables;

            balanceSheet.TotalEquity = balanceSheet.ShareCapital + balanceSheet.RetainedEarnings;

            balanceSheet.TotalLiabilitiesAndEquity = balanceSheet.TotalCurrentLiabilities 
                                                   + balanceSheet.TotalLongTermLiabilities 
                                                   + balanceSheet.TotalEquity;

            return balanceSheet;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating balance sheet for company {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<Form6111TaxAdjustmentDto> CalculateTaxAdjustmentsAsync(
        int companyId, 
        decimal accountingProfit, 
        DateTime startDate, 
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Calculating tax adjustments for company {CompanyId}", companyId);

            var taxAdjustment = new Form6111TaxAdjustmentDto
            {
                ProfitLossBeforeTax = accountingProfit
            };

            // For MVP, implement basic tax adjustments
            // In a full implementation, this would include:
            // - Non-deductible expenses
            // - Depreciation differences
            // - Timing differences
            // - IFRS adjustments if applicable

            // Calculate basic adjustments (placeholder logic)
            taxAdjustment.NonDeductibleExpenses = 0; // Would need specific business rules
            taxAdjustment.TimingDifferencesAdditions = 0;
            taxAdjustment.DepreciationDifferences = 0;

            taxAdjustment.TotalTaxAdjustments = taxAdjustment.NonDeductibleExpenses 
                                             + taxAdjustment.TimingDifferencesAdditions 
                                             + taxAdjustment.DepreciationDifferences;

            taxAdjustment.TaxableIncome = taxAdjustment.ProfitLossBeforeTax + taxAdjustment.TotalTaxAdjustments;
            taxAdjustment.FinalTaxableIncome = taxAdjustment.TaxableIncome; // After inflation adjustments

            return taxAdjustment;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating tax adjustments for company {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<Form6111ValidationResultDto> ValidateForm6111Async(
        int form6111Id, 
        int companyId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var validation = new Form6111ValidationResultDto
            {
                IsValid = true,
                AllRequiredFieldsPresent = true,
                DataConsistencyPassed = true
            };

            var form = await _context.Set<Form6111>()
                .FirstOrDefaultAsync(f => f.Id == form6111Id && f.CompanyId == companyId && !f.IsDeleted, cancellationToken);

            if (form == null)
            {
                validation.IsValid = false;
                validation.Errors.Add("Form 6111 not found");
                return validation;
            }

            // Deserialize data for validation
            var profitLoss = JsonSerializer.Deserialize<Form6111ProfitLossDto>(form.ProfitLossData ?? "{}");
            var balanceSheet = JsonSerializer.Deserialize<Form6111BalanceSheetDto>(form.BalanceSheetData ?? "{}");

            // Validate balance sheet balance
            if (balanceSheet != null)
            {
                validation.IsBalanceSheetBalanced = balanceSheet.IsBalanced;
                if (!validation.IsBalanceSheetBalanced)
                {
                    validation.Warnings.Add($"Balance sheet is not balanced. Difference: {balanceSheet.BalanceDifference:N2}");
                }
            }

            // Validate profit/loss calculation
            if (profitLoss != null)
            {
                var calculatedProfit = profitLoss.TotalRevenue - profitLoss.TotalCostOfSales - 
                                     profitLoss.TotalAdministrativeExpenses - profitLoss.TotalSalesExpenses;
                
                if (Math.Abs(calculatedProfit - profitLoss.TotalProfitLoss) > 0.01m)
                {
                    validation.Warnings.Add("Profit/Loss calculation may be incorrect");
                }
            }

            return validation;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Form 6111 {Form6111Id}", form6111Id);
            throw;
        }
    }

    public async Task<Form6111ExportDto> ExportForm6111Async(
        int form6111Id, 
        int companyId, 
        string format = "JSON",
        CancellationToken cancellationToken = default)
    {
        try
        {
            var form = await _context.Set<Form6111>()
                .FirstOrDefaultAsync(f => f.Id == form6111Id && f.CompanyId == companyId && !f.IsDeleted, cancellationToken);

            if (form == null)
            {
                throw new ArgumentException($"Form 6111 with ID {form6111Id} not found");
            }

            var company = await _context.Companies
                .FirstOrDefaultAsync(c => c.Id == companyId, cancellationToken);

            var exportDto = new Form6111ExportDto
            {
                CompanyInfo = new CompanyIdentificationDto
                {
                    CompanyName = company?.Name ?? "",
                    IsraelTaxId = company?.IsraelTaxId ?? "",
                    Address = company?.Address ?? "",
                    City = company?.City ?? "",
                    Phone = company?.Phone ?? "",
                    Email = company?.Email ?? ""
                },
                ReportMetadata = new ReportMetadataDto
                {
                    TaxYear = form.TaxYear,
                    PeriodStartDate = form.PeriodStartDate,
                    PeriodEndDate = form.PeriodEndDate,
                    GeneratedAt = form.GeneratedAt,
                    GeneratedBy = form.GeneratedBy,
                    Currency = "ILS"
                },
                ProfitLoss = JsonSerializer.Deserialize<Form6111ProfitLossDto>(form.ProfitLossData ?? "{}") ?? new(),
                TaxAdjustment = JsonSerializer.Deserialize<Form6111TaxAdjustmentDto>(form.TaxAdjustmentData ?? "{}") ?? new(),
                BalanceSheet = JsonSerializer.Deserialize<Form6111BalanceSheetDto>(form.BalanceSheetData ?? "{}") ?? new(),
                ExportFormat = format
            };

            // Generate file content based on format
            switch (format.ToUpper())
            {
                case "JSON":
                    exportDto.FileContent = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(exportDto, new JsonSerializerOptions { WriteIndented = true }));
                    exportDto.FileName = $"Form6111_{company?.IsraelTaxId}_{form.TaxYear}.json";
                    break;
                case "XML":
                    // XML export would go here
                    exportDto.FileContent = Encoding.UTF8.GetBytes("XML export not implemented yet");
                    exportDto.FileName = $"Form6111_{company?.IsraelTaxId}_{form.TaxYear}.xml";
                    break;
                default:
                    throw new ArgumentException($"Unsupported export format: {format}");
            }

            return exportDto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting Form 6111 {Form6111Id}", form6111Id);
            throw;
        }
    }

    public async Task<IEnumerable<Form6111ResponseDto>> GetForm6111ReportsAsync(
        int companyId, 
        int? taxYear = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.Set<Form6111>()
                .Where(f => f.CompanyId == companyId && !f.IsDeleted);

            if (taxYear.HasValue)
            {
                query = query.Where(f => f.TaxYear == taxYear.Value);
            }

            var forms = await query
                .OrderByDescending(f => f.TaxYear)
                .ThenByDescending(f => f.GeneratedAt)
                .ToListAsync(cancellationToken);

            var results = new List<Form6111ResponseDto>();

            foreach (var form in forms)
            {
                var response = new Form6111ResponseDto
                {
                    Id = form.Id,
                    CompanyId = form.CompanyId,
                    TaxYear = form.TaxYear,
                    PeriodStartDate = form.PeriodStartDate,
                    PeriodEndDate = form.PeriodEndDate,
                    GeneratedAt = form.GeneratedAt,
                    GeneratedBy = form.GeneratedBy,
                    Status = form.Status,
                    Notes = form.Notes,
                    DataHash = form.DataHash,
                    ProfitLoss = JsonSerializer.Deserialize<Form6111ProfitLossDto>(form.ProfitLossData ?? "{}") ?? new(),
                    TaxAdjustment = JsonSerializer.Deserialize<Form6111TaxAdjustmentDto>(form.TaxAdjustmentData ?? "{}") ?? new(),
                    BalanceSheet = JsonSerializer.Deserialize<Form6111BalanceSheetDto>(form.BalanceSheetData ?? "{}") ?? new()
                };

                results.Add(response);
            }

            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Form 6111 reports for company {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<Dictionary<string, string>> GetIsraeliAccountMappingAsync(
        int companyId,
        CancellationToken cancellationToken = default)
    {
        // Return Israeli standard account mapping for Form 6111
        var mapping = new Dictionary<string, string>
        {
            // Revenue accounts
            ["400"] = "1010", // Sales Revenue -> Field 1010
            ["410"] = "1020", // Service Revenue -> Field 1020
            ["490"] = "1090", // Other Revenue -> Field 1090
            
            // Cost accounts
            ["500"] = "1300", // Cost of Goods Sold -> Field 1300
            
            // Expense accounts
            ["510"] = "3500", // Salaries -> Administrative Expenses
            ["520"] = "3500", // Rent -> Administrative Expenses
            ["530"] = "3500", // Utilities -> Administrative Expenses
            
            // Asset accounts
            ["100"] = "7100", // Cash -> Field 7100
            ["110"] = "7300", // Accounts Receivable -> Field 7300
            ["120"] = "7800", // Inventory -> Field 7800
            ["150"] = "8000", // Fixed Assets -> Field 8000
            
            // Liability accounts
            ["200"] = "9200", // Accounts Payable -> Field 9200
            ["210"] = "9400", // VAT Payable -> Other Payables
            
            // Equity accounts
            ["300"] = "9910", // Owner's Equity -> Share Capital
            ["310"] = "9980"  // Retained Earnings -> Field 9980
        };

        return mapping;
    }

    public async Task<Form6111ResponseDto> UpdateForm6111StatusAsync(
        int form6111Id, 
        int companyId, 
        Form6111Status status, 
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var form = await _context.Set<Form6111>()
                .FirstOrDefaultAsync(f => f.Id == form6111Id && f.CompanyId == companyId && !f.IsDeleted, cancellationToken);

            if (form == null)
            {
                throw new ArgumentException($"Form 6111 with ID {form6111Id} not found");
            }

            form.Status = status;
            form.UpdatedBy = userId;
            form.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return new Form6111ResponseDto
            {
                Id = form.Id,
                CompanyId = form.CompanyId,
                TaxYear = form.TaxYear,
                PeriodStartDate = form.PeriodStartDate,
                PeriodEndDate = form.PeriodEndDate,
                GeneratedAt = form.GeneratedAt,
                GeneratedBy = form.GeneratedBy,
                Status = form.Status,
                Notes = form.Notes,
                DataHash = form.DataHash
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Form 6111 status {Form6111Id}", form6111Id);
            throw;
        }
    }

    #region Private Helper Methods

    private async Task<decimal> GetAccountBalanceAsync(int accountId, DateTime asOfDate, CancellationToken cancellationToken)
    {
        var account = await _context.ChartOfAccounts
            .FirstOrDefaultAsync(a => a.Id == accountId, cancellationToken);

        if (account == null) return 0;

        var debits = await _context.Set<JournalEntry>()
            .Where(je => je.AccountId == accountId && 
                       je.TransactionDate <= asOfDate && 
                       je.IsPosted)
            .SumAsync(je => je.DebitAmount, cancellationToken);

        var credits = await _context.Set<JournalEntry>()
            .Where(je => je.AccountId == accountId && 
                       je.TransactionDate <= asOfDate && 
                       je.IsPosted)
            .SumAsync(je => je.CreditAmount, cancellationToken);

        // Return balance based on account normal balance type
        return account.IsDebitNormal ? debits - credits : credits - debits;
    }

    private async Task ClassifyAssetAccount(ChartOfAccount account, decimal balance, Form6111BalanceSheetDto balanceSheet)
    {
        if (account.Name.Contains("Cash") || account.AccountNumber.StartsWith("100"))
        {
            balanceSheet.CashAndEquivalents += balance;
        }
        else if (account.Name.Contains("Receivable") || account.AccountNumber.StartsWith("110"))
        {
            balanceSheet.AccountsReceivable += balance;
        }
        else if (account.Name.Contains("Inventory") || account.AccountNumber.StartsWith("120"))
        {
            balanceSheet.Inventory += balance;
        }
        else if (account.Name.Contains("Fixed") || account.AccountNumber.StartsWith("150"))
        {
            balanceSheet.TotalFixedAssets += balance;
        }
        else
        {
            balanceSheet.OtherReceivables += balance;
        }
    }

    private async Task ClassifyLiabilityAccount(ChartOfAccount account, decimal balance, Form6111BalanceSheetDto balanceSheet)
    {
        if (account.Name.Contains("Payable") || account.AccountNumber.StartsWith("200"))
        {
            balanceSheet.SuppliersAndServices += balance;
        }
        else if (account.Name.Contains("Loan") || account.Name.Contains("Bank"))
        {
            balanceSheet.BanksAndShortTermLoans += balance;
        }
        else
        {
            balanceSheet.OtherPayables += balance;
        }
    }

    private async Task ClassifyEquityAccount(ChartOfAccount account, decimal balance, Form6111BalanceSheetDto balanceSheet)
    {
        if (account.Name.Contains("Capital") || account.AccountNumber.StartsWith("300"))
        {
            balanceSheet.ShareCapital += balance;
        }
        else if (account.Name.Contains("Retained") || account.Name.Contains("Earnings") || account.AccountNumber.StartsWith("310"))
        {
            balanceSheet.RetainedEarnings += balance;
        }
        else
        {
            balanceSheet.ShareCapital += balance;
        }
    }

    private string CalculateDataHash(Form6111 form)
    {
        var dataString = $"{form.TaxYear}{form.PeriodStartDate:yyyyMMdd}{form.PeriodEndDate:yyyyMMdd}" +
                        $"{form.ProfitLossData}{form.TaxAdjustmentData}{form.BalanceSheetData}";
        
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(dataString));
        return Convert.ToHexString(hashBytes);
    }

    #endregion
}