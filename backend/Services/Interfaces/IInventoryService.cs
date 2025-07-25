using backend.Models.Inventory;
using backend.DTOs.Shared;
using backend.DTOs.Core;

namespace backend.Services.Interfaces;

/// <summary>
/// Inventory management service interface
/// Handles item management, stock tracking, and inventory transactions
/// </summary>
public interface IInventoryService : IBaseService<Item>
{
    /// <summary>
    /// Get filtered items with pagination support
    /// </summary>
    /// <param name="companyId">Company ID for tenant isolation</param>
    /// <param name="search">Search term for name, SKU, or description</param>
    /// <param name="isActive">Filter by active status</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Items per page</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated response with items</returns>
    Task<PaginatedResponse<ItemDto>> GetFilteredAsync(
        int companyId,
        string? search = null,
        bool? isActive = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get item by SKU
    /// </summary>
    /// <param name="sku">Item SKU</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Item or null if not found</returns>
    Task<Item?> GetBySkuAsync(string sku, int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Adjust inventory quantity
    /// </summary>
    /// <param name="itemId">Item ID</param>
    /// <param name="quantityChange">Quantity change (positive for increase, negative for decrease)</param>
    /// <param name="reason">Reason for adjustment</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated item</returns>
    Task<Item> AdjustInventoryAsync(int itemId, decimal quantityChange, string reason, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get items below reorder point
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Items that need reordering</returns>
    Task<IEnumerable<Item>> GetItemsBelowReorderPointAsync(int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get inventory transactions for an item
    /// </summary>
    /// <param name="itemId">Item ID</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="fromDate">Start date filter</param>
    /// <param name="toDate">End date filter</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Inventory transactions</returns>
    Task<IEnumerable<InventoryTransaction>> GetItemTransactionsAsync(int itemId, int companyId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate inventory valuation
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="valuationMethod">Valuation method (FIFO, LIFO, Average)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Inventory valuation summary</returns>
    Task<InventoryValuation> GetInventoryValuationAsync(int companyId, string valuationMethod = "Average", CancellationToken cancellationToken = default);

    /// <summary>
    /// Transfer inventory between locations (future enhancement)
    /// </summary>
    /// <param name="itemId">Item ID</param>
    /// <param name="fromLocation">Source location</param>
    /// <param name="toLocation">Destination location</param>
    /// <param name="quantity">Quantity to transfer</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Transfer transaction</returns>
    Task<InventoryTransaction> TransferInventoryAsync(int itemId, string fromLocation, string toLocation, decimal quantity, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate inventory report
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="asOfDate">Report date</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Inventory report</returns>
    Task<InventoryReport> GenerateInventoryReportAsync(int companyId, DateTime? asOfDate = null, CancellationToken cancellationToken = default);
}

/// <summary>
/// Inventory valuation summary
/// </summary>
public class InventoryValuation
{
    public decimal TotalValue { get; set; }
    public int TotalItems { get; set; }
    public decimal TotalQuantity { get; set; }
    public string ValuationMethod { get; set; } = string.Empty;
    public DateTime CalculatedAt { get; set; }
    public List<ItemValuation> ItemValues { get; set; } = new();
}

/// <summary>
/// Individual item valuation
/// </summary>
public class ItemValuation
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalValue { get; set; }
}

/// <summary>
/// Inventory report
/// </summary>
public class InventoryReport
{
    public DateTime AsOfDate { get; set; }
    public decimal TotalInventoryValue { get; set; }
    public int TotalItemCount { get; set; }
    public int LowStockItemCount { get; set; }
    public int OutOfStockItemCount { get; set; }
    public List<InventoryReportItem> Items { get; set; } = new();
}

/// <summary>
/// Inventory report item details
/// </summary>
public class InventoryReportItem
{
    public int ItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal ReorderPoint { get; set; }
    public decimal UnitCost { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalValue { get; set; }
    public string Status { get; set; } = string.Empty; // "Normal", "Low Stock", "Out of Stock"
}
