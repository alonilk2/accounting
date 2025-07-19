using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.Models.Core;
using backend.DTOs.Shared;

namespace backend.Services.Core;

/// <summary>
/// Base service for business entities (customers, suppliers) providing common operations
/// Implements code reuse by centralizing shared business logic
/// </summary>
/// <typeparam name="T">Business entity type that inherits from BusinessEntity</typeparam>
/// <typeparam name="TDto">DTO type for the entity</typeparam>
public abstract class BusinessEntityService<T, TDto> : BaseService<T> 
    where T : BusinessEntity
    where TDto : class
{
    protected BusinessEntityService(AccountingDbContext context, ILogger<BaseService<T>> logger) 
        : base(context, logger) { }

    /// <summary>
    /// Apply search filter to business entities - shared logic for name, email, phone, tax ID search
    /// </summary>
    /// <param name="query">Base query</param>
    /// <param name="searchTerm">Search term</param>
    /// <returns>Filtered query</returns>
    protected override IQueryable<T> ApplySearchFilter(IQueryable<T> query, string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return query;

        var lowerSearchTerm = searchTerm.ToLower();
        return query.Where(e =>
            e.Name.ToLower().Contains(lowerSearchTerm) ||
            (e.TaxId != null && e.TaxId.Contains(searchTerm)) ||
            (e.VatNumber != null && e.VatNumber.Contains(searchTerm)) ||
            (e.Email != null && e.Email.ToLower().Contains(lowerSearchTerm)) ||
            (e.Phone != null && e.Phone.Contains(searchTerm)) ||
            (e.Contact != null && e.Contact.ToLower().Contains(lowerSearchTerm)));
    }

    /// <summary>
    /// Get entities with pagination and filtering - shared implementation
    /// </summary>
    public virtual async Task<PaginatedResponse<TDto>> GetEntitiesAsync(
        int companyId, 
        string? searchTerm = null, 
        bool? isActive = null,
        int page = 1, 
        int pageSize = 25, 
        CancellationToken cancellationToken = default)
    {
        var query = DbSet.Where(e => e.CompanyId == companyId).AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = ApplySearchFilter(query, searchTerm);
        }

        // Apply active filter
        if (isActive.HasValue)
        {
            query = query.Where(e => e.IsActive == isActive.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and ordering
        var entities = await query
            .OrderBy(e => e.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = entities.Select(MapToDto).ToList();
        return PaginatedResponse<TDto>.Create(dtos, page, pageSize, totalCount);
    }

    /// <summary>
    /// Get entity by ID and convert to DTO
    /// </summary>
    public virtual async Task<TDto?> GetEntityAsync(int id, int companyId, CancellationToken cancellationToken = default)
    {
        var entity = await DbSet
            .Where(e => e.Id == id && e.CompanyId == companyId)
            .FirstOrDefaultAsync(cancellationToken);

        return entity != null ? MapToDto(entity) : null;
    }

    /// <summary>
    /// Get entities by active status
    /// </summary>
    public virtual async Task<IEnumerable<T>> GetByActiveStatusAsync(int companyId, bool isActive, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(e => e.CompanyId == companyId && e.IsActive == isActive)
            .OrderBy(e => e.Name)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Search entities by term
    /// </summary>
    public virtual async Task<IEnumerable<T>> SearchAsync(int companyId, string searchTerm, CancellationToken cancellationToken = default)
    {
        var query = DbSet.Where(e => e.CompanyId == companyId);

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = ApplySearchFilter(query, searchTerm);
        }

        return await query
            .OrderBy(e => e.Name)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Validate business entity data before save
    /// </summary>
    protected virtual async Task<(bool IsValid, List<string> Errors)> ValidateEntityAsync(T entity, CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();

        // Validate tax ID
        if (!string.IsNullOrEmpty(entity.TaxId) && !BusinessValidationHelper.ValidateIsraeliTaxId(entity.TaxId))
        {
            errors.Add("Invalid tax ID format");
        }

        // Validate email
        if (!BusinessValidationHelper.ValidateEmail(entity.Email))
        {
            errors.Add("Invalid email format");
        }

        // Validate phone
        if (!BusinessValidationHelper.ValidateIsraeliPhone(entity.Phone))
        {
            errors.Add("Invalid phone number format");
        }

        // Validate website
        if (!BusinessValidationHelper.ValidateWebsite(entity.Website))
        {
            errors.Add("Invalid website URL format");
        }

        // Check for duplicate tax ID within company
        if (!string.IsNullOrEmpty(entity.TaxId))
        {
            var existingEntity = await DbSet
                .Where(e => e.CompanyId == entity.CompanyId && 
                           e.TaxId == entity.TaxId && 
                           e.Id != entity.Id &&
                           !e.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingEntity != null)
            {
                errors.Add("Tax ID already exists for another entity in this company");
            }
        }

        return (errors.Count == 0, errors);
    }

    /// <summary>
    /// Clean entity data before saving
    /// </summary>
    protected virtual void CleanEntityData(T entity)
    {
        entity.TaxId = BusinessValidationHelper.CleanTaxId(entity.TaxId);
        entity.Phone = BusinessValidationHelper.CleanPhone(entity.Phone);
        entity.Mobile = BusinessValidationHelper.CleanPhone(entity.Mobile);
        entity.Email = entity.Email?.Trim()?.ToLowerInvariant();
        entity.Name = entity.Name?.Trim();
        entity.Contact = entity.Contact?.Trim();
    }

    /// <summary>
    /// Override create to add validation and cleaning
    /// </summary>
    public override async Task<T> CreateAsync(T entity, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        CleanEntityData(entity);

        var (isValid, errors) = await ValidateEntityAsync(entity, cancellationToken);
        if (!isValid)
        {
            throw new InvalidOperationException($"Validation failed: {string.Join(", ", errors)}");
        }

        return await base.CreateAsync(entity, companyId, userId, cancellationToken);
    }

    /// <summary>
    /// Override update to add validation and cleaning
    /// </summary>
    public override async Task<T> UpdateAsync(T entity, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        CleanEntityData(entity);

        var (isValid, errors) = await ValidateEntityAsync(entity, cancellationToken);
        if (!isValid)
        {
            throw new InvalidOperationException($"Validation failed: {string.Join(", ", errors)}");
        }

        return await base.UpdateAsync(entity, companyId, userId, cancellationToken);
    }

    /// <summary>
    /// Map entity to DTO - to be implemented by derived classes
    /// </summary>
    protected abstract TDto MapToDto(T entity);
}