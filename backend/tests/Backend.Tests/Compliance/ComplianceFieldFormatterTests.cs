using backend.Services.Compliance.Formatting;
using Xunit;

namespace Backend.Tests.Compliance;

public class ComplianceFieldFormatterTests
{
    [Fact]
    public void TextFormatter_NormalizesWhitespaceAndPads()
    {
        var actual = TextFormatter.Format("A\r\nB\tC", 8);

        Assert.Equal("A  B C  ", actual);
    }

    [Fact]
    public void TextFormatter_TruncatesWhenInputExceedsWidth()
    {
        var actual = TextFormatter.Format("ABCDEFGHI", 4);

        Assert.Equal("ABCD", actual);
    }

    [Fact]
    public void NumericFormatter_FormatsNullableIntWithZeroPadding()
    {
        Assert.Equal("0000", NumericFormatter.Format((int?)null, 4));
        Assert.Equal("0012", NumericFormatter.Format(12, 4));
        Assert.Equal("0000", NumericFormatter.Format(-1, 4));
    }

    [Fact]
    public void NumericFormatter_FormatsDigitString()
    {
        var actual = NumericFormatter.FormatDigits("123456", 4);

        Assert.Equal("3456", actual);
    }

    [Fact]
    public void NumericFormatter_RejectsAlphanumericInput()
    {
        Assert.Throws<InvalidOperationException>(() => NumericFormatter.FormatDigits("12A3", 6));
    }

    [Fact]
    public void DateFormatter_FormatsDateAndTimestamp()
    {
        Assert.Equal("20260203", DateFormatter.Format(new DateTime(2026, 02, 03)));
        Assert.Equal("00000000", DateFormatter.Format(null));
        Assert.Equal("20260203150405", DateFormatter.FormatTimestamp(new DateTime(2026, 02, 03, 15, 04, 05)));
    }

    [Fact]
    public void AmountFormatter_FormatsAmountAndDecimal()
    {
        Assert.Equal("   12.30", AmountFormatter.FormatAmount(12.3m, 8));
        Assert.Equal("  1.235", AmountFormatter.FormatDecimal(1.2345m, 7, 3));
    }

    [Fact]
    public void AmountFormatter_TruncatesFromLeftWhenWidthIsTooSmall()
    {
        var actual = AmountFormatter.FormatAmount(12345.67m, 5);

        Assert.Equal("45.67", actual);
    }
}
