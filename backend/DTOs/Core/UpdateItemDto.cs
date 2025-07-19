using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Core;

/// <summary>
/// DTO for updating an existing item
/// </summary>
public class UpdateItemDto
{
    [StringLength(50)]
    public string? Sku { get; set; }

    [StringLength(200)]
    public string? Name { get; set; }

    [StringLength(200)]
    public string? NameHebrew { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(20)]
    public string? Unit { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? CostPrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? SalePrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? SellPrice { get; set; }

    [Range(0, int.MaxValue)]
    public int? CurrentStockQty { get; set; }

    [Range(0, int.MaxValue)]
    public int? ReorderPoint { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? MaxStockLevel { get; set; }

    [StringLength(20)]
    public string? ItemType { get; set; }

    public bool? IsInventoryTracked { get; set; }
    public bool? IsActive { get; set; }
    public bool? TrackInventory { get; set; }
    public bool? IsSellable { get; set; }
    public bool? IsPurchasable { get; set; }

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
