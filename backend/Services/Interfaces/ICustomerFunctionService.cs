using backend.Services.Interfaces;

namespace backend.Services.Interfaces;

/// <summary>
/// Interface for customer-related function calling service
/// Provides functions that can be called by AI Assistant to access customer data
/// </summary>
public interface ICustomerFunctionService
{
    /// <summary>
    /// Get list of all available customer functions for AI
    /// </summary>
    /// <returns>List of function definitions</returns>
    List<FunctionDefinition> GetCustomerFunctions();

    /// <summary>
    /// Execute a customer-related function
    /// </summary>
    /// <param name="functionCall">Function call details from OpenAI</param>
    /// <param name="companyId">Company ID for security filtering</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Function execution result</returns>
    Task<FunctionResult> ExecuteCustomerFunctionAsync(
        FunctionCall functionCall, 
        int companyId, 
        CancellationToken cancellationToken = default);
}
