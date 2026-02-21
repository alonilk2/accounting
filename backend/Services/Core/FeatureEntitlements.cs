namespace backend.Services.Core;

/// <summary>
/// Central feature entitlement definitions and plan evaluation rules.
/// </summary>
public static class FeatureEntitlements
{
    public const string DoubleEntryAccountingFeature = "double-entry-accounting";
    public const string UpgradePath = "/company-management";

    public static readonly IReadOnlyCollection<string> KnownPlans = new[]
    {
        "Basic",
        "Pro",
        "Enterprise"
    };

    public static readonly IReadOnlyCollection<string> DoubleEntryEligiblePlans = new[]
    {
        "Pro",
        "Enterprise"
    };

    private static readonly StringComparer Comparer = StringComparer.OrdinalIgnoreCase;

    public static string NormalizeFeature(string? feature)
    {
        if (string.IsNullOrWhiteSpace(feature))
        {
            return string.Empty;
        }

        var trimmed = feature.Trim();
        return Comparer.Equals(trimmed, DoubleEntryAccountingFeature)
            ? DoubleEntryAccountingFeature
            : trimmed.ToLowerInvariant();
    }

    public static bool IsSupportedFeature(string feature)
    {
        return Comparer.Equals(feature, DoubleEntryAccountingFeature);
    }

    public static string? NormalizePlan(string? plan)
    {
        if (string.IsNullOrWhiteSpace(plan))
        {
            return null;
        }

        foreach (var knownPlan in KnownPlans)
        {
            if (Comparer.Equals(plan.Trim(), knownPlan))
            {
                return knownPlan;
            }
        }

        return null;
    }

    public static bool IsKnownPlan(string? plan)
    {
        return NormalizePlan(plan) is not null;
    }

    public static bool IsPlanEligibleForFeature(string? normalizedPlan, string feature)
    {
        if (string.IsNullOrWhiteSpace(normalizedPlan))
        {
            return false;
        }

        if (!Comparer.Equals(feature, DoubleEntryAccountingFeature))
        {
            return false;
        }

        return DoubleEntryEligiblePlans.Any(plan => Comparer.Equals(plan, normalizedPlan));
    }
}
