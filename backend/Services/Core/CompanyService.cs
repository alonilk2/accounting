using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.Models.Core;
using backend.Models.Accounting;
using backend.Models.Sales;
using backend.Models.Purchasing;
using backend.Services.Interfaces;

namespace backend.Services.Core;

/// <summary>
/// Company management service implementing multi-tenant operations
/// Handles company lifecycle, validation, and initialization with default chart of accounts
/// </summary>
public class CompanyService : BaseService<Company>, ICompanyService
{
    public CompanyService(AccountingDbContext context, ILogger<CompanyService> logger) 
        : base(context, logger)
    {
    }

    protected override DbSet<Company> DbSet => _context.Companies;
    protected override string CompanyIdPropertyName => "Id"; // Company doesn't filter by itself

    /// <summary>
    /// Override company filter since Company entity doesn't have CompanyId
    /// </summary>
    protected override IQueryable<Company> ApplyCompanyFilter(IQueryable<Company> query, int companyId)
    {
        return query.Where(c => c.Id == companyId);
    }

    /// <summary>
    /// Apply search filter for company name, tax ID, and email
    /// </summary>
    protected override IQueryable<Company> ApplySearchFilter(IQueryable<Company> query, string searchTerm)
    {
        return query.Where(c => 
            c.Name.Contains(searchTerm) ||
            c.IsraelTaxId.Contains(searchTerm) ||
            (c.Email != null && c.Email.Contains(searchTerm)));
    }

    public async Task<Company?> GetByTaxIdAsync(string taxId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting company by tax ID: {TaxId}", taxId);

            return await _context.Companies
                .AsNoTracking()
                .Where(c => !c.IsDeleted && c.IsraelTaxId == taxId)
                .FirstOrDefaultAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting company by tax ID: {TaxId}", taxId);
            throw;
        }
    }

    public async Task<(bool IsValid, string ErrorMessage)> ValidateTaxIdAsync(
        string taxId, 
        int? excludeCompanyId = null, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(taxId))
            {
                return (false, "Tax ID is required");
            }

            // Israeli tax ID validation (9 digits with check digit algorithm)
            if (!IsraeliTaxIdValidator.TryNormalizeValid(taxId, out var normalizedTaxId))
            {
                return (false, "Invalid Israeli Tax ID format or check digit");
            }

            // Check for duplicates
            var existingCompany = await _context.Companies
                .AsNoTracking()
                .Where(c => !c.IsDeleted && c.IsraelTaxId == normalizedTaxId)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingCompany != null && existingCompany.Id != excludeCompanyId)
            {
                return (false, "A company with this Tax ID already exists");
            }

            return (true, string.Empty);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating tax ID: {TaxId}", taxId);
            return (false, "Error validating Tax ID");
        }
    }

    public async Task<Company> InitializeCompanyAsync(Company company, string userId, CancellationToken cancellationToken = default)
    {
        return await TransactionHelper.ExecuteInTransactionAsync(_context, async (transaction, ct) =>
        {
            _logger.LogInformation("Initializing company: {CompanyName}", company.Name);

            // Validate tax ID
            var (isValid, errorMessage) = await ValidateTaxIdAsync(company.IsraelTaxId, null, ct);
            if (!isValid)
            {
                throw new InvalidOperationException($"Invalid tax ID: {errorMessage}");
            }

            // Create the company
            company.CreatedAt = DateTime.UtcNow;
            company.UpdatedAt = DateTime.UtcNow;
            company.CreatedBy = userId;
            company.UpdatedBy = userId;
            company.IsDeleted = false;

            _context.Companies.Add(company);
            await _context.SaveChangesAsync(ct);

            // Initialize default chart of accounts
            await CreateDefaultChartOfAccountsAsync(company.Id, userId, ct);

            _logger.LogInformation("Successfully initialized company {CompanyId}: {CompanyName}", 
                company.Id, company.Name);

            return company;
        }, cancellationToken);
    }

    public async Task<CompanyDashboardStats> GetDashboardStatsAsync(int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting dashboard stats for company {CompanyId}", companyId);

            // Get current fiscal year dates (assuming January-December)
            var currentYear = DateTime.Now.Year;
            var yearStart = new DateTime(currentYear, 1, 1);
            var yearEnd = new DateTime(currentYear, 12, 31);

            var stats = new CompanyDashboardStats();

            // Get revenue and expenses from sales orders and purchase orders
            var salesOrders = await _context.SalesOrders
                .Where(so => so.CompanyId == companyId && 
                           so.OrderDate >= yearStart && so.OrderDate <= yearEnd &&
                           !so.IsDeleted)
                .SumAsync(so => so.TotalAmount, cancellationToken);

            var purchaseOrders = await _context.PurchaseOrders
                .Where(po => po.CompanyId == companyId && 
                           po.OrderDate >= yearStart && po.OrderDate <= yearEnd &&
                           !po.IsDeleted)
                .SumAsync(po => po.TotalAmount, cancellationToken);

            stats.TotalRevenue = salesOrders;
            stats.TotalExpenses = purchaseOrders;
            stats.NetProfit = stats.TotalRevenue - stats.TotalExpenses;

            // Get accounts receivable (unpaid sales orders)
            stats.AccountsReceivable = await _context.SalesOrders
                .Where(so => so.CompanyId == companyId && 
                           so.Status == SalesOrderStatus.Shipped &&
                           !so.IsDeleted)
                .SumAsync(so => so.TotalAmount, cancellationToken);

            // Get accounts payable (unpaid purchase orders)
            stats.AccountsPayable = await _context.PurchaseOrders
                .Where(po => po.CompanyId == companyId && 
                           po.Status == PurchaseOrderStatus.Invoiced &&
                           !po.IsDeleted)
                .SumAsync(po => po.TotalAmount, cancellationToken);

            // Get cash balance from chart of accounts (Cash account type)
            stats.CashBalance = await _context.ChartOfAccounts
                .Where(coa => coa.CompanyId == companyId && 
                            coa.Type == AccountType.Asset &&
                            coa.Name.Contains("Cash") &&
                            !coa.IsDeleted)
                .SumAsync(coa => coa.CurrentBalance, cancellationToken);

            // Get counts
            stats.TotalCustomers = await _context.Customers
                .CountAsync(c => c.CompanyId == companyId && !c.IsDeleted, cancellationToken);

            stats.TotalSuppliers = await _context.Suppliers
                .CountAsync(s => s.CompanyId == companyId && !s.IsDeleted, cancellationToken);

            stats.PendingInvoices = await _context.SalesOrders
                .CountAsync(so => so.CompanyId == companyId && 
                                so.Status == SalesOrderStatus.Draft &&
                                !so.IsDeleted, cancellationToken);

            stats.OverdueInvoices = await _context.SalesOrders
                .CountAsync(so => so.CompanyId == companyId && 
                                so.Status == SalesOrderStatus.Shipped &&
                                so.RequiredDate < DateTime.Today &&
                                !so.IsDeleted, cancellationToken);

            stats.LastUpdated = DateTime.UtcNow;

            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard stats for company {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<bool> HasFeatureAccessAsync(int companyId, string feature, CancellationToken cancellationToken = default)
    {
        try
        {
            var evaluation = await EvaluateFeatureAccessAsync(companyId, feature, cancellationToken);
            return evaluation.HasAccess;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking feature access for company {CompanyId}, feature {Feature}", 
                companyId, feature);
            return false;
        }
    }

    public async Task<FeatureAccessEvaluation> EvaluateFeatureAccessAsync(int companyId, string feature, CancellationToken cancellationToken = default)
    {
        var normalizedFeature = FeatureEntitlements.NormalizeFeature(feature);
        var result = new FeatureAccessEvaluation
        {
            HasAccess = false,
            Feature = normalizedFeature,
            UpgradePath = FeatureEntitlements.UpgradePath
        };

        try
        {
            if (!FeatureEntitlements.IsSupportedFeature(normalizedFeature))
            {
                result.ReasonCode = "unsupported_feature";
                result.Reason = "Feature is not supported.";
                return result;
            }

            var company = await _context.Companies
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, cancellationToken);

            if (company == null)
            {
                result.ReasonCode = "company_not_found";
                result.Reason = "Company not found.";
                return result;
            }

            var normalizedPlan = FeatureEntitlements.NormalizePlan(company.SubscriptionPlan);
            result.CurrentPlan = normalizedPlan ?? company.SubscriptionPlan?.Trim();
            result.ExpiresAt = company.SubscriptionExpiresAt;

            if (!company.IsActive)
            {
                result.ReasonCode = "company_inactive";
                result.Reason = "Company is inactive.";
                return result;
            }

            if (company.SubscriptionExpiresAt.HasValue && company.SubscriptionExpiresAt.Value <= DateTime.UtcNow)
            {
                result.ReasonCode = "subscription_expired";
                result.Reason = "Subscription expired.";
                return result;
            }

            if (normalizedPlan is null)
            {
                result.ReasonCode = string.IsNullOrWhiteSpace(company.SubscriptionPlan)
                    ? "subscription_plan_missing"
                    : "subscription_plan_unknown";
                result.Reason = "Subscription plan is missing or unknown.";
                return result;
            }

            if (!FeatureEntitlements.IsPlanEligibleForFeature(normalizedPlan, normalizedFeature))
            {
                result.ReasonCode = "plan_not_eligible";
                result.Reason = "Current plan does not include this feature.";
                return result;
            }

            result.HasAccess = true;
            result.ReasonCode = null;
            result.Reason = null;
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating feature access for company {CompanyId}, feature {Feature}",
                companyId, normalizedFeature);

            result.ReasonCode = "evaluation_error";
            result.Reason = "Unable to evaluate feature access.";
            return result;
        }
    }

    /// <summary>
    /// Update company subscription
    /// </summary>
    public async Task<Company> UpdateSubscriptionAsync(int companyId, string subscriptionPlan, DateTime? expiresAt, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Updating subscription for company {CompanyId} to {SubscriptionPlan}", 
                companyId, subscriptionPlan);

            var company = await GetByIdAsync(companyId, companyId, cancellationToken);
            if (company == null)
            {
                throw new InvalidOperationException($"Company with ID {companyId} not found");
            }

            company.SubscriptionPlan = subscriptionPlan;
            company.SubscriptionExpiresAt = expiresAt;

            return await UpdateAsync(company, companyId, userId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating subscription for company {CompanyId}", companyId);
            throw;
        }
    }

    /// <summary>
    /// Get company settings
    /// </summary>
    public async Task<CompanySettings> GetCompanySettingsAsync(int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting settings for company {CompanyId}", companyId);

            var company = await GetByIdAsync(companyId, companyId, cancellationToken);
            if (company == null)
            {
                throw new InvalidOperationException($"Company with ID {companyId} not found");
            }

            return new CompanySettings
            {
                CompanyId = company.Id,
                Currency = company.Currency,
                FiscalYearStartMonth = company.FiscalYearStartMonth,
                TimeZone = company.TimeZone,
                SubscriptionPlan = company.SubscriptionPlan,
                SubscriptionExpiresAt = company.SubscriptionExpiresAt,
                IsActive = company.IsActive,
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting settings for company {CompanyId}", companyId);
            throw;
        }
    }

    /// <summary>
    /// Update company settings
    /// </summary>
    public async Task<CompanySettings> UpdateCompanySettingsAsync(int companyId, CompanySettings settings, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Updating settings for company {CompanyId}", companyId);

            var company = await GetByIdAsync(companyId, companyId, cancellationToken);
            if (company == null)
            {
                throw new InvalidOperationException($"Company with ID {companyId} not found");
            }

            // Update settings
            company.Currency = settings.Currency;
            company.FiscalYearStartMonth = settings.FiscalYearStartMonth;
            company.TimeZone = settings.TimeZone;
            company.SubscriptionPlan = settings.SubscriptionPlan;
            company.SubscriptionExpiresAt = settings.SubscriptionExpiresAt;

            var updatedCompany = await UpdateAsync(company, companyId, userId, cancellationToken);

            return new CompanySettings
            {
                CompanyId = updatedCompany.Id,
                Currency = updatedCompany.Currency,
                FiscalYearStartMonth = updatedCompany.FiscalYearStartMonth,
                TimeZone = updatedCompany.TimeZone,
                SubscriptionPlan = updatedCompany.SubscriptionPlan,
                SubscriptionExpiresAt = updatedCompany.SubscriptionExpiresAt,
                IsActive = updatedCompany.IsActive,
                CreatedAt = updatedCompany.CreatedAt,
                UpdatedAt = updatedCompany.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating settings for company {CompanyId}", companyId);
            throw;
        }
    }

    /// <summary>
    /// Get company by criteria
    /// </summary>
    public async Task<IEnumerable<Company>> GetCompaniesByCriteriaAsync(CompanySearchCriteria criteria, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Searching companies with criteria: {Criteria}", criteria);

            var query = _context.Companies.AsNoTracking().Where(c => !c.IsDeleted);

            // Apply filters
            if (!string.IsNullOrWhiteSpace(criteria.Name))
            {
                query = query.Where(c => c.Name.Contains(criteria.Name));
            }

            if (!string.IsNullOrWhiteSpace(criteria.TaxId))
            {
                query = query.Where(c => c.IsraelTaxId.Contains(criteria.TaxId));
            }

            if (!string.IsNullOrWhiteSpace(criteria.City))
            {
                query = query.Where(c => c.City != null && c.City.Contains(criteria.City));
            }

            if (!string.IsNullOrWhiteSpace(criteria.SubscriptionPlan))
            {
                query = query.Where(c => c.SubscriptionPlan == criteria.SubscriptionPlan);
            }

            if (criteria.IsActive.HasValue)
            {
                query = query.Where(c => c.IsActive == criteria.IsActive.Value);
            }

            if (criteria.CreatedAfter.HasValue)
            {
                query = query.Where(c => c.CreatedAt >= criteria.CreatedAfter.Value);
            }

            if (criteria.CreatedBefore.HasValue)
            {
                query = query.Where(c => c.CreatedAt <= criteria.CreatedBefore.Value);
            }

            // Apply ordering
            query = criteria.OrderBy?.ToLower() switch
            {
                "name" => query.OrderBy(c => c.Name),
                "createdat" => query.OrderBy(c => c.CreatedAt),
                "updatedat" => query.OrderBy(c => c.UpdatedAt),
                _ => query.OrderBy(c => c.Id)
            };

            if (criteria.OrderDescending)
            {
                query = criteria.OrderBy?.ToLower() switch
                {
                    "name" => query.OrderByDescending(c => c.Name),
                    "createdat" => query.OrderByDescending(c => c.CreatedAt),
                    "updatedat" => query.OrderByDescending(c => c.UpdatedAt),
                    _ => query.OrderByDescending(c => c.Id)
                };
            }

            // Apply pagination
            if (criteria.PageNumber > 0 && criteria.PageSize > 0)
            {
                query = query.Skip((criteria.PageNumber - 1) * criteria.PageSize).Take(criteria.PageSize);
            }

            return await query.ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching companies with criteria: {Criteria}", criteria);
            throw;
        }
    }

    /// <summary>
    /// Check if subscription is expired
    /// </summary>
    public async Task<bool> IsSubscriptionExpiredAsync(int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            var company = await GetByIdAsync(companyId, companyId, cancellationToken);
            if (company == null)
            {
                return true; // Consider non-existent companies as expired
            }

            return company.SubscriptionExpiresAt.HasValue && company.SubscriptionExpiresAt.Value <= DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking subscription expiry for company {CompanyId}", companyId);
            return true; // Consider error as expired for safety
        }
    }

    /// <summary>
    /// Create default chart of accounts for Israeli businesses
    /// </summary>
    private async Task CreateDefaultChartOfAccountsAsync(int companyId, string userId, CancellationToken cancellationToken)
    {
        var defaultAccounts = new List<ChartOfAccount>
        {
            // Assets (100-199)
            new() { CompanyId = companyId, AccountNumber = "100", Name = "Cash in Bank", Type = AccountType.Asset, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "110", Name = "Accounts Receivable", Type = AccountType.Asset, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "120", Name = "Inventory", Type = AccountType.Asset, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "130", Name = "VAT Receivable", Type = AccountType.Asset, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "150", Name = "Fixed Assets", Type = AccountType.Asset, Balance = 0, CreatedBy = userId, UpdatedBy = userId },

            // Liabilities (200-299)
            new() { CompanyId = companyId, AccountNumber = "200", Name = "Accounts Payable", Type = AccountType.Liability, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "210", Name = "VAT Payable", Type = AccountType.Liability, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "220", Name = "Income Tax Payable", Type = AccountType.Liability, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "230", Name = "National Insurance Payable", Type = AccountType.Liability, Balance = 0, CreatedBy = userId, UpdatedBy = userId },

            // Equity (300-399)
            new() { CompanyId = companyId, AccountNumber = "300", Name = "Owner's Equity", Type = AccountType.Equity, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "310", Name = "Retained Earnings", Type = AccountType.Equity, Balance = 0, CreatedBy = userId, UpdatedBy = userId },

            // Revenue (400-499)
            new() { CompanyId = companyId, AccountNumber = "400", Name = "Sales Revenue", Type = AccountType.Revenue, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "410", Name = "Service Revenue", Type = AccountType.Revenue, Balance = 0, CreatedBy = userId, UpdatedBy = userId },

            // Expenses (500-599)
            new() { CompanyId = companyId, AccountNumber = "500", Name = "Cost of Goods Sold", Type = AccountType.Expense, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "510", Name = "Salaries and Wages", Type = AccountType.Expense, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "520", Name = "Rent Expense", Type = AccountType.Expense, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "525", Name = "Inventory Adjustment", Type = AccountType.Expense, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "530", Name = "Utilities Expense", Type = AccountType.Expense, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "540", Name = "Office Supplies", Type = AccountType.Expense, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "550", Name = "Insurance Expense", Type = AccountType.Expense, Balance = 0, CreatedBy = userId, UpdatedBy = userId },
            new() { CompanyId = companyId, AccountNumber = "560", Name = "Professional Services", Type = AccountType.Expense, Balance = 0, CreatedBy = userId, UpdatedBy = userId }
        };

        foreach (var account in defaultAccounts)
        {
            account.CreatedAt = DateTime.UtcNow;
            account.UpdatedAt = DateTime.UtcNow;
            account.IsDeleted = false;
        }

        _context.ChartOfAccounts.AddRange(defaultAccounts);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created {Count} default accounts for company {CompanyId}", 
            defaultAccounts.Count, companyId);
    }
}
