using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Sales;
using backend.Models.Core;
using backend.Services.Sales;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<InvoicesController> _logger;
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(AccountingDbContext context, ILogger<InvoicesController> logger, IInvoiceService invoiceService)
    {
        _context = context;
        _logger = logger;
        _invoiceService = invoiceService;
    }

    // GET: api/invoices
    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetInvoices()
    {
        try
        {
            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalesOrder)
                .Include(i => i.Lines)
                    .ThenInclude(l => l.Item)
                .OrderByDescending(i => i.InvoiceDate)
                .Select(i => new InvoiceDto
                {
                    Id = i.Id,
                    CompanyId = i.CompanyId,
                    CustomerId = i.CustomerId,
                    CustomerName = i.Customer.Name,
                    SalesOrderId = i.SalesOrderId,
                    InvoiceNumber = i.InvoiceNumber,
                    InvoiceDate = i.InvoiceDate,
                    DueDate = i.DueDate,
                    Status = i.Status,
                    SubtotalAmount = i.SubtotalAmount,
                    TaxAmount = i.TaxAmount,
                    TotalAmount = i.TotalAmount,
                    PaidAmount = i.PaidAmount,
                    Currency = i.Currency,
                    Notes = i.Notes,
                    CustomerAddress = i.CustomerAddress,
                    CustomerTaxId = i.CustomerTaxId,
                    CustomerContact = i.CustomerContact,
                    Lines = i.Lines.Select(l => new InvoiceLineDto
                    {
                        Id = l.Id,
                        InvoiceId = l.InvoiceId,
                        ItemId = l.ItemId,
                        ItemName = l.Item != null ? l.Item.Name : "",
                        ItemSku = l.ItemSku ?? "",
                        LineNumber = l.LineNumber,
                        Description = l.Description,
                        Quantity = l.Quantity,
                        UnitPrice = l.UnitPrice,
                        DiscountPercent = l.DiscountPercent,
                        TaxRate = l.TaxRate,
                        TaxAmount = l.TaxAmount,
                        LineTotal = l.LineTotal
                    }).ToList(),
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return Ok(invoices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoices");
            return StatusCode(500, "Internal server error");
        }
    }

    // GET: api/invoices/5
    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceDto>> GetInvoice(int id)
    {
        try
        {
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalesOrder)
                .Include(i => i.Lines)
                    .ThenInclude(l => l.Item)
                .Where(i => i.Id == id)
                .Select(i => new InvoiceDto
                {
                    Id = i.Id,
                    CompanyId = i.CompanyId,
                    CustomerId = i.CustomerId,
                    CustomerName = i.Customer.Name,
                    SalesOrderId = i.SalesOrderId,
                    InvoiceNumber = i.InvoiceNumber,
                    InvoiceDate = i.InvoiceDate,
                    DueDate = i.DueDate,
                    Status = i.Status,
                    SubtotalAmount = i.SubtotalAmount,
                    TaxAmount = i.TaxAmount,
                    TotalAmount = i.TotalAmount,
                    PaidAmount = i.PaidAmount,
                    Currency = i.Currency,
                    Notes = i.Notes,
                    CustomerAddress = i.CustomerAddress,
                    CustomerTaxId = i.CustomerTaxId,
                    CustomerContact = i.CustomerContact,
                    Lines = i.Lines.Select(l => new InvoiceLineDto
                    {
                        Id = l.Id,
                        InvoiceId = l.InvoiceId,
                        ItemId = l.ItemId,
                        ItemName = l.Item != null ? l.Item.Name : "",
                        ItemSku = l.ItemSku ?? "",
                        LineNumber = l.LineNumber,
                        Description = l.Description,
                        Quantity = l.Quantity,
                        UnitPrice = l.UnitPrice,
                        DiscountPercent = l.DiscountPercent,
                        TaxRate = l.TaxRate,
                        TaxAmount = l.TaxAmount,
                        LineTotal = l.LineTotal
                    }).ToList(),
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (invoice == null)
            {
                return NotFound();
            }

            return Ok(invoice);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoice {InvoiceId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    // POST: api/invoices
    [HttpPost]
    public async Task<ActionResult<InvoiceDto>> CreateInvoice(CreateInvoiceRequest request)
    {
        try
        {
            // Validate customer exists
            var customer = await _context.Customers.FindAsync(request.CustomerId);
            if (customer == null)
            {
                return BadRequest("Customer not found");
            }

            // Get company ID (assuming from user context)
            var companyId = 1; // TODO: Get from authenticated user context

            // Generate invoice number
            var year = DateTime.Now.Year;
            var lastInvoice = await _context.Invoices
                .Where(i => i.CompanyId == companyId && i.InvoiceDate.Year == year)
                .OrderByDescending(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            var nextNumber = 1;
            if (lastInvoice != null && int.TryParse(lastInvoice.InvoiceNumber.Split('-').LastOrDefault(), out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }

            var invoiceNumber = $"{year}-{nextNumber:D6}";

            var invoice = new Invoice
            {
                CompanyId = companyId,
                CustomerId = request.CustomerId,
                SalesOrderId = request.SalesOrderId,
                InvoiceNumber = invoiceNumber,
                InvoiceDate = request.InvoiceDate,
                DueDate = request.DueDate,
                Status = InvoiceStatus.Draft,
                Currency = request.Currency ?? "ILS",
                Notes = request.Notes,
                CustomerName = customer.Name,
                CustomerAddress = customer.Address ?? "",
                CustomerTaxId = customer.TaxId,
                CustomerContact = customer.Contact
            };

            // Add lines
            decimal subtotal = 0;
            decimal totalTax = 0;

            foreach (var lineRequest in request.Lines)
            {
                var lineTotal = lineRequest.Quantity * lineRequest.UnitPrice;
                var discount = lineTotal * (lineRequest.DiscountPercent / 100);
                var netAmount = lineTotal - discount;
                var taxAmount = netAmount * (lineRequest.TaxRate / 100);

                var line = new InvoiceLine
                {
                    ItemId = lineRequest.ItemId,
                    LineNumber = lineRequest.LineNumber,
                    Description = lineRequest.Description,
                    ItemSku = lineRequest.ItemSku,
                    Quantity = lineRequest.Quantity,
                    UnitPrice = lineRequest.UnitPrice,
                    DiscountPercent = lineRequest.DiscountPercent,
                    TaxRate = lineRequest.TaxRate,
                    TaxAmount = taxAmount,
                    LineTotal = netAmount + taxAmount
                };

                invoice.Lines.Add(line);
                subtotal += netAmount;
                totalTax += taxAmount;
            }

            invoice.SubtotalAmount = subtotal;
            invoice.TaxAmount = totalTax;
            invoice.TotalAmount = subtotal + totalTax;

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            // Return DTO instead of entity
            var result = await GetInvoice(invoice.Id);
            if (result.Result is OkObjectResult okResult && okResult.Value is InvoiceDto dto)
            {
                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, dto);
            }

            return StatusCode(500, "Error retrieving created invoice");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invoice");
            return StatusCode(500, "Internal server error");
        }
    }

    // PUT: api/invoices/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateInvoice(int id, UpdateInvoiceRequest request)
    {
        try
        {
            var invoice = await _context.Invoices
                .Include(i => i.Lines)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                return NotFound();
            }

            // Update invoice properties
            invoice.DueDate = request.DueDate;
            invoice.Status = request.Status;
            invoice.Notes = request.Notes;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating invoice {InvoiceId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    // DELETE: api/invoices/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInvoice(int id)
    {
        try
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            // Soft delete
            invoice.IsDeleted = true;
            invoice.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting invoice {InvoiceId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    // POST: api/invoices/from-sales-order/5
    [HttpPost("from-sales-order/{salesOrderId}")]
    public async Task<ActionResult<InvoiceDto>> CreateInvoiceFromSalesOrder(int salesOrderId)
    {
        try
        {
            var salesOrder = await _context.SalesOrders
                .Include(so => so.Customer)
                .Include(so => so.Lines)
                    .ThenInclude(l => l.Item)
                .FirstOrDefaultAsync(so => so.Id == salesOrderId);

            if (salesOrder == null)
            {
                return NotFound("Sales order not found");
            }

            // Create invoice from sales order
            var companyId = salesOrder.CompanyId;
            var year = DateTime.Now.Year;
            var lastInvoice = await _context.Invoices
                .Where(i => i.CompanyId == companyId && i.InvoiceDate.Year == year)
                .OrderByDescending(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            var nextNumber = 1;
            if (lastInvoice != null && int.TryParse(lastInvoice.InvoiceNumber.Split('-').LastOrDefault(), out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }

            var invoiceNumber = $"{year}-{nextNumber:D6}";

            var invoice = new Invoice
            {
                CompanyId = companyId,
                CustomerId = salesOrder.CustomerId,
                SalesOrderId = salesOrder.Id,
                InvoiceNumber = invoiceNumber,
                InvoiceDate = DateTime.Now,
                DueDate = DateTime.Now.AddDays(30), // Default 30 days
                Status = InvoiceStatus.Draft,
                Currency = salesOrder.Currency,
                Notes = $"חשבונית עבור הזמנה מספר {salesOrder.OrderNumber}",
                CustomerName = salesOrder.Customer.Name,
                CustomerAddress = salesOrder.Customer.Address ?? "",
                CustomerTaxId = salesOrder.Customer.TaxId,
                CustomerContact = salesOrder.Customer.Contact,
                SubtotalAmount = salesOrder.SubtotalAmount,
                TaxAmount = salesOrder.TaxAmount,
                TotalAmount = salesOrder.TotalAmount
            };

            // Copy lines from sales order
            foreach (var salesOrderLine in salesOrder.Lines)
            {
                var invoiceLine = new InvoiceLine
                {
                    ItemId = salesOrderLine.ItemId,
                    LineNumber = salesOrderLine.LineNumber,
                    Description = salesOrderLine.Description ?? salesOrderLine.Item?.Name ?? "",
                    ItemSku = salesOrderLine.Item?.SKU,
                    Quantity = salesOrderLine.Quantity,
                    UnitPrice = salesOrderLine.UnitPrice,
                    DiscountPercent = salesOrderLine.DiscountPercent,
                    TaxRate = salesOrderLine.TaxRate,
                    TaxAmount = salesOrderLine.TaxAmount,
                    LineTotal = salesOrderLine.LineTotal
                };

                invoice.Lines.Add(invoiceLine);
            }

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            // Return DTO instead of entity
            var result = await GetInvoice(invoice.Id);
            if (result.Result is OkObjectResult okResult && okResult.Value is InvoiceDto dto)
            {
                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, dto);
            }

            return StatusCode(500, "Error retrieving created invoice");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invoice from sales order {SalesOrderId}", salesOrderId);
            return StatusCode(500, "Internal server error");
        }
    }

    // GET: api/invoices/{id}/receipts
    [HttpGet("{id}/receipts")]
    public async Task<ActionResult<IEnumerable<ReceiptDto>>> GetInvoiceReceipts(int id)
    {
        try
        {
            var currentCompanyId = 1; // TODO: Get from authenticated user

            // Verify invoice exists and belongs to current company
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == id && i.CompanyId == currentCompanyId);

            if (invoice == null)
            {
                return NotFound($"Invoice with ID {id} not found");
            }

            // Get all receipts for this invoice
            var receipts = await _invoiceService.GetInvoiceReceiptsAsync(id, currentCompanyId);

            var receiptDtos = receipts.Select(receipt => new ReceiptDto
            {
                Id = receipt.Id,
                InvoiceId = receipt.InvoiceId,
                ReceiptNumber = receipt.ReceiptNumber,
                PaymentDate = receipt.PaymentDate,
                Amount = receipt.Amount,
                PaymentMethod = receipt.PaymentMethod,
                ReferenceNumber = receipt.ReferenceNumber,
                Notes = receipt.Notes,
                Currency = receipt.Currency,
                CreatedAt = receipt.CreatedAt
            }).ToList();

            return Ok(receiptDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving receipts for invoice {InvoiceId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    // POST: api/invoices/{id}/receipts
    [HttpPost("{id}/receipts")]
    public async Task<ActionResult<ReceiptDto>> ProcessInvoicePayment(int id, PaymentRequest request)
    {
        try
        {
            var currentCompanyId = 1; // TODO: Get from authenticated user
            var userId = "system"; // TODO: Get from authenticated user

            _logger.LogInformation("Processing payment of {Amount:C} for invoice {InvoiceId}", 
                request.Amount, id);

            var receipt = await _invoiceService.ProcessPaymentAsync(
                id, request.Amount, request.PaymentMethod, currentCompanyId, userId, request.Notes, request.ReferenceNumber);

            var receiptDto = new ReceiptDto
            {
                Id = receipt.Id,
                InvoiceId = receipt.InvoiceId,
                ReceiptNumber = receipt.ReceiptNumber,
                PaymentDate = receipt.PaymentDate,
                Amount = receipt.Amount,
                PaymentMethod = receipt.PaymentMethod,
                ReferenceNumber = receipt.ReferenceNumber,
                Notes = receipt.Notes,
                Currency = receipt.Currency,
                CreatedAt = receipt.CreatedAt
            };

            return CreatedAtAction(nameof(GetInvoiceReceipts), new { id = id }, receiptDto);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation processing payment for invoice {InvoiceId}", id);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment for invoice {InvoiceId}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}

// Request DTOs
public class CreateInvoiceRequest
{
    public int CustomerId { get; set; }
    public int? SalesOrderId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Currency { get; set; }
    public string? Notes { get; set; }
    public List<CreateInvoiceLineRequest> Lines { get; set; } = new();
}

public class CreateInvoiceLineRequest
{
    public int? ItemId { get; set; }
    public int LineNumber { get; set; }
    public string Description { get; set; } = "";
    public string? ItemSku { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal TaxRate { get; set; }
}

public class UpdateInvoiceRequest
{
    public DateTime? DueDate { get; set; }
    public InvoiceStatus Status { get; set; }
    public string? Notes { get; set; }
}

// Invoice DTOs for API responses
public class InvoiceDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int? SalesOrderId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public DateTime? DueDate { get; set; }
    public InvoiceStatus Status { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Currency { get; set; } = "ILS";
    public string? Notes { get; set; }
    public string CustomerAddress { get; set; } = string.Empty;
    public string? CustomerTaxId { get; set; }
    public string? CustomerContact { get; set; }
    public List<InvoiceLineDto> Lines { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class InvoiceLineDto
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public int? ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public int LineNumber { get; set; }
    public string Description { get; set; } = string.Empty;
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
    public int InvoiceId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public string Currency { get; set; } = "ILS";
    public DateTime CreatedAt { get; set; }
}

public class PaymentRequest
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}
