using System.Text.RegularExpressions;

namespace backend.Services.Core;

/// <summary>
/// Shared validation utilities for business entities
/// Centralizes common validation logic to promote code reuse
/// </summary>
public static class BusinessValidationHelper
{
    /// <summary>
    /// Validate Israeli tax ID using the Israeli check digit algorithm
    /// </summary>
    /// <param name="taxId">Tax ID to validate</param>
    /// <returns>True if valid, false otherwise</returns>
    public static bool ValidateIsraeliTaxId(string? taxId)
    {
        if (string.IsNullOrEmpty(taxId))
            return false;

        // Remove any non-digits
        var cleanTaxId = new string(taxId.Where(char.IsDigit).ToArray());

        // Israeli tax ID should be 9 digits
        if (cleanTaxId.Length != 9)
            return false;

        // Calculate checksum using Israeli algorithm
        var checksum = 0;
        for (int i = 0; i < 8; i++)
        {
            var digit = int.Parse(cleanTaxId[i].ToString());
            var multiplier = (i % 2) + 1;
            var product = digit * multiplier;
            checksum += product > 9 ? product - 9 : product;
        }

        var expectedCheckDigit = (10 - (checksum % 10)) % 10;
        var actualCheckDigit = int.Parse(cleanTaxId[8].ToString());

        return expectedCheckDigit == actualCheckDigit;
    }

    /// <summary>
    /// Validate email address format
    /// </summary>
    /// <param name="email">Email to validate</param>
    /// <returns>True if valid format, false otherwise</returns>
    public static bool ValidateEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return true; // Allow null/empty emails

        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Validate Israeli phone number format
    /// </summary>
    /// <param name="phone">Phone number to validate</param>
    /// <returns>True if valid format, false otherwise</returns>
    public static bool ValidateIsraeliPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return true; // Allow null/empty phones

        // Remove all non-digits
        var cleanPhone = new string(phone.Where(char.IsDigit).ToArray());

        // Israeli phone numbers patterns:
        // Mobile: 05xxxxxxxx (10 digits)
        // Landline: 0xxxxxxxxx (9-10 digits)
        // International: +972xxxxxxxx
        if (cleanPhone.Length >= 9 && cleanPhone.Length <= 10 && cleanPhone.StartsWith("0"))
        {
            return true;
        }

        // International format
        if (phone.StartsWith("+972") && cleanPhone.Length >= 9)
        {
            return true;
        }

        return false;
    }

    /// <summary>
    /// Validate website URL format
    /// </summary>
    /// <param name="website">Website URL to validate</param>
    /// <returns>True if valid format, false otherwise</returns>
    public static bool ValidateWebsite(string? website)
    {
        if (string.IsNullOrWhiteSpace(website))
            return true; // Allow null/empty websites

        try
        {
            return Uri.TryCreate(website, UriKind.Absolute, out var result) &&
                   (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Clean and format tax ID for storage
    /// </summary>
    /// <param name="taxId">Raw tax ID input</param>
    /// <returns>Cleaned tax ID with only digits</returns>
    public static string? CleanTaxId(string? taxId)
    {
        if (string.IsNullOrWhiteSpace(taxId))
            return null;

        var cleaned = new string(taxId.Where(char.IsDigit).ToArray());
        return string.IsNullOrEmpty(cleaned) ? null : cleaned;
    }

    /// <summary>
    /// Clean and format phone number for storage
    /// </summary>
    /// <param name="phone">Raw phone input</param>
    /// <returns>Cleaned phone number</returns>
    public static string? CleanPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        // Remove spaces, dashes, parentheses
        var cleaned = Regex.Replace(phone, @"[\s\-\(\)]", "");
        
        // Convert international format to local
        if (cleaned.StartsWith("+972"))
        {
            cleaned = "0" + cleaned.Substring(4);
        }

        return string.IsNullOrEmpty(cleaned) ? null : cleaned;
    }
}