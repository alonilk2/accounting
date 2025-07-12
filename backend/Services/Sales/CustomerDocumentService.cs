using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Controllers;
using backend.Services.Interfaces;
using backend.Models.Sales;

namespace backend.Services.Sales;

/// <summary>
/// Service for customer document operations
/// </summary>
public class CustomerDocumentService : ICustomerDocumentService
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<CustomerDocumentService> _logger;

    public CustomerDocumentService(
        AccountingDbContext context,
        ILogger<CustomerDocumentService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all documents for a specific customer
    /// </summary>
    public async Task<CustomerDocumentsResponseDto?> GetCustomerDocumentsAsync(
        int customerId,
        int companyId,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? documentType = null)
    {
        try
        {
            _logger.LogInformation("Retrieving documents for customer {CustomerId} in company {CompanyId}",
                customerId, companyId);

            // Verify customer exists and belongs to the company
            var customer = await _context.Customers
                .Where(c => c.Id == customerId && c.CompanyId == companyId)
                .FirstOrDefaultAsync();

            if (customer == null)
            {
                _logger.LogWarning("Customer {CustomerId} not found in company {CompanyId}",
                    customerId, companyId);
                return null;
            }

            var documents = new List<CustomerDocumentDto>();

            // Get Sales Orders
            if (string.IsNullOrEmpty(documentType) || 
                documentType.Equals("SalesOrder", StringComparison.OrdinalIgnoreCase))
            {
                var salesOrders = await GetSalesOrderDocuments(customerId, companyId, fromDate, toDate);
                documents.AddRange(salesOrders);
            }

            // Get Invoices
            if (string.IsNullOrEmpty(documentType) || 
                documentType.Equals("Invoice", StringComparison.OrdinalIgnoreCase))
            {
                var invoices = await GetInvoiceDocuments(customerId, companyId, fromDate, toDate);
                documents.AddRange(invoices);
            }

            // Get Receipts
            if (string.IsNullOrEmpty(documentType) || 
                documentType.Equals("Receipt", StringComparison.OrdinalIgnoreCase))
            {
                var receipts = await GetReceiptDocuments(customerId, companyId, fromDate, toDate);
                documents.AddRange(receipts);
            }

            // Get POS Sales (if customer has associated POS sales)
            if (string.IsNullOrEmpty(documentType) || 
                documentType.Equals("POSSale", StringComparison.OrdinalIgnoreCase))
            {
                var posSales = await GetPOSSaleDocuments(customerId, companyId, fromDate, toDate);
                documents.AddRange(posSales);
            }

            // Sort all documents by date descending
            documents = documents.OrderByDescending(d => d.DocumentDate).ToList();

            var response = new CustomerDocumentsResponseDto
            {
                CustomerId = customerId,
                CustomerName = customer.Name,
                Documents = documents,
                TotalDocuments = documents.Count,
                TotalAmount = documents.Sum(d => d.TotalAmount),
                FromDate = fromDate,
                ToDate = toDate
            };

            _logger.LogInformation("Retrieved {DocumentCount} documents for customer {CustomerId}, total amount: {TotalAmount}",
                documents.Count, customerId, response.TotalAmount);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving documents for customer {CustomerId}", customerId);
            throw;
        }
    }

    /// <summary>
    /// Gets document summary statistics for a customer
    /// </summary>
    public async Task<CustomerDocumentStatsDto?> GetCustomerDocumentStatsAsync(int customerId, int companyId)
    {
        try
        {
            _logger.LogInformation("Retrieving document statistics for customer {CustomerId} in company {CompanyId}",
                customerId, companyId);

            var customer = await _context.Customers
                .Where(c => c.Id == customerId && c.CompanyId == companyId)
                .FirstOrDefaultAsync();

            if (customer == null)
            {
                _logger.LogWarning("Customer {CustomerId} not found in company {CompanyId}",
                    customerId, companyId);
                return null;
            }

            // Get sales orders statistics
            var salesOrderStats = await _context.SalesOrders
                .Where(so => so.CustomerId == customerId && so.CompanyId == companyId)
                .GroupBy(so => 1)
                .Select(g => new
                {
                    Count = g.Count(),
                    TotalAmount = g.Sum(so => so.TotalAmount),
                    OutstandingAmount = g.Where(so => so.Status != SalesOrderStatus.Completed && so.Status != SalesOrderStatus.Cancelled)
                                       .Sum(so => so.TotalAmount),
                    FirstDate = g.Min(so => so.OrderDate),
                    LastDate = g.Max(so => so.OrderDate)
                })
                .FirstOrDefaultAsync();

            // Get receipts statistics
            var receiptsStats = await (from receipt in _context.Receipts
                                      join invoice in _context.Invoices 
                                          on receipt.InvoiceId equals invoice.Id
                                      where invoice.CustomerId == customerId 
                                            && receipt.CompanyId == companyId
                                      group receipt by 1 into g
                                      select new
                                      {
                                          Count = g.Count(),
                                          TotalAmount = g.Sum(r => r.Amount)
                                      }).FirstOrDefaultAsync();

            var receiptsCount = receiptsStats?.Count ?? 0;
            var receiptsAmount = receiptsStats?.TotalAmount ?? 0m;

            // Get invoice statistics
            var invoiceStats = await _context.Invoices
                .Where(inv => inv.CustomerId == customerId && inv.CompanyId == companyId)
                .GroupBy(inv => 1)
                .Select(g => new
                {
                    Count = g.Count(),
                    TotalAmount = g.Sum(inv => inv.TotalAmount),
                    TotalPaidAmount = g.Sum(inv => inv.PaidAmount),
                    OutstandingAmount = g.Sum(inv => inv.TotalAmount - inv.PaidAmount)
                })
                .FirstOrDefaultAsync();

            // Get POS sales count (approximate - based on company)
            var posSalesCount = await _context.POSSales
                .Where(ps => ps.CompanyId == companyId)
                .CountAsync();

            var stats = new CustomerDocumentStatsDto
            {
                CustomerId = customerId,
                CustomerName = customer.Name,
                TotalSalesOrders = salesOrderStats?.Count ?? 0,
                TotalInvoices = invoiceStats?.Count ?? 0,
                TotalReceipts = receiptsCount,
                TotalPOSSales = posSalesCount, // Approximate
                TotalSalesAmount = salesOrderStats?.TotalAmount ?? 0,
                TotalInvoiceAmount = invoiceStats?.TotalAmount ?? 0,
                TotalReceiptsAmount = receiptsAmount,
                OutstandingAmount = (invoiceStats?.OutstandingAmount ?? 0) + (salesOrderStats?.OutstandingAmount ?? 0),
                FirstDocumentDate = salesOrderStats?.FirstDate,
                LastDocumentDate = salesOrderStats?.LastDate
            };

            _logger.LogInformation("Retrieved statistics for customer {CustomerId}: {TotalOrders} orders, {TotalInvoices} invoices, {TotalSalesAmount} sales total, {TotalInvoiceAmount} invoice total",
                customerId, stats.TotalSalesOrders, stats.TotalInvoices, stats.TotalSalesAmount, stats.TotalInvoiceAmount);

            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving document statistics for customer {CustomerId}", customerId);
            throw;
        }
    }

    /// <summary>
    /// Gets sales order documents for a customer
    /// </summary>
    private async Task<List<CustomerDocumentDto>> GetSalesOrderDocuments(
        int customerId, int companyId, DateTime? fromDate, DateTime? toDate)
    {
        var query = _context.SalesOrders
            .Where(so => so.CustomerId == customerId && so.CompanyId == companyId);

        if (fromDate.HasValue)
            query = query.Where(so => so.OrderDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(so => so.OrderDate <= toDate.Value);

        var salesOrders = await query
            .OrderByDescending(so => so.OrderDate)
            .Select(so => new
            {
                Id = so.Id,
                DocumentNumber = so.OrderNumber,
                DocumentDate = so.OrderDate,
                TotalAmount = so.TotalAmount,
                Status = so.Status
            })
            .ToListAsync();

        return salesOrders.Select(so => new CustomerDocumentDto
        {
            Id = so.Id,
            DocumentType = "SalesOrder",
            DocumentNumber = so.DocumentNumber,
            DocumentDate = so.DocumentDate,
            TotalAmount = so.TotalAmount,
            Status = so.Status.ToString(),
            Description = $"מכירות #{so.DocumentNumber} - {GetStatusInHebrew(so.Status)}"
        }).ToList();
    }

    /// <summary>
    /// Gets receipt documents for a customer
    /// </summary>
    private async Task<List<CustomerDocumentDto>> GetReceiptDocuments(
        int customerId, int companyId, DateTime? fromDate, DateTime? toDate)
    {
        var query = from receipt in _context.Receipts
                    join invoice in _context.Invoices 
                        on receipt.InvoiceId equals invoice.Id
                    where invoice.CustomerId == customerId 
                          && receipt.CompanyId == companyId
                    select new
                    {
                        Receipt = receipt,
                        Invoice = invoice
                    };

        if (fromDate.HasValue)
            query = query.Where(x => x.Receipt.PaymentDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(x => x.Receipt.PaymentDate <= toDate.Value);

        var receipts = await query
            .OrderByDescending(x => x.Receipt.PaymentDate)
            .Select(x => new
            {
                Id = x.Receipt.Id,
                ReceiptNumber = x.Receipt.ReceiptNumber,
                PaymentDate = x.Receipt.PaymentDate,
                Amount = x.Receipt.Amount,
                PaymentMethod = x.Receipt.PaymentMethod,
                InvoiceNumber = x.Invoice.InvoiceNumber
            })
            .ToListAsync();

        return receipts.Select(r => new CustomerDocumentDto
        {
            Id = r.Id,
            DocumentType = "Receipt",
            DocumentNumber = r.ReceiptNumber,
            DocumentDate = r.PaymentDate,
            TotalAmount = r.Amount,
            Status = "שולם",
            Description = $"קבלה #{r.ReceiptNumber} - {r.PaymentMethod} עבור חשבונית #{r.InvoiceNumber}"
        }).ToList();
    }

    /// <summary>
    /// Gets invoice documents for a customer
    /// </summary>
    private async Task<List<CustomerDocumentDto>> GetInvoiceDocuments(
        int customerId, int companyId, DateTime? fromDate, DateTime? toDate)
    {
        var query = _context.Invoices
            .Where(inv => inv.CustomerId == customerId && inv.CompanyId == companyId);

        if (fromDate.HasValue)
            query = query.Where(inv => inv.InvoiceDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(inv => inv.InvoiceDate <= toDate.Value);

        var invoices = await query
            .OrderByDescending(inv => inv.InvoiceDate)
            .Select(inv => new
            {
                Id = inv.Id,
                InvoiceNumber = inv.InvoiceNumber,
                InvoiceDate = inv.InvoiceDate,
                TotalAmount = inv.TotalAmount,
                PaidAmount = inv.PaidAmount,
                Status = inv.Status
            })
            .ToListAsync();

        return invoices.Select(inv => new CustomerDocumentDto
        {
            Id = inv.Id,
            DocumentType = "Invoice",
            DocumentNumber = inv.InvoiceNumber,
            DocumentDate = inv.InvoiceDate,
            TotalAmount = inv.TotalAmount,
            Status = inv.Status.ToString(),
            Description = $"חשבונית #{inv.InvoiceNumber} - {GetInvoiceStatusInHebrew(inv.Status)} - שולם: ₪{inv.PaidAmount:F2}"
        }).ToList();
    }

    /// <summary>
    /// Gets POS sale documents for a customer
    /// </summary>
    private async Task<List<CustomerDocumentDto>> GetPOSSaleDocuments(
        int customerId, int companyId, DateTime? fromDate, DateTime? toDate)
    {
        // Note: POS Sales don't have direct customer relation in current model
        // This would need to be implemented if customer tracking is added to POS
        var query = _context.POSSales
            .Where(ps => ps.CompanyId == companyId);

        if (fromDate.HasValue)
            query = query.Where(ps => ps.SaleDateTime >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(ps => ps.SaleDateTime <= toDate.Value);

        // For now, return limited results as POS sales aren't directly linked to customers
        return await query
            .Take(50) // Limit to avoid too many results
            .OrderByDescending(ps => ps.SaleDateTime)
            .Select(ps => new CustomerDocumentDto
            {
                Id = ps.Id,
                DocumentType = "POSSale",
                DocumentNumber = ps.TransactionNumber,
                DocumentDate = ps.SaleDateTime,
                TotalAmount = ps.TotalAmount,
                Status = "הושלם",
                Description = $"מכירה בקופה #{ps.TransactionNumber}"
            })
            .ToListAsync();
    }

    /// <summary>
    /// Converts invoice status to Hebrew
    /// </summary>
    private static string GetInvoiceStatusInHebrew(InvoiceStatus status)
    {
        return status switch
        {
            InvoiceStatus.Draft => "טיוטה",
            InvoiceStatus.Sent => "נשלחה",
            InvoiceStatus.Paid => "שולמה",
            InvoiceStatus.Overdue => "פגת תוקף",
            InvoiceStatus.Cancelled => "בוטלה",
            _ => status.ToString()
        };
    }

    /// <summary>
    /// Converts sales order status to Hebrew
    /// </summary>
    private static string GetStatusInHebrew(SalesOrderStatus status)
    {
        return status switch
        {
            SalesOrderStatus.Quote => "הצעת מחיר",
            SalesOrderStatus.Confirmed => "הזמנה",
            SalesOrderStatus.Shipped => "נשלח",
            SalesOrderStatus.Completed => "הושלם",
            SalesOrderStatus.Cancelled => "בוטל",
            _ => status.ToString()
        };
    }
}
