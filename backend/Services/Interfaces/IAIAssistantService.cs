using backend.DTOs.AI;
using backend.Models.AI;

namespace backend.Services.Interfaces;

/// <summary>
/// Interface for AI Assistant service that handles chat interactions and OpenAI integration
/// </summary>
public interface IAIAssistantService
{
    /// <summary>
    /// Send a message to the AI assistant and get a response
    /// </summary>
    /// <param name="request">Chat request with message and context</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="userId">User ID who sent the message</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>AI assistant response</returns>
    Task<ChatResponse> SendMessageAsync(ChatRequest request, int companyId, int? userId = null, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get chat history for a session or user
    /// </summary>
    /// <param name="request">Chat history request</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="userId">User ID (optional, for filtering user's messages)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Chat history response</returns>
    Task<ChatHistoryResponse> GetChatHistoryAsync(ChatHistoryRequest request, int companyId, int? userId = null, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Clear chat history for a session
    /// </summary>
    /// <param name="sessionId">Session ID to clear</param>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task ClearChatHistoryAsync(string sessionId, int companyId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get chat sessions for a company
    /// </summary>
    /// <param name="companyId">Company ID for multi-tenant filtering</param>
    /// <param name="userId">User ID (optional, for filtering user's sessions)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Chat sessions response</returns>
    Task<ChatSessionsResponse> GetChatSessionsAsync(int companyId, int? userId = null, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get AI assistant configuration for a company
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>AI assistant configuration</returns>
    Task<AIAssistantConfig> GetConfigAsync(int companyId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Update AI assistant configuration for a company
    /// </summary>
    /// <param name="config">Updated configuration</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task UpdateConfigAsync(AIAssistantConfig config, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Check if AI assistant is available for a company (within usage limits)
    /// </summary>
    /// <param name="companyId">Company ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if available, false if usage limit exceeded</returns>
    Task<bool> IsAvailableAsync(int companyId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Generate a financial report using AI
    /// </summary>
    /// <param name="reportType">Type of report (e.g., "monthly_summary", "cash_flow")</param>
    /// <param name="companyId">Company ID</param>
    /// <param name="parameters">Report parameters (date range, filters, etc.)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Generated report content</returns>
    Task<string> GenerateReportAsync(string reportType, int companyId, Dictionary<string, object>? parameters = null, CancellationToken cancellationToken = default);
}

/// <summary>
/// Interface for Azure OpenAI service integration
/// Uses Azure OpenAI Service with Managed Identity authentication and function calling
/// </summary>
public interface IOpenAIService : IDisposable
{
    /// <summary>
    /// Send a chat completion request to Azure OpenAI
    /// </summary>
    /// <param name="messages">List of messages in the conversation</param>
    /// <param name="model">Azure OpenAI deployment name to use</param>
    /// <param name="maxTokens">Maximum tokens for response</param>
    /// <param name="temperature">Temperature for response generation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Azure OpenAI response</returns>
    Task<OpenAIResponse> GetChatCompletionAsync(
        List<OpenAIMessage> messages, 
        string model = "gpt-4", 
        int maxTokens = 1000, 
        decimal temperature = 0.7m,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Send a chat completion request with function calling support
    /// </summary>
    /// <param name="messages">List of messages in the conversation</param>
    /// <param name="functions">Available functions for the AI to call</param>
    /// <param name="model">Azure OpenAI deployment name to use</param>
    /// <param name="maxTokens">Maximum tokens for response</param>
    /// <param name="temperature">Temperature for response generation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Azure OpenAI response with potential function calls</returns>
    Task<OpenAIFunctionResponse> GetChatCompletionWithFunctionsAsync(
        List<OpenAIMessage> messages,
        List<FunctionDefinition> functions,
        string model = "gpt-4",
        int maxTokens = 1000,
        decimal temperature = 0.7m,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Analyze financial data and generate insights using Azure OpenAI
    /// </summary>
    /// <param name="dataContext">Financial data context</param>
    /// <param name="analysisType">Type of analysis requested</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Analysis insights</returns>
    Task<string> AnalyzeFinancialDataAsync(string dataContext, string analysisType, CancellationToken cancellationToken = default);
}

/// <summary>
/// OpenAI message structure
/// </summary>
public class OpenAIMessage
{
    public string Role { get; set; } = string.Empty; // "system", "user", "assistant"
    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// OpenAI API response
/// </summary>
public class OpenAIResponse
{
    public string Content { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int TokensUsed { get; set; }
    public decimal ConfidenceScore { get; set; }
    public bool IsSuccess { get; set; } = true;
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Function definition for OpenAI function calling
/// </summary>
public class FunctionDefinition
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public object Parameters { get; set; } = new();
}

/// <summary>
/// Function call from OpenAI
/// </summary>
public class FunctionCall
{
    public string Name { get; set; } = string.Empty;
    public string Arguments { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
}

/// <summary>
/// OpenAI API response with function calling support
/// </summary>
public class OpenAIFunctionResponse
{
    public string Content { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int TokensUsed { get; set; }
    public decimal ConfidenceScore { get; set; }
    public bool IsSuccess { get; set; } = true;
    public string? ErrorMessage { get; set; }
    public List<FunctionCall> FunctionCalls { get; set; } = new();
    public bool RequiresFunctionExecution { get; set; }
}

/// <summary>
/// Function execution result
/// </summary>
public class FunctionResult
{
    public string FunctionName { get; set; } = string.Empty;
    public string CallId { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
    public bool IsSuccess { get; set; } = true;
    public string? ErrorMessage { get; set; }
}
