using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Core;
using backend.Services.Interfaces;
using backend.DTOs.Company;
using CompanySettingsDto = backend.DTOs.Company.CompanySettings;
using CompanySearchCriteriaDto = backend.DTOs.Company.CompanySearchCriteria;

namespace backend.Controllers;

/// <summary>
/// API controller for company management operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CompanyController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly ILogger<CompanyController> _logger;

    public CompanyController(
        ICompanyService companyService,
        ILogger<CompanyController> logger)
    {
        _companyService = companyService ?? throw new ArgumentNullException(nameof(companyService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get company by ID
    /// </summary>
    /// <param name="id">Company ID</param>
    /// <returns>Company details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType<CompanyDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CompanyDto>> GetCompany(int id)
    {
        try
        {
            var company = await _companyService.GetByIdAsync(id, id);
            if (company == null)
            {
                return NotFound($"Company with ID {id} not found");
            }

            var companyDto = new CompanyDto
            {
                Id = company.Id,
                Name = company.Name,
                IsraelTaxId = company.IsraelTaxId,
                Address = company.Address,
                City = company.City,
                PostalCode = company.PostalCode,
                Country = company.Country,
                Phone = company.Phone,
                Email = company.Email,
                Website = company.Website,
                Currency = company.Currency,
                FiscalYearStartMonth = company.FiscalYearStartMonth,
                TimeZone = company.TimeZone,
                IsActive = company.IsActive,
                SubscriptionPlan = company.SubscriptionPlan,
                SubscriptionExpiresAt = company.SubscriptionExpiresAt,
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt
            };

            return Ok(companyDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting company {CompanyId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update company details
    /// </summary>
    /// <param name="id">Company ID</param>
    /// <param name="request">Update request</param>
    /// <returns>Updated company</returns>
    [HttpPut("{id}")]
    [ProducesResponseType<CompanyDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CompanyDto>> UpdateCompany(int id, [FromBody] UpdateCompanyRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingCompany = await _companyService.GetByIdAsync(id, id);
            if (existingCompany == null)
            {
                return NotFound($"Company with ID {id} not found");
            }

            // Validate tax ID if it's being changed
            if (request.IsraelTaxId != existingCompany.IsraelTaxId)
            {
                var (isValid, errorMessage) = await _companyService.ValidateTaxIdAsync(request.IsraelTaxId, id);
                if (!isValid)
                {
                    return BadRequest(errorMessage);
                }
            }

            // Update company properties
            existingCompany.Name = request.Name;
            existingCompany.IsraelTaxId = request.IsraelTaxId;
            existingCompany.Address = request.Address;
            existingCompany.City = request.City;
            existingCompany.PostalCode = request.PostalCode;
            existingCompany.Country = request.Country;
            existingCompany.Phone = request.Phone;
            existingCompany.Email = request.Email;
            existingCompany.Website = request.Website;
            existingCompany.Currency = request.Currency;
            existingCompany.FiscalYearStartMonth = request.FiscalYearStartMonth;
            existingCompany.TimeZone = request.TimeZone;

            var userId = "system"; // In real app, get from authenticated user
            var updatedCompany = await _companyService.UpdateAsync(existingCompany, id, userId);

            var companyDto = new CompanyDto
            {
                Id = updatedCompany.Id,
                Name = updatedCompany.Name,
                IsraelTaxId = updatedCompany.IsraelTaxId,
                Address = updatedCompany.Address,
                City = updatedCompany.City,
                PostalCode = updatedCompany.PostalCode,
                Country = updatedCompany.Country,
                Phone = updatedCompany.Phone,
                Email = updatedCompany.Email,
                Website = updatedCompany.Website,
                Currency = updatedCompany.Currency,
                FiscalYearStartMonth = updatedCompany.FiscalYearStartMonth,
                TimeZone = updatedCompany.TimeZone,
                IsActive = updatedCompany.IsActive,
                SubscriptionPlan = updatedCompany.SubscriptionPlan,
                SubscriptionExpiresAt = updatedCompany.SubscriptionExpiresAt,
                CreatedAt = updatedCompany.CreatedAt,
                UpdatedAt = updatedCompany.UpdatedAt
            };

            return Ok(companyDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating company {CompanyId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get company dashboard statistics
    /// </summary>
    /// <param name="id">Company ID</param>
    /// <returns>Dashboard statistics</returns>
    [HttpGet("{id}/dashboard-stats")]
    [ProducesResponseType<CompanyDashboardStats>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CompanyDashboardStats>> GetDashboardStats(int id)
    {
        try
        {
            var stats = await _companyService.GetDashboardStatsAsync(id);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard stats for company {CompanyId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Validate Israeli Tax ID
    /// </summary>
    /// <param name="taxId">Tax ID to validate</param>
    /// <param name="excludeCompanyId">Company ID to exclude from validation (for updates)</param>
    /// <returns>Validation result</returns>
    [HttpPost("validate-tax-id")]
    [ProducesResponseType<TaxIdValidationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<TaxIdValidationResponse>> ValidateTaxId([FromBody] ValidateTaxIdRequest request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TaxId))
            {
                return BadRequest("Tax ID is required");
            }

            var (isValid, errorMessage) = await _companyService.ValidateTaxIdAsync(request.TaxId, request.ExcludeCompanyId);

            return Ok(new TaxIdValidationResponse
            {
                IsValid = isValid,
                ErrorMessage = errorMessage
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating tax ID: {TaxId}", request?.TaxId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Create a new company
    /// </summary>
    /// <param name="request">Company creation request</param>
    /// <returns>Created company</returns>
    [HttpPost]
    [ProducesResponseType<CompanyDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CompanyDto>> CreateCompany([FromBody] CreateCompanyRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate tax ID
            var (isValid, errorMessage) = await _companyService.ValidateTaxIdAsync(request.IsraelTaxId);
            if (!isValid)
            {
                return BadRequest(errorMessage);
            }

            var company = new Company
            {
                Name = request.Name,
                IsraelTaxId = request.IsraelTaxId,
                Address = request.Address,
                City = request.City,
                PostalCode = request.PostalCode,
                Country = request.Country ?? "Israel",
                Phone = request.Phone,
                Email = request.Email,
                Website = request.Website,
                Currency = request.Currency,
                FiscalYearStartMonth = request.FiscalYearStartMonth,
                TimeZone = request.TimeZone,
                IsActive = true,
                SubscriptionPlan = request.SubscriptionPlan ?? "Basic"
            };

            var userId = "system"; // In real app, get from authenticated user
            var createdCompany = await _companyService.InitializeCompanyAsync(company, userId);

            var companyDto = new CompanyDto
            {
                Id = createdCompany.Id,
                Name = createdCompany.Name,
                IsraelTaxId = createdCompany.IsraelTaxId,
                Address = createdCompany.Address,
                City = createdCompany.City,
                PostalCode = createdCompany.PostalCode,
                Country = createdCompany.Country,
                Phone = createdCompany.Phone,
                Email = createdCompany.Email,
                Website = createdCompany.Website,
                Currency = createdCompany.Currency,
                FiscalYearStartMonth = createdCompany.FiscalYearStartMonth,
                TimeZone = createdCompany.TimeZone,
                IsActive = createdCompany.IsActive,
                SubscriptionPlan = createdCompany.SubscriptionPlan,
                SubscriptionExpiresAt = createdCompany.SubscriptionExpiresAt,
                CreatedAt = createdCompany.CreatedAt,
                UpdatedAt = createdCompany.UpdatedAt
            };

            return CreatedAtAction(nameof(GetCompany), new { id = companyDto.Id }, companyDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating company");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get all companies (admin only)
    /// </summary>
    /// <param name="pageNumber">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="searchTerm">Search term</param>
    /// <returns>List of companies</returns>
    [HttpGet]
    [ProducesResponseType<IEnumerable<CompanyDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<CompanyDto>>> GetCompanies(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string searchTerm = "")
    {
        try
        {
            // In real app, check admin permissions
            var (companies, totalCount) = await _companyService.GetAllAsync(0, pageNumber, pageSize, searchTerm); // 0 for admin access

            var companyDtos = companies.Select(c => new CompanyDto
            {
                Id = c.Id,
                Name = c.Name,
                IsraelTaxId = c.IsraelTaxId,
                Address = c.Address,
                City = c.City,
                PostalCode = c.PostalCode,
                Country = c.Country,
                Phone = c.Phone,
                Email = c.Email,
                Website = c.Website,
                Currency = c.Currency,
                FiscalYearStartMonth = c.FiscalYearStartMonth,
                TimeZone = c.TimeZone,
                IsActive = c.IsActive,
                SubscriptionPlan = c.SubscriptionPlan,
                SubscriptionExpiresAt = c.SubscriptionExpiresAt,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            });

            return Ok(companyDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting companies");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update company settings
    /// </summary>
    /// <param name="id">Company ID</param>
    /// <param name="request">Settings update request</param>
    /// <returns>Updated company</returns>
    [HttpPut("{id}/settings")]
    [ProducesResponseType<CompanyDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CompanyDto>> UpdateCompanySettings(int id, [FromBody] UpdateCompanySettingsRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingCompany = await _companyService.GetByIdAsync(id, id);
            if (existingCompany == null)
            {
                return NotFound($"Company with ID {id} not found");
            }

            // Update settings
            existingCompany.Currency = request.Currency ?? existingCompany.Currency;
            existingCompany.FiscalYearStartMonth = request.FiscalYearStartMonth ?? existingCompany.FiscalYearStartMonth;
            existingCompany.TimeZone = request.TimeZone ?? existingCompany.TimeZone;
            existingCompany.SubscriptionPlan = request.SubscriptionPlan ?? existingCompany.SubscriptionPlan;
            existingCompany.SubscriptionExpiresAt = request.SubscriptionExpiresAt ?? existingCompany.SubscriptionExpiresAt;

            var userId = "system"; // In real app, get from authenticated user
            var updatedCompany = await _companyService.UpdateAsync(existingCompany, id, userId);

            var companyDto = new CompanyDto
            {
                Id = updatedCompany.Id,
                Name = updatedCompany.Name,
                IsraelTaxId = updatedCompany.IsraelTaxId,
                Address = updatedCompany.Address,
                City = updatedCompany.City,
                PostalCode = updatedCompany.PostalCode,
                Country = updatedCompany.Country,
                Phone = updatedCompany.Phone,
                Email = updatedCompany.Email,
                Website = updatedCompany.Website,
                Currency = updatedCompany.Currency,
                FiscalYearStartMonth = updatedCompany.FiscalYearStartMonth,
                TimeZone = updatedCompany.TimeZone,
                IsActive = updatedCompany.IsActive,
                SubscriptionPlan = updatedCompany.SubscriptionPlan,
                SubscriptionExpiresAt = updatedCompany.SubscriptionExpiresAt,
                CreatedAt = updatedCompany.CreatedAt,
                UpdatedAt = updatedCompany.UpdatedAt
            };

            return Ok(companyDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating company settings for company {CompanyId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Activate or deactivate company
    /// </summary>
    /// <param name="id">Company ID</param>
    /// <param name="request">Activation request</param>
    /// <returns>Updated company</returns>
    [HttpPut("{id}/activation")]
    [ProducesResponseType<CompanyDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CompanyDto>> UpdateCompanyActivation(int id, [FromBody] UpdateCompanyActivationRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            var existingCompany = await _companyService.GetByIdAsync(id, id);
            if (existingCompany == null)
            {
                return NotFound($"Company with ID {id} not found");
            }

            existingCompany.IsActive = request.IsActive;

            var userId = "system"; // In real app, get from authenticated user
            var updatedCompany = await _companyService.UpdateAsync(existingCompany, id, userId);

            var companyDto = new CompanyDto
            {
                Id = updatedCompany.Id,
                Name = updatedCompany.Name,
                IsraelTaxId = updatedCompany.IsraelTaxId,
                Address = updatedCompany.Address,
                City = updatedCompany.City,
                PostalCode = updatedCompany.PostalCode,
                Country = updatedCompany.Country,
                Phone = updatedCompany.Phone,
                Email = updatedCompany.Email,
                Website = updatedCompany.Website,
                Currency = updatedCompany.Currency,
                FiscalYearStartMonth = updatedCompany.FiscalYearStartMonth,
                TimeZone = updatedCompany.TimeZone,
                IsActive = updatedCompany.IsActive,
                SubscriptionPlan = updatedCompany.SubscriptionPlan,
                SubscriptionExpiresAt = updatedCompany.SubscriptionExpiresAt,
                CreatedAt = updatedCompany.CreatedAt,
                UpdatedAt = updatedCompany.UpdatedAt
            };

            return Ok(companyDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating company activation for company {CompanyId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get company by tax ID
    /// </summary>
    /// <param name="taxId">Israeli Tax ID</param>
    /// <returns>Company details</returns>
    [HttpGet("by-tax-id/{taxId}")]
    [ProducesResponseType<CompanyDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CompanyDto>> GetCompanyByTaxId(string taxId)
    {
        try
        {
            var company = await _companyService.GetByTaxIdAsync(taxId);
            if (company == null)
            {
                return NotFound($"Company with Tax ID {taxId} not found");
            }

            var companyDto = new CompanyDto
            {
                Id = company.Id,
                Name = company.Name,
                IsraelTaxId = company.IsraelTaxId,
                Address = company.Address,
                City = company.City,
                PostalCode = company.PostalCode,
                Country = company.Country,
                Phone = company.Phone,
                Email = company.Email,
                Website = company.Website,
                Currency = company.Currency,
                FiscalYearStartMonth = company.FiscalYearStartMonth,
                TimeZone = company.TimeZone,
                IsActive = company.IsActive,
                SubscriptionPlan = company.SubscriptionPlan,
                SubscriptionExpiresAt = company.SubscriptionExpiresAt,
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt
            };

            return Ok(companyDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting company by tax ID: {TaxId}", taxId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get company settings
    /// </summary>
    /// <param name="id">Company ID</param>
    /// <returns>Company settings</returns>
    [HttpGet("{id}/settings")]
    [ProducesResponseType<CompanySettingsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CompanySettingsDto>> GetCompanySettings(int id)
    {
        try
        {
            var settings = await _companyService.GetCompanySettingsAsync(id);
            
            // Convert service type to DTO
            var settingsDto = new CompanySettingsDto
            {
                CompanyId = settings.CompanyId,
                Currency = settings.Currency,
                FiscalYearStartMonth = settings.FiscalYearStartMonth,
                TimeZone = settings.TimeZone,
                SubscriptionPlan = settings.SubscriptionPlan,
                SubscriptionExpiresAt = settings.SubscriptionExpiresAt,
                IsActive = settings.IsActive,
                CreatedAt = settings.CreatedAt,
                UpdatedAt = settings.UpdatedAt
            };
            
            return Ok(settingsDto);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting company settings for company {CompanyId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update company subscription
    /// </summary>
    /// <param name="id">Company ID</param>
    /// <param name="request">Subscription update request</param>
    /// <returns>Updated company</returns>
    [HttpPut("{id}/subscription")]
    [ProducesResponseType<CompanyDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CompanyDto>> UpdateCompanySubscription(int id, [FromBody] UpdateSubscriptionRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = "system"; // In real app, get from authenticated user
            var updatedCompany = await _companyService.UpdateSubscriptionAsync(id, request.SubscriptionPlan, request.ExpiresAt, userId);

            var companyDto = new CompanyDto
            {
                Id = updatedCompany.Id,
                Name = updatedCompany.Name,
                IsraelTaxId = updatedCompany.IsraelTaxId,
                Address = updatedCompany.Address,
                City = updatedCompany.City,
                PostalCode = updatedCompany.PostalCode,
                Country = updatedCompany.Country,
                Phone = updatedCompany.Phone,
                Email = updatedCompany.Email,
                Website = updatedCompany.Website,
                Currency = updatedCompany.Currency,
                FiscalYearStartMonth = updatedCompany.FiscalYearStartMonth,
                TimeZone = updatedCompany.TimeZone,
                IsActive = updatedCompany.IsActive,
                SubscriptionPlan = updatedCompany.SubscriptionPlan,
                SubscriptionExpiresAt = updatedCompany.SubscriptionExpiresAt,
                CreatedAt = updatedCompany.CreatedAt,
                UpdatedAt = updatedCompany.UpdatedAt
            };

            return Ok(companyDto);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating subscription for company {CompanyId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Check if company has access to feature
    /// </summary>
    /// <param name="id">Company ID</param>
    /// <param name="request">Feature access request</param>
    /// <returns>Feature access result</returns>
    [HttpPost("{id}/check-feature-access")]
    [ProducesResponseType<FeatureAccessResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<FeatureAccessResponse>> CheckFeatureAccess(int id, [FromBody] CheckFeatureAccessRequest request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Feature))
            {
                return BadRequest("Feature name is required");
            }

            var hasAccess = await _companyService.HasFeatureAccessAsync(id, request.Feature);
            var isExpired = await _companyService.IsSubscriptionExpiredAsync(id);

            return Ok(new FeatureAccessResponse
            {
                HasAccess = hasAccess && !isExpired,
                Reason = !hasAccess ? "Company not found or inactive" : 
                        isExpired ? "Subscription expired" : null,
                ExpiresAt = isExpired ? null : (await _companyService.GetByIdAsync(id, id))?.SubscriptionExpiresAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking feature access for company {CompanyId}, feature {Feature}", 
                id, request?.Feature);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Search companies by criteria
    /// </summary>
    /// <param name="criteria">Search criteria</param>
    /// <returns>Matching companies</returns>
    [HttpPost("search")]
    [ProducesResponseType<IEnumerable<CompanyDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<CompanyDto>>> SearchCompanies([FromBody] CompanySearchCriteriaDto criteria)
    {
        try
        {
            if (criteria == null)
            {
                return BadRequest("Search criteria is required");
            }

            var companies = await _companyService.GetCompaniesByCriteriaAsync(new backend.Services.Interfaces.CompanySearchCriteria
            {
                Name = criteria.Name,
                TaxId = criteria.TaxId,
                City = criteria.City,
                SubscriptionPlan = criteria.SubscriptionPlan,
                IsActive = criteria.IsActive,
                CreatedAfter = criteria.CreatedAfter,
                CreatedBefore = criteria.CreatedBefore,
                OrderBy = criteria.OrderBy,
                OrderDescending = criteria.OrderDescending,
                PageNumber = criteria.PageNumber,
                PageSize = criteria.PageSize
            });
            
            var companyDtos = companies.Select(c => new CompanyDto
            {
                Id = c.Id,
                Name = c.Name,
                IsraelTaxId = c.IsraelTaxId,
                Address = c.Address,
                City = c.City,
                PostalCode = c.PostalCode,
                Country = c.Country,
                Phone = c.Phone,
                Email = c.Email,
                Website = c.Website,
                Currency = c.Currency,
                FiscalYearStartMonth = c.FiscalYearStartMonth,
                TimeZone = c.TimeZone,
                IsActive = c.IsActive,
                SubscriptionPlan = c.SubscriptionPlan,
                SubscriptionExpiresAt = c.SubscriptionExpiresAt,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            });

            return Ok(companyDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching companies");
            return StatusCode(500, "Internal server error");
        }
    }
}
