using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text;
using backend.Data;
using backend.Services.Interfaces;
using backend.Models.Sales;
using backend.Models.Core;

namespace backend.Services.Printing;

/// <summary>
/// Print service implementation for generating PDF documents and HTML views
/// Uses HTML templates with Hebrew RTL support for Israeli business documents
/// </summary>
public class PrintService : IPrintService
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<PrintService> _logger;

    public PrintService(
        AccountingDbContext context,
        ILogger<PrintService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<byte[]> GenerateInvoicePdfAsync(int invoiceId, int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating invoice PDF for invoice {InvoiceId}", invoiceId);

            var html = await GetDocumentHtmlAsync("Invoice", invoiceId, companyId, cancellationToken);
            
            // For now, return HTML as bytes (in production, use a PDF library like PuppeteerSharp or iTextSharp)
            return Encoding.UTF8.GetBytes(html);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating invoice PDF for invoice {InvoiceId}", invoiceId);
            throw;
        }
    }

    public async Task<byte[]> GenerateReceiptPdfAsync(int receiptId, int companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating receipt PDF for receipt {ReceiptId}", receiptId);

            var html = await GetDocumentHtmlAsync("Receipt", receiptId, companyId, cancellationToken);
            
            // For now, return HTML as bytes (in production, use a PDF library like PuppeteerSharp or iTextSharp)
            return Encoding.UTF8.GetBytes(html);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating receipt PDF for receipt {ReceiptId}", receiptId);
            throw;
        }
    }

    public async Task<byte[]> GenerateCustomerDocumentsReportPdfAsync(
        int customerId, 
        int companyId, 
        DateTime? fromDate = null, 
        DateTime? toDate = null, 
        string? documentType = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating customer documents report PDF for customer {CustomerId}", customerId);

            var html = await GetCustomerDocumentsReportHtmlAsync(customerId, companyId, fromDate, toDate, documentType, cancellationToken);
            
            // For now, return HTML as bytes (in production, use a PDF library)
            return Encoding.UTF8.GetBytes(html);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating customer documents report PDF for customer {CustomerId}", customerId);
            throw;
        }
    }

    public async Task<string> GetDocumentHtmlAsync(string documentType, int documentId, int companyId, CancellationToken cancellationToken = default)
    {
        return documentType.ToLowerInvariant() switch
        {
            "salesorder" => await GetSalesOrderHtmlAsync(documentId, companyId, cancellationToken),
            "invoice" => await GetInvoiceHtmlAsync(documentId, companyId, cancellationToken),
            "receipt" => await GetReceiptHtmlAsync(documentId, companyId, cancellationToken),
            "possale" => await GetPOSSaleHtmlAsync(documentId, companyId, cancellationToken),
            _ => throw new ArgumentException($"Unsupported document type: {documentType}", nameof(documentType))
        };
    }

    private async Task<string> GetSalesOrderHtmlAsync(int salesOrderId, int companyId, CancellationToken cancellationToken)
    {
        var salesOrder = await _context.SalesOrders
            .Include(so => so.Customer)
            .Include(so => so.Agent)
            .Include(so => so.Lines)
                .ThenInclude(l => l.Item)
            .Where(so => so.Id == salesOrderId && so.CompanyId == companyId && !so.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);

        if (salesOrder == null)
        {
            throw new InvalidOperationException($"Sales order {salesOrderId} not found");
        }

        var company = await GetCompanyAsync(companyId, cancellationToken);

        return GenerateSalesOrderHtml(salesOrder, company);
    }

    private async Task<string> GetReceiptHtmlAsync(int receiptId, int companyId, CancellationToken cancellationToken)
    {
        var receipt = await _context.Receipts
            .Include(r => r.Invoice)
                .ThenInclude(i => i.Customer)
            .Where(r => r.Id == receiptId && r.CompanyId == companyId && !r.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);

        if (receipt == null)
        {
            throw new InvalidOperationException($"Receipt {receiptId} not found");
        }

        var company = await GetCompanyAsync(companyId, cancellationToken);

        return GenerateReceiptHtml(receipt, company);
    }

    private async Task<string> GetPOSSaleHtmlAsync(int posSaleId, int companyId, CancellationToken cancellationToken)
    {
        // For now, return a simple template - POS sales implementation can be extended later
        var company = await GetCompanyAsync(companyId, cancellationToken);
        
        return $@"
<!DOCTYPE html>
<html dir=""rtl"" lang=""he"">
<head>
    <meta charset=""UTF-8"">
    <title>מכירת קופה - {posSaleId}</title>
    <style>{GetCommonStyles()}</style>
</head>
<body>
    <div class=""document"">
        <div class=""header"">
            <h1>מכירת קופה</h1>
            <div class=""company-info"">
                <h2>{company.Name}</h2>
                <p>{company.Address}</p>
                <p>ע.מ: {company.IsraelTaxId}</p>
            </div>
        </div>
        <div class=""content"">
            <p>מכירת קופה מספר: {posSaleId}</p>
            <p>תאריך: {DateTime.Now:dd/MM/yyyy}</p>
            <p><em>נתונים מפורטים יתווספו בהמשך הפיתוח</em></p>
        </div>
    </div>
</body>
</html>";
    }

    private async Task<string> GetCustomerDocumentsReportHtmlAsync(
        int customerId, 
        int companyId, 
        DateTime? fromDate, 
        DateTime? toDate, 
        string? documentType,
        CancellationToken cancellationToken)
    {
        var customer = await _context.Customers
            .Where(c => c.Id == customerId && c.CompanyId == companyId && !c.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);

        if (customer == null)
        {
            throw new InvalidOperationException($"Customer {customerId} not found");
        }

        var company = await GetCompanyAsync(companyId, cancellationToken);

        // Get sales orders
        var salesOrdersQuery = _context.SalesOrders
            .Where(so => so.CustomerId == customerId && so.CompanyId == companyId && !so.IsDeleted);

        if (fromDate.HasValue)
            salesOrdersQuery = salesOrdersQuery.Where(so => so.OrderDate >= fromDate.Value);

        if (toDate.HasValue)
            salesOrdersQuery = salesOrdersQuery.Where(so => so.OrderDate <= toDate.Value);

        var salesOrders = await salesOrdersQuery
            .OrderByDescending(so => so.OrderDate)
            .ToListAsync(cancellationToken);

        // Get receipts
        var receiptsQuery = _context.Receipts
            .Include(r => r.Invoice)
            .Where(r => r.Invoice.CustomerId == customerId && r.CompanyId == companyId && !r.IsDeleted);

        if (fromDate.HasValue)
            receiptsQuery = receiptsQuery.Where(r => r.PaymentDate >= fromDate.Value);

        if (toDate.HasValue)
            receiptsQuery = receiptsQuery.Where(r => r.PaymentDate <= toDate.Value);

        var receipts = await receiptsQuery
            .OrderByDescending(r => r.PaymentDate)
            .ToListAsync(cancellationToken);

        return GenerateCustomerDocumentsReportHtml(customer, company, salesOrders, receipts, fromDate, toDate);
    }

    private async Task<Company> GetCompanyAsync(int companyId, CancellationToken cancellationToken)
    {
        var company = await _context.Companies
            .Where(c => c.Id == companyId && !c.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);

        return company ?? throw new InvalidOperationException($"Company {companyId} not found");
    }

    private async Task<string> GetInvoiceHtmlAsync(int invoiceId, int companyId, CancellationToken cancellationToken)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Lines)
                .ThenInclude(l => l.Item)
            .Include(i => i.SalesOrder)
            .Where(i => i.Id == invoiceId && i.CompanyId == companyId && !i.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);

        if (invoice == null)
        {
            throw new InvalidOperationException($"Invoice {invoiceId} not found");
        }

        var company = await GetCompanyAsync(companyId, cancellationToken);

        return GenerateInvoiceHtml(invoice, company);
    }

    private string GenerateSalesOrderHtml(SalesOrder salesOrder, Company company)
    {
        var linesHtml = string.Join("", salesOrder.Lines.Select(line => $@"
            <tr>
                <td>{line.Item?.Name ?? "פריט לא ידוע"}</td>
                <td>{line.Quantity:N0}</td>
                <td>{line.UnitPrice:C}</td>
                <td>{line.LineTotal:C}</td>
            </tr>"));

        return $@"
<!DOCTYPE html>
<html dir=""rtl"" lang=""he"">
<head>
    <meta charset=""UTF-8"">
    <title>הזמנה - {salesOrder.OrderNumber}</title>
    <style>{GetCommonStyles()}</style>
</head>
<body>
    <div class=""document"">
        <div class=""header"">
            <div class=""company-info"">
                <h1>{company.Name}</h1>
                <p>{company.Address}</p>
                <p>ע.מ: {company.IsraelTaxId} | טלפון: {company.Phone ?? "לא צוין"}</p>
            </div>
            <div class=""document-title"">
                <h2>הזמנה</h2>
                <p>מספר: {salesOrder.OrderNumber}</p>
            </div>
        </div>
        
        <div class=""customer-info"">
            <h3>פרטי לקוח:</h3>
            <p><strong>{salesOrder.Customer.Name}</strong></p>
            <p>{salesOrder.Customer.Address}</p>
            <p>ע.מ: {salesOrder.Customer.TaxId}</p>
            <p>טלפון: {salesOrder.Customer.Contact}</p>
        </div>
        
        <div class=""order-details"">
            <p><strong>תאריך הזמנה:</strong> {salesOrder.OrderDate:dd/MM/yyyy}</p>
            {(salesOrder.RequiredDate.HasValue ? $"<p><strong>תאריך דרוש:</strong> {salesOrder.RequiredDate.Value:dd/MM/yyyy}</p>" : "")}
            {(salesOrder.PromisedDate.HasValue ? $"<p><strong>תאריך מובטח:</strong> {salesOrder.PromisedDate.Value:dd/MM/yyyy}</p>" : "")}
            <p><strong>סטטוס:</strong> {GetStatusText(salesOrder.Status)}</p>
            {(!string.IsNullOrEmpty(salesOrder.Notes) ? $"<p><strong>הערות:</strong> {salesOrder.Notes}</p>" : "")}
        </div>
        
        <table class=""items-table"">
            <thead>
                <tr>
                    <th>פריט</th>
                    <th>כמות</th>
                    <th>מחיר יחידה</th>
                    <th>סה""כ</th>
                </tr>
            </thead>
            <tbody>
                {linesHtml}
            </tbody>
        </table>
        
        <div class=""totals"">
            <p>סה""כ לפני מע""מ: {salesOrder.SubtotalAmount:C}</p>
            <p>מע""מ ({GetTaxRate(salesOrder)}%): {salesOrder.TaxAmount:C}</p>
            <p class=""total""><strong>סה""כ לתשלום: {salesOrder.TotalAmount:C}</strong></p>
        </div>
        
        <div class=""footer"">
            <p>תאריך הדפסה: {DateTime.Now:dd/MM/yyyy HH:mm}</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GenerateReceiptHtml(Receipt receipt, Company company)
    {
        return $@"
<!DOCTYPE html>
<html dir=""rtl"" lang=""he"">
<head>
    <meta charset=""UTF-8"">
    <title>קבלה - {receipt.ReceiptNumber}</title>
    <style>{GetCommonStyles()}</style>
</head>
<body>
    <div class=""document"">
        <div class=""header"">
            <div class=""company-info"">
                <h1>{company.Name}</h1>
                <p>{company.Address}</p>
                <p>ע.מ: {company.IsraelTaxId} | טלפון: {company.Phone ?? "לא צוין"}</p>
            </div>
            <div class=""document-title"">
                <h2>קבלה</h2>
                <p>מספר: {receipt.ReceiptNumber}</p>
            </div>
        </div>
        
        <div class=""customer-info"">
            <h3>פרטי לקוח:</h3>
            <p><strong>{receipt.Invoice.Customer.Name}</strong></p>
            <p>{receipt.Invoice.Customer.Address}</p>
            <p>ע.מ: {receipt.Invoice.Customer.TaxId}</p>
        </div>
        
        <div class=""receipt-details"">
            <p><strong>תאריך תשלום:</strong> {receipt.PaymentDate:dd/MM/yyyy}</p>
            <p><strong>אמצעי תשלום:</strong> {GetPaymentMethodText(receipt.PaymentMethod)}</p>
            <p><strong>עבור חשבונית:</strong> {receipt.Invoice.InvoiceNumber}</p>
            {(!string.IsNullOrEmpty(receipt.Notes) ? $"<p><strong>הערות:</strong> {receipt.Notes}</p>" : "")}
        </div>
        
        <div class=""payment-amount"">
            <h3>סכום התשלום: {receipt.Amount:C}</h3>
        </div>
        
        <div class=""footer"">
            <p>תאריך הדפסה: {DateTime.Now:dd/MM/yyyy HH:mm}</p>
            <p>אנו מאשרים קבלת התשלום הנ""ל</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GenerateCustomerDocumentsReportHtml(
        Customer customer, 
        Company company, 
        List<SalesOrder> salesOrders, 
        List<Receipt> receipts,
        DateTime? fromDate,
        DateTime? toDate)
    {
        var salesOrdersHtml = string.Join("", salesOrders.Select(so => $@"
            <tr>
                <td>הזמנה</td>
                <td>{so.OrderNumber}</td>
                <td>{so.OrderDate:dd/MM/yyyy}</td>
                <td>{so.TotalAmount:C}</td>
                <td>{GetStatusText(so.Status)}</td>
            </tr>"));

        var receiptsHtml = string.Join("", receipts.Select(r => $@"
            <tr>
                <td>קבלה</td>
                <td>{r.ReceiptNumber}</td>
                <td>{r.PaymentDate:dd/MM/yyyy}</td>
                <td>{r.Amount:C}</td>
                <td>{GetPaymentMethodText(r.PaymentMethod)}</td>
            </tr>"));

        var totalSales = salesOrders.Sum(so => so.TotalAmount);
        var totalPayments = receipts.Sum(r => r.Amount);

        var dateRange = "";
        if (fromDate.HasValue && toDate.HasValue)
            dateRange = $"מתאריך {fromDate.Value:dd/MM/yyyy} עד {toDate.Value:dd/MM/yyyy}";
        else if (fromDate.HasValue)
            dateRange = $"מתאריך {fromDate.Value:dd/MM/yyyy}";
        else if (toDate.HasValue)
            dateRange = $"עד תאריך {toDate.Value:dd/MM/yyyy}";

        return $@"
<!DOCTYPE html>
<html dir=""rtl"" lang=""he"">
<head>
    <meta charset=""UTF-8"">
    <title>דוח מסמכי לקוח - {customer.Name}</title>
    <style>{GetCommonStyles()}</style>
</head>
<body>
    <div class=""document"">
        <div class=""header"">
            <div class=""company-info"">
                <h1>{company.Name}</h1>
                <p>{company.Address}</p>
                <p>ע.מ: {company.IsraelTaxId}</p>
            </div>
            <div class=""document-title"">
                <h2>דוח מסמכי לקוח</h2>
                {(!string.IsNullOrEmpty(dateRange) ? $"<p>{dateRange}</p>" : "")}
            </div>
        </div>
        
        <div class=""customer-info"">
            <h3>פרטי לקוח:</h3>
            <p><strong>{customer.Name}</strong></p>
            <p>{customer.Address}</p>
            <p>ע.מ: {customer.TaxId}</p>
            <p>טלפון: {customer.Contact}</p>
        </div>
        
        <div class=""summary"">
            <h3>סיכום:</h3>
            <p>מספר מכירות: {salesOrders.Count}</p>
            <p>מספר קבלות: {receipts.Count}</p>
            <p>סה""כ מכירות: {totalSales:C}</p>
            <p>סה""כ תשלומים: {totalPayments:C}</p>
            <p>יתרה: {(totalSales - totalPayments):C}</p>
        </div>
        
        <table class=""items-table"">
            <thead>
                <tr>
                    <th>סוג מסמך</th>
                    <th>מספר מסמך</th>
                    <th>תאריך</th>
                    <th>סכום</th>
                    <th>סטטוס/אמצעי תשלום</th>
                </tr>
            </thead>
            <tbody>
                {salesOrdersHtml}
                {receiptsHtml}
            </tbody>
        </table>
        
        <div class=""footer"">
            <p>תאריך הדפסה: {DateTime.Now:dd/MM/yyyy HH:mm}</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GetCommonStyles()
    {
        return @"
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                direction: rtl;
                text-align: right;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            
            .document {
                background: white;
                max-width: 800px;
                margin: 0 auto;
                padding: 30px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                border-radius: 8px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                border-bottom: 2px solid #1976d2;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            
            .company-info h1 {
                color: #1976d2;
                margin: 0 0 10px 0;
                font-size: 24px;
            }
            
            .company-info p {
                margin: 5px 0;
                color: #666;
            }
            
            .document-title {
                text-align: left;
            }
            
            .document-title h2 {
                color: #1976d2;
                margin: 0 0 10px 0;
                font-size: 20px;
            }
            
            .customer-info, .order-details, .receipt-details {
                margin-bottom: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
            }
            
            .customer-info h3, .summary h3 {
                color: #1976d2;
                margin-top: 0;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            
            .items-table th,
            .items-table td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: right;
            }
            
            .items-table th {
                background-color: #1976d2;
                color: white;
                font-weight: bold;
            }
            
            .items-table tbody tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .totals {
                text-align: left;
                margin: 20px 0;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
            }
            
            .totals .total {
                font-size: 18px;
                color: #1976d2;
                border-top: 2px solid #1976d2;
                padding-top: 10px;
                margin-top: 10px;
            }
            
            .payment-amount {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background-color: #e8f5e8;
                border: 2px solid #4caf50;
                border-radius: 5px;
            }
            
            .payment-amount h3 {
                color: #2e7d32;
                margin: 0;
                font-size: 24px;
            }
            
            .summary {
                margin: 20px 0;
                padding: 15px;
                background-color: #fff3e0;
                border-radius: 5px;
                border-left: 4px solid #ff9800;
            }
            
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 12px;
            }
            
            @media print {
                body {
                    background-color: white;
                    padding: 0;
                }
                
                .document {
                    box-shadow: none;
                    border-radius: 0;
                    padding: 20px;
                }
            }
        ";
    }

    private string GetStatusText(SalesOrderStatus status)
    {
        return status switch
        {
            SalesOrderStatus.Draft => "טיוטה",
            SalesOrderStatus.Confirmed => "הזמנה מאושרת",
            SalesOrderStatus.PartiallyShipped => "נשלח חלקית", 
            SalesOrderStatus.Shipped => "נשלח",
            SalesOrderStatus.Completed => "הושלם",
            SalesOrderStatus.Cancelled => "בוטל",
            _ => status.ToString()
        };
    }

    private string GetPaymentMethodText(string paymentMethod)
    {
        return paymentMethod.ToLowerInvariant() switch
        {
            "cash" => "מזומן",
            "credit" => "אשראי",
            "check" => "המחאה",
            "transfer" => "העברה בנקאית",
            _ => paymentMethod
        };
    }

    private decimal GetTaxRate(SalesOrder salesOrder)
    {
        // Return average tax rate from lines, default to 17% (Israeli VAT)
        return salesOrder.Lines?.Any() == true 
            ? salesOrder.Lines.Average(l => l.TaxRate) 
            : 17m;
    }

    private string GenerateInvoiceHtml(Invoice invoice, Company company)
    {
        var linesHtml = string.Join("", invoice.Lines.Select(line => $@"
            <tr>
                <td>{line.Item?.Name ?? "פריט לא ידוע"}</td>
                <td>{line.Quantity:N0}</td>
                <td>{line.UnitPrice:C}</td>
                <td>{line.LineTotal:C}</td>
            </tr>"));

        return $@"
<!DOCTYPE html>
<html dir=""rtl"" lang=""he"">
<head>
    <meta charset=""UTF-8"">
    <title>חשבונית - {invoice.InvoiceNumber}</title>
    <style>{GetCommonStyles()}</style>
</head>
<body>
    <div class=""document"">
        <div class=""header"">
            <div class=""company-info"">
                <h1>{company.Name}</h1>
                <p>{company.Address}</p>
                <p>ע.מ: {company.IsraelTaxId} | טלפון: {company.Phone ?? "לא צוין"}</p>
            </div>
            <div class=""document-title"">
                <h2>חשבונית</h2>
                <p>מספר: {invoice.InvoiceNumber}</p>
            </div>
        </div>
        
        <div class=""customer-info"">
            <h3>פרטי לקוח:</h3>
            <p><strong>{invoice.Customer.Name}</strong></p>
            <p>{invoice.Customer.Address}</p>
            <p>ע.מ: {invoice.Customer.TaxId}</p>
        </div>
        
        <div class=""invoice-details"">
            <p><strong>תאריך חשבונית:</strong> {invoice.InvoiceDate:dd/MM/yyyy}</p>
            <p><strong>תאריך לתשלום:</strong> {invoice.DueDate:dd/MM/yyyy}</p>
            {(invoice.SalesOrder != null ? $"<p><strong>הזמנה:</strong> {invoice.SalesOrder.OrderNumber}</p>" : "")}
        </div>
        
        <table class=""items-table"">
            <thead>
                <tr>
                    <th>פריט</th>
                    <th>כמות</th>
                    <th>מחיר יחידה</th>
                    <th>סה""כ</th>
                </tr>
            </thead>
            <tbody>
                {linesHtml}
            </tbody>
        </table>
        
        <div class=""totals"">
            <div class=""totals-row"">
                <span>סכום חלקי:</span>
                <span>{invoice.SubtotalAmount:C}</span>
            </div>
            <div class=""totals-row"">
                <span>מע""מ ({invoice.Lines.FirstOrDefault()?.TaxRate ?? 17}%):</span>
                <span>{invoice.TaxAmount:C}</span>
            </div>
            <div class=""totals-row total"">
                <span>סה""כ לתשלום:</span>
                <span>{invoice.TotalAmount:C}</span>
            </div>
        </div>
        
        <div class=""footer"">
            <p>תאריך הדפסה: {DateTime.Now:dd/MM/yyyy HH:mm}</p>
        </div>
    </div>
</body>
</html>";
    }
}
