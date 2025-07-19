using backend.Models.Suppliers;
using backend.DTOs.Core;
using backend.DTOs.Shared;

namespace backend.Services.Interfaces;

/// <summary>
/// Supplier management service interface
/// Handles supplier lifecycle, contact management, and supplier-specific operations
/// </summary>
public interface ISupplierService : IBaseService<Supplier>
{
    /// <summary>
    /// Get suppliers by active status
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="isActive">Active status filter</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Filtered suppliers</returns>
    Task<IEnumerable<Supplier>> GetByActiveStatusAsync(int companyId, bool isActive, CancellationToken cancellationToken = default);

    /// <summary>
    /// Search suppliers by name, contact, or tax ID
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="searchTerm">Search term</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Matching suppliers</returns>
    Task<IEnumerable<Supplier>> SearchAsync(int companyId, string searchTerm, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get supplier statistics
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Supplier statistics</returns>
    Task<SupplierStats> GetSupplierStatsAsync(int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validate supplier tax ID using Israeli validation algorithm
    /// </summary>
    /// <param name="taxId">Tax ID to validate</param>
    /// <returns>True if valid</returns>
    bool ValidateTaxId(string? taxId);

    /// <summary>
    /// Get supplier payment terms
    /// </summary>
    /// <param name="supplierId">Supplier ID</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Payment terms in days</returns>
    Task<int> GetPaymentTermsAsync(int supplierId, int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get suppliers with pagination and filtering
    /// </summary>
    Task<PaginatedResponse<SupplierDto>> GetSuppliersAsync(
        int companyId, 
        string? searchTerm = null, 
        bool? isActive = null,
        int page = 1, 
        int pageSize = 25, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get supplier by ID
    /// </summary>
    Task<SupplierDto?> GetSupplierAsync(int id, int companyId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Supplier statistics data
/// </summary>
public class SupplierStats
{
    public int TotalSuppliers { get; set; }
    public int ActiveSuppliers { get; set; }
    public int InactiveSuppliers { get; set; }
    public decimal TotalPurchaseOrders { get; set; }
    public decimal OutstandingPayables { get; set; }
    public DateTime LastUpdated { get; set; }
}
