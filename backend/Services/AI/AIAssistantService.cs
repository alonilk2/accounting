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
    private readonly IInvoiceFunctionService _invoiceFunctionService;
    private readonly ILogger<AIAssistantService> _logger;

    public AIAssistantService(
        AccountingDbContext context,
        IOpenAIService openAIService,
        ICustomerFunctionService customerFunctionService,
        IInvoiceFunctionService invoiceFunctionService,
        ILogger<AIAssistantService> logger)
    {
        _context = context;
        _openAIService = openAIService;
        _customerFunctionService = customerFunctionService;
        _invoiceFunctionService = invoiceFunctionService;
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

            // Check if the user is requesting to create a customer or invoice
            var interactiveResponse = await CheckForInteractiveRequestAsync(request.Message, companyId);
            if (interactiveResponse != null)
            {
                return new ChatResponse
                {
                    Message = interactiveResponse.Title,
                    SessionId = sessionId,
                    IsSuccess = true,
                    Type = "interactive",
                    InteractiveData = interactiveResponse
                };
            }

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
                followUpMessages.Add(new OpenAIMessage 
                { 
                    Role = "assistant", 
                    Content = aiResponse.Content
                });

                // Add function results
                foreach (var result in functionResults)
                {
                    followUpMessages.Add(new OpenAIMessage
                    {
                        Role = "user",
                        Content = $"תוצאות הפונקציה {result.FunctionName}: {(result.IsSuccess ? result.Result : $"שגיאה: {result.ErrorMessage}")}"
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
                    // Combine function execution info with final response
                    var executionSummary = string.Join(", ", functionResults.Select(r => 
                        r.IsSuccess ? $"✅ {r.FunctionName}" : $"❌ {r.FunctionName}"));
                    
                    finalContent = $"🔄 בוצעו פונקציות: {executionSummary}\n\n{finalResponse.Content}";
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

            // Check if function calls were executed
            var hasFunctionCalls = aiResponse.RequiresFunctionExecution && aiResponse.FunctionCalls.Any();
            var executedFunctions = hasFunctionCalls ? 
                aiResponse.FunctionCalls.Select(fc => fc.Name).ToList() : null;

            return new ChatResponse
            {
                Message = finalContent,
                SessionId = sessionId,
                ConfidenceScore = aiResponse.ConfidenceScore,
                ResponseTimeMs = responseTime,
                IsSuccess = true,
                SuggestedActions = suggestedActions,
                HasFunctionCalls = hasFunctionCalls,
                ExecutedFunctions = executedFunctions
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

    public async Task<ChatSessionsResponse> GetChatSessionsAsync(int companyId, int? userId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Set<ChatMessage>()
            .Where(m => m.CompanyId == companyId);

        if (userId.HasValue)
        {
            query = query.Where(m => m.UserId == userId.Value || m.Role == "assistant");
        }

        var sessions = await query
            .GroupBy(m => m.SessionId)
            .Select(g => new ChatSessionDto
            {
                Id = g.Key,
                Title = g.OrderBy(m => m.Timestamp).First().Content.Length > 50 
                    ? g.OrderBy(m => m.Timestamp).First().Content.Substring(0, 50) + "..."
                    : g.OrderBy(m => m.Timestamp).First().Content,
                CreatedAt = g.Min(m => m.Timestamp),
                UpdatedAt = g.Max(m => m.Timestamp),
                MessageCount = g.Count(),
                LastMessage = g.OrderByDescending(m => m.Timestamp).First().Content.Length > 100
                    ? g.OrderByDescending(m => m.Timestamp).First().Content.Substring(0, 100) + "..."
                    : g.OrderByDescending(m => m.Timestamp).First().Content
            })
            .OrderByDescending(s => s.UpdatedAt)
            .ToListAsync(cancellationToken);

        return new ChatSessionsResponse
        {
            Sessions = sessions,
            TotalCount = sessions.Count
        };
    }

    public async Task<AIAssistantConfig> GetConfigAsync(int companyId, CancellationToken cancellationToken = default)
    {
        var config = await _context.Set<AIAssistantConfig>()
            .FirstOrDefaultAsync(c => c.CompanyId == companyId, cancellationToken);

        if (config == null)
        {
            // Create default configuration with dynamic function list
            var systemPrompt = BuildSystemPrompt(companyId);
            
            config = new AIAssistantConfig
            {
                CompanyId = companyId,
                IsEnabled = true,
                OpenAIModel = "gpt-4o-mini",
                MaxTokens = 1000,
                Temperature = 0.7m,
                DailyUsageLimit = 100,
                SystemPrompt = systemPrompt
            };

            _context.Set<AIAssistantConfig>().Add(config);
            await _context.SaveChangesAsync(cancellationToken);
        }
        else
        {
            // Update system prompt with current functions if needed
            var currentPrompt = BuildSystemPrompt(companyId);
            if (config.SystemPrompt != currentPrompt)
            {
                config.SystemPrompt = currentPrompt;
                config.UpdatedAt = DateTime.UtcNow;
                _context.Set<AIAssistantConfig>().Update(config);
                await _context.SaveChangesAsync(cancellationToken);
            }
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

    private Task<string> BuildContextInformation(ChatContext context, int companyId, CancellationToken cancellationToken)
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

        return Task.FromResult(string.Join(". ", contextInfo));
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
        
        // Always include invoice functions for accounting context
        functions.AddRange(_invoiceFunctionService.GetInvoiceFunctions());

        // Add more function categories based on context
        if (context?.CurrentModule == "sales")
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
            var serviceType = GetFunctionServiceType(functionCall.Name);
            
            return serviceType switch
            {
                "Customer" => await _customerFunctionService.ExecuteCustomerFunctionAsync(
                    functionCall, companyId, cancellationToken),
                
                "Invoice" => await _invoiceFunctionService.ExecuteInvoiceFunctionAsync(
                    functionCall, companyId, cancellationToken),
                
                // Add more service types here
                // "Sales" => await _salesFunctionService.ExecuteSalesFunctionAsync(
                //     functionCall, companyId, cancellationToken),
                
                _ => new FunctionResult
                {
                    FunctionName = functionCall.Name,
                    CallId = functionCall.Id,
                    IsSuccess = false,
                    ErrorMessage = $"Unknown function category for: {functionCall.Name}"
                }
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
    private bool IsCustomerFunction(string functionName)
    {
        // Get function names dynamically from the customer function service
        var customerFunctions = _customerFunctionService.GetCustomerFunctions();
        var customerFunctionNames = customerFunctions.Select(f => f.Name).ToArray();
        
        return customerFunctionNames.Contains(functionName);
    }

    /// <summary>
    /// Check if a function name belongs to invoice functions
    /// </summary>
    /// <param name="functionName">Function name</param>
    /// <returns>True if invoice function</returns>
    private bool IsInvoiceFunction(string functionName)
    {
        // Get function names dynamically from the invoice function service
        var invoiceFunctions = _invoiceFunctionService.GetInvoiceFunctions();
        var invoiceFunctionNames = invoiceFunctions.Select(f => f.Name).ToArray();
        
        return invoiceFunctionNames.Contains(functionName);
    }

    /// <summary>
    /// Get function service type based on function name
    /// </summary>
    /// <param name="functionName">Function name</param>
    /// <returns>Function service type</returns>
    private string GetFunctionServiceType(string functionName)
    {
        if (IsCustomerFunction(functionName))
            return "Customer";
        
        if (IsInvoiceFunction(functionName))
            return "Invoice";
        
        // Add more function service types here in the future
        // if (IsSalesFunction(functionName))
        //     return "Sales";
        
        return "Unknown";
    }

    /// <summary>
    /// Build system prompt dynamically with current available functions
    /// </summary>
    /// <param name="companyId">Company ID to include in the prompt</param>
    /// <returns>Complete system prompt</returns>
    private string BuildSystemPrompt(int companyId)
    {
        var basePrompt = $@"
אתה עוזר חכם לחשבונאות עבור עסק ישראלי עם גישה לנתונים בזמן אמת.
אתה עוזר עם שאלות פיננסיות, ניתוח נתונים ומשימות חשבונאות כלליות.
תמיד תענה בעברית אלא אם מבקשים ממך במפורש להשתמש באנגלית.
היה מקצועי, מדויק, תמציתי ומועיל.

מזהה החברה הנוכחית: {companyId}

הנחיות חשובות:
- כאשר משתמש מבקש ליצור לקוח חדש או חשבונית חדשה, הצג טופס אינטרקטיבי למילוי הפרטים
- השתמש בפונקציות המערכת רק לאחר שקיבלת את כל הפרטים הנדרשים מהמשתמש
- עדכן את המשתמש על תוצאות הפעולות בצורה ברורה ומקצועית
- אם יש שגיאות, הסבר אותן בצורה מובנת ותן הצעות לפתרון

יש לך גישה לפונקציות הבאות לקבלת מידע וביצוע פעולות:

פונקציות לקוחות:";

        // Get customer functions dynamically
        var customerFunctions = _customerFunctionService.GetCustomerFunctions();
        
        // Get invoice functions dynamically
        var invoiceFunctions = _invoiceFunctionService.GetInvoiceFunctions();
        
        // Categorize customer functions
        var customerReadOnlyFunctions = new List<string>();
        var customerManagementFunctions = new List<string>();
        
        foreach (var function in customerFunctions)
        {
            var functionLine = $"- {function.Name}: {function.Description}";
            
            if (function.Name.StartsWith("create") || function.Name.StartsWith("update") || function.Name.StartsWith("add"))
            {
                customerManagementFunctions.Add(functionLine);
            }
            else
            {
                customerReadOnlyFunctions.Add(functionLine);
            }
        }
        
        // Categorize invoice functions
        var invoiceReadOnlyFunctions = new List<string>();
        var invoiceManagementFunctions = new List<string>();
        
        foreach (var function in invoiceFunctions)
        {
            var functionLine = $"- {function.Name}: {function.Description}";
            
            if (function.Name.StartsWith("create") || function.Name.StartsWith("update") || function.Name.StartsWith("process"))
            {
                invoiceManagementFunctions.Add(functionLine);
            }
            else
            {
                invoiceReadOnlyFunctions.Add(functionLine);
            }
        }
        
        // Build the complete prompt
        var promptBuilder = new System.Text.StringBuilder(basePrompt);
        
        // Add customer read-only functions
        foreach (var func in customerReadOnlyFunctions)
        {
            promptBuilder.AppendLine(func);
        }
        
        // Add customer management functions
        if (customerManagementFunctions.Any())
        {
            promptBuilder.AppendLine();
            promptBuilder.AppendLine("פונקציות ניהול לקוחות:");
            foreach (var func in customerManagementFunctions)
            {
                promptBuilder.AppendLine(func);
            }
        }
        
        // Add invoice functions
        promptBuilder.AppendLine();
        promptBuilder.AppendLine("פונקציות חשבוניות:");
        
        foreach (var func in invoiceReadOnlyFunctions)
        {
            promptBuilder.AppendLine(func);
        }
        
        if (invoiceManagementFunctions.Any())
        {
            promptBuilder.AppendLine();
            promptBuilder.AppendLine("פונקציות ניהול חשבוניות:");
            foreach (var func in invoiceManagementFunctions)
            {
                promptBuilder.AppendLine(func);
            }
        }
        
        promptBuilder.AppendLine();
        promptBuilder.AppendLine("כאשר המשתמש שואל על לקוחות, חובות, חשבוניות, תשלומים או פרטים פיננסיים - השתמש בפונקציות המתאימות כדי לספק מידע מדויק ועדכני.");
        promptBuilder.AppendLine("אתה יכול גם ליצור חשבוניות חדשות, לעדכן סטטוסים ולעבד תשלומים כאשר המשתמש מבקש זאת.");
        promptBuilder.AppendLine();
        promptBuilder.AppendLine("אם אתה לא בטוח לגבי תקנות מס ספציפיות, המלץ להתייעץ עם רואה חשבון מוסמך.");
        promptBuilder.AppendLine("תמיד ציין מקורות אמינים כשאתה נותן מידע על תקנות או חוקים.");
        promptBuilder.AppendLine();
        promptBuilder.AppendLine("כשאתה מקבל נתונים מהפונקציות, ארגן אותם בצורה ברורה וקריאה למשתמש.");
        
        return promptBuilder.ToString();
    }

    /// <summary>
    /// Check if the user message requires an interactive response
    /// </summary>
    private async Task<InteractiveMessageData?> CheckForInteractiveRequestAsync(string message, int companyId)
    {
        var lowerMessage = message.ToLowerInvariant();
        
        // Check for customer creation requests
        if (IsCustomerCreationRequest(lowerMessage))
        {
            return CreateCustomerForm();
        }
        
        // Check for invoice creation requests
        if (IsInvoiceCreationRequest(lowerMessage))
        {
            return await CreateInvoiceFormAsync(companyId);
        }
        
        return null;
    }

    /// <summary>
    /// Check if message is requesting to create a new customer
    /// </summary>
    private bool IsCustomerCreationRequest(string message)
    {
        var customerKeywords = new[] { "לקוח", "customer", "לקוחה" };
        var createKeywords = new[] { "צור", "הוסף", "יצור", "חדש", "create", "add", "new" };
        
        return customerKeywords.Any(keyword => message.Contains(keyword)) &&
               createKeywords.Any(keyword => message.Contains(keyword));
    }

    /// <summary>
    /// Check if message is requesting to create a new invoice
    /// </summary>
    private bool IsInvoiceCreationRequest(string message)
    {
        var invoiceKeywords = new[] { "חשבונית", "invoice", "חשבון" };
        var createKeywords = new[] { "צור", "הוסף", "יצור", "חדש", "create", "add", "new" };
        
        return invoiceKeywords.Any(keyword => message.Contains(keyword)) &&
               createKeywords.Any(keyword => message.Contains(keyword));
    }

    /// <summary>
    /// Create interactive form for customer creation
    /// </summary>
    private InteractiveMessageData CreateCustomerForm()
    {
        return new InteractiveMessageData
        {
            ComponentType = "form",
            Title = "יצירת לקוח חדש",
            Description = "אנא מלא את הפרטים הבאים ליצירת לקוח חדש במערכת:",
            Fields = new List<FormField>
            {
                new FormField
                {
                    Id = "name",
                    Label = "שם הלקוח",
                    Type = "text",
                    Required = true,
                    Validation = new FieldValidation
                    {
                        Min = 2,
                        Max = 100,
                        Message = "שם הלקוח חייב להכיל בין 2 ל-100 תווים"
                    }
                },
                new FormField
                {
                    Id = "taxId",
                    Label = "מספר זהות/חברה",
                    Type = "text",
                    Required = true,
                    Validation = new FieldValidation
                    {
                        Pattern = @"^\d{9}(\d{2})?$",
                        Message = "מספר זהות חייב להכיל 9 או 11 ספרות"
                    }
                },
                new FormField
                {
                    Id = "email",
                    Label = "כתובת אימייל",
                    Type = "email",
                    Required = false,
                    Validation = new FieldValidation
                    {
                        Pattern = @"^[^\s@]+@[^\s@]+\.[^\s@]+$",
                        Message = "כתובת אימייל לא תקינה"
                    }
                },
                new FormField
                {
                    Id = "phone",
                    Label = "טלפון",
                    Type = "text",
                    Required = false,
                    Validation = new FieldValidation
                    {
                        Pattern = @"^[\d\-\+\(\)\s]+$",
                        Message = "מספר טלפון לא תקין"
                    }
                },
                new FormField
                {
                    Id = "address",
                    Label = "כתובת",
                    Type = "textarea",
                    Required = false
                },
                new FormField
                {
                    Id = "contactPerson",
                    Label = "איש קשר",
                    Type = "text",
                    Required = false
                },
                new FormField
                {
                    Id = "paymentTerms",
                    Label = "תנאי תשלום (ימים)",
                    Type = "number",
                    Required = false,
                    DefaultValue = 30,
                    Validation = new FieldValidation
                    {
                        Min = 0,
                        Max = 365,
                        Message = "תנאי תשלום חייבים להיות בין 0 ל-365 ימים"
                    }
                }
            }
        };
    }

    /// <summary>
    /// Create interactive form for invoice creation
    /// </summary>
    private async Task<InteractiveMessageData> CreateInvoiceFormAsync(int companyId)
    {
        // Get list of active customers for the select field
        var customers = await _context.Customers
            .Where(c => c.CompanyId == companyId && c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new FieldOption 
            { 
                Value = c.Id, 
                Label = $"{c.Name} ({c.TaxId})" 
            })
            .ToListAsync();

        var customerOptions = new List<FieldOption>
        {
            new FieldOption { Value = "", Label = "בחר לקוח..." }
        };
        customerOptions.AddRange(customers);

        return new InteractiveMessageData
        {
            ComponentType = "form",
            Title = "יצירת חשבונית חדשה",
            Description = "אנא מלא את הפרטים הבאים ליצירת חשבונית חדשה:",
            Fields = new List<FormField>
            {
                new FormField
                {
                    Id = "customerId",
                    Label = "לקוח",
                    Type = "select",
                    Required = true,
                    Options = customerOptions
                },
                new FormField
                {
                    Id = "dueDate",
                    Label = "תאריך פירעון",
                    Type = "date",
                    Required = true,
                    DefaultValue = DateTime.Today.AddDays(30).ToString("yyyy-MM-dd")
                },
                new FormField
                {
                    Id = "description",
                    Label = "תיאור",
                    Type = "textarea",
                    Required = false
                },
                new FormField
                {
                    Id = "notes",
                    Label = "הערות",
                    Type = "textarea",
                    Required = false
                }
            }
        };
    }
}
