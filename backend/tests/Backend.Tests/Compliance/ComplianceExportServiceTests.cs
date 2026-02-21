using System.IO.Compression;
using System.Text;
using backend.Data;
using backend.Models.Accounting;
using backend.Models.Core;
using backend.Models.Inventory;
using backend.Models.Sales;
using backend.Services.Compliance;
using backend.Services.Compliance.Schema;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Backend.Tests.Compliance;

public class ComplianceExportServiceTests
{
    [Fact]
    public async Task ExportUnifiedFormat_GeneratesExpectedGoldenFilesAndStructure()
    {
        await using var context = CreateContext();
        await SeedDataAsync(context);

        var fixedTimestamp = new DateTimeOffset(2026, 02, 03, 15, 04, 05, TimeSpan.Zero);
        var service = new ComplianceExportService(
            context,
            NullLogger<ComplianceExportService>.Instance,
            new FixedTimeProvider(fixedTimestamp));

        var artifact = await service.ExportUnifiedFormatAsync(
            companyId: 42,
            userId: "user-99",
            startDate: new DateTime(2026, 01, 01),
            endDate: new DateTime(2026, 01, 31));

        Assert.Equal("OPENFRMT/12345678.02031504/", artifact.FolderPath);
        Assert.Equal("OPENFRMT_12345678_202602031504.zip", artifact.DownloadFileName);

        using var archiveStream = new MemoryStream(artifact.ZipContent);
        using var archive = new ZipArchive(archiveStream, ZipArchiveMode.Read);

        var expectedEntries = new[]
        {
            "OPENFRMT/12345678.02031504/INI.TXT",
            "OPENFRMT/12345678.02031504/BKMVDATA.TXT",
            "OPENFRMT/12345678.02031504/EXPORT.LOG"
        };

        var actualEntries = archive.Entries.Select(e => e.FullName).OrderBy(n => n).ToArray();
        Assert.Equal(expectedEntries.OrderBy(n => n), actualEntries);

        var iniContent = ReadZipEntry(archive, "OPENFRMT/12345678.02031504/INI.TXT");
        var bkmvContent = ReadZipEntry(archive, "OPENFRMT/12345678.02031504/BKMVDATA.TXT");
        var logContent = ReadZipEntry(archive, "OPENFRMT/12345678.02031504/EXPORT.LOG");
        var iniBytes = ReadZipEntryBytes(archive, "OPENFRMT/12345678.02031504/INI.TXT");
        var bkmvBytes = ReadZipEntryBytes(archive, "OPENFRMT/12345678.02031504/BKMVDATA.TXT");
        var logBytes = ReadZipEntryBytes(archive, "OPENFRMT/12345678.02031504/EXPORT.LOG");

        Assert.Equal(NormalizeLineEndings(ReadGoldenFile("expected_ini.txt")), NormalizeLineEndings(iniContent));
        Assert.Equal(NormalizeLineEndings(ReadGoldenFile("expected_bkmvdata.txt")), NormalizeLineEndings(bkmvContent));
        Assert.Equal(NormalizeLineEndings(ReadGoldenFile("expected_export_log.txt")), NormalizeLineEndings(logContent));
        Assert.Equal(ExpectedZipEntryBytesFromGolden("expected_ini.txt"), iniBytes);
        Assert.Equal(ExpectedZipEntryBytesFromGolden("expected_bkmvdata.txt"), bkmvBytes);
        Assert.Equal(ExpectedZipEntryBytesFromGolden("expected_export_log.txt"), logBytes);
        AssertUtf8WithoutBom(iniBytes);
        AssertUtf8WithoutBom(bkmvBytes);
        AssertUtf8WithoutBom(logBytes);
        AssertUsesCrlfLineEndingsOnly(iniBytes);
        AssertUsesCrlfLineEndingsOnly(bkmvBytes);
        AssertUsesCrlfLineEndingsOnly(logBytes);

        var bkmvLines = GetLines(bkmvContent);
        var recordOrder = bkmvLines.Select(l => l[..4]).ToArray();
        Assert.Equal(new[] { "A100", "B100", "B110", "C100", "D110", "D110", "D120", "M100", "M100", "Z900" }, recordOrder);
        Assert.All(bkmvLines, line =>
        {
            var recordType = line[..4];
            Assert.True(ComplianceRecordSchemas.BkmvByRecordType.TryGetValue(recordType, out var schema), $"Missing schema for {recordType}.");
            Assert.Equal(schema!.TotalLength, line.Length);
        });
        Assert.DoesNotContain("INV-", bkmvContent, StringComparison.Ordinal);
        Assert.DoesNotContain("REC-", bkmvContent, StringComparison.Ordinal);
        Assert.DoesNotContain("SKU-", bkmvContent, StringComparison.Ordinal);

        var c100Key = bkmvLines.Single(line => line.StartsWith("C100", StringComparison.Ordinal)).Substring(4, 20);
        Assert.True(c100Key.All(char.IsDigit));

        var a100Line = bkmvLines.Single(line => line.StartsWith("A100", StringComparison.Ordinal));
        Assert.Equal("BlueTech", a100Line.Substring(99, 20).Trim());
        Assert.Equal("BlueBooks", a100Line.Substring(119, 30).Trim());
        Assert.Equal("2026.2", a100Line.Substring(149, 10).Trim());
        Assert.Equal("HE", a100Line.Substring(159, 2).Trim());

        var d110InvoiceKeys = bkmvLines
            .Where(line => line.StartsWith("D110", StringComparison.Ordinal))
            .Select(line => line.Substring(4, 20))
            .ToArray();
        Assert.All(d110InvoiceKeys, key => Assert.Equal(c100Key, key));

        var d110ItemKeys = bkmvLines
            .Where(line => line.StartsWith("D110", StringComparison.Ordinal))
            .Select(line => line.Substring(29, 20))
            .ToArray();
        Assert.All(d110ItemKeys, key => Assert.True(key.All(char.IsDigit)));

        var d120Line = bkmvLines.Single(line => line.StartsWith("D120", StringComparison.Ordinal));
        var d120ReceiptKey = d120Line.Substring(4, 20);
        var d120InvoiceKey = d120Line.Substring(32, 20);
        Assert.True(d120ReceiptKey.All(char.IsDigit));
        Assert.Equal(c100Key, d120InvoiceKey);

        var m100Keys = bkmvLines
            .Where(line => line.StartsWith("M100", StringComparison.Ordinal))
            .Select(line => line.Substring(4, 20))
            .ToHashSet(StringComparer.Ordinal);
        Assert.All(m100Keys, key => Assert.True(key.All(char.IsDigit)));
        Assert.All(d110ItemKeys, key => Assert.Contains(key, m100Keys));

        var z900Line = bkmvLines.Single(line => line.StartsWith("Z900", StringComparison.Ordinal));
        var checksum = z900Line.Substring(14, 64);
        Assert.True(checksum.All(char.IsDigit));
        Assert.Equal(64, checksum.Length);

        var iniLines = GetLines(iniContent);
        Assert.Equal(2, iniLines.Count);
        Assert.StartsWith("A000", iniLines[0]);
        Assert.StartsWith("Z900", iniLines[1]);
        Assert.Equal(ComplianceRecordSchemas.A000.TotalLength, iniLines[0].Length);
        Assert.Equal(ComplianceRecordSchemas.IniZ900.TotalLength, iniLines[1].Length);
        Assert.Equal("BlueTech", iniLines[0].Substring(42, 20).Trim());
        Assert.Equal("BlueBooks", iniLines[0].Substring(62, 30).Trim());
        Assert.Equal("2026.2", iniLines[0].Substring(92, 10).Trim());
        Assert.Equal("HE", iniLines[0].Substring(102, 2).Trim());

        var parsedCounts = ParseIniCounts(iniLines[1]);
        Assert.Equal(10, parsedCounts["TOTAL"]);
        Assert.Equal(1, parsedCounts["A100"]);
        Assert.Equal(1, parsedCounts["B100"]);
        Assert.Equal(1, parsedCounts["B110"]);
        Assert.Equal(1, parsedCounts["C100"]);
        Assert.Equal(2, parsedCounts["D110"]);
        Assert.Equal(1, parsedCounts["D120"]);
        Assert.Equal(2, parsedCounts["M100"]);
        Assert.Equal(1, parsedCounts["Z900"]);
    }

    [Fact]
    public async Task ExportUnifiedFormat_ThrowsWhenStartDateAfterEndDate()
    {
        await using var context = CreateContext();
        await SeedDataAsync(context);

        var service = new ComplianceExportService(
            context,
            NullLogger<ComplianceExportService>.Instance,
            new FixedTimeProvider(new DateTimeOffset(2026, 02, 03, 15, 04, 05, TimeSpan.Zero)));

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.ExportUnifiedFormatAsync(
                companyId: 42,
                userId: "user-99",
                startDate: new DateTime(2026, 01, 31),
                endDate: new DateTime(2026, 01, 01)));
    }

    [Fact]
    public async Task ExportUnifiedFormat_ThrowsWhenNumericFieldContainsAlphabeticCharacters()
    {
        await using var context = CreateContext();
        await SeedDataAsync(context);

        var company = await context.Companies.SingleAsync(c => c.Id == 42);
        company.IsraelTaxId = "51A345678";
        await context.SaveChangesAsync();

        var service = new ComplianceExportService(
            context,
            NullLogger<ComplianceExportService>.Instance,
            new FixedTimeProvider(new DateTimeOffset(2026, 02, 03, 15, 04, 05, TimeSpan.Zero)));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ExportUnifiedFormatAsync(
                companyId: 42,
                userId: "user-99",
                startDate: new DateTime(2026, 01, 01),
                endDate: new DateTime(2026, 01, 31)));
    }

    [Fact]
    public async Task ExportUnifiedFormat_ThrowsWhenCompanyTaxIdCheckDigitIsInvalid()
    {
        await using var context = CreateContext();
        await SeedDataAsync(context);

        var company = await context.Companies.SingleAsync(c => c.Id == 42);
        company.IsraelTaxId = "512345678"; // invalid check digit
        await context.SaveChangesAsync();

        var service = new ComplianceExportService(
            context,
            NullLogger<ComplianceExportService>.Instance,
            new FixedTimeProvider(new DateTimeOffset(2026, 02, 03, 15, 04, 05, TimeSpan.Zero)));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ExportUnifiedFormatAsync(
                companyId: 42,
                userId: "user-99",
                startDate: new DateTime(2026, 01, 01),
                endDate: new DateTime(2026, 01, 31)));
    }

    [Fact]
    public async Task ExportUnifiedFormat_ThrowsWhenReceiptInvoiceHasNoMatchingC100()
    {
        await using var context = CreateContext();
        await SeedDataAsync(context);

        var receipt = await context.Receipts.SingleAsync(r => r.Id == 9201);
        receipt.InvoiceId = 999999;
        await context.SaveChangesAsync();

        var service = new ComplianceExportService(
            context,
            NullLogger<ComplianceExportService>.Instance,
            new FixedTimeProvider(new DateTimeOffset(2026, 02, 03, 15, 04, 05, TimeSpan.Zero)));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ExportUnifiedFormatAsync(
                companyId: 42,
                userId: "user-99",
                startDate: new DateTime(2026, 01, 01),
                endDate: new DateTime(2026, 01, 31)));
    }

    [Fact]
    public void ComplianceRecordSchemas_DefinesAllRequiredUnifiedFormatRecords()
    {
        var expectedSchemaIds = new[]
        {
            "INI_A000",
            "INI_Z900",
            "BKMV_A100",
            "BKMV_B100",
            "BKMV_B110",
            "BKMV_C100",
            "BKMV_D110",
            "BKMV_D120",
            "BKMV_M100",
            "BKMV_Z900"
        };

        var actualSchemaIds = ComplianceRecordSchemas.AllBySchemaId.Keys.OrderBy(k => k).ToArray();
        Assert.Equal(expectedSchemaIds.OrderBy(k => k), actualSchemaIds);
    }

    private static AccountingDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AccountingDbContext>()
            .UseInMemoryDatabase($"compliance-export-tests-{Guid.NewGuid()}")
            .Options;

        return new AccountingDbContext(options);
    }

    private static async Task SeedDataAsync(AccountingDbContext context)
    {
        var company = new Company
        {
            Id = 42,
            Name = "Blue Ocean Ltd",
            IsraelTaxId = "512345679",
            ComplianceCompanyIdentifier = "12345678",
            ComplianceSoftwareVendor = "BlueTech",
            ComplianceSoftwareName = "BlueBooks",
            ComplianceSoftwareVersion = "2026.2",
            ComplianceLanguageCode = "HE",
            Currency = "ILS",
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var customer = new Customer
        {
            Id = 3001,
            CompanyId = 42,
            Name = "Acme LTD",
            TaxId = "514444447",
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var account = new ChartOfAccount
        {
            Id = 110,
            CompanyId = 42,
            AccountNumber = "4000",
            Name = "Sales Revenue",
            Type = AccountType.Revenue,
            CurrentBalance = 1287.00m,
            IsActive = true,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var journalEntry = new JournalEntry
        {
            Id = 5001,
            CompanyId = 42,
            AccountId = 110,
            TransactionDate = new DateTime(2026, 01, 15),
            TransactionNumber = "JRN-0001",
            Description = "January revenue",
            DebitAmount = 0m,
            CreditAmount = 1287.00m,
            ReferenceType = "INV",
            ReferenceId = 9001,
            SequenceNumber = 1,
            IsPosted = true,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var invoice = new Invoice
        {
            Id = 9001,
            CompanyId = 42,
            CustomerId = 3001,
            InvoiceNumber = "INV-2026-0001",
            InvoiceDate = new DateTime(2026, 01, 15),
            DueDate = new DateTime(2026, 02, 14),
            Status = InvoiceStatus.Sent,
            SubtotalAmount = 1100.00m,
            TaxAmount = 187.00m,
            TotalAmount = 1287.00m,
            Currency = "ILS",
            CustomerName = "Acme LTD",
            CustomerTaxId = "514444447",
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var line1 = new InvoiceLine
        {
            Id = 9101,
            InvoiceId = 9001,
            ItemId = 7001,
            LineNumber = 1,
            Description = "Managed Service Plan",
            ItemSku = "SKU-01",
            Quantity = 1.000m,
            UnitPrice = 1000.00m,
            TaxRate = 17.00m,
            TaxAmount = 170.00m,
            LineTotal = 1000.00m,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var line2 = new InvoiceLine
        {
            Id = 9102,
            InvoiceId = 9001,
            ItemId = 7002,
            LineNumber = 2,
            Description = "Addon Package",
            ItemSku = "SKU-02",
            Quantity = 2.000m,
            UnitPrice = 50.00m,
            TaxRate = 17.00m,
            TaxAmount = 17.00m,
            LineTotal = 100.00m,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var receipt = new Receipt
        {
            Id = 9201,
            CompanyId = 42,
            InvoiceId = 9001,
            ReceiptNumber = "REC-2026-0001",
            PaymentDate = new DateTime(2026, 01, 20),
            Amount = 1287.00m,
            PaymentMethod = "BankTransfer",
            ReferenceNumber = "TRX-001",
            Currency = "ILS",
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var item1 = new Item
        {
            Id = 7001,
            CompanyId = 42,
            SKU = "SKU-01",
            Name = "Managed Service Plan",
            Category = "Services",
            Unit = "unit",
            ItemType = "Service",
            IsInventoryTracked = false,
            CurrentStockQty = 0m,
            SellPrice = 1000.00m,
            CostPrice = 700.00m,
            IsActive = true,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        var item2 = new Item
        {
            Id = 7002,
            CompanyId = 42,
            SKU = "SKU-02",
            Name = "Addon Package",
            Category = "Services",
            Unit = "unit",
            ItemType = "Service",
            IsInventoryTracked = false,
            CurrentStockQty = 5m,
            SellPrice = 50.00m,
            CostPrice = 20.00m,
            IsActive = true,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        };

        await context.Companies.AddAsync(company);
        await context.Customers.AddAsync(customer);
        await context.ChartOfAccounts.AddAsync(account);
        await context.JournalEntries.AddAsync(journalEntry);
        await context.Invoices.AddAsync(invoice);
        await context.InvoiceLines.AddRangeAsync(line1, line2);
        await context.Receipts.AddAsync(receipt);
        await context.Items.AddRangeAsync(item1, item2);
        await context.SaveChangesAsync();
    }

    private static string ReadZipEntry(ZipArchive archive, string entryName)
    {
        var entry = archive.GetEntry(entryName);
        Assert.NotNull(entry);

        using var stream = entry!.Open();
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }

    private static byte[] ReadZipEntryBytes(ZipArchive archive, string entryName)
    {
        var entry = archive.GetEntry(entryName);
        Assert.NotNull(entry);

        using var stream = entry!.Open();
        using var memory = new MemoryStream();
        stream.CopyTo(memory);
        return memory.ToArray();
    }

    private static string ReadGoldenFile(string fileName)
    {
        var outputPath = Path.Combine(AppContext.BaseDirectory, "GoldenFiles", fileName);
        return File.ReadAllText(outputPath);
    }

    private static string NormalizeLineEndings(string value)
        => value.Replace("\r\n", "\n", StringComparison.Ordinal).Replace("\r", "\n", StringComparison.Ordinal);

    private static string NormalizeLineEndingsToCrlf(string value)
        => NormalizeLineEndings(value).Replace("\n", "\r\n", StringComparison.Ordinal);

    private static List<string> GetLines(string content)
        => NormalizeLineEndings(content)
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .ToList();

    private static byte[] ExpectedZipEntryBytesFromGolden(string fileName)
    {
        var goldenText = ReadGoldenFile(fileName);
        var normalized = NormalizeLineEndingsToCrlf(goldenText);
        return new UTF8Encoding(encoderShouldEmitUTF8Identifier: false).GetBytes(normalized);
    }

    private static void AssertUtf8WithoutBom(byte[] bytes)
    {
        Assert.False(
            bytes.Length >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF,
            "ZIP entry must not start with a UTF-8 BOM.");
    }

    private static void AssertUsesCrlfLineEndingsOnly(byte[] bytes)
    {
        for (var index = 0; index < bytes.Length; index++)
        {
            if (bytes[index] == 0x0A)
            {
                Assert.True(index > 0 && bytes[index - 1] == 0x0D, "Found LF not preceded by CR.");
            }

            if (bytes[index] == 0x0D)
            {
                Assert.True(index + 1 < bytes.Length && bytes[index + 1] == 0x0A, "Found CR not followed by LF.");
            }
        }
    }

    private static Dictionary<string, int> ParseIniCounts(string z900Line)
    {
        Assert.StartsWith("Z900", z900Line);
        Assert.True(z900Line.Length >= 78, "INI Z900 line must be at least 78 chars.");

        return new Dictionary<string, int>
        {
            ["TOTAL"] = ParseInt(z900Line, 4, 10),
            ["A100"] = ParseInt(z900Line, 14, 8),
            ["B100"] = ParseInt(z900Line, 22, 8),
            ["B110"] = ParseInt(z900Line, 30, 8),
            ["C100"] = ParseInt(z900Line, 38, 8),
            ["D110"] = ParseInt(z900Line, 46, 8),
            ["D120"] = ParseInt(z900Line, 54, 8),
            ["M100"] = ParseInt(z900Line, 62, 8),
            ["Z900"] = ParseInt(z900Line, 70, 8)
        };
    }

    private static int ParseInt(string input, int startIndex, int length)
        => int.Parse(input.Substring(startIndex, length), System.Globalization.CultureInfo.InvariantCulture);

    private sealed class FixedTimeProvider : TimeProvider
    {
        private readonly DateTimeOffset _utcNow;

        public FixedTimeProvider(DateTimeOffset utcNow)
        {
            _utcNow = utcNow;
        }

        public override DateTimeOffset GetUtcNow() => _utcNow;
    }
}
