using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Core;

/// <summary>
/// DTO for creating a new item
/// </summary>
public class CreateItemDto
{
    [Required]
    [StringLength(50)]
    public string Sku { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(200)]
    public string? NameHebrew { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [Required]
    [StringLength(20)]
    public string Unit { get; set; } = "piece";

    [Range(0, double.MaxValue)]
    public decimal CostPrice { get; set; } = 0;

    [Range(0, double.MaxValue)]
    public decimal SalePrice { get; set; } = 0;

    [Range(0, double.MaxValue)]
    public decimal SellPrice { get; set; } = 0;

    [Range(0, int.MaxValue)]
    public int CurrentStockQty { get; set; } = 0;

    [Range(0, int.MaxValue)]
    public int ReorderPoint { get; set; } = 0;

    [Range(0, double.MaxValue)]
    public decimal MaxStockLevel { get; set; } = 0;

    [StringLength(20)]
    public string ItemType { get; set; } = "Product";

    public bool IsInventoryTracked { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public bool TrackInventory { get; set; } = true;
    public bool IsSellable { get; set; } = true;
    public bool IsPurchasable { get; set; } = true;

    [Range(0, double.MaxValue)]
    public decimal? Weight { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Volume { get; set; }

    [StringLength(50)]
    public string? Barcode { get; set; }

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    public int? PreferredSupplierId { get; set; }
}
