using System.Globalization;

namespace backend.Services.Compliance.Formatting;

public static class AmountFormatter
{
    public static string FormatAmount(decimal value, int width)
        => FormatDecimal(value, width, 2);

    public static string FormatDecimal(decimal value, int width, int decimals)
    {
        if (width <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(width), "Width must be positive.");
        }

        if (decimals < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(decimals), "Decimal places cannot be negative.");
        }

        var normalized = value.ToString($"F{decimals}", CultureInfo.InvariantCulture);
        if (normalized.Length > width)
        {
            normalized = normalized[^width..];
        }

        return normalized.PadLeft(width, ' ');
    }
}
