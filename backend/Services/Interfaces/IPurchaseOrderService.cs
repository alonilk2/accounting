using backend.Models.Purchasing;

namespace backend.Services.Interfaces;

/// <summary>
/// Purchase order management service interface
/// Handles purchase order lifecycle, supplier management, and procurement workflows
/// </summary>
public interface IPurchaseOrderService : IBaseService<PurchaseOrder>
{
    /// <summary>
    /// Create a new purchase order with line items
    /// </summary>
    /// <param name="purchaseOrder">Purchase order with line items</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created purchase order with calculated totals</returns>
    Task<PurchaseOrder> CreatePurchaseOrderAsync(PurchaseOrder purchaseOrder, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update purchase order status
    /// </summary>
    /// <param name="purchaseOrderId">Purchase order ID</param>
    /// <param name="status">New status</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated purchase order</returns>
    Task<PurchaseOrder> UpdateStatusAsync(int purchaseOrderId, PurchaseOrderStatus status, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Receive goods from purchase order
    /// </summary>
    /// <param name="purchaseOrderId">Purchase order ID</param>
    /// <param name="receivedItems">Items and quantities received</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated purchase order</returns>
    Task<PurchaseOrder> ReceiveGoodsAsync(int purchaseOrderId, List<ReceivedItem> receivedItems, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Process payment for a purchase order
    /// </summary>
    /// <param name="purchaseOrderId">Purchase order ID</param>
    /// <param name="paymentAmount">Payment amount</param>
    /// <param name="paymentMethod">Payment method</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Payment record</returns>
    Task<Payment> ProcessPaymentAsync(int purchaseOrderId, decimal paymentAmount, string paymentMethod, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get purchase orders by supplier
    /// </summary>
    /// <param name="supplierId">Supplier ID</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Supplier purchase orders</returns>
    Task<IEnumerable<PurchaseOrder>> GetBySupplierAsync(int supplierId, int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get outstanding purchase orders (pending payment)
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Outstanding purchase orders</returns>
    Task<IEnumerable<PurchaseOrder>> GetOutstandingOrdersAsync(int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate purchase order totals including tax
    /// </summary>
    /// <param name="purchaseOrder">Purchase order with line items</param>
    /// <returns>Purchase order with calculated totals</returns>
    PurchaseOrder CalculateTotals(PurchaseOrder purchaseOrder);

    /// <summary>
    /// Get purchase summary for a date range
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="fromDate">Start date</param>
    /// <param name="toDate">End date</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Purchase summary</returns>
    Task<PurchaseSummary> GetPurchaseSummaryAsync(int companyId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate suggested purchase orders based on reorder points
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Suggested purchase orders grouped by supplier</returns>
    Task<IEnumerable<SuggestedPurchaseOrder>> GenerateSuggestedOrdersAsync(int companyId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Received item information for goods receipt
/// </summary>
public class ReceivedItem
{
    public int ItemId { get; set; }
    public decimal QuantityReceived { get; set; }
    public decimal? UnitCost { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Purchase summary data
/// </summary>
public class PurchaseSummary
{
    public decimal TotalPurchases { get; set; }
    public decimal TotalTax { get; set; }
    public decimal NetPurchases { get; set; }
    public int OrderCount { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int UniqueSuppliers { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
}

/// <summary>
/// Suggested purchase order based on reorder points
/// </summary>
public class SuggestedPurchaseOrder
{
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public List<SuggestedPurchaseItem> Items { get; set; } = new();
    public decimal EstimatedTotal { get; set; }
}

/// <summary>
/// Suggested purchase item
/// </summary>
public class SuggestedPurchaseItem
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal ReorderPoint { get; set; }
    public decimal SuggestedQuantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal EstimatedCost { get; set; }
}
