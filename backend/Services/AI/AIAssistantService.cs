using backend.DTOs.AI;
using backend.Models.AI;
using backend.Services.Interfaces;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace backend.Services.AI;

/// <summary>
/// AI Assistant service implementation using OpenAI and Azure Bot Service with function calling
/// </summary>
public class AIAssistantService : IAIAssistantService
{
    private readonly AccountingDbContext _context;
    private readonly IOpenAIService _openAIService;
    private readonly ICustomerFunctionService _customerFunctionService;
    private readonly ILogger<AIAssistantService> _logger;

    public AIAssistantService(
        AccountingDbContext context,
        IOpenAIService openAIService,
        ICustomerFunctionService customerFunctionService,
        ILogger<AIAssistantService> logger)
    {
        _context = context;
        _openAIService = openAIService;
        _customerFunctionService = customerFunctionService;
        _logger = logger;
    }

    public async Task<ChatResponse> SendMessageAsync(
        ChatRequest request, 
        int companyId, 
        int? userId = null, 
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;
        
        try
        {
            // Check if AI assistant is available for this company
            if (!await IsAvailableAsync(companyId, cancellationToken))
            {
                return new ChatResponse
                {
                    IsSuccess = false,
                    ErrorMessage = "מגבלת השימוש היומית הגיעה לקצה. אנא נסה שוב מחר.",
                    SessionId = request.SessionId ?? Guid.NewGuid().ToString()
                };
            }

            // Get or create session ID
            var sessionId = request.SessionId ?? Guid.NewGuid().ToString();

            // Get AI configuration for the company
            var config = await GetConfigAsync(companyId, cancellationToken);

            // Save user message to database
            var userMessage = new ChatMessage
            {
                CompanyId = companyId,
                SessionId = sessionId,
                Content = request.Message,
                Role = "user",
                UserId = userId,
                EntityType = request.Context?.EntityType,
                EntityId = request.Context?.EntityId,
                Context = request.Context != null ? JsonSerializer.Serialize(request.Context) : null
            };

            _context.Set<ChatMessage>().Add(userMessage);

            // Build conversation context
            var messages = await BuildConversationContextAsync(sessionId, companyId, request, config, cancellationToken);

            // Get available functions for this context
            var availableFunctions = GetAvailableFunctions(request.Context);

            // Get AI response with function calling
            var aiResponse = await _openAIService.GetChatCompletionWithFunctionsAsync(
                messages,
                availableFunctions,
                config.OpenAIModel,
                config.MaxTokens,
                config.Temperature,
                cancellationToken);

            if (!aiResponse.IsSuccess)
            {
                return new ChatResponse
                {
                    IsSuccess = false,
                    ErrorMessage = "שגיאה בתקשורת עם שירות ה-AI. אנא נסה שוב.",
                    SessionId = sessionId
                };
            }

            var responseTime = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;
            string finalContent = aiResponse.Content;

            // Handle function calls if needed
            if (aiResponse.RequiresFunctionExecution && aiResponse.FunctionCalls.Any())
            {
                var functionResults = new List<FunctionResult>();
                
                foreach (var functionCall in aiResponse.FunctionCalls)
                {
                    var result = await ExecuteFunctionAsync(functionCall, companyId, cancellationToken);
                    functionResults.Add(result);
                }

                // Create a follow-up request with function results
                var followUpMessages = new List<OpenAIMessage>(messages);
                
                // Add the assistant's function call message  
                foreach (var functionCall in aiResponse.FunctionCalls)
                {
                    followUpMessages.Add(new OpenAIMessage 
                    { 
                        Role = "assistant", 
                        Content = $"מבצע פונקציה: {functionCall.Name}" 
                    });
                }

                // Add function results
                foreach (var result in functionResults)
                {
                    followUpMessages.Add(new OpenAIMessage
                    {
                        Role = "user",
                        Content = $"תוצאות הפונקציה: {(result.IsSuccess ? result.Result : $"שגיאה: {result.ErrorMessage}")}"
                    });
                }

                // Get final response with function results
                var finalResponse = await _openAIService.GetChatCompletionAsync(
                    followUpMessages,
                    config.OpenAIModel,
                    config.MaxTokens,
                    config.Temperature,
                    cancellationToken);

                if (finalResponse.IsSuccess)
                {
                    finalContent = finalResponse.Content;
                }
            }

            // Save assistant message to database
            var assistantMessage = new ChatMessage
            {
                CompanyId = companyId,
                SessionId = sessionId,
                Content = finalContent,
                Role = "assistant",
                ConfidenceScore = aiResponse.ConfidenceScore,
                ResponseTimeMs = responseTime,
                EntityType = request.Context?.EntityType,
                EntityId = request.Context?.EntityId
            };

            _context.Set<ChatMessage>().Add(assistantMessage);

            // Update usage counter
            await UpdateUsageCounterAsync(companyId, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);

            // Generate suggested actions based on context
            var suggestedActions = GenerateSuggestedActions(request.Context, finalContent);

            return new ChatResponse
            {
                Message = finalContent,
                SessionId = sessionId,
                ConfidenceScore = aiResponse.ConfidenceScore,
                ResponseTimeMs = responseTime,
                IsSuccess = true,
                SuggestedActions = suggestedActions
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in AI Assistant service for company {CompanyId}", companyId);
            
            return new ChatResponse
            {
                IsSuccess = false,
                ErrorMessage = "אירעה שגיאה לא צפויה. אנא נסה שוב.",
                SessionId = request.SessionId ?? Guid.NewGuid().ToString()
            };
        }
    }

    public async Task<ChatHistoryResponse> GetChatHistoryAsync(
        ChatHistoryRequest request, 
        int companyId, 
        int? userId = null, 
        CancellationToken cancellationToken = default)
    {
        var query = _context.Set<ChatMessage>()
            .Where(m => m.CompanyId == companyId);

        if (!string.IsNullOrEmpty(request.SessionId))
        {
            query = query.Where(m => m.SessionId == request.SessionId);
        }

        if (userId.HasValue)
        {
            query = query.Where(m => m.UserId == userId.Value || m.Role == "assistant");
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var messages = await query
            .OrderByDescending(m => m.Timestamp)
            .Skip(request.Skip)
            .Take(request.Take)
            .Select(m => new ChatMessageDto
            {
                Id = m.Id,
                Content = m.Content,
                Role = m.Role,
                Timestamp = m.Timestamp,
                ConfidenceScore = m.ConfidenceScore,
                ResponseTimeMs = m.ResponseTimeMs,
                EntityType = m.EntityType,
                EntityId = m.EntityId
            })
            .ToListAsync(cancellationToken);

        // Reverse to show chronological order
        messages.Reverse();

        return new ChatHistoryResponse
        {
            Messages = messages,
            TotalCount = totalCount,
            HasMore = request.Skip + request.Take < totalCount
        };
    }

    public async Task ClearChatHistoryAsync(string sessionId, int companyId, CancellationToken cancellationToken = default)
    {
        var messages = await _context.Set<ChatMessage>()
            .Where(m => m.SessionId == sessionId && m.CompanyId == companyId)
            .ToListAsync(cancellationToken);

        _context.Set<ChatMessage>().RemoveRange(messages);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<AIAssistantConfig> GetConfigAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var config = await _context.Set<AIAssistantConfig>()
            .FirstOrDefaultAsync(c => c.CompanyId == companyId, cancellationToken);

        if (config == null)
        {
            // Create default configuration
            config = new AIAssistantConfig
            {
                CompanyId = companyId,
                IsEnabled = true,
                OpenAIModel = "gpt-4",
                MaxTokens = 1000,
                Temperature = 0.7m,
                DailyUsageLimit = 100,
                SystemPrompt = @"
                    אתה עוזר חכם לחשבונאות עבור עסק ישראלי עם גישה לנתונים בזמן אמת.
                    אתה עוזר עם שאלות פיננסיות, ניתוח נתונים ומשימות חשבונאות כלליות.
                    תמיד תענה בעברית אלא אם מבקשים ממך במפורש להשתמש באנגלית.
                    היה מקצועי, מדויק, תמציתי ומועיל. 

                    יש לך גישה לפונקציות הבאות לקבלת מידע:
                    - getCustomersList: לקבלת רשימת לקוחות
                    - getCustomerDetails: לקבלת פרטי לקוח ספציפי
                    - searchCustomers: לחיפוש לקוחות לפי שם או פרטים
                    - getCustomerFinancialSummary: לקבלת סיכום פיננסי של לקוח

                    כאשר המשתמש שואל על לקוחות, חובות, או פרטים פיננסיים - השתמש בפונקציות המתאימות כדי לספק מידע מדויק ועדכני.
                    
                    אם אתה לא בטוח לגבי תקנות מס ספציפיות, המלץ להתייעץ עם רואה חשבון מוסמך.
                    תמיד ציין מקורות אמינים כשאתה נותן מידע על תקנות או חוקים.
                    
                    כשאתה מקבל נתונים מהפונקציות, ארגן אותם בצורה ברורה וקריאה למשתמש.
                "
            };

            _context.Set<AIAssistantConfig>().Add(config);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return config;
    }

    public async Task UpdateConfigAsync(AIAssistantConfig config, CancellationToken cancellationToken = default)
    {
        config.UpdatedAt = DateTime.UtcNow;
        _context.Set<AIAssistantConfig>().Update(config);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> IsAvailableAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var config = await GetConfigAsync(companyId, cancellationToken);
        
        if (!config.IsEnabled)
            return false;

        // Reset daily usage if it's a new day
        if (config.LastUsageReset.Date < DateTime.UtcNow.Date)
        {
            config.CurrentDailyUsage = 0;
            config.LastUsageReset = DateTime.UtcNow.Date;
            await UpdateConfigAsync(config, cancellationToken);
        }

        return config.CurrentDailyUsage < config.DailyUsageLimit;
    }

    public async Task<string> GenerateReportAsync(
        string reportType, 
        int companyId, 
        Dictionary<string, object>? parameters = null, 
        CancellationToken cancellationToken = default)
    {
        // This would integrate with the reporting system to get actual data
        // For now, returning a placeholder
        var prompt = $"צור דוח {reportType} עבור החברה. פרמטרים: {JsonSerializer.Serialize(parameters ?? new())}";
        
        var messages = new List<OpenAIMessage>
        {
            new() { Role = "system", Content = "אתה עוזר לחשבונאות המתמחה ביצירת דוחות פיננסיים." },
            new() { Role = "user", Content = prompt }
        };

        var response = await _openAIService.GetChatCompletionAsync(messages, cancellationToken: cancellationToken);
        return response.Content;
    }

    private async Task<List<OpenAIMessage>> BuildConversationContextAsync(
        string sessionId, 
        int companyId, 
        ChatRequest request, 
        AIAssistantConfig config,
        CancellationToken cancellationToken)
    {
        var messages = new List<OpenAIMessage>
        {
            new() { Role = "system", Content = config.SystemPrompt }
        };

        // Add recent conversation history (last 10 messages)
        var recentMessages = await _context.Set<ChatMessage>()
            .Where(m => m.SessionId == sessionId && m.CompanyId == companyId)
            .OrderByDescending(m => m.Timestamp)
            .Take(10)
            .OrderBy(m => m.Timestamp)
            .ToListAsync(cancellationToken);

        foreach (var msg in recentMessages)
        {
            messages.Add(new OpenAIMessage
            {
                Role = msg.Role,
                Content = msg.Content
            });
        }

        // Add context-specific information
        if (request.Context != null)
        {
            var contextInfo = await BuildContextInformation(request.Context, companyId, cancellationToken);
            if (!string.IsNullOrEmpty(contextInfo))
            {
                messages.Add(new OpenAIMessage
                {
                    Role = "system",
                    Content = $"מידע נוסף על ההקשר הנוכחי: {contextInfo}"
                });
            }
        }

        // Add current user message
        messages.Add(new OpenAIMessage
        {
            Role = "user",
            Content = request.Message
        });

        return messages;
    }

    private async Task<string> BuildContextInformation(ChatContext context, int companyId, CancellationToken cancellationToken)
    {
        var contextInfo = new List<string>();

        if (!string.IsNullOrEmpty(context.CurrentModule))
        {
            contextInfo.Add($"המשתמש נמצא במודול: {context.CurrentModule}");
        }

        if (!string.IsNullOrEmpty(context.EntityType) && context.EntityId.HasValue)
        {
            // Here you would fetch specific entity information based on type and ID
            // For example, if EntityType is "Invoice", fetch invoice details
            contextInfo.Add($"מתייחס ל{context.EntityType} מספר {context.EntityId}");
        }

        if (!string.IsNullOrEmpty(context.UserRole))
        {
            contextInfo.Add($"תפקיד המשתמש: {context.UserRole}");
        }

        return string.Join(". ", contextInfo);
    }

    private async Task UpdateUsageCounterAsync(int companyId, CancellationToken cancellationToken)
    {
        var config = await _context.Set<AIAssistantConfig>()
            .FirstOrDefaultAsync(c => c.CompanyId == companyId, cancellationToken);

        if (config != null)
        {
            config.CurrentDailyUsage++;
            config.UpdatedAt = DateTime.UtcNow;
            _context.Set<AIAssistantConfig>().Update(config);
        }
    }

    private List<SuggestedAction> GenerateSuggestedActions(ChatContext? context, string aiResponse)
    {
        var actions = new List<SuggestedAction>();

        // Generate context-aware suggestions based on the current module and AI response
        if (context?.CurrentModule == "invoices" && aiResponse.Contains("חשבונית"))
        {
            actions.Add(new SuggestedAction
            {
                Title = "צור חשבונית חדשה",
                Description = "עבור ליצירת חשבונית חדשה",
                ActionType = "navigate",
                Url = "/invoices/create"
            });
        }

        if (context?.CurrentModule == "customers" && aiResponse.Contains("לקוח"))
        {
            actions.Add(new SuggestedAction
            {
                Title = "הוסף לקוח חדש",
                Description = "עבור להוספת לקוח חדש",
                ActionType = "navigate",
                Url = "/customers/create"
            });
        }

        if (aiResponse.Contains("דוח") || aiResponse.Contains("ניתוח"))
        {
            actions.Add(new SuggestedAction
            {
                Title = "צפה בדוחות",
                Description = "עבור לדוחות פיננסיים",
                ActionType = "navigate",
                Url = "/reports"
            });
        }

        return actions;
    }

    /// <summary>
    /// Get available functions based on conversation context
    /// </summary>
    /// <param name="context">Chat context</param>
    /// <returns>List of available function definitions</returns>
    private List<FunctionDefinition> GetAvailableFunctions(ChatContext? context)
    {
        var functions = new List<FunctionDefinition>();

        // Always include customer functions for accounting context
        functions.AddRange(_customerFunctionService.GetCustomerFunctions());

        // Add more function categories based on context
        if (context?.CurrentModule == "invoices")
        {
            // TODO: Add invoice-related functions
        }
        else if (context?.CurrentModule == "sales")
        {
            // TODO: Add sales-related functions
        }

        return functions;
    }

    /// <summary>
    /// Execute a function call from OpenAI
    /// </summary>
    /// <param name="functionCall">Function call details</param>
    /// <param name="companyId">Company ID for security</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Function execution result</returns>
    private async Task<FunctionResult> ExecuteFunctionAsync(
        FunctionCall functionCall, 
        int companyId, 
        CancellationToken cancellationToken)
    {
        try
        {
            // Route to appropriate service based on function name
            if (IsCustomerFunction(functionCall.Name))
            {
                return await _customerFunctionService.ExecuteCustomerFunctionAsync(
                    functionCall, companyId, cancellationToken);
            }

            // Add more function routing here
            // if (IsInvoiceFunction(functionCall.Name))
            // {
            //     return await _invoiceFunctionService.ExecuteInvoiceFunctionAsync(
            //         functionCall, companyId, cancellationToken);
            // }

            return new FunctionResult
            {
                FunctionName = functionCall.Name,
                CallId = functionCall.Id,
                IsSuccess = false,
                ErrorMessage = $"Unknown function category for: {functionCall.Name}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing function {FunctionName}", functionCall.Name);
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
    /// Check if a function name belongs to customer functions
    /// </summary>
    /// <param name="functionName">Function name</param>
    /// <returns>True if customer function</returns>
    private static bool IsCustomerFunction(string functionName)
    {
        var customerFunctionNames = new[] 
        { 
            "getCustomersList", 
            "getCustomerDetails", 
            "searchCustomers", 
            "getCustomerFinancialSummary" 
        };
        
        return customerFunctionNames.Contains(functionName);
    }
}
