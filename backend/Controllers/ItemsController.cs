using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Inventory;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// API controller for inventory item management operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ItemsController : ControllerBase
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<ItemsController> _logger;

    public ItemsController(AccountingDbContext context, ILogger<ItemsController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all items for the current company
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="isActive">Filter by active status (default: true)</param>
    /// <returns>List of items</returns>
    [HttpGet]
    [ProducesResponseType<IEnumerable<ItemDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<ItemDto>>> GetItems(
        [FromQuery] int? companyId = null,
        [FromQuery] bool? isActive = true)
    {
        try
        {
            // In a real app, companyId would come from authenticated user context
            var currentCompanyId = companyId ?? 1; // Default for now
            
            _logger.LogInformation("Retrieving items for company {CompanyId}", currentCompanyId);

            var query = _context.Items
                .Where(i => i.CompanyId == currentCompanyId && !i.IsDeleted);

            if (isActive.HasValue)
            {
                query = query.Where(i => i.IsActive == isActive.Value);
            }

            var items = await query
                .OrderBy(i => i.Name)
                .Select(i => new ItemDto
                {
                    Id = i.Id,
                    CompanyId = i.CompanyId,
                    Sku = i.Sku,
                    Name = i.Name,
                    Unit = i.Unit,
                    Cost = i.Cost,
                    Price = i.Price,
                    CurrentStockQty = i.CurrentStockQty,
                    ReorderPoint = i.ReorderPoint,
                    Description = i.Description,
                    IsActive = i.IsActive,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return Ok(items);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving items for company {CompanyId}", companyId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Gets a specific item by ID
    /// </summary>
    /// <param name="id">Item ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Item details</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType<ItemDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ItemDto>> GetItem(int id, [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            
            _logger.LogInformation("Retrieving item {ItemId} for company {CompanyId}", id, currentCompanyId);

            var item = await _context.Items
                .Where(i => i.Id == id && i.CompanyId == currentCompanyId && !i.IsDeleted)
                .Select(i => new ItemDto
                {
                    Id = i.Id,
                    CompanyId = i.CompanyId,
                    Sku = i.Sku,
                    Name = i.Name,
                    Unit = i.Unit,
                    Cost = i.Cost,
                    Price = i.Price,
                    CurrentStockQty = i.CurrentStockQty,
                    ReorderPoint = i.ReorderPoint,
                    Description = i.Description,
                    IsActive = i.IsActive,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (item == null)
            {
                return NotFound($"Item {id} not found");
            }

            return Ok(item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving item {ItemId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }
}

// DTO for API responses
public class ItemDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public decimal Price { get; set; }
    public decimal CurrentStockQty { get; set; }
    public decimal ReorderPoint { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
