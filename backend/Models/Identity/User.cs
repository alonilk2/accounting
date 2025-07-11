using System.ComponentModel.DataAnnotations;
using backend.Models.Core;
using backend.Models.Audit;

namespace backend.Models.Identity;

/// <summary>
/// User roles for role-based access control (RBAC)
/// Defines different user types and their permissions
/// </summary>
public class Role : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    /// <summary>
    /// JSON string containing permissions for this role
    /// </summary>
    [MaxLength(2000)]
    public string? Permissions { get; set; }

    // Navigation properties
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}

/// <summary>
/// System users with authentication and authorization
/// Supports multi-tenant access
/// </summary>
public class User : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Hashed password - never store plaintext passwords
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public int RoleId { get; set; }

    /// <summary>
    /// Phone number for MFA and contact
    /// </summary>
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Preferred language (Hebrew/English)
    /// </summary>
    [MaxLength(10)]
    public string Language { get; set; } = "en";

    /// <summary>
    /// Account status
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Last login timestamp for security monitoring
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// Failed login attempts counter for security
    /// </summary>
    public int FailedLoginAttempts { get; set; } = 0;

    /// <summary>
    /// Account lockout timestamp
    /// </summary>
    public DateTime? LockedOutUntil { get; set; }

    // Navigation properties
    public virtual Role Role { get; set; } = null!;
    public virtual ICollection<UserCompany> UserCompanies { get; set; } = new List<UserCompany>();
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}

/// <summary>
/// Many-to-many relationship between Users and Companies
/// Allows users to access multiple companies with different roles
/// </summary>
public class UserCompany : BaseEntity
{
    [Required]
    public int UserId { get; set; }

    [Required]
    public int CompanyId { get; set; }

    [Required]
    public int RoleId { get; set; }

    /// <summary>
    /// User access status for this specific company
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Company Company { get; set; } = null!;
    public virtual Role Role { get; set; } = null!;
}
