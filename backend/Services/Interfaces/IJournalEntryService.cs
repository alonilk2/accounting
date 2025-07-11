using backend.Models.Accounting;

namespace backend.Services.Interfaces;

/// <summary>
/// Service for managing journal entries in the double-entry accounting system
/// Handles automatic journal entry creation for business transactions
/// </summary>
public interface IJournalEntryService
{
    /// <summary>
    /// Create journal entries for a sales transaction
    /// </summary>
    Task CreateSalesJournalEntriesAsync(int salesOrderId, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create journal entries for a payment receipt
    /// </summary>
    Task CreatePaymentReceiptJournalEntriesAsync(int receiptId, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create journal entries for a purchase transaction
    /// </summary>
    Task CreatePurchaseJournalEntriesAsync(int purchaseOrderId, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create journal entries for a payment made
    /// </summary>
    Task CreatePaymentMadeJournalEntriesAsync(int paymentId, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create inventory adjustment journal entries
    /// </summary>
    Task CreateInventoryAdjustmentJournalEntriesAsync(int itemId, decimal quantityChange, decimal valueChange, int companyId, string userId, string reason, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get next sequence number for journal entries
    /// </summary>
    Task<int> GetNextSequenceNumberAsync(int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validate that journal entries are balanced (total debits = total credits)
    /// </summary>
    Task<bool> ValidateJournalEntriesBalancedAsync(string transactionNumber, int companyId, CancellationToken cancellationToken = default);
}
