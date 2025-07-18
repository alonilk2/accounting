namespace backend.DTOs.AI;

/// <summary>
/// Request for sending a message to the AI assistant
/// </summary>
public class ChatRequest
{
    /// <summary>
    /// User's message content
    /// </summary>
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional session ID to continue existing conversation
    /// </summary>
    public string? SessionId { get; set; }
    
    /// <summary>
    /// Context information for better AI responses
    /// </summary>
    public ChatContext? Context { get; set; }
}

/// <summary>
/// Response from the AI assistant
/// </summary>
public class ChatResponse
{
    /// <summary>
    /// AI assistant's response message
    /// </summary>
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// Session ID for conversation continuity
    /// </summary>
    public string SessionId { get; set; } = string.Empty;
    
    /// <summary>
    /// Confidence score (0.0 to 1.0)
    /// </summary>
    public decimal ConfidenceScore { get; set; }
    
    /// <summary>
    /// Response time in milliseconds
    /// </summary>
    public int ResponseTimeMs { get; set; }
    
    /// <summary>
    /// Whether the response was successful
    /// </summary>
    public bool IsSuccess { get; set; } = true;
    
    /// <summary>
    /// Error message if any
    /// </summary>
    public string? ErrorMessage { get; set; }
    
    /// <summary>
    /// Suggested actions based on the conversation
    /// </summary>
    public List<SuggestedAction>? SuggestedActions { get; set; }
    
    /// <summary>
    /// Whether this response included function calls
    /// </summary>
    public bool HasFunctionCalls { get; set; }
    
    /// <summary>
    /// List of function names that were executed
    /// </summary>
    public List<string>? ExecutedFunctions { get; set; }
}

/// <summary>
/// Context information for AI processing
/// </summary>
public class ChatContext
{
    /// <summary>
    /// Current page/module user is on
    /// </summary>
    public string? CurrentModule { get; set; }
    
    /// <summary>
    /// Related entity type (e.g., "Invoice", "Customer")
    /// </summary>
    public string? EntityType { get; set; }
    
    /// <summary>
    /// Related entity ID
    /// </summary>
    public int? EntityId { get; set; }
    
    /// <summary>
    /// User's role for context-aware responses
    /// </summary>
    public string? UserRole { get; set; }
    
    /// <summary>
    /// Additional context data
    /// </summary>
    public Dictionary<string, object>? Data { get; set; }
}

/// <summary>
/// Suggested action from AI assistant
/// </summary>
public class SuggestedAction
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty; // "navigate", "create", "view", etc.
    public string? Url { get; set; }
    public Dictionary<string, object>? Parameters { get; set; }
}

/// <summary>
/// Chat history request
/// </summary>
public class ChatHistoryRequest
{
    public string? SessionId { get; set; }
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 50;
}

/// <summary>
/// Chat history response
/// </summary>
public class ChatHistoryResponse
{
    public List<ChatMessageDto> Messages { get; set; } = new();
    public int TotalCount { get; set; }
    public bool HasMore { get; set; }
}

/// <summary>
/// Chat message DTO
/// </summary>
public class ChatMessageDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public decimal? ConfidenceScore { get; set; }
    public int? ResponseTimeMs { get; set; }
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
}
