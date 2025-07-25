using backend.Models.Accounting;
using backend.DTOs.Accounting;
using backend.DTOs.Shared;
using backend.Services.Interfaces;

namespace backend.Services.Interfaces;

/// <summary>
/// Interface for expense management service
/// Handles business expense tracking, approval workflow, and reporting
/// </summary>
public interface IExpenseService : IBaseService<Expense>
{
    /// <summary>
    /// Get paginated expenses with filtering and sorting
    /// </summary>
    Task<PaginatedResponse<ExpenseDto>> GetExpensesAsync(
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
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get expense by ID with full details
    /// </summary>
    Task<ExpenseDto?> GetExpenseByIdAsync(int id, int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create new expense
    /// </summary>
    Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update existing expense
    /// </summary>
    Task<ExpenseDto> UpdateExpenseAsync(int id, UpdateExpenseDto updateDto, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update expense status (approve, reject, pay, etc.)
    /// </summary>
    Task<ExpenseDto> UpdateExpenseStatusAsync(int id, UpdateExpenseStatusDto statusDto, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete expense (soft delete)
    /// </summary>
    Task<bool> DeleteExpenseAsync(int id, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Bulk approve expenses
    /// </summary>
    Task<int> BulkApproveExpensesAsync(BulkApproveExpensesDto bulkDto, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Bulk pay expenses
    /// </summary>
    Task<int> BulkPayExpensesAsync(BulkPayExpensesDto bulkDto, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get expense summary for a date range
    /// </summary>
    Task<ExpenseSummaryDto> GetExpenseSummaryAsync(int companyId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get expenses by category report
    /// </summary>
    Task<List<ExpenseCategoryReportDto>> GetExpensesByCategoryAsync(int companyId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get monthly expense report
    /// </summary>
    Task<List<MonthlyExpenseReportDto>> GetMonthlyExpenseReportAsync(int companyId, int year, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get expenses pending approval
    /// </summary>
    Task<List<ExpenseDto>> GetPendingApprovalExpensesAsync(int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get overdue unpaid expenses
    /// </summary>
    Task<List<ExpenseDto>> GetOverdueExpensesAsync(int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate expense number
    /// </summary>
    Task<string> GenerateExpenseNumberAsync(int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate VAT amount
    /// </summary>
    decimal CalculateVatAmount(decimal amount, decimal vatRate);

    /// <summary>
    /// Get expense category name in Hebrew
    /// </summary>
    string GetCategoryNameHebrew(ExpenseCategory category);

    /// <summary>
    /// Get expense status name in Hebrew
    /// </summary>
    string GetStatusNameHebrew(ExpenseStatus status);
}
