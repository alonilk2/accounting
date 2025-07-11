using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace backend.Services.Core;

/// <summary>
/// Helper class for managing database transactions with execution strategies
/// Handles the conflict between retry execution strategies and user-initiated transactions
/// </summary>
public static class TransactionHelper
{
    /// <summary>
    /// Executes a function within a transaction using the execution strategy
    /// This resolves the conflict between retry strategies and explicit transactions
    /// </summary>
    /// <typeparam name="T">Return type of the function</typeparam>
    /// <param name="context">Database context</param>
    /// <param name="operation">Operation to execute within transaction</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result of the operation</returns>
    public static async Task<T> ExecuteInTransactionAsync<T>(
        DbContext context, 
        Func<IDbContextTransaction, CancellationToken, Task<T>> operation,
        CancellationToken cancellationToken = default)
    {
        var strategy = context.Database.CreateExecutionStrategy();
        
        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var result = await operation(transaction, cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return result;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    /// <summary>
    /// Executes an action within a transaction using the execution strategy
    /// </summary>
    /// <param name="context">Database context</param>
    /// <param name="operation">Operation to execute within transaction</param>
    /// <param name="cancellationToken">Cancellation token</param>
    public static async Task ExecuteInTransactionAsync(
        DbContext context, 
        Func<IDbContextTransaction, CancellationToken, Task> operation,
        CancellationToken cancellationToken = default)
    {
        var strategy = context.Database.CreateExecutionStrategy();
        
        await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await operation(transaction, cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }
}
