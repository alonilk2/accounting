using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Sales;
using backend.DTOs.Sales;
using backend.Models.Inventory;

namespace backend.Services.Sales;

public interface ITaxInvoiceReceiptService
{
    Task<(List<TaxInvoiceReceiptListDto> items, int totalCount)> GetTaxInvoiceReceiptsAsync(
        int companyId, TaxInvoiceReceiptFilterDto filter, CancellationToken cancellationToken = default);
    
    Task<TaxInvoiceReceiptDto?> GetTaxInvoiceReceiptByIdAsync(
        int id, int companyId, CancellationToken cancellationToken = default);
    
    Task<TaxInvoiceReceiptDto> CreateTaxInvoiceReceiptAsync(
        CreateTaxInvoiceReceiptDto dto, int companyId, CancellationToken cancellationToken = default);
    
    Task<TaxInvoiceReceiptDto> UpdateTaxInvoiceReceiptAsync(
        int id, UpdateTaxInvoiceReceiptDto dto, int companyId, CancellationToken cancellationToken = default);
    
    Task<bool> CancelTaxInvoiceReceiptAsync(
        int id, int companyId, CancellationToken cancellationToken = default);
    
    Task<bool> DeleteTaxInvoiceReceiptAsync(
        int id, int companyId, CancellationToken cancellationToken = default);
    
    Task<string> GenerateNextDocumentNumberAsync(
        int companyId, CancellationToken cancellationToken = default);
}

public class TaxInvoiceReceiptService : ITaxInvoiceReceiptService
{
    private readonly AccountingDbContext _context;

    public TaxInvoiceReceiptService(AccountingDbContext context)
    {
        _context = context;
    }

    public async Task<(List<TaxInvoiceReceiptListDto> items, int totalCount)> GetTaxInvoiceReceiptsAsync(
        int companyId, TaxInvoiceReceiptFilterDto filter, CancellationToken cancellationToken = default)
    {
        var query = _context.TaxInvoiceReceipts
            .Where(t => t.CompanyId == companyId && !t.IsDeleted)
            .Include(t => t.Customer)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(filter.DocumentNumber))
        {
            query = query.Where(t => t.DocumentNumber.Contains(filter.DocumentNumber));
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(t => t.DocumentDate >= filter.FromDate.Value.Date);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(t => t.DocumentDate <= filter.ToDate.Value.Date.AddDays(1).AddTicks(-1));
        }

        if (filter.CustomerId.HasValue)
        {
            query = query.Where(t => t.CustomerId == filter.CustomerId.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(t => t.Status == filter.Status.Value);
        }

        if (!string.IsNullOrEmpty(filter.PaymentMethod))
        {
            query = query.Where(t => t.PaymentMethod.Contains(filter.PaymentMethod));
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        var sortedQuery = filter.SortBy?.ToLower() switch
        {
            "documentnumber" => filter.SortDescending 
                ? query.OrderByDescending(t => t.DocumentNumber)
                : query.OrderBy(t => t.DocumentNumber),
            "customername" => filter.SortDescending
                ? query.OrderByDescending(t => t.Customer.Name)
                : query.OrderBy(t => t.Customer.Name),
            "totalamount" => filter.SortDescending
                ? query.OrderByDescending(t => t.TotalAmount)
                : query.OrderBy(t => t.TotalAmount),
            "status" => filter.SortDescending
                ? query.OrderByDescending(t => t.Status)
                : query.OrderBy(t => t.Status),
            _ => filter.SortDescending
                ? query.OrderByDescending(t => t.DocumentDate)
                : query.OrderBy(t => t.DocumentDate)
        };

        // Apply pagination
        var items = await sortedQuery
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(t => new TaxInvoiceReceiptListDto
            {
                Id = t.Id,
                DocumentNumber = t.DocumentNumber,
                DocumentDate = t.DocumentDate,
                CustomerName = t.Customer.Name,
                Status = t.Status,
                StatusDisplayName = GetStatusDisplayName(t.Status),
                TotalAmount = t.TotalAmount,
                PaymentMethod = t.PaymentMethod,
                Currency = t.Currency
            })
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<TaxInvoiceReceiptDto?> GetTaxInvoiceReceiptByIdAsync(
        int id, int companyId, CancellationToken cancellationToken = default)
    {
        var taxInvoiceReceipt = await _context.TaxInvoiceReceipts
            .Where(t => t.Id == id && t.CompanyId == companyId && !t.IsDeleted)
            .Include(t => t.Customer)
            .Include(t => t.Lines)
                .ThenInclude(l => l.Item)
            .FirstOrDefaultAsync(cancellationToken);

        if (taxInvoiceReceipt == null)
        {
            return null;
        }

        return new TaxInvoiceReceiptDto
        {
            Id = taxInvoiceReceipt.Id,
            CustomerId = taxInvoiceReceipt.CustomerId,
            CustomerName = taxInvoiceReceipt.Customer.Name,
            DocumentNumber = taxInvoiceReceipt.DocumentNumber,
            DocumentDate = taxInvoiceReceipt.DocumentDate,
            Status = taxInvoiceReceipt.Status,
            StatusDisplayName = GetStatusDisplayName(taxInvoiceReceipt.Status),
            SubTotal = taxInvoiceReceipt.SubTotal,
            VatAmount = taxInvoiceReceipt.VatAmount,
            TotalAmount = taxInvoiceReceipt.TotalAmount,
            PaymentMethod = taxInvoiceReceipt.PaymentMethod,
            ReferenceNumber = taxInvoiceReceipt.ReferenceNumber,
            Currency = taxInvoiceReceipt.Currency,
            ExchangeRate = taxInvoiceReceipt.ExchangeRate,
            Notes = taxInvoiceReceipt.Notes,
            CreatedAt = taxInvoiceReceipt.CreatedAt,
            Lines = taxInvoiceReceipt.Lines.Select(l => new TaxInvoiceReceiptLineDto
            {
                Id = l.Id,
                ItemId = l.ItemId,
                ItemName = l.Item.Name,
                ItemSku = l.Item.SKU,
                ItemUnit = l.Item.Unit,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                DiscountPercent = l.DiscountPercent,
                DiscountAmount = l.DiscountAmount,
                VatRate = l.VatRate,
                LineSubTotal = l.LineSubTotal,
                LineVatAmount = l.LineVatAmount,
                LineTotalAmount = l.LineTotalAmount
            }).ToList()
        };
    }

    public async Task<TaxInvoiceReceiptDto> CreateTaxInvoiceReceiptAsync(
        CreateTaxInvoiceReceiptDto dto, int companyId, CancellationToken cancellationToken = default)
    {
        // Verify customer exists and belongs to company
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == dto.CustomerId && c.CompanyId == companyId, cancellationToken);
        
        if (customer == null)
        {
            throw new ArgumentException("לקוח לא נמצא");
        }

        // Verify all items exist and belong to company
        var itemIds = dto.Lines.Select(l => l.ItemId).ToList();
        var items = await _context.Items
            .Where(i => itemIds.Contains(i.Id) && i.CompanyId == companyId)
            .ToListAsync(cancellationToken);
        
        if (items.Count != itemIds.Count)
        {
            throw new ArgumentException("אחד או יותר מהפריטים לא נמצאו");
        }

        // Generate document number
        var documentNumber = await GenerateNextDocumentNumberAsync(companyId, cancellationToken);

        // Calculate totals
        var lines = new List<TaxInvoiceReceiptLine>();
        decimal subTotal = 0;
        decimal vatAmount = 0;

        foreach (var lineDto in dto.Lines)
        {
            var item = items.First(i => i.Id == lineDto.ItemId);
            
            var lineSubTotal = (lineDto.Quantity * lineDto.UnitPrice) - lineDto.DiscountAmount;
            var lineVatAmount = lineSubTotal * (lineDto.VatRate / 100);
            var lineTotalAmount = lineSubTotal + lineVatAmount;

            var line = new TaxInvoiceReceiptLine
            {
                CompanyId = companyId,
                ItemId = lineDto.ItemId,
                Quantity = lineDto.Quantity,
                UnitPrice = lineDto.UnitPrice,
                DiscountPercent = lineDto.DiscountPercent,
                DiscountAmount = lineDto.DiscountAmount,
                VatRate = lineDto.VatRate,
                LineSubTotal = lineSubTotal,
                LineVatAmount = lineVatAmount,
                LineTotalAmount = lineTotalAmount
            };

            lines.Add(line);
            subTotal += lineSubTotal;
            vatAmount += lineVatAmount;
        }

        var taxInvoiceReceipt = new TaxInvoiceReceipt
        {
            CompanyId = companyId,
            CustomerId = dto.CustomerId,
            DocumentNumber = documentNumber,
            DocumentDate = dto.DocumentDate,
            Status = TaxInvoiceReceiptStatus.Paid,
            SubTotal = subTotal,
            VatAmount = vatAmount,
            TotalAmount = subTotal + vatAmount,
            PaymentMethod = dto.PaymentMethod,
            ReferenceNumber = dto.ReferenceNumber,
            Currency = dto.Currency,
            ExchangeRate = dto.ExchangeRate,
            Notes = dto.Notes,
            Lines = lines
        };

        _context.TaxInvoiceReceipts.Add(taxInvoiceReceipt);

        // Update inventory - decrease stock for sold items
        foreach (var line in lines)
        {
            var inventoryTransaction = new InventoryTransaction
            {
                CompanyId = companyId,
                ItemId = line.ItemId,
                Date = dto.DocumentDate,
                QuantityChange = -line.Quantity, // Negative for sales
                TransactionType = InventoryTransactionType.Sale,
                ReferenceId = taxInvoiceReceipt.Id,
                ReferenceType = "TaxInvoiceReceipt",
                Notes = $"מכירה - חשבונית מס-קבלה {documentNumber}"
            };

            _context.InventoryTransactions.Add(inventoryTransaction);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetTaxInvoiceReceiptByIdAsync(taxInvoiceReceipt.Id, companyId, cancellationToken) 
               ?? throw new InvalidOperationException("שגיאה ביצירת חשבונית מס-קבלה");
    }

    public async Task<TaxInvoiceReceiptDto> UpdateTaxInvoiceReceiptAsync(
        int id, UpdateTaxInvoiceReceiptDto dto, int companyId, CancellationToken cancellationToken = default)
    {
        var taxInvoiceReceipt = await _context.TaxInvoiceReceipts
            .FirstOrDefaultAsync(t => t.Id == id && t.CompanyId == companyId && !t.IsDeleted, cancellationToken);

        if (taxInvoiceReceipt == null)
        {
            throw new ArgumentException("חשבונית מס-קבלה לא נמצאה");
        }

        if (taxInvoiceReceipt.Status == TaxInvoiceReceiptStatus.Cancelled)
        {
            throw new InvalidOperationException("לא ניתן לעדכן חשבונית מס-קבלה מבוטלת");
        }

        // Update only allowed fields
        taxInvoiceReceipt.PaymentMethod = dto.PaymentMethod;
        taxInvoiceReceipt.ReferenceNumber = dto.ReferenceNumber;
        taxInvoiceReceipt.Notes = dto.Notes;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetTaxInvoiceReceiptByIdAsync(id, companyId, cancellationToken)
               ?? throw new InvalidOperationException("שגיאה בעדכון חשבונית מס-קבלה");
    }

    public async Task<bool> CancelTaxInvoiceReceiptAsync(
        int id, int companyId, CancellationToken cancellationToken = default)
    {
        var taxInvoiceReceipt = await _context.TaxInvoiceReceipts
            .Include(t => t.Lines)
            .FirstOrDefaultAsync(t => t.Id == id && t.CompanyId == companyId && !t.IsDeleted, cancellationToken);

        if (taxInvoiceReceipt == null)
        {
            return false;
        }

        if (taxInvoiceReceipt.Status == TaxInvoiceReceiptStatus.Cancelled)
        {
            return true; // Already cancelled
        }

        // Update status
        taxInvoiceReceipt.Status = TaxInvoiceReceiptStatus.Cancelled;

        // Reverse inventory transactions
        foreach (var line in taxInvoiceReceipt.Lines)
        {
            var reverseTransaction = new InventoryTransaction
            {
                CompanyId = companyId,
                ItemId = line.ItemId,
                Date = DateTime.UtcNow,
                QuantityChange = line.Quantity, // Positive to reverse the sale
                TransactionType = InventoryTransactionType.Adjustment,
                ReferenceId = taxInvoiceReceipt.Id,
                ReferenceType = "TaxInvoiceReceiptCancellation",
                Notes = $"ביטול מכירה - חשבונית מס-קבלה {taxInvoiceReceipt.DocumentNumber}"
            };

            _context.InventoryTransactions.Add(reverseTransaction);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteTaxInvoiceReceiptAsync(
        int id, int companyId, CancellationToken cancellationToken = default)
    {
        var taxInvoiceReceipt = await _context.TaxInvoiceReceipts
            .FirstOrDefaultAsync(t => t.Id == id && t.CompanyId == companyId, cancellationToken);

        if (taxInvoiceReceipt == null)
        {
            return false;
        }

        // Soft delete
        taxInvoiceReceipt.IsDeleted = true;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<string> GenerateNextDocumentNumberAsync(
        int companyId, CancellationToken cancellationToken = default)
    {
        var currentYear = DateTime.Now.Year;
        var prefix = $"TMR-{currentYear}-";

        var lastNumber = await _context.TaxInvoiceReceipts
            .Where(t => t.CompanyId == companyId && t.DocumentNumber.StartsWith(prefix))
            .OrderByDescending(t => t.DocumentNumber)
            .Select(t => t.DocumentNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (!string.IsNullOrEmpty(lastNumber))
        {
            var numberPart = lastNumber.Substring(prefix.Length);
            if (int.TryParse(numberPart, out var currentNumber))
            {
                nextNumber = currentNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D4}";
    }

    private static string GetStatusDisplayName(TaxInvoiceReceiptStatus status)
    {
        return status switch
        {
            TaxInvoiceReceiptStatus.Paid => "שולם",
            TaxInvoiceReceiptStatus.Cancelled => "בוטל",
            _ => status.ToString()
        };
    }
}
