using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Core;

/// <summary>
/// Request model for creating a new supplier
/// </summary>
public class CreateSupplierRequest
{
    public int? CompanyId { get; set; } // Optional, will be set from auth context

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? Contact { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }

    [MaxLength(15)]
    public string? TaxId { get; set; }

    [MaxLength(15)]
    public string? VatNumber { get; set; }

    [Range(0, 365)]
    public int PaymentTermsDays { get; set; } = 30;

    public bool IsActive { get; set; } = true;

    [MaxLength(50)]
    public string? BankName { get; set; }

    [MaxLength(20)]
    public string? BankAccount { get; set; }

    [MaxLength(10)]
    public string? BankBranch { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

/// <summary>
/// Request model for updating an existing supplier
/// </summary>
public class UpdateSupplierRequest
{
    public int? CompanyId { get; set; } // Optional, will be set from auth context

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? Contact { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }

    [MaxLength(15)]
    public string? TaxId { get; set; }

    [MaxLength(15)]
    public string? VatNumber { get; set; }

    [Range(0, 365)]
    public int PaymentTermsDays { get; set; } = 30;

    public bool IsActive { get; set; } = true;

    [MaxLength(50)]
    public string? BankName { get; set; }

    [MaxLength(20)]
    public string? BankAccount { get; set; }

    [MaxLength(10)]
    public string? BankBranch { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}