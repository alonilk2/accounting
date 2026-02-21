using backend.Data;
using backend.Models.Accounting;
using backend.Models.Core;
using backend.Models.Identity;
using backend.Models.Inventory;
using backend.Services.Accounting;
using backend.Services.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Backend.Tests.Accounting;

public class JournalEntryServiceEntitlementTests
{
    [Fact]
    public async Task CreateInventoryAdjustmentJournalEntries_NonEntitledCompany_SkipsEntriesAndWritesAudit()
    {
        await using var context = CreateContext();
        await SeedEntitlementScenarioAsync(context, subscriptionPlan: "Basic");

        var companyService = new CompanyService(context, NullLogger<CompanyService>.Instance);
        var service = new JournalEntryService(
            context,
            NullLogger<JournalEntryService>.Instance,
            companyService);

        await service.CreateInventoryAdjustmentJournalEntriesAsync(
            itemId: 1001,
            quantityChange: 1,
            valueChange: 10m,
            companyId: 42,
            userId: "77",
            reason: "Manual test adjustment");

        var journalEntries = await context.JournalEntries
            .Where(e => e.CompanyId == 42)
            .ToListAsync();
        Assert.Empty(journalEntries);

        var skipAudit = await context.AuditLogs
            .SingleOrDefaultAsync(a => a.CompanyId == 42 && a.Action == "ACCOUNTING_SKIPPED");

        Assert.NotNull(skipAudit);
        Assert.Equal("InventoryAdjustment", skipAudit!.EntityType);
        Assert.Equal(1001, skipAudit.EntityId);
    }

    [Fact]
    public async Task CreateInventoryAdjustmentJournalEntries_EntitledCompany_WritesBalancedEntries()
    {
        await using var context = CreateContext();
        await SeedEntitlementScenarioAsync(context, subscriptionPlan: "Pro");

        var companyService = new CompanyService(context, NullLogger<CompanyService>.Instance);
        var service = new JournalEntryService(
            context,
            NullLogger<JournalEntryService>.Instance,
            companyService);

        await service.CreateInventoryAdjustmentJournalEntriesAsync(
            itemId: 1001,
            quantityChange: 1,
            valueChange: 10m,
            companyId: 42,
            userId: "77",
            reason: "Manual test adjustment");

        var entries = await context.JournalEntries
            .Where(e => e.CompanyId == 42 && e.ReferenceType == "InventoryAdjustment" && e.ReferenceId == 1001)
            .ToListAsync();

        Assert.Equal(2, entries.Count);
        Assert.Equal(entries.Sum(e => e.DebitAmount), entries.Sum(e => e.CreditAmount));

        var skipAuditCount = await context.AuditLogs
            .CountAsync(a => a.CompanyId == 42 && a.Action == "ACCOUNTING_SKIPPED");
        Assert.Equal(0, skipAuditCount);
    }

    private static AccountingDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AccountingDbContext>()
            .UseInMemoryDatabase($"journal-entitlement-tests-{Guid.NewGuid()}")
            .Options;

        return new AccountingDbContext(options);
    }

    private static async Task SeedEntitlementScenarioAsync(AccountingDbContext context, string subscriptionPlan)
    {
        var company = new Company
        {
            Id = 42,
            Name = "Journal Entitlement Co",
            IsraelTaxId = "523456789",
            Currency = "ILS",
            SubscriptionPlan = subscriptionPlan,
            IsActive = true,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var role = new Role
        {
            Id = 10,
            Name = "Admin",
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var user = new User
        {
            Id = 77,
            Name = "System User",
            Email = "system@accounting.local",
            PasswordHash = "hash",
            RoleId = 10,
            IsActive = true,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var item = new Item
        {
            Id = 1001,
            CompanyId = 42,
            SKU = "SKU-INV-1",
            Name = "Inventory Item",
            Unit = "unit",
            ItemType = "Product",
            CostPrice = 10m,
            SellPrice = 20m,
            CurrentStockQty = 5m,
            IsInventoryTracked = true,
            IsActive = true,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var inventoryAccount = new ChartOfAccount
        {
            Id = 2001,
            CompanyId = 42,
            AccountNumber = "1300",
            Name = "Inventory",
            Type = AccountType.Asset,
            Level = 2,
            IsActive = true,
            IsDebitNormal = true,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var adjustmentAccount = new ChartOfAccount
        {
            Id = 2002,
            CompanyId = 42,
            AccountNumber = "5250",
            Name = "Inventory Adjustment",
            Type = AccountType.Expense,
            Level = 2,
            IsActive = true,
            IsDebitNormal = true,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        context.Companies.Add(company);
        context.Roles.Add(role);
        context.Users.Add(user);
        context.Items.Add(item);
        context.ChartOfAccounts.AddRange(inventoryAccount, adjustmentAccount);
        await context.SaveChangesAsync();
    }
}
