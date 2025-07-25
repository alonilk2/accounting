using System.ComponentModel.DataAnnotations;
using backend.DTOs.Shared;

namespace backend.DTOs.Core;

/// <summary>
/// DTO for item filter requests with pagination
/// </summary>
public class ItemFilterRequest : PaginatedFilterRequest
{
    /// <summary>
    /// Filter by category
    /// </summary>
    [StringLength(100)]
    public string? Category { get; set; }

    /// <summary>
    /// Filter by active status
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// Filter by item type
    /// </summary>
    [StringLength(50)]
    public string? ItemType { get; set; }

    /// <summary>
    /// Filter by sellable status
    /// </summary>
    public bool? IsSellable { get; set; }

    /// <summary>
    /// Filter by purchasable status
    /// </summary>
    public bool? IsPurchasable { get; set; }

    /// <summary>
    /// Filter by inventory tracked status
    /// </summary>
    public bool? IsInventoryTracked { get; set; }
}

/// <summary>
/// DTO for paginated items response
/// </summary>
public class PaginatedItemsResponseDto
{
    public List<ItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
    public string? SearchTerm { get; set; }
    public string? Category { get; set; }
    public bool? IsActive { get; set; }
    public string? ItemType { get; set; }
}
