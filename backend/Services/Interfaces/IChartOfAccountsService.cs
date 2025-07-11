using backend.Models.Accounting;

namespace backend.Services.Interfaces;

/// <summary>
/// Chart of accounts management service interface
/// Handles general ledger account management and hierarchy
/// </summary>
public interface IChartOfAccountsService : IBaseService<ChartOfAccount>
{
    /// <summary>
    /// Get account by account number
    /// </summary>
    /// <param name="accountNumber">Account number</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Chart of account or null if not found</returns>
    Task<ChartOfAccount?> GetByAccountNumberAsync(string accountNumber, int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get accounts by type
    /// </summary>
    /// <param name="accountType">Account type</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Accounts of the specified type</returns>
    Task<IEnumerable<ChartOfAccount>> GetByTypeAsync(AccountType accountType, int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get hierarchical chart of accounts
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="parentId">Parent account ID (null for root accounts)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Hierarchical account structure</returns>
    Task<IEnumerable<ChartOfAccountHierarchy>> GetHierarchicalAsync(int companyId, int? parentId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create account with validation
    /// </summary>
    /// <param name="account">Account to create</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created account</returns>
    Task<ChartOfAccount> CreateAccountAsync(ChartOfAccount account, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update account balance
    /// </summary>
    /// <param name="accountId">Account ID</param>
    /// <param name="balanceChange">Balance change amount</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated account</returns>
    Task<ChartOfAccount> UpdateBalanceAsync(int accountId, decimal balanceChange, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validate account number format and uniqueness
    /// </summary>
    /// <param name="accountNumber">Account number to validate</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="excludeAccountId">Account ID to exclude from uniqueness check</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Validation result</returns>
    Task<(bool IsValid, string ErrorMessage)> ValidateAccountNumberAsync(string accountNumber, int companyId, int? excludeAccountId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get trial balance for a specific date
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="asOfDate">As of date</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Trial balance report</returns>
    Task<TrialBalance> GetTrialBalanceAsync(int companyId, DateTime asOfDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get balance sheet accounts structure
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="asOfDate">As of date</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Balance sheet structure</returns>
    Task<BalanceSheet> GetBalanceSheetAsync(int companyId, DateTime asOfDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get income statement accounts
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="fromDate">From date</param>
    /// <param name="toDate">To date</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Income statement</returns>
    Task<IncomeStatement> GetIncomeStatementAsync(int companyId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default);
}

/// <summary>
/// Hierarchical chart of accounts structure
/// </summary>
public class ChartOfAccountHierarchy
{
    public int Id { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public AccountType Type { get; set; }
    public decimal Balance { get; set; }
    public int? ParentAccountId { get; set; }
    public List<ChartOfAccountHierarchy> SubAccounts { get; set; } = new();
}

/// <summary>
/// Trial balance report
/// </summary>
public class TrialBalance
{
    public DateTime AsOfDate { get; set; }
    public List<TrialBalanceAccount> Accounts { get; set; } = new();
    public decimal TotalDebits { get; set; }
    public decimal TotalCredits { get; set; }
    public bool IsBalanced => TotalDebits == TotalCredits;
}

/// <summary>
/// Trial balance account entry
/// </summary>
public class TrialBalanceAccount
{
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public AccountType Type { get; set; }
    public decimal DebitBalance { get; set; }
    public decimal CreditBalance { get; set; }
}

/// <summary>
/// Balance sheet structure
/// </summary>
public class BalanceSheet
{
    public DateTime AsOfDate { get; set; }
    public BalanceSheetSection Assets { get; set; } = new();
    public BalanceSheetSection Liabilities { get; set; } = new();
    public BalanceSheetSection Equity { get; set; } = new();
    
    public decimal TotalAssets => Assets.Total;
    public decimal TotalLiabilitiesAndEquity => Liabilities.Total + Equity.Total;
    public bool IsBalanced => TotalAssets == TotalLiabilitiesAndEquity;
}

/// <summary>
/// Balance sheet section (Assets, Liabilities, Equity)
/// </summary>
public class BalanceSheetSection
{
    public List<BalanceSheetAccount> Accounts { get; set; } = new();
    public decimal Total => Accounts.Sum(a => a.Balance);
}

/// <summary>
/// Balance sheet account
/// </summary>
public class BalanceSheetAccount
{
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public decimal Balance { get; set; }
}

/// <summary>
/// Income statement structure
/// </summary>
public class IncomeStatement
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public IncomeStatementSection Revenues { get; set; } = new();
    public IncomeStatementSection Expenses { get; set; } = new();
    
    public decimal TotalRevenues => Revenues.Total;
    public decimal TotalExpenses => Expenses.Total;
    public decimal NetIncome => TotalRevenues - TotalExpenses;
}

/// <summary>
/// Income statement section (Revenues, Expenses)
/// </summary>
public class IncomeStatementSection
{
    public List<IncomeStatementAccount> Accounts { get; set; } = new();
    public decimal Total => Accounts.Sum(a => a.Amount);
}

/// <summary>
/// Income statement account
/// </summary>
public class IncomeStatementAccount
{
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
