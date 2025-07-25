using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Purchasing;
using backend.Models.Inventory;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

/// <summary>
/// Controller for managing purchase invoices - bills received from suppliers
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class PurchaseInvoicesController : ControllerBase
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<PurchaseInvoicesController> _logger;

    public PurchaseInvoicesController(AccountingDbContext context, ILogger<PurchaseInvoicesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all purchase invoices with filtering options
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PurchaseInvoiceDto>>> GetPurchaseInvoices(
        [FromQuery] PurchaseInvoiceStatus? status = null,
        [FromQuery] int? supplierId = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var query = _context.PurchaseInvoices
                .Include(pi => pi.Supplier)
                .Include(pi => pi.PurchaseOrder)
                .Include(pi => pi.Lines)
                .AsQueryable();

            // Apply filters
            if (status.HasValue)
                query = query.Where(pi => pi.Status == status.Value);

            if (supplierId.HasValue)
                query = query.Where(pi => pi.SupplierId == supplierId.Value);

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(pi => 
                    pi.SupplierInvoiceNumber.Contains(searchTerm) ||
                    pi.InternalReferenceNumber.Contains(searchTerm) ||
                    pi.Supplier.Name.Contains(searchTerm) ||
                    pi.Description!.Contains(searchTerm));
            }

            if (startDate.HasValue)
                query = query.Where(pi => pi.InvoiceDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(pi => pi.InvoiceDate <= endDate.Value);

            // Apply pagination
            var totalCount = await query.CountAsync();
            var purchaseInvoices = await query
                .OrderByDescending(pi => pi.InvoiceDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = purchaseInvoices.Select(pi => new PurchaseInvoiceDto
            {
                Id = pi.Id,
                SupplierId = pi.SupplierId,
                SupplierName = pi.Supplier.Name,
                PurchaseOrderId = pi.PurchaseOrderId,
                SupplierInvoiceNumber = pi.SupplierInvoiceNumber,
                InternalReferenceNumber = pi.InternalReferenceNumber,
                InvoiceDate = pi.InvoiceDate,
                DueDate = pi.DueDate,
                ReceivedDate = pi.ReceivedDate,
                Status = pi.Status,
                SubtotalAmount = pi.SubtotalAmount,
                DiscountAmount = pi.DiscountAmount,
                TaxAmount = pi.TaxAmount,
                TotalAmount = pi.TotalAmount,
                PaidAmount = pi.PaidAmount,
                RemainingAmount = pi.RemainingAmount,
                Currency = pi.Currency,
                Notes = pi.Notes,
                Description = pi.Description,
                VatRate = pi.VatRate,
                IsFullyPaid = pi.IsFullyPaid,
                IsOverdue = pi.IsOverdue,
                CreatedAt = pi.CreatedAt,
                UpdatedAt = pi.UpdatedAt
            }).ToList();

            Response.Headers["X-Total-Count"] = totalCount.ToString();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving purchase invoices");
            return StatusCode(500, "An error occurred while retrieving purchase invoices");
        }
    }

    /// <summary>
    /// Get a specific purchase invoice by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<PurchaseInvoiceDetailDto>> GetPurchaseInvoice(int id)
    {
        try
        {
            var purchaseInvoice = await _context.PurchaseInvoices
                .Include(pi => pi.Supplier)
                .Include(pi => pi.PurchaseOrder)
                .Include(pi => pi.Lines)
                    .ThenInclude(l => l.Item)
                .Include(pi => pi.Payments)
                .FirstOrDefaultAsync(pi => pi.Id == id);

            if (purchaseInvoice == null)
                return NotFound($"Purchase invoice with ID {id} not found");

            var result = new PurchaseInvoiceDetailDto
            {
                Id = purchaseInvoice.Id,
                SupplierId = purchaseInvoice.SupplierId,
                SupplierName = purchaseInvoice.Supplier.Name,
                PurchaseOrderId = purchaseInvoice.PurchaseOrderId,
                SupplierInvoiceNumber = purchaseInvoice.SupplierInvoiceNumber,
                InternalReferenceNumber = purchaseInvoice.InternalReferenceNumber,
                InvoiceDate = purchaseInvoice.InvoiceDate,
                DueDate = purchaseInvoice.DueDate,
                ReceivedDate = purchaseInvoice.ReceivedDate,
                Status = purchaseInvoice.Status,
                SubtotalAmount = purchaseInvoice.SubtotalAmount,
                DiscountAmount = purchaseInvoice.DiscountAmount,
                TaxAmount = purchaseInvoice.TaxAmount,
                TotalAmount = purchaseInvoice.TotalAmount,
                PaidAmount = purchaseInvoice.PaidAmount,
                RemainingAmount = purchaseInvoice.RemainingAmount,
                Currency = purchaseInvoice.Currency,
                Notes = purchaseInvoice.Notes,
                Description = purchaseInvoice.Description,
                VatRate = purchaseInvoice.VatRate,
                IsFullyPaid = purchaseInvoice.IsFullyPaid,
                IsOverdue = purchaseInvoice.IsOverdue,
                Lines = purchaseInvoice.Lines.Select(l => new PurchaseInvoiceLineDto
                {
                    Id = l.Id,
                    ItemId = l.ItemId,
                    ItemName = l.Item?.Name,
                    ItemSKU = l.Item?.SKU,
                    Description = l.Description,
                    Quantity = l.Quantity,
                    Unit = l.Unit,
                    UnitCost = l.UnitCost,
                    DiscountPercent = l.DiscountPercent,
                    DiscountAmount = l.DiscountAmount,
                    TaxRate = l.TaxRate,
                    LineTotal = l.LineTotal,
                    SubtotalAmount = l.SubtotalAmount,
                    TaxAmount = l.TaxAmount
                }).ToList(),
                Payments = purchaseInvoice.Payments.Select(p => new SupplierPaymentDto
                {
                    Id = p.Id,
                    PaymentNumber = p.PaymentNumber,
                    PaymentDate = p.PaymentDate,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod,
                    ReferenceNumber = p.ReferenceNumber,
                    Notes = p.Notes
                }).ToList(),
                CreatedAt = purchaseInvoice.CreatedAt,
                UpdatedAt = purchaseInvoice.UpdatedAt
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving purchase invoice {Id}", id);
            return StatusCode(500, $"An error occurred while retrieving purchase invoice {id}");
        }
    }

    /// <summary>
    /// Create a new purchase invoice
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PurchaseInvoiceDto>> CreatePurchaseInvoice(CreatePurchaseInvoiceDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate supplier exists
            var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
            if (supplier == null)
                return BadRequest($"Supplier with ID {dto.SupplierId} not found");

            // Generate internal reference number
            var lastInvoice = await _context.PurchaseInvoices
                .Where(pi => pi.CompanyId == supplier.CompanyId)
                .OrderByDescending(pi => pi.Id)
                .FirstOrDefaultAsync();

            var nextNumber = (lastInvoice?.Id ?? 0) + 1;
            var referenceNumber = $"PI-{DateTime.Now.Year}-{nextNumber:D6}";

            var purchaseInvoice = new PurchaseInvoice
            {
                CompanyId = supplier.CompanyId,
                SupplierId = dto.SupplierId,
                PurchaseOrderId = dto.PurchaseOrderId,
                SupplierInvoiceNumber = dto.SupplierInvoiceNumber,
                InternalReferenceNumber = referenceNumber,
                InvoiceDate = dto.InvoiceDate,
                DueDate = dto.DueDate ?? dto.InvoiceDate.AddDays(supplier.PaymentTermsDays),
                ReceivedDate = dto.ReceivedDate ?? DateTime.Now,
                Status = PurchaseInvoiceStatus.Draft,
                Currency = dto.Currency ?? "ILS",
                Notes = dto.Notes,
                Description = dto.Description,
                VatRate = dto.VatRate ?? 17.00m
            };

            _context.PurchaseInvoices.Add(purchaseInvoice);
            await _context.SaveChangesAsync();

            // Add lines if provided
            if (dto.Lines?.Any() == true)
            {
                var lines = new List<PurchaseInvoiceLine>();
                foreach (var lineDto in dto.Lines)
                {
                    var line = new PurchaseInvoiceLine
                    {
                        CompanyId = supplier.CompanyId,
                        PurchaseInvoiceId = purchaseInvoice.Id,
                        ItemId = lineDto.ItemId,
                        Description = lineDto.Description,
                        Quantity = lineDto.Quantity,
                        Unit = lineDto.Unit ?? "יח'",
                        UnitCost = lineDto.UnitCost,
                        DiscountPercent = lineDto.DiscountPercent,
                        DiscountAmount = lineDto.DiscountAmount,
                        TaxRate = lineDto.TaxRate ?? 17.00m
                    };

                    // Calculate line total
                    var subtotal = line.Quantity * line.UnitCost - line.DiscountAmount;
                    var taxAmount = subtotal * (line.TaxRate / 100);
                    line.LineTotal = subtotal + taxAmount;

                    lines.Add(line);
                }

                _context.PurchaseInvoiceLines.AddRange(lines);
                await _context.SaveChangesAsync();

                // Update invoice totals
                await RecalculateInvoiceTotals(purchaseInvoice.Id);
            }

            // Reload with includes for response
            var createdInvoice = await _context.PurchaseInvoices
                .Include(pi => pi.Supplier)
                .FirstOrDefaultAsync(pi => pi.Id == purchaseInvoice.Id);

            var result = new PurchaseInvoiceDto
            {
                Id = createdInvoice!.Id,
                SupplierId = createdInvoice.SupplierId,
                SupplierName = createdInvoice.Supplier.Name,
                PurchaseOrderId = createdInvoice.PurchaseOrderId,
                SupplierInvoiceNumber = createdInvoice.SupplierInvoiceNumber,
                InternalReferenceNumber = createdInvoice.InternalReferenceNumber,
                InvoiceDate = createdInvoice.InvoiceDate,
                DueDate = createdInvoice.DueDate,
                ReceivedDate = createdInvoice.ReceivedDate,
                Status = createdInvoice.Status,
                SubtotalAmount = createdInvoice.SubtotalAmount,
                DiscountAmount = createdInvoice.DiscountAmount,
                TaxAmount = createdInvoice.TaxAmount,
                TotalAmount = createdInvoice.TotalAmount,
                PaidAmount = createdInvoice.PaidAmount,
                RemainingAmount = createdInvoice.RemainingAmount,
                Currency = createdInvoice.Currency,
                Notes = createdInvoice.Notes,
                Description = createdInvoice.Description,
                VatRate = createdInvoice.VatRate,
                IsFullyPaid = createdInvoice.IsFullyPaid,
                IsOverdue = createdInvoice.IsOverdue,
                CreatedAt = createdInvoice.CreatedAt,
                UpdatedAt = createdInvoice.UpdatedAt
            };

            return CreatedAtAction(nameof(GetPurchaseInvoice), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating purchase invoice");
            return StatusCode(500, "An error occurred while creating the purchase invoice");
        }
    }

    /// <summary>
    /// Update purchase invoice status
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<ActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
    {
        try
        {
            var purchaseInvoice = await _context.PurchaseInvoices.FindAsync(id);
            if (purchaseInvoice == null)
                return NotFound($"Purchase invoice with ID {id} not found");

            purchaseInvoice.Status = dto.Status;
            if (dto.Status == PurchaseInvoiceStatus.Received && !purchaseInvoice.ReceivedDate.HasValue)
            {
                purchaseInvoice.ReceivedDate = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating purchase invoice status {Id}", id);
            return StatusCode(500, "An error occurred while updating the purchase invoice status");
        }
    }

    /// <summary>
    /// Add payment to purchase invoice
    /// </summary>
    [HttpPost("{id}/payments")]
    public async Task<ActionResult<SupplierPaymentDto>> AddPayment(int id, CreateSupplierPaymentDto dto)
    {
        try
        {
            var purchaseInvoice = await _context.PurchaseInvoices
                .Include(pi => pi.Payments)
                .FirstOrDefaultAsync(pi => pi.Id == id);

            if (purchaseInvoice == null)
                return NotFound($"Purchase invoice with ID {id} not found");

            if (dto.Amount <= 0)
                return BadRequest("Payment amount must be greater than zero");

            if (purchaseInvoice.PaidAmount + dto.Amount > purchaseInvoice.TotalAmount)
                return BadRequest("Payment amount exceeds remaining balance");

            // Generate payment number
            var lastPayment = await _context.SupplierPayments
                .Where(sp => sp.CompanyId == purchaseInvoice.CompanyId)
                .OrderByDescending(sp => sp.Id)
                .FirstOrDefaultAsync();

            var nextNumber = (lastPayment?.Id ?? 0) + 1;
            var paymentNumber = $"SP-{DateTime.Now.Year}-{nextNumber:D6}";

            var payment = new SupplierPayment
            {
                CompanyId = purchaseInvoice.CompanyId,
                PurchaseInvoiceId = id,
                SupplierId = purchaseInvoice.SupplierId,
                PaymentNumber = paymentNumber,
                PaymentDate = dto.PaymentDate,
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod,
                ReferenceNumber = dto.ReferenceNumber,
                Notes = dto.Notes
            };

            _context.SupplierPayments.Add(payment);

            // Update invoice paid amount
            purchaseInvoice.PaidAmount += dto.Amount;
            if (purchaseInvoice.IsFullyPaid && purchaseInvoice.Status != PurchaseInvoiceStatus.Paid)
            {
                purchaseInvoice.Status = PurchaseInvoiceStatus.Paid;
            }

            await _context.SaveChangesAsync();

            var result = new SupplierPaymentDto
            {
                Id = payment.Id,
                PaymentNumber = payment.PaymentNumber,
                PaymentDate = payment.PaymentDate,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                ReferenceNumber = payment.ReferenceNumber,
                Notes = payment.Notes
            };

            return CreatedAtAction(nameof(GetPurchaseInvoice), new { id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding payment to purchase invoice {Id}", id);
            return StatusCode(500, "An error occurred while adding the payment");
        }
    }

    private async Task RecalculateInvoiceTotals(int purchaseInvoiceId)
    {
        var invoice = await _context.PurchaseInvoices
            .Include(pi => pi.Lines)
            .FirstOrDefaultAsync(pi => pi.Id == purchaseInvoiceId);

        if (invoice == null) return;

        invoice.SubtotalAmount = invoice.Lines.Sum(l => l.SubtotalAmount);
        invoice.DiscountAmount = invoice.Lines.Sum(l => l.DiscountAmount);
        invoice.TaxAmount = invoice.Lines.Sum(l => l.TaxAmount);
        invoice.TotalAmount = invoice.Lines.Sum(l => l.LineTotal);

        await _context.SaveChangesAsync();
    }
}

// DTOs
public class PurchaseInvoiceDto
{
    public int Id { get; set; }
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public int? PurchaseOrderId { get; set; }
    public string SupplierInvoiceNumber { get; set; } = string.Empty;
    public string InternalReferenceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ReceivedDate { get; set; }
    public PurchaseInvoiceStatus Status { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public string Currency { get; set; } = "ILS";
    public string? Notes { get; set; }
    public string? Description { get; set; }
    public decimal VatRate { get; set; }
    public bool IsFullyPaid { get; set; }
    public bool IsOverdue { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PurchaseInvoiceDetailDto : PurchaseInvoiceDto
{
    public List<PurchaseInvoiceLineDto> Lines { get; set; } = new();
    public List<SupplierPaymentDto> Payments { get; set; } = new();
}

public class PurchaseInvoiceLineDto
{
    public int Id { get; set; }
    public int? ItemId { get; set; }
    public string? ItemName { get; set; }
    public string? ItemSKU { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitCost { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxRate { get; set; }
    public decimal LineTotal { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal TaxAmount { get; set; }
}

public class SupplierPaymentDto
{
    public int Id { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}

public class CreatePurchaseInvoiceDto
{
    [Required]
    public int SupplierId { get; set; }
    
    public int? PurchaseOrderId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string SupplierInvoiceNumber { get; set; } = string.Empty;
    
    [Required]
    public DateTime InvoiceDate { get; set; }
    
    public DateTime? DueDate { get; set; }
    
    public DateTime? ReceivedDate { get; set; }
    
    public string? Currency { get; set; }
    
    public string? Notes { get; set; }
    
    public string? Description { get; set; }
    
    public decimal? VatRate { get; set; }
    
    public List<CreatePurchaseInvoiceLineDto>? Lines { get; set; }
}

public class CreatePurchaseInvoiceLineDto
{
    public int? ItemId { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    [Required]
    public decimal Quantity { get; set; }
    
    public string? Unit { get; set; }
    
    [Required]
    public decimal UnitCost { get; set; }
    
    public decimal DiscountPercent { get; set; }
    
    public decimal DiscountAmount { get; set; }
    
    public decimal? TaxRate { get; set; }
}

public class CreateSupplierPaymentDto
{
    [Required]
    public DateTime PaymentDate { get; set; }
    
    [Required]
    public decimal Amount { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string? ReferenceNumber { get; set; }
    
    public string? Notes { get; set; }
}

public class UpdateStatusDto
{
    [Required]
    public PurchaseInvoiceStatus Status { get; set; }
}
