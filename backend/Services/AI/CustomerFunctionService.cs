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
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה (CompanyId) לקבלת לקוחות"
                        },
                        isActiveOnly = new
                        {
                            Type = "boolean",
                            Description = "האם להחזיר רק לקוחות פעילים (true) או כולם (false). ברירת מחדל: true"
                        }
                    },
                    Required = new[] { "companyId" }
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
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        }
                    },
                    Required = new[] { "customerId", "companyId" }
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
                        searchTerm = new
                        {
                            Type = "string",
                            Description = "מונח החיפוש - שם, מספר זהות, אימייל או טלפון"
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
                Name = "getCustomerFinancialSummary",
                Description = "סיכום פיננסי ללקוח - מחזיר סיכום של חובות, זכויות והיסטוריית תשלומים",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        }
                    },
                    Required = new[] { "customerId", "companyId" }
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
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
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
                    Required = new[] { "customerId", "companyId" }
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
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        asOfDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך הדוח (אופציונלי, ברירת מחדל: היום) - פורמט: YYYY-MM-DD"
                        }
                    },
                    Required = new[] { "customerId", "companyId" }
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
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        periodMonths = new
                        {
                            Type = "integer",
                            Description = "תקופה בחודשים לחישוב הסטטיסטיקה (ברירת מחדל: 12)"
                        }
                    },
                    Required = new[] { "customerId", "companyId" }
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
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        topCount = new
                        {
                            Type = "integer",
                            Description = "מספר לקוחות מובילים להחזיר (ברירת מחדל: 10, מקסימום: 50)"
                        },
                        periodMonths = new
                        {
                            Type = "integer",
                            Description = "תקופה בחודשים לחישוב ההכנסות (ברירת מחדל: 12)"
                        }
                    },
                    Required = new[] { "companyId" }
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
                Name = "createCustomer",
                Description = "יצירת לקוח חדש - יוצר לקוח חדש במערכת עם הפרטים הנדרשים",
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
                        name = new
                        {
                            Type = "string",
                            Description = "שם הלקוח (חובה)"
                        },
                        taxId = new
                        {
                            Type = "string",
                            Description = "מספר זהות/ח.פ (אופציונלי)"
                        },
                        email = new
                        {
                            Type = "string",
                            Description = "כתובת אימייל (אופציונלי)"
                        },
                        phone = new
                        {
                            Type = "string",
                            Description = "מספר טלפון (אופציונלי)"
                        },
                        address = new
                        {
                            Type = "string",
                            Description = "כתובת (אופציונלי)"
                        },
                        contactPerson = new
                        {
                            Type = "string",
                            Description = "איש קשר (אופציונלי)"
                        },
                        website = new
                        {
                            Type = "string",
                            Description = "אתר אינטרנט (אופציונלי)"
                        },
                        paymentTerms = new
                        {
                            Type = "integer",
                            Description = "תנאי תשלום בימים (ברירת מחדל: 30)"
                        },
                        creditLimit = new
                        {
                            Type = "number",
                            Description = "מסגרת אשראי (אופציונלי)"
                        }
                    },
                    Required = new[] { "companyId", "name" }
                }
            },
            new()
            {
                Name = "updateCustomer",
                Description = "עדכון פרטי לקוח - מעדכן פרטים קיימים של לקוח",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח לעדכון"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        name = new
                        {
                            Type = "string",
                            Description = "שם הלקוח (אופציונלי)"
                        },
                        taxId = new
                        {
                            Type = "string",
                            Description = "מספר זהות/ח.פ (אופציונלי)"
                        },
                        email = new
                        {
                            Type = "string",
                            Description = "כתובת אימייל (אופציונלי)"
                        },
                        phone = new
                        {
                            Type = "string",
                            Description = "מספר טלפון (אופציונלי)"
                        },
                        address = new
                        {
                            Type = "string",
                            Description = "כתובת (אופציונלי)"
                        },
                        contactPerson = new
                        {
                            Type = "string",
                            Description = "איש קשר (אופציונלי)"
                        },
                        website = new
                        {
                            Type = "string",
                            Description = "אתר אינטרנט (אופציונלי)"
                        },
                        paymentTerms = new
                        {
                            Type = "integer",
                            Description = "תנאי תשלום בימים (אופציונלי)"
                        },
                        creditLimit = new
                        {
                            Type = "number",
                            Description = "מסגרת אשראי (אופציונלי)"
                        },
                        isActive = new
                        {
                            Type = "boolean",
                            Description = "האם הלקוח פעיל (אופציונלי)"
                        }
                    },
                    Required = new[] { "customerId", "companyId" }
                }
            },
            new()
            {
                Name = "getCustomerCreditStatus",
                Description = "מצב אשראי לקוח - בדיקת מסגרת אשראי, חובות נוכחיים ויתרה זמינה",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        }
                    },
                    Required = new[] { "customerId", "companyId" }
                }
            },
            new()
            {
                Name = "getCustomerOrdersToShip",
                Description = "הזמנות ללקוח שממתינות למשלוח - מחזיר הזמנות מאושרות שטרם נשלחו",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח (אופציונלי - אם ריק מחזיר עבור כל הלקוחות)"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        }
                    },
                    Required = new[] { "companyId" }
                }
            },
            new()
            {
                Name = "getCustomerPopularItems",
                Description = "פריטים פופולריים ללקוח - מחזיר את הפריטים הנרכשים ביותר על ידי הלקוח",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        topCount = new
                        {
                            Type = "integer",
                            Description = "מספר פריטים מובילים להחזיר (ברירת מחדל: 10)"
                        },
                        periodMonths = new
                        {
                            Type = "integer",
                            Description = "תקופה בחודשים לחישוב (ברירת מחדל: 12)"
                        }
                    },
                    Required = new[] { "customerId", "companyId" }
                }
            },
            new()
            {
                Name = "getCustomerContactHistory",
                Description = "היסטוריית קשר עם לקוח - מחזיר רשימת תקשורת קודמת (הערות, שיחות, פגישות)",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        contactType = new
                        {
                            Type = "string",
                            Description = "סוג קשר (phone, email, meeting, note) - אופציונלי"
                        },
                        limit = new
                        {
                            Type = "integer",
                            Description = "מגבלת מספר רשומות (ברירת מחדל: 20)"
                        }
                    },
                    Required = new[] { "customerId", "companyId" }
                }
            },
            new()
            {
                Name = "addCustomerNote",
                Description = "הוספת הערה ללקוח - מוסיף הערה או תיעוד של קשר עם הלקוח",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        note = new
                        {
                            Type = "string",
                            Description = "תוכן הההערה"
                        },
                        contactType = new
                        {
                            Type = "string",
                            Description = "סוג הקשר (phone, email, meeting, note) - ברירת מחדל: note"
                        },
                        userId = new
                        {
                            Type = "integer",
                            Description = "מזהה המשתמש שיוצר ההערה (אופציונלי)"
                        }
                    },
                    Required = new[] { "customerId", "companyId", "note" }
                }
            },
            new()
            {
                Name = "getCustomerPaymentHistory",
                Description = "היסטוריית תשלומים של לקוח - מחזיר את כל התשלומים שהתקבלו מהלקוח",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
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
                        paymentMethod = new
                        {
                            Type = "string",
                            Description = "אמצעי תשלום (Cash, CreditCard, BankTransfer, Check) - אופציונלי"
                        }
                    },
                    Required = new[] { "customerId", "companyId" }
                }
            },
            new()
            {
                Name = "generateCustomerStatement",
                Description = "יצירת דוח חשבון לקוח - מייצר דוח מפורט של כל העסקאות והיתרות",
                Parameters = new
                {
                    Type = "object",
                    Properties = new
                    {
                        customerId = new
                        {
                            Type = "integer",
                            Description = "מזהה הלקוח"
                        },
                        companyId = new
                        {
                            Type = "integer",
                            Description = "מזהה החברה"
                        },
                        fromDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך התחלה - פורמט: YYYY-MM-DD"
                        },
                        toDate = new
                        {
                            Type = "string",
                            Format = "date",
                            Description = "תאריך סיום - פורמט: YYYY-MM-DD"
                        },
                        includeZeroBalance = new
                        {
                            Type = "boolean",
                            Description = "האם לכלול פריטים עם יתרה אפס (ברירת מחדל: false)"
                        }
                    },
                    Required = new[] { "customerId", "companyId", "fromDate", "toDate" }
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
                "createCustomer" => await CreateCustomerAsync(functionCall.Arguments, companyId, cancellationToken),
                "updateCustomer" => await UpdateCustomerAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomerCreditStatus" => await GetCustomerCreditStatusAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomerOrdersToShip" => await GetCustomerOrdersToShipAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomerPopularItems" => await GetCustomerPopularItemsAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomerContactHistory" => await GetCustomerContactHistoryAsync(functionCall.Arguments, companyId, cancellationToken),
                "addCustomerNote" => await AddCustomerNoteAsync(functionCall.Arguments, companyId, cancellationToken),
                "getCustomerPaymentHistory" => await GetCustomerPaymentHistoryAsync(functionCall.Arguments, companyId, cancellationToken),
                "generateCustomerStatement" => await GenerateCustomerStatementAsync(functionCall.Arguments, companyId, cancellationToken),
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

    /// <summary>
    /// Helper method to safely get a required property from JsonElement
    /// </summary>
    private static bool TryGetRequiredProperty<T>(JsonElement root, string propertyName, string functionName, out T value, out FunctionResult? errorResult)
    {
        value = default(T)!;
        errorResult = null;

        if (!root.TryGetProperty(propertyName, out var element))
        {
            errorResult = new FunctionResult
            {
                FunctionName = functionName,
                IsSuccess = false,
                ErrorMessage = $"הפרמטר '{propertyName}' הוא שדה חובה וחסר"
            };
            return false;
        }

        try
        {
            if (typeof(T) == typeof(int))
            {
                value = (T)(object)element.GetInt32();
            }
            else if (typeof(T) == typeof(string))
            {
                var stringValue = element.GetString();
                if (string.IsNullOrWhiteSpace(stringValue))
                {
                    errorResult = new FunctionResult
                    {
                        FunctionName = functionName,
                        IsSuccess = false,
                        ErrorMessage = $"הפרמטר '{propertyName}' לא יכול להיות ריק"
                    };
                    return false;
                }
                value = (T)(object)stringValue;
            }
            else
            {
                // Handle other types as needed
                value = element.Deserialize<T>()!;
            }

            return true;
        }
        catch (Exception)
        {
            errorResult = new FunctionResult
            {
                FunctionName = functionName,
                IsSuccess = false,
                ErrorMessage = $"ערך לא תקין עבור הפרמטר '{propertyName}'"
            };
            return false;
        }
    }

    private async Task<FunctionResult> GetCustomersListAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var isActiveOnly = argumentsDocument.RootElement.TryGetProperty("isActiveOnly", out var activeElement) ? 
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
        var customerId = argumentsDocument.RootElement.GetProperty("customerId").GetInt32();

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
        try
        {
            using var argumentsDocument = JsonDocument.Parse(arguments);
            
            if (!TryGetRequiredProperty<string>(argumentsDocument.RootElement, "searchTerm", "searchCustomers", out var searchTerm, out var errorResult))
            {
                return errorResult!;
            }

            searchTerm = searchTerm.Trim();

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
        catch (JsonException ex)
        {
            return new FunctionResult
            {
                FunctionName = "searchCustomers",
                IsSuccess = false,
                ErrorMessage = $"שגיאה בפרמטרים שנשלחו: {ex.Message}"
            };
        }
        catch (Exception ex)
        {
            return new FunctionResult
            {
                FunctionName = "searchCustomers",
                IsSuccess = false,
                ErrorMessage = $"שגיאה בחיפוש לקוחות: {ex.Message}"
            };
        }
    }

    private async Task<FunctionResult> GetCustomerFinancialSummaryAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var customerId = argumentsDocument.RootElement.GetProperty("customerId").GetInt32();

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
        var customerId = argumentsDocument.RootElement.GetProperty("customerId").GetInt32();
        
        // Parse optional parameters
        DateTime? fromDate = null;
        DateTime? toDate = null;
        int limit = 50;

        if (argumentsDocument.RootElement.TryGetProperty("fromDate", out var fromElement))
        {
            if (DateTime.TryParse(fromElement.GetString(), out var parsedFromDate))
                fromDate = parsedFromDate;
        }

        if (argumentsDocument.RootElement.TryGetProperty("toDate", out var toElement))
        {
            if (DateTime.TryParse(toElement.GetString(), out var parsedToDate))
                toDate = parsedToDate;
        }

        if (argumentsDocument.RootElement.TryGetProperty("limit", out var limitElement))
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
        var customerId = argumentsDocument.RootElement.GetProperty("customerId").GetInt32();
        
        // Parse optional date parameter
        var asOfDate = DateTime.Today;
        if (argumentsDocument.RootElement.TryGetProperty("asOfDate", out var dateElement))
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
        var customerId = argumentsDocument.RootElement.GetProperty("customerId").GetInt32();
        
        // Parse optional period parameter
        var periodMonths = 12;
        if (argumentsDocument.RootElement.TryGetProperty("periodMonths", out var periodElement))
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

        if (argumentsDocument.RootElement.TryGetProperty("topCount", out var countElement))
        {
            topCount = Math.Min(countElement.GetInt32(), 50); // Max 50
        }

        if (argumentsDocument.RootElement.TryGetProperty("periodMonths", out var periodElement))
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

        if (argumentsDocument.RootElement.TryGetProperty("minDaysOverdue", out var daysElement))
        {
            minDaysOverdue = daysElement.GetInt32();
        }

        if (argumentsDocument.RootElement.TryGetProperty("minAmount", out var amountElement))
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

    private async Task<FunctionResult> CreateCustomerAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            using var argumentsDocument = JsonDocument.Parse(arguments);
            var root = argumentsDocument.RootElement;

            // Use TryGetProperty for all properties to avoid KeyNotFoundException
            if (!root.TryGetProperty("name", out var nameElement))
            {
                return new FunctionResult
                {
                    FunctionName = "createCustomer",
                    IsSuccess = false,
                    ErrorMessage = "שם הלקוח הוא שדה חובה - הפרמטר 'name' חסר"
                };
            }

            var name = nameElement.GetString();
            if (string.IsNullOrWhiteSpace(name))
            {
                return new FunctionResult
                {
                    FunctionName = "createCustomer",
                    IsSuccess = false,
                    ErrorMessage = "שם הלקוח הוא שדה חובה"
                };
            }

        var customer = new Customer
        {
            CompanyId = companyId,
            Name = name,
            TaxId = root.TryGetProperty("taxId", out var taxIdElement) ? taxIdElement.GetString() : null,
            Email = root.TryGetProperty("email", out var emailElement) ? emailElement.GetString() : null,
            Phone = root.TryGetProperty("phone", out var phoneElement) ? phoneElement.GetString() : null,
            Address = root.TryGetProperty("address", out var addressElement) ? addressElement.GetString() : null,
            Contact = root.TryGetProperty("contactPerson", out var contactElement) ? contactElement.GetString() : null,
            Website = root.TryGetProperty("website", out var websiteElement) ? websiteElement.GetString() : null,
            PaymentTermsDays = root.TryGetProperty("paymentTerms", out var paymentElement) ? paymentElement.GetInt32() : 30,
            CreditLimit = root.TryGetProperty("creditLimit", out var creditElement) ? creditElement.GetDecimal() : 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync(cancellationToken);

        return new FunctionResult
        {
            FunctionName = "createCustomer",
            IsSuccess = true,
            Result = $"לקוח חדש נוצר בהצלחה: {customer.Name} (מזהה: {customer.Id})"
        };
        }
        catch (JsonException ex)
        {
            return new FunctionResult
            {
                FunctionName = "createCustomer",
                IsSuccess = false,
                ErrorMessage = $"שגיאה בפרמטרים שנשלחו: {ex.Message}"
            };
        }
        catch (Exception ex)
        {
            return new FunctionResult
            {
                FunctionName = "createCustomer",
                IsSuccess = false,
                ErrorMessage = $"שגיאה ביצירת הלקוח: {ex.Message}"
            };
        }
    }

    private async Task<FunctionResult> UpdateCustomerAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            using var argumentsDocument = JsonDocument.Parse(arguments);
            var root = argumentsDocument.RootElement;

            // Check for required customerId parameter
            if (!root.TryGetProperty("customerId", out var customerIdElement))
            {
                return new FunctionResult
                {
                    FunctionName = "updateCustomer",
                    IsSuccess = false,
                    ErrorMessage = "מזהה הלקוח הוא שדה חובה - הפרמטר 'customerId' חסר"
                };
            }

            var customerId = customerIdElement.GetInt32();
        
        var customer = await _context.Customers
            .Where(c => c.Id == customerId && c.CompanyId == companyId)
            .FirstOrDefaultAsync(cancellationToken);

        if (customer == null)
        {
            return new FunctionResult
            {
                FunctionName = "updateCustomer",
                IsSuccess = false,
                ErrorMessage = "לקוח לא נמצא"
            };
        }

        // Update only provided fields
        if (root.TryGetProperty("name", out var nameElement))
            customer.Name = nameElement.GetString() ?? customer.Name;
        if (root.TryGetProperty("taxId", out var taxIdElement))
            customer.TaxId = taxIdElement.GetString();
        if (root.TryGetProperty("email", out var emailElement))
            customer.Email = emailElement.GetString();
        if (root.TryGetProperty("phone", out var phoneElement))
            customer.Phone = phoneElement.GetString();
        if (root.TryGetProperty("address", out var addressElement))
            customer.Address = addressElement.GetString();
        if (root.TryGetProperty("contactPerson", out var contactElement))
            customer.Contact = contactElement.GetString();
        if (root.TryGetProperty("website", out var websiteElement))
            customer.Website = websiteElement.GetString();
        if (root.TryGetProperty("paymentTerms", out var paymentElement))
            customer.PaymentTermsDays = paymentElement.GetInt32();
        if (root.TryGetProperty("creditLimit", out var creditElement))
            customer.CreditLimit = creditElement.GetDecimal();
        if (root.TryGetProperty("isActive", out var activeElement))
            customer.IsActive = activeElement.GetBoolean();

        await _context.SaveChangesAsync(cancellationToken);

        return new FunctionResult
        {
            FunctionName = "updateCustomer",
            IsSuccess = true,
            Result = $"פרטי הלקוח {customer.Name} עודכנו בהצלחה"
        };
        }
        catch (JsonException ex)
        {
            return new FunctionResult
            {
                FunctionName = "updateCustomer",
                IsSuccess = false,
                ErrorMessage = $"שגיאה בפרמטרים שנשלחו: {ex.Message}"
            };
        }
        catch (Exception ex)
        {
            return new FunctionResult
            {
                FunctionName = "updateCustomer",
                IsSuccess = false,
                ErrorMessage = $"שגיאה בעדכון הלקוח: {ex.Message}"
            };
        }
    }

    private async Task<FunctionResult> GetCustomerCreditStatusAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        try
        {
            using var argumentsDocument = JsonDocument.Parse(arguments);
            
            if (!TryGetRequiredProperty<int>(argumentsDocument.RootElement, "customerId", "getCustomerCreditStatus", out var customerId, out var errorResult))
            {
                return errorResult!;
            }

        var customer = await _context.Customers
            .Where(c => c.Id == customerId && c.CompanyId == companyId)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.CreditLimit,
                OutstandingInvoices = c.Invoices
                    .Where(i => !i.IsDeleted && i.Status != InvoiceStatus.Paid)
                    .Sum(i => i.TotalAmount),
                OverdueAmount = c.Invoices
                    .Where(i => !i.IsDeleted && i.Status != InvoiceStatus.Paid && i.DueDate < DateTime.UtcNow)
                    .Sum(i => i.TotalAmount)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (customer == null)
        {
            return new FunctionResult
            {
                FunctionName = "getCustomerCreditStatus",
                IsSuccess = false,
                ErrorMessage = "לקוח לא נמצא"
            };
        }

        var availableCredit = customer.CreditLimit - customer.OutstandingInvoices;
        var creditStatus = availableCredit >= 0 ? "תקין" : "חריגה ממסגרת";

        var result = JsonSerializer.Serialize(new
        {
            CustomerId = customer.Id,
            CustomerName = customer.Name,
            CreditLimit = customer.CreditLimit,
            OutstandingAmount = customer.OutstandingInvoices,
            OverdueAmount = customer.OverdueAmount,
            AvailableCredit = Math.Max(0, availableCredit),
            CreditStatus = creditStatus,
            IsOverLimit = availableCredit < 0
        }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        return new FunctionResult
        {
            FunctionName = "getCustomerCreditStatus",
            IsSuccess = true,
            Result = $"מצב אשראי עבור {customer.Name}:\n{result}"
        };
        }
        catch (JsonException ex)
        {
            return new FunctionResult
            {
                FunctionName = "getCustomerCreditStatus",
                IsSuccess = false,
                ErrorMessage = $"שגיאה בפרמטרים שנשלחו: {ex.Message}"
            };
        }
        catch (Exception ex)
        {
            return new FunctionResult
            {
                FunctionName = "getCustomerCreditStatus",
                IsSuccess = false,
                ErrorMessage = $"שגיאה בקבלת מצב אשראי: {ex.Message}"
            };
        }
    }

    private async Task<FunctionResult> GetCustomerOrdersToShipAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var root = argumentsDocument.RootElement;
        
        var customerId = root.TryGetProperty("customerId", out var customerElement) ? 
            customerElement.GetInt32() : (int?)null;

        var query = _context.SalesOrders
            .Where(so => so.CompanyId == companyId && !so.IsDeleted)
            .Where(so => so.Status == SalesOrderStatus.Confirmed);

        if (customerId.HasValue)
        {
            query = query.Where(so => so.CustomerId == customerId.Value);
        }

        var ordersToShip = await query
            .Include(so => so.Customer)
            .Include(so => so.Lines)
                .ThenInclude(sl => sl.Item)
            .Select(so => new
            {
                so.Id,
                so.OrderNumber,
                so.OrderDate,
                so.Status,
                StatusText = so.Status.ToString(),
                Customer = new { so.Customer.Id, so.Customer.Name },
                TotalAmount = so.TotalAmount,
                ItemsCount = so.Lines.Count,
                Items = so.Lines.Select(sl => new
                {
                    sl.Item.Name,
                    sl.Quantity,
                    sl.UnitPrice
                })
            })
            .OrderBy(so => so.OrderDate)
            .ToListAsync(cancellationToken);

        var result = JsonSerializer.Serialize(new
        {
            TotalOrders = ordersToShip.Count,
            TotalValue = ordersToShip.Sum(o => o.TotalAmount),
            Orders = ordersToShip
        }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        return new FunctionResult
        {
            FunctionName = "getCustomerOrdersToShip",
            IsSuccess = true,
            Result = $"הזמנות ממתינות למשלוח:\n{result}"
        };
    }

    private async Task<FunctionResult> GetCustomerPopularItemsAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var root = argumentsDocument.RootElement;
        
        var customerId = root.GetProperty("CustomerId").GetInt32();
        var topCount = root.TryGetProperty("TopCount", out var topElement) ? topElement.GetInt32() : 10;
        var periodMonths = root.TryGetProperty("PeriodMonths", out var periodElement) ? periodElement.GetInt32() : 12;

        var fromDate = DateTime.UtcNow.AddMonths(-periodMonths);

        var popularItems = await _context.SalesOrderLines
            .Include(sl => sl.SalesOrder)
            .Include(sl => sl.Item)
            .Where(sl => sl.SalesOrder.CompanyId == companyId 
                      && sl.SalesOrder.CustomerId == customerId
                      && !sl.SalesOrder.IsDeleted
                      && sl.SalesOrder.OrderDate >= fromDate)
            .GroupBy(sl => new { sl.ItemId, sl.Item.Name, sl.Item.SKU })
            .Select(g => new
            {
                ItemId = g.Key.ItemId,
                ItemName = g.Key.Name,
                ItemSKU = g.Key.SKU,
                TotalQuantity = g.Sum(sl => sl.Quantity),
                TotalValue = g.Sum(sl => sl.LineTotal),
                OrderCount = g.Select(sl => sl.SalesOrderId).Distinct().Count(),
                AveragePrice = g.Average(sl => sl.UnitPrice)
            })
            .OrderByDescending(item => item.TotalQuantity)
            .Take(topCount)
            .ToListAsync(cancellationToken);

        var customer = await _context.Customers
            .Where(c => c.Id == customerId && c.CompanyId == companyId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync(cancellationToken);

        var result = JsonSerializer.Serialize(new
        {
            CustomerId = customerId,
            CustomerName = customer,
            PeriodMonths = periodMonths,
            PopularItems = popularItems
        }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        return new FunctionResult
        {
            FunctionName = "getCustomerPopularItems",
            IsSuccess = true,
            Result = $"פריטים פופולריים עבור {customer}:\n{result}"
        };
    }

    private Task<FunctionResult> GetCustomerContactHistoryAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        // Note: This would require a CustomerContacts or Notes table to be implemented
        // For now, return a placeholder response
        return Task.FromResult(new FunctionResult
        {
            FunctionName = "getCustomerContactHistory",
            IsSuccess = false,
            ErrorMessage = "פונקציה זו דורשת יישום טבלת הערות/קשרים במערכת"
        });
    }

    private Task<FunctionResult> AddCustomerNoteAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        // Note: This would require a CustomerNotes table to be implemented
        // For now, return a placeholder response
        return Task.FromResult(new FunctionResult
        {
            FunctionName = "addCustomerNote",
            IsSuccess = false,
            ErrorMessage = "פונקציה זו דורשת יישום טבלת הערות במערכת"
        });
    }

    private async Task<FunctionResult> GetCustomerPaymentHistoryAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var root = argumentsDocument.RootElement;
        
        var customerId = root.GetProperty("CustomerId").GetInt32();
        var fromDate = root.TryGetProperty("FromDate", out var fromElement) && !string.IsNullOrEmpty(fromElement.GetString()) ? 
            DateTime.Parse(fromElement.GetString()!) : DateTime.UtcNow.AddYears(-1);
        var toDate = root.TryGetProperty("ToDate", out var toElement) && !string.IsNullOrEmpty(toElement.GetString()) ? 
            DateTime.Parse(toElement.GetString()!) : DateTime.UtcNow;
        var paymentMethod = root.TryGetProperty("PaymentMethod", out var methodElement) ? 
            methodElement.GetString() : null;

        var query = _context.Receipts
            .Include(r => r.Invoice)
            .Where(r => r.CompanyId == companyId 
                     && r.Invoice.CustomerId == customerId
                     && !r.IsDeleted
                     && r.PaymentDate >= fromDate 
                     && r.PaymentDate <= toDate);

        if (!string.IsNullOrEmpty(paymentMethod))
        {
            query = query.Where(r => r.PaymentMethod == paymentMethod);
        }

        var payments = await query
            .Select(r => new
            {
                r.Id,
                r.PaymentDate,
                r.Amount,
                r.PaymentMethod,
                r.ReferenceNumber,
                InvoiceNumber = r.Invoice.InvoiceNumber,
                r.Invoice.TotalAmount
            })
            .OrderByDescending(r => r.PaymentDate)
            .ToListAsync(cancellationToken);

        var customer = await _context.Customers
            .Where(c => c.Id == customerId && c.CompanyId == companyId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync(cancellationToken);

        var result = JsonSerializer.Serialize(new
        {
            CustomerId = customerId,
            CustomerName = customer,
            Period = new { From = fromDate.ToString("yyyy-MM-dd"), To = toDate.ToString("yyyy-MM-dd") },
            PaymentMethod = paymentMethod ?? "כל האמצעים",
            TotalPayments = payments.Count,
            TotalAmount = payments.Sum(p => p.Amount),
            Payments = payments
        }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        return new FunctionResult
        {
            FunctionName = "getCustomerPaymentHistory",
            IsSuccess = true,
            Result = $"היסטוריית תשלומים עבור {customer}:\n{result}"
        };
    }

    private async Task<FunctionResult> GenerateCustomerStatementAsync(string arguments, int companyId, CancellationToken cancellationToken)
    {
        using var argumentsDocument = JsonDocument.Parse(arguments);
        var root = argumentsDocument.RootElement;
        
        var customerId = root.GetProperty("CustomerId").GetInt32();
        var fromDate = DateTime.Parse(root.GetProperty("FromDate").GetString()!);
        var toDate = DateTime.Parse(root.GetProperty("ToDate").GetString()!);
        var includeZeroBalance = root.TryGetProperty("IncludeZeroBalance", out var zeroElement) ? 
            zeroElement.GetBoolean() : false;

        var customer = await _context.Customers
            .Where(c => c.Id == customerId && c.CompanyId == companyId)
            .FirstOrDefaultAsync(cancellationToken);

        if (customer == null)
        {
            return new FunctionResult
            {
                FunctionName = "generateCustomerStatement",
                IsSuccess = false,
                ErrorMessage = "לקוח לא נמצא"
            };
        }

        // Get invoices in period
        var invoices = await _context.Invoices
            .Where(i => i.CompanyId == companyId 
                     && i.CustomerId == customerId
                     && !i.IsDeleted
                     && i.InvoiceDate >= fromDate 
                     && i.InvoiceDate <= toDate)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                i.InvoiceDate,
                i.DueDate,
                i.TotalAmount,
                Status = i.Status.ToString(),
                PaidAmount = i.Receipts.Where(r => !r.IsDeleted).Sum(r => r.Amount),
                Balance = i.TotalAmount - i.Receipts.Where(r => !r.IsDeleted).Sum(r => r.Amount)
            })
            .ToListAsync(cancellationToken);

        if (!includeZeroBalance)
        {
            invoices = invoices.Where(i => i.Balance != 0).ToList();
        }

        // Get payments in period
        var payments = await _context.Receipts
            .Include(r => r.Invoice)
            .Where(r => r.CompanyId == companyId 
                     && r.Invoice.CustomerId == customerId
                     && !r.IsDeleted
                     && r.PaymentDate >= fromDate 
                     && r.PaymentDate <= toDate)
            .Select(r => new
            {
                r.PaymentDate,
                r.Amount,
                r.PaymentMethod,
                r.ReferenceNumber,
                InvoiceNumber = r.Invoice.InvoiceNumber
            })
            .ToListAsync(cancellationToken);

        var statement = new
        {
            Customer = new
            {
                customer.Id,
                customer.Name,
                customer.Email,
                customer.Phone,
                customer.Address
            },
            Period = new
            {
                From = fromDate.ToString("yyyy-MM-dd"),
                To = toDate.ToString("yyyy-MM-dd")
            },
            Summary = new
            {
                TotalInvoiced = invoices.Sum(i => i.TotalAmount),
                TotalPaid = payments.Sum(p => p.Amount),
                OutstandingBalance = invoices.Sum(i => i.Balance),
                InvoiceCount = invoices.Count,
                PaymentCount = payments.Count
            },
            Invoices = invoices.OrderBy(i => i.InvoiceDate),
            Payments = payments.OrderBy(p => p.PaymentDate)
        };

        var result = JsonSerializer.Serialize(statement, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });

        return new FunctionResult
        {
            FunctionName = "generateCustomerStatement",
            IsSuccess = true,
            Result = $"דוח חשבון לקוח עבור {customer.Name}:\n{result}"
        };
    }
}
