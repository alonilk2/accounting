using backend.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;
using Azure.AI.OpenAI;
using Azure.Identity;
using Azure;
using Azure.Core;
using OpenAI.Chat;
using System;

namespace backend.Services.AI;

/// <summary>
/// Azure OpenAI service implementation for chat completions and AI features
/// Uses Azure OpenAI Service with Managed Identity authentication
/// </summary>
public class OpenAIService : IOpenAIService
{
    private readonly AzureOpenAIClient _openAIClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OpenAIService> _logger;
    private readonly string _deploymentName;
    private readonly int _maxRetries;
    private readonly TimeSpan _timeout;

    public OpenAIService(
        IConfiguration configuration,
        ILogger<OpenAIService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        var endpoint = _configuration["AI:AzureOpenAI:Endpoint"] ?? 
                      throw new InvalidOperationException("Azure OpenAI Endpoint not configured");
        
        _deploymentName = _configuration["AI:AzureOpenAI:DeploymentName"] ?? "gpt-4";
        _maxRetries = int.Parse(_configuration["AI:AzureOpenAI:MaxRetries"] ?? "3");
        _timeout = TimeSpan.FromSeconds(int.Parse(_configuration["AI:AzureOpenAI:TimeoutSeconds"] ?? "30"));
        
        // Use Managed Identity for authentication (preferred for Azure-hosted apps)
        // Falls back to development credentials in local development
        var credential = new DefaultAzureCredential(new DefaultAzureCredentialOptions
        {
            ExcludeVisualStudioCodeCredential = false,
            ExcludeAzureCliCredential = false,
            ExcludeEnvironmentCredential = false
        });

        // For local development, you can also use API key if needed
        var apiKey = _configuration["AI:AzureOpenAI:ApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
        {
            _logger.LogInformation("Using API key authentication for Azure OpenAI");
            _openAIClient = new AzureOpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey));
        }
        else
        {
            _logger.LogInformation("Using Managed Identity authentication for Azure OpenAI");
            _openAIClient = new AzureOpenAIClient(new Uri(endpoint), credential);
        }
    }

    public async Task<OpenAIResponse> GetChatCompletionAsync(
        List<OpenAIMessage> messages,
        string model = "gpt-4o-mini",
        int maxTokens = 1000,
        decimal temperature = 0.7m,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Get the chat client for the deployment
            var chatClient = _openAIClient.GetChatClient(_deploymentName);
            
            // Convert our messages to OpenAI format
            var chatMessages = new List<ChatMessage>();
            foreach (var message in messages)
            {
                ChatMessage chatMessage = message.Role.ToLowerInvariant() switch
                {
                    "system" => new SystemChatMessage(message.Content),
                    "user" => new UserChatMessage(message.Content),
                    "assistant" => new AssistantChatMessage(message.Content),
                    _ => throw new ArgumentException($"Unknown message role: {message.Role}")
                };
                chatMessages.Add(chatMessage);
            }

            var chatCompletionOptions = new ChatCompletionOptions()
            {
                Temperature = (float)temperature,
                FrequencyPenalty = 0.0f,
                PresencePenalty = 0.0f
            };

            _logger.LogDebug("Sending request to Azure OpenAI with deployment {DeploymentName}", _deploymentName);

            // Implement retry logic with exponential backoff
            var response = await ExecuteWithRetryAsync(async () =>
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(_timeout);
                return await chatClient.CompleteChatAsync(chatMessages, chatCompletionOptions, cts.Token);
            });

            var choice = response.Value;
            if (choice?.Content == null || choice.Content.Count == 0)
            {
                return new OpenAIResponse
                {
                    IsSuccess = false,
                    ErrorMessage = "לא התקבלה תגובה תקינה מהשירות"
                };
            }

            var content = response.Value.Content.Last().Text;
            var confidenceScore = choice.FinishReason == ChatFinishReason.Stop ? 0.95m : 0.7m;

            _logger.LogInformation("Azure OpenAI successful response");

            return new OpenAIResponse
            {
                Content = content,
                Model = _deploymentName,
                ConfidenceScore = confidenceScore,
                IsSuccess = true
            };
        }
        catch (RequestFailedException ex) when (ex.Status == 429)
        {
            _logger.LogWarning("Azure OpenAI rate limit exceeded: {Message}", ex.Message);
            return new OpenAIResponse
            {
                IsSuccess = false,
                ErrorMessage = "השירות עמוס כעת, אנא נסה שוב בעוד מספר שניות"
            };
        }
        catch (RequestFailedException ex)
        {
            _logger.LogError(ex, "Azure OpenAI API error: {Status} - {Message}", ex.Status, ex.Message);
            return new OpenAIResponse
            {
                IsSuccess = false,
                ErrorMessage = $"שגיאת שירות Azure OpenAI: {ex.Status}"
            };
        }
        catch (OperationCanceledException ex)
        {
            _logger.LogWarning(ex, "Azure OpenAI request timeout");
            return new OpenAIResponse
            {
                IsSuccess = false,
                ErrorMessage = "בקשה לשירות ה-AI הסתיימה בחריגת זמן"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling Azure OpenAI");
            return new OpenAIResponse
            {
                IsSuccess = false,
                ErrorMessage = "שגיאה לא צפויה בשירות ה-AI"
            };
        }
    }

    public async Task<OpenAIFunctionResponse> GetChatCompletionWithFunctionsAsync(
        List<OpenAIMessage> messages,
        List<FunctionDefinition> functions,
        string model = "gpt-4",
        int maxTokens = 1000,
        decimal temperature = 0.7m,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Get the chat client for the deployment
            var chatClient = _openAIClient.GetChatClient(_deploymentName);
            
            // Convert our messages to OpenAI format
            var chatMessages = new List<ChatMessage>();
            foreach (var message in messages)
            {
                ChatMessage chatMessage = message.Role.ToLowerInvariant() switch
                {
                    "system" => new SystemChatMessage(message.Content),
                    "user" => new UserChatMessage(message.Content),
                    "assistant" => new AssistantChatMessage(message.Content),
                    _ => throw new ArgumentException($"Unknown message role: {message.Role}")
                };
                chatMessages.Add(chatMessage);
            }

            var chatCompletionOptions = new ChatCompletionOptions()
            {
                Temperature = (float)temperature,
                FrequencyPenalty = 0.0f,
                PresencePenalty = 0.0f
            };

            // Add function definitions to the options
            foreach (var function in functions)
            {
                var functionDefinition = ChatTool.CreateFunctionTool(
                    function.Name,
                    function.Description,
                    BinaryData.FromObjectAsJson(function.Parameters, new JsonSerializerOptions 
                    { 
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
                    }));
                chatCompletionOptions.Tools.Add(functionDefinition);
            }

            _logger.LogDebug("Sending function-enabled request to Azure OpenAI with deployment {DeploymentName}", _deploymentName);

            // Implement retry logic with exponential backoff
            var response = await ExecuteWithRetryAsync(async () =>
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(_timeout);
                return await chatClient.CompleteChatAsync(chatMessages, chatCompletionOptions, cts.Token);
            });

            var choice = response.Value;
            if (choice?.Content == null)
            {
                return new OpenAIFunctionResponse
                {
                    IsSuccess = false,
                    ErrorMessage = "לא התקבלה תגובה תקינה מהשירות"
                };
            }

            var functionResponse = new OpenAIFunctionResponse
            {
                Model = _deploymentName,
                IsSuccess = true
            };

            // Check if the response contains function calls
            if (choice.ToolCalls != null && choice.ToolCalls.Count > 0)
            {
                functionResponse.RequiresFunctionExecution = true;
                foreach (var toolCall in choice.ToolCalls)
                {
                    if (toolCall.Kind == ChatToolCallKind.Function)
                    {
                        functionResponse.FunctionCalls.Add(new FunctionCall
                        {
                            Id = toolCall.Id,
                            Name = toolCall.FunctionName,
                            Arguments = toolCall.FunctionArguments.ToString()
                        });
                    }
                }
            }
            else if (choice.Content != null && choice.Content.Count > 0)
            {
                // Regular text response
                var content = choice.Content.LastOrDefault()?.Text ?? string.Empty;
                functionResponse.Content = content;
                functionResponse.RequiresFunctionExecution = false;
            }

            var confidenceScore = choice.FinishReason == ChatFinishReason.Stop ? 0.95m : 0.7m;
            functionResponse.ConfidenceScore = confidenceScore;

            _logger.LogInformation("Azure OpenAI function-enabled response successful");

            return functionResponse;
        }
        catch (RequestFailedException ex) when (ex.Status == 429)
        {
            _logger.LogWarning("Azure OpenAI rate limit exceeded: {Message}", ex.Message);
            return new OpenAIFunctionResponse
            {
                IsSuccess = false,
                ErrorMessage = "השירות עמוס כעת, אנא נסה שוב בעוד מספר שניות"
            };
        }
        catch (RequestFailedException ex)
        {
            _logger.LogError(ex, "Azure OpenAI API error: {Status} - {Message}", ex.Status, ex.Message);
            return new OpenAIFunctionResponse
            {
                IsSuccess = false,
                ErrorMessage = $"שגיאת שירות Azure OpenAI: {ex.Status}"
            };
        }
        catch (OperationCanceledException ex)
        {
            _logger.LogWarning(ex, "Azure OpenAI request timeout");
            return new OpenAIFunctionResponse
            {
                IsSuccess = false,
                ErrorMessage = "בקשה לשירות ה-AI הסתיימה בחריגת זמן"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling Azure OpenAI");
            return new OpenAIFunctionResponse
            {
                IsSuccess = false,
                ErrorMessage = "שגיאה לא צפויה בשירות ה-AI"
            };
        }
    }

    /// <summary>
    /// Execute operation with exponential backoff retry logic
    /// </summary>
    private async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation)
    {
        var delay = TimeSpan.FromSeconds(1);
        
        for (int attempt = 0; attempt < _maxRetries; attempt++)
        {
            try
            {
                return await operation();
            }
            catch (RequestFailedException ex) when (ex.Status == 429 && attempt < _maxRetries - 1)
            {
                // Rate limit - wait and retry with exponential backoff
                _logger.LogWarning("Rate limited on attempt {Attempt}, waiting {Delay}ms", 
                    attempt + 1, delay.TotalMilliseconds);
                
                await Task.Delay(delay);
                delay = TimeSpan.FromMilliseconds(delay.TotalMilliseconds * 2); // Exponential backoff
            }
            catch (Exception ex) when (attempt < _maxRetries - 1 && IsTransientError(ex))
            {
                // Transient error - retry
                _logger.LogWarning(ex, "Transient error on attempt {Attempt}, retrying", attempt + 1);
                await Task.Delay(delay);
                delay = TimeSpan.FromMilliseconds(delay.TotalMilliseconds * 1.5);
            }
        }
        
        // If we get here, all retries failed
        throw new InvalidOperationException($"Operation failed after {_maxRetries} attempts");
    }

    /// <summary>
    /// Determine if an error is transient and should be retried
    /// </summary>
    private static bool IsTransientError(Exception ex)
    {
        return ex is RequestFailedException rfe && (
            rfe.Status == 503 ||  // Service Unavailable
            rfe.Status == 502 ||  // Bad Gateway
            rfe.Status == 504     // Gateway Timeout
        );
    }

    public async Task<string> AnalyzeFinancialDataAsync(
        string dataContext, 
        string analysisType, 
        CancellationToken cancellationToken = default)
    {
        var systemPrompt = @"
            אתה אנליסט פיננסי מומחה המתמחה בניתוח נתונים פיננסיים לעסקים ישראליים.
            תן תשובות מפורטות, מדויקות ומועילות.
            השתמש במונחים פיננסיים מקצועיים בעברית.
            ציין מגמות, תובנות ופוטנציאל לשיפור.
            תמיד ציין הגבלות הניתוח וכאשר נדרשת התייעצות עם רואה חשבון.
        ";

        var userPrompt = $@"
            סוג הניתוח המבוקש: {analysisType}
            
            נתונים פיננסיים לניתוח:
            {dataContext}
            
            אנא בצע ניתוח מקיף ותן המלצות מעשיות.
        ";

        var messages = new List<OpenAIMessage>
        {
            new() { Role = "system", Content = systemPrompt },
            new() { Role = "user", Content = userPrompt }
        };

        var response = await GetChatCompletionAsync(
            messages,
            model: _deploymentName, // Use the configured deployment instead of hardcoded model
            maxTokens: 1500,
            temperature: 0.3m, // Lower temperature for more analytical responses
            cancellationToken: cancellationToken);

        return response.IsSuccess ? response.Content : "שגיאה בניתוח הנתונים הפיננסיים";
    }

    /// <summary>
    /// Cleanup resources if needed
    /// </summary>
    public void Dispose()
    {
        // AzureOpenAIClient in current version doesn't implement IDisposable
        // No cleanup needed
        GC.SuppressFinalize(this);
    }
}
