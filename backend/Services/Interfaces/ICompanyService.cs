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
