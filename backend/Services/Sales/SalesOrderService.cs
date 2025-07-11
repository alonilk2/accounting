using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.Models.Sales;
using backend.Models.Inventory;
using backend.Services.Interfaces;
using backend.Services.Core;
using backend.Services.Accounting;

namespace backend.Services.Sales;

/// <summary>
/// Sales order management service with inventory integration and double-entry accounting
/// Handles the complete sales lifecycle from order creation to payment processing
/// </summary>
public class SalesOrderService : BaseService<SalesOrder>, ISalesOrderService
{
    private readonly IJournalEntryService _journalEntryService;

    public SalesOrderService(
        AccountingDbContext context, 
        ILogger<SalesOrderService> logger,
        IJournalEntryService journalEntryService) 
        : base(context, logger)
    {
        _journalEntryService = journalEntryService;
    }

    protected override DbSet<SalesOrder> DbSet => _context.SalesOrders;
    protected override string CompanyIdPropertyName => nameof(SalesOrder.CompanyId);

    /// <summary>
    /// Apply search filter for sales orders
    /// </summary>
    protected override IQueryable<SalesOrder> ApplySearchFilter(IQueryable<SalesOrder> query, string searchTerm)
    {
        return query.Where(so => 
            so.OrderNumber.Contains(searchTerm) ||
            so.Customer.Name.Contains(searchTerm) ||
            so.Status.ToString().Contains(searchTerm));
    }

    public async Task<SalesOrder> CreateSalesOrderAsync(SalesOrder salesOrder, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        return await TransactionHelper.ExecuteInTransactionAsync(_context, async (transaction, ct) =>
        {
            _logger.LogInformation("Creating sales order for customer {CustomerId} in company {CompanyId}", 
                salesOrder.CustomerId, companyId);

            // Validate customer exists
            var customer = await _context.Customers
                .Where(c => c.Id == salesOrder.CustomerId && c.CompanyId == companyId && !c.IsDeleted)
                .FirstOrDefaultAsync(ct);

            if (customer == null)
            {
                throw new InvalidOperationException($"Customer {salesOrder.CustomerId} not found");
            }

            // Generate order number if not provided
            if (string.IsNullOrEmpty(salesOrder.OrderNumber))
            {
                salesOrder.OrderNumber = await GenerateOrderNumberAsync(companyId, ct);
            }

            // Validate and process line items
            await ValidateAndProcessLineItemsAsync(salesOrder.Lines, companyId, ct);

            // Calculate totals
            salesOrder = CalculateTotals(salesOrder);

            // Set company ID and audit fields
            salesOrder.CompanyId = companyId;
            salesOrder.CreatedAt = DateTime.UtcNow;
            salesOrder.UpdatedAt = DateTime.UtcNow;
            salesOrder.CreatedBy = userId;
            salesOrder.UpdatedBy = userId;
            salesOrder.IsDeleted = false;

            // Set default status if not provided
            if (salesOrder.Status == SalesOrderStatus.Draft)
            {
                salesOrder.Status = SalesOrderStatus.Confirmed;
            }

            // Set order date if not provided
            if (salesOrder.OrderDate == default)
            {
                salesOrder.OrderDate = DateTime.UtcNow;
            }

            // Add to context
            _context.SalesOrders.Add(salesOrder);
            await _context.SaveChangesAsync(ct);

            // Update inventory for each line item
            foreach (var line in salesOrder.Lines)
            {
                await CreateInventoryTransactionAsync(line, salesOrder, userId, ct);
            }

            // Create accounting entries
            await CreateAccountingEntriesAsync(salesOrder, userId, ct);

            // Log audit trail
            await LogAuditAsync(salesOrder.Id, companyId, userId, "CREATE", 
                $"Created sales order {salesOrder.OrderNumber} for customer {customer.Name}", ct);

            _logger.LogInformation("Successfully created sales order {OrderId} with number {OrderNumber}", 
                salesOrder.Id, salesOrder.OrderNumber);

            return salesOrder;
        }, cancellationToken);
    }

    public async Task<SalesOrder> UpdateStatusAsync(int salesOrderId, SalesOrderStatus status, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var salesOrder = await _context.SalesOrders
                .Include(so => so.Lines)
                .Where(so => so.Id == salesOrderId && so.CompanyId == companyId && !so.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            if (salesOrder == null)
            {
                throw new InvalidOperationException($"Sales order {salesOrderId} not found");
            }

            var oldStatus = salesOrder.Status;
            salesOrder.Status = status;
            salesOrder.UpdatedAt = DateTime.UtcNow;
            salesOrder.UpdatedBy = userId;

            await _context.SaveChangesAsync(cancellationToken);

            await LogAuditAsync(salesOrderId, companyId, userId, "UPDATE", 
                $"Changed status from {oldStatus} to {status}", cancellationToken);

            _logger.LogInformation("Updated sales order {OrderId} status from {OldStatus} to {NewStatus}", 
                salesOrderId, oldStatus, status);

            return salesOrder;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating sales order {OrderId} status", salesOrderId);
            throw;
        }
    }

    public async Task<Receipt> ProcessPaymentAsync(int salesOrderId, decimal paymentAmount, string paymentMethod, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        return await TransactionHelper.ExecuteInTransactionAsync(_context, async (transaction, ct) =>
        {
            var salesOrder = await _context.SalesOrders
                .Where(so => so.Id == salesOrderId && so.CompanyId == companyId && !so.IsDeleted)
                .FirstOrDefaultAsync(ct);

            if (salesOrder == null)
            {
                throw new InvalidOperationException($"Sales order {salesOrderId} not found");
            }

            if (paymentAmount <= 0)
            {
                throw new InvalidOperationException("Payment amount must be greater than zero");
            }

            if (paymentAmount > salesOrder.TotalAmount)
            {
                throw new InvalidOperationException("Payment amount cannot exceed order total");
            }

            // Create receipt
            var receipt = new Receipt
            {
                CompanyId = companyId,
                SalesOrderId = salesOrderId,
                PaymentDate = DateTime.UtcNow,
                Amount = paymentAmount,
                PaymentMethod = paymentMethod,
                ReceiptNumber = await GenerateReceiptNumberAsync(companyId, ct),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                UpdatedBy = userId,
                IsDeleted = false
            };

            _context.Receipts.Add(receipt);

            // Update sales order status and paid amount based on payment
            var totalPaid = await _context.Receipts
                .Where(r => r.SalesOrderId == salesOrderId && !r.IsDeleted)
                .SumAsync(r => r.Amount, ct) + paymentAmount;

            // Update the PaidAmount field with the total amount paid
            salesOrder.PaidAmount = totalPaid;

            if (totalPaid >= salesOrder.TotalAmount)
            {
                salesOrder.Status = SalesOrderStatus.Paid;
            }
            else
            {
                salesOrder.Status = SalesOrderStatus.Invoiced; // Partially paid
            }

            salesOrder.UpdatedAt = DateTime.UtcNow;
            salesOrder.UpdatedBy = userId;

            await _context.SaveChangesAsync(ct);

            // Create accounting entries for payment
            await CreatePaymentAccountingEntriesAsync(receipt, salesOrder, userId, ct);

            await LogAuditAsync(salesOrderId, companyId, userId, "PAYMENT", 
                $"Processed payment of {paymentAmount:C} via {paymentMethod}", ct);

            _logger.LogInformation("Processed payment of {Amount:C} for sales order {OrderId}", 
                paymentAmount, salesOrderId);

            return receipt;
        }, cancellationToken);
    }

    public async Task<IEnumerable<SalesOrder>> GetByCustomerAsync(int customerId, int companyId, CancellationToken cancellationToken = default)
    {
        return await _context.SalesOrders
            .AsNoTracking()
            .Include(so => so.Customer)
            .Include(so => so.Lines)
                .ThenInclude(l => l.Item)
            .Where(so => so.CustomerId == customerId && so.CompanyId == companyId && !so.IsDeleted)
            .OrderByDescending(so => so.OrderDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<SalesOrder>> GetOverdueOrdersAsync(int companyId, CancellationToken cancellationToken = default)
    {
        return await _context.SalesOrders
            .AsNoTracking()
            .Include(so => so.Customer)
            .Where(so => so.CompanyId == companyId && 
                        !so.IsDeleted &&
                        so.Status == SalesOrderStatus.Invoiced &&
                        so.DueDate < DateTime.Today)
            .OrderBy(so => so.DueDate)
            .ToListAsync(cancellationToken);
    }

    public SalesOrder CalculateTotals(SalesOrder salesOrder)
    {
        if (salesOrder.Lines == null || !salesOrder.Lines.Any())
        {
            salesOrder.SubtotalAmount = 0;
            salesOrder.TaxAmount = 0;
            salesOrder.TotalAmount = 0;
            return salesOrder;
        }

        // Calculate line totals
        foreach (var line in salesOrder.Lines)
        {
            line.LineTotal = line.Quantity * line.UnitPrice;
            line.TaxAmount = line.LineTotal * (line.TaxRate / 100);
        }

        // Calculate order totals
        salesOrder.SubtotalAmount = salesOrder.Lines.Sum(l => l.LineTotal);
        salesOrder.TaxAmount = salesOrder.Lines.Sum(l => l.TaxAmount);
        salesOrder.TotalAmount = salesOrder.SubtotalAmount + salesOrder.TaxAmount;

        return salesOrder;
    }

    public async Task<SalesSummary> GetSalesSummaryAsync(int companyId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default)
    {
        var salesOrders = await _context.SalesOrders
            .AsNoTracking()
            .Where(so => so.CompanyId == companyId &&
                        !so.IsDeleted &&
                        so.OrderDate >= fromDate &&
                        so.OrderDate <= toDate)
            .ToListAsync(cancellationToken);

        var summary = new SalesSummary
        {
            FromDate = fromDate,
            ToDate = toDate,
            TotalSales = salesOrders.Sum(so => so.TotalAmount),
            TotalTax = salesOrders.Sum(so => so.TaxAmount),
            NetSales = salesOrders.Sum(so => so.SubtotalAmount),
            OrderCount = salesOrders.Count,
            UniqueCustomers = salesOrders.Select(so => so.CustomerId).Distinct().Count()
        };

        summary.AverageOrderValue = summary.OrderCount > 0 ? summary.TotalSales / summary.OrderCount : 0;

        return summary;
    }

    /// <summary>
    /// Generate unique order number for the company
    /// </summary>
    private async Task<string> GenerateOrderNumberAsync(int companyId, CancellationToken cancellationToken)
    {
        var year = DateTime.Now.Year;
        var prefix = $"SO-{year}-";
        
        var lastOrderNumber = await _context.SalesOrders
            .Where(so => so.CompanyId == companyId && so.OrderNumber.StartsWith(prefix))
            .OrderByDescending(so => so.OrderNumber)
            .Select(so => so.OrderNumber)
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
    /// Generate unique receipt number for the company
    /// </summary>
    private async Task<string> GenerateReceiptNumberAsync(int companyId, CancellationToken cancellationToken)
    {
        var year = DateTime.Now.Year;
        var prefix = $"REC-{year}-";
        
        var lastReceiptNumber = await _context.Receipts
            .Where(r => r.CompanyId == companyId && r.ReceiptNumber.StartsWith(prefix))
            .OrderByDescending(r => r.ReceiptNumber)
            .Select(r => r.ReceiptNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (!string.IsNullOrEmpty(lastReceiptNumber))
        {
            var numberPart = lastReceiptNumber.Substring(prefix.Length);
            if (int.TryParse(numberPart, out int lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D4}";
    }

    /// <summary>
    /// Validate line items and check inventory availability
    /// </summary>
    private async Task ValidateAndProcessLineItemsAsync(ICollection<SalesOrderLine> lines, int companyId, CancellationToken cancellationToken)
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

            // Check inventory availability
            if (item.CurrentStockQty < line.Quantity)
            {
                throw new InvalidOperationException($"Insufficient stock for item {item.Name}. Available: {item.CurrentStockQty}, Required: {line.Quantity}");
            }

            // Set default unit price from item if not provided
            if (line.UnitPrice == 0)
            {
                line.UnitPrice = item.Price;
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
        }
    }

    /// <summary>
    /// Create inventory transaction for sales order line
    /// </summary>
    private async Task CreateInventoryTransactionAsync(SalesOrderLine line, SalesOrder salesOrder, string userId, CancellationToken cancellationToken)
    {
        var transaction = new InventoryTransaction
        {
            CompanyId = salesOrder.CompanyId,
            ItemId = line.ItemId,
            Date = salesOrder.Date,
            QtyChange = -line.Quantity, // Negative for sales
            TransactionType = InventoryTransactionType.Sale,
            ReferenceId = salesOrder.Id,
            ReferenceType = "SalesOrder",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            UpdatedBy = userId,
            IsDeleted = false
        };

        _context.InventoryTransactions.Add(transaction);

        // Update item stock
        var item = await _context.Items.FindAsync(line.ItemId);
        if (item != null)
        {
            item.CurrentStockQty -= line.Quantity;
            item.UpdatedAt = DateTime.UtcNow;
            item.UpdatedBy = userId;
        }
    }

    /// <summary>
    /// Create double-entry accounting entries for sales order
    /// </summary>
    private async Task CreateAccountingEntriesAsync(SalesOrder salesOrder, string userId, CancellationToken cancellationToken)
    {
        try
        {
            await _journalEntryService.CreateSalesJournalEntriesAsync(
                salesOrder.Id, 
                salesOrder.CompanyId, 
                userId, 
                cancellationToken);

            _logger.LogInformation("Successfully created accounting entries for sales order {OrderId}", salesOrder.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create accounting entries for sales order {OrderId}", salesOrder.Id);
            throw;
        }
    }

    /// <summary>
    /// Create accounting entries for payment receipt
    /// </summary>
    private async Task CreatePaymentAccountingEntriesAsync(Receipt receipt, SalesOrder salesOrder, string userId, CancellationToken cancellationToken)
    {
        try
        {
            await _journalEntryService.CreatePaymentReceiptJournalEntriesAsync(
                receipt.Id, 
                receipt.CompanyId, 
                userId, 
                cancellationToken);

            _logger.LogInformation("Successfully created payment accounting entries for receipt {ReceiptId}", receipt.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create payment accounting entries for receipt {ReceiptId}", receipt.Id);
            throw;
        }
    }

    /// <summary>
    /// Recalculate and update the PaidAmount for a sales order based on its receipts
    /// This method can be used to fix data inconsistencies
    /// </summary>
    /// <param name="salesOrderId">Sales order ID</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated sales order</returns>
    public async Task<SalesOrder> RecalculatePaidAmountAsync(int salesOrderId, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var salesOrder = await _context.SalesOrders
                .Where(so => so.Id == salesOrderId && so.CompanyId == companyId && !so.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            if (salesOrder == null)
            {
                throw new InvalidOperationException($"Sales order {salesOrderId} not found");
            }

            // Calculate total paid amount from all receipts
            var totalPaid = await _context.Receipts
                .Where(r => r.SalesOrderId == salesOrderId && !r.IsDeleted)
                .SumAsync(r => r.Amount, cancellationToken);

            // Update the PaidAmount field
            salesOrder.PaidAmount = totalPaid;

            // Update status based on payment amount
            if (totalPaid >= salesOrder.TotalAmount)
            {
                salesOrder.Status = SalesOrderStatus.Paid;
            }
            else if (totalPaid > 0)
            {
                salesOrder.Status = SalesOrderStatus.Invoiced; // Partially paid
            }

            salesOrder.UpdatedAt = DateTime.UtcNow;
            salesOrder.UpdatedBy = userId;

            await _context.SaveChangesAsync(cancellationToken);

            await LogAuditAsync(salesOrderId, companyId, userId, "RECALCULATE", 
                $"Recalculated PaidAmount to {totalPaid:C}", cancellationToken);

            _logger.LogInformation("Recalculated PaidAmount for sales order {OrderId} to {PaidAmount:C}", 
                salesOrderId, totalPaid);

            return salesOrder;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalculating PaidAmount for sales order {OrderId}", salesOrderId);
            throw;
        }
    }

    /// <summary>
    /// Recalculate PaidAmount for all sales orders in a company
    /// Useful for data migration or fixing inconsistencies
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of orders updated</returns>
    public async Task<int> RecalculateAllPaidAmountsAsync(int companyId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var salesOrders = await _context.SalesOrders
                .Where(so => so.CompanyId == companyId && !so.IsDeleted)
                .ToListAsync(cancellationToken);

            int updatedCount = 0;

            foreach (var salesOrder in salesOrders)
            {
                // Calculate total paid amount from all receipts
                var totalPaid = await _context.Receipts
                    .Where(r => r.SalesOrderId == salesOrder.Id && !r.IsDeleted)
                    .SumAsync(r => r.Amount, cancellationToken);

                // Only update if the PaidAmount is different
                if (salesOrder.PaidAmount != totalPaid)
                {
                    salesOrder.PaidAmount = totalPaid;

                    // Update status based on payment amount
                    if (totalPaid >= salesOrder.TotalAmount)
                    {
                        salesOrder.Status = SalesOrderStatus.Paid;
                    }
                    else if (totalPaid > 0)
                    {
                        salesOrder.Status = SalesOrderStatus.Invoiced; // Partially paid
                    }

                    salesOrder.UpdatedAt = DateTime.UtcNow;
                    salesOrder.UpdatedBy = userId;

                    updatedCount++;
                }
            }

            if (updatedCount > 0)
            {
                await _context.SaveChangesAsync(cancellationToken);

                await LogAuditAsync(0, companyId, userId, "BULK_RECALCULATE", 
                    $"Recalculated PaidAmount for {updatedCount} sales orders", cancellationToken);

                _logger.LogInformation("Recalculated PaidAmount for {UpdatedCount} sales orders in company {CompanyId}", 
                    updatedCount, companyId);
            }

            return updatedCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalculating PaidAmounts for company {CompanyId}", companyId);
            throw;
        }
    }
}
