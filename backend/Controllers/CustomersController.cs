using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Sales;
using backend.Models.Core;
using backend.DTOs.Core;
using backend.DTOs.Shared;
using backend.Services.Core;
using backend.Services.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// API controller for customer management operations
/// Uses BaseApiController for standardized error handling and response patterns
/// </summary>
[Route("api/[controller]")]
public class CustomersController : BaseApiController
{
    private readonly AccountingDbContext _context;
    private readonly ICustomerDocumentService _customerDocumentService;
    private readonly ICustomerFunctionService _customerFunctionService;
    private readonly ICustomerService _customerService;

    public CustomersController(
        AccountingDbContext context,
        ILogger<CustomersController> logger,
        ICustomerDocumentService customerDocumentService,
        ICustomerFunctionService customerFunctionService,
        ICustomerService customerService) : base(logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _customerDocumentService = customerDocumentService ?? throw new ArgumentNullException(nameof(customerDocumentService));
        _customerFunctionService = customerFunctionService ?? throw new ArgumentNullException(nameof(customerFunctionService));
        _customerService = customerService ?? throw new ArgumentNullException(nameof(customerService));
    }

    /// <summary>
    /// Gets all customers for the current company with pagination
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="searchTerm">Search term for filtering</param>
    /// <param name="isActive">Filter by active status</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <returns>Paginated list of customers</returns>
    [HttpGet]
    [ProducesResponseType<PaginatedResponse<CustomerDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PaginatedResponse<backend.DTOs.Core.CustomerDto>>> GetCustomers(
        [FromQuery] int? companyId = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var currentCompanyId = GetCurrentCompanyId(companyId);
            var (validPage, validPageSize) = ValidatePagination(page, pageSize);
            
            _logger.LogInformation("Retrieving customers for company {CompanyId}, page {Page}, pageSize {PageSize}", 
                currentCompanyId, validPage, validPageSize);

            var result = await _customerService.GetCustomersAsync(
                currentCompanyId, searchTerm, isActive, validPage, validPageSize, cancellationToken);

            return SuccessResponse(result);
        }
        catch (Exception ex)
        {
            return HandleException(ex, "retrieving customers");
        }
    }

    /// <summary>
    /// Gets a specific customer by ID
    /// </summary>
    /// <param name="id">Customer ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Customer details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType<CustomerDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<backend.DTOs.Core.CustomerDto>> GetCustomer(int id, [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = GetCurrentCompanyId(companyId);
            _logger.LogInformation("Retrieving customer {CustomerId} for company {CompanyId}", id, currentCompanyId);

            var customer = await _customerService.GetByIdAsync(id, currentCompanyId);

            if (customer == null)
            {
                _logger.LogWarning("Customer {CustomerId} not found for company {CompanyId}", id, currentCompanyId);
                return ErrorResponse($"Customer with ID {id} not found", 404);
            }

            // Convert to DTO
            var customerDto = new backend.DTOs.Core.CustomerDto
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

            return SuccessResponse(customerDto);
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"retrieving customer {id}");
        }
    }

    /// <summary>
    /// Creates a new customer
    /// </summary>
    /// <param name="createCustomerDto">Customer data</param>
    /// <returns>Created customer</returns>
    [HttpPost]
    [ProducesResponseType<CustomerDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CustomerDto>> CreateCustomer([FromBody] CreateCustomerDto createCustomerDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _logger.LogInformation("Creating customer {CustomerName} for company {CompanyId}", 
                createCustomerDto.Name, createCustomerDto.CompanyId);

            // Verify that the company exists
            var companyExists = await _context.Companies
                .AnyAsync(c => c.Id == createCustomerDto.CompanyId && c.IsActive && !c.IsDeleted);
            
            if (!companyExists)
            {
                _logger.LogWarning("Attempted to create customer for non-existent company {CompanyId}", createCustomerDto.CompanyId);
                return BadRequest(new { message = $"Company with ID {createCustomerDto.CompanyId} does not exist or is not active" });
            }

            var customer = new Customer
            {
                CompanyId = createCustomerDto.CompanyId,
                Name = createCustomerDto.Name,
                Address = createCustomerDto.Address,
                Contact = createCustomerDto.Contact,
                TaxId = createCustomerDto.TaxId,
                Email = createCustomerDto.Email,
                Phone = createCustomerDto.Phone,
                Website = createCustomerDto.Website,
                PaymentTermsDays = createCustomerDto.PaymentTerms ?? 30,
                CreditLimit = createCustomerDto.CreditLimit ?? 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            var customerDto = new CustomerDto
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

            _logger.LogInformation("Customer {CustomerId} created successfully", customer.Id);
            return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customerDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating customer {CustomerName}", createCustomerDto.Name);
            return StatusCode(500, new { message = "An error occurred while creating the customer" });
        }
    }

    /// <summary>
    /// Updates an existing customer
    /// </summary>
    /// <param name="id">Customer ID</param>
    /// <param name="updateCustomerDto">Updated customer data</param>
    /// <returns>Updated customer</returns>
    [HttpPut("{id}")]
    [ProducesResponseType<CustomerDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CustomerDto>> UpdateCustomer(int id, [FromBody] UpdateCustomerDto updateCustomerDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _logger.LogInformation("Updating customer {CustomerId}", id);

            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                _logger.LogWarning("Customer {CustomerId} not found for update", id);
                return NotFound(new { message = $"Customer with ID {id} not found" });
            }

            // Update fields
            if (!string.IsNullOrWhiteSpace(updateCustomerDto.Name))
                customer.Name = updateCustomerDto.Name;
            
            if (updateCustomerDto.Address != null)
                customer.Address = updateCustomerDto.Address;

            if (updateCustomerDto.Contact != null)
                customer.Contact = updateCustomerDto.Contact;
                
            if (updateCustomerDto.TaxId != null)
                customer.TaxId = updateCustomerDto.TaxId;
                
            if (updateCustomerDto.Email != null)
                customer.Email = updateCustomerDto.Email;
                
            if (updateCustomerDto.Phone != null)
                customer.Phone = updateCustomerDto.Phone;

            if (updateCustomerDto.Website != null)
                customer.Website = updateCustomerDto.Website;
                
            if (updateCustomerDto.PaymentTerms.HasValue)
                customer.PaymentTermsDays = updateCustomerDto.PaymentTerms.Value;
                
            if (updateCustomerDto.CreditLimit.HasValue)
                customer.CreditLimit = updateCustomerDto.CreditLimit.Value;
                
            customer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var customerDto = new CustomerDto
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

            _logger.LogInformation("Customer {CustomerId} updated successfully", id);
            return Ok(customerDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating customer {CustomerId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the customer" });
        }
    }

    /// <summary>
    /// Deletes a customer
    /// </summary>
    /// <param name="id">Customer ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        try
        {
            _logger.LogInformation("Deleting customer {CustomerId}", id);

            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                _logger.LogWarning("Customer {CustomerId} not found for deletion", id);
                return NotFound(new { message = $"Customer with ID {id} not found" });
            }

            // Check if customer has associated sales orders (business rule)
            var hasSalesOrders = await _context.SalesOrders.AnyAsync(so => so.CustomerId == id);
            if (hasSalesOrders)
            {
                _logger.LogWarning("Cannot delete customer {CustomerId} - has associated sales orders", id);
                return Conflict(new { message = "Cannot delete customer with existing sales orders" });
            }

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Customer {CustomerId} deleted successfully", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting customer {CustomerId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the customer" });
        }
    }

    /// <summary>
    /// Gets the first available active company ID (for development/testing)
    /// </summary>
    /// <returns>Company ID and basic info</returns>
    [HttpGet("dev/first-company")]
    [ProducesResponseType<object>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<object>> GetFirstCompany()
    {
        try
        {
            var company = await _context.Companies
                .Where(c => c.IsActive && !c.IsDeleted && c.Id != 0) // Exclude template company
                .OrderBy(c => c.Id)
                .Select(c => new { c.Id, c.Name, c.Currency })
                .FirstOrDefaultAsync();

            if (company == null)
            {
                return NotFound(new { message = "No active companies found. Database may need seeding." });
            }

            return Ok(new { 
                message = "First available company", 
                company = company,
                tip = "Use this CompanyId when creating customers"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving first company");
            return StatusCode(500, new { message = "An error occurred while retrieving company information" });
        }
    }

    /// <summary>
    /// Gets all documents for a specific customer
    /// </summary>
    /// <param name="customerId">Customer ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="fromDate">Optional start date filter</param>
    /// <param name="toDate">Optional end date filter</param>
    /// <param name="documentType">Optional document type filter (SalesOrder, Receipt, POSSale)</param>
    /// <returns>Customer documents response with summary</returns>
    [HttpGet("{customerId}/documents")]
    [ProducesResponseType<CustomerDocumentsResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CustomerDocumentsResponseDto>> GetCustomerDocuments(
        int customerId,
        [FromQuery] int? companyId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? documentType = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1; // Default for now

            var result = await _customerDocumentService.GetCustomerDocumentsAsync(
                customerId, currentCompanyId, fromDate, toDate, documentType);

            if (result == null)
            {
                return NotFound(new { message = $"Customer with ID {customerId} not found" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving documents for customer {CustomerId}", customerId);
            return StatusCode(500, new { message = "An error occurred while retrieving customer documents" });
        }
    }

    /// <summary>
    /// Gets document statistics for a specific customer
    /// </summary>
    /// <param name="customerId">Customer ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Customer document statistics</returns>
    [HttpGet("{customerId}/documents/stats")]
    [ProducesResponseType<CustomerDocumentStatsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CustomerDocumentStatsDto>> GetCustomerDocumentStats(
        int customerId,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1; // Default for now

            var result = await _customerDocumentService.GetCustomerDocumentStatsAsync(customerId, currentCompanyId);

            if (result == null)
            {
                return NotFound(new { message = $"Customer with ID {customerId} not found" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving document statistics for customer {CustomerId}", customerId);
            return StatusCode(500, new { message = "An error occurred while retrieving customer document statistics" });
        }
    }

    /// <summary>
    /// Get available customer functions for AI function calling (for testing)
    /// </summary>
    /// <returns>List of available function definitions</returns>
    [HttpGet("functions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetCustomerFunctions()
    {
        try
        {
            var functions = _customerFunctionService.GetCustomerFunctions();
            return Ok(new { 
                totalFunctions = functions.Count,
                functions = functions.Select(f => new { 
                    name = f.Name, 
                    description = f.Description,
                    parameters = f.Parameters
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customer functions");
            return StatusCode(500, new { message = "An error occurred while retrieving customer functions" });
        }
    }

    /// <summary>
    /// Test a customer function directly (for development testing)
    /// </summary>
    /// <param name="request">Function test request</param>
    /// <returns>Function execution result</returns>
    [HttpPost("functions/test")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> TestCustomerFunction([FromBody] CustomerFunctionTestRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.FunctionName))
            {
                return BadRequest(new { message = "Function name is required" });
            }

            var functionCall = new backend.Services.Interfaces.FunctionCall
            {
                Name = request.FunctionName,
                Arguments = request.Arguments ?? "{}",
                Id = Guid.NewGuid().ToString()
            };

            var result = await _customerFunctionService.ExecuteCustomerFunctionAsync(
                functionCall, 
                request.CompanyId, 
                HttpContext.RequestAborted);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing customer function {FunctionName}", request.FunctionName);
            return StatusCode(500, new { message = "An error occurred while testing the customer function" });
        }
    }
}

/// <summary>
/// DTO for customer data transfer
/// </summary>
public class CustomerDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public string? TaxId { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public int? PaymentTerms { get; set; }
    public decimal? CreditLimit { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for creating a new customer
/// </summary>
public class CreateCustomerDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int CompanyId { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? Contact { get; set; }

    [MaxLength(15)]
    public string? TaxId { get; set; }

    [EmailAddress]
    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }

    public int? PaymentTerms { get; set; } = 30;

    public decimal? CreditLimit { get; set; } = 0;
}

/// <summary>
/// DTO for updating an existing customer
/// </summary>
public class UpdateCustomerDto
{
    [MaxLength(200)]
    public string? Name { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? Contact { get; set; }

    [MaxLength(15)]
    public string? TaxId { get; set; }

    [EmailAddress]
    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }

    public int? PaymentTerms { get; set; }

    public decimal? CreditLimit { get; set; }
}

/// <summary>
/// DTO for customer document summary
/// </summary>
public class CustomerDocumentDto
{
    public int Id { get; set; }
    public string DocumentType { get; set; } = string.Empty; // "SalesOrder", "Receipt", "POSSale"
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime DocumentDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
}

/// <summary>
/// DTO for customer documents response with pagination
/// </summary>
public class CustomerDocumentsResponseDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public List<CustomerDocumentDto> Documents { get; set; } = new();
    public int TotalDocuments { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

/// <summary>
/// DTO for testing customer functions directly
/// </summary>
public class CustomerFunctionTestRequest
{
    [Required]
    public string FunctionName { get; set; } = string.Empty;
    
    [Required]
    public int CompanyId { get; set; }
    
    public string Arguments { get; set; } = "{}";
}
