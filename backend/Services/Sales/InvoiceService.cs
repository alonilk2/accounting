using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Sales;
using backend.Services.Interfaces;

namespace backend.Services.Sales;

public interface IInvoiceService
{
    Task<Receipt> ProcessPaymentAsync(int invoiceId, decimal paymentAmount, string paymentMethod, int companyId, string userId, string? notes = null, string? referenceNumber = null, CancellationToken ct = default);
    Task<IEnumerable<Receipt>> GetInvoiceReceiptsAsync(int invoiceId, int companyId, CancellationToken ct = default);
    Task<string> GenerateReceiptNumberAsync(int companyId, CancellationToken ct = default);
}

public class InvoiceService : IInvoiceService
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<InvoiceService> _logger;

    public InvoiceService(AccountingDbContext context, ILogger<InvoiceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Receipt> ProcessPaymentAsync(int invoiceId, decimal paymentAmount, string paymentMethod, int companyId, string userId, string? notes = null, string? referenceNumber = null, CancellationToken ct = default)
    {
        // Get the invoice
        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.CompanyId == companyId && !i.IsDeleted, ct);

        if (invoice == null)
        {
            throw new InvalidOperationException($"Invoice with ID {invoiceId} not found");
        }

        if (paymentAmount <= 0)
        {
            throw new InvalidOperationException("Payment amount must be greater than zero");
        }

        var remainingAmount = invoice.TotalAmount - invoice.PaidAmount;
        if (paymentAmount > remainingAmount)
        {
            throw new InvalidOperationException($"Payment amount ({paymentAmount:C}) exceeds remaining balance ({remainingAmount:C})");
        }

        // Create receipt
        var receipt = new Receipt
        {
            CompanyId = companyId,
            InvoiceId = invoiceId,
            PaymentDate = DateTime.UtcNow,
            Amount = paymentAmount,
            PaymentMethod = paymentMethod,
            Currency = invoice.Currency,
            ReceiptNumber = await GenerateReceiptNumberAsync(companyId, ct),
            Notes = notes,
            ReferenceNumber = referenceNumber,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            UpdatedBy = userId,
            IsDeleted = false
        };

        _context.Receipts.Add(receipt);

        // Update invoice paid amount
        invoice.PaidAmount += paymentAmount;
        invoice.UpdatedAt = DateTime.UtcNow;
        invoice.UpdatedBy = userId;

        // Update invoice status based on payment
        if (invoice.PaidAmount >= invoice.TotalAmount)
        {
            invoice.Status = InvoiceStatus.Paid;
        }

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Payment of {Amount:C} processed for invoice {InvoiceId}", paymentAmount, invoiceId);

        return receipt;
    }

    public async Task<IEnumerable<Receipt>> GetInvoiceReceiptsAsync(int invoiceId, int companyId, CancellationToken ct = default)
    {
        return await _context.Receipts
            .Where(r => r.InvoiceId == invoiceId && r.CompanyId == companyId && !r.IsDeleted)
            .OrderByDescending(r => r.PaymentDate)
            .ToListAsync(ct);
    }

    public async Task<string> GenerateReceiptNumberAsync(int companyId, CancellationToken ct = default)
    {
        var currentYear = DateTime.Now.Year;
        var prefix = $"REC-{currentYear}-";

        // Get the last receipt number for the current year and company
        var lastReceipt = await _context.Receipts
            .Where(r => r.CompanyId == companyId && r.ReceiptNumber.StartsWith(prefix))
            .OrderByDescending(r => r.Id)
            .FirstOrDefaultAsync(ct);

        int nextNumber = 1;
        if (lastReceipt != null)
        {
            // Extract the number part from the receipt number
            var numberPart = lastReceipt.ReceiptNumber.Substring(prefix.Length);
            if (int.TryParse(numberPart, out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D4}";
    }
}
