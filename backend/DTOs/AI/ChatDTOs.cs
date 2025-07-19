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
    
    /// <summary>
    /// Type of message - text or interactive
    /// </summary>
    public string Type { get; set; } = "text";
    
    /// <summary>
    /// Interactive message data for forms, confirmations, etc.
    /// </summary>
    public InteractiveMessageData? InteractiveData { get; set; }
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

/// <summary>
/// Chat session DTO
/// </summary>
public class ChatSessionDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int MessageCount { get; set; }
    public string? LastMessage { get; set; }
}

/// <summary>
/// Chat sessions response
/// </summary>
public class ChatSessionsResponse
{
    public List<ChatSessionDto> Sessions { get; set; } = new();
    public int TotalCount { get; set; }
}

/// <summary>
/// Interactive message data for complex UI interactions
/// </summary>
public class InteractiveMessageData
{
    /// <summary>
    /// Type of interactive component
    /// </summary>
    public string ComponentType { get; set; } = string.Empty; // "confirmation", "form", "selection", "action"
    
    /// <summary>
    /// Message title
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Optional description
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Additional data for the component
    /// </summary>
    public object? Data { get; set; }
    
    /// <summary>
    /// Available actions for the user
    /// </summary>
    public List<InteractiveAction>? Actions { get; set; }
    
    /// <summary>
    /// Form fields for form-type messages
    /// </summary>
    public List<FormField>? Fields { get; set; }
    
    /// <summary>
    /// Selection options for selection-type messages
    /// </summary>
    public List<SelectionOption>? Options { get; set; }
}

/// <summary>
/// Interactive action definition
/// </summary>
public class InteractiveAction
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Variant { get; set; } = "contained"; // "contained", "outlined", "text"
    public string? Color { get; set; } = "primary"; // "primary", "secondary", "error", etc.
    public string Action { get; set; } = string.Empty;
    public object? Data { get; set; }
}

/// <summary>
/// Form field definition for interactive forms
/// </summary>
public class FormField
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Type { get; set; } = "text"; // "text", "number", "email", "select", "date", etc.
    public bool Required { get; set; } = false;
    public object? DefaultValue { get; set; }
    public List<FieldOption>? Options { get; set; }
    public FieldValidation? Validation { get; set; }
}

/// <summary>
/// Field option for select fields
/// </summary>
public class FieldOption
{
    public object Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}

/// <summary>
/// Field validation rules
/// </summary>
public class FieldValidation
{
    public int? Min { get; set; }
    public int? Max { get; set; }
    public string? Pattern { get; set; }
    public string? Message { get; set; }
}

/// <summary>
/// Selection option for selection-type messages
/// </summary>
public class SelectionOption
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public object Value { get; set; } = string.Empty;
}
