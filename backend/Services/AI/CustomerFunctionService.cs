using backend.Data;
using backend.Models.Sales;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using backend.Controllers;

namespace backend.Services.AI;

/// <summary>
/// Service providing customer-related functions for AI Assistant function calling
/// Implements functions that can be called by Azure OpenAI to retrieve customer data
/// </summary>
public class CustomerFunctionService : ICustomerFunctionService
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<CustomerFunctionService> _logger;
    private readonly ICustomerDocumentService _customerDocumentService;

    public CustomerFunctionService(
        AccountingDbContext context,
        ILogger<CustomerFunctionService> logger,
        ICustomerDocumentService customerDocumentService)
    {
        _context = context;
        _logger = logger;
        _customerDocumentService = customerDocumentService;
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
                Name = "getCustomerDocuments",
                Description = "מסמכי לקוח - מחזיר את כל המסמכים של לקוח (הזמנות, חשבוניות, קבלות) עם אפשרות לסינון לפי תאריך וסוג מסמך",
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
                            Description = "תאריך התחלה לסינון (אופציונלי, פורמט: YYYY-MM-DD)"
                        },
                        ToDate = new
                        {
                            Type = "string",
                            Description = "תאריך סיום לסינון (אופציונלי, פורמט: YYYY-MM-DD)"
                        },
                        DocumentType = new
                        {
                            Type = "string",
                            Description = "סוג מסמך לסינון (אופציונלי): SalesOrder, Invoice, Receipt, POSSale"
                        }
                    },
                    Required = new[] { "CustomerId", "CompanyId" }
                }
            },
            new()
            {
                Name = "getCustomerDocumentStats",
                Description = "סטטיסטיקות מסמכים - מחזיר סיכום סטטיסטי של מסמכי הלקוח (כמות, סכומים, יתרות)",
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
                Name = "getOutstandingDocuments",
                Description = "מסמכים פתוחים - מחזיר חשבוניות שלא שולמו והזמנות שלא הושלמו עבור הלקוח",
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
                Name = "searchCustomerDocuments",
                Description = "חיפוש מסמכים - מחפש מסמכים לפי מספר מסמך, סכום או תאריך עבור לקוח ספציפי",
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
                        SearchTerm = new
                        {
                            Type = "string",
                            Description = "מונח חיפוש - מספר מסמך, סכום או תיאור"
                        }
                    },
                    Required = new[] { "CustomerId", "CompanyId", "SearchTerm" }
                }
            },
            new()
            {
                Name = "getDocumentDetails",
                Description = "פרטי מסמך - מחזיר מידע מפורט על מסמך ספציפי לפי מזהה וסוג",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        DocumentId = new
                        {
                            Type = "integer",
                            Description = "מזהה המסמך"
                        },
                        DocumentType = new
                        {
                            Type = "string",
                            Description = "סוג המסמך: SalesOrder, Invoice, Receipt"
                        },
                        CompanyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        }
                    },
                    Required = new[] { "DocumentId", "DocumentType", "CompanyId" }
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
                "getCustomerDocuments" => await GetCustomerDocumentsAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomerDocumentStats" => await GetCustomerDocumentStatsAsync(functionCall.Arguments, companyId, cancellationToken),
                "getOutstandingDocuments" => await GetOutstandingDocumentsAsync(functionCall.Arguments, companyId, cancellationToken),
                "searchCustomerDocuments" => await SearchCustomerDocumentsAsync(functionCall.Arguments, companyId, cancellationToken),
                "getDocumentDetails" => await GetDocumentDetailsAsync(functionCall.Arguments, companyId, cancellationToken),
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

    private async Task<FunctionResult> GetCustomerDocumentsAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var customerId = argumentsDocument.RootElement.GetProperty("CustomerId").GetInt32();

        // Parse optional parameters
        DateTime? fromDate = null;
        DateTime? toDate = null;
        string? documentType = null;

        if (argumentsDocument.RootElement.TryGetProperty("FromDate", out var fromDateElement) && 
            !string.IsNullOrEmpty(fromDateElement.GetString()))
        {
            if (DateTime.TryParse(fromDateElement.GetString(), out var parsedFromDate))
                fromDate = parsedFromDate;
        }

        if (argumentsDocument.RootElement.TryGetProperty("ToDate", out var toDateElement) && 
            !string.IsNullOrEmpty(toDateElement.GetString()))
        {
            if (DateTime.TryParse(toDateElement.GetString(), out var parsedToDate))
                toDate = parsedToDate;
        }

        if (argumentsDocument.RootElement.TryGetProperty("DocumentType", out var docTypeElement))
        {
            documentType = docTypeElement.GetString();
        }

        var documentsResponse = await _customerDocumentService.GetCustomerDocumentsAsync(
            customerId, companyId, fromDate, toDate, documentType);

        if (documentsResponse == null)
        {
            return new FunctionResult
            {
                FunctionName = "getCustomerDocuments",
                IsSuccess = false,
                ErrorMessage = "לקוח לא נמצא"
            };
        }

        var result = JsonSerializer.Serialize(documentsResponse, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getCustomerDocuments",
            IsSuccess = true,
            Result = $"מסמכי הלקוח {documentsResponse.CustomerName} ({documentsResponse.TotalDocuments} מסמכים, סה״כ: ₪{documentsResponse.TotalAmount:F2}):\n{result}"
        };
    }

    private async Task<FunctionResult> GetCustomerDocumentStatsAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var customerId = argumentsDocument.RootElement.GetProperty("CustomerId").GetInt32();

        var stats = await _customerDocumentService.GetCustomerDocumentStatsAsync(customerId, companyId);

        if (stats == null)
        {
            return new FunctionResult
            {
                FunctionName = "getCustomerDocumentStats",
                IsSuccess = false,
                ErrorMessage = "לקוח לא נמצא"
            };
        }

        var result = JsonSerializer.Serialize(stats, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getCustomerDocumentStats",
            IsSuccess = true,
            Result = $"סטטיסטיקות מסמכים ללקוח {stats.CustomerName}:\n{result}"
        };
    }

    private async Task<FunctionResult> GetOutstandingDocumentsAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var customerId = argumentsDocument.RootElement.GetProperty("CustomerId").GetInt32();

        // Get unpaid invoices
        var unpaidInvoices = await _context.Invoices
            .Where(i => i.CustomerId == customerId && i.CompanyId == companyId && 
                       (i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.Overdue))
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                i.InvoiceDate,
                i.DueDate,
                i.TotalAmount,
                i.PaidAmount,
                OutstandingAmount = i.TotalAmount - i.PaidAmount,
                i.Status,
                DocumentType = "Invoice"
            })
            .ToListAsync(cancellationToken);

        // Get incomplete sales orders
        var incompleteSalesOrders = await _context.SalesOrders
            .Where(so => so.CustomerId == customerId && so.CompanyId == companyId && 
                        (so.Status == SalesOrderStatus.Quote || so.Status == SalesOrderStatus.Confirmed || so.Status == SalesOrderStatus.Shipped))
            .Select(so => new
            {
                so.Id,
                DocumentNumber = so.OrderNumber,
                DocumentDate = so.OrderDate,
                so.DueDate,
                so.TotalAmount,
                so.PaidAmount,
                OutstandingAmount = so.TotalAmount - so.PaidAmount,
                so.Status,
                DocumentType = "SalesOrder"
            })
            .ToListAsync(cancellationToken);

        var outstandingDocuments = new
        {
            CustomerId = customerId,
            UnpaidInvoices = unpaidInvoices,
            IncompleteSalesOrders = incompleteSalesOrders,
            TotalOutstandingAmount = unpaidInvoices.Sum(i => i.OutstandingAmount) + incompleteSalesOrders.Sum(so => so.OutstandingAmount)
        };

        var result = JsonSerializer.Serialize(outstandingDocuments, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getOutstandingDocuments",
            IsSuccess = true,
            Result = $"מסמכים פתוחים ללקוח (סה״כ יתרה: ₪{outstandingDocuments.TotalOutstandingAmount:F2}):\n{result}"
        };
    }

    private async Task<FunctionResult> SearchCustomerDocumentsAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var customerId = argumentsDocument.RootElement.GetProperty("CustomerId").GetInt32();
        var searchTerm = argumentsDocument.RootElement.GetProperty("SearchTerm").GetString()?.Trim();

        if (string.IsNullOrEmpty(searchTerm))
        {
            return new FunctionResult
            {
                FunctionName = "searchCustomerDocuments",
                IsSuccess = false,
                ErrorMessage = "מונח חיפוש ריק"
            };
        }

        var matchingDocuments = new List<object>();

        // Search sales orders
        var salesOrders = await _context.SalesOrders
            .Where(so => so.CustomerId == customerId && so.CompanyId == companyId && 
                        (so.OrderNumber.Contains(searchTerm) || 
                         so.TotalAmount.ToString().Contains(searchTerm) ||
                         (so.Notes != null && so.Notes.Contains(searchTerm))))
            .Select(so => new
            {
                so.Id,
                DocumentType = "SalesOrder",
                DocumentNumber = so.OrderNumber,
                DocumentDate = so.OrderDate,
                so.TotalAmount,
                so.Status,
                Description = $"הזמנה #{so.OrderNumber}"
            })
            .ToListAsync(cancellationToken);

        // Search invoices
        var invoices = await _context.Invoices
            .Where(i => i.CustomerId == customerId && i.CompanyId == companyId && 
                       (i.InvoiceNumber.Contains(searchTerm) || 
                        i.TotalAmount.ToString().Contains(searchTerm) ||
                        (i.Notes != null && i.Notes.Contains(searchTerm))))
            .Select(i => new
            {
                i.Id,
                DocumentType = "Invoice",
                DocumentNumber = i.InvoiceNumber,
                DocumentDate = i.InvoiceDate,
                i.TotalAmount,
                i.Status,
                Description = $"חשבונית #{i.InvoiceNumber}"
            })
            .ToListAsync(cancellationToken);

        // Search receipts
        var receipts = await (from receipt in _context.Receipts
                             join invoice in _context.Invoices on receipt.InvoiceId equals invoice.Id
                             where invoice.CustomerId == customerId && receipt.CompanyId == companyId &&
                                   (receipt.ReceiptNumber.Contains(searchTerm) || 
                                    receipt.Amount.ToString().Contains(searchTerm) ||
                                    receipt.PaymentMethod.Contains(searchTerm))
                             select new
                             {
                                 Id = receipt.Id,
                                 DocumentType = "Receipt",
                                 DocumentNumber = receipt.ReceiptNumber,
                                 DocumentDate = receipt.PaymentDate,
                                 TotalAmount = receipt.Amount,
                                 Status = "שולם",
                                 Description = $"קבלה #{receipt.ReceiptNumber} - {receipt.PaymentMethod}"
                             }).ToListAsync(cancellationToken);

        matchingDocuments.AddRange(salesOrders);
        matchingDocuments.AddRange(invoices);
        matchingDocuments.AddRange(receipts);

        var searchResults = new
        {
            CustomerId = customerId,
            SearchTerm = searchTerm,
            MatchingDocuments = matchingDocuments.OrderByDescending(d => ((dynamic)d).DocumentDate),
            TotalMatches = matchingDocuments.Count
        };

        var result = JsonSerializer.Serialize(searchResults, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "searchCustomerDocuments",
            IsSuccess = true,
            Result = $"תוצאות חיפוש '{searchTerm}' ({matchingDocuments.Count} תוצאות):\n{result}"
        };
    }

    private async Task<FunctionResult> GetDocumentDetailsAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var documentId = argumentsDocument.RootElement.GetProperty("DocumentId").GetInt32();
        var documentType = argumentsDocument.RootElement.GetProperty("DocumentType").GetString();

        object? documentDetails = null;
        string documentTypeName = "";

        switch (documentType?.ToLower())
        {
            case "salesorder":
                documentDetails = await _context.SalesOrders
                    .Where(so => so.Id == documentId && so.CompanyId == companyId)
                    .Include(so => so.Customer)
                    .Include(so => so.Lines)
                        .ThenInclude(l => l.Item)
                    .Select(so => new
                    {
                        so.Id,
                        so.OrderNumber,
                        so.OrderDate,
                        so.DueDate,
                        so.DeliveryDate,
                        so.Status,
                        so.SubtotalAmount,
                        so.TaxAmount,
                        so.TotalAmount,
                        so.PaidAmount,
                        so.Currency,
                        so.Notes,
                        Customer = new { so.Customer.Id, so.Customer.Name, so.Customer.Contact },
                        Lines = so.Lines.Select(l => new
                        {
                            l.LineNumber,
                            l.Description,
                            ItemName = l.Item.Name,
                            l.Quantity,
                            l.UnitPrice,
                            l.DiscountPercent,
                            l.TaxRate,
                            l.LineTotalWithTax
                        })
                    })
                    .FirstOrDefaultAsync(cancellationToken);
                documentTypeName = "הזמנת מכירות";
                break;

            case "invoice":
                documentDetails = await _context.Invoices
                    .Where(i => i.Id == documentId && i.CompanyId == companyId)
                    .Include(i => i.Customer)
                    .Include(i => i.Lines)
                        .ThenInclude(l => l.Item)
                    .Select(i => new
                    {
                        i.Id,
                        i.InvoiceNumber,
                        i.InvoiceDate,
                        i.DueDate,
                        i.Status,
                        i.SubtotalAmount,
                        i.TaxAmount,
                        i.TotalAmount,
                        i.PaidAmount,
                        i.Currency,
                        i.Notes,
                        Customer = new { i.Customer.Id, i.Customer.Name },
                        Lines = i.Lines.Select(l => new
                        {
                            l.LineNumber,
                            l.Description,
                            ItemName = l.Item != null ? l.Item.Name : l.Description,
                            l.Quantity,
                            l.UnitPrice,
                            l.DiscountPercent,
                            l.TaxRate,
                            l.LineTotal
                        })
                    })
                    .FirstOrDefaultAsync(cancellationToken);
                documentTypeName = "חשבונית";
                break;

            case "receipt":
                documentDetails = await _context.Receipts
                    .Where(r => r.Id == documentId && r.CompanyId == companyId)
                    .Include(r => r.Invoice)
                        .ThenInclude(i => i.Customer)
                    .Select(r => new
                    {
                        r.Id,
                        r.ReceiptNumber,
                        r.PaymentDate,
                        r.Amount,
                        r.PaymentMethod,
                        r.ReferenceNumber,
                        r.Notes,
                        r.Currency,
                        Invoice = new
                        {
                            r.Invoice.Id,
                            r.Invoice.InvoiceNumber,
                            Customer = new { r.Invoice.Customer.Id, r.Invoice.Customer.Name }
                        }
                    })
                    .FirstOrDefaultAsync(cancellationToken);
                documentTypeName = "קבלה";
                break;

            default:
                return new FunctionResult
                {
                    FunctionName = "getDocumentDetails",
                    IsSuccess = false,
                    ErrorMessage = $"סוג מסמך לא נתמך: {documentType}"
                };
        }

        if (documentDetails == null)
        {
            return new FunctionResult
            {
                FunctionName = "getDocumentDetails",
                IsSuccess = false,
                ErrorMessage = $"{documentTypeName} לא נמצא"
            };
        }

        var result = JsonSerializer.Serialize(documentDetails, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "getDocumentDetails",
            IsSuccess = true,
            Result = $"פרטי {documentTypeName} #{documentId}:\n{result}"
        };
    }
}
