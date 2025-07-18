using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Company;

/// <summary>
/// Company data transfer object
/// </summary>
public class CompanyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string IsraelTaxId { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string Currency { get; set; } = "ILS";
    public int FiscalYearStartMonth { get; set; } = 1;
    public string TimeZone { get; set; } = "Israel Standard Time";
    public bool IsActive { get; set; }
    public string? SubscriptionPlan { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Update company request
/// </summary>
public class UpdateCompanyRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(15)]
    public string IsraelTaxId { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(10)]
    public string? PostalCode { get; set; }

    [MaxLength(50)]
    public string? Country { get; set; } = "Israel";

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(150)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    [Range(1, 12)]
    public int FiscalYearStartMonth { get; set; } = 1;

    [MaxLength(50)]
    public string TimeZone { get; set; } = "Israel Standard Time";
}

/// <summary>
/// Tax ID validation request
/// </summary>
public class ValidateTaxIdRequest
{
    [Required]
    public string TaxId { get; set; } = string.Empty;

    public int? ExcludeCompanyId { get; set; }
}

/// <summary>
/// Tax ID validation response
/// </summary>
public class TaxIdValidationResponse
{
    public bool IsValid { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
}

/// <summary>
/// Create company request
/// </summary>
public class CreateCompanyRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(15)]
    public string IsraelTaxId { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(10)]
    public string? PostalCode { get; set; }

    [MaxLength(50)]
    public string? Country { get; set; } = "Israel";

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(150)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "ILS";

    [Range(1, 12)]
    public int FiscalYearStartMonth { get; set; } = 1;

    [MaxLength(50)]
    public string TimeZone { get; set; } = "Israel Standard Time";

    [MaxLength(50)]
    public string? SubscriptionPlan { get; set; }
}

/// <summary>
/// Update company settings request
/// </summary>
public class UpdateCompanySettingsRequest
{
    [MaxLength(3)]
    public string? Currency { get; set; }

    [Range(1, 12)]
    public int? FiscalYearStartMonth { get; set; }

    [MaxLength(50)]
    public string? TimeZone { get; set; }

    [MaxLength(50)]
    public string? SubscriptionPlan { get; set; }

    public DateTime? SubscriptionExpiresAt { get; set; }
}

/// <summary>
/// Update company activation status request
/// </summary>
public class UpdateCompanyActivationRequest
{
    [Required]
    public bool IsActive { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }
}

/// <summary>
/// Company feature access request
/// </summary>
public class CheckFeatureAccessRequest
{
    [Required]
    public string Feature { get; set; } = string.Empty;
}

/// <summary>
/// Company feature access response
/// </summary>
public class FeatureAccessResponse
{
    public bool HasAccess { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Update subscription request
/// </summary>
public class UpdateSubscriptionRequest
{
    [Required]
    [MaxLength(50)]
    public string SubscriptionPlan { get; set; } = string.Empty;

    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Company search criteria for API requests
/// </summary>
public class CompanySearchCriteria
{
    public string? Name { get; set; }
    public string? TaxId { get; set; }
    public string? City { get; set; }
    public string? SubscriptionPlan { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedAfter { get; set; }
    public DateTime? CreatedBefore { get; set; }
    public string? OrderBy { get; set; } = "Id";
    public bool OrderDescending { get; set; } = false;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

/// <summary>
/// Company settings DTO for API
/// </summary>
public class CompanySettings
{
    public int CompanyId { get; set; }
    public string Currency { get; set; } = "ILS";
    public int FiscalYearStartMonth { get; set; } = 1;
    public string TimeZone { get; set; } = "Israel Standard Time";
    public string? SubscriptionPlan { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
