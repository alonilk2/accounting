using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.Models.Accounting;
using backend.Models.Core;
using backend.Services.Interfaces;

namespace backend.Services.Accounting;

/// <summary>
/// Service for managing journal entries in the double-entry accounting system
/// Handles automatic journal entry creation for business transactions
/// </summary>
public class JournalEntryService : IJournalEntryService
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<JournalEntryService> _logger;

    public JournalEntryService(AccountingDbContext context, ILogger<JournalEntryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task CreateSalesJournalEntriesAsync(int salesOrderId, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        var salesOrder = await _context.SalesOrders
            .Include(so => so.Customer)
            .Include(so => so.Lines)
            .ThenInclude(l => l.Item)
            .FirstOrDefaultAsync(so => so.Id == salesOrderId && so.CompanyId == companyId, cancellationToken);

        if (salesOrder == null)
        {
            throw new InvalidOperationException($"Sales order {salesOrderId} not found");
        }

        var transactionNumber = $"SO-{salesOrder.OrderNumber}";
        var sequenceNumber = await GetNextSequenceNumberAsync(companyId, cancellationToken);

        // Get required accounts
        var accountsReceivable = await GetAccountByTypeAsync(companyId, "Accounts Receivable", AccountType.Asset, cancellationToken);
        var salesRevenue = await GetAccountByTypeAsync(companyId, "Sales Revenue", AccountType.Revenue, cancellationToken);
        var vatPayable = await GetAccountByTypeAsync(companyId, "VAT Payable", AccountType.Liability, cancellationToken);
        var cogs = await GetAccountByTypeAsync(companyId, "Cost of Goods Sold", AccountType.Expense, cancellationToken);
        var inventory = await GetAccountByTypeAsync(companyId, "Inventory", AccountType.Asset, cancellationToken);

        var entries = new List<JournalEntry>();

        // DR Accounts Receivable, CR Sales Revenue (for net amount)
        entries.Add(new JournalEntry
        {
            CompanyId = companyId,
            AccountId = accountsReceivable.Id,
            TransactionDate = salesOrder.OrderDate,
            TransactionNumber = transactionNumber,
            Description = $"Sale to {salesOrder.Customer.Name} - Order {salesOrder.OrderNumber}",
            DebitAmount = salesOrder.TotalAmount,
            CreditAmount = 0,
            ReferenceType = "SalesOrder",
            ReferenceId = salesOrder.Id,
            SequenceNumber = sequenceNumber,
            CreatedByUserId = ConvertUserIdToInt(userId),
            CreatedAt = DateTime.UtcNow
        });

        entries.Add(new JournalEntry
        {
            CompanyId = companyId,
            AccountId = salesRevenue.Id,
            TransactionDate = salesOrder.OrderDate,
            TransactionNumber = transactionNumber,
            Description = $"Sale to {salesOrder.Customer.Name} - Order {salesOrder.OrderNumber}",
            DebitAmount = 0,
            CreditAmount = salesOrder.SubtotalAmount,
            ReferenceType = "SalesOrder",
            ReferenceId = salesOrder.Id,
            SequenceNumber = sequenceNumber + 1,
            CreatedByUserId = ConvertUserIdToInt(userId),
            CreatedAt = DateTime.UtcNow
        });

        // If there's VAT, create VAT Payable entry
        if (salesOrder.TaxAmount > 0)
        {
            entries.Add(new JournalEntry
            {
                CompanyId = companyId,
                AccountId = vatPayable.Id,
                TransactionDate = salesOrder.OrderDate,
                TransactionNumber = transactionNumber,
                Description = $"VAT on sale to {salesOrder.Customer.Name} - Order {salesOrder.OrderNumber}",
                DebitAmount = 0,
                CreditAmount = salesOrder.TaxAmount,
                ReferenceType = "SalesOrder",
                ReferenceId = salesOrder.Id,
                SequenceNumber = sequenceNumber + 2,
                CreatedByUserId = ConvertUserIdToInt(userId),
                CreatedAt = DateTime.UtcNow
            });
        }

        // Create COGS entries for each line item
        foreach (var line in salesOrder.Lines)
        {
            var costAmount = line.Quantity * line.Item.CostPrice;
            if (costAmount > 0)
            {
                // DR Cost of Goods Sold
                entries.Add(new JournalEntry
                {
                    CompanyId = companyId,
                    AccountId = cogs.Id,
                    TransactionDate = salesOrder.OrderDate,
                    TransactionNumber = transactionNumber,
                    Description = $"COGS for {line.Item.Name} - Order {salesOrder.OrderNumber}",
                    DebitAmount = costAmount,
                    CreditAmount = 0,
                    ReferenceType = "SalesOrderLine",
                    ReferenceId = line.Id,
                    SequenceNumber = sequenceNumber + 3 + (line.Id * 2),
                    CreatedByUserId = ConvertUserIdToInt(userId),
                    CreatedAt = DateTime.UtcNow
                });

                // CR Inventory
                entries.Add(new JournalEntry
                {
                    CompanyId = companyId,
                    AccountId = inventory.Id,
                    TransactionDate = salesOrder.OrderDate,
                    TransactionNumber = transactionNumber,
                    Description = $"Inventory reduction for {line.Item.Name} - Order {salesOrder.OrderNumber}",
                    DebitAmount = 0,
                    CreditAmount = costAmount,
                    ReferenceType = "SalesOrderLine",
                    ReferenceId = line.Id,
                    SequenceNumber = sequenceNumber + 4 + (line.Id * 2),
                    CreatedByUserId = ConvertUserIdToInt(userId),
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        _context.JournalEntries.AddRange(entries);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created {EntryCount} journal entries for sales order {OrderId}", entries.Count, salesOrderId);
    }

    public async Task CreatePaymentReceiptJournalEntriesAsync(int receiptId, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        var receipt = await _context.Receipts
            .Include(r => r.SalesOrder)
            .ThenInclude(so => so.Customer)
            .FirstOrDefaultAsync(r => r.Id == receiptId && r.CompanyId == companyId, cancellationToken);

        if (receipt == null)
        {
            throw new InvalidOperationException($"Receipt {receiptId} not found");
        }

        var transactionNumber = $"RCP-{receipt.ReceiptNumber}";
        var sequenceNumber = await GetNextSequenceNumberAsync(companyId, cancellationToken);

        // Get required accounts
        var cashAccount = await GetCashAccountByPaymentMethodAsync(companyId, receipt.PaymentMethod, cancellationToken);
        var accountsReceivable = await GetAccountByTypeAsync(companyId, "Accounts Receivable", AccountType.Asset, cancellationToken);

        var entries = new List<JournalEntry>
        {
            // DR Cash/Bank
            new JournalEntry
            {
                CompanyId = companyId,
                AccountId = cashAccount.Id,
                TransactionDate = receipt.PaymentDate,
                TransactionNumber = transactionNumber,
                Description = $"Payment received from {receipt.SalesOrder.Customer.Name} - Receipt {receipt.ReceiptNumber}",
                DebitAmount = receipt.Amount,
                CreditAmount = 0,
                ReferenceType = "Receipt",
                ReferenceId = receipt.Id,
                SequenceNumber = sequenceNumber,
                CreatedByUserId = ConvertUserIdToInt(userId),
                CreatedAt = DateTime.UtcNow
            },
            // CR Accounts Receivable
            new JournalEntry
            {
                CompanyId = companyId,
                AccountId = accountsReceivable.Id,
                TransactionDate = receipt.PaymentDate,
                TransactionNumber = transactionNumber,
                Description = $"Payment received from {receipt.SalesOrder.Customer.Name} - Receipt {receipt.ReceiptNumber}",
                DebitAmount = 0,
                CreditAmount = receipt.Amount,
                ReferenceType = "Receipt",
                ReferenceId = receipt.Id,
                SequenceNumber = sequenceNumber + 1,
                CreatedByUserId = ConvertUserIdToInt(userId),
                CreatedAt = DateTime.UtcNow
            }
        };

        _context.JournalEntries.AddRange(entries);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created journal entries for payment receipt {ReceiptId}", receiptId);
    }

    public async Task CreatePurchaseJournalEntriesAsync(int purchaseOrderId, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        var purchaseOrder = await _context.PurchaseOrders
            .Include(po => po.Supplier)
            .Include(po => po.Lines)
            .ThenInclude(l => l.Item)
            .FirstOrDefaultAsync(po => po.Id == purchaseOrderId && po.CompanyId == companyId, cancellationToken);

        if (purchaseOrder == null)
        {
            throw new InvalidOperationException($"Purchase order {purchaseOrderId} not found");
        }

        var transactionNumber = $"PO-{purchaseOrder.OrderNumber}";
        var sequenceNumber = await GetNextSequenceNumberAsync(companyId, cancellationToken);

        // Get required accounts
        var accountsPayable = await GetAccountByTypeAsync(companyId, "Accounts Payable", AccountType.Liability, cancellationToken);
        var inventory = await GetAccountByTypeAsync(companyId, "Inventory", AccountType.Asset, cancellationToken);
        var vatReceivable = await GetAccountByTypeAsync(companyId, "VAT Receivable", AccountType.Asset, cancellationToken);

        var entries = new List<JournalEntry>();

        // DR Inventory
        entries.Add(new JournalEntry
        {
            CompanyId = companyId,
            AccountId = inventory.Id,
            TransactionDate = purchaseOrder.OrderDate,
            TransactionNumber = transactionNumber,
            Description = $"Purchase from {purchaseOrder.Supplier.Name} - Order {purchaseOrder.OrderNumber}",
            DebitAmount = purchaseOrder.SubtotalAmount,
            CreditAmount = 0,
            ReferenceType = "PurchaseOrder",
            ReferenceId = purchaseOrder.Id,
            SequenceNumber = sequenceNumber,
            CreatedByUserId = ConvertUserIdToInt(userId),
            CreatedAt = DateTime.UtcNow
        });

        // If there's VAT, create VAT Receivable entry
        if (purchaseOrder.TaxAmount > 0)
        {
            entries.Add(new JournalEntry
            {
                CompanyId = companyId,
                AccountId = vatReceivable.Id,
                TransactionDate = purchaseOrder.OrderDate,
                TransactionNumber = transactionNumber,
                Description = $"VAT on purchase from {purchaseOrder.Supplier.Name} - Order {purchaseOrder.OrderNumber}",
                DebitAmount = purchaseOrder.TaxAmount,
                CreditAmount = 0,
                ReferenceType = "PurchaseOrder",
                ReferenceId = purchaseOrder.Id,
                SequenceNumber = sequenceNumber + 1,
                CreatedByUserId = ConvertUserIdToInt(userId),
                CreatedAt = DateTime.UtcNow
            });
        }

        // CR Accounts Payable (for total amount)
        entries.Add(new JournalEntry
        {
            CompanyId = companyId,
            AccountId = accountsPayable.Id,
            TransactionDate = purchaseOrder.OrderDate,
            TransactionNumber = transactionNumber,
            Description = $"Purchase from {purchaseOrder.Supplier.Name} - Order {purchaseOrder.OrderNumber}",
            DebitAmount = 0,
            CreditAmount = purchaseOrder.TotalAmount,
            ReferenceType = "PurchaseOrder",
            ReferenceId = purchaseOrder.Id,
            SequenceNumber = sequenceNumber + 2,
            CreatedByUserId = ConvertUserIdToInt(userId),
            CreatedAt = DateTime.UtcNow
        });

        _context.JournalEntries.AddRange(entries);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created {EntryCount} journal entries for purchase order {OrderId}", entries.Count, purchaseOrderId);
    }

    public async Task CreatePaymentMadeJournalEntriesAsync(int paymentId, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        var payment = await _context.Payments
            .Include(p => p.PurchaseOrder)
            .ThenInclude(po => po.Supplier)
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.CompanyId == companyId, cancellationToken);

        if (payment == null)
        {
            throw new InvalidOperationException($"Payment {paymentId} not found");
        }

        var transactionNumber = $"PAY-{payment.PaymentNumber}";
        var sequenceNumber = await GetNextSequenceNumberAsync(companyId, cancellationToken);

        // Get required accounts
        var accountsPayable = await GetAccountByTypeAsync(companyId, "Accounts Payable", AccountType.Liability, cancellationToken);
        var cashAccount = await GetCashAccountByPaymentMethodAsync(companyId, payment.PaymentMethod, cancellationToken);

        var entries = new List<JournalEntry>
        {
            // DR Accounts Payable
            new JournalEntry
            {
                CompanyId = companyId,
                AccountId = accountsPayable.Id,
                TransactionDate = payment.PaymentDate,
                TransactionNumber = transactionNumber,
                Description = $"Payment to {payment.PurchaseOrder.Supplier.Name} - Payment {payment.PaymentNumber}",
                DebitAmount = payment.Amount,
                CreditAmount = 0,
                ReferenceType = "Payment",
                ReferenceId = payment.Id,
                SequenceNumber = sequenceNumber,
                CreatedByUserId = ConvertUserIdToInt(userId),
                CreatedAt = DateTime.UtcNow
            },
            // CR Cash/Bank
            new JournalEntry
            {
                CompanyId = companyId,
                AccountId = cashAccount.Id,
                TransactionDate = payment.PaymentDate,
                TransactionNumber = transactionNumber,
                Description = $"Payment to {payment.PurchaseOrder.Supplier.Name} - Payment {payment.PaymentNumber}",
                DebitAmount = 0,
                CreditAmount = payment.Amount,
                ReferenceType = "Payment",
                ReferenceId = payment.Id,
                SequenceNumber = sequenceNumber + 1,
                CreatedByUserId = ConvertUserIdToInt(userId),
                CreatedAt = DateTime.UtcNow
            }
        };

        _context.JournalEntries.AddRange(entries);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created journal entries for payment {PaymentId}", paymentId);
    }

    public async Task CreateInventoryAdjustmentJournalEntriesAsync(int itemId, decimal quantityChange, decimal valueChange, int companyId, string userId, string reason, CancellationToken cancellationToken = default)
    {
        var item = await _context.Items
            .FirstOrDefaultAsync(i => i.Id == itemId && i.CompanyId == companyId, cancellationToken);

        if (item == null)
        {
            throw new InvalidOperationException($"Item {itemId} not found");
        }

        var transactionNumber = $"INV-ADJ-{DateTime.UtcNow:yyyyMMdd}-{itemId}";
        var sequenceNumber = await GetNextSequenceNumberAsync(companyId, cancellationToken);

        // Get required accounts
        var inventory = await GetAccountByTypeAsync(companyId, "Inventory", AccountType.Asset, cancellationToken);
        var inventoryAdjustment = await GetAccountByTypeAsync(companyId, "Inventory Adjustment", AccountType.Expense, cancellationToken);

        var entries = new List<JournalEntry>();

        if (valueChange > 0)
        {
            // Positive adjustment: DR Inventory, CR Inventory Adjustment
            entries.Add(new JournalEntry
            {
                CompanyId = companyId,
                AccountId = inventory.Id,
                TransactionDate = DateTime.UtcNow,
                TransactionNumber = transactionNumber,
                Description = $"Inventory adjustment: {reason} - {item.Name}",
                DebitAmount = valueChange,
                CreditAmount = 0,
                ReferenceType = "InventoryAdjustment",
                ReferenceId = itemId,
                SequenceNumber = sequenceNumber,
                CreatedByUserId = ConvertUserIdToInt(userId),
                CreatedAt = DateTime.UtcNow
            });

            entries.Add(new JournalEntry
            {
                CompanyId = companyId,
                AccountId = inventoryAdjustment.Id,
                TransactionDate = DateTime.UtcNow,
                TransactionNumber = transactionNumber,
                Description = $"Inventory adjustment: {reason} - {item.Name}",
                DebitAmount = 0,
                CreditAmount = valueChange,
                ReferenceType = "InventoryAdjustment",
                ReferenceId = itemId,
                SequenceNumber = sequenceNumber + 1,
                CreatedByUserId = ConvertUserIdToInt(userId),
                CreatedAt = DateTime.UtcNow
            });
        }
        else if (valueChange < 0)
        {
            // Negative adjustment: DR Inventory Adjustment, CR Inventory
            var adjustmentAmount = Math.Abs(valueChange);
            entries.Add(new JournalEntry
            {
                CompanyId = companyId,
                AccountId = inventoryAdjustment.Id,
                TransactionDate = DateTime.UtcNow,
                TransactionNumber = transactionNumber,
                Description = $"Inventory adjustment: {reason} - {item.Name}",
                DebitAmount = adjustmentAmount,
                CreditAmount = 0,
                ReferenceType = "InventoryAdjustment",
                ReferenceId = itemId,
                SequenceNumber = sequenceNumber,
                CreatedByUserId = ConvertUserIdToInt(userId),
                CreatedAt = DateTime.UtcNow
            });

            entries.Add(new JournalEntry
            {
                CompanyId = companyId,
                AccountId = inventory.Id,
                TransactionDate = DateTime.UtcNow,
                TransactionNumber = transactionNumber,
                Description = $"Inventory adjustment: {reason} - {item.Name}",
                DebitAmount = 0,
                CreditAmount = adjustmentAmount,
                ReferenceType = "InventoryAdjustment",
                ReferenceId = itemId,
                SequenceNumber = sequenceNumber + 1,
                CreatedByUserId = ConvertUserIdToInt(userId),
                CreatedAt = DateTime.UtcNow
            });
        }

        if (entries.Any())
        {
            _context.JournalEntries.AddRange(entries);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created inventory adjustment journal entries for item {ItemId}", itemId);
        }
    }

    public async Task<int> GetNextSequenceNumberAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var lastSequence = await _context.JournalEntries
            .Where(je => je.CompanyId == companyId)
            .MaxAsync(je => (int?)je.SequenceNumber, cancellationToken) ?? 0;

        return lastSequence + 1;
    }

    public async Task<bool> ValidateJournalEntriesBalancedAsync(string transactionNumber, int companyId, CancellationToken cancellationToken = default)
    {
        var entries = await _context.JournalEntries
            .Where(je => je.TransactionNumber == transactionNumber && je.CompanyId == companyId)
            .ToListAsync(cancellationToken);

        var totalDebits = entries.Sum(e => e.DebitAmount);
        var totalCredits = entries.Sum(e => e.CreditAmount);

        var isBalanced = Math.Abs(totalDebits - totalCredits) < 0.01m; // Allow for minor rounding differences

        if (!isBalanced)
        {
            _logger.LogWarning("Journal entries for transaction {TransactionNumber} are not balanced. Debits: {Debits}, Credits: {Credits}",
                transactionNumber, totalDebits, totalCredits);
        }

        return isBalanced;
    }

    private async Task<ChartOfAccount> GetAccountByTypeAsync(int companyId, string accountName, AccountType accountType, CancellationToken cancellationToken)
    {
        var account = await _context.ChartOfAccounts
            .FirstOrDefaultAsync(a => a.CompanyId == companyId && 
                                      a.Name.Contains(accountName) && 
                                      a.Type == accountType && 
                                      a.IsActive, cancellationToken);

        if (account == null)
        {
            throw new InvalidOperationException($"Account '{accountName}' of type '{accountType}' not found for company {companyId}");
        }

        return account;
    }

    private async Task<ChartOfAccount> GetCashAccountByPaymentMethodAsync(int companyId, string paymentMethod, CancellationToken cancellationToken)
    {
        string accountName = paymentMethod.ToLower() switch
        {
            "cash" => "Cash",
            "check" => "Checking Account",
            "credit card" => "Checking Account", // Assuming credit card payments go to checking
            "bank transfer" => "Checking Account",
            _ => "Checking Account"
        };

        return await GetAccountByTypeAsync(companyId, accountName, AccountType.Asset, cancellationToken);
    }

    /// <summary>
    /// Convert string userId to int, returning null if conversion fails
    /// </summary>
    /// <param name="userId">User ID as string</param>
    /// <returns>User ID as int or null</returns>
    private static int? ConvertUserIdToInt(string userId)
    {
        if (string.IsNullOrEmpty(userId))
            return null;
        
        return int.TryParse(userId, out int result) ? result : null;
    }
}
