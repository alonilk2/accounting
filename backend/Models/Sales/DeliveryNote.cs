using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;
using backend.Models.Sales;
using backend.Models.Inventory;

namespace backend.Models.Sales;

/// <summary>
/// Delivery note status
/// </summary>
public enum DeliveryNoteStatus
{
    Draft = 1,
    Prepared = 2,
    InTransit = 3,
    Delivered = 4,
    Returned = 5,
    Cancelled = 6
}

/// <summary>
/// Delivery Note - separate document for shipments
/// Tracks actual deliveries to customers
/// </summary>
public class DeliveryNote : TenantEntity
{
    [Required]
    public int CustomerId { get; set; }

    /// <summary>
    /// Reference to original sales order
    /// </summary>
    public int? SalesOrderId { get; set; }

    /// <summary>
    /// Delivery note number (sequential)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string DeliveryNoteNumber { get; set; } = string.Empty;

    [Required]
    public DateTime DeliveryDate { get; set; }

    /// <summary>
    /// Expected delivery time
    /// </summary>
    public DateTime? ExpectedDeliveryTime { get; set; }

    /// <summary>
    /// Actual delivery time
    /// </summary>
    public DateTime? ActualDeliveryTime { get; set; }

    [Required]
    public DeliveryNoteStatus Status { get; set; } = DeliveryNoteStatus.Draft;

    /// <summary>
    /// Delivery address
    /// </summary>
    [MaxLength(500)]
    public string? DeliveryAddress { get; set; }

    /// <summary>
    /// Contact person at delivery location
    /// </summary>
    [MaxLength(100)]
    public string? ContactPerson { get; set; }

    /// <summary>
    /// Contact phone at delivery location
    /// </summary>
    [MaxLength(50)]
    public string? ContactPhone { get; set; }

    /// <summary>
    /// Driver name
    /// </summary>
    [MaxLength(100)]
    public string? DriverName { get; set; }

    /// <summary>
    /// Vehicle license plate
    /// </summary>
    [MaxLength(20)]
    public string? VehiclePlate { get; set; }

    /// <summary>
    /// Total quantity delivered
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal TotalQuantity { get; set; } = 0;

    /// <summary>
    /// Total weight (kg)
    /// </summary>
    [Column(TypeName = "decimal(18,3)")]
    public decimal? TotalWeight { get; set; }

    /// <summary>
    /// Total volume (m³)
    /// </summary>
    [Column(TypeName = "decimal(18,3)")]
    public decimal? TotalVolume { get; set; }

    /// <summary>
    /// Delivery instructions
    /// </summary>
    [MaxLength(1000)]
    public string? DeliveryInstructions { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Customer signature (base64 or reference)
    /// </summary>
    [MaxLength(5000)]
    public string? CustomerSignature { get; set; }

    /// <summary>
    /// Name of person who received the delivery
    /// </summary>
    [MaxLength(100)]
    public string? ReceivedByName { get; set; }

    /// <summary>
    /// When the delivery was received
    /// </summary>
    public DateTime? ReceivedAt { get; set; }

    /// <summary>
    /// Tracking number for external courier
    /// </summary>
    [MaxLength(100)]
    public string? TrackingNumber { get; set; }

    /// <summary>
    /// Courier service name
    /// </summary>
    [MaxLength(100)]
    public string? CourierService { get; set; }

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual SalesOrder? SalesOrder { get; set; }
    public virtual ICollection<DeliveryNoteLine> Lines { get; set; } = new List<DeliveryNoteLine>();
}

/// <summary>
/// Line items for delivery notes
/// </summary>
public class DeliveryNoteLine : TenantEntity
{
    [Required]
    public int DeliveryNoteId { get; set; }

    [Required]
    public int ItemId { get; set; }

    /// <summary>
    /// Reference to sales order line (if applicable)
    /// </summary>
    public int? SalesOrderLineId { get; set; }

    /// <summary>
    /// Line sequence number
    /// </summary>
    public int LineNumber { get; set; } = 1;

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Quantity ordered
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityOrdered { get; set; }

    /// <summary>
    /// Quantity actually delivered
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityDelivered { get; set; }

    /// <summary>
    /// Quantity returned (if any)
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal QuantityReturned { get; set; } = 0;

    /// <summary>
    /// Unit of measure
    /// </summary>
    [MaxLength(50)]
    public string? Unit { get; set; }

    /// <summary>
    /// Weight per unit (kg)
    /// </summary>
    [Column(TypeName = "decimal(18,3)")]
    public decimal? UnitWeight { get; set; }

    /// <summary>
    /// Volume per unit (m³)
    /// </summary>
    [Column(TypeName = "decimal(18,3)")]
    public decimal? UnitVolume { get; set; }

    /// <summary>
    /// Serial numbers for serialized items
    /// </summary>
    [MaxLength(1000)]
    public string? SerialNumbers { get; set; }

    /// <summary>
    /// Batch numbers for batch-tracked items
    /// </summary>
    [MaxLength(500)]
    public string? BatchNumbers { get; set; }

    /// <summary>
    /// Expiry dates for perishable items
    /// </summary>
    public DateTime? ExpiryDate { get; set; }

    /// <summary>
    /// Condition of delivered items
    /// </summary>
    [MaxLength(200)]
    public string? ItemCondition { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    public virtual DeliveryNote DeliveryNote { get; set; } = null!;
    public virtual Item Item { get; set; } = null!;
    public virtual SalesOrderLine? SalesOrderLine { get; set; }
}
