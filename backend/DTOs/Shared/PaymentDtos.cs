using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Shared;

/// <summary>
/// Request model for processing payments
/// </summary>
public class ProcessPaymentRequest
{
    public int? CompanyId { get; set; } // Optional, will be set from auth context

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Payment amount must be greater than 0")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Notes { get; set; }
}
