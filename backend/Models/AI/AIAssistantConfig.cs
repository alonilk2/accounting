namespace backend.Models.AI;

/// <summary>
/// Configuration for AI assistant settings per company
/// </summary>
public class AIAssistantConfig
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    
    /// <summary>
    /// Whether AI assistant is enabled for this company
    /// </summary>
    public bool IsEnabled { get; set; } = true;
    
    /// <summary>
    /// OpenAI model to use (e.g., "gpt-4", "gpt-3.5-turbo")
    /// </summary>
    public string OpenAIModel { get; set; } = "gpt-4";
    
    /// <summary>
    /// Maximum tokens per response
    /// </summary>
    public int MaxTokens { get; set; } = 1000;
    
    /// <summary>
    /// Temperature for AI responses (0.0 to 1.0)
    /// </summary>
    public decimal Temperature { get; set; } = 0.7m;
    
    /// <summary>
    /// System prompt template for the AI assistant
    /// </summary>
    public string SystemPrompt { get; set; } = @"
        You are an AI accounting assistant for an Israeli business. 
        You help with financial questions, analysis, and general accounting tasks.
        Always respond in Hebrew unless specifically asked to use English.
        Be professional, accurate, and helpful.
        If you're unsure about specific tax regulations, recommend consulting with a certified accountant.
    ";
    
    /// <summary>
    /// Features enabled for this company
    /// </summary>
    public string EnabledFeatures { get; set; } = "chat,reports,analysis";
    
    /// <summary>
    /// Daily usage limit (number of messages)
    /// </summary>
    public int DailyUsageLimit { get; set; } = 100;
    
    /// <summary>
    /// Current daily usage count
    /// </summary>
    public int CurrentDailyUsage { get; set; } = 0;
    
    /// <summary>
    /// Last reset date for daily usage
    /// </summary>
    public DateTime LastUsageReset { get; set; } = DateTime.UtcNow.Date;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
