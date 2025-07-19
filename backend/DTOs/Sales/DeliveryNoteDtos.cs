using System.ComponentModel.DataAnnotations;
using backend.Models.Sales;

namespace backend.DTOs.Sales;

/// <summary>
/// DTO for delivery note responses
/// </summary>
public class DeliveryNoteDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int? SalesOrderId { get; set; }
    public string? SalesOrderNumber { get; set; }
    public string DeliveryNoteNumber { get; set; } = string.Empty;
    public DateTime DeliveryDate { get; set; }
    public DateTime? ExpectedDeliveryTime { get; set; }
    public DateTime? ActualDeliveryTime { get; set; }
    public DeliveryNoteStatus Status { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public string? DriverName { get; set; }
    public string? VehiclePlate { get; set; }
    public decimal TotalQuantity { get; set; }
    public decimal? TotalWeight { get; set; }
    public decimal? TotalVolume { get; set; }
    public string? DeliveryInstructions { get; set; }
    public string? Notes { get; set; }
    public string? CustomerSignature { get; set; }
    public string? ReceivedByName { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public string? TrackingNumber { get; set; }
    public string? CourierService { get; set; }
    public List<DeliveryNoteLineDto> Lines { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for delivery note line items
/// </summary>
public class DeliveryNoteLineDto
{
    public int Id { get; set; }
    public int DeliveryNoteId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public int? SalesOrderLineId { get; set; }
    public int LineNumber { get; set; }
    public string? Description { get; set; }
    public decimal QuantityOrdered { get; set; }
    public decimal QuantityDelivered { get; set; }
    public decimal QuantityReturned { get; set; }
    public string? Unit { get; set; }
    public decimal? UnitWeight { get; set; }
    public decimal? UnitVolume { get; set; }
    public string? SerialNumbers { get; set; }
    public string? BatchNumbers { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? ItemCondition { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Request for creating delivery notes
/// </summary>
public class CreateDeliveryNoteRequest
{
    [Required]
    public int CustomerId { get; set; }
    
    public int? SalesOrderId { get; set; }
    
    public DateTime? DeliveryDate { get; set; }
    
    public DateTime? ExpectedDeliveryTime { get; set; }
    
    public DeliveryNoteStatus? Status { get; set; }
    
    public string? DeliveryAddress { get; set; }
    
    public string? ContactPerson { get; set; }
    
    public string? ContactPhone { get; set; }
    
    public string? DriverName { get; set; }
    
    public string? VehiclePlate { get; set; }
    
    public string? DeliveryInstructions { get; set; }
    
    public string? Notes { get; set; }
    
    public string? TrackingNumber { get; set; }
    
    public string? CourierService { get; set; }
    
    [Required]
    public List<CreateDeliveryNoteLineRequest> Lines { get; set; } = new();
}

/// <summary>
/// Request for creating delivery note lines
/// </summary>
public class CreateDeliveryNoteLineRequest
{
    [Required]
    public int ItemId { get; set; }
    
    public int? SalesOrderLineId { get; set; }
    
    public string? Description { get; set; }
    
    [Required]
    [Range(0.0001, double.MaxValue, ErrorMessage = "Quantity ordered must be greater than 0")]
    public decimal QuantityOrdered { get; set; }
    
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Quantity delivered cannot be negative")]
    public decimal QuantityDelivered { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Quantity returned cannot be negative")]
    public decimal QuantityReturned { get; set; } = 0;
    
    public string? Unit { get; set; }
    
    public decimal? UnitWeight { get; set; }
    
    public decimal? UnitVolume { get; set; }
    
    public string? SerialNumbers { get; set; }
    
    public string? BatchNumbers { get; set; }
    
    public DateTime? ExpiryDate { get; set; }
    
    public string? ItemCondition { get; set; }
    
    public string? Notes { get; set; }
}

/// <summary>
/// Request for updating delivery note status
/// </summary>
public class UpdateDeliveryNoteStatusRequest
{
    [Required]
    public DeliveryNoteStatus Status { get; set; }
    
    public DateTime? ActualDeliveryTime { get; set; }
    
    public string? ReceivedByName { get; set; }
    
    public DateTime? ReceivedAt { get; set; }
    
    public string? CustomerSignature { get; set; }
    
    public string? Notes { get; set; }
}

/// <summary>
/// Request for generating delivery note from sales order
/// </summary>
public class GenerateDeliveryNoteFromOrderRequest
{
    public DateTime? DeliveryDate { get; set; }
    
    public string? DeliveryAddress { get; set; }
    
    public string? ContactPerson { get; set; }
    
    public string? ContactPhone { get; set; }
    
    public string? DriverName { get; set; }
    
    public string? VehiclePlate { get; set; }
    
    public string? DeliveryInstructions { get; set; }
    
    public string? Notes { get; set; }
    
    public List<OrderLineDeliveryRequest>? Lines { get; set; } // If null, deliver all lines
}

/// <summary>
/// Request for specifying quantities to deliver from order lines
/// </summary>
public class OrderLineDeliveryRequest
{
    [Required]
    public int SalesOrderLineId { get; set; }
    
    [Required]
    [Range(0.0001, double.MaxValue, ErrorMessage = "Quantity to deliver must be greater than 0")]
    public decimal QuantityToDeliver { get; set; }
    
    public string? SerialNumbers { get; set; }
    
    public string? BatchNumbers { get; set; }
    
    public DateTime? ExpiryDate { get; set; }
    
    public string? ItemCondition { get; set; }
    
    public string? Notes { get; set; }
}
