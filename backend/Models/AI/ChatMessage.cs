using backend.Models.Core;

namespace backend.Models.AI;

/// <summary>
/// Represents a message in the AI assistant chat conversation
/// </summary>
public class ChatMessage : TenantEntity
{
    /// <summary>
    /// ID of the conversation session
    /// </summary>
    public string SessionId { get; set; } = string.Empty;
    
    /// <summary>
    /// Message content
    /// </summary>
    public string Content { get; set; } = string.Empty;
    
    /// <summary>
    /// Message role: 'user', 'assistant', or 'system'
    /// </summary>
    public string Role { get; set; } = string.Empty;
    
    /// <summary>
    /// Timestamp when the message was created
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Optional context data (JSON) for AI processing
    /// </summary>
    public string? Context { get; set; }
    
    /// <summary>
    /// Confidence score from AI response (0.0 to 1.0)
    /// </summary>
    public decimal? ConfidenceScore { get; set; }
    
    /// <summary>
    /// Response time in milliseconds
    /// </summary>
    public int? ResponseTimeMs { get; set; }
    
    /// <summary>
    /// User who sent the message (for user messages)
    /// </summary>
    public int? UserId { get; set; }
    
    /// <summary>
    /// Related entity type (e.g., 'Invoice', 'Customer') if message is about specific entity
    /// </summary>
    public string? EntityType { get; set; }
    
    /// <summary>
    /// Related entity ID if message is about specific entity
    /// </summary>
    public int? EntityId { get; set; }
}
