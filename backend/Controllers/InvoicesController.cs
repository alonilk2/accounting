using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Sales;
using backend.Models.Core;
using backend.Services.Sales;
using backend.DTOs.Sales;
using backend.DTOs.Shared;

namespace backend.Controllers;

[Route("api/[controller]")]
public class InvoicesController : BaseApiController
{
    private readonly AccountingDbContext _context;
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(AccountingDbContext context, ILogger<InvoicesController> logger, IInvoiceService invoiceService)
        : base(logger)
    {
        _context = context;
        _invoiceService = invoiceService;
    }

    // GET: api/invoices
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<InvoiceDto>>> GetInvoices(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] InvoiceStatus? status = null,
        [FromQuery] int? customerId = null)
    {
        try
        {
            _logger.LogInformation($"GetInvoices called with: page={page}, pageSize={pageSize}, search='{search}', status={status}, customerId={customerId}");
            
            var (validPage, validPageSize) = ValidatePagination(page, pageSize);
            
            var query = _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalesOrder)
                .Include(i => i.Lines)
                    .ThenInclude(l => l.Item)
                .Where(i => !i.IsDeleted);

            // Apply filters
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(i => 
                    (i.InvoiceNumber != null && i.InvoiceNumber.ToLower().Contains(searchLower)) ||
                    (i.Customer != null && i.Customer.Name != null && i.Customer.Name.ToLower().Contains(searchLower)) ||
                    (i.Notes != null && i.Notes.ToLower().Contains(searchLower)));
            }

            if (status.HasValue)
            {
                query = query.Where(i => i.Status == status.Value);
            }

            if (customerId.HasValue)
            {
                query = query.Where(i => i.CustomerId == customerId.Value);
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();
            _logger.LogInformation($"Total invoices found after filters: {totalCount}");

            // Apply pagination and ordering
            var invoices = await query
                .OrderByDescending(i => i.InvoiceDate)
                .Skip((validPage - 1) * validPageSize)
                .Take(validPageSize)
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

            var paginatedResponse = PaginatedResponse<InvoiceDto>.Create(invoices, validPage, validPageSize, totalCount);

            return SuccessResponse(paginatedResponse);
        }
        catch (Exception ex)
        {
            return HandleException(ex, "retrieving invoices");
        }
    }

    // GET: api/invoices/5
    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceDto>> GetInvoice(int id, [FromQuery] int? companyId = null)
    {
        try
        {
            var currentCompanyId = companyId ?? 1;
            
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalesOrder)
                .Include(i => i.Lines)
                    .ThenInclude(l => l.Item)
                .Where(i => i.Id == id && i.CompanyId == currentCompanyId && !i.IsDeleted)
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
                return ErrorResponse($"Invoice with ID {id} not found", 404);
            }

            return SuccessResponse(invoice);
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"retrieving invoice {id}");
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
                return ErrorResponse("Customer not found", 400);
            }

            // Get company ID (assuming from user context)
            var companyId = GetCurrentCompanyId(); // Use the base controller method

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
            if (result.Result is OkObjectResult okResult && okResult.Value is ApiResponse<InvoiceDto> apiResponse && apiResponse.Data != null)
            {
                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, apiResponse.Data);
            }

            return ErrorResponse("Error retrieving created invoice", 500);
        }
        catch (Exception ex)
        {
            return HandleException(ex, "creating invoice");
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
                return ErrorResponse($"Invoice with ID {id} not found", 404);
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
            return HandleException(ex, $"updating invoice {id}");
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
                return ErrorResponse($"Invoice with ID {id} not found", 404);
            }

            // Soft delete
            invoice.IsDeleted = true;
            invoice.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"deleting invoice {id}");
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
                return ErrorResponse("Sales order not found", 404);
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
            if (result.Result is OkObjectResult okResult && okResult.Value is ApiResponse<InvoiceDto> apiResponse && apiResponse.Data != null)
            {
                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, apiResponse.Data);
            }

            return ErrorResponse("Error retrieving created invoice", 500);
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"creating invoice from sales order {salesOrderId}");
        }
    }

    // GET: api/invoices/{id}/receipts
    [HttpGet("{id}/receipts")]
    public async Task<ActionResult<IEnumerable<ReceiptDto>>> GetInvoiceReceipts(int id)
    {
        try
        {
            var currentCompanyId = GetCurrentCompanyId(); // Use base controller method

            // Verify invoice exists and belongs to current company
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .FirstOrDefaultAsync(i => i.Id == id && i.CompanyId == currentCompanyId);

            if (invoice == null)
            {
                return ErrorResponse($"Invoice with ID {id} not found", 404);
            }

            // Get all receipts for this invoice
            var receipts = await _invoiceService.GetInvoiceReceiptsAsync(id, currentCompanyId);

            var receiptDtos = receipts.Select(receipt => new ReceiptDto
            {
                Id = receipt.Id,
                CompanyId = currentCompanyId,
                InvoiceId = receipt.InvoiceId,
                InvoiceNumber = invoice.InvoiceNumber,
                CustomerName = invoice.Customer.Name,
                ReceiptNumber = receipt.ReceiptNumber,
                PaymentDate = receipt.PaymentDate,
                Amount = receipt.Amount,
                PaymentMethod = receipt.PaymentMethod,
                ReferenceNumber = receipt.ReferenceNumber,
                Notes = receipt.Notes,
                CreatedAt = receipt.CreatedAt
            }).ToList();

            return SuccessResponse(receiptDtos.AsEnumerable());
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"retrieving receipts for invoice {id}");
        }
    }

    // POST: api/invoices/{id}/receipts
    [HttpPost("{id}/receipts")]
    public async Task<ActionResult<ReceiptDto>> ProcessInvoicePayment(int id, PaymentRequest request)
    {
        try
        {
            var currentCompanyId = GetCurrentCompanyId(); // Use base controller method
            var userId = GetCurrentUserId(); // Use base controller method

            _logger.LogInformation("Processing payment of {Amount:C} for invoice {InvoiceId}", 
                request.Amount, id);

            // Get invoice details for complete ReceiptDto
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .FirstOrDefaultAsync(i => i.Id == id && i.CompanyId == currentCompanyId);

            if (invoice == null)
            {
                return ErrorResponse($"Invoice with ID {id} not found", 404);
            }

            var receipt = await _invoiceService.ProcessPaymentAsync(
                id, request.Amount, request.PaymentMethod, currentCompanyId, userId, request.Notes, request.ReferenceNumber);

            var receiptDto = new ReceiptDto
            {
                Id = receipt.Id,
                CompanyId = currentCompanyId,
                InvoiceId = receipt.InvoiceId,
                InvoiceNumber = invoice.InvoiceNumber,
                CustomerName = invoice.Customer.Name,
                ReceiptNumber = receipt.ReceiptNumber,
                PaymentDate = receipt.PaymentDate,
                Amount = receipt.Amount,
                PaymentMethod = receipt.PaymentMethod,
                ReferenceNumber = receipt.ReferenceNumber,
                Notes = receipt.Notes,
                CreatedAt = receipt.CreatedAt
            };

            return CreatedAtAction(nameof(GetInvoiceReceipts), new { id = id }, receiptDto);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation processing payment for invoice {InvoiceId}", id);
            return ErrorResponse(ex.Message, 400);
        }
        catch (Exception ex)
        {
            return HandleException(ex, $"processing payment for invoice {id}");
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

public class PaymentRequest
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}
