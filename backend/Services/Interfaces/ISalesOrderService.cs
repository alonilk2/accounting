using backend.Models.Sales;

namespace backend.Services.Interfaces;

/// <summary>
/// Sales order management service interface
/// Handles sales order lifecycle, invoicing, and payment processing
/// </summary>
public interface ISalesOrderService : IBaseService<SalesOrder>
{
    /// <summary>
    /// Create a new sales order with line items
    /// </summary>
    /// <param name="salesOrder">Sales order with line items</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created sales order with calculated totals</returns>
    Task<SalesOrder> CreateSalesOrderAsync(SalesOrder salesOrder, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update sales order status
    /// </summary>
    /// <param name="salesOrderId">Sales order ID</param>
    /// <param name="status">New status</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated sales order</returns>
    Task<SalesOrder> UpdateStatusAsync(int salesOrderId, SalesOrderStatus status, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Process payment for a sales order
    /// </summary>
    /// <param name="salesOrderId">Sales order ID</param>
    /// <param name="paymentAmount">Payment amount</param>
    /// <param name="paymentMethod">Payment method</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Payment receipt</returns>
    Task<Receipt> ProcessPaymentAsync(int salesOrderId, decimal paymentAmount, string paymentMethod, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get sales orders by customer
    /// </summary>
    /// <param name="customerId">Customer ID</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Customer sales orders</returns>
    Task<IEnumerable<SalesOrder>> GetByCustomerAsync(int customerId, int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get overdue sales orders
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Overdue sales orders</returns>
    Task<IEnumerable<SalesOrder>> GetOverdueOrdersAsync(int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate sales order totals including tax
    /// </summary>
    /// <param name="salesOrder">Sales order with line items</param>
    /// <returns>Sales order with calculated totals</returns>
    SalesOrder CalculateTotals(SalesOrder salesOrder);

    /// <summary>
    /// Get sales summary for a date range
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="fromDate">Start date</param>
    /// <param name="toDate">End date</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Sales summary</returns>
    Task<SalesSummary> GetSalesSummaryAsync(int companyId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Recalculate and update the PaidAmount for a sales order based on its receipts
    /// </summary>
    /// <param name="salesOrderId">Sales order ID</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated sales order</returns>
    Task<SalesOrder> RecalculatePaidAmountAsync(int salesOrderId, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Recalculate PaidAmount for all sales orders in a company
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="userId">User ID for audit</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of orders updated</returns>
    Task<int> RecalculateAllPaidAmountsAsync(int companyId, string userId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Sales summary data
/// </summary>
public class SalesSummary
{
    public decimal TotalSales { get; set; }
    public decimal TotalTax { get; set; }
    public decimal NetSales { get; set; }
    public int OrderCount { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int UniqueCustomers { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
}
