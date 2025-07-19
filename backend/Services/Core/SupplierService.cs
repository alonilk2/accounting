using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Core;
using backend.Models.Suppliers;
using backend.DTOs.Core;
using backend.DTOs.Shared;
using backend.Services.Core;
using backend.Services.Interfaces;

namespace backend.Services.Core;

/// <summary>
/// Supplier-specific service providing paginated supplier operations
/// </summary>
public class SupplierService : BaseService<Supplier>, ISupplierService
{
    public SupplierService(AccountingDbContext context, ILogger<BaseService<Supplier>> logger) 
        : base(context, logger) { }

    protected override DbSet<Supplier> DbSet => _context.Suppliers;
    protected override string CompanyIdPropertyName => nameof(Supplier.CompanyId);

    /// <summary>
    /// Get suppliers with pagination and filtering
    /// </summary>
    public async Task<PaginatedResponse<SupplierDto>> GetSuppliersAsync(
        int companyId, 
        string? searchTerm = null, 
        bool? isActive = null,
        int page = 1, 
        int pageSize = 25, 
        CancellationToken cancellationToken = default)
    {
        var query = _context.Suppliers
            .Where(s => s.CompanyId == companyId)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(searchTerm))
        {
            var lowerSearchTerm = searchTerm.ToLower();
            query = query.Where(s => 
                s.Name.ToLower().Contains(lowerSearchTerm) ||
                (s.TaxId != null && s.TaxId.Contains(searchTerm)) ||
                (s.VatNumber != null && s.VatNumber.Contains(searchTerm)) ||
                (s.Email != null && s.Email.ToLower().Contains(lowerSearchTerm)) ||
                (s.Phone != null && s.Phone.Contains(searchTerm)));
        }

        // Apply active filter
        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and ordering
        var suppliers = await query
            .OrderBy(s => s.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SupplierDto
            {
                Id = s.Id,
                CompanyId = s.CompanyId,
                Name = s.Name,
                Address = s.Address ?? string.Empty,
                Contact = s.Contact ?? string.Empty,
                Phone = s.Phone,
                Email = s.Email,
                Website = s.Website,
                TaxId = s.TaxId,
                VatNumber = s.VatNumber,
                PaymentTermsDays = s.PaymentTermsDays,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return PaginatedResponse<SupplierDto>.Create(suppliers, page, pageSize, totalCount);
    }

    /// <summary>
    /// Get supplier by ID
    /// </summary>
    public async Task<SupplierDto?> GetSupplierAsync(int id, int companyId, CancellationToken cancellationToken = default)
    {
        return await _context.Suppliers
            .Where(s => s.Id == id && s.CompanyId == companyId)
            .Select(s => new SupplierDto
            {
                Id = s.Id,
                CompanyId = s.CompanyId,
                Name = s.Name,
                Address = s.Address ?? string.Empty,
                Contact = s.Contact ?? string.Empty,
                Phone = s.Phone,
                Email = s.Email,
                Website = s.Website,
                TaxId = s.TaxId,
                VatNumber = s.VatNumber,
                PaymentTermsDays = s.PaymentTermsDays,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    /// <summary>
    /// Get suppliers by active status
    /// </summary>
    public async Task<IEnumerable<Supplier>> GetByActiveStatusAsync(int companyId, bool isActive, CancellationToken cancellationToken = default)
    {
        return await _context.Suppliers
            .Where(s => s.CompanyId == companyId && s.IsActive == isActive)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Search suppliers by name, contact, or tax ID
    /// </summary>
    public async Task<IEnumerable<Supplier>> SearchAsync(int companyId, string searchTerm, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(searchTerm))
        {
            return await _context.Suppliers
                .Where(s => s.CompanyId == companyId)
                .OrderBy(s => s.Name)
                .ToListAsync(cancellationToken);
        }

        var lowerSearchTerm = searchTerm.ToLower();
        return await _context.Suppliers
            .Where(s => s.CompanyId == companyId && (
                s.Name.ToLower().Contains(lowerSearchTerm) ||
                (s.TaxId != null && s.TaxId.Contains(searchTerm)) ||
                (s.VatNumber != null && s.VatNumber.Contains(searchTerm)) ||
                (s.Email != null && s.Email.ToLower().Contains(lowerSearchTerm)) ||
                (s.Phone != null && s.Phone.Contains(searchTerm))))
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
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
    /// Validate supplier tax ID using Israeli validation algorithm
    /// </summary>
    public bool ValidateTaxId(string? taxId)
    {
        if (string.IsNullOrEmpty(taxId))
            return false;

        // Remove any non-digits
        var cleanTaxId = new string(taxId.Where(char.IsDigit).ToArray());

        // Israeli tax ID should be 9 digits
        if (cleanTaxId.Length != 9)
            return false;

        // Calculate checksum using Israeli algorithm
        var checksum = 0;
        for (int i = 0; i < 8; i++)
        {
            var digit = int.Parse(cleanTaxId[i].ToString());
            var multiplier = (i % 2) + 1;
            var product = digit * multiplier;
            checksum += product > 9 ? product - 9 : product;
        }

        var expectedCheckDigit = (10 - (checksum % 10)) % 10;
        var actualCheckDigit = int.Parse(cleanTaxId[8].ToString());

        return expectedCheckDigit == actualCheckDigit;
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
}
