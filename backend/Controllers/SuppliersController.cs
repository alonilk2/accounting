using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Suppliers;
using backend.DTOs.Core;
using backend.DTOs.Shared;
using backend.Services.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// API controller for supplier management operations
/// </summary>
[Route("api/[controller]")]
[Produces("application/json")]
public class SuppliersController : BaseApiController
{
    private readonly ISupplierService _supplierService;
    private readonly AccountingDbContext _context;

    public SuppliersController(
        ISupplierService supplierService,
        AccountingDbContext context,
        ILogger<SuppliersController> logger) : base(logger)
    {
        _supplierService = supplierService ?? throw new ArgumentNullException(nameof(supplierService));
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    /// <summary>
    /// Gets all suppliers for the current company with pagination
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="isActive">Optional active status filter</param>
    /// <param name="searchTerm">Optional search term</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 25)</param>
    /// <returns>Paginated list of suppliers</returns>
    [HttpGet]
    [ProducesResponseType<PaginatedResponse<SupplierDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PaginatedResponse<SupplierDto>>> GetSuppliers(
        [FromQuery] int? companyId = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var currentCompanyId = GetCurrentCompanyId(companyId);
            var (validPage, validPageSize) = ValidatePagination(page, pageSize);
            
            var result = await _supplierService.GetSuppliersAsync(
                currentCompanyId, searchTerm, isActive, validPage, validPageSize, cancellationToken);

            return SuccessResponse(result);
        }
        catch (Exception ex)
        {
            return HandleException(ex, "retrieving suppliers");
        }
    }

    /// <summary>
    /// Gets a specific supplier by ID
    /// </summary>
    /// <param name="id">Supplier ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Supplier details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType<SupplierDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SupplierDto>> GetSupplier(int id, [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = GetCurrentCompanyId(companyId);

            var supplier = await _supplierService.GetByIdAsync(id, currentCompanyId);
            if (supplier == null)
            {
                return ErrorResponse($"Supplier with ID {id} not found", 404);
            }

            var supplierDto = new SupplierDto
            {
                Id = supplier.Id,
                CompanyId = supplier.CompanyId,
                Name = supplier.Name,
                Address = supplier.Address,
                Contact = supplier.Contact,
                Phone = supplier.Phone,
                Email = supplier.Email,
                Website = supplier.Website,
                TaxId = supplier.TaxId,
                VatNumber = supplier.VatNumber,
                PaymentTermsDays = supplier.PaymentTermsDays,
                IsActive = supplier.IsActive,
                BankName = supplier.BankName,
                BankAccount = supplier.BankAccount,
                BankBranch = supplier.BankBranch,
                Notes = supplier.Notes,
                CreatedAt = supplier.CreatedAt,
                UpdatedAt = supplier.UpdatedAt
            };

            return SuccessResponse(supplierDto);
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"retrieving supplier {id}");
        }
    }

    /// <summary>
    /// Creates a new supplier
    /// </summary>
    /// <param name="request">Supplier creation request</param>
    /// <returns>Created supplier</returns>
    [HttpPost]
    [ProducesResponseType<SupplierDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SupplierDto>> CreateSupplier([FromBody] CreateSupplierRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentCompanyId = GetCurrentCompanyId(request.CompanyId);
            var userId = GetCurrentUserId();

            var supplier = new Supplier
            {
                CompanyId = currentCompanyId,
                Name = request.Name,
                Address = request.Address,
                Contact = request.Contact,
                Phone = request.Phone,
                Email = request.Email,
                Website = request.Website,
                TaxId = request.TaxId,
                VatNumber = request.VatNumber,
                PaymentTermsDays = request.PaymentTermsDays,
                IsActive = request.IsActive,
                BankName = request.BankName,
                BankAccount = request.BankAccount,
                BankBranch = request.BankBranch,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                UpdatedBy = userId,
                IsDeleted = false
            };

            var createdSupplier = await _supplierService.CreateAsync(supplier, currentCompanyId, userId);

            var supplierDto = new SupplierDto
            {
                Id = createdSupplier.Id,
                CompanyId = createdSupplier.CompanyId,
                Name = createdSupplier.Name,
                Address = createdSupplier.Address,
                Contact = createdSupplier.Contact,
                Phone = createdSupplier.Phone,
                Email = createdSupplier.Email,
                Website = createdSupplier.Website,
                TaxId = createdSupplier.TaxId,
                VatNumber = createdSupplier.VatNumber,
                PaymentTermsDays = createdSupplier.PaymentTermsDays,
                IsActive = createdSupplier.IsActive,
                BankName = createdSupplier.BankName,
                BankAccount = createdSupplier.BankAccount,
                BankBranch = createdSupplier.BankBranch,
                Notes = createdSupplier.Notes,
                CreatedAt = createdSupplier.CreatedAt,
                UpdatedAt = createdSupplier.UpdatedAt
            };

            return CreatedAtAction(nameof(GetSupplier), new { id = createdSupplier.Id }, supplierDto);
        }
        catch (Exception ex)
        {
            return HandleException(ex, "creating supplier");
        }
    }

    /// <summary>
    /// Updates an existing supplier
    /// </summary>
    /// <param name="id">Supplier ID</param>
    /// <param name="request">Supplier update request</param>
    /// <returns>Updated supplier</returns>
    [HttpPut("{id}")]
    [ProducesResponseType<SupplierDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SupplierDto>> UpdateSupplier(int id, [FromBody] UpdateSupplierRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentCompanyId = GetCurrentCompanyId(request.CompanyId);
            var userId = GetCurrentUserId();

            var existingSupplier = await _supplierService.GetByIdAsync(id, currentCompanyId);
            if (existingSupplier == null)
            {
                return ErrorResponse($"Supplier with ID {id} not found", 404);
            }

            // Update supplier properties
            existingSupplier.Name = request.Name;
            existingSupplier.Address = request.Address;
            existingSupplier.Contact = request.Contact;
            existingSupplier.Phone = request.Phone;
            existingSupplier.Email = request.Email;
            existingSupplier.Website = request.Website;
            existingSupplier.TaxId = request.TaxId;
            existingSupplier.VatNumber = request.VatNumber;
            existingSupplier.PaymentTermsDays = request.PaymentTermsDays;
            existingSupplier.IsActive = request.IsActive;
            existingSupplier.BankName = request.BankName;
            existingSupplier.BankAccount = request.BankAccount;
            existingSupplier.BankBranch = request.BankBranch;
            existingSupplier.Notes = request.Notes;
            existingSupplier.UpdatedAt = DateTime.UtcNow;
            existingSupplier.UpdatedBy = userId;

            var updatedSupplier = await _supplierService.UpdateAsync(existingSupplier, currentCompanyId, userId);

            var supplierDto = new SupplierDto
            {
                Id = updatedSupplier.Id,
                CompanyId = updatedSupplier.CompanyId,
                Name = updatedSupplier.Name,
                Address = updatedSupplier.Address,
                Contact = updatedSupplier.Contact,
                Phone = updatedSupplier.Phone,
                Email = updatedSupplier.Email,
                Website = updatedSupplier.Website,
                TaxId = updatedSupplier.TaxId,
                VatNumber = updatedSupplier.VatNumber,
                PaymentTermsDays = updatedSupplier.PaymentTermsDays,
                IsActive = updatedSupplier.IsActive,
                BankName = updatedSupplier.BankName,
                BankAccount = updatedSupplier.BankAccount,
                BankBranch = updatedSupplier.BankBranch,
                Notes = updatedSupplier.Notes,
                CreatedAt = updatedSupplier.CreatedAt,
                UpdatedAt = updatedSupplier.UpdatedAt
            };

            return SuccessResponse(supplierDto);
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"updating supplier {id}");
        }
    }

    /// <summary>
    /// Soft deletes a supplier (marks as deleted)
    /// </summary>
    /// <param name="id">Supplier ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteSupplier(int id, [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = GetCurrentCompanyId(companyId);
            var userId = GetCurrentUserId();

            var supplier = await _supplierService.GetByIdAsync(id, currentCompanyId);
            if (supplier == null)
            {
                return ErrorResponse($"Supplier with ID {id} not found", 404);
            }

            await _supplierService.DeleteAsync(id, currentCompanyId, userId);

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"deleting supplier {id}");
        }
    }

    /// <summary>
    /// Gets purchase orders for a specific supplier
    /// </summary>
    /// <param name="id">Supplier ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>List of purchase orders for the supplier</returns>
    [HttpGet("{id}/purchase-orders")]
    [ProducesResponseType<IEnumerable<object>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<object>>> GetSupplierPurchaseOrders(int id, [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = GetCurrentCompanyId(companyId);

            var supplier = await _supplierService.GetByIdAsync(id, currentCompanyId);
            if (supplier == null)
            {
                return ErrorResponse($"Supplier with ID {id} not found", 404);
            }

            var purchaseOrders = await _context.PurchaseOrders
                .AsNoTracking()
                .Include(po => po.Lines)
                .Where(po => po.SupplierId == id && po.CompanyId == currentCompanyId && !po.IsDeleted)
                .OrderByDescending(po => po.OrderDate)
                .Select(po => new
                {
                    Id = po.Id,
                    OrderNumber = po.OrderNumber,
                    OrderDate = po.OrderDate,
                    DueDate = po.DueDate,
                    Status = po.Status.ToString(),
                    TotalAmount = po.TotalAmount,
                    Currency = po.Currency,
                    LinesCount = po.Lines.Count
                })
                .ToListAsync();

            return SuccessResponse((IEnumerable<object>)purchaseOrders);
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"retrieving purchase orders for supplier {id}");
        }
    }
}
