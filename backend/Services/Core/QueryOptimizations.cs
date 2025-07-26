using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace backend.Services.Core;

/// <summary>
/// Query optimization utilities for Entity Framework queries
/// Provides common patterns for efficient database access
/// </summary>
public static class QueryOptimizations
{
    /// <summary>
    /// Apply common optimization patterns to a query
    /// - AsNoTracking for read-only queries
    /// - Soft delete filtering
    /// - Company filtering for multi-tenancy
    /// </summary>
    /// <typeparam name="T">Entity type</typeparam>
    /// <param name="query">Base query</param>
    /// <param name="companyId">Company ID for filtering</param>
    /// <param name="includeDeleted">Whether to include soft-deleted records</param>
    /// <returns>Optimized query</returns>
    public static IQueryable<T> ApplyStandardFilters<T>(
        this IQueryable<T> query, 
        int companyId, 
        bool includeDeleted = false) 
        where T : class
    {
        // Apply no-tracking for better performance on read-only queries
        query = query.AsNoTracking();

        // Apply company filtering if the entity has a CompanyId property
        var companyProperty = typeof(T).GetProperty("CompanyId");
        if (companyProperty != null && companyProperty.PropertyType == typeof(int))
        {
            var parameter = Expression.Parameter(typeof(T), "e");
            var property = Expression.Property(parameter, "CompanyId");
            var constant = Expression.Constant(companyId);
            var equal = Expression.Equal(property, constant);
            var lambda = Expression.Lambda<Func<T, bool>>(equal, parameter);
            
            query = query.Where(lambda);
        }

        // Apply soft delete filtering if the entity has an IsDeleted property
        if (!includeDeleted)
        {
            var isDeletedProperty = typeof(T).GetProperty("IsDeleted");
            if (isDeletedProperty != null && isDeletedProperty.PropertyType == typeof(bool))
            {
                var parameter = Expression.Parameter(typeof(T), "e");
                var property = Expression.Property(parameter, "IsDeleted");
                var constant = Expression.Constant(false);
                var equal = Expression.Equal(property, constant);
                var lambda = Expression.Lambda<Func<T, bool>>(equal, parameter);
                
                query = query.Where(lambda);
            }
        }

        return query;
    }

    /// <summary>
    /// Apply pagination efficiently with proper ordering
    /// </summary>
    /// <typeparam name="T">Entity type</typeparam>
    /// <typeparam name="TKey">Key type for ordering</typeparam>
    /// <param name="query">Base query</param>
    /// <param name="orderBy">Order by expression</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Items per page</param>
    /// <param name="ascending">Sort order</param>
    /// <returns>Paginated query</returns>
    public static IQueryable<T> ApplyPagination<T, TKey>(
        this IQueryable<T> query,
        Expression<Func<T, TKey>> orderBy,
        int page,
        int pageSize,
        bool ascending = true) where T : class
    {
        // Ensure proper ordering for consistent pagination
        var orderedQuery = ascending 
            ? query.OrderBy(orderBy)
            : query.OrderByDescending(orderBy);

        // Apply pagination
        return orderedQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
    }

    /// <summary>
    /// Apply text search across multiple string properties
    /// </summary>
    /// <typeparam name="T">Entity type</typeparam>
    /// <param name="query">Base query</param>
    /// <param name="searchTerm">Search term</param>
    /// <param name="searchProperties">Properties to search in</param>
    /// <returns>Filtered query</returns>
    public static IQueryable<T> ApplyTextSearch<T>(
        this IQueryable<T> query,
        string? searchTerm,
        params Expression<Func<T, string>>[] searchProperties) where T : class
    {
        if (string.IsNullOrWhiteSpace(searchTerm) || searchProperties.Length == 0)
            return query;

        var searchTermLower = searchTerm.Trim().ToLower();
        
        // Build OR condition for all search properties
        Expression<Func<T, bool>>? combinedExpression = null;
        
        foreach (var property in searchProperties)
        {
            // Create expression: property.ToLower().Contains(searchTermLower)
            var parameter = property.Parameters.First();
            var propertyExpression = property.Body;
            
            // Handle nullable strings
            var nullCheck = Expression.NotEqual(propertyExpression, Expression.Constant(null));
            var toLowerCall = Expression.Call(propertyExpression, "ToLower", null);
            var containsCall = Expression.Call(toLowerCall, "Contains", null, Expression.Constant(searchTermLower));
            var safeContains = Expression.AndAlso(nullCheck, containsCall);
            
            var lambda = Expression.Lambda<Func<T, bool>>(safeContains, parameter);
            
            combinedExpression = combinedExpression == null 
                ? lambda 
                : CombineWithOr(combinedExpression, lambda);
        }

        return combinedExpression != null ? query.Where(combinedExpression) : query;
    }

    /// <summary>
    /// Combine two expressions with OR logic
    /// </summary>
    private static Expression<Func<T, bool>> CombineWithOr<T>(
        Expression<Func<T, bool>> first,
        Expression<Func<T, bool>> second)
    {
        var parameter = Expression.Parameter(typeof(T));
        var firstBody = ReplaceParameter(first.Body, first.Parameters[0], parameter);
        var secondBody = ReplaceParameter(second.Body, second.Parameters[0], parameter);
        return Expression.Lambda<Func<T, bool>>(Expression.OrElse(firstBody, secondBody), parameter);
    }

    /// <summary>
    /// Replace parameter in expression
    /// </summary>
    private static Expression ReplaceParameter(Expression expression, ParameterExpression oldParameter, ParameterExpression newParameter)
    {
        return new ParameterReplacer(oldParameter, newParameter).Visit(expression);
    }
}

/// <summary>
/// Expression visitor for parameter replacement
/// </summary>
internal class ParameterReplacer : ExpressionVisitor
{
    private readonly ParameterExpression _oldParameter;
    private readonly ParameterExpression _newParameter;

    public ParameterReplacer(ParameterExpression oldParameter, ParameterExpression newParameter)
    {
        _oldParameter = oldParameter;
        _newParameter = newParameter;
    }

    protected override Expression VisitParameter(ParameterExpression node)
    {
        return node == _oldParameter ? _newParameter : base.VisitParameter(node);
    }
}