using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models.Core;

/// <summary>
/// Base entity class providing common audit fields for all entities
/// </summary>
public abstract class BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    [MaxLength(100)]
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Soft delete flag - records are marked as deleted rather than physically removed
    /// </summary>
    public bool IsDeleted { get; set; } = false;

    /// <summary>
    /// Optimistic concurrency control
    /// </summary>
    [Timestamp]
    public byte[]? RowVersion { get; set; }
}

/// <summary>
/// Base entity for multi-tenant entities that belong to a specific company
/// </summary>
public abstract class TenantEntity : BaseEntity
{
    [Required]
    public int CompanyId { get; set; }

    [ForeignKey(nameof(CompanyId))]
    public virtual Company Company { get; set; } = null!;
}
