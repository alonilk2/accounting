namespace backend.DTOs.Core;

/// <summary>
/// Item DTO for API responses
/// </summary>
public class ItemDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? NameHebrew { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal SellPrice { get; set; } // Alias for backward compatibility
    public int CurrentStockQty { get; set; }
    public int ReorderPoint { get; set; }
    public decimal MaxStockLevel { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public bool IsInventoryTracked { get; set; }
    public bool IsActive { get; set; }
    public bool IsSellable { get; set; }
    public bool IsPurchasable { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Volume { get; set; }
    public string? Barcode { get; set; }
    public string? ImageUrl { get; set; }
    public int? PreferredSupplierId { get; set; }
    public string? PreferredSupplierName { get; set; }
    public bool TrackInventory { get; set; }
    
    // Backward compatibility
    public decimal Cost { get; set; }
    public decimal Price { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
