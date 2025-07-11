using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Sales;
using backend.Models.Purchasing;
using backend.Models.POS;

namespace backend.Models.Inventory;

/// <summary>
/// Inventory item master data
/// Represents products/services that can be bought, sold, or manufactured
/// </summary>
public class Item : TenantEntity
{
    /// <summary>
    /// Stock Keeping Unit - unique identifier
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string SKU { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? NameHebrew { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Item category for classification
    /// </summary>
    [MaxLength(100)]
    public string? Category { get; set; }

    /// <summary>
    /// Unit of measure (piece, kg, liter, etc.)
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Unit { get; set; } = "piece";

    /// <summary>
    /// Cost price for purchasing
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal CostPrice { get; set; } = 0;

    /// <summary>
    /// Selling price
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal SellPrice { get; set; } = 0;

    /// <summary>
    /// Current stock quantity
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal CurrentStockQty { get; set; } = 0;

    /// <summary>
    /// Minimum stock level for reorder alerts
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal ReorderPoint { get; set; } = 0;

    /// <summary>
    /// Maximum stock level
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal MaxStockLevel { get; set; } = 0;

    /// <summary>
    /// Item type: Product, Service, Assembly
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string ItemType { get; set; } = "Product";

    /// <summary>
    /// Whether to track inventory for this item
    /// </summary>
    public bool IsInventoryTracked { get; set; } = true;

    /// <summary>
    /// Item is active for transactions
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Item can be sold
    /// </summary>
    public bool IsSellable { get; set; } = true;

    /// <summary>
    /// Item can be purchased
    /// </summary>
    public bool IsPurchasable { get; set; } = true;

    /// <summary>
    /// Weight for shipping calculations
    /// </summary>
    [Column(TypeName = "decimal(10,4)")]
    public decimal? Weight { get; set; }

    /// <summary>
    /// Volume for shipping calculations
    /// </summary>
    [Column(TypeName = "decimal(10,4)")]
    public decimal? Volume { get; set; }

    /// <summary>
    /// Barcode for scanning
    /// </summary>
    [MaxLength(50)]
    public string? Barcode { get; set; }

    /// <summary>
    /// Image URL or path
    /// </summary>
    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Preferred supplier for purchasing this item
    /// </summary>
    public int? PreferredSupplierId { get; set; }

    // Backward compatibility aliases
    /// <summary>
    /// Alias for SKU property (backward compatibility)
    /// </summary>
    [NotMapped]
    public string Sku => SKU;

    /// <summary>
    /// Alias for CostPrice property (backward compatibility)
    /// </summary>
    [NotMapped]
    public decimal Cost 
    { 
        get => CostPrice; 
        set => CostPrice = value; 
    }

    /// <summary>
    /// Alias for SellPrice property (backward compatibility)
    /// </summary>
    [NotMapped]
    public decimal Price => SellPrice;

    // Navigation properties
    public virtual ICollection<InventoryBOM> ParentBOMs { get; set; } = new List<InventoryBOM>();
    public virtual ICollection<InventoryBOM> ComponentBOMs { get; set; } = new List<InventoryBOM>();
    public virtual ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();
    public virtual ICollection<SalesOrderLine> SalesOrderLines { get; set; } = new List<SalesOrderLine>();
    public virtual ICollection<PurchaseOrderLine> PurchaseOrderLines { get; set; } = new List<PurchaseOrderLine>();
    public virtual ICollection<POSSaleLine> POSSaleLines { get; set; } = new List<POSSaleLine>();
}

/// <summary>
/// Bill of Materials - defines components needed to manufacture an item
/// </summary>
public class InventoryBOM : BaseEntity
{
    [Required]
    public int ParentItemId { get; set; }

    [Required]
    public int ComponentItemId { get; set; }

    /// <summary>
    /// Quantity of component needed per parent item
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    /// <summary>
    /// BOM is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Item ParentItem { get; set; } = null!;
    public virtual Item ComponentItem { get; set; } = null!;
}

/// <summary>
/// Transaction types for inventory movements
/// </summary>
public enum InventoryTransactionType
{
    Sale = 1,
    Purchase = 2,
    Adjustment = 3,
    Production = 4,
    Transfer = 5,
    Return = 6
}

/// <summary>
/// Inventory transactions - all stock movements
/// Maintains audit trail of inventory changes
/// </summary>
public class InventoryTransaction : TenantEntity
{
    [Required]
    public int ItemId { get; set; }

    [Required]
    public DateTime TransactionDate { get; set; }

    /// <summary>
    /// Quantity change (positive = increase, negative = decrease)
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityChange { get; set; }

    [Required]
    public InventoryTransactionType TransactionType { get; set; }

    /// <summary>
    /// Reference to source document (sales order, purchase order, etc.)
    /// </summary>
    [MaxLength(50)]
    public string? ReferenceType { get; set; }

    public int? ReferenceId { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Unit cost at time of transaction
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal? UnitCost { get; set; }

    /// <summary>
    /// Total value of transaction
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? TotalValue { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    // Backward compatibility aliases
    /// <summary>
    /// Alias for TransactionDate property (backward compatibility)
    /// </summary>
    [NotMapped]
    public DateTime Date 
    { 
        get => TransactionDate; 
        set => TransactionDate = value; 
    }

    /// <summary>
    /// Alias for QuantityChange property (backward compatibility)
    /// </summary>
    [NotMapped]
    public decimal QtyChange 
    { 
        get => QuantityChange; 
        set => QuantityChange = value; 
    }

    // Navigation properties
    public virtual Item Item { get; set; } = null!;
}
