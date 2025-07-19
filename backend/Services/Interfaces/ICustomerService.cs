using backend.Models.Core;
using backend.Models.Sales;
using backend.DTOs.Core;
using backend.DTOs.Shared;

namespace backend.Services.Interfaces;

/// <summary>
/// Interface for Customer Service operations
/// </summary>
public interface ICustomerService : IBaseService<Customer>
{
    /// <summary>
    /// Get customers with pagination and filtering
    /// </summary>
    Task<PaginatedResponse<CustomerDto>> GetCustomersAsync(
        int companyId, 
        string? searchTerm = null, 
        bool? isActive = null,
        int page = 1, 
        int pageSize = 25, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get customer by ID
    /// </summary>
    Task<CustomerDto?> GetCustomerAsync(int id, int companyId, CancellationToken cancellationToken = default);
}
