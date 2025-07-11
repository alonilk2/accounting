using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using backend.Models.Core;
using backend.Models.Identity;

namespace backend.Models.Audit;

/// <summary>
/// Audit log for tracking all critical user actions
/// Required for compliance and security monitoring
/// </summary>
public class AuditLog : TenantEntity
{
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Action performed (Create, Update, Delete, Login, Export, etc.)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Entity type that was affected (Customer, Invoice, etc.)
    /// </summary>
    [MaxLength(100)]
    public string? EntityType { get; set; }

    /// <summary>
    /// ID of the affected entity
    /// </summary>
    public int? EntityId { get; set; }

    /// <summary>
    /// Detailed description of the action
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public string Details { get; set; } = string.Empty;

    /// <summary>
    /// User's IP address
    /// </summary>
    [MaxLength(45)]
    public string? IPAddress { get; set; }

    /// <summary>
    /// User agent string
    /// </summary>
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Session ID for tracking user sessions
    /// </summary>
    [MaxLength(100)]
    public string? SessionId { get; set; }

    /// <summary>
    /// Severity level (Info, Warning, Error, Critical)
    /// </summary>
    [MaxLength(20)]
    public string Severity { get; set; } = "Info";

    /// <summary>
    /// Additional data as JSON (before/after values, etc.)
    /// </summary>
    public string? AdditionalData { get; set; }

    /// <summary>
    /// Timestamp of the action (for compatibility)
    /// </summary>
    [NotMapped]
    public DateTime Timestamp => CreatedAt;

    // Navigation properties
    public virtual User User { get; set; } = null!;
}
