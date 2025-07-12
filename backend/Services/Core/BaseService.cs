using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.Models.Core;
using backend.Models.Audit;
using backend.Services.Interfaces;

namespace backend.Services.Core;

/// <summary>
/// Base service implementation providing common CRUD operations with multi-tenant support
/// Includes audit logging, error handling, and performance optimization
/// </summary>
/// <typeparam name="T">Entity type that inherits from BaseEntity</typeparam>
public abstract class BaseService<T> : IBaseService<T> where T : BaseEntity
{
    protected readonly AccountingDbContext _context;
    protected readonly ILogger<BaseService<T>> _logger;

    protected BaseService(AccountingDbContext context, ILogger<BaseService<T>> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get the DbSet for the entity type
    /// </summary>
    protected abstract DbSet<T> DbSet { get; }

    /// <summary>
    /// Get the company ID property name for the entity (for multi-tenant filtering)
    /// </summary>
    protected abstract string CompanyIdPropertyName { get; }

    /// <summary>
    /// Apply company filter to queryable for multi-tenant isolation
    /// </summary>
    /// <param name="query">Base query</param>
    /// <param name="companyId">Company ID</param>
    /// <returns>Filtered query</returns>
    protected virtual IQueryable<T> ApplyCompanyFilter(IQueryable<T> query, int companyId)
    {
        return query.Where(e => EF.Property<int>(e, CompanyIdPropertyName) == companyId);
    }

    /// <summary>
    /// Apply search filter to queryable
    /// </summary>
    /// <param name="query">Base query</param>
    /// <param name="searchTerm">Search term</param>
    /// <returns>Filtered query</returns>
    protected virtual IQueryable<T> ApplySearchFilter(IQueryable<T> query, string searchTerm)
    {
        // Override in derived classes to implement entity-specific search
        return query;
    }

    public virtual async Task<T?> GetByIdAsync(int id, int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting {EntityType} with ID {Id} for company {CompanyId}", typeof(T).Name, id, companyId);

            var query = DbSet.AsNoTracking()
                .Where(e => !e.IsDeleted && e.Id == id);

            query = ApplyCompanyFilter(query, companyId);

            return await query.FirstOrDefaultAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting {EntityType} with ID {Id} for company {CompanyId}", typeof(T).Name, id, companyId);
            throw;
        }
    }

    public virtual async Task<(IEnumerable<T> Items, int TotalCount)> GetAllAsync(
        int companyId, 
        int pageNumber = 1, 
        int pageSize = 50, 
        string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting {EntityType} list for company {CompanyId}, page {Page}, size {Size}", 
                typeof(T).Name, companyId, pageNumber, pageSize);

            // Validate pagination parameters
            pageNumber = Math.Max(1, pageNumber);
            pageSize = Math.Min(Math.Max(1, pageSize), 1000); // Cap at 1000 records

            var query = DbSet.AsNoTracking()
                .Where(e => !e.IsDeleted);

            query = ApplyCompanyFilter(query, companyId);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = ApplySearchFilter(query, searchTerm.Trim());
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply pagination
            var items = await query
                .OrderByDescending(e => e.UpdatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            _logger.LogDebug("Retrieved {Count} {EntityType} records out of {Total} for company {CompanyId}", 
                items.Count, typeof(T).Name, totalCount, companyId);

            return (items, totalCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting {EntityType} list for company {CompanyId}", typeof(T).Name, companyId);
            throw;
        }
    }

    public virtual async Task<T> CreateAsync(T entity, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Creating new {EntityType} for company {CompanyId} by user {UserId}", 
                typeof(T).Name, companyId, userId);

            // Set audit fields
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.CreatedBy = userId;
            entity.UpdatedBy = userId;
            entity.IsDeleted = false;

            // Set company ID
            var companyProperty = entity.GetType().GetProperty(CompanyIdPropertyName);
            if (companyProperty != null)
            {
                companyProperty.SetValue(entity, companyId);
            }

            DbSet.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            // Log audit trail
            await LogAuditAsync(entity.Id, companyId, userId, "CREATE", $"Created {typeof(T).Name}", cancellationToken);

            _logger.LogInformation("Created {EntityType} with ID {Id} for company {CompanyId}", 
                typeof(T).Name, entity.Id, companyId);

            return entity;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating {EntityType} for company {CompanyId}", typeof(T).Name, companyId);
            throw;
        }
    }

    public virtual async Task<T> UpdateAsync(T entity, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Updating {EntityType} with ID {Id} for company {CompanyId} by user {UserId}", 
                typeof(T).Name, entity.Id, companyId, userId);

            // Verify entity exists and belongs to company
            var existing = await GetByIdAsync(entity.Id, companyId, cancellationToken);
            if (existing == null)
            {
                throw new InvalidOperationException($"{typeof(T).Name} with ID {entity.Id} not found for company {companyId}");
            }

            // Update audit fields
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedBy = userId;

            // Ensure company ID cannot be changed
            var companyProperty = entity.GetType().GetProperty(CompanyIdPropertyName);
            if (companyProperty != null)
            {
                companyProperty.SetValue(entity, companyId);
            }

            _context.Entry(entity).State = EntityState.Modified;
            await _context.SaveChangesAsync(cancellationToken);

            // Log audit trail
            await LogAuditAsync(entity.Id, companyId, userId, "UPDATE", $"Updated {typeof(T).Name}", cancellationToken);

            _logger.LogInformation("Updated {EntityType} with ID {Id} for company {CompanyId}", 
                typeof(T).Name, entity.Id, companyId);

            return entity;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating {EntityType} with ID {Id} for company {CompanyId}", 
                typeof(T).Name, entity.Id, companyId);
            throw;
        }
    }

    public virtual async Task<bool> DeleteAsync(int id, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Deleting {EntityType} with ID {Id} for company {CompanyId} by user {UserId}", 
                typeof(T).Name, id, companyId, userId);

            var entity = await GetByIdAsync(id, companyId, cancellationToken);
            if (entity == null)
            {
                _logger.LogWarning("{EntityType} with ID {Id} not found for company {CompanyId}", 
                    typeof(T).Name, id, companyId);
                return false;
            }

            // Soft delete
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedBy = userId;

            await _context.SaveChangesAsync(cancellationToken);

            // Log audit trail
            await LogAuditAsync(id, companyId, userId, "DELETE", $"Deleted {typeof(T).Name}", cancellationToken);

            _logger.LogInformation("Deleted {EntityType} with ID {Id} for company {CompanyId}", 
                typeof(T).Name, id, companyId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting {EntityType} with ID {Id} for company {CompanyId}", 
                typeof(T).Name, id, companyId);
            throw;
        }
    }

    public virtual async Task<bool> ExistsAsync(int id, int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = DbSet.AsNoTracking()
                .Where(e => !e.IsDeleted && e.Id == id);

            query = ApplyCompanyFilter(query, companyId);

            return await query.AnyAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking existence of {EntityType} with ID {Id} for company {CompanyId}", 
                typeof(T).Name, id, companyId);
            throw;
        }
    }

    /// <summary>
    /// Log audit trail for entity operations
    /// </summary>
    protected virtual Task LogAuditAsync(int entityId, int companyId, string userId, string action, string details, CancellationToken cancellationToken = default)
    {
        try
        {
            var auditLog = new AuditLog
            {
                CompanyId = companyId,
                UserId = int.TryParse(userId, out int userIdInt) ? userIdInt : 0,
                Action = action,
                EntityType = typeof(T).Name,
                EntityId = entityId,
                Details = details,
                IPAddress = null // Will be set by controller/middleware
            };

            _context.AuditLogs.Add(auditLog);
            // Note: SaveChanges will be called by the main operation
            return Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging audit trail for {EntityType} {EntityId}", typeof(T).Name, entityId);
            // Don't throw - audit logging failure shouldn't break the main operation
            return Task.CompletedTask;
        }
    }
}
