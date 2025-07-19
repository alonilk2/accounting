using System.ComponentModel.DataAnnotations;
using backend.Models.Sales;

namespace backend.DTOs.Sales;

/// <summary>
/// DTO for quote responses
/// </summary>
public class QuoteDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int? AgentId { get; set; }
    public string? AgentName { get; set; }
    public string QuoteNumber { get; set; } = string.Empty;
    public DateTime QuoteDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public QuoteStatus Status { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "ILS";
    public decimal ExchangeRate { get; set; }
    public string? Notes { get; set; }
    public string? Terms { get; set; }
    public string? DeliveryTerms { get; set; }
    public string? PaymentTerms { get; set; }
    public int? ConvertedToSalesOrderId { get; set; }
    public DateTime? ConvertedAt { get; set; }
    public List<QuoteLineDto> Lines { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for quote line items
/// </summary>
public class QuoteLineDto
{
    public int Id { get; set; }
    public int QuoteId { get; set; }
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSku { get; set; } = string.Empty;
    public int LineNumber { get; set; }
    public string? Description { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal TaxRate { get; set; }
    public decimal LineTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotalWithTax { get; set; }
}

/// <summary>
/// Request for creating quotes
/// </summary>
public class CreateQuoteRequest
{
    [Required]
    public int CustomerId { get; set; }
    
    public int? AgentId { get; set; }
    
    public DateTime? QuoteDate { get; set; }
    
    public DateTime? ValidUntil { get; set; }
    
    public QuoteStatus? Status { get; set; }
    
    public string? Currency { get; set; }
    
    public string? Notes { get; set; }
    
    public string? Terms { get; set; }
    
    public string? DeliveryTerms { get; set; }
    
    public string? PaymentTerms { get; set; }
    
    [Required]
    public List<CreateQuoteLineRequest> Lines { get; set; } = new();
}

/// <summary>
/// Request for creating quote lines
/// </summary>
public class CreateQuoteLineRequest
{
    [Required]
    public int ItemId { get; set; }
    
    public string? Description { get; set; }
    
    [Required]
    [Range(0.0001, double.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
    public decimal Quantity { get; set; }
    
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Unit price cannot be negative")]
    public decimal UnitPrice { get; set; }
    
    [Range(0, 100, ErrorMessage = "Discount percent must be between 0 and 100")]
    public decimal DiscountPercent { get; set; } = 0;
    
    [Range(0, 100, ErrorMessage = "Tax rate must be between 0 and 100")]
    public decimal TaxRate { get; set; } = 17; // Default Israeli VAT
}

/// <summary>
/// Request for updating quote status
/// </summary>
public class UpdateQuoteStatusRequest
{
    [Required]
    public QuoteStatus Status { get; set; }
}

/// <summary>
/// Request for converting quote to sales order
/// </summary>
public class ConvertQuoteToOrderRequest
{
    public DateTime? OrderDate { get; set; }
    public DateTime? RequiredDate { get; set; }
    public DateTime? PromisedDate { get; set; }
    public string? Notes { get; set; }
    public List<int>? SelectedLineIds { get; set; } // If null, convert all lines
}
