using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Core;

/// <summary>
/// DTO for stock adjustment operations
/// </summary>
public class StockAdjustmentDto
{
    [Required]
    public decimal QuantityChange { get; set; }

    [Required]
    [StringLength(500)]
    public string Reason { get; set; } = string.Empty;
}
