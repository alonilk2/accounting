using Microsoft.EntityFrameworkCore;
using backend.Models.Core;
using backend.Models.Identity;
using backend.Models.Accounting;
using backend.Models.Sales;
using backend.Models.Suppliers;
using backend.Models.Purchasing;
using backend.Models.Inventory;
using backend.Models.POS;
using backend.Models.Audit;

namespace backend.Data;

/// <summary>
/// Main database context for the AI-First SaaS Accounting Platform
/// Implements multi-tenant architecture with row-level security
/// </summary>
public class AccountingDbContext : DbContext
{
    public AccountingDbContext(DbContextOptions<AccountingDbContext> options) : base(options)
    {
    }

    // Core entities
    public DbSet<Company> Companies { get; set; } = null!;

    // Identity and access
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<UserCompany> UserCompanies { get; set; } = null!;

    // Accounting
    public DbSet<ChartOfAccount> ChartOfAccounts { get; set; } = null!;
    public DbSet<JournalEntry> JournalEntries { get; set; } = null!;

    // Sales
    public DbSet<Customer> Customers { get; set; } = null!;
    public DbSet<Agent> Agents { get; set; } = null!;
    public DbSet<SalesOrder> SalesOrders { get; set; } = null!;
    public DbSet<SalesOrderLine> SalesOrderLines { get; set; } = null!;
    public DbSet<Invoice> Invoices { get; set; } = null!;
    public DbSet<InvoiceLine> InvoiceLines { get; set; } = null!;
    public DbSet<Receipt> Receipts { get; set; } = null!;
    public DbSet<StandingOrder> StandingOrders { get; set; } = null!;

    // Purchasing
    public DbSet<Supplier> Suppliers { get; set; } = null!;
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; } = null!;
    public DbSet<PurchaseOrderLine> PurchaseOrderLines { get; set; } = null!;
    public DbSet<Payment> Payments { get; set; } = null!;

    // Inventory
    public DbSet<Item> Items { get; set; } = null!;
    public DbSet<InventoryBOM> InventoryBOMs { get; set; } = null!;
    public DbSet<InventoryTransaction> InventoryTransactions { get; set; } = null!;

    // Point of Sale
    public DbSet<POSSale> POSSales { get; set; } = null!;
    public DbSet<POSSaleLine> POSSaleLines { get; set; } = null!;

    // Audit
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Table Per Type (TPT) inheritance strategy
        ConfigureInheritance(modelBuilder);

        // Configure tenant entity relationships to prevent cascade conflicts
        ConfigureTenantEntities(modelBuilder);

        // Configure entity relationships and constraints
        ConfigureIdentity(modelBuilder);
        ConfigureAccounting(modelBuilder);
        ConfigureSales(modelBuilder);
        ConfigurePurchasing(modelBuilder);
        ConfigureInventory(modelBuilder);
        ConfigurePOS(modelBuilder);
        ConfigureAudit(modelBuilder);
        ConfigureIndexes(modelBuilder);
        ConfigureSoftDelete(modelBuilder);
        ConfigureTenantEntities(modelBuilder);
    }

    private static void ConfigureInheritance(ModelBuilder modelBuilder)
    {
        // Configure Table Per Type (TPT) inheritance to create separate tables for each entity
        // This prevents the massive single-table TPH inheritance that was causing foreign key conflicts

        // Base entities - these will have their own tables
        modelBuilder.Entity<Company>().ToTable("Companies");
        modelBuilder.Entity<User>().ToTable("Users");
        modelBuilder.Entity<Role>().ToTable("Roles");
        modelBuilder.Entity<UserCompany>().ToTable("UserCompanies");

        // Accounting entities
        modelBuilder.Entity<ChartOfAccount>().ToTable("ChartOfAccounts");
        modelBuilder.Entity<JournalEntry>().ToTable("JournalEntries");

        // Sales entities
        modelBuilder.Entity<Customer>().ToTable("Customers");
        modelBuilder.Entity<Agent>().ToTable("Agents");
        modelBuilder.Entity<SalesOrder>().ToTable("SalesOrders");
        modelBuilder.Entity<SalesOrderLine>().ToTable("SalesOrderLines");
        modelBuilder.Entity<Invoice>().ToTable("Invoices");
        modelBuilder.Entity<InvoiceLine>().ToTable("InvoiceLines");
        modelBuilder.Entity<Receipt>().ToTable("Receipts");
        modelBuilder.Entity<StandingOrder>().ToTable("StandingOrders");

        // Purchasing entities
        modelBuilder.Entity<Supplier>().ToTable("Suppliers");
        modelBuilder.Entity<PurchaseOrder>().ToTable("PurchaseOrders");
        modelBuilder.Entity<PurchaseOrderLine>().ToTable("PurchaseOrderLines");
        modelBuilder.Entity<Payment>().ToTable("Payments");

        // Inventory entities
        modelBuilder.Entity<Item>().ToTable("Items");
        modelBuilder.Entity<InventoryBOM>().ToTable("InventoryBOMs");
        modelBuilder.Entity<InventoryTransaction>().ToTable("InventoryTransactions");

        // POS entities
        modelBuilder.Entity<POSSale>().ToTable("POSSales");
        modelBuilder.Entity<POSSaleLine>().ToTable("POSSaleLines");

        // Audit entities
        modelBuilder.Entity<AuditLog>().ToTable("AuditLogs");
    }

    private static void ConfigureIdentity(ModelBuilder modelBuilder)
    {
        // User-Role relationship
        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        // UserCompany many-to-many
        modelBuilder.Entity<UserCompany>()
            .HasOne(uc => uc.User)
            .WithMany(u => u.UserCompanies)
            .HasForeignKey(uc => uc.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserCompany>()
            .HasOne(uc => uc.Company)
            .WithMany(c => c.UserCompanies)
            .HasForeignKey(uc => uc.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserCompany>()
            .HasOne(uc => uc.Role)
            .WithMany()
            .HasForeignKey(uc => uc.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Role>()
            .HasIndex(r => r.Name)
            .IsUnique();

        modelBuilder.Entity<Company>()
            .HasIndex(c => c.IsraelTaxId)
            .IsUnique();
    }

    private static void ConfigureAccounting(ModelBuilder modelBuilder)
    {
        // Chart of Accounts hierarchy
        modelBuilder.Entity<ChartOfAccount>()
            .HasOne(a => a.ParentAccount)
            .WithMany(a => a.ChildAccounts)
            .HasForeignKey(a => a.ParentAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        // Journal entries
        modelBuilder.Entity<JournalEntry>()
            .HasOne(je => je.Account)
            .WithMany(a => a.JournalEntries)
            .HasForeignKey(je => je.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique constraints
        modelBuilder.Entity<ChartOfAccount>()
            .HasIndex(a => new { a.CompanyId, a.AccountNumber })
            .IsUnique();
    }

    private static void ConfigureSales(ModelBuilder modelBuilder)
    {
        // Sales Order relationships
        modelBuilder.Entity<SalesOrder>()
            .HasOne(so => so.Customer)
            .WithMany(c => c.SalesOrders)
            .HasForeignKey(so => so.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SalesOrder>()
            .HasOne(so => so.Agent)
            .WithMany(a => a.SalesOrders)
            .HasForeignKey(so => so.AgentId)
            .OnDelete(DeleteBehavior.SetNull);

        // Sales Order Lines
        modelBuilder.Entity<SalesOrderLine>()
            .HasOne(sol => sol.SalesOrder)
            .WithMany(so => so.Lines)
            .HasForeignKey(sol => sol.SalesOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SalesOrderLine>()
            .HasOne(sol => sol.Item)
            .WithMany(i => i.SalesOrderLines)
            .HasForeignKey(sol => sol.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Invoices
        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Customer)
            .WithMany(c => c.Invoices)
            .HasForeignKey(i => i.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.SalesOrder)
            .WithMany(so => so.Invoices)
            .HasForeignKey(i => i.SalesOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Invoice Lines
        modelBuilder.Entity<InvoiceLine>()
            .HasOne(il => il.Invoice)
            .WithMany(i => i.Lines)
            .HasForeignKey(il => il.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InvoiceLine>()
            .HasOne(il => il.Item)
            .WithMany(i => i.InvoiceLines)
            .HasForeignKey(il => il.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Receipts
        modelBuilder.Entity<Receipt>()
            .HasOne(r => r.Invoice)
            .WithMany(i => i.Receipts)
            .HasForeignKey(r => r.InvoiceId)
            .OnDelete(DeleteBehavior.Restrict);

        // Standing Orders
        modelBuilder.Entity<StandingOrder>()
            .HasOne(so => so.Customer)
            .WithMany(c => c.StandingOrders)
            .HasForeignKey(so => so.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique constraints
        modelBuilder.Entity<SalesOrder>()
            .HasIndex(so => new { so.CompanyId, so.OrderNumber })
            .IsUnique();

        modelBuilder.Entity<Invoice>()
            .HasIndex(i => new { i.CompanyId, i.InvoiceNumber })
            .IsUnique();
    }

    private static void ConfigurePurchasing(ModelBuilder modelBuilder)
    {
        // Purchase Order relationships
        modelBuilder.Entity<PurchaseOrder>()
            .HasOne(po => po.Supplier)
            .WithMany(s => s.PurchaseOrders)
            .HasForeignKey(po => po.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        // Purchase Order Lines
        modelBuilder.Entity<PurchaseOrderLine>()
            .HasOne(pol => pol.PurchaseOrder)
            .WithMany(po => po.Lines)
            .HasForeignKey(pol => pol.PurchaseOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PurchaseOrderLine>()
            .HasOne(pol => pol.Item)
            .WithMany(i => i.PurchaseOrderLines)
            .HasForeignKey(pol => pol.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Payments
        modelBuilder.Entity<Payment>()
            .HasOne(p => p.PurchaseOrder)
            .WithMany(po => po.Payments)
            .HasForeignKey(p => p.PurchaseOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique constraints
        modelBuilder.Entity<PurchaseOrder>()
            .HasIndex(po => new { po.CompanyId, po.OrderNumber })
            .IsUnique();
    }

    private static void ConfigureInventory(ModelBuilder modelBuilder)
    {
        // Inventory BOM relationships
        modelBuilder.Entity<InventoryBOM>()
            .HasOne(bom => bom.ParentItem)
            .WithMany(i => i.ParentBOMs)
            .HasForeignKey(bom => bom.ParentItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InventoryBOM>()
            .HasOne(bom => bom.ComponentItem)
            .WithMany(i => i.ComponentBOMs)
            .HasForeignKey(bom => bom.ComponentItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Inventory Transactions
        modelBuilder.Entity<InventoryTransaction>()
            .HasOne(it => it.Item)
            .WithMany(i => i.InventoryTransactions)
            .HasForeignKey(it => it.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique constraints
        modelBuilder.Entity<Item>()
            .HasIndex(i => new { i.CompanyId, i.SKU })
            .IsUnique();

        modelBuilder.Entity<InventoryBOM>()
            .HasIndex(bom => new { bom.ParentItemId, bom.ComponentItemId })
            .IsUnique();
    }

    private static void ConfigurePOS(ModelBuilder modelBuilder)
    {
        // POS Sale relationships
        modelBuilder.Entity<POSSale>()
            .HasOne(ps => ps.CashierUser)
            .WithMany()
            .HasForeignKey(ps => ps.CashierUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // POS Sale Lines
        modelBuilder.Entity<POSSaleLine>()
            .HasOne(psl => psl.POSSale)
            .WithMany(ps => ps.Lines)
            .HasForeignKey(psl => psl.POSSaleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<POSSaleLine>()
            .HasOne(psl => psl.Item)
            .WithMany(i => i.POSSaleLines)
            .HasForeignKey(psl => psl.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique constraints
        modelBuilder.Entity<POSSale>()
            .HasIndex(ps => new { ps.CompanyId, ps.TransactionNumber })
            .IsUnique();
    }

    private static void ConfigureAudit(ModelBuilder modelBuilder)
    {
        // Audit log relationships
        modelBuilder.Entity<AuditLog>()
            .HasOne(al => al.User)
            .WithMany(u => u.AuditLogs)
            .HasForeignKey(al => al.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    private static void ConfigureIndexes(ModelBuilder modelBuilder)
    {
        // Performance indexes for common queries
        modelBuilder.Entity<SalesOrder>()
            .HasIndex(so => so.CustomerId);

        modelBuilder.Entity<SalesOrder>()
            .HasIndex(so => so.OrderDate);

        modelBuilder.Entity<PurchaseOrder>()
            .HasIndex(po => po.SupplierId);

        modelBuilder.Entity<PurchaseOrder>()
            .HasIndex(po => po.OrderDate);

        modelBuilder.Entity<InventoryTransaction>()
            .HasIndex(it => it.TransactionDate);

        modelBuilder.Entity<JournalEntry>()
            .HasIndex(je => je.TransactionDate);

        modelBuilder.Entity<AuditLog>()
            .HasIndex(al => al.CreatedAt);

        // Multi-column indexes for common filter combinations
        modelBuilder.Entity<JournalEntry>()
            .HasIndex(je => new { je.CompanyId, je.TransactionDate, je.AccountId });

        modelBuilder.Entity<InventoryTransaction>()
            .HasIndex(it => new { it.CompanyId, it.ItemId, it.TransactionDate });
    }

    private static void ConfigureSoftDelete(ModelBuilder modelBuilder)
    {
        // Configure global query filters for soft delete on specific entities
        // Note: We configure this on concrete entities rather than BaseEntity due to TPT inheritance

        // Core entities
        modelBuilder.Entity<Company>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Role>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<UserCompany>().HasQueryFilter(e => !e.IsDeleted);

        // Accounting entities
        modelBuilder.Entity<ChartOfAccount>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<JournalEntry>().HasQueryFilter(e => !e.IsDeleted);

        // Sales entities
        modelBuilder.Entity<Customer>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Agent>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<SalesOrder>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<SalesOrderLine>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Invoice>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<InvoiceLine>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Receipt>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<StandingOrder>().HasQueryFilter(e => !e.IsDeleted);

        // Purchasing entities
        modelBuilder.Entity<Supplier>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<PurchaseOrder>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<PurchaseOrderLine>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Payment>().HasQueryFilter(e => !e.IsDeleted);

        // Inventory entities
        modelBuilder.Entity<Item>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<InventoryBOM>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<InventoryTransaction>().HasQueryFilter(e => !e.IsDeleted);

        // POS entities
        modelBuilder.Entity<POSSale>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<POSSaleLine>().HasQueryFilter(e => !e.IsDeleted);

        // Audit entities (typically we don't soft delete audit logs)
        // modelBuilder.Entity<AuditLog>().HasQueryFilter(e => !e.IsDeleted);
    }

    private static void ConfigureTenantEntities(ModelBuilder modelBuilder)
    {
        // Configure Company relationships to use Restrict instead of Cascade 
        // to prevent multiple cascade paths conflicts
        // Only configure entities that inherit from TenantEntity

        // Accounting entities
        modelBuilder.Entity<ChartOfAccount>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<JournalEntry>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        // Sales entities
        modelBuilder.Entity<Customer>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Agent>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SalesOrder>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SalesOrderLine>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Invoice>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Receipt>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StandingOrder>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        // Purchasing entities
        modelBuilder.Entity<Supplier>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PurchaseOrder>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PurchaseOrderLine>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        // Inventory entities (only those that inherit from TenantEntity)
        modelBuilder.Entity<Item>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        // InventoryBOM inherits from BaseEntity, not TenantEntity - skip

        modelBuilder.Entity<InventoryTransaction>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        // POS entities (only those that inherit from TenantEntity)
        modelBuilder.Entity<POSSale>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        // POSSaleLine inherits from BaseEntity, not TenantEntity - skip

        // Audit entities
        modelBuilder.Entity<AuditLog>()
            .HasOne(e => e.Company)
            .WithMany()
            .HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    /// <summary>
    /// Override SaveChanges to implement audit trail and automatic timestamps
    /// </summary>
    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    /// <summary>
    /// Override SaveChangesAsync to implement audit trail and automatic timestamps
    /// </summary>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }
    }
}
