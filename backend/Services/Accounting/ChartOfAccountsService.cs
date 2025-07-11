using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;
using backend.Data;
using backend.Models.Accounting;
using backend.Services.Interfaces;
using backend.Services.Core;

namespace backend.Services.Accounting;

/// <summary>
/// Chart of accounts management service with hierarchical support and financial reporting
/// Implements Israeli accounting standards and double-entry bookkeeping principles
/// </summary>
public class ChartOfAccountsService : BaseService<ChartOfAccount>, IChartOfAccountsService
{
    public ChartOfAccountsService(AccountingDbContext context, ILogger<ChartOfAccountsService> logger) 
        : base(context, logger)
    {
    }

    protected override DbSet<ChartOfAccount> DbSet => _context.ChartOfAccounts;
    protected override string CompanyIdPropertyName => nameof(ChartOfAccount.CompanyId);

    /// <summary>
    /// Apply search filter for chart of accounts
    /// </summary>
    protected override IQueryable<ChartOfAccount> ApplySearchFilter(IQueryable<ChartOfAccount> query, string searchTerm)
    {
        return query.Where(coa => 
            coa.Name.Contains(searchTerm) ||
            coa.AccountNumber.Contains(searchTerm) ||
            (coa.NameHebrew != null && coa.NameHebrew.Contains(searchTerm)));
    }

    public async Task<ChartOfAccount?> GetByAccountNumberAsync(string accountNumber, int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting account by number: {AccountNumber} for company {CompanyId}", accountNumber, companyId);

            return await _context.ChartOfAccounts
                .AsNoTracking()
                .Where(coa => coa.CompanyId == companyId && !coa.IsDeleted && coa.AccountNumber == accountNumber)
                .FirstOrDefaultAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting account by number: {AccountNumber}", accountNumber);
            throw;
        }
    }

    public async Task<IEnumerable<ChartOfAccount>> GetByTypeAsync(AccountType accountType, int companyId, CancellationToken cancellationToken = default)
    {
        return await _context.ChartOfAccounts
            .AsNoTracking()
            .Where(coa => coa.CompanyId == companyId && !coa.IsDeleted && coa.Type == accountType)
            .OrderBy(coa => coa.AccountNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ChartOfAccountHierarchy>> GetHierarchicalAsync(int companyId, int? parentId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting hierarchical chart of accounts for company {CompanyId}, parent {ParentId}", companyId, parentId);

            var accounts = await _context.ChartOfAccounts
                .AsNoTracking()
                .Where(coa => coa.CompanyId == companyId && !coa.IsDeleted && coa.ParentAccountId == parentId)
                .OrderBy(coa => coa.AccountNumber)
                .ToListAsync(cancellationToken);

            var hierarchy = new List<ChartOfAccountHierarchy>();

            foreach (var account in accounts)
            {
                var hierarchyItem = new ChartOfAccountHierarchy
                {
                    Id = account.Id,
                    AccountNumber = account.AccountNumber,
                    Name = account.Name,
                    Type = account.Type,
                    Balance = account.Balance,
                    ParentAccountId = account.ParentAccountId,
                    SubAccounts = (await GetHierarchicalAsync(companyId, account.Id, cancellationToken)).ToList()
                };

                hierarchy.Add(hierarchyItem);
            }

            return hierarchy;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting hierarchical chart of accounts for company {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<ChartOfAccount> CreateAccountAsync(ChartOfAccount account, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating new account {AccountNumber} for company {CompanyId}", account.AccountNumber, companyId);

            // Validate account number
            var (isValid, errorMessage) = await ValidateAccountNumberAsync(account.AccountNumber, companyId, null, cancellationToken);
            if (!isValid)
            {
                throw new InvalidOperationException($"Invalid account number: {errorMessage}");
            }

            // Set hierarchy level based on parent
            if (account.ParentAccountId.HasValue)
            {
                var parentAccount = await GetByIdAsync(account.ParentAccountId.Value, companyId, cancellationToken);
                if (parentAccount == null)
                {
                    throw new InvalidOperationException($"Parent account {account.ParentAccountId} not found");
                }
                account.Level = parentAccount.Level + 1;
            }
            else
            {
                account.Level = 1;
            }

            // Initialize balance to zero for new accounts
            account.Balance = 0;

            return await CreateAsync(account, companyId, userId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating account {AccountNumber} for company {CompanyId}", account.AccountNumber, companyId);
            throw;
        }
    }

    public async Task<ChartOfAccount> UpdateBalanceAsync(int accountId, decimal balanceChange, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Updating balance for account {AccountId}, change: {Change}", accountId, balanceChange);

            var account = await _context.ChartOfAccounts
                .Where(coa => coa.Id == accountId && coa.CompanyId == companyId && !coa.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            if (account == null)
            {
                throw new InvalidOperationException($"Account {accountId} not found");
            }

            account.Balance += balanceChange;
            account.UpdatedAt = DateTime.UtcNow;
            account.UpdatedBy = userId;

            await _context.SaveChangesAsync(cancellationToken);

            await LogAuditAsync(accountId, companyId, userId, "BALANCE_UPDATE", 
                $"Updated balance by {balanceChange:C}, new balance: {account.Balance:C}", cancellationToken);

            return account;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating balance for account {AccountId}", accountId);
            throw;
        }
    }

    public async Task<(bool IsValid, string ErrorMessage)> ValidateAccountNumberAsync(string accountNumber, int companyId, int? excludeAccountId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(accountNumber))
            {
                return (false, "Account number is required");
            }

            // Clean account number
            accountNumber = accountNumber.Trim();

            // Validate format (3-6 digits)
            if (!Regex.IsMatch(accountNumber, @"^\d{3,6}$"))
            {
                return (false, "Account number must be 3-6 digits");
            }

            // Check for duplicates
            var existingAccount = await _context.ChartOfAccounts
                .AsNoTracking()
                .Where(coa => coa.CompanyId == companyId && !coa.IsDeleted && coa.AccountNumber == accountNumber)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingAccount != null && existingAccount.Id != excludeAccountId)
            {
                return (false, "An account with this number already exists");
            }

            return (true, string.Empty);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating account number: {AccountNumber}", accountNumber);
            return (false, "Error validating account number");
        }
    }

    public async Task<TrialBalance> GetTrialBalanceAsync(int companyId, DateTime asOfDate, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Generating trial balance for company {CompanyId} as of {Date}", companyId, asOfDate);

            var accounts = await _context.ChartOfAccounts
                .AsNoTracking()
                .Where(coa => coa.CompanyId == companyId && !coa.IsDeleted)
                .OrderBy(coa => coa.AccountNumber)
                .ToListAsync(cancellationToken);

            var trialBalance = new TrialBalance
            {
                AsOfDate = asOfDate
            };

            foreach (var account in accounts)
            {
                var trialBalanceAccount = new TrialBalanceAccount
                {
                    AccountNumber = account.AccountNumber,
                    AccountName = account.Name,
                    Type = account.Type
                };

                // For trial balance, determine if balance is debit or credit based on account type
                // Assets and Expenses have debit balances (positive)
                // Liabilities, Equity, and Revenue have credit balances (negative becomes positive)
                if (account.Type == AccountType.Asset || account.Type == AccountType.Expense)
                {
                    trialBalanceAccount.DebitBalance = Math.Max(0, account.Balance);
                    trialBalanceAccount.CreditBalance = Math.Max(0, -account.Balance);
                }
                else // Liability, Equity, Revenue
                {
                    trialBalanceAccount.DebitBalance = Math.Max(0, -account.Balance);
                    trialBalanceAccount.CreditBalance = Math.Max(0, account.Balance);
                }

                trialBalance.Accounts.Add(trialBalanceAccount);
                trialBalance.TotalDebits += trialBalanceAccount.DebitBalance;
                trialBalance.TotalCredits += trialBalanceAccount.CreditBalance;
            }

            return trialBalance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating trial balance for company {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<BalanceSheet> GetBalanceSheetAsync(int companyId, DateTime asOfDate, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Generating balance sheet for company {CompanyId} as of {Date}", companyId, asOfDate);

            var accounts = await _context.ChartOfAccounts
                .AsNoTracking()
                .Where(coa => coa.CompanyId == companyId && !coa.IsDeleted)
                .OrderBy(coa => coa.AccountNumber)
                .ToListAsync(cancellationToken);

            var balanceSheet = new BalanceSheet
            {
                AsOfDate = asOfDate
            };

            foreach (var account in accounts)
            {
                var balanceSheetAccount = new BalanceSheetAccount
                {
                    AccountNumber = account.AccountNumber,
                    AccountName = account.Name,
                    Balance = account.Balance
                };

                switch (account.Type)
                {
                    case AccountType.Asset:
                        balanceSheet.Assets.Accounts.Add(balanceSheetAccount);
                        break;
                    case AccountType.Liability:
                        balanceSheet.Liabilities.Accounts.Add(balanceSheetAccount);
                        break;
                    case AccountType.Equity:
                        balanceSheet.Equity.Accounts.Add(balanceSheetAccount);
                        break;
                }
            }

            return balanceSheet;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating balance sheet for company {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<IncomeStatement> GetIncomeStatementAsync(int companyId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Generating income statement for company {CompanyId} from {FromDate} to {ToDate}", 
                companyId, fromDate, toDate);

            var accounts = await _context.ChartOfAccounts
                .AsNoTracking()
                .Where(coa => coa.CompanyId == companyId && 
                             !coa.IsDeleted && 
                             (coa.Type == AccountType.Revenue || coa.Type == AccountType.Expense))
                .OrderBy(coa => coa.AccountNumber)
                .ToListAsync(cancellationToken);

            var incomeStatement = new IncomeStatement
            {
                FromDate = fromDate,
                ToDate = toDate
            };

            foreach (var account in accounts)
            {
                // For period reporting, we would normally calculate activity within the date range
                // For now, using current balance as placeholder
                var incomeStatementAccount = new IncomeStatementAccount
                {
                    AccountNumber = account.AccountNumber,
                    AccountName = account.Name,
                    Amount = Math.Abs(account.Balance) // Convert to positive amounts for reporting
                };

                if (account.Type == AccountType.Revenue)
                {
                    incomeStatement.Revenues.Accounts.Add(incomeStatementAccount);
                }
                else if (account.Type == AccountType.Expense)
                {
                    incomeStatement.Expenses.Accounts.Add(incomeStatementAccount);
                }
            }

            return incomeStatement;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating income statement for company {CompanyId}", companyId);
            throw;
        }
    }
}
