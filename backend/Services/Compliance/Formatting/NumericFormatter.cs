using System.Globalization;

namespace backend.Services.Compliance.Formatting;

public static class NumericFormatter
{
    public static string Format(int? value, int width)
    {
        if (!value.HasValue)
        {
            return string.Empty.PadLeft(width, '0');
        }

        return Format(value.Value, width);
    }

    public static string Format(int value, int width)
    {
        ValidateWidth(width);

        var normalized = Math.Max(0, value).ToString(CultureInfo.InvariantCulture);
        if (normalized.Length > width)
        {
            normalized = normalized[^width..];
        }

        return normalized.PadLeft(width, '0');
    }

    public static string FormatDigits(string? value, int width)
    {
        ValidateWidth(width);

        var normalized = (value ?? string.Empty).Trim();
        if (normalized.Length == 0)
        {
            return string.Empty.PadLeft(width, '0');
        }

        if (!normalized.All(char.IsDigit))
        {
            throw new InvalidOperationException($"Numeric formatter received non-digit input: '{value}'.");
        }

        if (normalized.Length > width)
        {
            normalized = normalized[^width..];
        }

        return normalized.PadLeft(width, '0');
    }

    private static void ValidateWidth(int width)
    {
        if (width <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(width), "Width must be positive.");
        }
    }
}
