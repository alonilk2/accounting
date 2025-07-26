using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Sales;

/// <summary>
/// DTO for creating a new receipt (invoice-based or standalone)
/// </summary>
public class CreateReceiptDto
{
    /// <summary>
    /// Invoice ID - null for standalone receipts
    /// </summary>
    public int? InvoiceId { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ReferenceNumber { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    // Fields for standalone receipts (when InvoiceId is null)
    [MaxLength(200)]
    public string? CustomerName { get; set; }

    [MaxLength(20)]
    public string? CustomerTaxId { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }
}

/// <summary>
/// DTO for receipt details
/// </summary>
public class ReceiptDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public int? InvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public string Currency { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    // Fields for standalone receipts
    public string? CustomerTaxId { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// DTO for receipt list items
/// </summary>
public class ReceiptListDto
{
    public int Id { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public int? InvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    // Fields for standalone receipts
    public string? CustomerTaxId { get; set; }
    public string? Description { get; set; }
    public bool IsStandalone { get; set; } // Helper property to indicate if it's a standalone receipt
}
