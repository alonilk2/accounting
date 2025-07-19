using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Sales;
using backend.DTOs.Sales;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// API controller for delivery note management operations
/// </summary>
[ApiController]
[Route("api/delivery-notes")]
[Produces("application/json")]
public class DeliveryNotesController : ControllerBase
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<DeliveryNotesController> _logger;

    public DeliveryNotesController(
        AccountingDbContext context,
        ILogger<DeliveryNotesController> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all delivery notes for the current company
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="status">Optional status filter</param>
    /// <param name="customerId">Optional customer filter</param>
    /// <param name="fromDate">Optional from date filter</param>
    /// <param name="toDate">Optional to date filter</param>
    /// <param name="searchTerm">Optional search term</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 50)</param>
    /// <returns>List of delivery notes</returns>
    [HttpGet]
    [ProducesResponseType<IEnumerable<DeliveryNoteDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<DeliveryNoteDto>>> GetDeliveryNotes(
        [FromQuery] int? companyId = null,
        [FromQuery] DeliveryNoteStatus? status = null,
        [FromQuery] int? customerId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            // In a real app, companyId would come from authenticated user context
            var currentCompanyId = companyId ?? 1; // Default for now
            
            _logger.LogInformation("Retrieving delivery notes for company {CompanyId}, page {Page}, size {PageSize}", 
                currentCompanyId, page, pageSize);

            var query = _context.DeliveryNotes
                .Include(dn => dn.Customer)
                .Include(dn => dn.SalesOrder)
                .Include(dn => dn.Lines)
                    .ThenInclude(l => l.Item)
                .Where(dn => dn.CompanyId == currentCompanyId && !dn.IsDeleted);

            // Apply filters
            if (status.HasValue)
            {
                query = query.Where(dn => dn.Status == status.Value);
            }

            if (customerId.HasValue)
            {
                query = query.Where(dn => dn.CustomerId == customerId.Value);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(dn => dn.DeliveryDate >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(dn => dn.DeliveryDate <= toDate.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(dn => 
                    dn.DeliveryNoteNumber.Contains(searchTerm) ||
                    dn.Customer.Name.Contains(searchTerm) ||
                    (dn.DriverName != null && dn.DriverName.Contains(searchTerm)) ||
                    (dn.VehiclePlate != null && dn.VehiclePlate.Contains(searchTerm)));
            }

            var deliveryNotes = await query
                .OrderByDescending(dn => dn.DeliveryDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(dn => new DeliveryNoteDto
                {
                    Id = dn.Id,
                    CompanyId = dn.CompanyId,
                    CustomerId = dn.CustomerId,
                    CustomerName = dn.Customer.Name,
                    SalesOrderId = dn.SalesOrderId,
                    SalesOrderNumber = dn.SalesOrder != null ? dn.SalesOrder.OrderNumber : null,
                    DeliveryNoteNumber = dn.DeliveryNoteNumber,
                    DeliveryDate = dn.DeliveryDate,
                    ExpectedDeliveryTime = dn.ExpectedDeliveryTime,
                    ActualDeliveryTime = dn.ActualDeliveryTime,
                    Status = dn.Status,
                    DeliveryAddress = dn.DeliveryAddress,
                    ContactPerson = dn.ContactPerson,
                    ContactPhone = dn.ContactPhone,
                    DriverName = dn.DriverName,
                    VehiclePlate = dn.VehiclePlate,
                    TotalQuantity = dn.TotalQuantity,
                    TotalWeight = dn.TotalWeight,
                    TotalVolume = dn.TotalVolume,
                    DeliveryInstructions = dn.DeliveryInstructions,
                    Notes = dn.Notes,
                    CustomerSignature = dn.CustomerSignature,
                    ReceivedByName = dn.ReceivedByName,
                    ReceivedAt = dn.ReceivedAt,
                    TrackingNumber = dn.TrackingNumber,
                    CourierService = dn.CourierService,
                    Lines = dn.Lines.Select(l => new DeliveryNoteLineDto
                    {
                        Id = l.Id,
                        DeliveryNoteId = l.DeliveryNoteId,
                        ItemId = l.ItemId,
                        ItemName = l.Item.Name,
                        ItemSku = l.Item.SKU,
                        SalesOrderLineId = l.SalesOrderLineId,
                        LineNumber = l.LineNumber,
                        Description = l.Description,
                        QuantityOrdered = l.QuantityOrdered,
                        QuantityDelivered = l.QuantityDelivered,
                        QuantityReturned = l.QuantityReturned,
                        Unit = l.Unit,
                        UnitWeight = l.UnitWeight,
                        UnitVolume = l.UnitVolume,
                        SerialNumbers = l.SerialNumbers,
                        BatchNumbers = l.BatchNumbers,
                        ExpiryDate = l.ExpiryDate,
                        ItemCondition = l.ItemCondition,
                        Notes = l.Notes
                    }).ToList(),
                    CreatedAt = dn.CreatedAt,
                    UpdatedAt = dn.UpdatedAt
                })
                .ToListAsync();

            return Ok(deliveryNotes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving delivery notes for company {CompanyId}", companyId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Gets a specific delivery note by ID
    /// </summary>
    /// <param name="id">Delivery note ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Delivery note details</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType<DeliveryNoteDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeliveryNoteDto>> GetDeliveryNote(int id, [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            
            _logger.LogInformation("Retrieving delivery note {DeliveryNoteId} for company {CompanyId}", id, currentCompanyId);

            var deliveryNote = await _context.DeliveryNotes
                .Include(dn => dn.Customer)
                .Include(dn => dn.SalesOrder)
                .Include(dn => dn.Lines)
                    .ThenInclude(l => l.Item)
                .Where(dn => dn.Id == id && dn.CompanyId == currentCompanyId && !dn.IsDeleted)
                .Select(dn => new DeliveryNoteDto
                {
                    Id = dn.Id,
                    CompanyId = dn.CompanyId,
                    CustomerId = dn.CustomerId,
                    CustomerName = dn.Customer.Name,
                    SalesOrderId = dn.SalesOrderId,
                    SalesOrderNumber = dn.SalesOrder != null ? dn.SalesOrder.OrderNumber : null,
                    DeliveryNoteNumber = dn.DeliveryNoteNumber,
                    DeliveryDate = dn.DeliveryDate,
                    ExpectedDeliveryTime = dn.ExpectedDeliveryTime,
                    ActualDeliveryTime = dn.ActualDeliveryTime,
                    Status = dn.Status,
                    DeliveryAddress = dn.DeliveryAddress,
                    ContactPerson = dn.ContactPerson,
                    ContactPhone = dn.ContactPhone,
                    DriverName = dn.DriverName,
                    VehiclePlate = dn.VehiclePlate,
                    TotalQuantity = dn.TotalQuantity,
                    TotalWeight = dn.TotalWeight,
                    TotalVolume = dn.TotalVolume,
                    DeliveryInstructions = dn.DeliveryInstructions,
                    Notes = dn.Notes,
                    CustomerSignature = dn.CustomerSignature,
                    ReceivedByName = dn.ReceivedByName,
                    ReceivedAt = dn.ReceivedAt,
                    TrackingNumber = dn.TrackingNumber,
                    CourierService = dn.CourierService,
                    Lines = dn.Lines.Select(l => new DeliveryNoteLineDto
                    {
                        Id = l.Id,
                        DeliveryNoteId = l.DeliveryNoteId,
                        ItemId = l.ItemId,
                        ItemName = l.Item.Name,
                        ItemSku = l.Item.SKU,
                        SalesOrderLineId = l.SalesOrderLineId,
                        LineNumber = l.LineNumber,
                        Description = l.Description,
                        QuantityOrdered = l.QuantityOrdered,
                        QuantityDelivered = l.QuantityDelivered,
                        QuantityReturned = l.QuantityReturned,
                        Unit = l.Unit,
                        UnitWeight = l.UnitWeight,
                        UnitVolume = l.UnitVolume,
                        SerialNumbers = l.SerialNumbers,
                        BatchNumbers = l.BatchNumbers,
                        ExpiryDate = l.ExpiryDate,
                        ItemCondition = l.ItemCondition,
                        Notes = l.Notes
                    }).ToList(),
                    CreatedAt = dn.CreatedAt,
                    UpdatedAt = dn.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (deliveryNote == null)
            {
                return NotFound($"Delivery note {id} not found");
            }

            return Ok(deliveryNote);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving delivery note {DeliveryNoteId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Creates a new delivery note
    /// </summary>
    /// <param name="request">Delivery note creation request</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Created delivery note</returns>
    [HttpPost]
    [ProducesResponseType<DeliveryNoteDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeliveryNoteDto>> CreateDeliveryNote(
        [FromBody] CreateDeliveryNoteRequest request,
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

            _logger.LogInformation("Creating delivery note for customer {CustomerId} in company {CompanyId}", 
                request.CustomerId, currentCompanyId);

            // Generate delivery note number
            var nextNumber = await GetNextDeliveryNoteNumber(currentCompanyId);

            // Map request to entity
            var deliveryNote = new DeliveryNote
            {
                CompanyId = currentCompanyId,
                CustomerId = request.CustomerId,
                SalesOrderId = request.SalesOrderId,
                DeliveryNoteNumber = nextNumber,
                DeliveryDate = request.DeliveryDate?.ToUniversalTime() ?? DateTime.UtcNow,
                ExpectedDeliveryTime = request.ExpectedDeliveryTime?.ToUniversalTime(),
                Status = request.Status ?? DeliveryNoteStatus.Draft,
                DeliveryAddress = request.DeliveryAddress,
                ContactPerson = request.ContactPerson,
                ContactPhone = request.ContactPhone,
                DriverName = request.DriverName,
                VehiclePlate = request.VehiclePlate,
                DeliveryInstructions = request.DeliveryInstructions,
                Notes = request.Notes,
                TrackingNumber = request.TrackingNumber,
                CourierService = request.CourierService,
                CreatedBy = userId,
                UpdatedBy = userId,
                Lines = request.Lines.Select((line, index) => new DeliveryNoteLine
                {
                    CompanyId = currentCompanyId,
                    LineNumber = index + 1,
                    ItemId = line.ItemId,
                    SalesOrderLineId = line.SalesOrderLineId,
                    Description = line.Description,
                    QuantityOrdered = line.QuantityOrdered,
                    QuantityDelivered = line.QuantityDelivered,
                    QuantityReturned = line.QuantityReturned,
                    Unit = line.Unit,
                    UnitWeight = line.UnitWeight,
                    UnitVolume = line.UnitVolume,
                    SerialNumbers = line.SerialNumbers,
                    BatchNumbers = line.BatchNumbers,
                    ExpiryDate = line.ExpiryDate,
                    ItemCondition = line.ItemCondition,
                    Notes = line.Notes,
                    CreatedBy = userId,
                    UpdatedBy = userId
                }).ToList()
            };

            // Calculate totals
            deliveryNote.TotalQuantity = deliveryNote.Lines.Sum(l => l.QuantityDelivered);
            deliveryNote.TotalWeight = deliveryNote.Lines.Sum(l => (l.UnitWeight ?? 0) * l.QuantityDelivered);
            deliveryNote.TotalVolume = deliveryNote.Lines.Sum(l => (l.UnitVolume ?? 0) * l.QuantityDelivered);

            // Add to context and save
            _context.DeliveryNotes.Add(deliveryNote);
            await _context.SaveChangesAsync();

            // Return created delivery note with full details
            var result = await GetDeliveryNote(deliveryNote.Id, currentCompanyId);
            if (result.Result is OkObjectResult okResult && okResult.Value is DeliveryNoteDto dto)
            {
                return CreatedAtAction(nameof(GetDeliveryNote), new { id = deliveryNote.Id }, dto);
            }

            return StatusCode(StatusCodes.Status500InternalServerError, "Error retrieving created delivery note");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating delivery note");
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Updates a delivery note status
    /// </summary>
    /// <param name="id">Delivery note ID</param>
    /// <param name="request">Status update request</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Updated delivery note</returns>
    [HttpPut("{id:int}/status")]
    [ProducesResponseType<DeliveryNoteDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeliveryNoteDto>> UpdateDeliveryNoteStatus(
        int id,
        [FromBody] UpdateDeliveryNoteStatusRequest request,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            var userId = "system"; // In real app, get from authenticated user

            _logger.LogInformation("Updating delivery note {DeliveryNoteId} status to {Status}", id, request.Status);

            var deliveryNote = await _context.DeliveryNotes
                .Where(dn => dn.Id == id && dn.CompanyId == currentCompanyId && !dn.IsDeleted)
                .FirstOrDefaultAsync();

            if (deliveryNote == null)
            {
                return NotFound($"Delivery note {id} not found");
            }

            // Update status and related fields
            deliveryNote.Status = request.Status;
            deliveryNote.UpdatedBy = userId;
            deliveryNote.UpdatedAt = DateTime.UtcNow;

            if (request.ActualDeliveryTime.HasValue)
            {
                deliveryNote.ActualDeliveryTime = request.ActualDeliveryTime.Value.ToUniversalTime();
            }

            if (!string.IsNullOrWhiteSpace(request.ReceivedByName))
            {
                deliveryNote.ReceivedByName = request.ReceivedByName;
            }

            if (request.ReceivedAt.HasValue)
            {
                deliveryNote.ReceivedAt = request.ReceivedAt.Value.ToUniversalTime();
            }

            if (!string.IsNullOrWhiteSpace(request.CustomerSignature))
            {
                deliveryNote.CustomerSignature = request.CustomerSignature;
            }

            if (!string.IsNullOrWhiteSpace(request.Notes))
            {
                deliveryNote.Notes = request.Notes;
            }

            await _context.SaveChangesAsync();

            // Return updated delivery note
            var result = await GetDeliveryNote(id, currentCompanyId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating delivery note {DeliveryNoteId} status", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Deletes a delivery note (soft delete)
    /// </summary>
    /// <param name="id">Delivery note ID</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>No content</returns>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> DeleteDeliveryNote(int id, [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            var userId = "system"; // In real app, get from authenticated user

            _logger.LogInformation("Deleting delivery note {DeliveryNoteId} for company {CompanyId}", id, currentCompanyId);

            var deliveryNote = await _context.DeliveryNotes
                .Where(dn => dn.Id == id && dn.CompanyId == currentCompanyId && !dn.IsDeleted)
                .FirstOrDefaultAsync();

            if (deliveryNote == null)
            {
                return NotFound($"Delivery note {id} not found");
            }

            // Soft delete
            deliveryNote.IsDeleted = true;
            deliveryNote.UpdatedBy = userId;
            deliveryNote.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting delivery note {DeliveryNoteId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Generates delivery note from sales order
    /// </summary>
    /// <param name="salesOrderId">Sales order ID</param>
    /// <param name="request">Generation request</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <returns>Created delivery note</returns>
    [HttpPost("from-order/{salesOrderId:int}")]
    [ProducesResponseType<DeliveryNoteDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeliveryNoteDto>> GenerateDeliveryNoteFromOrder(
        int salesOrderId,
        [FromBody] GenerateDeliveryNoteFromOrderRequest request,
        [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;

            _logger.LogInformation("Generating delivery note from sales order {SalesOrderId}", salesOrderId);

            var salesOrder = await _context.SalesOrders
                .Include(so => so.Lines)
                    .ThenInclude(l => l.Item)
                .Where(so => so.Id == salesOrderId && so.CompanyId == currentCompanyId && !so.IsDeleted)
                .FirstOrDefaultAsync();

            if (salesOrder == null)
            {
                return NotFound($"Sales order {salesOrderId} not found");
            }

            // Create delivery note request from sales order
            var createRequest = new CreateDeliveryNoteRequest
            {
                CustomerId = salesOrder.CustomerId,
                SalesOrderId = salesOrderId,
                DeliveryDate = request.DeliveryDate ?? DateTime.UtcNow,
                DeliveryAddress = request.DeliveryAddress,
                ContactPerson = request.ContactPerson,
                ContactPhone = request.ContactPhone,
                DriverName = request.DriverName,
                VehiclePlate = request.VehiclePlate,
                DeliveryInstructions = request.DeliveryInstructions,
                Notes = request.Notes,
                Lines = request.Lines?.Select(l => new CreateDeliveryNoteLineRequest
                {
                    ItemId = salesOrder.Lines.First(ol => ol.Id == l.SalesOrderLineId).ItemId,
                    SalesOrderLineId = l.SalesOrderLineId,
                    QuantityOrdered = salesOrder.Lines.First(ol => ol.Id == l.SalesOrderLineId).Quantity,
                    QuantityDelivered = l.QuantityToDeliver,
                    SerialNumbers = l.SerialNumbers,
                    BatchNumbers = l.BatchNumbers,
                    ExpiryDate = l.ExpiryDate,
                    ItemCondition = l.ItemCondition,
                    Notes = l.Notes
                }).ToList() ?? salesOrder.Lines.Select(l => new CreateDeliveryNoteLineRequest
                {
                    ItemId = l.ItemId,
                    SalesOrderLineId = l.Id,
                    Description = l.Description,
                    QuantityOrdered = l.Quantity,
                    QuantityDelivered = l.Quantity, // Deliver full quantity by default
                    Unit = l.Item.Unit
                }).ToList()
            };

            // Create the delivery note
            return await CreateDeliveryNote(createRequest, currentCompanyId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating delivery note from sales order {SalesOrderId}", salesOrderId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
        }
    }

    /// <summary>
    /// Generates the next delivery note number for a company
    /// </summary>
    private async Task<string> GetNextDeliveryNoteNumber(int companyId)
    {
        var currentYear = DateTime.UtcNow.Year;
        var prefix = $"DN-{currentYear}-";

        var lastDeliveryNote = await _context.DeliveryNotes
            .Where(dn => dn.CompanyId == companyId && dn.DeliveryNoteNumber.StartsWith(prefix))
            .OrderByDescending(dn => dn.DeliveryNoteNumber)
            .FirstOrDefaultAsync();

        if (lastDeliveryNote == null)
        {
            return $"{prefix}0001";
        }

        // Extract the number part and increment
        var lastNumberPart = lastDeliveryNote.DeliveryNoteNumber.Substring(prefix.Length);
        if (int.TryParse(lastNumberPart, out var lastNumber))
        {
            return $"{prefix}{(lastNumber + 1):D4}";
        }

        return $"{prefix}0001";
    }
}
