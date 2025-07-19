using backend.DTOs.AI;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

/// <summary>
/// AI Assistant controller for handling chat interactions and AI-powered features
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication for all AI assistant endpoints
public class AIAssistantController : ControllerBase
{
    private readonly IAIAssistantService _aiAssistantService;
    private readonly ILogger<AIAssistantController> _logger;

    public AIAssistantController(
        IAIAssistantService aiAssistantService,
        ILogger<AIAssistantController> logger)
    {
        _aiAssistantService = aiAssistantService;
        _logger = logger;
    }

    /// <summary>
    /// Send a message to the AI assistant
    /// </summary>
    /// <param name="request">Chat request containing the user message and context</param>
    /// <returns>AI assistant response</returns>
    [HttpPost("chat")]
    [AllowAnonymous] // Allow anonymous access for development
    public async Task<ActionResult<ChatResponse>> SendMessage([FromBody] ChatRequest request)
    {
        try
        {
            // Get company ID from user claims (multi-tenant) or use development default
            var companyId = GetCompanyIdFromClaims();
            var userId = GetUserIdFromClaims();

            // For development: use default company ID if not available from claims
            if (companyId == 0)
            {
                companyId = 1; // Development default company ID
                _logger.LogWarning("Using development default company ID: {CompanyId}", companyId);
            }

            // Validate request
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "הודעה ריקה אינה מותרת" });
            }

            if (request.Message.Length > 2000)
            {
                return BadRequest(new { message = "ההודעה ארוכה מדי (מקסימום 2000 תווים)" });
            }

            var response = await _aiAssistantService.SendMessageAsync(request, companyId, userId);
            
            if (!response.IsSuccess)
            {
                return BadRequest(new { message = response.ErrorMessage });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing AI chat request");
            return StatusCode(500, new { message = "שגיאה פנימית בשרת" });
        }
    }

    /// <summary>
    /// Get chat history for a session or user
    /// </summary>
    /// <param name="sessionId">Optional session ID to filter by</param>
    /// <param name="skip">Number of messages to skip (for pagination)</param>
    /// <param name="take">Number of messages to take (for pagination)</param>
    /// <returns>Chat history</returns>
    [HttpGet("history")]
    [AllowAnonymous] // Allow anonymous access for development
    public async Task<ActionResult<ChatHistoryResponse>> GetChatHistory(
        [FromQuery] string? sessionId = null,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        try
        {
            var companyId = GetCompanyIdFromClaims();

            // For development: use default company ID if not available from claims
            if (companyId == 0)
            {
                companyId = 1; // Development default company ID
                _logger.LogWarning("Using development default company ID: {CompanyId}", companyId);
            }

            // Validate pagination parameters
            if (skip < 0 || take <= 0 || take > 100)
            {
                return BadRequest(new { message = "פרמטרי pagination לא תקינים" });
            }

            var request = new ChatHistoryRequest
            {
                SessionId = sessionId,
                Skip = skip,
                Take = take
            };

            var response = await _aiAssistantService.GetChatHistoryAsync(request, companyId, GetUserIdFromClaims());
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving chat history");
            return StatusCode(500, new { message = "שגיאה פנימית בשרת" });
        }
    }

    /// <summary>
    /// Clear chat history for a specific session
    /// </summary>
    /// <param name="sessionId">Session ID to clear</param>
    [HttpDelete("history/{sessionId}")]
    [AllowAnonymous] // Allow anonymous access for development
    public async Task<ActionResult> ClearChatHistory(string sessionId)
    {
        try
        {
            var companyId = GetCompanyIdFromClaims();

            // For development: use default company ID if not available from claims
            if (companyId == 0)
            {
                companyId = 1; // Development default company ID
                _logger.LogWarning("Using development default company ID: {CompanyId}", companyId);
            }

            if (string.IsNullOrWhiteSpace(sessionId))
            {
                return BadRequest(new { message = "מזהה הסשן נדרש" });
            }

            await _aiAssistantService.ClearChatHistoryAsync(sessionId, companyId);
            return Ok(new { message = "היסטוריית הצ'אט נמחקה בהצלחה" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing chat history for session {SessionId}", sessionId);
            return StatusCode(500, new { message = "שגיאה פנימית בשרת" });
        }
    }

    /// <summary>
    /// Get chat sessions for the current company
    /// </summary>
    /// <returns>List of chat sessions</returns>
    [HttpGet("sessions")]
    [AllowAnonymous] // Allow anonymous access for development
    public async Task<ActionResult<ChatSessionsResponse>> GetChatSessions()
    {
        try
        {
            var companyId = GetCompanyIdFromClaims();
            var userId = GetUserIdFromClaims();

            // For development: use default company ID if not available from claims
            if (companyId == 0)
            {
                companyId = 1; // Development default company ID
                _logger.LogWarning("Using development default company ID: {CompanyId}", companyId);
            }

            var response = await _aiAssistantService.GetChatSessionsAsync(companyId, userId);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving chat sessions");
            return StatusCode(500, new { message = "שגיאה פנימית בשרת" });
        }
    }

    /// <summary>
    /// Check if AI assistant is available for the current company
    /// </summary>
    /// <returns>Availability status</returns>
    [HttpGet("availability")]
    [AllowAnonymous] // Allow anonymous access for development
    public async Task<ActionResult<object>> CheckAvailability()
    {
        try
        {
            var companyId = GetCompanyIdFromClaims();

            // For development: use default company ID if not available from claims
            if (companyId == 0)
            {
                companyId = 1; // Development default company ID
                _logger.LogWarning("Using development default company ID: {CompanyId}", companyId);
            }

            var isAvailable = await _aiAssistantService.IsAvailableAsync(companyId);
            var config = await _aiAssistantService.GetConfigAsync(companyId);

            return Ok(new
            {
                isAvailable,
                dailyUsageLimit = config.DailyUsageLimit,
                currentDailyUsage = config.CurrentDailyUsage,
                remainingUsage = Math.Max(0, config.DailyUsageLimit - config.CurrentDailyUsage),
                isEnabled = config.IsEnabled
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking AI assistant availability");
            return StatusCode(500, new { message = "שגיאה פנימית בשרת" });
        }
    }

    /// <summary>
    /// Generate a financial report using AI
    /// </summary>
    /// <param name="request">Report generation request</param>
    /// <returns>Generated report content</returns>
    [HttpPost("generate-report")]
    public async Task<ActionResult<object>> GenerateReport([FromBody] ReportGenerationRequest request)
    {
        try
        {
            var companyId = GetCompanyIdFromClaims();

            if (companyId == 0)
            {
                return BadRequest(new { message = "מזהה החברה לא נמצא" });
            }

            if (string.IsNullOrWhiteSpace(request.ReportType))
            {
                return BadRequest(new { message = "סוג הדוח נדרש" });
            }

            // Check if AI assistant is available
            if (!await _aiAssistantService.IsAvailableAsync(companyId))
            {
                return BadRequest(new { message = "מגבלת השימוש היומית הגיעה לקצה" });
            }

            var reportContent = await _aiAssistantService.GenerateReportAsync(
                request.ReportType, 
                companyId, 
                request.Parameters);

            return Ok(new
            {
                reportType = request.ReportType,
                content = reportContent,
                generatedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating AI report");
            return StatusCode(500, new { message = "שגיאה פנימית בשרת" });
        }
    }

    /// <summary>
    /// Get AI assistant configuration (admin only)
    /// </summary>
    /// <returns>AI assistant configuration</returns>
    [HttpGet("config")]
    [Authorize(Roles = "Admin,Owner")] // Only admin or owner can view config
    public async Task<ActionResult<object>> GetConfig()
    {
        try
        {
            var companyId = GetCompanyIdFromClaims();

            if (companyId == 0)
            {
                return BadRequest(new { message = "מזהה החברה לא נמצא" });
            }

            var config = await _aiAssistantService.GetConfigAsync(companyId);

            // Return config without sensitive information
            return Ok(new
            {
                config.IsEnabled,
                config.OpenAIModel,
                config.MaxTokens,
                config.Temperature,
                config.DailyUsageLimit,
                config.CurrentDailyUsage,
                config.EnabledFeatures,
                config.LastUsageReset
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving AI assistant config");
            return StatusCode(500, new { message = "שגיאה פנימית בשרת" });
        }
    }

    /// <summary>
    /// Update AI assistant configuration (admin only)
    /// </summary>
    /// <param name="request">Configuration update request</param>
    [HttpPut("config")]
    [Authorize(Roles = "Admin,Owner")] // Only admin or owner can update config
    public async Task<ActionResult> UpdateConfig([FromBody] AIConfigUpdateRequest request)
    {
        try
        {
            var companyId = GetCompanyIdFromClaims();

            if (companyId == 0)
            {
                return BadRequest(new { message = "מזהה החברה לא נמצא" });
            }

            var config = await _aiAssistantService.GetConfigAsync(companyId);

            // Update only allowed fields
            if (request.IsEnabled.HasValue)
                config.IsEnabled = request.IsEnabled.Value;

            if (!string.IsNullOrWhiteSpace(request.OpenAIModel))
                config.OpenAIModel = request.OpenAIModel;

            if (request.MaxTokens.HasValue && request.MaxTokens.Value > 0 && request.MaxTokens.Value <= 4000)
                config.MaxTokens = request.MaxTokens.Value;

            if (request.Temperature.HasValue && request.Temperature.Value >= 0 && request.Temperature.Value <= 1)
                config.Temperature = request.Temperature.Value;

            if (request.DailyUsageLimit.HasValue && request.DailyUsageLimit.Value > 0)
                config.DailyUsageLimit = request.DailyUsageLimit.Value;

            if (!string.IsNullOrWhiteSpace(request.EnabledFeatures))
                config.EnabledFeatures = request.EnabledFeatures;

            await _aiAssistantService.UpdateConfigAsync(config);

            return Ok(new { message = "הגדרות העוזר החכם עודכנו בהצלחה" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating AI assistant config");
            return StatusCode(500, new { message = "שגיאה פנימית בשרת" });
        }
    }

    /// <summary>
    /// Get company ID from JWT claims with development fallback
    /// </summary>
    private int GetCompanyIdFromClaims()
    {
        // In development or when not authenticated, return default company ID
        if (User?.Identity?.IsAuthenticated != true)
        {
            return 1; // Development default
        }

        var companyIdClaim = User.FindFirst("company_id")?.Value;
        return int.TryParse(companyIdClaim, out var companyId) ? companyId : 1; // Fallback to 1
    }

    /// <summary>
    /// Get user ID from JWT claims with development fallback
    /// </summary>
    private int? GetUserIdFromClaims()
    {
        // In development or when not authenticated, return null
        if (User?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var userIdClaim = User.FindFirst("user_id")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

/// <summary>
/// Request for generating AI reports
/// </summary>
public class ReportGenerationRequest
{
    public string ReportType { get; set; } = string.Empty;
    public Dictionary<string, object>? Parameters { get; set; }
}

/// <summary>
/// Request for updating AI assistant configuration
/// </summary>
public class AIConfigUpdateRequest
{
    public bool? IsEnabled { get; set; }
    public string? OpenAIModel { get; set; }
    public int? MaxTokens { get; set; }
    public decimal? Temperature { get; set; }
    public int? DailyUsageLimit { get; set; }
    public string? EnabledFeatures { get; set; }
}
