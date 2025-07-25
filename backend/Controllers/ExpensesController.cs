using Microsoft.AspNetCore.Mvc;
using backend.DTOs.Accounting;
using backend.DTOs.Shared;
using backend.Services.Interfaces;
using backend.Models.Accounting;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// API controller for expense management operations
/// Handles business expense tracking, approval workflow, and reporting
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;
    private readonly ILogger<ExpensesController> _logger;

    public ExpensesController(IExpenseService expenseService, ILogger<ExpensesController> logger)
    {
        _expenseService = expenseService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated expenses with filtering and sorting
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<ExpenseDto>>> GetExpenses(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] ExpenseCategory? category = null,
        [FromQuery] ExpenseStatus? status = null,
        [FromQuery] int? supplierId = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Get companyId from authentication context
            var companyId = 1; // Temporary hardcode

            var result = await _expenseService.GetExpensesAsync(
                companyId, fromDate, toDate, category, status, supplierId,
                searchTerm, page, pageSize, sortBy, sortDirection, cancellationToken);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expenses");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get expense by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ExpenseDto>> GetExpenseById(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Get companyId from authentication context
            var companyId = 1; // Temporary hardcode

            var expense = await _expenseService.GetExpenseByIdAsync(id, companyId, cancellationToken);
            
            if (expense == null)
                return NotFound($"Expense {id} not found");

            return Ok(expense);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expense {ExpenseId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Create new expense
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ExpenseDto>> CreateExpense([FromBody] CreateExpenseDto createDto, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // TODO: Get companyId and userId from authentication context
            var companyId = 1; // Temporary hardcode
            var userId = "system"; // Temporary hardcode

            var expense = await _expenseService.CreateExpenseAsync(createDto, companyId, userId, cancellationToken);

            return CreatedAtAction(nameof(GetExpenseById), new { id = expense.Id }, expense);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating expense");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update existing expense
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ExpenseDto>> UpdateExpense(int id, [FromBody] UpdateExpenseDto updateDto, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // TODO: Get companyId and userId from authentication context
            var companyId = 1; // Temporary hardcode
            var userId = "system"; // Temporary hardcode

            var expense = await _expenseService.UpdateExpenseAsync(id, updateDto, companyId, userId, cancellationToken);

            return Ok(expense);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating expense {ExpenseId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update expense status (approve, reject, pay, etc.)
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<ExpenseDto>> UpdateExpenseStatus(int id, [FromBody] UpdateExpenseStatusDto statusDto, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // TODO: Get companyId and userId from authentication context
            var companyId = 1; // Temporary hardcode
            var userId = "system"; // Temporary hardcode

            var expense = await _expenseService.UpdateExpenseStatusAsync(id, statusDto, companyId, userId, cancellationToken);

            return Ok(expense);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating expense status {ExpenseId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Delete expense (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteExpense(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Get companyId and userId from authentication context
            var companyId = 1; // Temporary hardcode
            var userId = "system"; // Temporary hardcode

            var success = await _expenseService.DeleteExpenseAsync(id, companyId, userId, cancellationToken);

            if (!success)
                return NotFound($"Expense {id} not found");

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting expense {ExpenseId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Bulk approve expenses
    /// </summary>
    [HttpPost("bulk-approve")]
    public async Task<ActionResult<BulkOperationResultDto>> BulkApproveExpenses([FromBody] BulkApproveExpensesDto bulkDto, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // TODO: Get companyId and userId from authentication context
            var companyId = 1; // Temporary hardcode
            var userId = "system"; // Temporary hardcode

            var processedCount = await _expenseService.BulkApproveExpensesAsync(bulkDto, companyId, userId, cancellationToken);

            var result = new BulkOperationResultDto
            {
                TotalRequested = bulkDto.ExpenseIds.Count,
                SuccessfullyProcessed = processedCount,
                Message = $"Successfully approved {processedCount} out of {bulkDto.ExpenseIds.Count} expenses"
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk approving expenses");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Bulk pay expenses
    /// </summary>
    [HttpPost("bulk-pay")]
    public async Task<ActionResult<BulkOperationResultDto>> BulkPayExpenses([FromBody] BulkPayExpensesDto bulkDto, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // TODO: Get companyId and userId from authentication context
            var companyId = 1; // Temporary hardcode
            var userId = "system"; // Temporary hardcode

            var processedCount = await _expenseService.BulkPayExpensesAsync(bulkDto, companyId, userId, cancellationToken);

            var result = new BulkOperationResultDto
            {
                TotalRequested = bulkDto.ExpenseIds.Count,
                SuccessfullyProcessed = processedCount,
                Message = $"Successfully paid {processedCount} out of {bulkDto.ExpenseIds.Count} expenses"
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk paying expenses");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get expense summary for a date range
    /// </summary>
    [HttpGet("summary")]
    public async Task<ActionResult<ExpenseSummaryDto>> GetExpenseSummary(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Get companyId from authentication context
            var companyId = 1; // Temporary hardcode

            var summary = await _expenseService.GetExpenseSummaryAsync(companyId, fromDate, toDate, cancellationToken);

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expense summary");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get expenses by category report
    /// </summary>
    [HttpGet("reports/by-category")]
    public async Task<ActionResult<List<ExpenseCategoryReportDto>>> GetExpensesByCategory(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Get companyId from authentication context
            var companyId = 1; // Temporary hardcode

            var report = await _expenseService.GetExpensesByCategoryAsync(companyId, fromDate, toDate, cancellationToken);

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expenses by category report");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get monthly expense report
    /// </summary>
    [HttpGet("reports/monthly")]
    public async Task<ActionResult<List<MonthlyExpenseReportDto>>> GetMonthlyExpenseReport(
        [FromQuery] int year,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Get companyId from authentication context
            var companyId = 1; // Temporary hardcode

            var report = await _expenseService.GetMonthlyExpenseReportAsync(companyId, year, cancellationToken);

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting monthly expense report");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get expenses pending approval
    /// </summary>
    [HttpGet("pending-approval")]
    public async Task<ActionResult<List<ExpenseDto>>> GetPendingApprovalExpenses(CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Get companyId from authentication context
            var companyId = 1; // Temporary hardcode

            var expenses = await _expenseService.GetPendingApprovalExpensesAsync(companyId, cancellationToken);

            return Ok(expenses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending approval expenses");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get overdue unpaid expenses
    /// </summary>
    [HttpGet("overdue")]
    public async Task<ActionResult<List<ExpenseDto>>> GetOverdueExpenses(CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Get companyId from authentication context
            var companyId = 1; // Temporary hardcode

            var expenses = await _expenseService.GetOverdueExpensesAsync(companyId, cancellationToken);

            return Ok(expenses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting overdue expenses");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Generate next expense number
    /// </summary>
    [HttpGet("next-number")]
    public async Task<ActionResult<ExpenseNumberDto>> GetNextExpenseNumber(CancellationToken cancellationToken = default)
    {
        try
        {
            // TODO: Get companyId from authentication context
            var companyId = 1; // Temporary hardcode

            var expenseNumber = await _expenseService.GenerateExpenseNumberAsync(companyId, cancellationToken);

            return Ok(new ExpenseNumberDto { ExpenseNumber = expenseNumber });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating expense number");
            return StatusCode(500, "Internal server error");
        }
    }
}

/// <summary>
/// DTO for bulk operation results
/// </summary>
public class BulkOperationResultDto
{
    public int TotalRequested { get; set; }
    public int SuccessfullyProcessed { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsSuccess => SuccessfullyProcessed > 0;
}

/// <summary>
/// DTO for expense number response
/// </summary>
public class ExpenseNumberDto
{
    public string ExpenseNumber { get; set; } = string.Empty;
}
