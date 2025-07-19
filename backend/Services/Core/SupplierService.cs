using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Suppliers;
using backend.DTOs.Core;
using backend.DTOs.Shared;
using backend.Services.Core;
using backend.Services.Interfaces;

namespace backend.Services.Core;

/// <summary>
/// Supplier-specific service extending BusinessEntityService
/// Reduced code duplication through inheritance
/// </summary>
public class SupplierService : BusinessEntityService<Supplier, SupplierDto>, ISupplierService
{
    public SupplierService(AccountingDbContext context, ILogger<BaseService<Supplier>> logger) 
        : base(context, logger) { }

    protected override DbSet<Supplier> DbSet => _context.Suppliers;
    protected override string CompanyIdPropertyName => nameof(Supplier.CompanyId);

    /// <summary>
    /// Map Supplier entity to SupplierDto
    /// </summary>
    protected override SupplierDto MapToDto(Supplier supplier)
    {
        return new SupplierDto
        {
            Id = supplier.Id,
            CompanyId = supplier.CompanyId,
            Name = supplier.Name,
            Address = supplier.Address ?? string.Empty,
            Contact = supplier.Contact ?? string.Empty,
            Phone = supplier.Phone,
            Email = supplier.Email,
            Website = supplier.Website,
            TaxId = supplier.TaxId,
            VatNumber = supplier.VatNumber,
            PaymentTermsDays = supplier.PaymentTermsDays,
            IsActive = supplier.IsActive,
            CreatedAt = supplier.CreatedAt,
            UpdatedAt = supplier.UpdatedAt
        };
    }

    /// <summary>
    /// Get suppliers with pagination and filtering - delegates to base class
    /// </summary>
    public async Task<PaginatedResponse<SupplierDto>> GetSuppliersAsync(
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
    /// Get supplier by ID - delegates to base class
    /// </summary>
    public async Task<SupplierDto?> GetSupplierAsync(int id, int companyId, CancellationToken cancellationToken = default)
    {
        return await GetEntityAsync(id, companyId, cancellationToken);
    }

    /// <summary>
    /// Get supplier statistics
    /// </summary>
    public async Task<SupplierStats> GetSupplierStatsAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var suppliers = await _context.Suppliers
            .Where(s => s.CompanyId == companyId)
            .ToListAsync(cancellationToken);

        var totalSuppliers = suppliers.Count;
        var activeSuppliers = suppliers.Count(s => s.IsActive);

        // Calculate purchase orders total (if purchase orders exist)
        var totalPurchaseOrders = await _context.PurchaseOrders
            .Where(po => po.CompanyId == companyId)
            .SumAsync(po => po.TotalAmount, cancellationToken);

        // Calculate outstanding payables (if purchase invoices exist)
        var outstandingPayables = await _context.PurchaseInvoices
            .Where(pi => pi.CompanyId == companyId && pi.PaidAmount < pi.TotalAmount)
            .SumAsync(pi => pi.TotalAmount - pi.PaidAmount, cancellationToken);

        return new SupplierStats
        {
            TotalSuppliers = totalSuppliers,
            ActiveSuppliers = activeSuppliers,
            InactiveSuppliers = totalSuppliers - activeSuppliers,
            TotalPurchaseOrders = totalPurchaseOrders,
            OutstandingPayables = outstandingPayables,
            LastUpdated = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Get supplier payment terms
    /// </summary>
    public async Task<int> GetPaymentTermsAsync(int supplierId, int companyId, CancellationToken cancellationToken = default)
    {
        var supplier = await _context.Suppliers
            .Where(s => s.Id == supplierId && s.CompanyId == companyId)
            .FirstOrDefaultAsync(cancellationToken);

        return supplier?.PaymentTermsDays ?? 30; // Default to 30 days if not found
    }

    /// <summary>
    /// Validate supplier tax ID using shared validation helper
    /// </summary>
    public bool ValidateTaxId(string? taxId)
    {
        return BusinessValidationHelper.ValidateIsraeliTaxId(taxId);
    }

    /// <summary>
    /// Get suppliers by active status - delegates to base class
    /// </summary>
    public new async Task<IEnumerable<Supplier>> GetByActiveStatusAsync(int companyId, bool isActive, CancellationToken cancellationToken = default)
    {
        return await base.GetByActiveStatusAsync(companyId, isActive, cancellationToken);
    }

    /// <summary>
    /// Search suppliers by term - delegates to base class
    /// </summary>
    public new async Task<IEnumerable<Supplier>> SearchAsync(int companyId, string searchTerm, CancellationToken cancellationToken = default)
    {
        return await base.SearchAsync(companyId, searchTerm, cancellationToken);
    }
}