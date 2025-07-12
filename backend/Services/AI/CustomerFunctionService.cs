using backend.Data;
using backend.Models.Sales;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace backend.Services.AI;

/// <summary>
/// Service providing customer-related functions for AI Assistant function calling
/// Implements functions that can be called by Azure OpenAI to retrieve customer data
/// </summary>
public class CustomerFunctionService : ICustomerFunctionService
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<CustomerFunctionService> _logger;

    public CustomerFunctionService(
        AccountingDbContext context,
        ILogger<CustomerFunctionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get list of all available customer functions for AI
    /// </summary>
    /// <returns>List of function definitions</returns>
    public List<FunctionDefinition> GetCustomerFunctions()
    {
        return new List<FunctionDefinition>
        {
            new()
            {
                Name = "getCustomersList",
                Description = "רשימת לקוחות - מחזיר רשימה של כל הלקוחות הפעילים של החברה עם פרטי יסוד",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        CompanyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה (CompanyId) לקבלת לקוחות"
                        },
                        IsActiveOnly = new
                        {
                            Type = "boolean",
                            Description = "האם להחזיר רק לקוחות פעילים (true) או כולם (false). ברירת מחדל: true"
                        }
                    },
                    Required = new[] { "CompanyId" }
                }
            },
            new()
            {
                Name = "getCustomerDetails",
                Description = "פרטי לקוח - מחזיר מידע מפורט על לקוח ספציפי לפי מזהה",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        CustomerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        CompanyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        }
                    },
                    Required = new[] { "CustomerId", "CompanyId" }
                }
            },
            new()
            {
                Name = "searchCustomers",
                Description = "חיפוש לקוחות - מחפש לקוחות לפי שם, מספר זהות, או פרטי קשר",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        SearchTerm = new
                        {
                            Type = "string",
                            Description = "מונח החיפוש - שם, מספר זהות, אימייל או טלפון"
                        },
                        CompanyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        }
                    },
                    Required = new[] { "SearchTerm", "CompanyId" }
                }
            },
            new()
            {
                Name = "getCustomerFinancialSummary",
                Description = "סיכום פיננסי ללקוח - מחזיר סיכום של חובות, זכויות והיסטוריית תשלומים",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        CustomerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        CompanyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        }
                    },
                    Required = new[] { "CustomerId", "CompanyId" }
                }
            },
            new()
            {
                Name = "getCustomerTransactionHistory",
                Description = "היסטוריית עסקאות לקוח - מחזיר את כל העסקאות של הלקוח (הזמנות, חשבוניות, קבלות, מכירות קופה)",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        CustomerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        CompanyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        FromDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך התחלה (אופציונלי) - פורמט: YYYY-MM-DD"
                        },
                        ToDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך סיום (אופציונלי) - פורמט: YYYY-MM-DD"
                        },
                        Limit = new
                        {
                            Type = "integer",
                            Description = "מגבלת מספר רשומות (ברירת מחדל: 50, מקסימום: 200)"
                        }
                    },
                    Required = new[] { "CustomerId", "CompanyId" }
                }
            },
            new()
            {
                Name = "getCustomerAging",
                Description = "דוח הזדקנות לקוח - מחזיר פירוט חובות לפי תקופות (שוטף, 30, 60, 90+ ימים)",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        CustomerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        CompanyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        AsOfDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך הדוח (אופציונלי, ברירת מחדל: היום) - פורמט: YYYY-MM-DD"
                        }
                    },
                    Required = new[] { "CustomerId", "CompanyId" }
                }
            },
            new()
            {
                Name = "getCustomerStatistics",
                Description = "סטטיסטיקות לקוח - מחזיר נתונים עסקיים כמו סך הזמנות, ממוצע הזמנה, תדירות קנייה",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        CustomerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        CompanyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        PeriodMonths = new
                        {
                            Type = "integer",
                            Description = "תקופה בחודשים לחישוב הסטטיסטיקה (ברירת מחדל: 12)"
                        }
                    },
                    Required = new[] { "CustomerId", "CompanyId" }
                }
            },
            new()
            {
                Name = "getCustomersTopByRevenue",
                Description = "לקוחות מובילים לפי הכנסות - מחזיר רשימת הלקוחות עם ההכנסות הגבוהות ביותר",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        CompanyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        TopCount = new
                        {
                            Type = "integer",
                            Description = "מספר לקוחות מובילים להחזיר (ברירת מחדל: 10, מקסימום: 50)"
                        },
                        PeriodMonths = new
                        {
                            Type = "integer",
                            Description = "תקופה בחודשים לחישוב ההכנסות (ברירת מחדל: 12)"
                        }
                    },
                    Required = new[] { "CompanyId" }
                }
            },
            new()
            {
                Name = "getCustomersWithOverdueInvoices",
                Description = "לקוחות עם חשבוניות באיחור - מחזיר רשימת לקוחות שיש להם חשבוניות שטרם שולמו אחרי המועד",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        CompanyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        MinDaysOverdue = new
                        {
                            Type = "integer",
                            Description = "מספר ימים מינימלי של איחור (ברירת מחדל: 1)"
                        },
                        MinAmount = new
                        {
                            Type = "number",
                            Description = "סכום מינימלי של חוב באיחור (אופציונלי)"
                        }
                    },
                    Required = new[] { "CompanyId" }
                }
            }
        };
    }

    /// <summary>
    /// Execute a customer-related function
    /// </summary>
    /// <param name="functionCall">Function call details from OpenAI</param>
    /// <param name="companyId">Company ID for security filtering</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Function execution result</returns>
    public async Task<FunctionResult> ExecuteCustomerFunctionAsync(
        FunctionCall functionCall, 
        int companyId, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            return functionCall.Name switch
            {
                "getCustomersList" => await GetCustomersListAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomerDetails" => await GetCustomerDetailsAsync(functionCall.Arguments, companyId, cancellationToken),
                "searchCustomers" => await SearchCustomersAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomerFinancialSummary" => await GetCustomerFinancialSummaryAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomerTransactionHistory" => await GetCustomerTransactionHistoryAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomerAging" => await GetCustomerAgingAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomerStatistics" => await GetCustomerStatisticsAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomersTopByRevenue" => await GetCustomersTopByRevenueAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomersWithOverdueInvoices" => await GetCustomersWithOverdueInvoicesAsync(functionCall.Arguments, companyId, cancellationToken),
                _ => new FunctionResult
                {
                    FunctionName = functionCall.Name,
                    CallId = functionCall.Id,
                    IsSuccess = false,
                    ErrorMessage = $"Unknown function: {functionCall.Name}"
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing customer function {FunctionName}", functionCall.Name);
            return new FunctionResult
            {
                FunctionName = functionCall.Name,
                CallId = functionCall.Id,
                IsSuccess = false,
                ErrorMessage = "שגיאה בביצוע הפונקציה"
            };
        }
    }

    private async Task<FunctionResult> GetCustomersListAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var isActiveOnly = argumentsDocument.RootElement.TryGetProperty("IsActiveOnly", out var activeElement) ? 
            activeElement.GetBoolean() : true;

        var query = _context.Customers.Where(c => c.CompanyId == companyId);
        
        if (isActiveOnly)
        {
            query = query.Where(c => c.IsActive);
        }

        var customers = await query
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.NameHebrew,
                c.Contact,
                c.Phone,
                c.Email,
                c.TaxId,
                c.IsActive,
                c.CreditLimit,
                c.PaymentTermsDays
            })
            .ToListAsync(cancellationToken);

        var result = JsonSerializer.Serialize(customers, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getCustomersList",
            IsSuccess = true,
            Result = $"נמצאו {customers.Count} לקוחות:\n{result}"
        };
    }

    private async Task<FunctionResult> GetCustomerDetailsAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var customerId = argumentsDocument.RootElement.GetProperty("CustomerId").GetInt32();

        var customer = await _context.Customers
            .Where(c => c.Id == customerId && c.CompanyId == companyId)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.NameHebrew,
                c.Address,
                c.City,
                c.PostalCode,
                c.Country,
                c.Phone,
                c.Mobile,
                c.Email,
                c.Contact,
                c.Website,
                c.TaxId,
                c.VatNumber,
                c.CreditLimit,
                c.PaymentTermsDays,
                c.DiscountPercent,
                c.IsActive,
                c.Notes,
                c.CreatedAt,
                c.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (customer == null)
        {
            return new FunctionResult
            {
                FunctionName = "getCustomerDetails",
                IsSuccess = false,
                ErrorMessage = "לקוח לא נמצא"
            };
        }

        var result = JsonSerializer.Serialize(customer, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getCustomerDetails",
            IsSuccess = true,
            Result = $"פרטי הלקוח {customer.Name}:\n{result}"
        };
    }

    private async Task<FunctionResult> SearchCustomersAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var searchTerm = argumentsDocument.RootElement.GetProperty("SearchTerm").GetString()?.Trim();

        if (string.IsNullOrEmpty(searchTerm))
        {
            return new FunctionResult
            {
                FunctionName = "searchCustomers",
                IsSuccess = false,
                ErrorMessage = "מונח חיפוש ריק"
            };
        }

        var customers = await _context.Customers
            .Where(c => c.CompanyId == companyId && (
                c.Name.Contains(searchTerm) ||
                (c.NameHebrew != null && c.NameHebrew.Contains(searchTerm)) ||
                (c.TaxId != null && c.TaxId.Contains(searchTerm)) ||
                (c.Email != null && c.Email.Contains(searchTerm)) ||
                (c.Phone != null && c.Phone.Contains(searchTerm)) ||
                (c.Contact != null && c.Contact.Contains(searchTerm))
            ))
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.NameHebrew,
                c.Contact,
                c.Phone,
                c.Email,
                c.TaxId,
                c.IsActive
            })
            .ToListAsync(cancellationToken);

        var result = JsonSerializer.Serialize(customers, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "searchCustomers",
            IsSuccess = true,
            Result = $"נמצאו {customers.Count} לקוחות המתאימים לחיפוש '{searchTerm}':\n{result}"
        };
    }

    private async Task<FunctionResult> GetCustomerFinancialSummaryAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var customerId = argumentsDocument.RootElement.GetProperty("CustomerId").GetInt32();

        // Get customer details
        var customer = await _context.Customers
            .Where(c => c.Id == customerId && c.CompanyId == companyId)
            .FirstOrDefaultAsync(cancellationToken);

        if (customer == null)
        {
            return new FunctionResult
            {
                FunctionName = "getCustomerFinancialSummary",
                IsSuccess = false,
                ErrorMessage = "לקוח לא נמצא"
            };
        }

        // Get sales orders summary
        var salesOrdersSummary = await _context.SalesOrders
            .Where(so => so.CustomerId == customerId && so.CompanyId == companyId)
            .GroupBy(so => so.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count(), Total = g.Sum(so => so.TotalAmount) })
            .ToListAsync(cancellationToken);

        // Get invoices summary
        var invoicesSummary = await _context.Invoices
            .Where(i => i.CustomerId == customerId && i.CompanyId == companyId)
            .GroupBy(i => i.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count(), Total = g.Sum(i => i.TotalAmount) })
            .ToListAsync(cancellationToken);

        // Calculate outstanding balance (unpaid invoices)
        var outstandingBalance = await _context.Invoices
            .Where(i => i.CustomerId == customerId && i.CompanyId == companyId && 
                       (i.Status == Models.Sales.InvoiceStatus.Sent || i.Status == Models.Sales.InvoiceStatus.Overdue))
            .SumAsync(i => i.TotalAmount, cancellationToken);

        var summary = new
        {
            Customer = new { customer.Id, customer.Name, customer.CreditLimit, customer.PaymentTermsDays },
            SalesOrders = salesOrdersSummary,
            Invoices = invoicesSummary,
            OutstandingBalance = outstandingBalance,
            CreditAvailable = customer.CreditLimit - outstandingBalance
        };

        var result = JsonSerializer.Serialize(summary, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getCustomerFinancialSummary",
            IsSuccess = true,
            Result = $"סיכום פיננסי ללקוח {customer.Name}:\n{result}"
        };
    }

    private async Task<FunctionResult> GetCustomerTransactionHistoryAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var customerId = argumentsDocument.RootElement.GetProperty("CustomerId").GetInt32();
        
        // Parse optional parameters
        DateTime? fromDate = null;
        DateTime? toDate = null;
        int limit = 50;

        if (argumentsDocument.RootElement.TryGetProperty("FromDate", out var fromElement))
        {
            if (DateTime.TryParse(fromElement.GetString(), out var parsedFromDate))
                fromDate = parsedFromDate;
        }

        if (argumentsDocument.RootElement.TryGetProperty("ToDate", out var toElement))
        {
            if (DateTime.TryParse(toElement.GetString(), out var parsedToDate))
                toDate = parsedToDate;
        }

        if (argumentsDocument.RootElement.TryGetProperty("Limit", out var limitElement))
        {
            limit = Math.Min(limitElement.GetInt32(), 200); // Max 200 records
        }

        // Verify customer exists and belongs to company
        var customer = await _context.Customers
            .Where(c => c.Id == customerId && c.CompanyId == companyId)
            .FirstOrDefaultAsync(cancellationToken);

        if (customer == null)
        {
            return new FunctionResult
            {
                FunctionName = "getCustomerTransactionHistory",
                IsSuccess = false,
                ErrorMessage = "לקוח לא נמצא"
            };
        }

        var transactions = new List<object>();

        // Get Sales Orders
        var salesOrdersQuery = _context.SalesOrders
            .Where(so => so.CustomerId == customerId && so.CompanyId == companyId);
        
        if (fromDate.HasValue)
            salesOrdersQuery = salesOrdersQuery.Where(so => so.OrderDate >= fromDate.Value);
        if (toDate.HasValue)
            salesOrdersQuery = salesOrdersQuery.Where(so => so.OrderDate <= toDate.Value);

        var salesOrders = await salesOrdersQuery
            .OrderByDescending(so => so.OrderDate)
            .Take(limit / 4) // Reserve space for other transaction types
            .Select(so => new
            {
                Type = "SalesOrder",
                Id = so.Id,
                Number = so.OrderNumber,
                Date = so.OrderDate,
                Status = so.Status.ToString(),
                Amount = so.TotalAmount,
                Currency = so.Currency
            })
            .ToListAsync(cancellationToken);

        transactions.AddRange(salesOrders);

        // Get Invoices
        var invoicesQuery = _context.Invoices
            .Where(i => i.CustomerId == customerId && i.CompanyId == companyId);
        
        if (fromDate.HasValue)
            invoicesQuery = invoicesQuery.Where(i => i.InvoiceDate >= fromDate.Value);
        if (toDate.HasValue)
            invoicesQuery = invoicesQuery.Where(i => i.InvoiceDate <= toDate.Value);

        var invoices = await invoicesQuery
            .OrderByDescending(i => i.InvoiceDate)
            .Take(limit / 4)
            .Select(i => new
            {
                Type = "Invoice",
                Id = i.Id,
                Number = i.InvoiceNumber,
                Date = i.InvoiceDate,
                Status = i.Status.ToString(),
                Amount = i.TotalAmount,
                PaidAmount = i.PaidAmount,
                Currency = i.Currency
            })
            .ToListAsync(cancellationToken);

        transactions.AddRange(invoices);

        // Get Receipts (via Invoices)
        var receiptsQuery = _context.Receipts
            .Where(r => r.Invoice.CustomerId == customerId && r.CompanyId == companyId);
        
        if (fromDate.HasValue)
            receiptsQuery = receiptsQuery.Where(r => r.PaymentDate >= fromDate.Value);
        if (toDate.HasValue)
            receiptsQuery = receiptsQuery.Where(r => r.PaymentDate <= toDate.Value);

        var receipts = await receiptsQuery
            .OrderByDescending(r => r.PaymentDate)
            .Take(limit / 4)
            .Select(r => new
            {
                Type = "Receipt",
                Id = r.Id,
                Number = r.ReceiptNumber,
                Date = r.PaymentDate,
                Amount = r.Amount,
                PaymentMethod = r.PaymentMethod,
                Currency = r.Currency,
                InvoiceNumber = r.Invoice.InvoiceNumber
            })
            .ToListAsync(cancellationToken);

        transactions.AddRange(receipts);

        // Get POS Sales
        var posSalesQuery = _context.POSSales
            .Where(ps => ps.CustomerId == customerId && ps.CompanyId == companyId);
        
        if (fromDate.HasValue)
            posSalesQuery = posSalesQuery.Where(ps => ps.SaleDateTime >= fromDate.Value);
        if (toDate.HasValue)
            posSalesQuery = posSalesQuery.Where(ps => ps.SaleDateTime <= toDate.Value);

        var posSales = await posSalesQuery
            .OrderByDescending(ps => ps.SaleDateTime)
            .Take(limit / 4)
            .Select(ps => new
            {
                Type = "POSSale",
                Id = ps.Id,
                Number = ps.TransactionNumber,
                Date = ps.SaleDateTime,
                Amount = ps.TotalAmount,
                PaymentMethod = ps.PaymentMethod,
                POSTerminal = ps.POSTerminalId,
                IsVoided = ps.IsVoided
            })
            .ToListAsync(cancellationToken);

        transactions.AddRange(posSales);

        // Sort all transactions by date descending and take the requested limit
        var sortedTransactions = transactions
            .OrderByDescending(t => (DateTime)t.GetType().GetProperty("Date")!.GetValue(t)!)
            .Take(limit)
            .ToList();

        var result = JsonSerializer.Serialize(new
        {
            Customer = new { customer.Id, customer.Name },
            FromDate = fromDate?.ToString("yyyy-MM-dd"),
            ToDate = toDate?.ToString("yyyy-MM-dd"),
            TotalTransactions = sortedTransactions.Count,
            Transactions = sortedTransactions
        }, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getCustomerTransactionHistory",
            IsSuccess = true,
            Result = $"היסטוריית עסקאות ללקוח {customer.Name}:\n{result}"
        };
    }

    private async Task<FunctionResult> GetCustomerAgingAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var customerId = argumentsDocument.RootElement.GetProperty("CustomerId").GetInt32();
        
        // Parse optional date parameter
        var asOfDate = DateTime.Today;
        if (argumentsDocument.RootElement.TryGetProperty("AsOfDate", out var dateElement))
        {
            if (DateTime.TryParse(dateElement.GetString(), out var parsedDate))
                asOfDate = parsedDate;
        }

        // Verify customer exists
        var customer = await _context.Customers
            .Where(c => c.Id == customerId && c.CompanyId == companyId)
            .FirstOrDefaultAsync(cancellationToken);

        if (customer == null)
        {
            return new FunctionResult
            {
                FunctionName = "getCustomerAging",
                IsSuccess = false,
                ErrorMessage = "לקוח לא נמצא"
            };
        }

        // Get unpaid invoices
        var unpaidInvoices = await _context.Invoices
            .Where(i => i.CustomerId == customerId && i.CompanyId == companyId && 
                       (i.Status == Models.Sales.InvoiceStatus.Sent || i.Status == Models.Sales.InvoiceStatus.Overdue) &&
                       i.TotalAmount > i.PaidAmount)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                i.InvoiceDate,
                i.DueDate,
                i.TotalAmount,
                i.PaidAmount,
                OutstandingAmount = i.TotalAmount - i.PaidAmount
            })
            .ToListAsync(cancellationToken);

        // Calculate aging buckets
        var current = 0m;
        var days30 = 0m;
        var days60 = 0m;
        var days90Plus = 0m;

        var agingDetails = new List<object>();

        foreach (var invoice in unpaidInvoices)
        {
            var dueDate = invoice.DueDate ?? invoice.InvoiceDate.AddDays(30); // Default 30 days if no due date
            var daysOverdue = (asOfDate - dueDate).Days;
            
            var agingBucket = daysOverdue switch
            {
                <= 0 => "Current",
                <= 30 => "1-30 days",
                <= 60 => "31-60 days",
                <= 90 => "61-90 days",
                _ => "90+ days"
            };

            switch (agingBucket)
            {
                case "Current":
                    current += invoice.OutstandingAmount;
                    break;
                case "1-30 days":
                    days30 += invoice.OutstandingAmount;
                    break;
                case "31-60 days":
                    days60 += invoice.OutstandingAmount;
                    break;
                case "61-90 days":
                    days90Plus += invoice.OutstandingAmount; // Include 61-90 in 90+ for simplicity
                    break;
                case "90+ days":
                    days90Plus += invoice.OutstandingAmount;
                    break;
            }

            agingDetails.Add(new
            {
                invoice.InvoiceNumber,
                invoice.InvoiceDate,
                DueDate = dueDate,
                invoice.OutstandingAmount,
                DaysOverdue = Math.Max(0, daysOverdue),
                AgingBucket = agingBucket
            });
        }

        var aging = new
        {
            Customer = new { customer.Id, customer.Name, customer.CreditLimit },
            AsOfDate = asOfDate.ToString("yyyy-MM-dd"),
            Summary = new
            {
                Current = current,
                Days30 = days30,
                Days60 = days60,
                Days90Plus = days90Plus,
                TotalOutstanding = current + days30 + days60 + days90Plus
            },
            InvoiceDetails = agingDetails.OrderByDescending(d => ((DateTime)d.GetType().GetProperty("InvoiceDate")!.GetValue(d)!))
        };

        var result = JsonSerializer.Serialize(aging, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getCustomerAging",
            IsSuccess = true,
            Result = $"דוח הזדקנות ללקוח {customer.Name} נכון ל-{asOfDate:dd/MM/yyyy}:\n{result}"
        };
    }

    private async Task<FunctionResult> GetCustomerStatisticsAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var customerId = argumentsDocument.RootElement.GetProperty("CustomerId").GetInt32();
        
        // Parse optional period parameter
        var periodMonths = 12;
        if (argumentsDocument.RootElement.TryGetProperty("PeriodMonths", out var periodElement))
        {
            periodMonths = periodElement.GetInt32();
        }

        var fromDate = DateTime.Today.AddMonths(-periodMonths);

        // Verify customer exists
        var customer = await _context.Customers
            .Where(c => c.Id == customerId && c.CompanyId == companyId)
            .FirstOrDefaultAsync(cancellationToken);

        if (customer == null)
        {
            return new FunctionResult
            {
                FunctionName = "getCustomerStatistics",
                IsSuccess = false,
                ErrorMessage = "לקוח לא נמצא"
            };
        }

        // Sales Orders Statistics
        var salesOrderStats = await _context.SalesOrders
            .Where(so => so.CustomerId == customerId && so.CompanyId == companyId && so.OrderDate >= fromDate)
            .GroupBy(so => 1)
            .Select(g => new
            {
                TotalOrders = g.Count(),
                TotalRevenue = g.Sum(so => so.TotalAmount),
                AverageOrderValue = g.Average(so => so.TotalAmount),
                FirstOrderDate = g.Min(so => so.OrderDate),
                LastOrderDate = g.Max(so => so.OrderDate)
            })
            .FirstOrDefaultAsync(cancellationToken);

        // Invoice Statistics
        var invoiceStats = await _context.Invoices
            .Where(i => i.CustomerId == customerId && i.CompanyId == companyId && i.InvoiceDate >= fromDate)
            .GroupBy(i => 1)
            .Select(g => new
            {
                TotalInvoices = g.Count(),
                TotalInvoiced = g.Sum(i => i.TotalAmount),
                TotalPaid = g.Sum(i => i.PaidAmount),
                PaidInvoices = g.Count(i => i.Status == Models.Sales.InvoiceStatus.Paid),
                OverdueInvoices = g.Count(i => i.Status == Models.Sales.InvoiceStatus.Overdue)
            })
            .FirstOrDefaultAsync(cancellationToken);

        // Calculate purchase frequency
        var totalDays = (DateTime.Today - (salesOrderStats?.FirstOrderDate ?? DateTime.Today)).Days;
        var purchaseFrequencyDays = totalDays > 0 && (salesOrderStats?.TotalOrders ?? 0) > 0 
            ? totalDays / (salesOrderStats?.TotalOrders ?? 1) 
            : 0;

        // Monthly sales trend
        var monthlySales = await _context.SalesOrders
            .Where(so => so.CustomerId == customerId && so.CompanyId == companyId && so.OrderDate >= fromDate)
            .GroupBy(so => new { so.OrderDate.Year, so.OrderDate.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                OrderCount = g.Count(),
                Revenue = g.Sum(so => so.TotalAmount)
            })
            .OrderBy(ms => ms.Year).ThenBy(ms => ms.Month)
            .ToListAsync(cancellationToken);

        var statistics = new
        {
            Customer = new { customer.Id, customer.Name },
            PeriodMonths = periodMonths,
            FromDate = fromDate.ToString("yyyy-MM-dd"),
            SalesOrders = new
            {
                TotalOrders = salesOrderStats?.TotalOrders ?? 0,
                TotalRevenue = salesOrderStats?.TotalRevenue ?? 0,
                AverageOrderValue = salesOrderStats?.AverageOrderValue ?? 0,
                FirstOrderDate = salesOrderStats?.FirstOrderDate.ToString("yyyy-MM-dd"),
                LastOrderDate = salesOrderStats?.LastOrderDate.ToString("yyyy-MM-dd"),
                PurchaseFrequencyDays = purchaseFrequencyDays
            },
            Invoices = new
            {
                TotalInvoices = invoiceStats?.TotalInvoices ?? 0,
                TotalInvoiced = invoiceStats?.TotalInvoiced ?? 0,
                TotalPaid = invoiceStats?.TotalPaid ?? 0,
                PaidInvoices = invoiceStats?.PaidInvoices ?? 0,
                OverdueInvoices = invoiceStats?.OverdueInvoices ?? 0,
                PaymentRate = (invoiceStats?.TotalInvoices ?? 0) > 0 
                    ? Math.Round((decimal)(invoiceStats?.PaidInvoices ?? 0) / (invoiceStats?.TotalInvoices ?? 1) * 100, 2) 
                    : 0
            },
            MonthlySalesTrend = monthlySales
        };

        var result = JsonSerializer.Serialize(statistics, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getCustomerStatistics",
            IsSuccess = true,
            Result = $"סטטיסטיקות ללקוח {customer.Name} עבור {periodMonths} חודשים אחרונים:\n{result}"
        };
    }

    private async Task<FunctionResult> GetCustomersTopByRevenueAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        
        // Parse optional parameters
        var topCount = 10;
        var periodMonths = 12;

        if (argumentsDocument.RootElement.TryGetProperty("TopCount", out var countElement))
        {
            topCount = Math.Min(countElement.GetInt32(), 50); // Max 50
        }

        if (argumentsDocument.RootElement.TryGetProperty("PeriodMonths", out var periodElement))
        {
            periodMonths = periodElement.GetInt32();
        }

        var fromDate = DateTime.Today.AddMonths(-periodMonths);

        // Get top customers by sales order revenue
        var topCustomers = await _context.Customers
            .Where(c => c.CompanyId == companyId)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.NameHebrew,
                c.Email,
                c.Phone,
                c.IsActive,
                TotalRevenue = c.SalesOrders
                    .Where(so => so.OrderDate >= fromDate)
                    .Sum(so => so.TotalAmount),
                OrderCount = c.SalesOrders
                    .Where(so => so.OrderDate >= fromDate)
                    .Count(),
                LastOrderDate = c.SalesOrders
                    .Where(so => so.OrderDate >= fromDate)
                    .Max(so => (DateTime?)so.OrderDate)
            })
            .Where(c => c.TotalRevenue > 0)
            .OrderByDescending(c => c.TotalRevenue)
            .Take(topCount)
            .ToListAsync(cancellationToken);

        var totalRevenue = topCustomers.Sum(c => c.TotalRevenue);

        var result = JsonSerializer.Serialize(new
        {
            PeriodMonths = periodMonths,
            FromDate = fromDate.ToString("yyyy-MM-dd"),
            TopCount = topCustomers.Count,
            TotalRevenue = totalRevenue,
            TopCustomers = topCustomers.Select((c, index) => new
            {
                Rank = index + 1,
                c.Id,
                c.Name,
                c.NameHebrew,
                c.Email,
                c.Phone,
                c.IsActive,
                c.TotalRevenue,
                c.OrderCount,
                LastOrderDate = c.LastOrderDate?.ToString("yyyy-MM-dd"),
                AverageOrderValue = c.OrderCount > 0 ? c.TotalRevenue / c.OrderCount : 0,
                RevenuePercentage = totalRevenue > 0 ? Math.Round(c.TotalRevenue / totalRevenue * 100, 2) : 0
            })
        }, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getCustomersTopByRevenue",
            IsSuccess = true,
            Result = $"למעלה {topCount} לקוחות לפי הכנסות עבור {periodMonths} חודשים אחרונים:\n{result}"
        };
    }

    private async Task<FunctionResult> GetCustomersWithOverdueInvoicesAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        
        // Parse optional parameters
        var minDaysOverdue = 1;
        decimal? minAmount = null;

        if (argumentsDocument.RootElement.TryGetProperty("MinDaysOverdue", out var daysElement))
        {
            minDaysOverdue = daysElement.GetInt32();
        }

        if (argumentsDocument.RootElement.TryGetProperty("MinAmount", out var amountElement))
        {
            minAmount = amountElement.GetDecimal();
        }

        var today = DateTime.Today;

        // Get customers with overdue invoices
        var customersWithOverdueQuery = _context.Customers
            .Where(c => c.CompanyId == companyId)
            .Where(c => c.Invoices.Any(i => 
                (i.Status == Models.Sales.InvoiceStatus.Sent || i.Status == Models.Sales.InvoiceStatus.Overdue) &&
                i.TotalAmount > i.PaidAmount &&
                i.DueDate.HasValue && i.DueDate.Value.AddDays(-minDaysOverdue) < today));

        if (minAmount.HasValue)
        {
            customersWithOverdueQuery = customersWithOverdueQuery
                .Where(c => c.Invoices
                    .Where(i => (i.Status == Models.Sales.InvoiceStatus.Sent || i.Status == Models.Sales.InvoiceStatus.Overdue) &&
                               i.TotalAmount > i.PaidAmount &&
                               i.DueDate.HasValue && i.DueDate.Value.AddDays(-minDaysOverdue) < today)
                    .Sum(i => i.TotalAmount - i.PaidAmount) >= minAmount.Value);
        }

        var customersWithOverdue = await customersWithOverdueQuery
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.NameHebrew,
                c.Email,
                c.Phone,
                c.Contact,
                c.CreditLimit,
                OverdueInvoices = c.Invoices
                    .Where(i => (i.Status == Models.Sales.InvoiceStatus.Sent || i.Status == Models.Sales.InvoiceStatus.Overdue) &&
                               i.TotalAmount > i.PaidAmount &&
                               i.DueDate.HasValue && i.DueDate.Value.AddDays(-minDaysOverdue) < today)
                    .Select(i => new
                    {
                        i.Id,
                        i.InvoiceNumber,
                        i.InvoiceDate,
                        i.DueDate,
                        i.TotalAmount,
                        i.PaidAmount,
                        OutstandingAmount = i.TotalAmount - i.PaidAmount,
                        DaysOverdue = i.DueDate.HasValue ? (today - i.DueDate.Value).Days : 0
                    })
                    .ToList()
            })
            .Where(c => c.OverdueInvoices.Any())
            .OrderByDescending(c => c.OverdueInvoices.Sum(i => i.OutstandingAmount))
            .ToListAsync(cancellationToken);

        var totalOverdueAmount = customersWithOverdue.Sum(c => c.OverdueInvoices.Sum(i => i.OutstandingAmount));
        var totalOverdueInvoices = customersWithOverdue.Sum(c => c.OverdueInvoices.Count);

        var result = JsonSerializer.Serialize(new
        {
            MinDaysOverdue = minDaysOverdue,
            MinAmount = minAmount,
            AsOfDate = today.ToString("yyyy-MM-dd"),
            Summary = new
            {
                TotalCustomers = customersWithOverdue.Count,
                TotalOverdueInvoices = totalOverdueInvoices,
                TotalOverdueAmount = totalOverdueAmount
            },
            CustomersWithOverdue = customersWithOverdue.Select(c => new
            {
                c.Id,
                c.Name,
                c.NameHebrew,
                c.Email,
                c.Phone,
                c.Contact,
                c.CreditLimit,
                TotalOverdueAmount = c.OverdueInvoices.Sum(i => i.OutstandingAmount),
                OverdueInvoiceCount = c.OverdueInvoices.Count,
                OldestInvoiceDays = c.OverdueInvoices.Max(i => i.DaysOverdue),
                OverdueInvoices = c.OverdueInvoices.OrderByDescending(i => i.DaysOverdue)
            })
        }, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getCustomersWithOverdueInvoices",
            IsSuccess = true,
            Result = $"לקוחות עם חשבוניות באיחור של {minDaysOverdue}+ ימים:\n{result}"
        };
    }
}
