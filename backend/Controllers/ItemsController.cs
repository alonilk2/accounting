using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Inventory;
using backend.Services.Interfaces;
using backend.DTOs.Core;
using backend.DTOs.Shared;
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
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<ItemsController> _logger;

    public ItemsController(IInventoryService inventoryService, ILogger<ItemsController> logger)
    {
        _inventoryService = inventoryService ?? throw new ArgumentNullException(nameof(inventoryService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all items for the current company with pagination
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="search">Search term</param>
    /// <param name="category">Filter by category</param>
    /// <param name="isActive">Filter by active status</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Items per page</param>
    /// <returns>Paginated list of items</returns>
    [HttpGet]
    [ProducesResponseType<PaginatedResponse<ItemDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PaginatedResponse<ItemDto>>> GetItems(
        [FromQuery] int? companyId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            // In a real app, companyId would come from authenticated user context
            var currentCompanyId = companyId ?? 1; // Default for now
            
            _logger.LogInformation("Retrieving items for company {CompanyId}", currentCompanyId);

            // Use service to get filtered items with pagination
            var paginatedItems = await _inventoryService.GetFilteredAsync(
                currentCompanyId,
                search: search,
                isActive: isActive,
                page: page,
                pageSize: pageSize);

            return Ok(paginatedItems);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving items for company {CompanyId}", companyId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Gets paginated items for DataGrid components
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="search">Search term</param>
    /// <param name="category">Filter by category</param>
    /// <param name="isActive">Filter by active status</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Items per page</param>
    /// <returns>Paginated list of items</returns>
    [HttpGet("paginated")]
    [ProducesResponseType<PaginatedResponse<ItemDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PaginatedResponse<ItemDto>>> GetPaginatedItems(
        [FromQuery] int? companyId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        try
        {
            // In a real app, companyId would come from authenticated user context
            var currentCompanyId = companyId ?? 1;
            
            _logger.LogInformation("Retrieving paginated items for company {CompanyId}, page {Page}, pageSize {PageSize}", 
                currentCompanyId, page, pageSize);

            // Use service to get filtered items with pagination
            var paginatedItems = await _inventoryService.GetFilteredAsync(
                currentCompanyId,
                search: search,
                isActive: isActive,
                page: page,
                pageSize: pageSize);

            return Ok(paginatedItems);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving paginated items for company {CompanyId}", companyId);
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

            var item = await _inventoryService.GetByIdAsync(id, currentCompanyId);

            if (item == null)
            {
                return NotFound($"Item {id} not found");
            }

            var itemDto = new ItemDto
            {
                Id = item.Id,
                CompanyId = item.CompanyId,
                Sku = item.SKU,
                Name = item.Name,
                NameHebrew = item.NameHebrew,
                Description = item.Description,
                Category = item.Category,
                Unit = item.Unit,
                CostPrice = item.CostPrice,
                SellPrice = item.SellPrice,
                CurrentStockQty = item.CurrentStockQty,
                ReorderPoint = item.ReorderPoint,
                MaxStockLevel = item.MaxStockLevel,
                ItemType = item.ItemType,
                IsInventoryTracked = item.IsInventoryTracked,
                IsActive = item.IsActive,
                IsSellable = item.IsSellable,
                IsPurchasable = item.IsPurchasable,
                Weight = item.Weight,
                Volume = item.Volume,
                Barcode = item.Barcode,
                ImageUrl = item.ImageUrl,
                PreferredSupplierId = item.PreferredSupplierId,
                // Backward compatibility
                Cost = item.Cost,
                Price = item.Price,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt
            };

            return Ok(itemDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving item {ItemId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Creates a new item
    /// </summary>
    /// <param name="createDto">Item creation data</param>
    /// <param name="companyId">Company ID</param>
    /// <returns>Created item</returns>
    [HttpPost]
    [ProducesResponseType<ItemDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ItemDto>> CreateItem([FromBody] CreateItemDto createDto, [FromQuery] int? companyId = null)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentCompanyId = companyId ?? 1;
            var userId = "system"; // In real app, get from authentication

            var item = new Item
            {
                CompanyId = currentCompanyId,
                SKU = createDto.Sku,
                Name = createDto.Name,
                NameHebrew = createDto.NameHebrew,
                Description = createDto.Description,
                Category = createDto.Category,
                Unit = createDto.Unit,
                CostPrice = createDto.CostPrice,
                SellPrice = createDto.SellPrice,
                CurrentStockQty = createDto.CurrentStockQty,
                ReorderPoint = createDto.ReorderPoint,
                MaxStockLevel = createDto.MaxStockLevel,
                ItemType = createDto.ItemType,
                IsInventoryTracked = createDto.IsInventoryTracked,
                IsActive = createDto.IsActive,
                IsSellable = createDto.IsSellable,
                IsPurchasable = createDto.IsPurchasable,
                Weight = createDto.Weight,
                Volume = createDto.Volume,
                Barcode = createDto.Barcode,
                ImageUrl = createDto.ImageUrl,
                PreferredSupplierId = createDto.PreferredSupplierId,
                CreatedBy = userId,
                UpdatedBy = userId
            };

            var createdItem = await _inventoryService.CreateAsync(item, currentCompanyId, userId);

            var itemDto = new ItemDto
            {
                Id = createdItem.Id,
                CompanyId = createdItem.CompanyId,
                Sku = createdItem.SKU,
                Name = createdItem.Name,
                NameHebrew = createdItem.NameHebrew,
                Description = createdItem.Description,
                Category = createdItem.Category,
                Unit = createdItem.Unit,
                CostPrice = createdItem.CostPrice,
                SellPrice = createdItem.SellPrice,
                CurrentStockQty = createdItem.CurrentStockQty,
                ReorderPoint = createdItem.ReorderPoint,
                MaxStockLevel = createdItem.MaxStockLevel,
                ItemType = createdItem.ItemType,
                IsInventoryTracked = createdItem.IsInventoryTracked,
                IsActive = createdItem.IsActive,
                IsSellable = createdItem.IsSellable,
                IsPurchasable = createdItem.IsPurchasable,
                Weight = createdItem.Weight,
                Volume = createdItem.Volume,
                Barcode = createdItem.Barcode,
                ImageUrl = createdItem.ImageUrl,
                PreferredSupplierId = createdItem.PreferredSupplierId,
                Cost = createdItem.Cost,
                Price = createdItem.Price,
                CreatedAt = createdItem.CreatedAt,
                UpdatedAt = createdItem.UpdatedAt
            };

            return CreatedAtAction(nameof(GetItem), new { id = createdItem.Id }, itemDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating item");
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Updates an existing item
    /// </summary>
    /// <param name="id">Item ID</param>
    /// <param name="updateDto">Item update data</param>
    /// <param name="companyId">Company ID</param>
    /// <returns>Updated item</returns>
    [HttpPut("{id:int}")]
    [ProducesResponseType<ItemDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ItemDto>> UpdateItem(int id, [FromBody] UpdateItemDto updateDto, [FromQuery] int? companyId = null)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentCompanyId = companyId ?? 1;
            var userId = "system"; // In real app, get from authentication

            var existingItem = await _inventoryService.GetByIdAsync(id, currentCompanyId);
            if (existingItem == null)
            {
                return NotFound($"Item {id} not found");
            }

            // Update fields
            if (!string.IsNullOrEmpty(updateDto.Sku)) existingItem.SKU = updateDto.Sku;
            if (!string.IsNullOrEmpty(updateDto.Name)) existingItem.Name = updateDto.Name;
            if (updateDto.NameHebrew != null) existingItem.NameHebrew = updateDto.NameHebrew;
            if (updateDto.Description != null) existingItem.Description = updateDto.Description;
            if (updateDto.Category != null) existingItem.Category = updateDto.Category;
            if (!string.IsNullOrEmpty(updateDto.Unit)) existingItem.Unit = updateDto.Unit;
            if (updateDto.CostPrice.HasValue) existingItem.CostPrice = updateDto.CostPrice.Value;
            if (updateDto.SellPrice.HasValue) existingItem.SellPrice = updateDto.SellPrice.Value;
            if (updateDto.CurrentStockQty.HasValue) existingItem.CurrentStockQty = updateDto.CurrentStockQty.Value;
            if (updateDto.ReorderPoint.HasValue) existingItem.ReorderPoint = updateDto.ReorderPoint.Value;
            if (updateDto.MaxStockLevel.HasValue) existingItem.MaxStockLevel = updateDto.MaxStockLevel.Value;
            if (!string.IsNullOrEmpty(updateDto.ItemType)) existingItem.ItemType = updateDto.ItemType;
            if (updateDto.IsInventoryTracked.HasValue) existingItem.IsInventoryTracked = updateDto.IsInventoryTracked.Value;
            if (updateDto.IsActive.HasValue) existingItem.IsActive = updateDto.IsActive.Value;
            if (updateDto.IsSellable.HasValue) existingItem.IsSellable = updateDto.IsSellable.Value;
            if (updateDto.IsPurchasable.HasValue) existingItem.IsPurchasable = updateDto.IsPurchasable.Value;
            if (updateDto.Weight.HasValue) existingItem.Weight = updateDto.Weight.Value;
            if (updateDto.Volume.HasValue) existingItem.Volume = updateDto.Volume.Value;
            if (updateDto.Barcode != null) existingItem.Barcode = updateDto.Barcode;
            if (updateDto.ImageUrl != null) existingItem.ImageUrl = updateDto.ImageUrl;
            if (updateDto.PreferredSupplierId.HasValue) existingItem.PreferredSupplierId = updateDto.PreferredSupplierId.Value;

            existingItem.UpdatedBy = userId;

            var updatedItem = await _inventoryService.UpdateAsync(existingItem, currentCompanyId, userId);

            var itemDto = new ItemDto
            {
                Id = updatedItem.Id,
                CompanyId = updatedItem.CompanyId,
                Sku = updatedItem.SKU,
                Name = updatedItem.Name,
                NameHebrew = updatedItem.NameHebrew,
                Description = updatedItem.Description,
                Category = updatedItem.Category,
                Unit = updatedItem.Unit,
                CostPrice = updatedItem.CostPrice,
                SellPrice = updatedItem.SellPrice,
                CurrentStockQty = updatedItem.CurrentStockQty,
                ReorderPoint = updatedItem.ReorderPoint,
                MaxStockLevel = updatedItem.MaxStockLevel,
                ItemType = updatedItem.ItemType,
                IsInventoryTracked = updatedItem.IsInventoryTracked,
                IsActive = updatedItem.IsActive,
                IsSellable = updatedItem.IsSellable,
                IsPurchasable = updatedItem.IsPurchasable,
                Weight = updatedItem.Weight,
                Volume = updatedItem.Volume,
                Barcode = updatedItem.Barcode,
                ImageUrl = updatedItem.ImageUrl,
                PreferredSupplierId = updatedItem.PreferredSupplierId,
                Cost = updatedItem.Cost,
                Price = updatedItem.Price,
                CreatedAt = updatedItem.CreatedAt,
                UpdatedAt = updatedItem.UpdatedAt
            };

            return Ok(itemDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating item {ItemId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Deletes an item (soft delete)
    /// </summary>
    /// <param name="id">Item ID</param>
    /// <param name="companyId">Company ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteItem(int id, [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            var userId = "system"; // In real app, get from authentication

            var success = await _inventoryService.DeleteAsync(id, currentCompanyId, userId);
            if (!success)
            {
                return NotFound($"Item {id} not found");
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting item {ItemId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Adjusts stock quantity for an item
    /// </summary>
    /// <param name="id">Item ID</param>
    /// <param name="adjustmentDto">Stock adjustment data</param>
    /// <param name="companyId">Company ID</param>
    /// <returns>Updated item</returns>
    [HttpPost("{id:int}/adjust-stock")]
    [ProducesResponseType<ItemDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ItemDto>> AdjustStock(int id, [FromBody] StockAdjustmentDto adjustmentDto, [FromQuery] int? companyId = null)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentCompanyId = companyId ?? 1;
            var userId = "system"; // In real app, get from authentication

            var updatedItem = await _inventoryService.AdjustInventoryAsync(
                id, 
                adjustmentDto.QuantityChange, 
                adjustmentDto.Reason,
                currentCompanyId, 
                userId);

            var itemDto = new ItemDto
            {
                Id = updatedItem.Id,
                CompanyId = updatedItem.CompanyId,
                Sku = updatedItem.SKU,
                Name = updatedItem.Name,
                NameHebrew = updatedItem.NameHebrew,
                Description = updatedItem.Description,
                Category = updatedItem.Category,
                Unit = updatedItem.Unit,
                CostPrice = updatedItem.CostPrice,
                SellPrice = updatedItem.SellPrice,
                CurrentStockQty = updatedItem.CurrentStockQty,
                ReorderPoint = updatedItem.ReorderPoint,
                MaxStockLevel = updatedItem.MaxStockLevel,
                ItemType = updatedItem.ItemType,
                IsInventoryTracked = updatedItem.IsInventoryTracked,
                IsActive = updatedItem.IsActive,
                IsSellable = updatedItem.IsSellable,
                IsPurchasable = updatedItem.IsPurchasable,
                Weight = updatedItem.Weight,
                Volume = updatedItem.Volume,
                Barcode = updatedItem.Barcode,
                ImageUrl = updatedItem.ImageUrl,
                PreferredSupplierId = updatedItem.PreferredSupplierId,
                Cost = updatedItem.Cost,
                Price = updatedItem.Price,
                CreatedAt = updatedItem.CreatedAt,
                UpdatedAt = updatedItem.UpdatedAt
            };

            return Ok(itemDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adjusting stock for item {ItemId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Gets items below reorder point
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <returns>Items that need reordering</returns>
    [HttpGet("below-reorder-point")]
    [ProducesResponseType<IEnumerable<ItemDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<ItemDto>>> GetItemsBelowReorderPoint([FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;

            var items = await _inventoryService.GetItemsBelowReorderPointAsync(currentCompanyId);

            var itemDtos = items.Select(i => new ItemDto
            {
                Id = i.Id,
                CompanyId = i.CompanyId,
                Sku = i.SKU,
                Name = i.Name,
                NameHebrew = i.NameHebrew,
                Description = i.Description,
                Category = i.Category,
                Unit = i.Unit,
                CostPrice = i.CostPrice,
                SellPrice = i.SellPrice,
                CurrentStockQty = i.CurrentStockQty,
                ReorderPoint = i.ReorderPoint,
                MaxStockLevel = i.MaxStockLevel,
                ItemType = i.ItemType,
                IsInventoryTracked = i.IsInventoryTracked,
                IsActive = i.IsActive,
                IsSellable = i.IsSellable,
                IsPurchasable = i.IsPurchasable,
                Weight = i.Weight,
                Volume = i.Volume,
                Barcode = i.Barcode,
                ImageUrl = i.ImageUrl,
                PreferredSupplierId = i.PreferredSupplierId,
                Cost = i.Cost,
                Price = i.Price,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            });

            return Ok(itemDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving items below reorder point for company {CompanyId}", companyId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }
}

// DTOs for API
public class ItemDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? NameHebrew { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal CostPrice { get; set; }
    public decimal SellPrice { get; set; }
    public decimal CurrentStockQty { get; set; }
    public decimal ReorderPoint { get; set; }
    public decimal MaxStockLevel { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public bool IsInventoryTracked { get; set; }
    public bool IsActive { get; set; }
    public bool IsSellable { get; set; }
    public bool IsPurchasable { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Volume { get; set; }
    public string? Barcode { get; set; }
    public string? ImageUrl { get; set; }
    public int? PreferredSupplierId { get; set; }
    
    // Backward compatibility
    public decimal Cost { get; set; }
    public decimal Price { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateItemDto
{
    [Required]
    [StringLength(50)]
    public string Sku { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(200)]
    public string? NameHebrew { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [Required]
    [StringLength(20)]
    public string Unit { get; set; } = "piece";

    [Range(0, double.MaxValue)]
    public decimal CostPrice { get; set; } = 0;

    [Range(0, double.MaxValue)]
    public decimal SellPrice { get; set; } = 0;

    [Range(0, double.MaxValue)]
    public decimal CurrentStockQty { get; set; } = 0;

    [Range(0, double.MaxValue)]
    public decimal ReorderPoint { get; set; } = 0;

    [Range(0, double.MaxValue)]
    public decimal MaxStockLevel { get; set; } = 0;

    [StringLength(20)]
    public string ItemType { get; set; } = "Product";

    public bool IsInventoryTracked { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public bool IsSellable { get; set; } = true;
    public bool IsPurchasable { get; set; } = true;

    [Range(0, double.MaxValue)]
    public decimal? Weight { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Volume { get; set; }

    [StringLength(50)]
    public string? Barcode { get; set; }

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    public int? PreferredSupplierId { get; set; }
}

public class UpdateItemDto
{
    [StringLength(50)]
    public string? Sku { get; set; }

    [StringLength(200)]
    public string? Name { get; set; }

    [StringLength(200)]
    public string? NameHebrew { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(20)]
    public string? Unit { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? CostPrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? SellPrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? CurrentStockQty { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? ReorderPoint { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? MaxStockLevel { get; set; }

    [StringLength(20)]
    public string? ItemType { get; set; }

    public bool? IsInventoryTracked { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsSellable { get; set; }
    public bool? IsPurchasable { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Weight { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Volume { get; set; }

    [StringLength(50)]
    public string? Barcode { get; set; }

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    public int? PreferredSupplierId { get; set; }
}

public class StockAdjustmentDto
{
    [Required]
    public decimal QuantityChange { get; set; }

    [Required]
    [StringLength(500)]
    public string Reason { get; set; } = string.Empty;
}
