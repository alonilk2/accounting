using backend.Data;
using backend.Models.Sales;
using backend.Services.Interfaces;
using backend.Services.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace backend.Services.AI;

/// <summary>
/// Service providing invoice-related functions for AI Assistant function calling
/// Implements functions that can be called by Azure OpenAI to retrieve and manage invoice data
/// </summary>
public class InvoiceFunctionService : IInvoiceFunctionService
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<InvoiceFunctionService> _logger;
    private readonly IInvoiceService _invoiceService;

    public InvoiceFunctionService(
        AccountingDbContext context,
        ILogger<InvoiceFunctionService> logger,
        IInvoiceService invoiceService)
    {
        _context = context;
        _logger = logger;
        _invoiceService = invoiceService;
    }

    /// <summary>
    /// Get list of all available invoice functions for AI
    /// </summary>
    /// <returns>List of function definitions</returns>
    public List<FunctionDefinition> GetInvoiceFunctions()
    {
        return new List<FunctionDefinition>
        {
            new()
            {
                Name = "getInvoicesList",
                Description = "רשימת חשבוניות - מחזיר רשימה של חשבוניות של החברה עם פרטי יסוד",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה (CompanyId) לקבלת חשבוניות"
                        },
                        status = new
                        {
                            Type = "string",
                            Description = "סטטוס החשבונית (Draft, Sent, Paid, Cancelled, Overdue). אופציונלי - אם לא מצוין יחזיר הכל",
                            Enum = new[] { "Draft", "Sent", "Paid", "Cancelled", "Overdue" }
                        },
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה לקוח ספציפי (אופציונלי) - לסינון לפי לקוח"
                        },
                        fromDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך התחלה (אופציונלי) - פורמט: YYYY-MM-DD"
                        },
                        toDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך סיום (אופציונלי) - פורמט: YYYY-MM-DD"
                        },
                        limit = new
                        {
                            Type = "integer",
                            Description = "מגבלת מספר רשומות (ברירת מחדל: 50, מקסימום: 200)"
                        }
                    },
                    Required = new[] { "companyId" }
                }
            },
            new()
            {
                Name = "getInvoiceDetails",
                Description = "פרטי חשבונית - מחזיר מידע מפורט על חשבונית ספציפית כולל שורות ותשלומים",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        invoiceId = new
                        {
                            Type = "integer",
                            Description = "מזהה החשבונית"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        }
                    },
                    Required = new[] { "invoiceId", "companyId" }
                }
            },
            new()
            {
                Name = "searchInvoices",
                Description = "חיפוש חשבוניות - מחפש חשבוניות לפי מספר חשבונית, שם לקוח או תוכן",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        searchTerm = new
                        {
                            Type = "string",
                            Description = "מונח החיפוש - מספר חשבונית, שם לקוח, או תוכן החשבונית"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        }
                    },
                    Required = new[] { "searchTerm", "companyId" }
                }
            },
            new()
            {
                Name = "getInvoicesStatistics",
                Description = "סטטיסטיקות חשבוניות - מחזיר נתונים כמו סך הכנסות, מספר חשבוניות, ממוצעים",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        fromDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך התחלה לחישוב הסטטיסטיקה (אופציונלי) - פורמט: YYYY-MM-DD"
                        },
                        toDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך סיום לחישוב הסטטיסטיקה (אופציונלי) - פורמט: YYYY-MM-DD"
                        }
                    },
                    Required = new[] { "companyId" }
                }
            },
            new()
            {
                Name = "getOverdueInvoices",
                Description = "חשבוניות באיחור - מחזיר רשימת חשבוניות שטרם שולמו אחרי המועד",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        minDaysOverdue = new
                        {
                            Type = "integer",
                            Description = "מספר ימים מינימלי של איחור (ברירת מחדל: 1)"
                        },
                        minAmount = new
                        {
                            Type = "number",
                            Description = "סכום מינימלי של חוב באיחור (אופציונלי)"
                        }
                    },
                    Required = new[] { "companyId" }
                }
            },
            new()
            {
                Name = "getInvoicePayments",
                Description = "תשלומי חשבונית - מחזיר רשימת כל התשלומים של חשבונית ספציפית",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        invoiceId = new
                        {
                            Type = "integer",
                            Description = "מזהה החשבונית"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        }
                    },
                    Required = new[] { "invoiceId", "companyId" }
                }
            },
            new()
            {
                Name = "createInvoice",
                Description = "יצירת חשבונית חדשה - יוצר חשבונית חדשה במערכת עם הפרטים הנדרשים",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח (חובה)"
                        },
                        salesOrderId = new
                        {
                            Type = "integer",
                            Description = "מזהה הזמנת מכירה (אופציונלי) - אם רוצים ליצור חשבונית מהזמנה קיימת"
                        },
                        invoiceDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך החשבונית (ברירת מחדל: היום) - פורמט: YYYY-MM-DD"
                        },
                        dueDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך פירוק (אופציונלי) - פורמט: YYYY-MM-DD"
                        },
                        currency = new
                        {
                            Type = "string",
                            Description = "מטבע (ברירת מחדל: ILS)"
                        },
                        notes = new
                        {
                            Type = "string",
                            Description = "הערות (אופציונלי)"
                        },
                        lines = new
                        {
                            Type = "array",
                            Description = "שורות החשבונית",
                            Items = new
                            {
                                Type = "object",
                                Properties = new
                                {
                                    itemId = new
                                    {
                                        Type = "integer",
                                        Description = "מזהה המוצר (אופציונלי)"
                                    },
                                    description = new
                                    {
                                        Type = "string",
                                        Description = "תיאור השורה (חובה)"
                                    },
                                    quantity = new
                                    {
                                        Type = "number",
                                        Description = "כמות (חובה)"
                                    },
                                    unitPrice = new
                                    {
                                        Type = "number",
                                        Description = "מחיר יחידה (חובה)"
                                    },
                                    discountPercent = new
                                    {
                                        Type = "number",
                                        Description = "אחוז הנחה (ברירת מחדל: 0)"
                                    },
                                    taxRate = new
                                    {
                                        Type = "number",
                                        Description = "אחוז מס (ברירת מחדל: 17)"
                                    }
                                },
                                Required = new[] { "description", "quantity", "unitPrice" }
                            }
                        }
                    },
                    Required = new[] { "companyId", "customerId", "lines" }
                }
            },
            new()
            {
                Name = "updateInvoiceStatus",
                Description = "עדכון סטטוס חשבונית - מעדכן את סטטוס החשבונית",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        invoiceId = new
                        {
                            Type = "integer",
                            Description = "מזהה החשבונית לעדכון"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        status = new
                        {
                            Type = "string",
                            Description = "סטטוס חדש",
                            Enum = new[] { "Draft", "Sent", "Paid", "Cancelled", "Overdue" }
                        }
                    },
                    Required = new[] { "invoiceId", "companyId", "status" }
                }
            },
            new()
            {
                Name = "processInvoicePayment",
                Description = "עיבוד תשלום לחשבונית - מעבד תשלום חדש לחשבונית קיימת",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        invoiceId = new
                        {
                            Type = "integer",
                            Description = "מזהה החשבונית"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        amount = new
                        {
                            Type = "number",
                            Description = "סכום התשלום (חובה)"
                        },
                        paymentMethod = new
                        {
                            Type = "string",
                            Description = "אמצעי תשלום (כמו מזומן, צ'ק, העברה בנקאית, כרטיס אשראי)"
                        },
                        referenceNumber = new
                        {
                            Type = "string",
                            Description = "מספר אסמכתא (אופציונלי)"
                        },
                        notes = new
                        {
                            Type = "string",
                            Description = "הערות לתשלום (אופציונלי)"
                        }
                    },
                    Required = new[] { "invoiceId", "companyId", "amount", "paymentMethod" }
                }
            }
        };
    }

    /// <summary>
    /// Execute an invoice-related function
    /// </summary>
    public async Task<FunctionResult> ExecuteInvoiceFunctionAsync(
        FunctionCall functionCall, 
        int companyId, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Executing invoice function: {FunctionName}", functionCall.Name);

            return functionCall.Name switch
            {
                "getInvoicesList" => await GetInvoicesListAsync(functionCall.Arguments, companyId, cancellationToken),
                "getInvoiceDetails" => await GetInvoiceDetailsAsync(functionCall.Arguments, companyId, cancellationToken),
                "searchInvoices" => await SearchInvoicesAsync(functionCall.Arguments, companyId, cancellationToken),
                "getInvoicesStatistics" => await GetInvoicesStatisticsAsync(functionCall.Arguments, companyId, cancellationToken),
                "getOverdueInvoices" => await GetOverdueInvoicesAsync(functionCall.Arguments, companyId, cancellationToken),
                "getInvoicePayments" => await GetInvoicePaymentsAsync(functionCall.Arguments, companyId, cancellationToken),
                "createInvoice" => await CreateInvoiceAsync(functionCall.Arguments, companyId, cancellationToken),
                "updateInvoiceStatus" => await UpdateInvoiceStatusAsync(functionCall.Arguments, companyId, cancellationToken),
                "processInvoicePayment" => await ProcessInvoicePaymentAsync(functionCall.Arguments, companyId, cancellationToken),
                _ => new FunctionResult
                {
                    FunctionName = functionCall.Name,
                    CallId = functionCall.Id,
                    IsSuccess = false,
                    ErrorMessage = $"פונקציה לא מוכרת: {functionCall.Name}"
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing invoice function {FunctionName}", functionCall.Name);
            return new FunctionResult
            {
                FunctionName = functionCall.Name,
                CallId = functionCall.Id,
                IsSuccess = false,
                ErrorMessage = "שגיאה בביצוע הפונקציה"
            };
        }
    }

    /// <summary>
    /// Get invoices list
    /// </summary>
    private async Task<FunctionResult> GetInvoicesListAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            var args = JsonSerializer.Deserialize<Dictionary<string, object>>(arguments) ?? new();
            
            var query = _context.Invoices
                .Include(i => i.Customer)
                .Where(i => i.CompanyId == companyId && !i.IsDeleted);

            // Filter by status if provided
            if (args.TryGetValue("status", out var statusObj) && statusObj != null)
            {
                if (Enum.TryParse<InvoiceStatus>(statusObj.ToString(), out var status))
                {
                    query = query.Where(i => i.Status == status);
                }
            }

            // Filter by customer if provided
            if (args.TryGetValue("customerId", out var customerIdObj) && customerIdObj != null)
            {
                if (int.TryParse(customerIdObj.ToString(), out var customerId))
                {
                    query = query.Where(i => i.CustomerId == customerId);
                }
            }

            // Filter by date range if provided
            if (args.TryGetValue("fromDate", out var fromDateObj) && fromDateObj != null)
            {
                if (DateTime.TryParse(fromDateObj.ToString(), out var fromDate))
                {
                    query = query.Where(i => i.InvoiceDate >= fromDate);
                }
            }

            if (args.TryGetValue("toDate", out var toDateObj) && toDateObj != null)
            {
                if (DateTime.TryParse(toDateObj.ToString(), out var toDate))
                {
                    query = query.Where(i => i.InvoiceDate <= toDate);
                }
            }

            // Apply limit
            var limit = 50; // Default
            if (args.TryGetValue("limit", out var limitObj) && limitObj != null)
            {
                if (int.TryParse(limitObj.ToString(), out var parsedLimit))
                {
                    limit = Math.Min(parsedLimit, 200); // Max 200
                }
            }

            var invoices = await query
                .OrderByDescending(i => i.InvoiceDate)
                .Take(limit)
                .Select(i => new
                {
                    i.Id,
                    i.InvoiceNumber,
                    i.InvoiceDate,
                    i.DueDate,
                    i.Status,
                    CustomerName = i.Customer.Name,
                    i.SubtotalAmount,
                    i.TaxAmount,
                    i.TotalAmount,
                    i.PaidAmount,
                    RemainingAmount = i.TotalAmount - i.PaidAmount,
                    i.Currency,
                    IsOverdue = i.DueDate.HasValue && i.DueDate < DateTime.Now && i.Status != InvoiceStatus.Paid,
                    i.Notes
                })
                .ToListAsync(cancellationToken);

            var result = new
            {
                invoices,
                totalCount = invoices.Count,
                summary = new
                {
                    totalAmount = invoices.Sum(i => i.TotalAmount),
                    totalPaid = invoices.Sum(i => i.PaidAmount),
                    totalRemaining = invoices.Sum(i => i.RemainingAmount),
                    overdueCount = invoices.Count(i => i.IsOverdue)
                }
            };

            return new FunctionResult
            {
                FunctionName = "getInvoicesList",
                IsSuccess = true,
                Result = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true })
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invoices list");
            return new FunctionResult
            {
                FunctionName = "getInvoicesList",
                IsSuccess = false,
                ErrorMessage = "שגיאה בקבלת רשימת החשבוניות"
            };
        }
    }

    /// <summary>
    /// Get invoice details
    /// </summary>
    private async Task<FunctionResult> GetInvoiceDetailsAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            var args = JsonSerializer.Deserialize<Dictionary<string, object>>(arguments) ?? new();
            
            if (!args.TryGetValue("invoiceId", out var invoiceIdObj) || 
                !int.TryParse(invoiceIdObj.ToString(), out var invoiceId))
            {
                return new FunctionResult
                {
                    FunctionName = "getInvoiceDetails",
                    IsSuccess = false,
                    ErrorMessage = "חסר מזהה חשבונית חוקי"
                };
            }

            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.Lines)
                    .ThenInclude(l => l.Item)
                .FirstOrDefaultAsync(i => i.Id == invoiceId && i.CompanyId == companyId && !i.IsDeleted, cancellationToken);

            if (invoice == null)
            {
                return new FunctionResult
                {
                    FunctionName = "getInvoiceDetails",
                    IsSuccess = false,
                    ErrorMessage = $"חשבונית עם מזהה {invoiceId} לא נמצאה"
                };
            }

            // Get payments for this invoice
            var payments = await _invoiceService.GetInvoiceReceiptsAsync(invoiceId, companyId, cancellationToken);

            var result = new
            {
                invoice = new
                {
                    invoice.Id,
                    invoice.InvoiceNumber,
                    invoice.InvoiceDate,
                    invoice.DueDate,
                    invoice.Status,
                    Customer = new
                    {
                        invoice.Customer.Id,
                        invoice.Customer.Name,
                        invoice.Customer.TaxId,
                        invoice.Customer.Email,
                        invoice.Customer.Phone,
                        invoice.Customer.Address
                    },
                    invoice.SubtotalAmount,
                    invoice.TaxAmount,
                    invoice.TotalAmount,
                    invoice.PaidAmount,
                    RemainingAmount = invoice.TotalAmount - invoice.PaidAmount,
                    invoice.Currency,
                    invoice.Notes,
                    invoice.CustomerAddress,
                    invoice.CustomerTaxId,
                    invoice.CustomerContact,
                    IsOverdue = invoice.DueDate.HasValue && invoice.DueDate < DateTime.Now && invoice.Status != InvoiceStatus.Paid,
                    Lines = invoice.Lines.Select(l => new
                    {
                        l.Id,
                        l.LineNumber,
                        l.Description,
                        ItemName = l.Item?.Name,
                        l.ItemSku,
                        l.Quantity,
                        l.UnitPrice,
                        l.DiscountPercent,
                        l.TaxRate,
                        l.TaxAmount,
                        l.LineTotal
                    })
                },
                payments = payments.Select(p => new
                {
                    p.Id,
                    p.ReceiptNumber,
                    p.PaymentDate,
                    p.Amount,
                    p.PaymentMethod,
                    p.ReferenceNumber,
                    p.Notes
                })
            };

            return new FunctionResult
            {
                FunctionName = "getInvoiceDetails",
                IsSuccess = true,
                Result = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true })
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invoice details");
            return new FunctionResult
            {
                FunctionName = "getInvoiceDetails",
                IsSuccess = false,
                ErrorMessage = "שגיאה בקבלת פרטי החשבונית"
            };
        }
    }

    /// <summary>
    /// Search invoices
    /// </summary>
    private async Task<FunctionResult> SearchInvoicesAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            var args = JsonSerializer.Deserialize<Dictionary<string, object>>(arguments) ?? new();
            
            if (!args.TryGetValue("searchTerm", out var searchTermObj) || 
                string.IsNullOrWhiteSpace(searchTermObj.ToString()))
            {
                return new FunctionResult
                {
                    FunctionName = "searchInvoices",
                    IsSuccess = false,
                    ErrorMessage = "חסר מונח חיפוש"
                };
            }

            var searchTerm = searchTermObj.ToString()!.Trim();

            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .Where(i => i.CompanyId == companyId && !i.IsDeleted)
                .Where(i => 
                    i.InvoiceNumber.Contains(searchTerm) ||
                    (i.Customer != null && i.Customer.Name.Contains(searchTerm)) ||
                    (i.Notes != null && i.Notes.Contains(searchTerm)) ||
                    (!string.IsNullOrEmpty(i.CustomerTaxId) && i.CustomerTaxId.Contains(searchTerm)))
                .OrderByDescending(i => i.InvoiceDate)
                .Take(50)
                .Select(i => new
                {
                    i.Id,
                    i.InvoiceNumber,
                    i.InvoiceDate,
                    i.Status,
                    CustomerName = i.Customer.Name,
                    i.TotalAmount,
                    i.PaidAmount,
                    RemainingAmount = i.TotalAmount - i.PaidAmount,
                    i.Currency
                })
                .ToListAsync(cancellationToken);

            var result = new
            {
                searchTerm,
                results = invoices,
                totalFound = invoices.Count
            };

            return new FunctionResult
            {
                FunctionName = "searchInvoices",
                IsSuccess = true,
                Result = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true })
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching invoices");
            return new FunctionResult
            {
                FunctionName = "searchInvoices",
                IsSuccess = false,
                ErrorMessage = "שגיאה בחיפוש חשבוניות"
            };
        }
    }

    /// <summary>
    /// Get invoices statistics
    /// </summary>
    private async Task<FunctionResult> GetInvoicesStatisticsAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            var args = JsonSerializer.Deserialize<Dictionary<string, object>>(arguments) ?? new();
            
            var query = _context.Invoices
                .Where(i => i.CompanyId == companyId && !i.IsDeleted);

            // Filter by date range if provided
            DateTime? fromDate = null, toDate = null;
            
            if (args.TryGetValue("fromDate", out var fromDateObj) && fromDateObj != null)
            {
                DateTime.TryParse(fromDateObj.ToString(), out var fromDateParsed);
                fromDate = fromDateParsed;
                query = query.Where(i => i.InvoiceDate >= fromDateParsed);
            }

            if (args.TryGetValue("toDate", out var toDateObj) && toDateObj != null)
            {
                DateTime.TryParse(toDateObj.ToString(), out var toDateParsed);
                toDate = toDateParsed;
                query = query.Where(i => i.InvoiceDate <= toDateParsed);
            }

            // If no date range provided, default to last 12 months
            if (!fromDate.HasValue && !toDate.HasValue)
            {
                fromDate = DateTime.Now.AddMonths(-12);
                query = query.Where(i => i.InvoiceDate >= fromDate);
            }

            var invoices = await query.ToListAsync(cancellationToken);

            var statistics = new
            {
                period = new
                {
                    fromDate = fromDate?.ToString("yyyy-MM-dd") ?? "התחלת הנתונים",
                    toDate = toDate?.ToString("yyyy-MM-dd") ?? DateTime.Now.ToString("yyyy-MM-dd")
                },
                totals = new
                {
                    invoiceCount = invoices.Count,
                    totalRevenue = invoices.Sum(i => i.TotalAmount),
                    totalPaid = invoices.Sum(i => i.PaidAmount),
                    totalOutstanding = invoices.Sum(i => i.TotalAmount - i.PaidAmount),
                    averageInvoiceAmount = invoices.Any() ? invoices.Average(i => i.TotalAmount) : 0
                },
                byStatus = invoices.GroupBy(i => i.Status).Select(g => new
                {
                    status = g.Key.ToString(),
                    count = g.Count(),
                    amount = g.Sum(i => i.TotalAmount)
                }),
                monthlyBreakdown = invoices
                    .GroupBy(i => new { i.InvoiceDate.Year, i.InvoiceDate.Month })
                    .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                    .Select(g => new
                    {
                        month = $"{g.Key.Year}-{g.Key.Month:D2}",
                        invoiceCount = g.Count(),
                        totalAmount = g.Sum(i => i.TotalAmount),
                        totalPaid = g.Sum(i => i.PaidAmount)
                    }),
                overdue = new
                {
                    count = invoices.Count(i => i.DueDate.HasValue && i.DueDate < DateTime.Now && i.Status != InvoiceStatus.Paid),
                    amount = invoices.Where(i => i.DueDate.HasValue && i.DueDate < DateTime.Now && i.Status != InvoiceStatus.Paid)
                        .Sum(i => i.TotalAmount - i.PaidAmount)
                }
            };

            return new FunctionResult
            {
                FunctionName = "getInvoicesStatistics",
                IsSuccess = true,
                Result = JsonSerializer.Serialize(statistics, new JsonSerializerOptions { WriteIndented = true })
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invoices statistics");
            return new FunctionResult
            {
                FunctionName = "getInvoicesStatistics",
                IsSuccess = false,
                ErrorMessage = "שגיאה בקבלת סטטיסטיקות החשבוניות"
            };
        }
    }

    /// <summary>
    /// Get overdue invoices
    /// </summary>
    private async Task<FunctionResult> GetOverdueInvoicesAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            var args = JsonSerializer.Deserialize<Dictionary<string, object>>(arguments) ?? new();
            
            var minDaysOverdue = 1;
            if (args.TryGetValue("minDaysOverdue", out var minDaysObj) && minDaysObj != null)
            {
                int.TryParse(minDaysObj.ToString(), out minDaysOverdue);
            }

            var cutoffDate = DateTime.Now.AddDays(-minDaysOverdue);

            var query = _context.Invoices
                .Include(i => i.Customer)
                .Where(i => i.CompanyId == companyId && !i.IsDeleted)
                .Where(i => i.DueDate.HasValue && i.DueDate < cutoffDate)
                .Where(i => i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled)
                .Where(i => i.TotalAmount > i.PaidAmount);

            // Filter by minimum amount if provided
            if (args.TryGetValue("minAmount", out var minAmountObj) && minAmountObj != null)
            {
                if (decimal.TryParse(minAmountObj.ToString(), out var minAmount))
                {
                    query = query.Where(i => (i.TotalAmount - i.PaidAmount) >= minAmount);
                }
            }

            var overdueInvoices = await query
                .OrderBy(i => i.DueDate)
                .Select(i => new
                {
                    i.Id,
                    i.InvoiceNumber,
                    i.InvoiceDate,
                    i.DueDate,
                    DaysOverdue = (int)(DateTime.Now - i.DueDate!.Value).TotalDays,
                    CustomerName = i.Customer.Name,
                    i.Customer.Email,
                    i.Customer.Phone,
                    i.TotalAmount,
                    i.PaidAmount,
                    OutstandingAmount = i.TotalAmount - i.PaidAmount,
                    i.Currency
                })
                .ToListAsync(cancellationToken);

            var result = new
            {
                overdueInvoices,
                summary = new
                {
                    totalCount = overdueInvoices.Count,
                    totalOutstanding = overdueInvoices.Sum(i => i.OutstandingAmount),
                    averageDaysOverdue = overdueInvoices.Any() ? overdueInvoices.Average(i => i.DaysOverdue) : 0
                }
            };

            return new FunctionResult
            {
                FunctionName = "getOverdueInvoices",
                IsSuccess = true,
                Result = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true })
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting overdue invoices");
            return new FunctionResult
            {
                FunctionName = "getOverdueInvoices",
                IsSuccess = false,
                ErrorMessage = "שגיאה בקבלת חשבוניות באיחור"
            };
        }
    }

    /// <summary>
    /// Get invoice payments
    /// </summary>
    private async Task<FunctionResult> GetInvoicePaymentsAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            var args = JsonSerializer.Deserialize<Dictionary<string, object>>(arguments) ?? new();
            
            if (!args.TryGetValue("invoiceId", out var invoiceIdObj) || 
                !int.TryParse(invoiceIdObj.ToString(), out var invoiceId))
            {
                return new FunctionResult
                {
                    FunctionName = "getInvoicePayments",
                    IsSuccess = false,
                    ErrorMessage = "חסר מזהה חשבונית חוקי"
                };
            }

            // Verify invoice exists and belongs to company
            var invoiceExists = await _context.Invoices
                .AnyAsync(i => i.Id == invoiceId && i.CompanyId == companyId && !i.IsDeleted, cancellationToken);

            if (!invoiceExists)
            {
                return new FunctionResult
                {
                    FunctionName = "getInvoicePayments",
                    IsSuccess = false,
                    ErrorMessage = $"חשבונית עם מזהה {invoiceId} לא נמצאה"
                };
            }

            var payments = await _invoiceService.GetInvoiceReceiptsAsync(invoiceId, companyId, cancellationToken);

            var result = new
            {
                invoiceId,
                payments = payments.Select(p => new
                {
                    p.Id,
                    p.ReceiptNumber,
                    p.PaymentDate,
                    p.Amount,
                    p.PaymentMethod,
                    p.ReferenceNumber,
                    p.Notes,
                    p.Currency,
                    p.CreatedAt
                }),
                summary = new
                {
                    totalPayments = payments.Count(),
                    totalPaid = payments.Sum(p => p.Amount)
                }
            };

            return new FunctionResult
            {
                FunctionName = "getInvoicePayments",
                IsSuccess = true,
                Result = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true })
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invoice payments");
            return new FunctionResult
            {
                FunctionName = "getInvoicePayments",
                IsSuccess = false,
                ErrorMessage = "שגיאה בקבלת תשלומי החשבונית"
            };
        }
    }

    /// <summary>
    /// Create new invoice
    /// </summary>
    private async Task<FunctionResult> CreateInvoiceAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            var args = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(arguments) ?? new();
            
            if (!args.TryGetValue("customerId", out var customerIdElement) || 
                !customerIdElement.TryGetInt32(out var customerId))
            {
                return new FunctionResult
                {
                    FunctionName = "createInvoice",
                    IsSuccess = false,
                    ErrorMessage = "חסר מזהה לקוח חוקי"
                };
            }

            // Verify customer exists
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == customerId && c.CompanyId == companyId && !c.IsDeleted, cancellationToken);

            if (customer == null)
            {
                return new FunctionResult
                {
                    FunctionName = "createInvoice",
                    IsSuccess = false,
                    ErrorMessage = $"לקוח עם מזהה {customerId} לא נמצא"
                };
            }

            // Parse lines
            if (!args.TryGetValue("lines", out var linesElement) || linesElement.ValueKind != JsonValueKind.Array)
            {
                return new FunctionResult
                {
                    FunctionName = "createInvoice",
                    IsSuccess = false,
                    ErrorMessage = "חובה לספק שורות לחשבונית"
                };
            }

            var lines = new List<CreateInvoiceLineRequest>();
            foreach (var lineElement in linesElement.EnumerateArray())
            {
                if (lineElement.ValueKind != JsonValueKind.Object) continue;

                var lineObj = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(lineElement.GetRawText()) ?? new();
                
                if (!lineObj.TryGetValue("description", out var descElement) || 
                    !lineObj.TryGetValue("quantity", out var qtyElement) ||
                    !lineObj.TryGetValue("unitPrice", out var priceElement))
                {
                    continue;
                }

                var line = new CreateInvoiceLineRequest
                {
                    Description = descElement.GetString() ?? "",
                    Quantity = qtyElement.TryGetDecimal(out var qty) ? qty : 0,
                    UnitPrice = priceElement.TryGetDecimal(out var price) ? price : 0,
                    DiscountPercent = lineObj.TryGetValue("discountPercent", out var discountElement) && 
                                    discountElement.TryGetDecimal(out var discount) ? discount : 0,
                    TaxRate = lineObj.TryGetValue("taxRate", out var taxElement) && 
                            taxElement.TryGetDecimal(out var tax) ? tax : 17,
                    LineNumber = lines.Count + 1
                };

                if (lineObj.TryGetValue("itemId", out var itemIdElement) && itemIdElement.TryGetInt32(out var itemId))
                {
                    line.ItemId = itemId;
                }

                lines.Add(line);
            }

            if (!lines.Any())
            {
                return new FunctionResult
                {
                    FunctionName = "createInvoice",
                    IsSuccess = false,
                    ErrorMessage = "לא נמצאו שורות חוקיות לחשבונית"
                };
            }

            // Create invoice request
            var invoiceRequest = new CreateInvoiceRequest
            {
                CustomerId = customerId,
                InvoiceDate = args.TryGetValue("invoiceDate", out var dateElement) && 
                            DateTime.TryParse(dateElement.GetString(), out var invoiceDate) ? 
                            invoiceDate : DateTime.Now,
                Currency = args.TryGetValue("currency", out var currencyElement) ? 
                          currencyElement.GetString() ?? "ILS" : "ILS",
                Notes = args.TryGetValue("notes", out var notesElement) ? 
                       notesElement.GetString() : null,
                Lines = lines
            };

            if (args.TryGetValue("dueDate", out var dueDateElement) && 
                DateTime.TryParse(dueDateElement.GetString(), out var dueDate))
            {
                invoiceRequest.DueDate = dueDate;
            }

            if (args.TryGetValue("salesOrderId", out var salesOrderIdElement) && 
                salesOrderIdElement.TryGetInt32(out var salesOrderId))
            {
                invoiceRequest.SalesOrderId = salesOrderId;
            }

            // Generate invoice number
            var year = invoiceRequest.InvoiceDate.Year;
            var lastInvoice = await _context.Invoices
                .Where(i => i.CompanyId == companyId && i.InvoiceDate.Year == year)
                .OrderByDescending(i => i.InvoiceNumber)
                .FirstOrDefaultAsync(cancellationToken);

            var nextNumber = 1;
            if (lastInvoice != null && int.TryParse(lastInvoice.InvoiceNumber.Split('-').LastOrDefault(), out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }

            var invoiceNumber = $"{year}-{nextNumber:D6}";

            var invoice = new Invoice
            {
                CompanyId = companyId,
                CustomerId = customerId,
                SalesOrderId = invoiceRequest.SalesOrderId,
                InvoiceNumber = invoiceNumber,
                InvoiceDate = invoiceRequest.InvoiceDate,
                DueDate = invoiceRequest.DueDate,
                Status = InvoiceStatus.Draft,
                Currency = invoiceRequest.Currency,
                Notes = invoiceRequest.Notes,
                CustomerName = customer.Name,
                CustomerAddress = customer.Address ?? "",
                CustomerTaxId = customer.TaxId,
                CustomerContact = customer.Contact,
                Lines = new List<InvoiceLine>(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "AI-Assistant",
                UpdatedBy = "AI-Assistant",
                IsDeleted = false
            };

            // Add lines
            decimal subtotal = 0;
            decimal totalTax = 0;

            foreach (var lineRequest in invoiceRequest.Lines)
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
                    LineTotal = netAmount + taxAmount,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = "AI-Assistant",
                    UpdatedBy = "AI-Assistant",
                    IsDeleted = false
                };

                invoice.Lines.Add(line);
                subtotal += netAmount;
                totalTax += taxAmount;
            }

            invoice.SubtotalAmount = subtotal;
            invoice.TaxAmount = totalTax;
            invoice.TotalAmount = subtotal + totalTax;

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync(cancellationToken);

            var result = new
            {
                invoice = new
                {
                    invoice.Id,
                    invoice.InvoiceNumber,
                    invoice.InvoiceDate,
                    invoice.DueDate,
                    invoice.Status,
                    CustomerName = customer.Name,
                    invoice.SubtotalAmount,
                    invoice.TaxAmount,
                    invoice.TotalAmount,
                    invoice.Currency,
                    invoice.Notes
                },
                message = $"חשבונית {invoiceNumber} נוצרה בהצלחה ללקוח {customer.Name}"
            };

            return new FunctionResult
            {
                FunctionName = "createInvoice",
                IsSuccess = true,
                Result = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true })
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invoice");
            return new FunctionResult
            {
                FunctionName = "createInvoice",
                IsSuccess = false,
                ErrorMessage = "שגיאה ביצירת החשבונית"
            };
        }
    }

    /// <summary>
    /// Update invoice status
    /// </summary>
    private async Task<FunctionResult> UpdateInvoiceStatusAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            var args = JsonSerializer.Deserialize<Dictionary<string, object>>(arguments) ?? new();
            
            if (!args.TryGetValue("invoiceId", out var invoiceIdObj) || 
                !int.TryParse(invoiceIdObj.ToString(), out var invoiceId))
            {
                return new FunctionResult
                {
                    FunctionName = "updateInvoiceStatus",
                    IsSuccess = false,
                    ErrorMessage = "חסר מזהה חשבונית חוקי"
                };
            }

            if (!args.TryGetValue("status", out var statusObj) || 
                !Enum.TryParse<InvoiceStatus>(statusObj.ToString(), out var newStatus))
            {
                return new FunctionResult
                {
                    FunctionName = "updateInvoiceStatus",
                    IsSuccess = false,
                    ErrorMessage = "סטטוס לא חוקי"
                };
            }

            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == invoiceId && i.CompanyId == companyId && !i.IsDeleted, cancellationToken);

            if (invoice == null)
            {
                return new FunctionResult
                {
                    FunctionName = "updateInvoiceStatus",
                    IsSuccess = false,
                    ErrorMessage = $"חשבונית עם מזהה {invoiceId} לא נמצאה"
                };
            }

            var oldStatus = invoice.Status;
            invoice.Status = newStatus;
            invoice.UpdatedAt = DateTime.UtcNow;
            invoice.UpdatedBy = "AI-Assistant";

            await _context.SaveChangesAsync(cancellationToken);

            var result = new
            {
                invoiceId,
                invoiceNumber = invoice.InvoiceNumber,
                oldStatus = oldStatus.ToString(),
                newStatus = newStatus.ToString(),
                message = $"סטטוס חשבונית {invoice.InvoiceNumber} עודכן מ{oldStatus} ל{newStatus}"
            };

            return new FunctionResult
            {
                FunctionName = "updateInvoiceStatus",
                IsSuccess = true,
                Result = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true })
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating invoice status");
            return new FunctionResult
            {
                FunctionName = "updateInvoiceStatus",
                IsSuccess = false,
                ErrorMessage = "שגיאה בעדכון סטטוס החשבונית"
            };
        }
    }

    /// <summary>
    /// Process invoice payment
    /// </summary>
    private async Task<FunctionResult> ProcessInvoicePaymentAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            var args = JsonSerializer.Deserialize<Dictionary<string, object>>(arguments) ?? new();
            
            if (!args.TryGetValue("invoiceId", out var invoiceIdObj) || 
                !int.TryParse(invoiceIdObj.ToString(), out var invoiceId))
            {
                return new FunctionResult
                {
                    FunctionName = "processInvoicePayment",
                    IsSuccess = false,
                    ErrorMessage = "חסר מזהה חשבונית חוקי"
                };
            }

            if (!args.TryGetValue("amount", out var amountObj) || 
                !decimal.TryParse(amountObj.ToString(), out var amount))
            {
                return new FunctionResult
                {
                    FunctionName = "processInvoicePayment",
                    IsSuccess = false,
                    ErrorMessage = "חסר סכום תשלום חוקי"
                };
            }

            if (!args.TryGetValue("paymentMethod", out var paymentMethodObj) || 
                string.IsNullOrWhiteSpace(paymentMethodObj.ToString()))
            {
                return new FunctionResult
                {
                    FunctionName = "processInvoicePayment",
                    IsSuccess = false,
                    ErrorMessage = "חסר אמצעי תשלום"
                };
            }

            var paymentMethod = paymentMethodObj.ToString()!;
            var referenceNumber = args.TryGetValue("referenceNumber", out var refObj) ? refObj.ToString() : null;
            var notes = args.TryGetValue("notes", out var notesObj) ? notesObj.ToString() : null;

            // Process the payment using the invoice service
            var receipt = await _invoiceService.ProcessPaymentAsync(
                invoiceId, amount, paymentMethod, companyId, "AI-Assistant", notes, referenceNumber, cancellationToken);

            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .FirstOrDefaultAsync(i => i.Id == invoiceId && i.CompanyId == companyId, cancellationToken);

            var result = new
            {
                payment = new
                {
                    receipt.Id,
                    receipt.ReceiptNumber,
                    receipt.PaymentDate,
                    receipt.Amount,
                    receipt.PaymentMethod,
                    receipt.ReferenceNumber,
                    receipt.Notes
                },
                invoice = new
                {
                    invoice!.Id,
                    invoice.InvoiceNumber,
                    CustomerName = invoice.Customer.Name,
                    invoice.TotalAmount,
                    invoice.PaidAmount,
                    RemainingAmount = invoice.TotalAmount - invoice.PaidAmount,
                    invoice.Status
                },
                message = $"תשלום של {amount:C} עובד בהצלחה לחשבונית {invoice.InvoiceNumber}. קבלה מספר: {receipt.ReceiptNumber}"
            };

            return new FunctionResult
            {
                FunctionName = "processInvoicePayment",
                IsSuccess = true,
                Result = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true })
            };
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation processing invoice payment");
            return new FunctionResult
            {
                FunctionName = "processInvoicePayment",
                IsSuccess = false,
                ErrorMessage = ex.Message
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing invoice payment");
            return new FunctionResult
            {
                FunctionName = "processInvoicePayment",
                IsSuccess = false,
                ErrorMessage = "שגיאה בעיבוד התשלום"
            };
        }
    }
}

// Request DTOs for invoice creation (matching the existing ones in the controller)
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
