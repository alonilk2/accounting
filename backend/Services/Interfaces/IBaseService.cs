using backend.Models.Core;

namespace backend.Services.Interfaces;

/// <summary>
/// Base service interface providing common CRUD operations for entities
/// Includes multi-tenant support and audit trail functionality
/// </summary>
/// <typeparam name="T">Entity type that inherits from BaseEntity</typeparam>
public interface IBaseService<T> where T : BaseEntity
{
    /// <summary>
    /// Get entity by ID with company context for multi-tenant isolation
    /// </summary>
    /// <param name="id">Entity ID</param>
    /// <param name="companyId">Company ID for tenant isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Entity or null if not found</returns>
    Task<T?> GetByIdAsync(int id, int companyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all entities for a company with pagination and filtering
    /// </summary>
    /// <param name="companyId">Company ID for tenant isolation</param>
    /// <param name="pageNumber">Page number (1-based)</param>
    /// <param name="pageSize">Number of records per page</param>
    /// <param name="searchTerm">Optional search term</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of entities</returns>
    Task<(IEnumerable<T> Items, int TotalCount)> GetAllAsync(
        int companyId, 
        int pageNumber = 1, 
        int pageSize = 50, 
        string? searchTerm = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new entity with audit information
    /// </summary>
    /// <param name="entity">Entity to create</param>
    /// <param name="companyId">Company ID for tenant isolation</param>
    /// <param name="userId">User ID for audit trail</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created entity with ID</returns>
    Task<T> CreateAsync(T entity, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing entity with audit information
    /// </summary>
    /// <param name="entity">Entity to update</param>
    /// <param name="companyId">Company ID for tenant isolation</param>
    /// <param name="userId">User ID for audit trail</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated entity</returns>
    Task<T> UpdateAsync(T entity, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft delete an entity (mark as deleted)
    /// </summary>
    /// <param name="id">Entity ID</param>
    /// <param name="companyId">Company ID for tenant isolation</param>
    /// <param name="userId">User ID for audit trail</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteAsync(int id, int companyId, string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if entity exists for the given company
    /// </summary>
    /// <param name="id">Entity ID</param>
    /// <param name="companyId">Company ID for tenant isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if exists</returns>
    Task<bool> ExistsAsync(int id, int companyId, CancellationToken cancellationToken = default);
}
