using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models.Core;

namespace backend.Models.Accounting;

/// <summary>
/// Account types for the Israeli accounting system
/// </summary>
public enum AccountType
{
    Asset = 1,
    Liability = 2,
    Equity = 3,
    Revenue = 4,
    Expense = 5
}

/// <summary>
/// Chart of Accounts - General Ledger account master data
/// Hierarchical structure supporting parent-child relationships
/// </summary>
public class ChartOfAccount : TenantEntity
{
    /// <summary>
    /// Account number following Israeli accounting standards
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string AccountNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? NameHebrew { get; set; }

    [Required]
    public AccountType Type { get; set; }

    /// <summary>
    /// Parent account for hierarchical structure (optional)
    /// </summary>
    public int? ParentAccountId { get; set; }

    /// <summary>
    /// Account level in hierarchy (1 = top level)
    /// </summary>
    public int Level { get; set; } = 1;

    /// <summary>
    /// Whether this account can have transactions posted directly
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether this is a control account (summary only)
    /// </summary>
    public bool IsControlAccount { get; set; } = false;

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Current balance cache for performance
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal CurrentBalance { get; set; } = 0;

    /// <summary>
    /// Normal balance type (Debit/Credit)
    /// </summary>
    public bool IsDebitNormal { get; set; } = true;

    /// <summary>
    /// Alias for CurrentBalance property (backward compatibility)
    /// </summary>
    [NotMapped]
    public decimal Balance 
    { 
        get => CurrentBalance; 
        set => CurrentBalance = value; 
    }

    // Navigation properties
    public virtual ChartOfAccount? ParentAccount { get; set; }
    public virtual ICollection<ChartOfAccount> ChildAccounts { get; set; } = new List<ChartOfAccount>();
    public virtual ICollection<JournalEntry> JournalEntries { get; set; } = new List<JournalEntry>();
}

/// <summary>
/// Journal entries for double-entry bookkeeping
/// Each transaction creates balanced debit and credit entries
/// </summary>
public class JournalEntry : TenantEntity
{
    [Required]
    public int AccountId { get; set; }

    [Required]
    public DateTime TransactionDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string TransactionNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Debit amount (positive values)
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal DebitAmount { get; set; } = 0;

    /// <summary>
    /// Credit amount (positive values)
    /// </summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal CreditAmount { get; set; } = 0;

    /// <summary>
    /// Reference to source document (invoice, receipt, etc.)
    /// </summary>
    [MaxLength(50)]
    public string? ReferenceType { get; set; }

    public int? ReferenceId { get; set; }

    /// <summary>
    /// Journal entry sequence for audit trail
    /// </summary>
    public int SequenceNumber { get; set; }

    /// <summary>
    /// Entry status for approval workflows
    /// </summary>
    public bool IsPosted { get; set; } = true;

    /// <summary>
    /// User who created this journal entry
    /// </summary>
    public int? CreatedByUserId { get; set; }

    // Navigation properties
    public virtual ChartOfAccount Account { get; set; } = null!;
}
