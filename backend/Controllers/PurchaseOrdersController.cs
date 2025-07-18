using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Purchasing;
using backend.Services.Interfaces;
using backend.DTOs.Shared;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// API controller for purchase order management operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseOrderService _purchaseOrderService;
    private readonly AccountingDbContext _context;
    private readonly ILogger<PurchaseOrdersController> _logger;

    public PurchaseOrdersController(
        IPurchaseOrderService purchaseOrderService,
        AccountingDbContext context,
        ILogger<PurchaseOrdersController> logger)
    {
        _purchaseOrderService = purchaseOrderService ?? throw new ArgumentNullException(nameof(purchaseOrderService));
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all purchase orders for the current company
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="status">Optional status filter</param>
    /// <param name="supplierId">Optional supplier filter</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 50)</param>
    /// <returns>List of purchase orders</returns>
    [HttpGet]
    [ProducesResponseType<IEnumerable<PurchaseOrderDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<PurchaseOrderDto>>> GetPurchaseOrders(
        [FromQuery] int? companyId = null,
        [FromQuery] PurchaseOrderStatus? status = null,
        [FromQuery] int? supplierId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            // Use company ID from query parameter or fallback to a default
            var currentCompanyId = companyId ?? 1; // TODO: Get from authenticated user context

            var (purchaseOrdersList, totalCount) = await _purchaseOrderService.GetAllAsync(currentCompanyId);
            var purchaseOrders = purchaseOrdersList.AsEnumerable();

            // Apply filters
            if (status.HasValue)
            {
                purchaseOrders = purchaseOrders.Where(po => po.Status == status.Value);
            }

            if (supplierId.HasValue)
            {
                purchaseOrders = purchaseOrders.Where(po => po.SupplierId == supplierId.Value);
            }

            // Convert to DTOs with supplier information
            var purchaseOrderDtos = purchaseOrders.Select(order => new PurchaseOrderDto
            {
                Id = order.Id,
                CompanyId = order.CompanyId,
                SupplierId = order.SupplierId,
                SupplierName = order.Supplier?.Name ?? "Unknown",
                OrderNumber = order.OrderNumber,
                SupplierInvoiceNumber = order.SupplierInvoiceNumber,
                OrderDate = order.OrderDate,
                DueDate = order.DueDate,
                DeliveryDate = order.DeliveryDate,
                Status = order.Status,
                SubtotalAmount = order.SubtotalAmount,
                DiscountAmount = order.DiscountAmount,
                TaxAmount = order.TaxAmount,
                TotalAmount = order.TotalAmount,
                PaidAmount = order.PaidAmount,
                Currency = order.Currency,
                ExchangeRate = order.ExchangeRate,
                Notes = order.Notes,
                DeliveryAddress = order.DeliveryAddress,
                Lines = order.Lines?.Select(line => new PurchaseOrderLineDto
                {
                    Id = line.Id,
                    PurchaseOrderId = line.PurchaseOrderId,
                    ItemId = line.ItemId,
                    ItemName = line.Item?.Name ?? "Unknown",
                    ItemSku = line.Item?.SKU ?? "",
                    LineNumber = line.LineNumber,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitCost = line.UnitCost,
                    TaxRate = line.TaxRate,
                    TaxAmount = line.TaxAmount,
                    LineTotal = line.LineTotal,
                    ReceivedQuantity = line.ReceivedQuantity
                }).ToList() ?? new List<PurchaseOrderLineDto>(),
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt
            }).ToList();

            return Ok(purchaseOrderDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving purchase orders for company {CompanyId}", companyId);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Gets a specific purchase order by ID
    /// </summary>
    /// <param name="id">Purchase order ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Purchase order details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType<PurchaseOrderDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PurchaseOrderDto>> GetPurchaseOrder(int id, [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1; // TODO: Get from authenticated user context

            var purchaseOrder = await _purchaseOrderService.GetByIdAsync(id, currentCompanyId);
            if (purchaseOrder == null)
            {
                return NotFound($"Purchase order with ID {id} not found");
            }

            var purchaseOrderDto = new PurchaseOrderDto
            {
                Id = purchaseOrder.Id,
                CompanyId = purchaseOrder.CompanyId,
                SupplierId = purchaseOrder.SupplierId,
                SupplierName = purchaseOrder.Supplier?.Name ?? "Unknown",
                OrderNumber = purchaseOrder.OrderNumber,
                SupplierInvoiceNumber = purchaseOrder.SupplierInvoiceNumber,
                OrderDate = purchaseOrder.OrderDate,
                DueDate = purchaseOrder.DueDate,
                DeliveryDate = purchaseOrder.DeliveryDate,
                Status = purchaseOrder.Status,
                SubtotalAmount = purchaseOrder.SubtotalAmount,
                DiscountAmount = purchaseOrder.DiscountAmount,
                TaxAmount = purchaseOrder.TaxAmount,
                TotalAmount = purchaseOrder.TotalAmount,
                PaidAmount = purchaseOrder.PaidAmount,
                Currency = purchaseOrder.Currency,
                ExchangeRate = purchaseOrder.ExchangeRate,
                Notes = purchaseOrder.Notes,
                DeliveryAddress = purchaseOrder.DeliveryAddress,
                Lines = purchaseOrder.Lines?.Select(line => new PurchaseOrderLineDto
                {
                    Id = line.Id,
                    PurchaseOrderId = line.PurchaseOrderId,
                    ItemId = line.ItemId,
                    ItemName = line.Item?.Name ?? "Unknown",
                    ItemSku = line.Item?.SKU ?? "",
                    LineNumber = line.LineNumber,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitCost = line.UnitCost,
                    TaxRate = line.TaxRate,
                    TaxAmount = line.TaxAmount,
                    LineTotal = line.LineTotal,
                    ReceivedQuantity = line.ReceivedQuantity
                }).ToList() ?? new List<PurchaseOrderLineDto>(),
                CreatedAt = purchaseOrder.CreatedAt,
                UpdatedAt = purchaseOrder.UpdatedAt
            };

            return Ok(purchaseOrderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving purchase order {OrderId}", id);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Creates a new purchase order
    /// </summary>
    /// <param name="request">Purchase order creation request</param>
    /// <returns>Created purchase order</returns>
    [HttpPost]
    [ProducesResponseType<PurchaseOrderDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PurchaseOrderDto>> CreatePurchaseOrder([FromBody] CreatePurchaseOrderRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentCompanyId = request.CompanyId ?? 1; // TODO: Get from authenticated user context
            var userId = "system"; // TODO: Get from authenticated user context

            var purchaseOrder = new PurchaseOrder
            {
                CompanyId = currentCompanyId,
                SupplierId = request.SupplierId,
                OrderDate = request.OrderDate,
                DueDate = request.DueDate,
                DeliveryDate = request.DeliveryDate,
                Status = request.Status,
                Currency = request.Currency ?? "ILS",
                ExchangeRate = request.ExchangeRate,
                Notes = request.Notes,
                DeliveryAddress = request.DeliveryAddress,
                Lines = request.Lines.Select((line, index) => new PurchaseOrderLine
                {
                    CompanyId = currentCompanyId,
                    ItemId = line.ItemId,
                    LineNumber = index + 1,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitCost = line.UnitCost,
                    TaxRate = line.TaxRate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = userId,
                    UpdatedBy = userId,
                    IsDeleted = false
                }).ToList(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                UpdatedBy = userId,
                IsDeleted = false
            };

            var createdPurchaseOrder = await _purchaseOrderService.CreatePurchaseOrderAsync(purchaseOrder, currentCompanyId, userId);

            var purchaseOrderDto = new PurchaseOrderDto
            {
                Id = createdPurchaseOrder.Id,
                CompanyId = createdPurchaseOrder.CompanyId,
                SupplierId = createdPurchaseOrder.SupplierId,
                SupplierName = createdPurchaseOrder.Supplier?.Name ?? "Unknown",
                OrderNumber = createdPurchaseOrder.OrderNumber,
                SupplierInvoiceNumber = createdPurchaseOrder.SupplierInvoiceNumber,
                OrderDate = createdPurchaseOrder.OrderDate,
                DueDate = createdPurchaseOrder.DueDate,
                DeliveryDate = createdPurchaseOrder.DeliveryDate,
                Status = createdPurchaseOrder.Status,
                SubtotalAmount = createdPurchaseOrder.SubtotalAmount,
                DiscountAmount = createdPurchaseOrder.DiscountAmount,
                TaxAmount = createdPurchaseOrder.TaxAmount,
                TotalAmount = createdPurchaseOrder.TotalAmount,
                PaidAmount = createdPurchaseOrder.PaidAmount,
                Currency = createdPurchaseOrder.Currency,
                ExchangeRate = createdPurchaseOrder.ExchangeRate,
                Notes = createdPurchaseOrder.Notes,
                DeliveryAddress = createdPurchaseOrder.DeliveryAddress,
                Lines = createdPurchaseOrder.Lines?.Select(line => new PurchaseOrderLineDto
                {
                    Id = line.Id,
                    PurchaseOrderId = line.PurchaseOrderId,
                    ItemId = line.ItemId,
                    ItemName = line.Item?.Name ?? "Unknown",
                    ItemSku = line.Item?.SKU ?? "",
                    LineNumber = line.LineNumber,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitCost = line.UnitCost,
                    TaxRate = line.TaxRate,
                    TaxAmount = line.TaxAmount,
                    LineTotal = line.LineTotal,
                    ReceivedQuantity = line.ReceivedQuantity
                }).ToList() ?? new List<PurchaseOrderLineDto>(),
                CreatedAt = createdPurchaseOrder.CreatedAt,
                UpdatedAt = createdPurchaseOrder.UpdatedAt
            };

            return CreatedAtAction(nameof(GetPurchaseOrder), new { id = createdPurchaseOrder.Id }, purchaseOrderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating purchase order");
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Updates purchase order status
    /// </summary>
    /// <param name="id">Purchase order ID</param>
    /// <param name="request">Status update request</param>
    /// <returns>Updated purchase order</returns>
    [HttpPut("{id}/status")]
    [ProducesResponseType<PurchaseOrderDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PurchaseOrderDto>> UpdatePurchaseOrderStatus(int id, [FromBody] UpdatePurchaseOrderStatusRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentCompanyId = request.CompanyId ?? 1; // TODO: Get from authenticated user context
            var userId = "system"; // TODO: Get from authenticated user context

            var updatedPurchaseOrder = await _purchaseOrderService.UpdateStatusAsync(id, request.Status, currentCompanyId, userId);

            var purchaseOrderDto = new PurchaseOrderDto
            {
                Id = updatedPurchaseOrder.Id,
                CompanyId = updatedPurchaseOrder.CompanyId,
                SupplierId = updatedPurchaseOrder.SupplierId,
                SupplierName = updatedPurchaseOrder.Supplier?.Name ?? "Unknown",
                OrderNumber = updatedPurchaseOrder.OrderNumber,
                SupplierInvoiceNumber = updatedPurchaseOrder.SupplierInvoiceNumber,
                OrderDate = updatedPurchaseOrder.OrderDate,
                DueDate = updatedPurchaseOrder.DueDate,
                DeliveryDate = updatedPurchaseOrder.DeliveryDate,
                Status = updatedPurchaseOrder.Status,
                SubtotalAmount = updatedPurchaseOrder.SubtotalAmount,
                DiscountAmount = updatedPurchaseOrder.DiscountAmount,
                TaxAmount = updatedPurchaseOrder.TaxAmount,
                TotalAmount = updatedPurchaseOrder.TotalAmount,
                PaidAmount = updatedPurchaseOrder.PaidAmount,
                Currency = updatedPurchaseOrder.Currency,
                ExchangeRate = updatedPurchaseOrder.ExchangeRate,
                Notes = updatedPurchaseOrder.Notes,
                DeliveryAddress = updatedPurchaseOrder.DeliveryAddress,
                Lines = updatedPurchaseOrder.Lines?.Select(line => new PurchaseOrderLineDto
                {
                    Id = line.Id,
                    PurchaseOrderId = line.PurchaseOrderId,
                    ItemId = line.ItemId,
                    ItemName = line.Item?.Name ?? "Unknown",
                    ItemSku = line.Item?.SKU ?? "",
                    LineNumber = line.LineNumber,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitCost = line.UnitCost,
                    TaxRate = line.TaxRate,
                    TaxAmount = line.TaxAmount,
                    LineTotal = line.LineTotal,
                    ReceivedQuantity = line.ReceivedQuantity
                }).ToList() ?? new List<PurchaseOrderLineDto>(),
                CreatedAt = updatedPurchaseOrder.CreatedAt,
                UpdatedAt = updatedPurchaseOrder.UpdatedAt
            };

            return Ok(purchaseOrderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating purchase order {OrderId} status", id);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Receive goods for a purchase order
    /// </summary>
    /// <param name="id">Purchase order ID</param>
    /// <param name="request">Goods receipt request</param>
    /// <returns>Updated purchase order</returns>
    [HttpPost("{id}/receive")]
    [ProducesResponseType<PurchaseOrderDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PurchaseOrderDto>> ReceiveGoods(int id, [FromBody] ReceiveGoodsRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentCompanyId = request.CompanyId ?? 1; // TODO: Get from authenticated user context
            var userId = "system"; // TODO: Get from authenticated user context

            var receivedItems = request.ReceivedItems.Select(item => new ReceivedItem
            {
                ItemId = item.ItemId,
                QuantityReceived = item.QuantityReceived,
                UnitCost = item.UnitCost,
                Notes = item.Notes
            }).ToList();

            var updatedPurchaseOrder = await _purchaseOrderService.ReceiveGoodsAsync(id, receivedItems, currentCompanyId, userId);

            var purchaseOrderDto = new PurchaseOrderDto
            {
                Id = updatedPurchaseOrder.Id,
                CompanyId = updatedPurchaseOrder.CompanyId,
                SupplierId = updatedPurchaseOrder.SupplierId,
                SupplierName = updatedPurchaseOrder.Supplier?.Name ?? "Unknown",
                OrderNumber = updatedPurchaseOrder.OrderNumber,
                SupplierInvoiceNumber = updatedPurchaseOrder.SupplierInvoiceNumber,
                OrderDate = updatedPurchaseOrder.OrderDate,
                DueDate = updatedPurchaseOrder.DueDate,
                DeliveryDate = updatedPurchaseOrder.DeliveryDate,
                Status = updatedPurchaseOrder.Status,
                SubtotalAmount = updatedPurchaseOrder.SubtotalAmount,
                DiscountAmount = updatedPurchaseOrder.DiscountAmount,
                TaxAmount = updatedPurchaseOrder.TaxAmount,
                TotalAmount = updatedPurchaseOrder.TotalAmount,
                PaidAmount = updatedPurchaseOrder.PaidAmount,
                Currency = updatedPurchaseOrder.Currency,
                ExchangeRate = updatedPurchaseOrder.ExchangeRate,
                Notes = updatedPurchaseOrder.Notes,
                DeliveryAddress = updatedPurchaseOrder.DeliveryAddress,
                Lines = updatedPurchaseOrder.Lines?.Select(line => new PurchaseOrderLineDto
                {
                    Id = line.Id,
                    PurchaseOrderId = line.PurchaseOrderId,
                    ItemId = line.ItemId,
                    ItemName = line.Item?.Name ?? "Unknown",
                    ItemSku = line.Item?.SKU ?? "",
                    LineNumber = line.LineNumber,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitCost = line.UnitCost,
                    TaxRate = line.TaxRate,
                    TaxAmount = line.TaxAmount,
                    LineTotal = line.LineTotal,
                    ReceivedQuantity = line.ReceivedQuantity
                }).ToList() ?? new List<PurchaseOrderLineDto>(),
                CreatedAt = updatedPurchaseOrder.CreatedAt,
                UpdatedAt = updatedPurchaseOrder.UpdatedAt
            };

            return Ok(purchaseOrderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while receiving goods for purchase order {OrderId}", id);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Process payment for a purchase order
    /// </summary>
    /// <param name="id">Purchase order ID</param>
    /// <param name="request">Payment request</param>
    /// <returns>Payment details</returns>
    [HttpPost("{id}/payment")]
    [ProducesResponseType<PaymentDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PaymentDto>> ProcessPayment(int id, [FromBody] ProcessPaymentRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentCompanyId = request.CompanyId ?? 1; // TODO: Get from authenticated user context
            var userId = "system"; // TODO: Get from authenticated user context

            var payment = await _purchaseOrderService.ProcessPaymentAsync(id, request.Amount, request.PaymentMethod, currentCompanyId, userId);

            var paymentDto = new PaymentDto
            {
                Id = payment.Id,
                CompanyId = payment.CompanyId,
                PurchaseOrderId = payment.PurchaseOrderId,
                PaymentDate = payment.PaymentDate,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                PaymentNumber = payment.PaymentNumber,
                Notes = payment.Notes,
                CreatedAt = payment.CreatedAt
            };

            return Ok(paymentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while processing payment for purchase order {OrderId}", id);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Gets outstanding purchase orders (not fully paid)
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>List of outstanding purchase orders</returns>
    [HttpGet("outstanding")]
    [ProducesResponseType<IEnumerable<PurchaseOrderDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<PurchaseOrderDto>>> GetOutstandingOrders([FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1; // TODO: Get from authenticated user context

            var outstandingOrders = await _purchaseOrderService.GetOutstandingOrdersAsync(currentCompanyId);

            var purchaseOrderDtos = outstandingOrders.Select(order => new PurchaseOrderDto
            {
                Id = order.Id,
                CompanyId = order.CompanyId,
                SupplierId = order.SupplierId,
                SupplierName = order.Supplier?.Name ?? "Unknown",
                OrderNumber = order.OrderNumber,
                SupplierInvoiceNumber = order.SupplierInvoiceNumber,
                OrderDate = order.OrderDate,
                DueDate = order.DueDate,
                DeliveryDate = order.DeliveryDate,
                Status = order.Status,
                SubtotalAmount = order.SubtotalAmount,
                DiscountAmount = order.DiscountAmount,
                TaxAmount = order.TaxAmount,
                TotalAmount = order.TotalAmount,
                PaidAmount = order.PaidAmount,
                Currency = order.Currency,
                ExchangeRate = order.ExchangeRate,
                Notes = order.Notes,
                DeliveryAddress = order.DeliveryAddress,
                Lines = order.Lines?.Select(line => new PurchaseOrderLineDto
                {
                    Id = line.Id,
                    PurchaseOrderId = line.PurchaseOrderId,
                    ItemId = line.ItemId,
                    ItemName = line.Item?.Name ?? "Unknown",
                    ItemSku = line.Item?.SKU ?? "",
                    LineNumber = line.LineNumber,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitCost = line.UnitCost,
                    TaxRate = line.TaxRate,
                    TaxAmount = line.TaxAmount,
                    LineTotal = line.LineTotal,
                    ReceivedQuantity = line.ReceivedQuantity
                }).ToList() ?? new List<PurchaseOrderLineDto>(),
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt
            }).ToList();

            return Ok(purchaseOrderDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving outstanding purchase orders for company {CompanyId}", companyId);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }
}

// DTOs for API responses
public class PurchaseOrderDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public string? SupplierInvoiceNumber { get; set; }
    public DateTime OrderDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? DeliveryDate { get; set; }
    public PurchaseOrderStatus Status { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Currency { get; set; } = "ILS";
    public decimal ExchangeRate { get; set; }
    public string? Notes { get; set; }
    public string? DeliveryAddress { get; set; }
    public List<PurchaseOrderLineDto> Lines { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PurchaseOrderLineDto
{
    public int Id { get; set; }
    public int PurchaseOrderId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public int LineNumber { get; set; }
    public string? Description { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
    public decimal ReceivedQuantity { get; set; }
}

public class PaymentDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int? PurchaseOrderId { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentNumber { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Request DTOs
/// <summary>
/// Request model for creating a new purchase order
/// </summary>
public class CreatePurchaseOrderRequest
{
    public int? CompanyId { get; set; } // Optional, will be set from auth context

    [Required]
    public int SupplierId { get; set; }

    public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    public DateTime? DueDate { get; set; }

    public DateTime? DeliveryDate { get; set; }

    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;

    [MaxLength(3)]
    public string? Currency { get; set; } = "ILS";

    public decimal ExchangeRate { get; set; } = 1;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(500)]
    public string? DeliveryAddress { get; set; }

    public List<CreatePurchaseOrderLineRequest> Lines { get; set; } = new();
}

public class CreatePurchaseOrderLineRequest
{
    [Required]
    public int ItemId { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Quantity { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal UnitCost { get; set; }

    [Range(0, 100)]
    public decimal TaxRate { get; set; } = 17; // Israeli VAT rate
}

/// <summary>
/// Request model for updating purchase order status
/// </summary>
public class UpdatePurchaseOrderStatusRequest
{
    public int? CompanyId { get; set; } // Optional, will be set from auth context

    [Required]
    public PurchaseOrderStatus Status { get; set; }
}

/// <summary>
/// Request model for receiving goods
/// </summary>
public class ReceiveGoodsRequest
{
    public int? CompanyId { get; set; } // Optional, will be set from auth context

    public List<ReceiveGoodsItemRequest> ReceivedItems { get; set; } = new();
}

public class ReceiveGoodsItemRequest
{
    [Required]
    public int ItemId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal QuantityReceived { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? UnitCost { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// Request model for processing payment
/// </summary>
