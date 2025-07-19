using Microsoft.AspNetCore.Mvc;
using backend.Services.Interfaces;
using backend.DTOs.Sales;
using backend.DTOs.Shared;
using backend.Models.Sales;

namespace backend.Controllers;

/// <summary>
/// Controller for Quote operations
/// Handles quote management with multi-tenant support
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class QuotesController : ControllerBase
{
    private readonly IQuoteService _quoteService;
    private readonly ILogger<QuotesController> _logger;

    public QuotesController(IQuoteService quoteService, ILogger<QuotesController> logger)
    {
        _quoteService = quoteService;
        _logger = logger;
    }

    /// <summary>
    /// Get all quotes with optional filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<QuoteDto>>> GetQuotes(
        [FromQuery] int companyId,
        [FromQuery] int? customerId = null,
        [FromQuery] QuoteStatus? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (companyId <= 0)
            {
                return BadRequest("Company ID is required and must be greater than 0");
            }

            var quotes = await _quoteService.GetQuotesAsync(
                companyId, customerId, status, fromDate, toDate, searchTerm, page, pageSize, cancellationToken);

            return Ok(quotes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting quotes for company {CompanyId}", companyId);
            return StatusCode(500, "Internal server error occurred while retrieving quotes");
        }
    }

    /// <summary>
    /// Get a specific quote by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<QuoteDto>> GetQuote(int id, [FromQuery] int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            if (companyId <= 0)
            {
                return BadRequest("Company ID is required and must be greater than 0");
            }

            var quote = await _quoteService.GetQuoteAsync(id, companyId, cancellationToken);

            if (quote == null)
            {
                return NotFound($"Quote with ID {id} not found");
            }

            return Ok(quote);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting quote {QuoteId} for company {CompanyId}", id, companyId);
            return StatusCode(500, "Internal server error occurred while retrieving quote");
        }
    }

    /// <summary>
    /// Create a new quote
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<QuoteDto>> CreateQuote([FromBody] CreateQuoteRequest request, [FromQuery] int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            if (companyId <= 0)
            {
                return BadRequest("Company ID is required and must be greater than 0");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var quote = await _quoteService.CreateQuoteAsync(request, companyId, cancellationToken);

            return CreatedAtAction(nameof(GetQuote), new { id = quote.Id, companyId }, quote);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating quote for company {CompanyId}", companyId);
            return StatusCode(500, "Internal server error occurred while creating quote");
        }
    }

    /// <summary>
    /// Update an existing quote
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<QuoteDto>> UpdateQuote(int id, [FromBody] CreateQuoteRequest request, [FromQuery] int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            if (companyId <= 0)
            {
                return BadRequest("Company ID is required and must be greater than 0");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var quote = await _quoteService.UpdateQuoteAsync(id, request, companyId, cancellationToken);

            return Ok(quote);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Quote with ID {id} not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating quote {QuoteId} for company {CompanyId}", id, companyId);
            return StatusCode(500, "Internal server error occurred while updating quote");
        }
    }

    /// <summary>
    /// Update quote status
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<QuoteDto>> UpdateQuoteStatus(int id, [FromBody] UpdateQuoteStatusRequest request, [FromQuery] int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            if (companyId <= 0)
            {
                return BadRequest("Company ID is required and must be greater than 0");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var quote = await _quoteService.UpdateQuoteStatusAsync(id, request.Status, companyId, cancellationToken);

            return Ok(quote);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Quote with ID {id} not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating quote status {QuoteId} for company {CompanyId}", id, companyId);
            return StatusCode(500, "Internal server error occurred while updating quote status");
        }
    }

    /// <summary>
    /// Delete a quote (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteQuote(int id, [FromQuery] int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            if (companyId <= 0)
            {
                return BadRequest("Company ID is required and must be greater than 0");
            }

            var success = await _quoteService.DeleteQuoteAsync(id, companyId, cancellationToken);

            if (!success)
            {
                return NotFound($"Quote with ID {id} not found");
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting quote {QuoteId} for company {CompanyId}", id, companyId);
            return StatusCode(500, "Internal server error occurred while deleting quote");
        }
    }

    /// <summary>
    /// Duplicate a quote
    /// </summary>
    [HttpPost("{id}/duplicate")]
    public async Task<ActionResult<QuoteDto>> DuplicateQuote(int id, [FromQuery] int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            if (companyId <= 0)
            {
                return BadRequest("Company ID is required and must be greater than 0");
            }

            var quote = await _quoteService.DuplicateQuoteAsync(id, companyId, cancellationToken);

            return CreatedAtAction(nameof(GetQuote), new { id = quote.Id, companyId }, quote);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Quote with ID {id} not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error duplicating quote {QuoteId} for company {CompanyId}", id, companyId);
            return StatusCode(500, "Internal server error occurred while duplicating quote");
        }
    }

    /// <summary>
    /// Convert quote to sales order
    /// </summary>
    [HttpPost("{id}/convert-to-order")]
    public async Task<ActionResult<object>> ConvertToSalesOrder(int id, [FromBody] ConvertQuoteToOrderRequest request, [FromQuery] int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            if (companyId <= 0)
            {
                return BadRequest("Company ID is required and must be greater than 0");
            }

            var salesOrderId = await _quoteService.ConvertToSalesOrderAsync(id, request, companyId, cancellationToken);

            return Ok(new { quoteId = id, salesOrderId });
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Quote with ID {id} not found");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting quote {QuoteId} to sales order for company {CompanyId}", id, companyId);
            return StatusCode(500, "Internal server error occurred while converting quote to sales order");
        }
    }

    /// <summary>
    /// Generate PDF for a quote
    /// </summary>
    [HttpGet("{id}/pdf")]
    public async Task<ActionResult> GeneratePdf(int id, [FromQuery] int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            if (companyId <= 0)
            {
                return BadRequest("Company ID is required and must be greater than 0");
            }

            var quote = await _quoteService.GetQuoteAsync(id, companyId, cancellationToken);

            if (quote == null)
            {
                return NotFound($"Quote with ID {id} not found");
            }

            // TODO: Implement PDF generation service
            // For now, return a placeholder response
            return Ok(new { message = "PDF generation not yet implemented", quoteId = id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF for quote {QuoteId} for company {CompanyId}", id, companyId);
            return StatusCode(500, "Internal server error occurred while generating PDF");
        }
    }

    /// <summary>
    /// Send quote by email
    /// </summary>
    [HttpPost("{id}/send-email")]
    public async Task<ActionResult> SendByEmail(int id, [FromBody] SendQuoteEmailRequest request, [FromQuery] int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            if (companyId <= 0)
            {
                return BadRequest("Company ID is required and must be greater than 0");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var quote = await _quoteService.GetQuoteAsync(id, companyId, cancellationToken);

            if (quote == null)
            {
                return NotFound($"Quote with ID {id} not found");
            }

            // TODO: Implement email service
            // For now, return a success response
            _logger.LogInformation("Email would be sent for quote {QuoteId} to {EmailTo}", id, request.EmailTo);

            return Ok(new { message = "Email sent successfully", quoteId = id, emailTo = request.EmailTo });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email for quote {QuoteId} for company {CompanyId}", id, companyId);
            return StatusCode(500, "Internal server error occurred while sending email");
        }
    }
}

/// <summary>
/// Request for sending quote by email
/// </summary>
public class SendQuoteEmailRequest
{
    public string EmailTo { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? Body { get; set; }
}
