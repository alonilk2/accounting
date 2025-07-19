using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Shared;

/// <summary>
/// Generic paginated response container
/// </summary>
/// <typeparam name="T">The type of data being paginated</typeparam>
public class PaginatedResponse<T>
{
    /// <summary>
    /// The data items for the current page
    /// </summary>
    public IEnumerable<T> Data { get; set; } = [];

    /// <summary>
    /// Current page number (1-based)
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of items across all pages
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// Whether there is a previous page
    /// </summary>
    public bool HasPreviousPage { get; set; }

    /// <summary>
    /// Whether there is a next page
    /// </summary>
    public bool HasNextPage { get; set; }

    /// <summary>
    /// Create a paginated response
    /// </summary>
    public static PaginatedResponse<T> Create(IEnumerable<T> data, int page, int pageSize, int totalCount)
    {
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        
        return new PaginatedResponse<T>
        {
            Data = data,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasPreviousPage = page > 1,
            HasNextPage = page < totalPages
        };
    }
}

/// <summary>
/// Pagination request parameters
/// </summary>
public class PaginationRequest
{
    private int _page = 1;
    private int _pageSize = 25;

    /// <summary>
    /// Page number (1-based)
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Page must be greater than 0")]
    public int Page 
    { 
        get => _page; 
        set => _page = Math.Max(1, value); 
    }

    /// <summary>
    /// Number of items per page
    /// </summary>
    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
    public int PageSize 
    { 
        get => _pageSize; 
        set => _pageSize = Math.Clamp(value, 1, 100); 
    }
}

/// <summary>
/// Base class for paginated filter requests
/// </summary>
public abstract class PaginatedFilterRequest : PaginationRequest
{
    /// <summary>
    /// Search term for filtering
    /// </summary>
    [StringLength(100)]
    public string? SearchTerm { get; set; }

    /// <summary>
    /// Company ID for multi-tenant filtering
    /// </summary>
    [Required]
    [Range(1, int.MaxValue)]
    public int CompanyId { get; set; }
}
