using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Sales;
using backend.Services.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// API controller for sales order management operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SalesController : ControllerBase
{
    private readonly ISalesOrderService _salesOrderService;
    private readonly AccountingDbContext _context;
    private readonly ILogger<SalesController> _logger;

    public SalesController(
        ISalesOrderService salesOrderService,
        AccountingDbContext context,
        ILogger<SalesController> logger)
    {
        _salesOrderService = salesOrderService ?? throw new ArgumentNullException(nameof(salesOrderService));
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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
                    DueDate = so.DueDate,
                    DeliveryDate = so.DeliveryDate,
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
                        ItemSku = l.Item.Sku,
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

            return Ok(salesOrders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales orders for company {CompanyId}", companyId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
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
                    DueDate = so.DueDate,
                    DeliveryDate = so.DeliveryDate,
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
                        ItemSku = l.Item.Sku,
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
                return NotFound($"Sales order {id} not found");
            }

            return Ok(salesOrder);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales order {OrderId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
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
                DueDate = request.DueDate,
                DeliveryDate = request.DeliveryDate,
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
    /// Process payment for a sales order
    /// </summary>
    /// <param name="id">Sales order ID</param>
    /// <param name="request">Payment processing request</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Payment receipt</returns>
    [HttpPost("orders/{id:int}/payment")]
    [ProducesResponseType<ReceiptDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ReceiptDto>> ProcessPayment(
        int id,
        [FromBody] ProcessPaymentRequest request,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            var userId = "system"; // In real app, get from authenticated user

            _logger.LogInformation("Processing payment of {Amount:C} for sales order {OrderId}", 
                request.Amount, id);

            var receipt = await _salesOrderService.ProcessPaymentAsync(
                id, request.Amount, request.PaymentMethod, currentCompanyId, userId);

            var receiptDto = new ReceiptDto
            {
                Id = receipt.Id,
                SalesOrderId = receipt.SalesOrderId,
                ReceiptNumber = receipt.ReceiptNumber,
                PaymentDate = receipt.PaymentDate,
                Amount = receipt.Amount,
                PaymentMethod = receipt.PaymentMethod,
                Notes = receipt.Notes,
                CreatedAt = receipt.CreatedAt
            };

            return Ok(receiptDto);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation processing payment for sales order {OrderId}", id);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment for sales order {OrderId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Gets all receipts/payments for a specific sales order
    /// </summary>
    /// <param name="id">Sales order ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>List of receipts for the order</returns>
    [HttpGet("orders/{id:int}/receipts")]
    [ProducesResponseType<IEnumerable<ReceiptDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<ReceiptDto>>> GetOrderReceipts(
        int id,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;

            _logger.LogInformation("Getting receipts for sales order {OrderId}", id);

            // First check if the order exists and belongs to the company
            var order = await _context.SalesOrders
                .Where(o => o.Id == id && o.CompanyId == currentCompanyId)
                .FirstOrDefaultAsync();

            if (order == null)
            {
                return NotFound($"Sales order with ID {id} not found");
            }

            // Get all receipts for this order
            var receipts = await _context.Receipts
                .Where(r => r.SalesOrderId == id && r.CompanyId == currentCompanyId)
                .OrderByDescending(r => r.PaymentDate)
                .ToListAsync();

            var receiptDtos = receipts.Select(receipt => new ReceiptDto
            {
                Id = receipt.Id,
                SalesOrderId = receipt.SalesOrderId,
                ReceiptNumber = receipt.ReceiptNumber,
                PaymentDate = receipt.PaymentDate,
                Amount = receipt.Amount,
                PaymentMethod = receipt.PaymentMethod,
                Notes = receipt.Notes,
                CreatedAt = receipt.CreatedAt
            }).ToList();

            return Ok(receiptDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting receipts for sales order {OrderId}", id);
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
                Shipped = SalesOrderStatus.Shipped,
                Invoiced = SalesOrderStatus.Invoiced,
                Paid = SalesOrderStatus.Paid,
                Cancelled = SalesOrderStatus.Cancelled
            }
        });
    }

    /// <summary>
    /// Recalculate PaidAmount for a specific sales order
    /// </summary>
    /// <param name="id">Sales order ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Updated sales order</returns>
    [HttpPost("orders/{id:int}/recalculate-paid-amount")]
    [ProducesResponseType<SalesOrderDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SalesOrderDto>> RecalculatePaidAmount(
        int id,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            var userId = "system"; // In real app, get from authenticated user

            _logger.LogInformation("Recalculating PaidAmount for sales order {OrderId}", id);

            var salesOrder = await _salesOrderService.RecalculatePaidAmountAsync(id, currentCompanyId, userId);

            var salesOrderDto = new SalesOrderDto
            {
                Id = salesOrder.Id,
                CompanyId = salesOrder.CompanyId,
                CustomerId = salesOrder.CustomerId,
                CustomerName = salesOrder.Customer?.Name ?? "",
                AgentId = salesOrder.AgentId,
                AgentName = salesOrder.Agent?.Name,
                OrderNumber = salesOrder.OrderNumber,
                OrderDate = salesOrder.OrderDate,
                DueDate = salesOrder.DueDate,
                DeliveryDate = salesOrder.DeliveryDate,
                Status = salesOrder.Status,
                SubtotalAmount = salesOrder.SubtotalAmount,
                TaxAmount = salesOrder.TaxAmount,
                TotalAmount = salesOrder.TotalAmount,
                PaidAmount = salesOrder.PaidAmount,
                Currency = salesOrder.Currency,
                Notes = salesOrder.Notes,
                Lines = new List<SalesOrderLineDto>(), // Not needed for this response
                CreatedAt = salesOrder.CreatedAt,
                UpdatedAt = salesOrder.UpdatedAt
            };

            return Ok(salesOrderDto);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Sales order {OrderId} not found", id);
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalculating PaidAmount for sales order {OrderId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Recalculate PaidAmount for all sales orders in the company
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Number of orders updated</returns>
    [HttpPost("recalculate-all-paid-amounts")]
    [ProducesResponseType<RecalculateResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<RecalculateResult>> RecalculateAllPaidAmounts(
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            var userId = "system"; // In real app, get from authenticated user

            _logger.LogInformation("Recalculating PaidAmount for all sales orders in company {CompanyId}", currentCompanyId);

            var updatedCount = await _salesOrderService.RecalculateAllPaidAmountsAsync(currentCompanyId, userId);

            return Ok(new RecalculateResult 
            { 
                UpdatedOrdersCount = updatedCount,
                Message = $"Successfully recalculated PaidAmount for {updatedCount} sales orders"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalculating PaidAmounts for company {CompanyId}", companyId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    // ...existing code...
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
    public DateTime? DueDate { get; set; }
    public DateTime? DeliveryDate { get; set; }
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

public class ReceiptDto
{
    public int Id { get; set; }
    public int SalesOrderId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
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
///   "status": "Draft",
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
    
    public DateTime? DueDate { get; set; }
    
    public DateTime? DeliveryDate { get; set; }
    
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

public class ProcessPaymentRequest
{
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Payment amount must be greater than 0")]
    public decimal Amount { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class RecalculateResult
{
    public int UpdatedOrdersCount { get; set; }
    public string Message { get; set; } = string.Empty;
}
