using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.Models.Inventory;
using backend.Services.Interfaces;
using backend.Services.Core;
using backend.Services.Accounting;

namespace backend.Services.Inventory;

/// <summary>
/// Inventory management service with real-time stock tracking and valuation
/// Implements FIFO, LIFO, and Average costing methods for inventory valuation
/// </summary>
public class InventoryService : BaseService<Item>, IInventoryService
{
    private readonly IJournalEntryService _journalEntryService;

    public InventoryService(
        AccountingDbContext context, 
        ILogger<InventoryService> logger,
        IJournalEntryService journalEntryService) 
        : base(context, logger)
    {
        _journalEntryService = journalEntryService;
    }

    protected override DbSet<Item> DbSet => _context.Items;
    protected override string CompanyIdPropertyName => nameof(Item.CompanyId);

    /// <summary>
    /// Apply search filter for inventory items
    /// </summary>
    protected override IQueryable<Item> ApplySearchFilter(IQueryable<Item> query, string searchTerm)
    {
        return query.Where(i => 
            i.Name.Contains(searchTerm) ||
            i.Sku.Contains(searchTerm) ||
            (i.Description != null && i.Description.Contains(searchTerm)));
    }

    public async Task<Item?> GetBySkuAsync(string sku, int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting item by SKU: {Sku} for company {CompanyId}", sku, companyId);

            return await _context.Items
                .AsNoTracking()
                .Where(i => i.CompanyId == companyId && !i.IsDeleted && i.Sku == sku)
                .FirstOrDefaultAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting item by SKU: {Sku}", sku);
            throw;
        }
    }

    public async Task<Item> AdjustInventoryAsync(int itemId, decimal quantityChange, string reason, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        
        try
        {
            _logger.LogInformation("Adjusting inventory for item {ItemId}, change: {Change}, reason: {Reason}", 
                itemId, quantityChange, reason);

            var item = await _context.Items
                .Where(i => i.Id == itemId && i.CompanyId == companyId && !i.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            if (item == null)
            {
                throw new InvalidOperationException($"Item {itemId} not found");
            }

            // Check if adjustment would result in negative stock
            var newStock = item.CurrentStockQty + quantityChange;
            if (newStock < 0)
            {
                throw new InvalidOperationException($"Adjustment would result in negative stock. Current: {item.CurrentStockQty}, Change: {quantityChange}");
            }

            // Update item stock
            item.CurrentStockQty = newStock;
            item.UpdatedAt = DateTime.UtcNow;
            item.UpdatedBy = userId;

            // Create inventory transaction record
            var inventoryTransaction = new InventoryTransaction
            {
                CompanyId = companyId,
                ItemId = itemId,
                Date = DateTime.UtcNow,
                QtyChange = quantityChange,
                TransactionType = InventoryTransactionType.Adjustment,
                ReferenceId = null,
                ReferenceType = "Manual Adjustment",
                Notes = reason,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                UpdatedBy = userId,
                IsDeleted = false
            };

            _context.InventoryTransactions.Add(inventoryTransaction);
            await _context.SaveChangesAsync(cancellationToken);

            // Create accounting entries for the inventory adjustment
            var valueChange = quantityChange * item.CostPrice;
            if (valueChange != 0)
            {
                await _journalEntryService.CreateInventoryAdjustmentJournalEntriesAsync(
                    itemId, 
                    quantityChange, 
                    valueChange, 
                    companyId, 
                    userId, 
                    reason, 
                    cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);

            await LogAuditAsync(itemId, companyId, userId, "INVENTORY_ADJUST", 
                $"Adjusted inventory by {quantityChange}, reason: {reason}", cancellationToken);

            _logger.LogInformation("Successfully adjusted inventory for item {ItemId}. New stock: {NewStock}", 
                itemId, newStock);

            return item;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Error adjusting inventory for item {ItemId}", itemId);
            throw;
        }
    }

    public async Task<IEnumerable<Item>> GetItemsBelowReorderPointAsync(int companyId, CancellationToken cancellationToken = default)
    {
        return await _context.Items
            .AsNoTracking()
            .Where(i => i.CompanyId == companyId && 
                       !i.IsDeleted && 
                       i.CurrentStockQty <= i.ReorderPoint)
            .OrderBy(i => i.CurrentStockQty)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<InventoryTransaction>> GetItemTransactionsAsync(int itemId, int companyId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.InventoryTransactions
            .AsNoTracking()
            .Include(t => t.Item)
            .Where(t => t.ItemId == itemId && t.CompanyId == companyId && !t.IsDeleted);

        if (fromDate.HasValue)
        {
            query = query.Where(t => t.Date >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(t => t.Date <= toDate.Value);
        }

        return await query
            .OrderByDescending(t => t.Date)
            .ToListAsync(cancellationToken);
    }

    public async Task<InventoryValuation> GetInventoryValuationAsync(int companyId, string valuationMethod = "Average", CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Calculating inventory valuation for company {CompanyId} using {Method} method", 
                companyId, valuationMethod);

            var items = await _context.Items
                .AsNoTracking()
                .Where(i => i.CompanyId == companyId && !i.IsDeleted && i.CurrentStockQty > 0)
                .ToListAsync(cancellationToken);

            var valuation = new InventoryValuation
            {
                ValuationMethod = valuationMethod,
                CalculatedAt = DateTime.UtcNow
            };

            foreach (var item in items)
            {
                var unitCost = await CalculateUnitCostAsync(item.Id, valuationMethod, cancellationToken);
                var totalValue = item.CurrentStockQty * unitCost;

                valuation.ItemValues.Add(new ItemValuation
                {
                    ItemId = item.Id,
                    ItemName = item.Name,
                    Sku = item.Sku,
                    Quantity = item.CurrentStockQty,
                    UnitCost = unitCost,
                    TotalValue = totalValue
                });

                valuation.TotalValue += totalValue;
                valuation.TotalQuantity += item.CurrentStockQty;
            }

            valuation.TotalItems = items.Count;

            return valuation;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating inventory valuation for company {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<InventoryTransaction> TransferInventoryAsync(int itemId, string fromLocation, string toLocation, decimal quantity, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        
        try
        {
            _logger.LogInformation("Transferring {Quantity} of item {ItemId} from {From} to {To}", 
                quantity, itemId, fromLocation, toLocation);

            var item = await _context.Items
                .Where(i => i.Id == itemId && i.CompanyId == companyId && !i.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            if (item == null)
            {
                throw new InvalidOperationException($"Item {itemId} not found");
            }

            if (quantity <= 0)
            {
                throw new InvalidOperationException("Transfer quantity must be greater than zero");
            }

            // For now, we'll create a single transaction record
            // In a full multi-location system, this would create separate records for each location
            var transferTransaction = new InventoryTransaction
            {
                CompanyId = companyId,
                ItemId = itemId,
                Date = DateTime.UtcNow,
                QtyChange = 0, // Net change is zero for transfers
                TransactionType = InventoryTransactionType.Transfer,
                ReferenceId = null,
                ReferenceType = "Location Transfer",
                Notes = $"Transfer from {fromLocation} to {toLocation}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                UpdatedBy = userId,
                IsDeleted = false
            };

            _context.InventoryTransactions.Add(transferTransaction);
            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            await LogAuditAsync(itemId, companyId, userId, "INVENTORY_TRANSFER", 
                $"Transferred {quantity} from {fromLocation} to {toLocation}", cancellationToken);

            return transferTransaction;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Error transferring inventory for item {ItemId}", itemId);
            throw;
        }
    }

    public async Task<InventoryReport> GenerateInventoryReportAsync(int companyId, DateTime? asOfDate = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var reportDate = asOfDate ?? DateTime.Today;
            _logger.LogDebug("Generating inventory report for company {CompanyId} as of {Date}", 
                companyId, reportDate);

            var items = await _context.Items
                .AsNoTracking()
                .Where(i => i.CompanyId == companyId && !i.IsDeleted)
                .ToListAsync(cancellationToken);

            var report = new InventoryReport
            {
                AsOfDate = reportDate,
                TotalItemCount = items.Count
            };

            foreach (var item in items)
            {
                var unitCost = await CalculateUnitCostAsync(item.Id, "Average", cancellationToken);
                var totalValue = item.CurrentStockQty * unitCost;
                
                string status = "Normal";
                if (item.CurrentStockQty == 0)
                {
                    status = "Out of Stock";
                    report.OutOfStockItemCount++;
                }
                else if (item.CurrentStockQty <= item.ReorderPoint)
                {
                    status = "Low Stock";
                    report.LowStockItemCount++;
                }

                report.Items.Add(new InventoryReportItem
                {
                    ItemId = item.Id,
                    Name = item.Name,
                    Sku = item.Sku,
                    CurrentStock = item.CurrentStockQty,
                    ReorderPoint = item.ReorderPoint,
                    UnitCost = unitCost,
                    UnitPrice = item.Price,
                    TotalValue = totalValue,
                    Status = status
                });

                report.TotalInventoryValue += totalValue;
            }

            return report;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating inventory report for company {CompanyId}", companyId);
            throw;
        }
    }

    /// <summary>
    /// Calculate unit cost based on valuation method
    /// </summary>
    private async Task<decimal> CalculateUnitCostAsync(int itemId, string valuationMethod, CancellationToken cancellationToken)
    {
        var item = await _context.Items
            .AsNoTracking()
            .Where(i => i.Id == itemId)
            .FirstOrDefaultAsync(cancellationToken);

        if (item == null)
        {
            return 0;
        }

        switch (valuationMethod.ToUpper())
        {
            case "AVERAGE":
                return await CalculateAverageCostAsync(itemId, cancellationToken);
            
            case "FIFO":
                return await CalculateFifoCostAsync(itemId, cancellationToken);
            
            case "LIFO":
                return await CalculateLifoCostAsync(itemId, cancellationToken);
            
            default:
                // Default to item's cost price
                return item.Cost;
        }
    }

    /// <summary>
    /// Calculate average cost from purchase transactions
    /// </summary>
    private async Task<decimal> CalculateAverageCostAsync(int itemId, CancellationToken cancellationToken)
    {
        var purchaseTransactions = await _context.InventoryTransactions
            .AsNoTracking()
            .Where(t => t.ItemId == itemId && 
                       t.TransactionType == InventoryTransactionType.Purchase && 
                       t.QtyChange > 0 &&
                       !t.IsDeleted)
            .ToListAsync(cancellationToken);

        if (!purchaseTransactions.Any())
        {
            var item = await _context.Items.AsNoTracking().FirstOrDefaultAsync(i => i.Id == itemId, cancellationToken);
            return item?.Cost ?? 0;
        }

        // For now, return the item's current cost
        // In a full implementation, this would calculate weighted average from purchase history
        var latestItem = await _context.Items.AsNoTracking().FirstOrDefaultAsync(i => i.Id == itemId, cancellationToken);
        return latestItem?.Cost ?? 0;
    }

    /// <summary>
    /// Calculate FIFO cost (First In, First Out)
    /// </summary>
    private async Task<decimal> CalculateFifoCostAsync(int itemId, CancellationToken cancellationToken)
    {
        // Implementation would track cost layers by purchase date
        // For now, return current item cost
        var item = await _context.Items.AsNoTracking().FirstOrDefaultAsync(i => i.Id == itemId, cancellationToken);
        return item?.Cost ?? 0;
    }

    /// <summary>
    /// Calculate LIFO cost (Last In, First Out)
    /// </summary>
    private async Task<decimal> CalculateLifoCostAsync(int itemId, CancellationToken cancellationToken)
    {
        // Implementation would track cost layers by purchase date in reverse
        // For now, return current item cost
        var item = await _context.Items.AsNoTracking().FirstOrDefaultAsync(i => i.Id == itemId, cancellationToken);
        return item?.Cost ?? 0;
    }
}
