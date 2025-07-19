using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Core;
using backend.Models.Sales;
using backend.DTOs.Core;
using backend.DTOs.Shared;
using backend.Services.Core;
using backend.Services.Interfaces;

namespace backend.Services.Core;

/// <summary>
/// Customer-specific service providing paginated customer operations
/// </summary>
public class CustomerService : BaseService<Customer>, ICustomerService
{
    public CustomerService(AccountingDbContext context, ILogger<BaseService<Customer>> logger) 
        : base(context, logger) { }

    protected override DbSet<Customer> DbSet => _context.Customers;
    protected override string CompanyIdPropertyName => nameof(Customer.CompanyId);

    /// <summary>
    /// Get customers with pagination and filtering
    /// </summary>
    public async Task<PaginatedResponse<CustomerDto>> GetCustomersAsync(
        int companyId, 
        string? searchTerm = null, 
        bool? isActive = null,
        int page = 1, 
        int pageSize = 25, 
        CancellationToken cancellationToken = default)
    {
        var query = _context.Customers
            .Where(c => c.CompanyId == companyId)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(searchTerm))
        {
            var lowerSearchTerm = searchTerm.ToLower();
            query = query.Where(c => 
                c.Name.ToLower().Contains(lowerSearchTerm) ||
                (c.TaxId != null && c.TaxId.Contains(searchTerm)) ||
                (c.Email != null && c.Email.ToLower().Contains(lowerSearchTerm)) ||
                (c.Phone != null && c.Phone.Contains(searchTerm)));
        }

        // Apply active filter
        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and ordering
        var customers = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                CompanyId = c.CompanyId,
                Name = c.Name,
                Address = c.Address ?? string.Empty,
                Contact = c.Contact ?? c.Name,
                TaxId = c.TaxId,
                Email = c.Email,
                Phone = c.Phone,
                Website = c.Website,
                PaymentTerms = c.PaymentTermsDays,
                CreditLimit = c.CreditLimit,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return PaginatedResponse<CustomerDto>.Create(customers, page, pageSize, totalCount);
    }

    /// <summary>
    /// Get customer by ID
    /// </summary>
    public async Task<CustomerDto?> GetCustomerAsync(int id, int companyId, CancellationToken cancellationToken = default)
    {
        return await _context.Customers
            .Where(c => c.Id == id && c.CompanyId == companyId)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                CompanyId = c.CompanyId,
                Name = c.Name,
                Address = c.Address ?? string.Empty,
                Contact = c.Contact ?? c.Name,
                TaxId = c.TaxId,
                Email = c.Email,
                Phone = c.Phone,
                Website = c.Website,
                PaymentTerms = c.PaymentTermsDays,
                CreditLimit = c.CreditLimit,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
    }
}
