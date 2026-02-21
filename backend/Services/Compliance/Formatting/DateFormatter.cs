using System.Globalization;

namespace backend.Services.Compliance.Formatting;

public static class DateFormatter
{
    public static string Format(DateTime? value)
        => value.HasValue ? value.Value.ToString("yyyyMMdd", CultureInfo.InvariantCulture) : "00000000";

    public static string FormatTimestamp(DateTime value)
        => value.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture);
}
