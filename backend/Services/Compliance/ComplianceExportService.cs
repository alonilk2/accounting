using System.Globalization;
using System.IO.Compression;
using System.Numerics;
using System.Text;
using backend.Data;
using backend.Models.Accounting;
using backend.Models.Core;
using backend.Models.Inventory;
using backend.Models.Sales;
using backend.Services.Compliance.Formatting;
using backend.Services.Interfaces;
using backend.Services.Compliance.Schema;
using backend.Services.Core;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Compliance;

/// <summary>
/// Creates Israeli Tax Authority unified-format exports (INI.TXT + BKMVDATA.TXT) in a ZIP package.
/// </summary>
public sealed class ComplianceExportService : IComplianceExportService
{
    private const string LineBreak = "\r\n";
    private const int LinkFieldWidth = 20;
    private const string DefaultSoftwareVendor = "AccountingSaaS";
    private const string DefaultSoftwareName = "UnifiedFormatExporter";
    private const string DefaultSoftwareVersion = "1.0.0";
    private const string DefaultLanguageCode = "HE";
    private static readonly UTF8Encoding ZipEntryEncoding = new(encoderShouldEmitUTF8Identifier: false, throwOnInvalidBytes: true);
    private static readonly string[] RecordOrder = ["A100", "B100", "B110", "C100", "D110", "D120", "M100", "Z900"];
    private static readonly IReadOnlyDictionary<string, string> IniCountFieldByRecordType =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["A100"] = "CountA100",
            ["B100"] = "CountB100",
            ["B110"] = "CountB110",
            ["C100"] = "CountC100",
            ["D110"] = "CountD110",
            ["D120"] = "CountD120",
            ["M100"] = "CountM100",
            ["Z900"] = "CountZ900"
        };

    private readonly AccountingDbContext _context;
    private readonly ILogger<ComplianceExportService> _logger;
    private readonly TimeProvider _timeProvider;

    public ComplianceExportService(
        AccountingDbContext context,
        ILogger<ComplianceExportService> logger,
        TimeProvider timeProvider)
    {
        _context = context;
        _logger = logger;
        _timeProvider = timeProvider;
    }

    public async Task<UnifiedFormatExportArtifact> ExportUnifiedFormatAsync(
        int companyId,
        string userId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        var normalizedStart = startDate.Date;
        var normalizedEnd = endDate.Date;

        if (normalizedStart > normalizedEnd)
        {
            throw new ArgumentException("StartDate must be on or before EndDate.");
        }

        var company = await _context.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == companyId, cancellationToken);

        if (company is null)
        {
            throw new KeyNotFoundException($"Company {companyId} was not found.");
        }

        var generatedAt = _timeProvider.GetUtcNow().UtcDateTime;
        var exportMetadata = ResolveExportMetadata(company);
        var exportFolder = $"OPENFRMT/{exportMetadata.CompanyIdentifier}.{generatedAt:MMddHHmm}/";

        var accounts = await _context.ChartOfAccounts
            .AsNoTracking()
            .Where(a => a.CompanyId == companyId && a.IsActive)
            .OrderBy(a => a.AccountNumber)
            .ThenBy(a => a.Id)
            .ToListAsync(cancellationToken);

        var journalEntries = await _context.JournalEntries
            .AsNoTracking()
            .Include(j => j.Account)
            .Where(j => j.CompanyId == companyId &&
                        j.TransactionDate.Date >= normalizedStart &&
                        j.TransactionDate.Date <= normalizedEnd)
            .OrderBy(j => j.TransactionDate)
            .ThenBy(j => j.SequenceNumber)
            .ThenBy(j => j.Id)
            .ToListAsync(cancellationToken);

        var invoices = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.Lines)
            .Where(i => i.CompanyId == companyId &&
                        i.InvoiceDate.Date >= normalizedStart &&
                        i.InvoiceDate.Date <= normalizedEnd)
            .OrderBy(i => i.InvoiceDate)
            .ThenBy(i => i.InvoiceNumber)
            .ThenBy(i => i.Id)
            .ToListAsync(cancellationToken);

        var receipts = await _context.Receipts
            .AsNoTracking()
            .Include(r => r.Invoice)
            .Where(r => r.CompanyId == companyId &&
                        r.PaymentDate.Date >= normalizedStart &&
                        r.PaymentDate.Date <= normalizedEnd)
            .OrderBy(r => r.PaymentDate)
            .ThenBy(r => r.ReceiptNumber)
            .ThenBy(r => r.Id)
            .ToListAsync(cancellationToken);

        var items = await _context.Items
            .AsNoTracking()
            .Where(i => i.CompanyId == companyId && i.IsActive)
            .OrderBy(i => i.SKU)
            .ThenBy(i => i.Id)
            .ToListAsync(cancellationToken);

        var bkmvLines = BuildBkmvLines(
            company,
            exportMetadata,
            userId,
            normalizedStart,
            normalizedEnd,
            generatedAt,
            accounts,
            journalEntries,
            invoices,
            receipts,
            items);

        var checksum = ComputeClosureChecksum(bkmvLines);
        var totalRecords = bkmvLines.Count + 1;
        bkmvLines.Add(EnsureRecordLength(BuildZ900(totalRecords, checksum, generatedAt), ComplianceRecordSchemas.BkmvZ900));
        var recordCounts = CountRecords(bkmvLines);
        ValidateBkmvClosure(bkmvLines, recordCounts, totalRecords, checksum);

        var bkmvContent = string.Join(LineBreak, bkmvLines) + LineBreak;
        var iniContent = BuildIniContent(exportMetadata, normalizedStart, normalizedEnd, generatedAt, exportFolder, recordCounts, totalRecords);
        ValidateIniClosure(iniContent, recordCounts, totalRecords);
        var logContent = BuildLogContent(company, userId, normalizedStart, normalizedEnd, generatedAt, recordCounts, totalRecords, checksum);
        var zipContent = BuildZip(exportFolder, iniContent, bkmvContent, logContent);

        _logger.LogInformation(
            "Generated unified compliance export for company {CompanyId} with {TotalRecords} records from {StartDate:yyyy-MM-dd} to {EndDate:yyyy-MM-dd}",
            companyId,
            totalRecords,
            normalizedStart,
            normalizedEnd);

        return new UnifiedFormatExportArtifact
        {
            ZipContent = zipContent,
            DownloadFileName = $"OPENFRMT_{exportMetadata.CompanyIdentifier}_{generatedAt:yyyyMMddHHmm}.zip",
            FolderPath = exportFolder,
            IniContent = iniContent,
            BkmvDataContent = bkmvContent,
            ExportLogContent = logContent,
            RecordCounts = recordCounts
        };
    }

    private static List<string> BuildBkmvLines(
        Company company,
        ComplianceExportMetadata exportMetadata,
        string userId,
        DateTime startDate,
        DateTime endDate,
        DateTime generatedAt,
        IReadOnlyCollection<ChartOfAccount> accounts,
        IReadOnlyCollection<JournalEntry> journalEntries,
        IReadOnlyCollection<Invoice> invoices,
        IReadOnlyCollection<Receipt> receipts,
        IReadOnlyCollection<Item> items)
    {
        var invoiceKeyById = invoices
            .ToDictionary(i => i.Id, i => FormatInternalKey(i.Id, LinkFieldWidth));

        var itemKeyById = items
            .ToDictionary(i => i.Id, i => FormatInternalKey(i.Id, LinkFieldWidth));

        var itemKeyBySku = items
            .Where(i => !string.IsNullOrWhiteSpace(i.SKU))
            .GroupBy(i => i.SKU.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => FormatInternalKey(g.OrderBy(i => i.Id).First().Id, LinkFieldWidth), StringComparer.OrdinalIgnoreCase);

        var lines = new List<string>
        {
            EnsureRecordLength(BuildA100(company, exportMetadata, userId, startDate, endDate, generatedAt), ComplianceRecordSchemas.A100)
        };

        foreach (var journalEntry in journalEntries)
        {
            lines.Add(EnsureRecordLength(BuildB100(journalEntry), ComplianceRecordSchemas.B100));
        }

        foreach (var account in accounts)
        {
            lines.Add(EnsureRecordLength(BuildB110(account), ComplianceRecordSchemas.B110));
        }

        foreach (var invoice in invoices)
        {
            var invoiceKey = invoiceKeyById[invoice.Id];
            lines.Add(EnsureRecordLength(BuildC100(invoice, invoiceKey), ComplianceRecordSchemas.C100));
        }

        foreach (var invoice in invoices)
        {
            var invoiceKey = invoiceKeyById[invoice.Id];
            foreach (var line in invoice.Lines.OrderBy(l => l.LineNumber).ThenBy(l => l.Id))
            {
                var itemKey = ResolveItemKey(line, itemKeyById, itemKeyBySku);
                lines.Add(EnsureRecordLength(BuildD110(invoiceKey, line, itemKey), ComplianceRecordSchemas.D110));
            }
        }

        foreach (var receipt in receipts)
        {
            string? invoiceKey = null;
            if (receipt.InvoiceId.HasValue)
            {
                if (!invoiceKeyById.TryGetValue(receipt.InvoiceId.Value, out invoiceKey))
                {
                    throw new InvalidOperationException(
                        $"Receipt {receipt.Id} references InvoiceId {receipt.InvoiceId.Value} without a matching C100 header in the selected export range.");
                }
            }

            lines.Add(EnsureRecordLength(BuildD120(receipt, invoiceKey), ComplianceRecordSchemas.D120));
        }

        foreach (var item in items)
        {
            var itemKey = itemKeyById[item.Id];
            lines.Add(EnsureRecordLength(BuildM100(item, itemKey), ComplianceRecordSchemas.M100));
        }

        return lines;
    }

    private static string BuildA100(
        Company company,
        ComplianceExportMetadata exportMetadata,
        string userId,
        DateTime startDate,
        DateTime endDate,
        DateTime generatedAt)
    {
        return BuildRecord(
            ComplianceRecordSchemas.A100,
            new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            {
                ["CompanyTaxId"] = exportMetadata.CompanyTaxId,
                ["CompanyName"] = company.Name,
                ["StartDate"] = startDate,
                ["EndDate"] = endDate,
                ["GeneratedAt"] = generatedAt,
                ["SoftwareVendor"] = exportMetadata.SoftwareVendor,
                ["SoftwareName"] = exportMetadata.SoftwareName,
                ["SoftwareVersion"] = exportMetadata.SoftwareVersion,
                ["LanguageCode"] = exportMetadata.LanguageCode,
                ["UserId"] = userId,
                ["Currency"] = company.Currency,
                ["CompanyIdentifier"] = exportMetadata.CompanyIdentifier
            });
    }

    private static string BuildB100(JournalEntry entry)
    {
        return BuildRecord(
            ComplianceRecordSchemas.B100,
            new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            {
                ["TransactionNumber"] = FormatInternalKey(entry.Id, LinkFieldWidth),
                ["TransactionDate"] = entry.TransactionDate,
                ["AccountNumber"] = entry.Account?.AccountNumber,
                ["Description"] = entry.Description,
                ["DebitAmount"] = entry.DebitAmount,
                ["CreditAmount"] = entry.CreditAmount,
                ["ReferenceType"] = entry.ReferenceType,
                ["ReferenceId"] = entry.ReferenceId
            });
    }

    private static string BuildB110(ChartOfAccount account)
    {
        return BuildRecord(
            ComplianceRecordSchemas.B110,
            new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            {
                ["AccountNumber"] = account.AccountNumber,
                ["AccountName"] = account.Name,
                ["AccountType"] = account.Type.ToString(),
                ["IsActive"] = account.IsActive ? "Y" : "N",
                ["ParentAccountId"] = account.ParentAccountId,
                ["CurrentBalance"] = account.CurrentBalance
            });
    }

    private static string BuildC100(Invoice invoice, string invoiceKey)
    {
        return BuildRecord(
            ComplianceRecordSchemas.C100,
            new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            {
                ["InvoiceNumber"] = invoiceKey,
                ["InvoiceDate"] = invoice.InvoiceDate,
                ["CustomerTaxId"] = NormalizeOptionalIsraeliTaxId(invoice.CustomerTaxId, $"Invoice {invoice.Id} customer tax ID"),
                ["CustomerName"] = invoice.CustomerName,
                ["SubtotalAmount"] = invoice.SubtotalAmount,
                ["TaxAmount"] = invoice.TaxAmount,
                ["TotalAmount"] = invoice.TotalAmount,
                ["Currency"] = invoice.Currency,
                ["DueDate"] = invoice.DueDate
            });
    }

    private static string BuildD110(string invoiceKey, InvoiceLine line, string itemKey)
    {
        return BuildRecord(
            ComplianceRecordSchemas.D110,
            new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            {
                ["InvoiceNumber"] = invoiceKey,
                ["LineNumber"] = line.LineNumber,
                ["ItemSku"] = itemKey,
                ["Description"] = line.Description,
                ["Quantity"] = line.Quantity,
                ["UnitPrice"] = line.UnitPrice,
                ["TaxRate"] = line.TaxRate,
                ["TaxAmount"] = line.TaxAmount,
                ["LineTotal"] = line.LineTotal
            });
    }

    private static string BuildD120(Receipt receipt, string? invoiceKey)
    {
        return BuildRecord(
            ComplianceRecordSchemas.D120,
            new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            {
                ["ReceiptNumber"] = FormatInternalKey(receipt.Id, LinkFieldWidth),
                ["PaymentDate"] = receipt.PaymentDate,
                ["InvoiceNumber"] = invoiceKey,
                ["Amount"] = receipt.Amount,
                ["PaymentMethod"] = receipt.PaymentMethod,
                ["ReferenceNumber"] = receipt.ReferenceNumber,
                ["Currency"] = receipt.Currency
            });
    }

    private static string BuildM100(Item item, string itemKey)
    {
        return BuildRecord(
            ComplianceRecordSchemas.M100,
            new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            {
                ["ItemSku"] = itemKey,
                ["ItemName"] = item.Name,
                ["Category"] = item.Category,
                ["Unit"] = item.Unit,
                ["CurrentStockQty"] = item.CurrentStockQty,
                ["SellPrice"] = item.SellPrice,
                ["CostPrice"] = item.CostPrice,
                ["IsActive"] = item.IsActive ? "Y" : "N"
            });
    }

    private static string BuildZ900(int totalRecords, string checksum, DateTime generatedAt)
    {
        return BuildRecord(
            ComplianceRecordSchemas.BkmvZ900,
            new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            {
                ["TotalRecords"] = totalRecords,
                ["Checksum"] = checksum,
                ["GeneratedAt"] = generatedAt
            });
    }

    private static string BuildIniContent(
        ComplianceExportMetadata exportMetadata,
        DateTime startDate,
        DateTime endDate,
        DateTime generatedAt,
        string exportFolder,
        IReadOnlyDictionary<string, int> counts,
        int totalRecords)
    {
        var a000 = EnsureRecordLength(
            BuildRecord(
                ComplianceRecordSchemas.A000,
                new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
                {
                    ["CompanyIdentifier"] = exportMetadata.CompanyIdentifier,
                    ["StartDate"] = startDate,
                    ["EndDate"] = endDate,
                    ["GeneratedAt"] = generatedAt,
                    ["SoftwareVendor"] = exportMetadata.SoftwareVendor,
                    ["SoftwareName"] = exportMetadata.SoftwareName,
                    ["SoftwareVersion"] = exportMetadata.SoftwareVersion,
                    ["LanguageCode"] = exportMetadata.LanguageCode,
                    ["ExportFolder"] = exportFolder
                }),
            ComplianceRecordSchemas.A000);

        var z900 = EnsureRecordLength(
            BuildRecord(
                ComplianceRecordSchemas.IniZ900,
                new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
                {
                    ["TotalRecords"] = totalRecords,
                    ["CountA100"] = GetCount(counts, "A100"),
                    ["CountB100"] = GetCount(counts, "B100"),
                    ["CountB110"] = GetCount(counts, "B110"),
                    ["CountC100"] = GetCount(counts, "C100"),
                    ["CountD110"] = GetCount(counts, "D110"),
                    ["CountD120"] = GetCount(counts, "D120"),
                    ["CountM100"] = GetCount(counts, "M100"),
                    ["CountZ900"] = GetCount(counts, "Z900")
                }),
            ComplianceRecordSchemas.IniZ900);

        return string.Join(LineBreak, [a000, z900]) + LineBreak;
    }

    private static string BuildLogContent(
        Company company,
        string userId,
        DateTime startDate,
        DateTime endDate,
        DateTime generatedAt,
        IReadOnlyDictionary<string, int> counts,
        int totalRecords,
        string checksum)
    {
        var lines = new List<string>
        {
            $"GeneratedAt={generatedAt:O}",
            $"CompanyId={company.Id}",
            $"CompanyName={company.Name}",
            $"UserId={userId}",
            $"PeriodStart={startDate:yyyy-MM-dd}",
            $"PeriodEnd={endDate:yyyy-MM-dd}",
            $"TotalRecords={totalRecords}",
            $"Checksum={checksum}"
        };

        foreach (var recordType in RecordOrder)
        {
            lines.Add($"Count_{recordType}={GetCount(counts, recordType)}");
        }

        return string.Join(LineBreak, lines) + LineBreak;
    }

    private static byte[] BuildZip(string exportFolder, string iniContent, string bkmvContent, string logContent)
    {
        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddZipEntry(archive, $"{exportFolder}INI.TXT", iniContent);
            AddZipEntry(archive, $"{exportFolder}BKMVDATA.TXT", bkmvContent);
            AddZipEntry(archive, $"{exportFolder}EXPORT.LOG", logContent);
        }

        return memoryStream.ToArray();
    }

    private static void AddZipEntry(ZipArchive archive, string path, string content)
    {
        var entry = archive.CreateEntry(path, CompressionLevel.Optimal);
        using var stream = entry.Open();
        var normalizedContent = NormalizeZipTextContent(content);
        var contentBytes = ZipEntryEncoding.GetBytes(normalizedContent);
        stream.Write(contentBytes);
    }

    private static string NormalizeZipTextContent(string content)
    {
        if (string.IsNullOrEmpty(content))
        {
            return string.Empty;
        }

        return content
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace("\r", "\n", StringComparison.Ordinal)
            .Replace("\n", LineBreak, StringComparison.Ordinal);
    }

    private static Dictionary<string, int> CountRecords(IEnumerable<string> lines)
    {
        var counts = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (var line in lines)
        {
            if (line.Length < 4)
            {
                continue;
            }

            var prefix = line[..4];
            counts[prefix] = counts.GetValueOrDefault(prefix) + 1;
        }

        foreach (var recordType in RecordOrder)
        {
            counts.TryAdd(recordType, 0);
        }

        return counts;
    }

    private static int GetCount(IReadOnlyDictionary<string, int> counts, string key)
        => counts.TryGetValue(key, out var count) ? count : 0;

    private static string ComputeClosureChecksum(IEnumerable<string> lines)
    {
        var checksum = BigInteger.Zero;
        var recordIndex = 1;

        foreach (var line in lines)
        {
            var columnIndex = 1;
            foreach (var character in line)
            {
                checksum += new BigInteger(character) * recordIndex * columnIndex;
                columnIndex++;
            }

            recordIndex++;
        }

        var digits = BigInteger.Abs(checksum).ToString(CultureInfo.InvariantCulture);
        return NumericFormatter.FormatDigits(digits, ComplianceRecordSchemas.BkmvZ900.FieldLayoutByName["Checksum"].Length);
    }

    private static ComplianceExportMetadata ResolveExportMetadata(Company company)
    {
        var companyTaxId = NormalizeRequiredIsraeliTaxId(company.IsraelTaxId, "company");
        var companyIdentifierSource = string.IsNullOrWhiteSpace(company.ComplianceCompanyIdentifier)
            ? companyTaxId
            : NormalizeDigits(company.ComplianceCompanyIdentifier);

        if (companyIdentifierSource.Length == 0)
        {
            throw new InvalidOperationException("Company identifier must contain digits.");
        }

        return new ComplianceExportMetadata(
            CompanyTaxId: companyTaxId,
            CompanyIdentifier: NumericFormatter.FormatDigits(companyIdentifierSource, 8),
            SoftwareVendor: ResolveRequiredText(company.ComplianceSoftwareVendor, DefaultSoftwareVendor),
            SoftwareName: ResolveRequiredText(company.ComplianceSoftwareName, DefaultSoftwareName),
            SoftwareVersion: ResolveRequiredText(company.ComplianceSoftwareVersion, DefaultSoftwareVersion),
            LanguageCode: ResolveRequiredText(company.ComplianceLanguageCode, DefaultLanguageCode).ToUpperInvariant());
    }

    private static string ResolveRequiredText(string? value, string fallback)
    {
        return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    }

    private static string NormalizeRequiredIsraeliTaxId(string? rawTaxId, string fieldContext)
    {
        if (!IsraeliTaxIdValidator.TryNormalizeValid(rawTaxId, out var normalizedTaxId))
        {
            throw new InvalidOperationException($"Invalid Israeli Tax ID for {fieldContext}.");
        }

        return normalizedTaxId;
    }

    private static string NormalizeOptionalIsraeliTaxId(string? rawTaxId, string fieldContext)
    {
        if (string.IsNullOrWhiteSpace(rawTaxId))
        {
            return string.Empty;
        }

        return NormalizeRequiredIsraeliTaxId(rawTaxId, fieldContext);
    }

    private static string ConcatFixed(params string[] segments) => string.Concat(segments);

    private static string BuildRecord(ComplianceRecordSchema schema, IReadOnlyDictionary<string, object?> values)
    {
        var segments = new string[schema.Fields.Count];

        for (var index = 0; index < schema.Fields.Count; index++)
        {
            var field = schema.Fields[index];
            if (!values.TryGetValue(field.Name, out var value) &&
                field.Name.Equals("RecordType", StringComparison.OrdinalIgnoreCase))
            {
                value = schema.RecordType;
            }

            segments[index] = FormatFieldValue(schema, field, value);
        }

        return ConcatFixed(segments);
    }

    private static string FormatFieldValue(ComplianceRecordSchema schema, ComplianceSchemaField field, object? value)
    {
        return field.Format switch
        {
            ComplianceFieldFormat.Text => FormatTextField(schema, field, value),
            ComplianceFieldFormat.Path => FormatTextField(schema, field, value),
            ComplianceFieldFormat.Checksum => FormatChecksumField(schema, field, value),
            ComplianceFieldFormat.Numeric => FormatNumericField(schema, field, value),
            ComplianceFieldFormat.Date => FormatDateField(schema, field, value),
            ComplianceFieldFormat.Timestamp => FormatTimestampField(schema, field, value),
            ComplianceFieldFormat.Amount => FormatAmountField(schema, field, value),
            ComplianceFieldFormat.Decimal => FormatDecimalField(schema, field, value),
            _ => throw new InvalidOperationException(
                $"Unsupported field format {field.Format} in schema {schema.SchemaId}, field {field.Name}.")
        };
    }

    private static string FormatTextField(ComplianceRecordSchema schema, ComplianceSchemaField field, object? value)
    {
        var normalized = value?.ToString() ?? string.Empty;
        if (field.Required && string.IsNullOrWhiteSpace(normalized))
        {
            throw new InvalidOperationException($"Required field {schema.SchemaId}.{field.Name} is missing.");
        }

        return TextFormatter.Format(normalized, field.Length);
    }

    private static string FormatChecksumField(ComplianceRecordSchema schema, ComplianceSchemaField field, object? value)
    {
        var digits = NormalizeDigits(value);
        if (field.Required && digits.Length == 0)
        {
            throw new InvalidOperationException($"Required checksum field {schema.SchemaId}.{field.Name} is missing.");
        }

        return NumericFormatter.FormatDigits(digits, field.Length);
    }

    private static string FormatNumericField(ComplianceRecordSchema schema, ComplianceSchemaField field, object? value)
    {
        var digits = NormalizeDigits(value);
        if (field.Required && digits.Length == 0)
        {
            throw new InvalidOperationException($"Required numeric field {schema.SchemaId}.{field.Name} is missing.");
        }

        return NumericFormatter.FormatDigits(digits, field.Length);
    }

    private static string FormatDateField(ComplianceRecordSchema schema, ComplianceSchemaField field, object? value)
    {
        var date = ToNullableDateTime(value);
        if (field.Required && !date.HasValue)
        {
            throw new InvalidOperationException($"Required date field {schema.SchemaId}.{field.Name} is missing.");
        }

        return DateFormatter.Format(date);
    }

    private static string FormatTimestampField(ComplianceRecordSchema schema, ComplianceSchemaField field, object? value)
    {
        var dateTime = ToNullableDateTime(value);
        if (field.Required && !dateTime.HasValue)
        {
            throw new InvalidOperationException($"Required timestamp field {schema.SchemaId}.{field.Name} is missing.");
        }

        if (!dateTime.HasValue)
        {
            return string.Empty.PadLeft(field.Length, '0');
        }

        return DateFormatter.FormatTimestamp(dateTime.Value);
    }

    private static string FormatAmountField(ComplianceRecordSchema schema, ComplianceSchemaField field, object? value)
    {
        var amount = ToNullableDecimal(value);
        if (field.Required && !amount.HasValue)
        {
            throw new InvalidOperationException($"Required amount field {schema.SchemaId}.{field.Name} is missing.");
        }

        return AmountFormatter.FormatAmount(amount ?? 0m, field.Length);
    }

    private static string FormatDecimalField(ComplianceRecordSchema schema, ComplianceSchemaField field, object? value)
    {
        var amount = ToNullableDecimal(value);
        if (field.Required && !amount.HasValue)
        {
            throw new InvalidOperationException($"Required decimal field {schema.SchemaId}.{field.Name} is missing.");
        }

        return AmountFormatter.FormatDecimal(amount ?? 0m, field.Length, field.DecimalPlaces);
    }

    private static string NormalizeDigits(object? value)
    {
        if (value is null)
        {
            return string.Empty;
        }

        return value switch
        {
            int intValue when intValue >= 0 => intValue.ToString(CultureInfo.InvariantCulture),
            long longValue when longValue >= 0 => longValue.ToString(CultureInfo.InvariantCulture),
            short shortValue when shortValue >= 0 => shortValue.ToString(CultureInfo.InvariantCulture),
            byte byteValue => byteValue.ToString(CultureInfo.InvariantCulture),
            uint uintValue => uintValue.ToString(CultureInfo.InvariantCulture),
            ulong ulongValue => ulongValue.ToString(CultureInfo.InvariantCulture),
            string stringValue => NormalizeDigits(stringValue),
            _ => NormalizeDigits(value.ToString())
        };
    }

    private static string NormalizeDigits(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        if (value.Any(char.IsLetter))
        {
            throw new InvalidOperationException($"Numeric field contains alphabetic characters: '{value}'.");
        }

        return new string(value.Where(char.IsDigit).ToArray());
    }

    private static DateTime? ToNullableDateTime(object? value)
    {
        if (value is null)
        {
            return null;
        }

        return value switch
        {
            DateTime dateTime => dateTime,
            DateTimeOffset dateTimeOffset => dateTimeOffset.UtcDateTime,
            string stringValue when DateTime.TryParse(
                stringValue,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AllowWhiteSpaces,
                out var parsed) => parsed,
            _ => null
        };
    }

    private static decimal? ToNullableDecimal(object? value)
    {
        if (value is null)
        {
            return null;
        }

        return value switch
        {
            decimal decimalValue => decimalValue,
            int intValue => intValue,
            long longValue => longValue,
            short shortValue => shortValue,
            byte byteValue => byteValue,
            float floatValue => (decimal)floatValue,
            double doubleValue => (decimal)doubleValue,
            string stringValue when decimal.TryParse(
                stringValue,
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out var parsed) => parsed,
            _ => null
        };
    }

    private static string FormatInternalKey(int value, int width)
        => NumericFormatter.Format(value, width);

    private static string ResolveItemKey(
        InvoiceLine line,
        IReadOnlyDictionary<int, string> itemKeyById,
        IReadOnlyDictionary<string, string> itemKeyBySku)
    {
        if (line.ItemId.HasValue && itemKeyById.TryGetValue(line.ItemId.Value, out var byItemId))
        {
            return byItemId;
        }

        if (!string.IsNullOrWhiteSpace(line.ItemSku))
        {
            var sku = line.ItemSku.Trim();
            if (itemKeyBySku.TryGetValue(sku, out var bySku))
            {
                return bySku;
            }
        }

        if (line.ItemId.HasValue)
        {
            return FormatInternalKey(line.ItemId.Value, LinkFieldWidth);
        }

        return FormatInternalKey(line.Id, LinkFieldWidth);
    }

    private static void ValidateBkmvClosure(
        IReadOnlyList<string> bkmvLines,
        IReadOnlyDictionary<string, int> counts,
        int totalRecords,
        string expectedChecksum)
    {
        if (bkmvLines.Count != totalRecords)
        {
            throw new InvalidOperationException($"BKMV total record mismatch: expected {totalRecords}, actual {bkmvLines.Count}.");
        }

        var orderedCountSum = RecordOrder.Sum(recordType => GetCount(counts, recordType));
        if (orderedCountSum != totalRecords)
        {
            throw new InvalidOperationException($"BKMV record count sum mismatch: expected {totalRecords}, actual {orderedCountSum}.");
        }

        if (GetCount(counts, "Z900") != 1)
        {
            throw new InvalidOperationException("BKMV must contain exactly one Z900 closing record.");
        }

        if (bkmvLines.Count == 0 || !bkmvLines[^1].StartsWith("Z900", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("BKMV closing record must be the final Z900 line.");
        }

        var z900 = bkmvLines[^1];
        var z900Total = ParseNumericField(z900, ComplianceRecordSchemas.BkmvZ900, "TotalRecords");
        if (z900Total != totalRecords)
        {
            throw new InvalidOperationException($"BKMV Z900 total mismatch: expected {totalRecords}, actual {z900Total}.");
        }

        var z900Checksum = ReadField(z900, ComplianceRecordSchemas.BkmvZ900, "Checksum").Trim();
        if (!string.Equals(z900Checksum, expectedChecksum, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("BKMV Z900 checksum does not match the computed closure checksum.");
        }
    }

    private static void ValidateIniClosure(string iniContent, IReadOnlyDictionary<string, int> counts, int totalRecords)
    {
        var lines = iniContent
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Split('\n', StringSplitOptions.RemoveEmptyEntries);

        if (lines.Length != 2)
        {
            throw new InvalidOperationException($"INI must contain exactly 2 records. Actual: {lines.Length}.");
        }

        var a000 = lines.FirstOrDefault(line => line.StartsWith("A000", StringComparison.Ordinal));
        var z900 = lines.FirstOrDefault(line => line.StartsWith("Z900", StringComparison.Ordinal));
        if (a000 is null || z900 is null)
        {
            throw new InvalidOperationException("INI must contain one A000 and one Z900 record.");
        }

        var companyIdentifier = ReadField(a000, ComplianceRecordSchemas.A000, "CompanyIdentifier").Trim();
        var softwareVendor = ReadField(a000, ComplianceRecordSchemas.A000, "SoftwareVendor").Trim();
        var softwareName = ReadField(a000, ComplianceRecordSchemas.A000, "SoftwareName").Trim();
        var softwareVersion = ReadField(a000, ComplianceRecordSchemas.A000, "SoftwareVersion").Trim();
        var languageCode = ReadField(a000, ComplianceRecordSchemas.A000, "LanguageCode").Trim();
        var exportFolder = ReadField(a000, ComplianceRecordSchemas.A000, "ExportFolder").Trim();
        if (companyIdentifier.Length == 0 ||
            softwareVendor.Length == 0 ||
            softwareName.Length == 0 ||
            softwareVersion.Length == 0 ||
            languageCode.Length == 0 ||
            exportFolder.Length == 0)
        {
            throw new InvalidOperationException("INI A000 required fields are missing.");
        }

        var iniTotal = ParseNumericField(z900, ComplianceRecordSchemas.IniZ900, "TotalRecords");
        if (iniTotal != totalRecords)
        {
            throw new InvalidOperationException($"INI Z900 total mismatch: expected {totalRecords}, actual {iniTotal}.");
        }

        foreach (var (recordType, countFieldName) in IniCountFieldByRecordType)
        {
            var iniCount = ParseNumericField(z900, ComplianceRecordSchemas.IniZ900, countFieldName);
            var actualCount = GetCount(counts, recordType);
            if (iniCount != actualCount)
            {
                throw new InvalidOperationException($"INI Z900 count mismatch for {recordType}: expected {actualCount}, actual {iniCount}.");
            }
        }
    }

    private static string ReadField(string line, ComplianceRecordSchema schema, string fieldName)
    {
        if (!schema.FieldLayoutByName.TryGetValue(fieldName, out var layout))
        {
            throw new InvalidOperationException($"Field {fieldName} was not found in schema {schema.SchemaId}.");
        }

        var startIndex = layout.Position - 1;
        if (line.Length < startIndex + layout.Length)
        {
            throw new InvalidOperationException(
                $"Line for {schema.SchemaId} is shorter than expected while reading field {fieldName}.");
        }

        return line.Substring(startIndex, layout.Length);
    }

    private static int ParseNumericField(string line, ComplianceRecordSchema schema, string fieldName)
    {
        var rawValue = ReadField(line, schema, fieldName);
        if (!int.TryParse(rawValue, NumberStyles.None, CultureInfo.InvariantCulture, out var parsed))
        {
            throw new InvalidOperationException($"Field {schema.SchemaId}.{fieldName} must be numeric but value was '{rawValue}'.");
        }

        return parsed;
    }

    private static string EnsureRecordLength(string line, ComplianceRecordSchema schema)
    {
        if (line.Length != schema.TotalLength)
        {
            throw new InvalidOperationException(
                $"Schema validation failed for {schema.SchemaId} ({schema.RecordType}): expected length {schema.TotalLength}, actual {line.Length}.");
        }

        return line;
    }

    private sealed record ComplianceExportMetadata(
        string CompanyTaxId,
        string CompanyIdentifier,
        string SoftwareVendor,
        string SoftwareName,
        string SoftwareVersion,
        string LanguageCode);
}
