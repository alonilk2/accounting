using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Suppliers;
using backend.Services.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// API controller for supplier management operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;
    private readonly AccountingDbContext _context;
    private readonly ILogger<SuppliersController> _logger;

    public SuppliersController(
        ISupplierService supplierService,
        AccountingDbContext context,
        ILogger<SuppliersController> logger)
    {
        _supplierService = supplierService ?? throw new ArgumentNullException(nameof(supplierService));
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all suppliers for the current company
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="isActive">Optional active status filter</param>
    /// <param name="searchTerm">Optional search term</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 50)</param>
    /// <returns>List of suppliers</returns>
    [HttpGet]
    [ProducesResponseType<IEnumerable<SupplierDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<SupplierDto>>> GetSuppliers(
        [FromQuery] int? companyId = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            // Use company ID from query parameter or fallback to a default
            var currentCompanyId = companyId ?? 1; // TODO: Get from authenticated user context

            var result = await _supplierService.GetAllAsync(currentCompanyId, page, pageSize, searchTerm);
            var suppliers = result.Items;

            // Apply additional filters
            if (isActive.HasValue)
            {
                suppliers = suppliers.Where(s => s.IsActive == isActive.Value);
            }

            // Convert to DTOs
            var supplierDtos = suppliers.Select(supplier => new SupplierDto
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
            }).ToList();

            return Ok(supplierDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving suppliers for company {CompanyId}", companyId);
            return StatusCode(500, "An error occurred while processing your request");
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
            var currentCompanyId = companyId ?? 1; // TODO: Get from authenticated user context

            var supplier = await _supplierService.GetByIdAsync(id, currentCompanyId);
            if (supplier == null)
            {
                return NotFound($"Supplier with ID {id} not found");
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

            return Ok(supplierDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving supplier {SupplierId}", id);
            return StatusCode(500, "An error occurred while processing your request");
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

            var currentCompanyId = request.CompanyId ?? 1; // TODO: Get from authenticated user context
            var userId = "system"; // TODO: Get from authenticated user context

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
            _logger.LogError(ex, "Error occurred while creating supplier");
            return StatusCode(500, "An error occurred while processing your request");
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

            var currentCompanyId = request.CompanyId ?? 1; // TODO: Get from authenticated user context
            var userId = "system"; // TODO: Get from authenticated user context

            var existingSupplier = await _supplierService.GetByIdAsync(id, currentCompanyId);
            if (existingSupplier == null)
            {
                return NotFound($"Supplier with ID {id} not found");
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

            return Ok(supplierDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating supplier {SupplierId}", id);
            return StatusCode(500, "An error occurred while processing your request");
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
            var currentCompanyId = companyId ?? 1; // TODO: Get from authenticated user context
            var userId = "system"; // TODO: Get from authenticated user context

            var supplier = await _supplierService.GetByIdAsync(id, currentCompanyId);
            if (supplier == null)
            {
                return NotFound($"Supplier with ID {id} not found");
            }

            await _supplierService.DeleteAsync(id, currentCompanyId, userId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting supplier {SupplierId}", id);
            return StatusCode(500, "An error occurred while processing your request");
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
            var currentCompanyId = companyId ?? 1; // TODO: Get from authenticated user context

            var supplier = await _supplierService.GetByIdAsync(id, currentCompanyId);
            if (supplier == null)
            {
                return NotFound($"Supplier with ID {id} not found");
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

            return Ok(purchaseOrders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving purchase orders for supplier {SupplierId}", id);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }
}

// DTOs for API responses
public class SupplierDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Contact { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? TaxId { get; set; }
    public string? VatNumber { get; set; }
    public int PaymentTermsDays { get; set; }
    public bool IsActive { get; set; }
    public string? BankName { get; set; }
    public string? BankAccount { get; set; }
    public string? BankBranch { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Request DTOs
/// <summary>
/// Request model for creating a new supplier
/// </summary>
public class CreateSupplierRequest
{
    public int? CompanyId { get; set; } // Optional, will be set from auth context

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? Contact { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }

    [MaxLength(15)]
    public string? TaxId { get; set; }

    [MaxLength(15)]
    public string? VatNumber { get; set; }

    [Range(0, 365)]
    public int PaymentTermsDays { get; set; } = 30;

    public bool IsActive { get; set; } = true;

    [MaxLength(50)]
    public string? BankName { get; set; }

    [MaxLength(20)]
    public string? BankAccount { get; set; }

    [MaxLength(10)]
    public string? BankBranch { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

/// <summary>
/// Request model for updating an existing supplier
/// </summary>
public class UpdateSupplierRequest
{
    public int? CompanyId { get; set; } // Optional, will be set from auth context

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? Contact { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }

    [MaxLength(15)]
    public string? TaxId { get; set; }

    [MaxLength(15)]
    public string? VatNumber { get; set; }

    [Range(0, 365)]
    public int PaymentTermsDays { get; set; } = 30;

    public bool IsActive { get; set; } = true;

    [MaxLength(50)]
    public string? BankName { get; set; }

    [MaxLength(20)]
    public string? BankAccount { get; set; }

    [MaxLength(10)]
    public string? BankBranch { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}
