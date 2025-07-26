using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Sales;
using backend.Services.Interfaces;
using backend.DTOs.Shared;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// API controller for sales order management operations
/// </summary>
[Route("api/[controller]")]
[Produces("application/json")]
public class SalesController : BaseApiController
{
    private readonly ISalesOrderService _salesOrderService;
    private readonly AccountingDbContext _context;

    public SalesController(
        ISalesOrderService salesOrderService,
        AccountingDbContext context,
        ILogger<SalesController> logger) : base(logger)
    {
        _salesOrderService = salesOrderService ?? throw new ArgumentNullException(nameof(salesOrderService));
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    /// <summary>
    /// Gets all sales orders for the current company
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="status">Optional status filter</param>
    /// <param name="customerId">Optional customer filter</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 50)</param>
    /// <returns>List of sales orders</returns>
    [HttpGet("orders")]
    [ProducesResponseType<IEnumerable<SalesOrderDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<SalesOrderDto>>> GetSalesOrders(
        [FromQuery] int? companyId = null,
        [FromQuery] SalesOrderStatus? status = null,
        [FromQuery] int? customerId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            // In a real app, companyId would come from authenticated user context
            var currentCompanyId = companyId ?? 1; // Default for now
            
            _logger.LogInformation("Retrieving sales orders for company {CompanyId}, page {Page}, size {PageSize}", 
                currentCompanyId, page, pageSize);

            var query = _context.SalesOrders
                .Include(so => so.Customer)
                .Include(so => so.Agent)
                .Include(so => so.Lines)
                    .ThenInclude(l => l.Item)
                .Where(so => so.CompanyId == currentCompanyId && !so.IsDeleted);

            // Apply filters
            if (status.HasValue)
            {
                query = query.Where(so => so.Status == status.Value);
            }

            if (customerId.HasValue)
            {
                query = query.Where(so => so.CustomerId == customerId.Value);
            }

            var salesOrders = await query
                .OrderByDescending(so => so.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(so => new SalesOrderDto
                {
                    Id = so.Id,
                    CompanyId = so.CompanyId,
                    CustomerId = so.CustomerId,
                    CustomerName = so.Customer.Name,
                    AgentId = so.AgentId,
                    AgentName = so.Agent != null ? so.Agent.Name : null,
                    OrderNumber = so.OrderNumber,
                    OrderDate = so.OrderDate,
                    RequiredDate = so.RequiredDate,
                    PromisedDate = so.PromisedDate,
                    Status = so.Status,
                    SubtotalAmount = so.SubtotalAmount,
                    TaxAmount = so.TaxAmount,
                    TotalAmount = so.TotalAmount,
                    PaidAmount = so.PaidAmount,
                    Currency = so.Currency,
                    Notes = so.Notes,
                    Lines = so.Lines.Select(l => new SalesOrderLineDto
                    {
                        Id = l.Id,
                        SalesOrderId = l.SalesOrderId,
                        ItemId = l.ItemId,
                        ItemName = l.Item.Name,
                        ItemSku = l.Item.SKU,
                        LineNumber = l.LineNumber,
                        Description = l.Description,
                        Quantity = l.Quantity,
                        UnitPrice = l.UnitPrice,
                        DiscountPercent = l.DiscountPercent,
                        TaxRate = l.TaxRate,
                        TaxAmount = l.TaxAmount,
                        LineTotal = l.LineTotal
                    }).ToList(),
                    CreatedAt = so.CreatedAt,
                    UpdatedAt = so.UpdatedAt
                })
                .ToListAsync();

            return SuccessResponse(salesOrders.AsEnumerable());
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"retrieving sales orders for company {companyId}");
        }
    }

    /// <summary>
    /// Gets a specific sales order by ID
    /// </summary>
    /// <param name="id">Sales order ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Sales order details</returns>
    [HttpGet("orders/{id:int}")]
    [ProducesResponseType<SalesOrderDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SalesOrderDto>> GetSalesOrder(int id, [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            
            _logger.LogInformation("Retrieving sales order {OrderId} for company {CompanyId}", id, currentCompanyId);

            var salesOrder = await _context.SalesOrders
                .Include(so => so.Customer)
                .Include(so => so.Agent)
                .Include(so => so.Lines)
                    .ThenInclude(l => l.Item)
                .Where(so => so.Id == id && so.CompanyId == currentCompanyId && !so.IsDeleted)
                .Select(so => new SalesOrderDto
                {
                    Id = so.Id,
                    CompanyId = so.CompanyId,
                    CustomerId = so.CustomerId,
                    CustomerName = so.Customer.Name,
                    AgentId = so.AgentId,
                    AgentName = so.Agent != null ? so.Agent.Name : null,
                    OrderNumber = so.OrderNumber,
                    OrderDate = so.OrderDate,
                    RequiredDate = so.RequiredDate,
                    PromisedDate = so.PromisedDate,
                    Status = so.Status,
                    SubtotalAmount = so.SubtotalAmount,
                    TaxAmount = so.TaxAmount,
                    TotalAmount = so.TotalAmount,
                    PaidAmount = so.PaidAmount,
                    Currency = so.Currency,
                    Notes = so.Notes,
                    Lines = so.Lines.Select(l => new SalesOrderLineDto
                    {
                        Id = l.Id,
                        SalesOrderId = l.SalesOrderId,
                        ItemId = l.ItemId,
                        ItemName = l.Item.Name,
                        ItemSku = l.Item.SKU,
                        LineNumber = l.LineNumber,
                        Description = l.Description,
                        Quantity = l.Quantity,
                        UnitPrice = l.UnitPrice,
                        DiscountPercent = l.DiscountPercent,
                        TaxRate = l.TaxRate,
                        TaxAmount = l.TaxAmount,
                        LineTotal = l.LineTotal
                    }).ToList(),
                    CreatedAt = so.CreatedAt,
                    UpdatedAt = so.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (salesOrder == null)
            {
                return ErrorResponse($"Sales order {id} not found", 404);
            }

            return SuccessResponse(salesOrder);
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"retrieving sales order {id}");
        }
    }

    /// <summary>
    /// Creates a new sales order
    /// </summary>
    /// <param name="request">Sales order creation request</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Created sales order</returns>
    [HttpPost("orders")]
    [ProducesResponseType<SalesOrderDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SalesOrderDto>> CreateSalesOrder(
        [FromBody] CreateSalesOrderRequest request,
        [FromQuery] int? companyId = null)
    {
        try
        {
            // Validate request
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentCompanyId = companyId ?? 1;
            var userId = "system"; // In real app, get from authenticated user

            _logger.LogInformation("Creating sales order for customer {CustomerId} in company {CompanyId}", 
                request.CustomerId, currentCompanyId);

            // Map request to entity
            var salesOrder = new SalesOrder
            {
                CustomerId = request.CustomerId,
                AgentId = request.AgentId,
                OrderDate = request.OrderDate ?? DateTime.UtcNow,
                RequiredDate = request.RequiredDate,
                PromisedDate = request.PromisedDate,
                Status = request.Status ?? SalesOrderStatus.Draft,
                Currency = request.Currency ?? "ILS",
                Notes = request.Notes,
                Lines = request.Lines.Select((line, index) => new SalesOrderLine
                {
                    LineNumber = index + 1,
                    ItemId = line.ItemId,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    DiscountPercent = line.DiscountPercent,
                    TaxRate = line.TaxRate
                }).ToList()
            };

            var createdOrder = await _salesOrderService.CreateSalesOrderAsync(salesOrder, currentCompanyId, userId);

            // Return created order with full details
            var result = await GetSalesOrder(createdOrder.Id, currentCompanyId);
            if (result.Result is OkObjectResult okResult && okResult.Value is SalesOrderDto dto)
            {
                return CreatedAtAction(nameof(GetSalesOrder), new { id = createdOrder.Id }, dto);
            }

            return StatusCode(StatusCodes.Status500InternalServerError, "Error retrieving created order");
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation creating sales order");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating sales order");
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Updates a sales order status
    /// </summary>
    /// <param name="id">Sales order ID</param>
    /// <param name="request">Status update request</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Updated sales order</returns>
    [HttpPut("orders/{id:int}/status")]
    [ProducesResponseType<SalesOrderDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SalesOrderDto>> UpdateSalesOrderStatus(
        int id,
        [FromBody] UpdateSalesOrderStatusRequest request,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            var userId = "system"; // In real app, get from authenticated user

            _logger.LogInformation("Updating sales order {OrderId} status to {Status}", id, request.Status);

            await _salesOrderService.UpdateStatusAsync(id, request.Status, currentCompanyId, userId);

            // Return updated order
            var result = await GetSalesOrder(id, currentCompanyId);
            return result;
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation updating sales order {OrderId}", id);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating sales order {OrderId} status", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Gets sales summary for a date range
    /// </summary>
    /// <param name="fromDate">Start date</param>
    /// <param name="toDate">End date</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Sales summary</returns>
    [HttpGet("summary")]
    [ProducesResponseType<SalesSummaryDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SalesSummaryDto>> GetSalesSummary(
        [FromQuery, Required] DateTime fromDate,
        [FromQuery, Required] DateTime toDate,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;

            _logger.LogInformation("Retrieving sales summary for company {CompanyId} from {FromDate} to {ToDate}", 
                currentCompanyId, fromDate, toDate);

            var summary = await _salesOrderService.GetSalesSummaryAsync(currentCompanyId, fromDate, toDate);

            var summaryDto = new SalesSummaryDto
            {
                FromDate = summary.FromDate,
                ToDate = summary.ToDate,
                TotalSales = summary.TotalSales,
                TotalTax = summary.TotalTax,
                NetSales = summary.NetSales,
                OrderCount = summary.OrderCount,
                AverageOrderValue = summary.AverageOrderValue,
                UniqueCustomers = summary.UniqueCustomers
            };

            return Ok(summaryDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales summary");
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Test endpoint to validate sales order request format
    /// </summary>
    /// <param name="request">Sales order creation request</param>
    /// <returns>Validation result</returns>
    [HttpPost("orders/validate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult ValidateSalesOrderRequest([FromBody] CreateSalesOrderRequest? request)
    {
        if (request == null)
        {
            return BadRequest(new { error = "Request body is required", received = "null" });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(new { 
                error = "Validation failed", 
                modelState = ModelState,
                receivedRequest = request 
            });
        }

        return Ok(new { 
            message = "Request is valid", 
            request = request,
            statusMapping = new {
                Draft = SalesOrderStatus.Draft,
                Confirmed = SalesOrderStatus.Confirmed,
                PartiallyShipped = SalesOrderStatus.PartiallyShipped,
                Shipped = SalesOrderStatus.Shipped,
                Completed = SalesOrderStatus.Completed,
                Cancelled = SalesOrderStatus.Cancelled
            }
        });
    }
}

// DTOs for API responses
public class SalesOrderDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int? AgentId { get; set; }
    public string? AgentName { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime? RequiredDate { get; set; }
    public DateTime? PromisedDate { get; set; }
    public SalesOrderStatus Status { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Currency { get; set; } = "ILS";
    public string? Notes { get; set; }
    public List<SalesOrderLineDto> Lines { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SalesOrderLineDto
{
    public int Id { get; set; }
    public int SalesOrderId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public int LineNumber { get; set; }
    public string? Description { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
}

public class SalesSummaryDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalTax { get; set; }
    public decimal NetSales { get; set; }
    public int OrderCount { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int UniqueCustomers { get; set; }
}

// Request DTOs
/// <summary>
/// Request model for creating a new sales order
/// Example JSON:
/// {
///   "customerId": 1,
///   "agentId": null,
///   "orderDate": "2025-07-11T10:00:00Z",
///   "dueDate": "2025-08-11T10:00:00Z",
///   "status": "Quote",
///   "currency": "ILS",
///   "notes": "Test order",
///   "lines": [
///     {
///       "itemId": 1,
///       "description": "Test item",
///       "quantity": 2,
///       "unitPrice": 100.00,
///       "discountPercent": 0,
///       "taxRate": 17
///     }
///   ]
/// }
/// </summary>
public class CreateSalesOrderRequest
{
    [Required]
    public int CustomerId { get; set; }
    
    public int? AgentId { get; set; }
    
    public DateTime? OrderDate { get; set; }
    
    public DateTime? RequiredDate { get; set; }
    
    public DateTime? PromisedDate { get; set; }
    
    public SalesOrderStatus? Status { get; set; }
    
    public string? Currency { get; set; }
    
    public string? Notes { get; set; }
    
    [Required]
    public List<CreateSalesOrderLineRequest> Lines { get; set; } = new();
}

public class CreateSalesOrderLineRequest
{
    [Required]
    public int ItemId { get; set; }
    
    public string? Description { get; set; }
    
    [Required]
    [Range(0.0001, double.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
    public decimal Quantity { get; set; }
    
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Unit price cannot be negative")]
    public decimal UnitPrice { get; set; }
    
    [Range(0, 100, ErrorMessage = "Discount percent must be between 0 and 100")]
    public decimal DiscountPercent { get; set; } = 0;
    
    [Range(0, 100, ErrorMessage = "Tax rate must be between 0 and 100")]
    public decimal TaxRate { get; set; } = 17; // Default Israeli VAT
}

public class UpdateSalesOrderStatusRequest
{
    [Required]
    public SalesOrderStatus Status { get; set; }
}
