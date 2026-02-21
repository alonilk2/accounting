using backend.Data;
using backend.Models.Core;
using backend.Services.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Backend.Tests.Core;

public class CompanyFeatureAccessTests
{
    [Fact]
    public async Task EvaluateFeatureAccess_BasicPlan_IsDenied()
    {
        await using var context = CreateContext();
        await SeedCompanyAsync(context, subscriptionPlan: "Basic");

        var service = CreateService(context);
        var result = await service.EvaluateFeatureAccessAsync(1, FeatureEntitlements.DoubleEntryAccountingFeature);

        Assert.False(result.HasAccess);
        Assert.Equal("plan_not_eligible", result.ReasonCode);
        Assert.Equal("Basic", result.CurrentPlan);
    }

    [Fact]
    public async Task EvaluateFeatureAccess_ProPlan_IsAllowed()
    {
        await using var context = CreateContext();
        await SeedCompanyAsync(context, subscriptionPlan: "Pro");

        var service = CreateService(context);
        var result = await service.EvaluateFeatureAccessAsync(1, FeatureEntitlements.DoubleEntryAccountingFeature);

        Assert.True(result.HasAccess);
        Assert.Null(result.ReasonCode);
        Assert.Equal("Pro", result.CurrentPlan);
    }

    [Fact]
    public async Task EvaluateFeatureAccess_EnterprisePlan_IsAllowed()
    {
        await using var context = CreateContext();
        await SeedCompanyAsync(context, subscriptionPlan: "Enterprise");

        var service = CreateService(context);
        var result = await service.EvaluateFeatureAccessAsync(1, FeatureEntitlements.DoubleEntryAccountingFeature);

        Assert.True(result.HasAccess);
        Assert.Null(result.ReasonCode);
        Assert.Equal("Enterprise", result.CurrentPlan);
    }

    [Fact]
    public async Task EvaluateFeatureAccess_NullPlan_IsDenied()
    {
        await using var context = CreateContext();
        await SeedCompanyAsync(context, subscriptionPlan: null);

        var service = CreateService(context);
        var result = await service.EvaluateFeatureAccessAsync(1, FeatureEntitlements.DoubleEntryAccountingFeature);

        Assert.False(result.HasAccess);
        Assert.Equal("subscription_plan_missing", result.ReasonCode);
        Assert.Null(result.CurrentPlan);
    }

    [Fact]
    public async Task EvaluateFeatureAccess_UnknownPlan_IsDenied()
    {
        await using var context = CreateContext();
        await SeedCompanyAsync(context, subscriptionPlan: "StarterPlus");

        var service = CreateService(context);
        var result = await service.EvaluateFeatureAccessAsync(1, FeatureEntitlements.DoubleEntryAccountingFeature);

        Assert.False(result.HasAccess);
        Assert.Equal("subscription_plan_unknown", result.ReasonCode);
        Assert.Equal("StarterPlus", result.CurrentPlan);
    }

    [Fact]
    public async Task EvaluateFeatureAccess_ExpiredSubscription_IsDenied()
    {
        await using var context = CreateContext();
        await SeedCompanyAsync(
            context,
            subscriptionPlan: "Pro",
            expiresAt: DateTime.UtcNow.AddDays(-1));

        var service = CreateService(context);
        var result = await service.EvaluateFeatureAccessAsync(1, FeatureEntitlements.DoubleEntryAccountingFeature);

        Assert.False(result.HasAccess);
        Assert.Equal("subscription_expired", result.ReasonCode);
    }

    private static CompanyService CreateService(AccountingDbContext context)
    {
        return new CompanyService(context, NullLogger<CompanyService>.Instance);
    }

    private static AccountingDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AccountingDbContext>()
            .UseInMemoryDatabase($"company-feature-access-tests-{Guid.NewGuid()}")
            .Options;

        return new AccountingDbContext(options);
    }

    private static async Task SeedCompanyAsync(
        AccountingDbContext context,
        string? subscriptionPlan,
        DateTime? expiresAt = null)
    {
        var company = new Company
        {
            Id = 1,
            Name = "Feature Access Test Ltd",
            IsraelTaxId = "512345678",
            Currency = "ILS",
            SubscriptionPlan = subscriptionPlan,
            SubscriptionExpiresAt = expiresAt,
            IsActive = true,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        context.Companies.Add(company);
        await context.SaveChangesAsync();
    }
}
