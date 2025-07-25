using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.Models.Accounting;
using backend.DTOs.Accounting;
using backend.DTOs.Shared;
using backend.Services.Interfaces;
using backend.Services.Core;

namespace backend.Services.Accounting;

/// <summary>
/// Expense management service with multi-tenant support and Israeli tax compliance
/// Handles expense tracking, approval workflow, and comprehensive reporting
/// </summary>
public class ExpenseService : BaseService<Expense>, IExpenseService
{
    private readonly new ILogger<ExpenseService> _logger;

    public ExpenseService(AccountingDbContext context, ILogger<ExpenseService> logger)
        : base(context, logger)
    {
        _logger = logger;
    }

    protected override DbSet<Expense> DbSet => _context.Expenses;
    protected override string CompanyIdPropertyName => nameof(Expense.CompanyId);

    public async Task<PaginatedResponse<ExpenseDto>> GetExpensesAsync(
        int companyId,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        ExpenseCategory? category = null,
        ExpenseStatus? status = null,
        int? supplierId = null,
        string? searchTerm = null,
        int page = 1,
        int pageSize = 20,
        string? sortBy = null,
        string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Expenses
            .AsNoTracking()
            .Include(e => e.Supplier)
            .Include(e => e.Account)
            .Where(e => e.CompanyId == companyId && !e.IsDeleted);

        // Apply filters
        if (fromDate.HasValue)
            query = query.Where(e => e.ExpenseDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(e => e.ExpenseDate <= toDate.Value);

        if (category.HasValue)
            query = query.Where(e => e.Category == category.Value);

        if (status.HasValue)
            query = query.Where(e => e.Status == status.Value);

        if (supplierId.HasValue)
            query = query.Where(e => e.SupplierId == supplierId.Value);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(e =>
                e.Description.ToLower().Contains(term) ||
                e.DescriptionHebrew!.ToLower().Contains(term) ||
                e.ExpenseNumber.ToLower().Contains(term) ||
                e.ReceiptNumber!.ToLower().Contains(term) ||
                e.SupplierName!.ToLower().Contains(term) ||
                e.Notes!.ToLower().Contains(term));
        }

        // Apply sorting
        query = ApplySorting(query, sortBy, sortDirection);

        var totalCount = await query.CountAsync(cancellationToken);
        var expenses = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var expenseDtos = expenses.Select(MapToDto).ToList();

        return new PaginatedResponse<ExpenseDto>
        {
            Data = expenseDtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };
    }

    public async Task<ExpenseDto?> GetExpenseByIdAsync(int id, int companyId, CancellationToken cancellationToken = default)
    {
        var expense = await _context.Expenses
            .AsNoTracking()
            .Include(e => e.Supplier)
            .Include(e => e.Account)
            .FirstOrDefaultAsync(e => e.Id == id && e.CompanyId == companyId && !e.IsDeleted, cancellationToken);

        return expense != null ? MapToDto(expense) : null;
    }

    public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        var expense = new Expense
        {
            CompanyId = companyId,
            ExpenseNumber = await GenerateExpenseNumberAsync(companyId, cancellationToken),
            ExpenseDate = createDto.ExpenseDate,
            SupplierId = createDto.SupplierId,
            SupplierName = createDto.SupplierName,
            Category = createDto.Category,
            Description = createDto.Description,
            DescriptionHebrew = createDto.DescriptionHebrew,
            Amount = createDto.Amount,
            VatRate = createDto.VatRate,
            VatAmount = CalculateVatAmount(createDto.Amount, createDto.VatRate),
            Currency = createDto.Currency,
            PaymentMethod = createDto.PaymentMethod,
            ReceiptNumber = createDto.ReceiptNumber,
            PurchaseOrderId = createDto.PurchaseOrderId,
            AccountId = createDto.AccountId,
            Status = createDto.Status,
            Notes = createDto.Notes,
            Tags = createDto.Tags,
            IsTaxDeductible = createDto.IsTaxDeductible,
            IsRecurring = createDto.IsRecurring,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        expense.TotalAmount = expense.Amount + expense.VatAmount;

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created expense {ExpenseNumber} for company {CompanyId}", expense.ExpenseNumber, companyId);

        return await GetExpenseByIdAsync(expense.Id, companyId, cancellationToken) 
            ?? throw new InvalidOperationException("Failed to retrieve created expense");
    }

    public async Task<ExpenseDto> UpdateExpenseAsync(int id, UpdateExpenseDto updateDto, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        var expense = await _context.Expenses
            .FirstOrDefaultAsync(e => e.Id == id && e.CompanyId == companyId && !e.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException($"Expense {id} not found");

        // Only allow updates if expense is in Draft or Pending status
        if (expense.Status != ExpenseStatus.Draft && expense.Status != ExpenseStatus.Pending)
            throw new InvalidOperationException("Cannot update expense that is not in Draft or Pending status");

        expense.ExpenseDate = updateDto.ExpenseDate;
        expense.SupplierId = updateDto.SupplierId;
        expense.SupplierName = updateDto.SupplierName;
        expense.Category = updateDto.Category;
        expense.Description = updateDto.Description;
        expense.DescriptionHebrew = updateDto.DescriptionHebrew;
        expense.Amount = updateDto.Amount;
        expense.VatRate = updateDto.VatRate;
        expense.VatAmount = CalculateVatAmount(updateDto.Amount, updateDto.VatRate);
        expense.TotalAmount = expense.Amount + expense.VatAmount;
        expense.Currency = updateDto.Currency;
        expense.PaymentMethod = updateDto.PaymentMethod;
        expense.ReceiptNumber = updateDto.ReceiptNumber;
        expense.PurchaseOrderId = updateDto.PurchaseOrderId;
        expense.AccountId = updateDto.AccountId;
        expense.Notes = updateDto.Notes;
        expense.Tags = updateDto.Tags;
        expense.IsTaxDeductible = updateDto.IsTaxDeductible;
        expense.IsRecurring = updateDto.IsRecurring;
        expense.UpdatedBy = userId;
        expense.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated expense {ExpenseNumber} for company {CompanyId}", expense.ExpenseNumber, companyId);

        return await GetExpenseByIdAsync(expense.Id, companyId, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve updated expense");
    }

    public async Task<ExpenseDto> UpdateExpenseStatusAsync(int id, UpdateExpenseStatusDto statusDto, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        var expense = await _context.Expenses
            .FirstOrDefaultAsync(e => e.Id == id && e.CompanyId == companyId && !e.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException($"Expense {id} not found");

        var oldStatus = expense.Status;
        expense.Status = statusDto.Status;
        expense.UpdatedBy = userId;
        expense.UpdatedAt = DateTime.UtcNow;

        // Handle status-specific updates
        switch (statusDto.Status)
        {
            case ExpenseStatus.Approved:
                expense.ApprovedDate = DateTime.UtcNow;
                expense.ApprovedBy = userId;
                break;

            case ExpenseStatus.Paid:
                expense.PaidDate = statusDto.PaidDate ?? DateTime.UtcNow;
                expense.PaymentReference = statusDto.PaymentReference;
                if (oldStatus != ExpenseStatus.Approved)
                {
                    expense.ApprovedDate = DateTime.UtcNow;
                    expense.ApprovedBy = userId;
                }
                break;

            case ExpenseStatus.Rejected:
            case ExpenseStatus.Cancelled:
                expense.ApprovedDate = null;
                expense.ApprovedBy = null;
                expense.PaidDate = null;
                expense.PaymentReference = null;
                break;
        }

        if (!string.IsNullOrWhiteSpace(statusDto.Notes))
        {
            expense.Notes = string.IsNullOrWhiteSpace(expense.Notes) 
                ? statusDto.Notes 
                : $"{expense.Notes}\n{DateTime.UtcNow:yyyy-MM-dd HH:mm}: {statusDto.Notes}";
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated expense {ExpenseNumber} status from {OldStatus} to {NewStatus} for company {CompanyId}", 
            expense.ExpenseNumber, oldStatus, statusDto.Status, companyId);

        return await GetExpenseByIdAsync(expense.Id, companyId, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve updated expense");
    }

    public async Task<bool> DeleteExpenseAsync(int id, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        var expense = await _context.Expenses
            .FirstOrDefaultAsync(e => e.Id == id && e.CompanyId == companyId && !e.IsDeleted, cancellationToken);

        if (expense == null)
            return false;

        // Only allow deletion if expense is in Draft status
        if (expense.Status != ExpenseStatus.Draft)
            throw new InvalidOperationException("Cannot delete expense that is not in Draft status");

        expense.IsDeleted = true;
        expense.UpdatedBy = userId;
        expense.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted expense {ExpenseNumber} for company {CompanyId}", expense.ExpenseNumber, companyId);

        return true;
    }

    public async Task<int> BulkApproveExpensesAsync(BulkApproveExpensesDto bulkDto, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        var expenses = await _context.Expenses
            .Where(e => bulkDto.ExpenseIds.Contains(e.Id) && e.CompanyId == companyId && !e.IsDeleted)
            .Where(e => e.Status == ExpenseStatus.Pending || e.Status == ExpenseStatus.Draft)
            .ToListAsync(cancellationToken);

        foreach (var expense in expenses)
        {
            expense.Status = ExpenseStatus.Approved;
            expense.ApprovedDate = DateTime.UtcNow;
            expense.ApprovedBy = userId;
            expense.UpdatedBy = userId;
            expense.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(bulkDto.Notes))
            {
                expense.Notes = string.IsNullOrWhiteSpace(expense.Notes)
                    ? bulkDto.Notes
                    : $"{expense.Notes}\n{DateTime.UtcNow:yyyy-MM-dd HH:mm}: {bulkDto.Notes}";
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Bulk approved {Count} expenses for company {CompanyId}", expenses.Count, companyId);

        return expenses.Count;
    }

    public async Task<int> BulkPayExpensesAsync(BulkPayExpensesDto bulkDto, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        var expenses = await _context.Expenses
            .Where(e => bulkDto.ExpenseIds.Contains(e.Id) && e.CompanyId == companyId && !e.IsDeleted)
            .Where(e => e.Status == ExpenseStatus.Approved || e.Status == ExpenseStatus.Pending || e.Status == ExpenseStatus.Draft)
            .ToListAsync(cancellationToken);

        foreach (var expense in expenses)
        {
            expense.Status = ExpenseStatus.Paid;
            expense.PaidDate = bulkDto.PaymentDate;
            expense.PaymentReference = bulkDto.PaymentReference;
            
            if (expense.Status != ExpenseStatus.Approved)
            {
                expense.ApprovedDate = DateTime.UtcNow;
                expense.ApprovedBy = userId;
            }

            expense.UpdatedBy = userId;
            expense.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(bulkDto.Notes))
            {
                expense.Notes = string.IsNullOrWhiteSpace(expense.Notes)
                    ? bulkDto.Notes
                    : $"{expense.Notes}\n{DateTime.UtcNow:yyyy-MM-dd HH:mm}: {bulkDto.Notes}";
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Bulk paid {Count} expenses for company {CompanyId}", expenses.Count, companyId);

        return expenses.Count;
    }

    public async Task<ExpenseSummaryDto> GetExpenseSummaryAsync(int companyId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default)
    {
        var expenses = await _context.Expenses
            .AsNoTracking()
            .Where(e => e.CompanyId == companyId && !e.IsDeleted)
            .Where(e => e.ExpenseDate >= fromDate && e.ExpenseDate <= toDate)
            .Where(e => e.Status != ExpenseStatus.Cancelled && e.Status != ExpenseStatus.Rejected)
            .ToListAsync(cancellationToken);

        var summary = new ExpenseSummaryDto
        {
            FromDate = fromDate,
            ToDate = toDate,
            TotalAmount = expenses.Sum(e => e.TotalAmount),
            TotalVat = expenses.Sum(e => e.VatAmount),
            TotalExpenses = expenses.Count
        };

        // Get top categories
        summary.TopCategories = expenses
            .GroupBy(e => e.Category)
            .Select(g => new ExpenseCategoryReportDto
            {
                Category = g.Key,
                CategoryName = g.Key.ToString(),
                CategoryNameHebrew = GetCategoryNameHebrew(g.Key),
                TotalAmount = g.Sum(e => e.TotalAmount),
                VatAmount = g.Sum(e => e.VatAmount),
                ExpenseCount = g.Count(),
                AverageAmount = g.Average(e => e.TotalAmount)
            })
            .OrderByDescending(c => c.TotalAmount)
            .Take(10)
            .ToList();

        // Get monthly breakdown
        summary.MonthlyBreakdown = expenses
            .GroupBy(e => new { e.ExpenseDate.Year, e.ExpenseDate.Month })
            .Select(g => new MonthlyExpenseReportDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM yyyy"),
                TotalAmount = g.Sum(e => e.TotalAmount),
                VatAmount = g.Sum(e => e.VatAmount),
                ExpenseCount = g.Count(),
                Categories = g.GroupBy(e => e.Category)
                    .Select(c => new ExpenseCategoryReportDto
                    {
                        Category = c.Key,
                        CategoryName = c.Key.ToString(),
                        CategoryNameHebrew = GetCategoryNameHebrew(c.Key),
                        TotalAmount = c.Sum(e => e.TotalAmount),
                        VatAmount = c.Sum(e => e.VatAmount),
                        ExpenseCount = c.Count(),
                        AverageAmount = c.Average(e => e.TotalAmount)
                    })
                    .OrderByDescending(c => c.TotalAmount)
                    .ToList()
            })
            .OrderBy(m => m.Year)
            .ThenBy(m => m.Month)
            .ToList();

        return summary;
    }

    public async Task<List<ExpenseCategoryReportDto>> GetExpensesByCategoryAsync(int companyId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default)
    {
        return await _context.Expenses
            .AsNoTracking()
            .Where(e => e.CompanyId == companyId && !e.IsDeleted)
            .Where(e => e.ExpenseDate >= fromDate && e.ExpenseDate <= toDate)
            .Where(e => e.Status != ExpenseStatus.Cancelled && e.Status != ExpenseStatus.Rejected)
            .GroupBy(e => e.Category)
            .Select(g => new ExpenseCategoryReportDto
            {
                Category = g.Key,
                CategoryName = g.Key.ToString(),
                CategoryNameHebrew = GetCategoryNameHebrew(g.Key),
                TotalAmount = g.Sum(e => e.TotalAmount),
                VatAmount = g.Sum(e => e.VatAmount),
                ExpenseCount = g.Count(),
                AverageAmount = g.Average(e => e.TotalAmount)
            })
            .OrderByDescending(c => c.TotalAmount)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MonthlyExpenseReportDto>> GetMonthlyExpenseReportAsync(int companyId, int year, CancellationToken cancellationToken = default)
    {
        var fromDate = new DateTime(year, 1, 1);
        var toDate = new DateTime(year, 12, 31);

        return await _context.Expenses
            .AsNoTracking()
            .Where(e => e.CompanyId == companyId && !e.IsDeleted)
            .Where(e => e.ExpenseDate >= fromDate && e.ExpenseDate <= toDate)
            .Where(e => e.Status != ExpenseStatus.Cancelled && e.Status != ExpenseStatus.Rejected)
            .GroupBy(e => e.ExpenseDate.Month)
            .Select(g => new MonthlyExpenseReportDto
            {
                Year = year,
                Month = g.Key,
                MonthName = new DateTime(year, g.Key, 1).ToString("MMMM"),
                TotalAmount = g.Sum(e => e.TotalAmount),
                VatAmount = g.Sum(e => e.VatAmount),
                ExpenseCount = g.Count()
            })
            .OrderBy(m => m.Month)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ExpenseDto>> GetPendingApprovalExpensesAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var expenses = await _context.Expenses
            .AsNoTracking()
            .Include(e => e.Supplier)
            .Include(e => e.Account)
            .Where(e => e.CompanyId == companyId && !e.IsDeleted)
            .Where(e => e.Status == ExpenseStatus.Pending)
            .OrderBy(e => e.ExpenseDate)
            .ToListAsync(cancellationToken);

        return expenses.Select(MapToDto).ToList();
    }

    public async Task<List<ExpenseDto>> GetOverdueExpensesAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-30); // Consider expenses older than 30 days as overdue

        var expenses = await _context.Expenses
            .AsNoTracking()
            .Include(e => e.Supplier)
            .Include(e => e.Account)
            .Where(e => e.CompanyId == companyId && !e.IsDeleted)
            .Where(e => e.Status == ExpenseStatus.Approved && e.ExpenseDate < cutoffDate)
            .OrderBy(e => e.ExpenseDate)
            .ToListAsync(cancellationToken);

        return expenses.Select(MapToDto).ToList();
    }

    public async Task<string> GenerateExpenseNumberAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"EXP-{year}-";
        
        var lastExpense = await _context.Expenses
            .Where(e => e.CompanyId == companyId && e.ExpenseNumber.StartsWith(prefix))
            .OrderByDescending(e => e.ExpenseNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (lastExpense != null)
        {
            var numberPart = lastExpense.ExpenseNumber.Substring(prefix.Length);
            if (int.TryParse(numberPart, out int lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D4}";
    }

    public decimal CalculateVatAmount(decimal amount, decimal vatRate)
    {
        return Math.Round(amount * (vatRate / 100), 2);
    }

    public string GetCategoryNameHebrew(ExpenseCategory category)
    {
        return category switch
        {
            ExpenseCategory.Salary => "1306 - שכר עבודה",
            ExpenseCategory.SalaryAddons => "1307 - הוצאות שכר בגין אופציות לעובדים",
            ExpenseCategory.EmployeesOptions => "1308 - עבודות חוץ וקבלני משנה",
            ExpenseCategory.ThirdPartyJobs => "1310 - דמי מדים וביגוד",
            ExpenseCategory.LocalPurchases => "1320 - קניות סחורה בארץ",
            ExpenseCategory.RawMaterialsPurchases => "1330 - קניות חומרי גלם וחומרי בנייה בארץ ובחו''ל",
            ExpenseCategory.ForeignSupply => "1340 - קניות סחורה מחו''ל",
            ExpenseCategory.CurrencyRatesPurchases => "1350 - הוצאות מטבע חוץ",
            ExpenseCategory.WarrantsExpenses => "1360 - הוצאות לאחריות ותביעות",
            ExpenseCategory.RelatedLocalExpenses => "1371 - קניות מצדדים קשורים בארץ",
            ExpenseCategory.RelatedForeignExpenses => "1372 - קניות מצדדים קשורים בחו''ל",
            ExpenseCategory.OtherExpenses => "1390 - הוצאות פיננסיות אחרות",
            ExpenseCategory.InventoryStart => "1400 - מלאי בתחילת התקופה",
            ExpenseCategory.InventoryEnd => "1450 - מלאי בסוף התקופה",
            _ => category.ToString()
        };
    }

    public string GetStatusNameHebrew(ExpenseStatus status)
    {
        return status switch
        {
            ExpenseStatus.Draft => "טיוטה",
            ExpenseStatus.Pending => "ממתין לאישור",
            ExpenseStatus.Approved => "מאושר",
            ExpenseStatus.Paid => "שולם",
            ExpenseStatus.Rejected => "נדחה",
            ExpenseStatus.Cancelled => "בוטל",
            _ => status.ToString()
        };
    }

    private ExpenseDto MapToDto(Expense expense)
    {
        return new ExpenseDto
        {
            Id = expense.Id,
            CompanyId = expense.CompanyId,
            ExpenseNumber = expense.ExpenseNumber,
            ExpenseDate = expense.ExpenseDate,
            SupplierId = expense.SupplierId,
            SupplierName = expense.SupplierName ?? expense.Supplier?.Name,
            Category = expense.Category,
            CategoryName = GetCategoryNameHebrew(expense.Category),
            Description = expense.Description,
            DescriptionHebrew = expense.DescriptionHebrew,
            Amount = expense.Amount,
            VatRate = expense.VatRate,
            VatAmount = expense.VatAmount,
            TotalAmount = expense.TotalAmount,
            Currency = expense.Currency,
            PaymentMethod = expense.PaymentMethod,
            ReceiptNumber = expense.ReceiptNumber,
            PurchaseOrderId = expense.PurchaseOrderId,
            AccountId = expense.AccountId,
            AccountName = expense.Account?.Name,
            Status = expense.Status,
            StatusName = GetStatusNameHebrew(expense.Status),
            ApprovedDate = expense.ApprovedDate,
            ApprovedBy = expense.ApprovedBy,
            PaidDate = expense.PaidDate,
            PaymentReference = expense.PaymentReference,
            Notes = expense.Notes,
            AttachmentPath = expense.AttachmentPath,
            Tags = expense.Tags,
            IsTaxDeductible = expense.IsTaxDeductible,
            IsRecurring = expense.IsRecurring,
            CreatedBy = expense.CreatedBy,
            UpdatedBy = expense.UpdatedBy,
            CreatedAt = expense.CreatedAt,
            UpdatedAt = expense.UpdatedAt
        };
    }

    private IQueryable<Expense> ApplySorting(IQueryable<Expense> query, string? sortBy, string? sortDirection)
    {
        var isDescending = sortDirection?.ToLower() == "desc";

        return sortBy?.ToLower() switch
        {
            "expensedate" => isDescending ? query.OrderByDescending(e => e.ExpenseDate) : query.OrderBy(e => e.ExpenseDate),
            "amount" => isDescending ? query.OrderByDescending(e => e.TotalAmount) : query.OrderBy(e => e.TotalAmount),
            "supplier" => isDescending ? query.OrderByDescending(e => e.SupplierName) : query.OrderBy(e => e.SupplierName),
            "category" => isDescending ? query.OrderByDescending(e => e.Category) : query.OrderBy(e => e.Category),
            "status" => isDescending ? query.OrderByDescending(e => e.Status) : query.OrderBy(e => e.Status),
            "expenseno" or "expensenumber" => isDescending ? query.OrderByDescending(e => e.ExpenseNumber) : query.OrderBy(e => e.ExpenseNumber),
            _ => query.OrderByDescending(e => e.ExpenseDate) // Default sort by expense date descending
        };
    }
}
