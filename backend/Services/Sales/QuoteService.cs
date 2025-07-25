using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Sales;
using backend.DTOs.Sales;
using backend.DTOs.Shared;
using backend.Services.Interfaces;
using backend.Services.Core;
using backend.Models.Core;

namespace backend.Services.Sales;

/// <summary>
/// Service for Quote operations with multi-tenant support
/// </summary>
public class QuoteService : BaseService<Quote>, IQuoteService
{
    public QuoteService(AccountingDbContext context, ILogger<BaseService<Quote>> logger) : base(context, logger) { }

    protected override DbSet<Quote> DbSet => _context.Quotes;
    protected override string CompanyIdPropertyName => nameof(Quote.CompanyId);

    /// <summary>
    /// Get quotes with filtering and pagination
    /// </summary>
    public async Task<PaginatedResponse<QuoteDto>> GetQuotesAsync(int companyId, int? customerId = null, 
        QuoteStatus? status = null, DateTime? fromDate = null, DateTime? toDate = null, 
        string? searchTerm = null, int page = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        var query = _context.Quotes
            .Where(q => q.CompanyId == companyId)
            .Include(q => q.Customer)
            .Include(q => q.Agent)
            .Include(q => q.Lines)
                .ThenInclude(l => l.Item)
            .AsQueryable();

        // Apply filters
        if (customerId.HasValue)
            query = query.Where(q => q.CustomerId == customerId.Value);

        if (status.HasValue)
            query = query.Where(q => q.Status == status.Value);

        if (fromDate.HasValue)
            query = query.Where(q => q.QuoteDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(q => q.QuoteDate <= toDate.Value);

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(q => 
                q.QuoteNumber.Contains(searchTerm) ||
                q.Customer.Name.Contains(searchTerm) ||
                (q.Notes != null && q.Notes.Contains(searchTerm)));
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var quotes = await query
            .OrderByDescending(q => q.QuoteDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var quoteDtos = quotes.Select(MapToDto);

        return PaginatedResponse<QuoteDto>.Create(quoteDtos, page, pageSize, totalCount);
    }

    /// <summary>
    /// Get a specific quote by ID
    /// </summary>
    public async Task<QuoteDto?> GetQuoteAsync(int id, int companyId, CancellationToken cancellationToken = default)
    {
        var quote = await _context.Quotes
            .Where(q => q.Id == id && q.CompanyId == companyId)
            .Include(q => q.Customer)
            .Include(q => q.Agent)
            .Include(q => q.Lines)
                .ThenInclude(l => l.Item)
            .FirstOrDefaultAsync(cancellationToken);

        return quote != null ? MapToDto(quote) : null;
    }

    /// <summary>
    /// Create a new quote
    /// </summary>
    public async Task<QuoteDto> CreateQuoteAsync(CreateQuoteRequest request, int companyId, CancellationToken cancellationToken = default)
    {
        // Calculate totals
        var totals = await CalculateQuoteTotalsAsync(request.Lines, cancellationToken);

        // Generate quote number
        var quoteNumber = await GenerateQuoteNumberAsync(companyId, cancellationToken);

        var quote = new Quote
        {
            CompanyId = companyId,
            CustomerId = request.CustomerId,
            AgentId = request.AgentId,
            QuoteNumber = quoteNumber,
            QuoteDate = request.QuoteDate ?? DateTime.UtcNow,
            ValidUntil = request.ValidUntil,
            Status = request.Status ?? QuoteStatus.Draft,
            Currency = request.Currency ?? "ILS",
            ExchangeRate = 1m,
            Notes = request.Notes,
            Terms = request.Terms,
            DeliveryTerms = request.DeliveryTerms,
            PaymentTerms = request.PaymentTerms,
            SubtotalAmount = totals[0],
            DiscountAmount = totals[1],
            TaxAmount = totals[2],
            TotalAmount = totals[3],
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add lines
        for (int i = 0; i < request.Lines.Count; i++)
        {
            var lineRequest = request.Lines[i];
            var lineTotal = lineRequest.Quantity * lineRequest.UnitPrice;
            var discountAmount = lineTotal * (lineRequest.DiscountPercent / 100);
            var lineTotalAfterDiscount = lineTotal - discountAmount;
            var taxAmount = lineTotalAfterDiscount * (lineRequest.TaxRate / 100);

            var line = new QuoteLine
            {
                CompanyId = companyId,
                ItemId = lineRequest.ItemId,
                LineNumber = i + 1,
                Description = lineRequest.Description,
                Quantity = lineRequest.Quantity,
                UnitPrice = lineRequest.UnitPrice,
                DiscountPercent = lineRequest.DiscountPercent,
                TaxRate = lineRequest.TaxRate,
                LineTotal = lineTotalAfterDiscount,
                TaxAmount = taxAmount,
                LineTotalWithTax = lineTotalAfterDiscount + taxAmount,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            quote.Lines.Add(line);
        }

        _context.Quotes.Add(quote);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetQuoteAsync(quote.Id, companyId, cancellationToken) ?? 
               throw new InvalidOperationException("Failed to retrieve created quote");
    }

    /// <summary>
    /// Update an existing quote
    /// </summary>
    public async Task<QuoteDto> UpdateQuoteAsync(int id, CreateQuoteRequest request, int companyId, CancellationToken cancellationToken = default)
    {
        var quote = await _context.Quotes
            .Where(q => q.Id == id && q.CompanyId == companyId)
            .Include(q => q.Lines)
            .FirstOrDefaultAsync(cancellationToken);

        if (quote == null)
            throw new KeyNotFoundException($"Quote with ID {id} not found");

        // Calculate totals
        var totals = await CalculateQuoteTotalsAsync(request.Lines, cancellationToken);

        // Update quote properties
        quote.CustomerId = request.CustomerId;
        quote.AgentId = request.AgentId;
        quote.QuoteDate = request.QuoteDate ?? quote.QuoteDate;
        quote.ValidUntil = request.ValidUntil;
        quote.Status = request.Status ?? quote.Status;
        quote.Currency = request.Currency ?? quote.Currency;
        quote.Notes = request.Notes;
        quote.Terms = request.Terms;
        quote.DeliveryTerms = request.DeliveryTerms;
        quote.PaymentTerms = request.PaymentTerms;
        quote.SubtotalAmount = totals[0];
        quote.DiscountAmount = totals[1];
        quote.TaxAmount = totals[2];
        quote.TotalAmount = totals[3];
        quote.UpdatedAt = DateTime.UtcNow;

        // Remove existing lines
        _context.QuoteLines.RemoveRange(quote.Lines);

        // Add new lines
        quote.Lines.Clear();
        for (int i = 0; i < request.Lines.Count; i++)
        {
            var lineRequest = request.Lines[i];
            var lineTotal = lineRequest.Quantity * lineRequest.UnitPrice;
            var discountAmount = lineTotal * (lineRequest.DiscountPercent / 100);
            var lineTotalAfterDiscount = lineTotal - discountAmount;
            var taxAmount = lineTotalAfterDiscount * (lineRequest.TaxRate / 100);

            var line = new QuoteLine
            {
                CompanyId = companyId,
                QuoteId = quote.Id,
                ItemId = lineRequest.ItemId,
                LineNumber = i + 1,
                Description = lineRequest.Description,
                Quantity = lineRequest.Quantity,
                UnitPrice = lineRequest.UnitPrice,
                DiscountPercent = lineRequest.DiscountPercent,
                TaxRate = lineRequest.TaxRate,
                LineTotal = lineTotalAfterDiscount,
                TaxAmount = taxAmount,
                LineTotalWithTax = lineTotalAfterDiscount + taxAmount,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            quote.Lines.Add(line);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetQuoteAsync(quote.Id, companyId, cancellationToken) ?? 
               throw new InvalidOperationException("Failed to retrieve updated quote");
    }

    /// <summary>
    /// Update quote status
    /// </summary>
    public async Task<QuoteDto> UpdateQuoteStatusAsync(int id, QuoteStatus status, int companyId, CancellationToken cancellationToken = default)
    {
        var quote = await _context.Quotes
            .Where(q => q.Id == id && q.CompanyId == companyId)
            .FirstOrDefaultAsync(cancellationToken);

        if (quote == null)
            throw new KeyNotFoundException($"Quote with ID {id} not found");

        quote.Status = status;
        quote.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetQuoteAsync(quote.Id, companyId, cancellationToken) ?? 
               throw new InvalidOperationException("Failed to retrieve updated quote");
    }

    /// <summary>
    /// Delete a quote (soft delete)
    /// </summary>
    public async Task<bool> DeleteQuoteAsync(int id, int companyId, CancellationToken cancellationToken = default)
    {
        var quote = await _context.Quotes
            .Where(q => q.Id == id && q.CompanyId == companyId)
            .FirstOrDefaultAsync(cancellationToken);

        if (quote == null)
            return false;

        quote.IsDeleted = true;
        quote.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// Duplicate a quote
    /// </summary>
    public async Task<QuoteDto> DuplicateQuoteAsync(int id, int companyId, CancellationToken cancellationToken = default)
    {
        var originalQuote = await _context.Quotes
            .Where(q => q.Id == id && q.CompanyId == companyId)
            .Include(q => q.Lines)
                .ThenInclude(l => l.Item)
            .FirstOrDefaultAsync(cancellationToken);

        if (originalQuote == null)
            throw new KeyNotFoundException($"Quote with ID {id} not found");

        var request = new CreateQuoteRequest
        {
            CustomerId = originalQuote.CustomerId,
            AgentId = originalQuote.AgentId,
            QuoteDate = DateTime.UtcNow,
            ValidUntil = DateTime.UtcNow.AddDays(30),
            Status = QuoteStatus.Draft,
            Currency = originalQuote.Currency,
            Notes = originalQuote.Notes,
            Terms = originalQuote.Terms,
            DeliveryTerms = originalQuote.DeliveryTerms,
            PaymentTerms = originalQuote.PaymentTerms,
            Lines = originalQuote.Lines.Select(l => new CreateQuoteLineRequest
            {
                ItemId = l.ItemId,
                Description = l.Description,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                DiscountPercent = l.DiscountPercent,
                TaxRate = l.TaxRate
            }).ToList()
        };

        return await CreateQuoteAsync(request, companyId, cancellationToken);
    }

    /// <summary>
    /// Convert quote to sales order
    /// </summary>
    public async Task<int> ConvertToSalesOrderAsync(int id, ConvertQuoteToOrderRequest request, int companyId, CancellationToken cancellationToken = default)
    {
        var quote = await _context.Quotes
            .Where(q => q.Id == id && q.CompanyId == companyId)
            .Include(q => q.Lines)
                .ThenInclude(l => l.Item)
            .FirstOrDefaultAsync(cancellationToken);

        if (quote == null)
            throw new KeyNotFoundException($"Quote with ID {id} not found");

        if (quote.Status == QuoteStatus.Converted)
            throw new InvalidOperationException("Quote has already been converted");

        // Create sales order from quote
        var salesOrder = new SalesOrder
        {
            CompanyId = companyId,
            CustomerId = quote.CustomerId,
            AgentId = quote.AgentId,
            QuoteId = quote.Id, // Reference to original quote
            OrderNumber = await GenerateSalesOrderNumberAsync(companyId, cancellationToken),
            OrderDate = request.OrderDate ?? DateTime.UtcNow,
            RequiredDate = request.RequiredDate,
            PromisedDate = request.PromisedDate,
            Status = SalesOrderStatus.Confirmed,
            Currency = quote.Currency,
            ExchangeRate = quote.ExchangeRate,
            Notes = request.Notes ?? quote.Notes,
            PaymentTerms = quote.PaymentTerms,
            ShippingMethod = quote.DeliveryTerms, // Map delivery terms to shipping method
            SubtotalAmount = quote.SubtotalAmount,
            DiscountAmount = quote.DiscountAmount,
            TaxAmount = quote.TaxAmount,
            TotalAmount = quote.TotalAmount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Convert quote lines to order lines
        var linesToConvert = request.SelectedLineIds?.Any() == true
            ? quote.Lines.Where(l => request.SelectedLineIds.Contains(l.Id))
            : quote.Lines;

        foreach (var quoteLine in linesToConvert)
        {
            var orderLine = new SalesOrderLine
            {
                CompanyId = companyId,
                ItemId = quoteLine.ItemId,
                LineNumber = quoteLine.LineNumber,
                Description = quoteLine.Description,
                Quantity = quoteLine.Quantity,
                UnitPrice = quoteLine.UnitPrice,
                DiscountPercent = quoteLine.DiscountPercent,
                TaxRate = quoteLine.TaxRate,
                LineTotal = quoteLine.LineTotal,
                TaxAmount = quoteLine.TaxAmount,
                LineTotalWithTax = quoteLine.LineTotalWithTax,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            salesOrder.Lines.Add(orderLine);
        }

        _context.SalesOrders.Add(salesOrder);

        // Update quote status
        quote.Status = QuoteStatus.Converted;
        quote.ConvertedToSalesOrderId = salesOrder.Id;
        quote.ConvertedAt = DateTime.UtcNow;
        quote.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return salesOrder.Id;
    }

    /// <summary>
    /// Generate a unique quote number
    /// </summary>
    public async Task<string> GenerateQuoteNumberAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"QU-{year}-";

        var lastQuote = await _context.Quotes
            .Where(q => q.CompanyId == companyId && q.QuoteNumber.StartsWith(prefix))
            .OrderByDescending(q => q.QuoteNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (lastQuote != null)
        {
            var lastNumberStr = lastQuote.QuoteNumber.Substring(prefix.Length);
            if (int.TryParse(lastNumberStr, out int lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D4}";
    }

    /// <summary>
    /// Generate a unique sales order number
    /// </summary>
    private async Task<string> GenerateSalesOrderNumberAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"SO-{year}-";

        var lastOrder = await _context.SalesOrders
            .Where(so => so.CompanyId == companyId && so.OrderNumber.StartsWith(prefix))
            .OrderByDescending(so => so.OrderNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextNumber = 1;
        if (lastOrder != null)
        {
            var lastNumberStr = lastOrder.OrderNumber.Substring(prefix.Length);
            if (int.TryParse(lastNumberStr, out int lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D4}";
    }

    /// <summary>
    /// Calculate quote totals from lines
    /// </summary>
    public Task<decimal[]> CalculateQuoteTotalsAsync(List<CreateQuoteLineRequest> lines, CancellationToken cancellationToken = default)
    {
        decimal subtotal = 0;
        decimal totalDiscount = 0;
        decimal totalTax = 0;

        foreach (var line in lines)
        {
            var lineTotal = line.Quantity * line.UnitPrice;
            var discountAmount = lineTotal * (line.DiscountPercent / 100);
            var lineTotalAfterDiscount = lineTotal - discountAmount;
            var taxAmount = lineTotalAfterDiscount * (line.TaxRate / 100);

            subtotal += lineTotalAfterDiscount;
            totalDiscount += discountAmount;
            totalTax += taxAmount;
        }

        var total = subtotal + totalTax;

        return Task.FromResult(new[] { subtotal, totalDiscount, totalTax, total });
    }

    /// <summary>
    /// Map Quote entity to DTO
    /// </summary>
    private static QuoteDto MapToDto(Quote quote)
    {
        return new QuoteDto
        {
            Id = quote.Id,
            CompanyId = quote.CompanyId,
            CustomerId = quote.CustomerId,
            CustomerName = quote.Customer?.Name ?? string.Empty,
            AgentId = quote.AgentId,
            AgentName = quote.Agent?.Name,
            QuoteNumber = quote.QuoteNumber,
            QuoteDate = quote.QuoteDate,
            ValidUntil = quote.ValidUntil,
            Status = quote.Status,
            SubtotalAmount = quote.SubtotalAmount,
            DiscountAmount = quote.DiscountAmount,
            TaxAmount = quote.TaxAmount,
            TotalAmount = quote.TotalAmount,
            Currency = quote.Currency,
            ExchangeRate = quote.ExchangeRate,
            Notes = quote.Notes,
            Terms = quote.Terms,
            DeliveryTerms = quote.DeliveryTerms,
            PaymentTerms = quote.PaymentTerms,
            ConvertedToSalesOrderId = quote.ConvertedToSalesOrderId,
            ConvertedAt = quote.ConvertedAt,
            Lines = quote.Lines.Select(l => new QuoteLineDto
            {
                Id = l.Id,
                QuoteId = l.QuoteId,
                ItemId = l.ItemId,
                ItemName = l.Item?.Name ?? string.Empty,
                ItemSku = l.Item?.SKU ?? string.Empty,
                LineNumber = l.LineNumber,
                Description = l.Description,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                DiscountPercent = l.DiscountPercent,
                TaxRate = l.TaxRate,
                LineTotal = l.LineTotal,
                TaxAmount = l.TaxAmount,
                LineTotalWithTax = l.LineTotalWithTax
            }).OrderBy(l => l.LineNumber).ToList(),
            CreatedAt = quote.CreatedAt,
            UpdatedAt = quote.UpdatedAt
        };
    }
}
