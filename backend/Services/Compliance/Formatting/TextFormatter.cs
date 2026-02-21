namespace backend.Services.Compliance.Formatting;

public static class TextFormatter
{
    public static string Format(string? value, int width)
    {
        if (width <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(width), "Width must be positive.");
        }

        var normalized = (value ?? string.Empty)
            .Replace("\r", " ", StringComparison.Ordinal)
            .Replace("\n", " ", StringComparison.Ordinal)
            .Replace('\t', ' ');

        if (normalized.Length > width)
        {
            normalized = normalized[..width];
        }

        return normalized.PadRight(width, ' ');
    }
}
