using backend.Controllers;

namespace backend.Services.Interfaces;

/// <summary>
/// Service interface for customer document operations
/// </summary>
public interface ICustomerDocumentService
{
    /// <summary>
    /// Gets all documents for a specific customer
    /// </summary>
    /// <param name="customerId">Customer ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="fromDate">Optional start date filter</param>
    /// <param name="toDate">Optional end date filter</param>
    /// <param name="documentType">Optional document type filter</param>
    /// <returns>Customer documents response</returns>
    Task<CustomerDocumentsResponseDto?> GetCustomerDocumentsAsync(
        int customerId,
        int companyId,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? documentType = null);

    /// <summary>
    /// Gets document summary statistics for a customer
    /// </summary>
    /// <param name="customerId">Customer ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Document statistics</returns>
    Task<CustomerDocumentStatsDto?> GetCustomerDocumentStatsAsync(int customerId, int companyId);
}

/// <summary>
/// DTO for customer document statistics
/// </summary>
public class CustomerDocumentStatsDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int TotalSalesOrders { get; set; }
    public int TotalReceipts { get; set; }
    public int TotalPOSSales { get; set; }
    public decimal TotalSalesAmount { get; set; }
    public decimal TotalReceiptsAmount { get; set; }
    public decimal OutstandingAmount { get; set; }
    public DateTime? LastDocumentDate { get; set; }
    public DateTime? FirstDocumentDate { get; set; }
}
