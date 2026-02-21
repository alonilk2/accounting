using System.Text.RegularExpressions;

namespace backend.Services.Core;

public static class IsraeliTaxIdValidator
{
    public static bool TryNormalizeValid(string? rawTaxId, out string normalizedTaxId)
    {
        normalizedTaxId = string.Empty;
        if (string.IsNullOrWhiteSpace(rawTaxId))
        {
            return false;
        }

        var digitsOnly = Regex.Replace(rawTaxId, @"\D", string.Empty);
        if (digitsOnly.Length != 9)
        {
            return false;
        }

        var digits = digitsOnly.Select(c => c - '0').ToArray();
        var sum = 0;
        for (var index = 0; index < 8; index++)
        {
            var product = digits[index] * ((index % 2) + 1);
            if (product > 9)
            {
                product = (product / 10) + (product % 10);
            }

            sum += product;
        }

        var checkDigit = (10 - (sum % 10)) % 10;
        if (checkDigit != digits[8])
        {
            return false;
        }

        normalizedTaxId = digitsOnly;
        return true;
    }
}
