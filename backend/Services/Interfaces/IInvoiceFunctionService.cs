using backend.Services.Interfaces;

namespace backend.Services.Interfaces;

/// <summary>
/// Interface for invoice-related function calling service
/// Provides functions that can be called by AI Assistant to access and manage invoice data
/// </summary>
public interface IInvoiceFunctionService
{
    /// <summary>
    /// Get list of all available invoice functions for AI
    /// </summary>
    /// <returns>List of function definitions</returns>
    List<FunctionDefinition> GetInvoiceFunctions();

    /// <summary>
    /// Execute an invoice-related function
    /// </summary>
    /// <param name="functionCall">Function call details from OpenAI</param>
    /// <param name="companyId">Company ID for security filtering</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Function execution result</returns>
    Task<FunctionResult> ExecuteInvoiceFunctionAsync(
        FunctionCall functionCall, 
        int companyId, 
        CancellationToken cancellationToken = default);
}
