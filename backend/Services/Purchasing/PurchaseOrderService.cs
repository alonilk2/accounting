using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.Models.Purchasing;
using backend.Models.Inventory;
using backend.Services.Interfaces;
using backend.Services.Core;
using backend.Services.Accounting;

namespace backend.Services.Purchasing;

/// <summary>
/// Purchase order management service with inventory integration and supplier management
/// Handles the complete procurement lifecycle from order creation to payment processing
/// </summary>
public class PurchaseOrderService : BaseService<PurchaseOrder>, IPurchaseOrderService
{
    private readonly IJournalEntryService _journalEntryService;

    public PurchaseOrderService(
        AccountingDbContext context, 
        ILogger<PurchaseOrderService> logger,
        IJournalEntryService journalEntryService) 
        : base(context, logger)
    {
        _journalEntryService = journalEntryService;
    }

    protected override DbSet<PurchaseOrder> DbSet => _context.PurchaseOrders;
    protected override string CompanyIdPropertyName => nameof(PurchaseOrder.CompanyId);

    /// <summary>
    /// Apply search filter for purchase orders
    /// </summary>
    protected override IQueryable<PurchaseOrder> ApplySearchFilter(IQueryable<PurchaseOrder> query, string searchTerm)
    {
        return query.Where(po => 
            po.OrderNumber.Contains(searchTerm) ||
            po.Supplier.Name.Contains(searchTerm) ||
            po.Status.ToString().Contains(searchTerm));
    }

    public async Task<PurchaseOrder> CreatePurchaseOrderAsync(PurchaseOrder purchaseOrder, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        return await TransactionHelper.ExecuteInTransactionAsync(_context, async (transaction, ct) =>
        {
            _logger.LogInformation("Creating purchase order for supplier {SupplierId} in company {CompanyId}", 
                purchaseOrder.SupplierId, companyId);

            // Validate supplier exists
            var supplier = await _context.Suppliers
                .Where(s => s.Id == purchaseOrder.SupplierId && s.CompanyId == companyId && !s.IsDeleted)
                .FirstOrDefaultAsync(ct);

            if (supplier == null)
            {
                throw new InvalidOperationException($"Supplier {purchaseOrder.SupplierId} not found");
            }

            // Generate order number if not provided
            if (string.IsNullOrEmpty(purchaseOrder.OrderNumber))
            {
                purchaseOrder.OrderNumber = await GenerateOrderNumberAsync(companyId, ct);
            }

            // Validate and process line items
            await ValidateAndProcessLineItemsAsync(purchaseOrder.Lines, companyId, ct);

            // Calculate totals
            purchaseOrder = CalculateTotals(purchaseOrder);

            // Set company ID and audit fields
            purchaseOrder.CompanyId = companyId;
            purchaseOrder.CreatedAt = DateTime.UtcNow;
            purchaseOrder.UpdatedAt = DateTime.UtcNow;
            purchaseOrder.CreatedBy = userId;
            purchaseOrder.UpdatedBy = userId;
            purchaseOrder.IsDeleted = false;

            // Set default status if not provided
            if (purchaseOrder.Status == PurchaseOrderStatus.Draft)
            {
                purchaseOrder.Status = PurchaseOrderStatus.Confirmed;
            }

            // Set order date if not provided
            if (purchaseOrder.OrderDate == default)
            {
                purchaseOrder.OrderDate = DateTime.UtcNow;
            }

            // Add to context
            _context.PurchaseOrders.Add(purchaseOrder);
            await _context.SaveChangesAsync(ct);

            // Create accounting entries
            await CreateAccountingEntriesAsync(purchaseOrder, userId, ct);

            // Log audit trail
            await LogAuditAsync(purchaseOrder.Id, companyId, userId, "CREATE", 
                $"Created purchase order {purchaseOrder.OrderNumber} for supplier {supplier.Name}", ct);

            _logger.LogInformation("Successfully created purchase order {OrderId} with number {OrderNumber}", 
                purchaseOrder.Id, purchaseOrder.OrderNumber);

            return purchaseOrder;
        }, cancellationToken);
    }

    public async Task<PurchaseOrder> UpdateStatusAsync(int purchaseOrderId, PurchaseOrderStatus status, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var purchaseOrder = await _context.PurchaseOrders
                .Include(po => po.Lines)
                .Where(po => po.Id == purchaseOrderId && po.CompanyId == companyId && !po.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            if (purchaseOrder == null)
            {
                throw new InvalidOperationException($"Purchase order {purchaseOrderId} not found");
            }

            var oldStatus = purchaseOrder.Status;
            purchaseOrder.Status = status;
            purchaseOrder.UpdatedAt = DateTime.UtcNow;
            purchaseOrder.UpdatedBy = userId;

            await _context.SaveChangesAsync(cancellationToken);

            await LogAuditAsync(purchaseOrderId, companyId, userId, "UPDATE", 
                $"Changed status from {oldStatus} to {status}", cancellationToken);

            _logger.LogInformation("Updated purchase order {OrderId} status from {OldStatus} to {NewStatus}", 
                purchaseOrderId, oldStatus, status);

            return purchaseOrder;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating purchase order {OrderId} status", purchaseOrderId);
            throw;
        }
    }

    public async Task<PurchaseOrder> ReceiveGoodsAsync(int purchaseOrderId, List<ReceivedItem> receivedItems, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        return await TransactionHelper.ExecuteInTransactionAsync(_context, async (transaction, ct) =>
        {
            _logger.LogInformation("Receiving goods for purchase order {OrderId}", purchaseOrderId);

            var purchaseOrder = await _context.PurchaseOrders
                .Include(po => po.Lines)
                .Where(po => po.Id == purchaseOrderId && po.CompanyId == companyId && !po.IsDeleted)
                .FirstOrDefaultAsync(ct);

            if (purchaseOrder == null)
            {
                throw new InvalidOperationException($"Purchase order {purchaseOrderId} not found");
            }

            foreach (var receivedItem in receivedItems)
            {
                var orderLine = purchaseOrder.Lines.FirstOrDefault(l => l.ItemId == receivedItem.ItemId);
                if (orderLine == null)
                {
                    throw new InvalidOperationException($"Item {receivedItem.ItemId} not found in purchase order");
                }

                if (receivedItem.QuantityReceived <= 0)
                {
                    continue; // Skip items with zero quantity
                }

                // Create inventory transaction for received goods
                var inventoryTransaction = new InventoryTransaction
                {
                    CompanyId = companyId,
                    ItemId = receivedItem.ItemId,
                    Date = DateTime.UtcNow,
                    QtyChange = receivedItem.QuantityReceived,
                    TransactionType = InventoryTransactionType.Purchase,
                    ReferenceId = purchaseOrderId,
                    ReferenceType = "PurchaseOrder",
                    Notes = receivedItem.Notes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = userId,
                    UpdatedBy = userId,
                    IsDeleted = false
                };

                _context.InventoryTransactions.Add(inventoryTransaction);

                // Update item stock and cost if provided
                var item = await _context.Items.FindAsync(receivedItem.ItemId);
                if (item != null)
                {
                    item.CurrentStockQty += receivedItem.QuantityReceived;
                    
                    // Update unit cost if provided
                    if (receivedItem.UnitCost.HasValue && receivedItem.UnitCost.Value > 0)
                    {
                        item.Cost = receivedItem.UnitCost.Value;
                    }
                    
                    item.UpdatedAt = DateTime.UtcNow;
                    item.UpdatedBy = userId;
                }

                // Update order line received quantity
                orderLine.ReceivedQuantity += receivedItem.QuantityReceived;
            }

            // Update purchase order status based on received quantities
            bool fullyReceived = purchaseOrder.Lines.All(l => l.ReceivedQuantity >= l.Quantity);
            bool partiallyReceived = purchaseOrder.Lines.Any(l => l.ReceivedQuantity > 0);

            if (fullyReceived)
            {
                purchaseOrder.Status = PurchaseOrderStatus.Received;
            }
            else if (partiallyReceived)
            {
                purchaseOrder.Status = PurchaseOrderStatus.Received; // Could add PartiallyReceived status
            }

            purchaseOrder.UpdatedAt = DateTime.UtcNow;
            purchaseOrder.UpdatedBy = userId;

            await _context.SaveChangesAsync(ct);

            await LogAuditAsync(purchaseOrderId, companyId, userId, "RECEIVE_GOODS", 
                $"Received {receivedItems.Count} items", ct);

            _logger.LogInformation("Successfully received goods for purchase order {OrderId}", purchaseOrderId);

            return purchaseOrder;
        }, cancellationToken);
    }

    public async Task<Payment> ProcessPaymentAsync(int purchaseOrderId, decimal paymentAmount, string paymentMethod, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        return await TransactionHelper.ExecuteInTransactionAsync(_context, async (transaction, ct) =>
        {
            var purchaseOrder = await _context.PurchaseOrders
                .Where(po => po.Id == purchaseOrderId && po.CompanyId == companyId && !po.IsDeleted)
                .FirstOrDefaultAsync(ct);

            if (purchaseOrder == null)
            {
                throw new InvalidOperationException($"Purchase order {purchaseOrderId} not found");
            }

            if (paymentAmount <= 0)
            {
                throw new InvalidOperationException("Payment amount must be greater than zero");
            }

            if (paymentAmount > purchaseOrder.TotalAmount)
            {
                throw new InvalidOperationException("Payment amount cannot exceed order total");
            }

            // Create payment record
            var payment = new Payment
            {
                CompanyId = companyId,
                PurchaseOrderId = purchaseOrderId,
                PaymentDate = DateTime.UtcNow,
                Amount = paymentAmount,
                PaymentMethod = paymentMethod,
                PaymentNumber = await GeneratePaymentNumberAsync(companyId, ct),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                UpdatedBy = userId,
                IsDeleted = false
            };

            _context.Payments.Add(payment);

            // Update purchase order status based on payment
            var totalPaid = await _context.Payments
                .Where(p => p.PurchaseOrderId == purchaseOrderId && !p.IsDeleted)
                .SumAsync(p => p.Amount, ct) + paymentAmount;

            if (totalPaid >= purchaseOrder.TotalAmount)
            {
                purchaseOrder.Status = PurchaseOrderStatus.Paid;
            }
            else
            {
                purchaseOrder.Status = PurchaseOrderStatus.Invoiced; // Partially paid
            }

            purchaseOrder.UpdatedAt = DateTime.UtcNow;
            purchaseOrder.UpdatedBy = userId;

            await _context.SaveChangesAsync(ct);

            // Create accounting entries for payment
            await CreatePaymentAccountingEntriesAsync(payment, purchaseOrder, userId, ct);

            await LogAuditAsync(purchaseOrderId, companyId, userId, "PAYMENT", 
                $"Processed payment of {paymentAmount:C} via {paymentMethod}", ct);

            _logger.LogInformation("Processed payment of {Amount:C} for purchase order {OrderId}", 
                paymentAmount, purchaseOrderId);

            return payment;
        }, cancellationToken);
    }

    public async Task<IEnumerable<PurchaseOrder>> GetBySupplierAsync(int supplierId, int companyId, CancellationToken cancellationToken = default)
    {
        return await _context.PurchaseOrders
            .AsNoTracking()
            .Include(po => po.Supplier)
            .Include(po => po.Lines)
                .ThenInclude(l => l.Item)
            .Where(po => po.SupplierId == supplierId && po.CompanyId == companyId && !po.IsDeleted)
            .OrderByDescending(po => po.OrderDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<PurchaseOrder>> GetOutstandingOrdersAsync(int companyId, CancellationToken cancellationToken = default)
    {
        return await _context.PurchaseOrders
            .AsNoTracking()
            .Include(po => po.Supplier)
            .Where(po => po.CompanyId == companyId && 
                        !po.IsDeleted &&
                        (po.Status == PurchaseOrderStatus.Confirmed || po.Status == PurchaseOrderStatus.Received))
            .OrderBy(po => po.OrderDate)
            .ToListAsync(cancellationToken);
    }

    public PurchaseOrder CalculateTotals(PurchaseOrder purchaseOrder)
    {
        if (purchaseOrder.Lines == null || !purchaseOrder.Lines.Any())
        {
            purchaseOrder.SubtotalAmount = 0;
            purchaseOrder.TaxAmount = 0;
            purchaseOrder.TotalAmount = 0;
            return purchaseOrder;
        }

        // Calculate line totals
        foreach (var line in purchaseOrder.Lines)
        {
            line.LineTotal = line.Quantity * line.UnitCost;
            line.TaxAmount = line.LineTotal * (line.TaxRate / 100);
        }

        // Calculate order totals
        purchaseOrder.SubtotalAmount = purchaseOrder.Lines.Sum(l => l.LineTotal);
        purchaseOrder.TaxAmount = purchaseOrder.Lines.Sum(l => l.TaxAmount);
        purchaseOrder.TotalAmount = purchaseOrder.SubtotalAmount + purchaseOrder.TaxAmount;

        return purchaseOrder;
    }

    public async Task<PurchaseSummary> GetPurchaseSummaryAsync(int companyId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default)
    {
        var purchaseOrders = await _context.PurchaseOrders
            .AsNoTracking()
            .Where(po => po.CompanyId == companyId &&
                        !po.IsDeleted &&
                        po.OrderDate >= fromDate &&
                        po.OrderDate <= toDate)
            .ToListAsync(cancellationToken);

        var summary = new PurchaseSummary
        {
            FromDate = fromDate,
            ToDate = toDate,
            TotalPurchases = purchaseOrders.Sum(po => po.TotalAmount),
            TotalTax = purchaseOrders.Sum(po => po.TaxAmount),
            NetPurchases = purchaseOrders.Sum(po => po.SubtotalAmount),
            OrderCount = purchaseOrders.Count,
            UniqueSuppliers = purchaseOrders.Select(po => po.SupplierId).Distinct().Count()
        };

        summary.AverageOrderValue = summary.OrderCount > 0 ? summary.TotalPurchases / summary.OrderCount : 0;

        return summary;
    }

    public async Task<IEnumerable<SuggestedPurchaseOrder>> GenerateSuggestedOrdersAsync(int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Generating suggested purchase orders for company {CompanyId}", companyId);

            // Get items below reorder point
            var lowStockItems = await _context.Items
                .AsNoTracking()
                .Where(i => i.CompanyId == companyId && 
                           !i.IsDeleted && 
                           i.CurrentStockQty <= i.ReorderPoint)
                .ToListAsync(cancellationToken);

            if (!lowStockItems.Any())
            {
                return new List<SuggestedPurchaseOrder>();
            }

            // Group by preferred supplier (for now, we'll assume one supplier per item)
            // In a full implementation, this would consider supplier relationships and preferred suppliers
            var suggestedOrders = new List<SuggestedPurchaseOrder>();

            // For now, create one suggestion per supplier
            var supplierGroups = lowStockItems.GroupBy(i => i.PreferredSupplierId ?? 0);

            foreach (var group in supplierGroups)
            {
                if (group.Key == 0) continue; // Skip items without preferred supplier

                var supplier = await _context.Suppliers
                    .AsNoTracking()
                    .Where(s => s.Id == group.Key && s.CompanyId == companyId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (supplier == null) continue;

                var suggestedOrder = new SuggestedPurchaseOrder
                {
                    SupplierId = supplier.Id,
                    SupplierName = supplier.Name
                };

                foreach (var item in group)
                {
                    // Calculate suggested quantity (reorder point * 2 - current stock)
                    var suggestedQty = Math.Max(item.ReorderPoint * 2 - item.CurrentStockQty, item.ReorderPoint);
                    var estimatedCost = suggestedQty * item.Cost;

                    suggestedOrder.Items.Add(new SuggestedPurchaseItem
                    {
                        ItemId = item.Id,
                        ItemName = item.Name,
                        Sku = item.SKU,
                        CurrentStock = item.CurrentStockQty,
                        ReorderPoint = item.ReorderPoint,
                        SuggestedQuantity = suggestedQty,
                        UnitCost = item.Cost,
                        EstimatedCost = estimatedCost
                    });

                    suggestedOrder.EstimatedTotal += estimatedCost;
                }

                suggestedOrders.Add(suggestedOrder);
            }

            return suggestedOrders;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating suggested purchase orders for company {CompanyId}", companyId);
            throw;
        }
    }

    /// <summary>
    /// Generate unique order number for the company
    /// </summary>
    private async Task<string> GenerateOrderNumberAsync(int companyId, CancellationToken cancellationToken)
    {
        var year = DateTime.Now.Year;
        var prefix = $"PO-{year}-";
        
        var lastOrderNumber = await _context.PurchaseOrders
            .Where(po => po.CompanyId == companyId && po.OrderNumber.StartsWith(prefix))
            .OrderByDescending(po => po.OrderNumber)
            .Select(po => po.OrderNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (!string.IsNullOrEmpty(lastOrderNumber))
        {
            var numberPart = lastOrderNumber.Substring(prefix.Length);
            if (int.TryParse(numberPart, out int lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D4}";
    }

    /// <summary>
    /// Generate unique payment number for the company
    /// </summary>
    private async Task<string> GeneratePaymentNumberAsync(int companyId, CancellationToken cancellationToken)
    {
        var year = DateTime.Now.Year;
        var prefix = $"PAY-{year}-";
        
        var lastPaymentNumber = await _context.Payments
            .Where(p => p.CompanyId == companyId && p.PaymentNumber.StartsWith(prefix))
            .OrderByDescending(p => p.PaymentNumber)
            .Select(p => p.PaymentNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (!string.IsNullOrEmpty(lastPaymentNumber))
        {
            var numberPart = lastPaymentNumber.Substring(prefix.Length);
            if (int.TryParse(numberPart, out int lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D4}";
    }

    /// <summary>
    /// Validate line items and setup default values
    /// </summary>
    private async Task ValidateAndProcessLineItemsAsync(ICollection<PurchaseOrderLine> lines, int companyId, CancellationToken cancellationToken)
    {
        foreach (var line in lines)
        {
            var item = await _context.Items
                .Where(i => i.Id == line.ItemId && i.CompanyId == companyId && !i.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            if (item == null)
            {
                throw new InvalidOperationException($"Item {line.ItemId} not found");
            }

            // Set default unit cost from item if not provided
            if (line.UnitCost == 0)
            {
                line.UnitCost = item.Cost;
            }

            // Set default tax rate (17% VAT for Israel)
            if (line.TaxRate == 0)
            {
                line.TaxRate = 17; // Israeli VAT rate
            }

            line.CompanyId = companyId;
            line.CreatedAt = DateTime.UtcNow;
            line.UpdatedAt = DateTime.UtcNow;
            line.IsDeleted = false;
            line.ReceivedQty = 0; // Initialize received quantity
        }
    }

    /// <summary>
    /// Create double-entry accounting entries for purchase order
    /// </summary>
    private async Task CreateAccountingEntriesAsync(PurchaseOrder purchaseOrder, string userId, CancellationToken cancellationToken)
    {
        try
        {
            await _journalEntryService.CreatePurchaseJournalEntriesAsync(
                purchaseOrder.Id, 
                purchaseOrder.CompanyId, 
                userId, 
                cancellationToken);

            _logger.LogInformation("Successfully created accounting entries for purchase order {OrderId}", purchaseOrder.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create accounting entries for purchase order {OrderId}", purchaseOrder.Id);
            throw;
        }
    }

    /// <summary>
    /// Create accounting entries for payment
    /// </summary>
    private async Task CreatePaymentAccountingEntriesAsync(Payment payment, PurchaseOrder purchaseOrder, string userId, CancellationToken cancellationToken)
    {
        try
        {
            await _journalEntryService.CreatePaymentMadeJournalEntriesAsync(
                payment.Id, 
                payment.CompanyId, 
                userId, 
                cancellationToken);

            _logger.LogInformation("Successfully created payment accounting entries for payment {PaymentId}", payment.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create payment accounting entries for payment {PaymentId}", payment.Id);
            throw;
        }
    }
}
