using Microsoft.AspNetCore.Mvc;
using backend.DTOs.Shared;

namespace backend.Controllers;

/// <summary>
/// Base controller providing common functionality for all API controllers
/// Includes standardized error handling, response patterns, and multi-tenant security
/// </summary>
[ApiController]
[Produces("application/json")]
public abstract class BaseApiController : ControllerBase
{
    protected readonly ILogger _logger;

    protected BaseApiController(ILogger logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get the current company ID from user context or query parameter
    /// In a real application, this would extract from JWT token or user session
    /// </summary>
    /// <param name="companyIdParam">Optional company ID from query parameter</param>
    /// <returns>Company ID for current user</returns>
    protected virtual int GetCurrentCompanyId(int? companyIdParam = null)
    {
        // TODO: In production, extract from authenticated user's JWT token
        // For now, use parameter or default to 1
        return companyIdParam ?? 1;
    }

    /// <summary>
    /// Get the current user ID from user context
    /// In a real application, this would extract from JWT token or user session
    /// </summary>
    /// <returns>User ID for current user</returns>
    protected virtual string GetCurrentUserId()
    {
        // TODO: In production, extract from authenticated user's JWT token
        // For now, return system user ID
        return "1"; // Default system user
    }

    /// <summary>
    /// Create a standardized success response with data
    /// </summary>
    /// <typeparam name="T">Data type</typeparam>
    /// <param name="data">Response data</param>
    /// <param name="message">Optional success message</param>
    /// <returns>Standardized API response</returns>
    protected ActionResult<T> SuccessResponse<T>(T data, string? message = null)
    {
        return Ok(new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Message = message
        });
    }

    /// <summary>
    /// Create a standardized error response
    /// </summary>
    /// <param name="message">Error message</param>
    /// <param name="statusCode">HTTP status code</param>
    /// <param name="details">Optional error details</param>
    /// <returns>Standardized error response</returns>
    protected ActionResult ErrorResponse(string message, int statusCode = 500, object? details = null)
    {
        var response = new ApiResponse<object>
        {
            Success = false,
            Message = message,
            Data = details
        };

        return statusCode switch
        {
            400 => BadRequest(response),
            401 => Unauthorized(response),
            403 => Forbid(),
            404 => NotFound(response),
            409 => Conflict(response),
            _ => StatusCode(statusCode, response)
        };
    }

    /// <summary>
    /// Handle common exceptions and return standardized error responses
    /// </summary>
    /// <param name="ex">Exception to handle</param>
    /// <param name="operation">Description of the operation that failed</param>
    /// <returns>Standardized error response</returns>
    protected ActionResult HandleException(Exception ex, string operation)
    {
        _logger.LogError(ex, "Error during {Operation}", operation);

        return ex switch
        {
            ArgumentException argEx => ErrorResponse(argEx.Message, 400),
            InvalidOperationException invEx => ErrorResponse(invEx.Message, 400),
            UnauthorizedAccessException _ => ErrorResponse("Access denied", 403),
            KeyNotFoundException _ => ErrorResponse("Resource not found", 404),
            _ => ErrorResponse("An internal error occurred", 500)
        };
    }

    /// <summary>
    /// Validate pagination parameters and return normalized values
    /// </summary>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Items per page</param>
    /// <returns>Validated pagination parameters</returns>
    protected (int page, int pageSize) ValidatePagination(int page, int pageSize)
    {
        const int maxPageSize = 1000;
        const int defaultPageSize = 50;

        page = Math.Max(1, page);
        pageSize = Math.Min(Math.Max(1, pageSize), maxPageSize);
        
        if (pageSize <= 0)
            pageSize = defaultPageSize;

        return (page, pageSize);
    }
}

/// <summary>
/// Standardized API response wrapper
/// </summary>
/// <typeparam name="T">Response data type</typeparam>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}