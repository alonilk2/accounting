using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;
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

            // Clean the tax ID
            taxId = taxId.Trim().Replace("-", "").Replace(" ", "");

            // Israeli tax ID validation (9 digits with check digit algorithm)
            if (!IsValidIsraeliTaxId(taxId))
            {
                return (false, "Invalid Israeli Tax ID format or check digit");
            }

            // Check for duplicates
            var existingCompany = await _context.Companies
                .AsNoTracking()
                .Where(c => !c.IsDeleted && c.IsraelTaxId == taxId)
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
                           so.Date >= yearStart && so.Date <= yearEnd &&
                           !so.IsDeleted)
                .SumAsync(so => so.TotalAmount, cancellationToken);

            var purchaseOrders = await _context.PurchaseOrders
                .Where(po => po.CompanyId == companyId && 
                           po.Date >= yearStart && po.Date <= yearEnd &&
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
                .SumAsync(coa => coa.Balance, cancellationToken);

            // Get counts
            stats.TotalCustomers = await _context.Customers
                .CountAsync(c => c.CompanyId == companyId && !c.IsDeleted, cancellationToken);

            stats.TotalSuppliers = await _context.Suppliers
                .CountAsync(s => s.CompanyId == companyId && !s.IsDeleted, cancellationToken);

            stats.PendingInvoices = await _context.SalesOrders
                .CountAsync(so => so.CompanyId == companyId && 
                                so.Status == SalesOrderStatus.Quote &&
                                !so.IsDeleted, cancellationToken);

            stats.OverdueInvoices = await _context.SalesOrders
                .CountAsync(so => so.CompanyId == companyId && 
                                so.Status == SalesOrderStatus.Shipped &&
                                so.DueDate < DateTime.Today &&
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
            // For MVP, all features are available to all companies
            // In future, this could check subscription plans, feature flags, etc.
            var company = await GetByIdAsync(companyId, companyId, cancellationToken);
            return company != null && !company.IsDeleted;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking feature access for company {CompanyId}, feature {Feature}", 
                companyId, feature);
            return false;
        }
    }

    /// <summary>
    /// Validate Israeli Tax ID using the official check digit algorithm
    /// </summary>
    private static bool IsValidIsraeliTaxId(string taxId)
    {
        if (string.IsNullOrWhiteSpace(taxId))
            return false;

        // Remove any non-digit characters
        taxId = Regex.Replace(taxId, @"\D", "");

        // Must be exactly 9 digits
        if (taxId.Length != 9)
            return false;

        // Check digit validation using Israeli algorithm
        var digits = taxId.Select(c => int.Parse(c.ToString())).ToArray();
        var sum = 0;

        for (int i = 0; i < 8; i++)
        {
            var digit = digits[i];
            var multiplier = (i % 2) + 1;
            var product = digit * multiplier;
            
            if (product > 9)
                product = (product / 10) + (product % 10);
            
            sum += product;
        }

        var checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit == digits[8];
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
