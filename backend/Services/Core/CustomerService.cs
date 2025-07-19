using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Sales;
using backend.DTOs.Core;
using backend.DTOs.Shared;
using backend.Services.Core;
using backend.Services.Interfaces;

namespace backend.Services.Core;

/// <summary>
/// Customer-specific service extending BusinessEntityService
/// Reduced code duplication through inheritance
/// </summary>
public class CustomerService : BusinessEntityService<Customer, CustomerDto>, ICustomerService
{
    public CustomerService(AccountingDbContext context, ILogger<BaseService<Customer>> logger) 
        : base(context, logger) { }

    protected override DbSet<Customer> DbSet => _context.Customers;
    protected override string CompanyIdPropertyName => nameof(Customer.CompanyId);

    /// <summary>
    /// Map Customer entity to CustomerDto
    /// </summary>
    protected override CustomerDto MapToDto(Customer customer)
    {
        return new CustomerDto
        {
            Id = customer.Id,
            CompanyId = customer.CompanyId,
            Name = customer.Name,
            Address = customer.Address ?? string.Empty,
            Contact = customer.Contact ?? customer.Name,
            TaxId = customer.TaxId,
            Email = customer.Email,
            Phone = customer.Phone,
            Website = customer.Website,
            PaymentTerms = customer.PaymentTermsDays,
            CreditLimit = customer.CreditLimit,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt
        };
    }

    /// <summary>
    /// Get customers with pagination and filtering - delegates to base class
    /// </summary>
    public async Task<PaginatedResponse<CustomerDto>> GetCustomersAsync(
        int companyId, 
        string? searchTerm = null, 
        bool? isActive = null,
        int page = 1, 
        int pageSize = 25, 
        CancellationToken cancellationToken = default)
    {
        return await GetEntitiesAsync(companyId, searchTerm, isActive, page, pageSize, cancellationToken);
    }

    /// <summary>
    /// Get customer by ID - delegates to base class
    /// </summary>
    public async Task<CustomerDto?> GetCustomerAsync(int id, int companyId, CancellationToken cancellationToken = default)
    {
        return await GetEntityAsync(id, companyId, cancellationToken);
    }
}
