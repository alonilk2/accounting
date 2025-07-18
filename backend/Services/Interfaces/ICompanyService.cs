using backend.Models.Core;

namespace backend.Services.Interfaces;

/// <summary>
/// Company management service interface for multi-tenant operations
/// Handles company creation, validation, and tenant-specific operations
/// </summary>
public interface ICompanyService : IBaseService<Company>
{
    /// <summary>
    /// Get company by Israeli Tax ID
    /// </summary>
    /// <param name="taxId">Israeli Tax Authority ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Company or null if not found</returns>
    Task<Company?> GetByTaxIdAsync(string taxId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validate Israeli Tax ID format and check for duplicates
    /// </summary>
    /// <param name="taxId">Tax ID to validate</param>
    /// <param name="excludeCompanyId">Company ID to exclude from duplicate check (for updates)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Validation result with error messages if any</returns>
    Task<(bool IsValid, string ErrorMessage)> ValidateTaxIdAsync(
        string taxId, 
        int? excludeCompanyId = null, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Initialize a new company with default chart of accounts
    /// </summary>
    /// <param name="company">Company to initialize</param>
    /// <param name="userId">User ID for audit trail</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Initialized company with default accounts</returns>
    Task<Company> InitializeCompanyAsync(Company company, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get company statistics for dashboard
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Company statistics</returns>
    Task<CompanyDashboardStats> GetDashboardStatsAsync(int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if company has access to specific feature
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="feature">Feature name</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if has access</returns>
    Task<bool> HasFeatureAccessAsync(int companyId, string feature, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update company subscription
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="subscriptionPlan">Subscription plan</param>
    /// <param name="expiresAt">Expiration date</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated company</returns>
    Task<Company> UpdateSubscriptionAsync(int companyId, string subscriptionPlan, DateTime? expiresAt, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get company settings
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Company settings</returns>
    Task<CompanySettings> GetCompanySettingsAsync(int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update company settings
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="settings">New settings</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated company settings</returns>
    Task<CompanySettings> UpdateCompanySettingsAsync(int companyId, CompanySettings settings, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get companies by search criteria
    /// </summary>
    /// <param name="criteria">Search criteria</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Matching companies</returns>
    Task<IEnumerable<Company>> GetCompaniesByCriteriaAsync(CompanySearchCriteria criteria, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if company subscription is expired
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if expired</returns>
    Task<bool> IsSubscriptionExpiredAsync(int companyId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Company dashboard statistics
/// </summary>
public class CompanyDashboardStats
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetProfit { get; set; }
    public decimal AccountsReceivable { get; set; }
    public decimal AccountsPayable { get; set; }
    public decimal CashBalance { get; set; }
    public int TotalCustomers { get; set; }
    public int TotalSuppliers { get; set; }
    public int PendingInvoices { get; set; }
    public int OverdueInvoices { get; set; }
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Company settings data transfer object
/// </summary>
public class CompanySettings
{
    public int CompanyId { get; set; }
    public string Currency { get; set; } = "ILS";
    public int FiscalYearStartMonth { get; set; } = 1;
    public string TimeZone { get; set; } = "Israel Standard Time";
    public string? SubscriptionPlan { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Company search criteria
/// </summary>
public class CompanySearchCriteria
{
    public string? Name { get; set; }
    public string? TaxId { get; set; }
    public string? City { get; set; }
    public string? SubscriptionPlan { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedAfter { get; set; }
    public DateTime? CreatedBefore { get; set; }
    public string? OrderBy { get; set; } = "Id";
    public bool OrderDescending { get; set; } = false;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
