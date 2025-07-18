using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.Models.Suppliers;
using backend.Services.Interfaces;
using backend.Services.Core;

namespace backend.Services.Suppliers;

/// <summary>
/// Supplier management service with validation and Israeli compliance
/// Handles supplier lifecycle, contact management, and supplier-specific operations
/// </summary>
public class SupplierService : BaseService<Supplier>, ISupplierService
{
    public SupplierService(
        AccountingDbContext context, 
        ILogger<SupplierService> logger) 
        : base(context, logger)
    {
    }

    protected override DbSet<Supplier> DbSet => _context.Suppliers;
    protected override string CompanyIdPropertyName => nameof(Supplier.CompanyId);

    /// <summary>
    /// Apply search filter for suppliers
    /// </summary>
    protected override IQueryable<Supplier> ApplySearchFilter(IQueryable<Supplier> query, string searchTerm)
    {
        return query.Where(s => 
            s.Name.Contains(searchTerm) ||
            (s.Contact != null && s.Contact.Contains(searchTerm)) ||
            (s.TaxId != null && s.TaxId.Contains(searchTerm)) ||
            (s.Email != null && s.Email.Contains(searchTerm)));
    }

    public override async Task<Supplier> CreateAsync(Supplier supplier, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        return await TransactionHelper.ExecuteInTransactionAsync(_context, async (transaction, ct) =>
        {
            _logger.LogInformation("Creating supplier {SupplierName} for company {CompanyId}", 
                supplier.Name, companyId);

            // Validate supplier data
            await ValidateSupplierAsync(supplier, companyId, ct);

            // Set company ID and audit fields
            supplier.CompanyId = companyId;
            supplier.CreatedAt = DateTime.UtcNow;
            supplier.UpdatedAt = DateTime.UtcNow;
            supplier.CreatedBy = userId;
            supplier.UpdatedBy = userId;
            supplier.IsDeleted = false;

            // Set default status if not provided
            if (!supplier.IsActive)
            {
                supplier.IsActive = true;
            }

            // Set default payment terms if not provided
            if (supplier.PaymentTermsDays <= 0)
            {
                supplier.PaymentTermsDays = 30; // Default 30 days
            }

            // Add to context
            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync(ct);

            // Log audit trail
            await LogAuditAsync(supplier.Id, companyId, userId, "CREATE", 
                $"Created supplier {supplier.Name}", ct);

            _logger.LogInformation("Successfully created supplier {SupplierId} with name {SupplierName}", 
                supplier.Id, supplier.Name);

            return supplier;
        }, cancellationToken);
    }

    public override async Task<Supplier> UpdateAsync(Supplier supplier, int companyId, string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Updating supplier {SupplierId} for company {CompanyId}", 
                supplier.Id, companyId);

            // Validate supplier exists and belongs to company
            var existingSupplier = await _context.Suppliers
                .Where(s => s.Id == supplier.Id && s.CompanyId == companyId && !s.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingSupplier == null)
            {
                throw new InvalidOperationException($"Supplier {supplier.Id} not found");
            }

            // Validate updated supplier data
            await ValidateSupplierAsync(supplier, companyId, cancellationToken, supplier.Id);

            // Update audit fields
            supplier.UpdatedAt = DateTime.UtcNow;
            supplier.UpdatedBy = userId;

            await _context.SaveChangesAsync(cancellationToken);

            // Log audit trail
            await LogAuditAsync(supplier.Id, companyId, userId, "UPDATE", 
                $"Updated supplier {supplier.Name}", cancellationToken);

            _logger.LogInformation("Successfully updated supplier {SupplierId}", supplier.Id);

            return supplier;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating supplier {SupplierId}", supplier.Id);
            throw;
        }
    }

    public async Task<IEnumerable<Supplier>> GetByActiveStatusAsync(int companyId, bool isActive, CancellationToken cancellationToken = default)
    {
        return await _context.Suppliers
            .AsNoTracking()
            .Where(s => s.CompanyId == companyId && s.IsActive == isActive && !s.IsDeleted)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Supplier>> SearchAsync(int companyId, string searchTerm, CancellationToken cancellationToken = default)
    {
        var query = _context.Suppliers
            .AsNoTracking()
            .Where(s => s.CompanyId == companyId && !s.IsDeleted);

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = ApplySearchFilter(query, searchTerm);
        }

        return await query
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<SupplierStats> GetSupplierStatsAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var suppliers = await _context.Suppliers
            .AsNoTracking()
            .Where(s => s.CompanyId == companyId && !s.IsDeleted)
            .ToListAsync(cancellationToken);

        var purchaseOrdersTotal = await _context.PurchaseOrders
            .AsNoTracking()
            .Where(po => po.CompanyId == companyId && !po.IsDeleted)
            .SumAsync(po => po.TotalAmount, cancellationToken);

        var outstandingPayables = await _context.PurchaseOrders
            .AsNoTracking()
            .Where(po => po.CompanyId == companyId && 
                        !po.IsDeleted &&
                        po.TotalAmount > po.PaidAmount)
            .SumAsync(po => po.TotalAmount - po.PaidAmount, cancellationToken);

        return new SupplierStats
        {
            TotalSuppliers = suppliers.Count,
            ActiveSuppliers = suppliers.Count(s => s.IsActive),
            InactiveSuppliers = suppliers.Count(s => !s.IsActive),
            TotalPurchaseOrders = purchaseOrdersTotal,
            OutstandingPayables = outstandingPayables,
            LastUpdated = DateTime.UtcNow
        };
    }

    public bool ValidateTaxId(string? taxId)
    {
        if (string.IsNullOrEmpty(taxId))
            return false;

        // Remove any non-digit characters
        var cleanTaxId = new string(taxId.Where(char.IsDigit).ToArray());

        // Israeli tax ID should be 9 digits
        if (cleanTaxId.Length != 9)
            return false;

        // Calculate check digit using Israeli algorithm
        int sum = 0;
        for (int i = 0; i < 8; i++)
        {
            int digit = int.Parse(cleanTaxId[i].ToString());
            int multiplier = (i % 2 == 0) ? 1 : 2;
            int product = digit * multiplier;
            
            if (product > 9)
                product = (product / 10) + (product % 10);
                
            sum += product;
        }

        int checkDigit = (10 - (sum % 10)) % 10;
        int actualCheckDigit = int.Parse(cleanTaxId[8].ToString());

        return checkDigit == actualCheckDigit;
    }

    public async Task<int> GetPaymentTermsAsync(int supplierId, int companyId, CancellationToken cancellationToken = default)
    {
        var supplier = await _context.Suppliers
            .AsNoTracking()
            .Where(s => s.Id == supplierId && s.CompanyId == companyId && !s.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);

        return supplier?.PaymentTermsDays ?? 30; // Default to 30 days
    }

    /// <summary>
    /// Validate supplier data for creation or update
    /// </summary>
    private async Task ValidateSupplierAsync(Supplier supplier, int companyId, CancellationToken cancellationToken, int? excludeId = null)
    {
        // Validate required fields
        if (string.IsNullOrWhiteSpace(supplier.Name))
        {
            throw new ArgumentException("Supplier name is required");
        }

        // Check for duplicate supplier name within company
        var duplicateQuery = _context.Suppliers
            .Where(s => s.CompanyId == companyId && 
                       s.Name.ToLower() == supplier.Name.ToLower() && 
                       !s.IsDeleted);

        if (excludeId.HasValue)
        {
            duplicateQuery = duplicateQuery.Where(s => s.Id != excludeId.Value);
        }

        var duplicateExists = await duplicateQuery.AnyAsync(cancellationToken);
        if (duplicateExists)
        {
            throw new InvalidOperationException($"Supplier with name '{supplier.Name}' already exists");
        }

        // Validate tax ID if provided
        if (!string.IsNullOrEmpty(supplier.TaxId) && !ValidateTaxId(supplier.TaxId))
        {
            throw new ArgumentException("Invalid Israeli tax ID format");
        }

        // Check for duplicate tax ID within company if provided
        if (!string.IsNullOrEmpty(supplier.TaxId))
        {
            var duplicateTaxIdQuery = _context.Suppliers
                .Where(s => s.CompanyId == companyId && 
                           s.TaxId == supplier.TaxId && 
                           !s.IsDeleted);

            if (excludeId.HasValue)
            {
                duplicateTaxIdQuery = duplicateTaxIdQuery.Where(s => s.Id != excludeId.Value);
            }

            var duplicateTaxIdExists = await duplicateTaxIdQuery.AnyAsync(cancellationToken);
            if (duplicateTaxIdExists)
            {
                throw new InvalidOperationException($"Supplier with tax ID '{supplier.TaxId}' already exists");
            }
        }

        // Validate email format if provided
        if (!string.IsNullOrEmpty(supplier.Email))
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(supplier.Email);
                if (addr.Address != supplier.Email)
                {
                    throw new ArgumentException("Invalid email format");
                }
            }
            catch
            {
                throw new ArgumentException("Invalid email format");
            }
        }

        // Validate payment terms
        if (supplier.PaymentTermsDays < 0 || supplier.PaymentTermsDays > 365)
        {
            throw new ArgumentException("Payment terms must be between 0 and 365 days");
        }
    }
}
