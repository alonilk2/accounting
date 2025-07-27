using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Sales;
using backend.DTOs.Sales;
using backend.DTOs.Core;
using backend.DTOs.Shared;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

[Route("api/[controller]")]
public class ReceiptsController : BaseApiController
{
    private readonly AccountingDbContext _context;

    public ReceiptsController(AccountingDbContext context, ILogger<ReceiptsController> logger) : base(logger)
    {
        _context = context;
    }

    /// <summary>
    /// Get all receipts for a company
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<ReceiptListDto>>> GetReceipts(
        int companyId,
        int page = 1,
        int pageSize = 10,
        string? search = null)
    {
        var query = _context.Receipts
            .Where(r => r.CompanyId == companyId && !r.IsDeleted)
            .Include(r => r.Invoice)
                .ThenInclude(i => i.Customer)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(r => 
                r.ReceiptNumber.Contains(search) ||
                (r.Invoice != null && r.Invoice.InvoiceNumber.Contains(search)) ||
                (r.Invoice != null && r.Invoice.Customer != null && r.Invoice.Customer.Name.Contains(search)) ||
                (r.CustomerName != null && r.CustomerName.Contains(search)));
        }

        var totalCount = await query.CountAsync();
        var receipts = await query
            .OrderByDescending(r => r.PaymentDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReceiptListDto
            {
                Id = r.Id,
                ReceiptNumber = r.ReceiptNumber,
                InvoiceId = r.InvoiceId,
                InvoiceNumber = r.Invoice != null ? r.Invoice.InvoiceNumber : null,
                CustomerName = r.Invoice != null && r.Invoice.Customer != null ? r.Invoice.Customer.Name : r.CustomerName ?? "N/A",
                PaymentDate = r.PaymentDate,
                Amount = r.Amount,
                PaymentMethod = r.PaymentMethod,
                Currency = r.Currency,
                CreatedAt = r.CreatedAt,
                CustomerTaxId = r.CustomerTaxId,
                Description = r.Description,
                IsStandalone = r.InvoiceId == null
            })
            .ToListAsync();

        return SuccessResponse(new PaginatedResponse<ReceiptListDto>
        {
            Data = receipts,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    /// <summary>
    /// Get receipts for a specific invoice
    /// </summary>
    [HttpGet("by-invoice/{invoiceId}")]
    public async Task<ActionResult<List<ReceiptListDto>>> GetReceiptsByInvoice(int invoiceId, int companyId)
    {
        var receipts = await _context.Receipts
            .Where(r => r.InvoiceId == invoiceId && r.CompanyId == companyId && !r.IsDeleted)
            .Include(r => r.Invoice)
                .ThenInclude(i => i.Customer)
            .Select(r => new ReceiptListDto
            {
                Id = r.Id,
                ReceiptNumber = r.ReceiptNumber,
                InvoiceId = r.InvoiceId,
                InvoiceNumber = r.Invoice.InvoiceNumber,
                CustomerName = r.Invoice.Customer != null ? r.Invoice.Customer.Name : "N/A",
                PaymentDate = r.PaymentDate,
                Amount = r.Amount,
                PaymentMethod = r.PaymentMethod,
                Currency = r.Currency,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return SuccessResponse(receipts);
    }

    /// <summary>
    /// Get a specific receipt
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ReceiptDto>> GetReceipt(int id, int companyId)
    {
        var receipt = await _context.Receipts
            .Where(r => r.Id == id && r.CompanyId == companyId && !r.IsDeleted)
            .Include(r => r.Invoice)
                .ThenInclude(i => i.Customer)
            .FirstOrDefaultAsync();

        if (receipt == null)
        {
            return ErrorResponse("Receipt not found", 404);
        }

        var receiptDto = new ReceiptDto
        {
            Id = receipt.Id,
            ReceiptNumber = receipt.ReceiptNumber,
            InvoiceId = receipt.InvoiceId,
            InvoiceNumber = receipt.Invoice?.InvoiceNumber,
            CustomerName = receipt.Invoice?.Customer?.Name ?? receipt.CustomerName ?? "N/A",
            PaymentDate = receipt.PaymentDate,
            Amount = receipt.Amount,
            PaymentMethod = receipt.PaymentMethod,
            ReferenceNumber = receipt.ReferenceNumber,
            Notes = receipt.Notes,
            Currency = receipt.Currency,
            CreatedAt = receipt.CreatedAt,
            CustomerTaxId = receipt.CustomerTaxId,
            Description = receipt.Description
        };

        return SuccessResponse(receiptDto);
    }

    /// <summary>
    /// Create a new receipt (invoice-based or standalone)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReceiptDto>> CreateReceipt(CreateReceiptDto createReceiptDto, int companyId)
    {
        Invoice? invoice = null;
        
        // If this is an invoice-based receipt
        if (createReceiptDto.InvoiceId.HasValue)
        {
            // Validate invoice exists and belongs to company
            invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == createReceiptDto.InvoiceId && i.CompanyId == companyId && !i.IsDeleted);

            if (invoice == null)
            {
                return BadRequest("Invoice not found or doesn't belong to this company");
            }

            // Calculate current paid amount for this invoice
            var currentPaidAmount = await _context.Receipts
                .Where(r => r.InvoiceId == createReceiptDto.InvoiceId && r.CompanyId == companyId && !r.IsDeleted)
                .SumAsync(r => r.Amount);

            var remainingAmount = invoice.TotalAmount - currentPaidAmount;

            // Validate payment amount for invoice
            if (createReceiptDto.Amount > remainingAmount)
            {
                return BadRequest($"Payment amount exceeds remaining balance of {remainingAmount:C}");
            }
        }
        else
        {
            // Standalone receipt validation
            if (string.IsNullOrWhiteSpace(createReceiptDto.CustomerName))
            {
                return BadRequest("Customer name is required for standalone receipts");
            }
        }

        // Common validation
        if (createReceiptDto.Amount <= 0)
        {
            return BadRequest("Payment amount must be positive");
        }

        // Generate receipt number
        var receiptNumber = await GenerateReceiptNumberAsync(companyId);

        var receipt = new Receipt
        {
            InvoiceId = createReceiptDto.InvoiceId,
            ReceiptNumber = receiptNumber,
            PaymentDate = createReceiptDto.PaymentDate,
            Amount = createReceiptDto.Amount,
            PaymentMethod = createReceiptDto.PaymentMethod,
            ReferenceNumber = createReceiptDto.ReferenceNumber,
            Notes = createReceiptDto.Notes,
            Currency = createReceiptDto.Currency,
            CompanyId = companyId,
            CreatedAt = DateTime.UtcNow,
            // Standalone receipt fields
            CustomerName = createReceiptDto.CustomerName,
            CustomerTaxId = createReceiptDto.CustomerTaxId,
            Description = createReceiptDto.Description
        };

        _context.Receipts.Add(receipt);

        // Update invoice if this is an invoice-based receipt
        if (invoice != null && createReceiptDto.InvoiceId.HasValue)
        {
            // Calculate current paid amount for this invoice (including this new receipt)
            var currentPaidAmount = await _context.Receipts
                .Where(r => r.InvoiceId == createReceiptDto.InvoiceId && r.CompanyId == companyId && !r.IsDeleted)
                .SumAsync(r => r.Amount);

            // Update invoice paid amount
            invoice.PaidAmount = currentPaidAmount + createReceiptDto.Amount;
            
            // Update invoice status if fully paid
            if (invoice.PaidAmount >= invoice.TotalAmount)
            {
                invoice.Status = InvoiceStatus.Paid;
            }
        }

        await _context.SaveChangesAsync();

        // Return created receipt
        var createdReceipt = await _context.Receipts
            .Where(r => r.Id == receipt.Id)
            .Include(r => r.Invoice)
                .ThenInclude(i => i != null ? i.Customer : null)
            .FirstAsync();

        var receiptDto = new ReceiptDto
        {
            Id = createdReceipt.Id,
            ReceiptNumber = createdReceipt.ReceiptNumber,
            InvoiceId = createdReceipt.InvoiceId,
            InvoiceNumber = createdReceipt.Invoice?.InvoiceNumber,
            CustomerName = createdReceipt.Invoice?.Customer?.Name ?? createdReceipt.CustomerName ?? "N/A",
            PaymentDate = createdReceipt.PaymentDate,
            Amount = createdReceipt.Amount,
            PaymentMethod = createdReceipt.PaymentMethod,
            ReferenceNumber = createdReceipt.ReferenceNumber,
            Notes = createdReceipt.Notes,
            Currency = createdReceipt.Currency,
            CreatedAt = createdReceipt.CreatedAt,
            CustomerTaxId = createdReceipt.CustomerTaxId,
            Description = createdReceipt.Description
        };

        return CreatedAtAction(nameof(GetReceipt), new { id = receipt.Id, companyId }, receiptDto);
    }

    /// <summary>
    /// Delete a receipt (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReceipt(int id, int companyId)
    {
        var receipt = await _context.Receipts
            .Include(r => r.Invoice)
            .FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId && !r.IsDeleted);

        if (receipt == null)
        {
            return ErrorResponse("Receipt not found", 404);
        }

        // Soft delete the receipt
        receipt.IsDeleted = true;

        // Update invoice paid amount
        var remainingPaidAmount = await _context.Receipts
            .Where(r => r.InvoiceId == receipt.InvoiceId && r.CompanyId == companyId && !r.IsDeleted && r.Id != id)
            .SumAsync(r => r.Amount);

        receipt.Invoice.PaidAmount = remainingPaidAmount;

        // Update invoice status
        if (receipt.Invoice.PaidAmount < receipt.Invoice.TotalAmount)
        {
            receipt.Invoice.Status = InvoiceStatus.Sent; // Back to unpaid status
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Generate a unique receipt number
    /// </summary>
    private async Task<string> GenerateReceiptNumberAsync(int companyId)
    {
        var year = DateTime.Now.Year;
        var prefix = $"REC-{year}-";

        var lastReceipt = await _context.Receipts
            .Where(r => r.CompanyId == companyId && r.ReceiptNumber.StartsWith(prefix))
            .OrderByDescending(r => r.ReceiptNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastReceipt != null)
        {
            var lastNumberStr = lastReceipt.ReceiptNumber.Substring(prefix.Length);
            if (int.TryParse(lastNumberStr, out int lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D4}";
    }
}
