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
}
