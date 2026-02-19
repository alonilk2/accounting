using System.Globalization;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Models.Accounting;
using backend.Models.Core;
using backend.Models.Inventory;
using backend.Models.Sales;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Compliance;

/// <summary>
/// Creates Israeli Tax Authority unified-format exports (INI.TXT + BKMVDATA.TXT) in a ZIP package.
/// </summary>
public sealed class ComplianceExportService : IComplianceExportService
{
    private const string LineBreak = "\r\n";
    private static readonly string[] RecordOrder = ["A100", "B100", "B110", "C100", "D110", "D120", "M100", "Z900"];

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
        var companyIdentifier = NormalizeCompanyIdentifier(company, companyId);
        var exportFolder = $"OPENFRMT/{companyIdentifier}.{generatedAt:MMddHHmm}/";

        var accountsTask = _context.ChartOfAccounts
            .AsNoTracking()
            .Where(a => a.CompanyId == companyId && a.IsActive)
            .OrderBy(a => a.AccountNumber)
            .ThenBy(a => a.Id)
            .ToListAsync(cancellationToken);

        var journalEntriesTask = _context.JournalEntries
            .AsNoTracking()
            .Include(j => j.Account)
            .Where(j => j.CompanyId == companyId &&
                        j.TransactionDate.Date >= normalizedStart &&
                        j.TransactionDate.Date <= normalizedEnd)
            .OrderBy(j => j.TransactionDate)
            .ThenBy(j => j.SequenceNumber)
            .ThenBy(j => j.Id)
            .ToListAsync(cancellationToken);

        var invoicesTask = _context.Invoices
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

        var receiptsTask = _context.Receipts
            .AsNoTracking()
            .Include(r => r.Invoice)
            .Where(r => r.CompanyId == companyId &&
                        r.PaymentDate.Date >= normalizedStart &&
                        r.PaymentDate.Date <= normalizedEnd)
            .OrderBy(r => r.PaymentDate)
            .ThenBy(r => r.ReceiptNumber)
            .ThenBy(r => r.Id)
            .ToListAsync(cancellationToken);

        var itemsTask = _context.Items
            .AsNoTracking()
            .Where(i => i.CompanyId == companyId && i.IsActive)
            .OrderBy(i => i.SKU)
            .ThenBy(i => i.Id)
            .ToListAsync(cancellationToken);

        await Task.WhenAll(accountsTask, journalEntriesTask, invoicesTask, receiptsTask, itemsTask);

        var accounts = accountsTask.Result;
        var journalEntries = journalEntriesTask.Result;
        var invoices = invoicesTask.Result;
        var receipts = receiptsTask.Result;
        var items = itemsTask.Result;

        var bkmvLines = BuildBkmvLines(
            company,
            companyIdentifier,
            userId,
            normalizedStart,
            normalizedEnd,
            generatedAt,
            accounts,
            journalEntries,
            invoices,
            receipts,
            items);

        var recordCounts = CountRecords(bkmvLines);
        var checksum = ComputeChecksum(bkmvLines);
        var totalRecords = bkmvLines.Count + 1;
        bkmvLines.Add(BuildZ900(totalRecords, checksum, generatedAt));
        recordCounts = CountRecords(bkmvLines);

        var bkmvContent = string.Join(LineBreak, bkmvLines) + LineBreak;
        var iniContent = BuildIniContent(companyIdentifier, normalizedStart, normalizedEnd, generatedAt, exportFolder, recordCounts, totalRecords);
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
            DownloadFileName = $"OPENFRMT_{companyIdentifier}_{generatedAt:yyyyMMddHHmm}.zip",
            FolderPath = exportFolder,
            IniContent = iniContent,
            BkmvDataContent = bkmvContent,
            ExportLogContent = logContent,
            RecordCounts = recordCounts
        };
    }

    private static List<string> BuildBkmvLines(
        Company company,
        string companyIdentifier,
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
        var lines = new List<string>
        {
            BuildA100(company, companyIdentifier, userId, startDate, endDate, generatedAt)
        };

        lines.AddRange(journalEntries.Select(BuildB100));
        lines.AddRange(accounts.Select(BuildB110));
        lines.AddRange(invoices.Select(BuildC100));

        foreach (var invoice in invoices)
        {
            foreach (var line in invoice.Lines.OrderBy(l => l.LineNumber).ThenBy(l => l.Id))
            {
                lines.Add(BuildD110(invoice, line));
            }
        }

        lines.AddRange(receipts.Select(BuildD120));
        lines.AddRange(items.Select(BuildM100));

        return lines;
    }

    private static string BuildA100(Company company, string companyIdentifier, string userId, DateTime startDate, DateTime endDate, DateTime generatedAt)
    {
        return ConcatFixed(
            FixedText("A100", 4),
            FixedText(OnlyDigits(company.IsraelTaxId), 15),
            FixedText(company.Name, 50),
            FixedDate(startDate),
            FixedDate(endDate),
            FixedTimestamp(generatedAt),
            FixedText(userId, 20),
            FixedText(company.Currency, 3),
            FixedText(companyIdentifier, 8));
    }

    private static string BuildB100(JournalEntry entry)
    {
        return ConcatFixed(
            FixedText("B100", 4),
            FixedText(entry.TransactionNumber, 20),
            FixedDate(entry.TransactionDate),
            FixedText(entry.Account?.AccountNumber ?? string.Empty, 20),
            FixedText(entry.Description, 60),
            FixedAmount(entry.DebitAmount, 15),
            FixedAmount(entry.CreditAmount, 15),
            FixedText(entry.ReferenceType, 10),
            FixedNumber(entry.ReferenceId, 10));
    }

    private static string BuildB110(ChartOfAccount account)
    {
        return ConcatFixed(
            FixedText("B110", 4),
            FixedText(account.AccountNumber, 20),
            FixedText(account.Name, 50),
            FixedText(account.Type.ToString(), 10),
            FixedText(account.IsActive ? "Y" : "N", 1),
            FixedNumber(account.ParentAccountId, 20),
            FixedAmount(account.CurrentBalance, 15));
    }

    private static string BuildC100(Invoice invoice)
    {
        return ConcatFixed(
            FixedText("C100", 4),
            FixedText(invoice.InvoiceNumber, 20),
            FixedDate(invoice.InvoiceDate),
            FixedText(OnlyDigits(invoice.CustomerTaxId), 15),
            FixedText(invoice.CustomerName, 50),
            FixedAmount(invoice.SubtotalAmount, 15),
            FixedAmount(invoice.TaxAmount, 15),
            FixedAmount(invoice.TotalAmount, 15),
            FixedText(invoice.Currency, 3),
            FixedDate(invoice.DueDate));
    }

    private static string BuildD110(Invoice invoice, InvoiceLine line)
    {
        return ConcatFixed(
            FixedText("D110", 4),
            FixedText(invoice.InvoiceNumber, 20),
            FixedNumber(line.LineNumber, 5),
            FixedText(line.ItemSku, 20),
            FixedText(line.Description, 50),
            FixedDecimal(line.Quantity, 15, 3),
            FixedAmount(line.UnitPrice, 15),
            FixedDecimal(line.TaxRate, 7, 2),
            FixedAmount(line.TaxAmount, 15),
            FixedAmount(line.LineTotal, 15));
    }

    private static string BuildD120(Receipt receipt)
    {
        return ConcatFixed(
            FixedText("D120", 4),
            FixedText(receipt.ReceiptNumber, 20),
            FixedDate(receipt.PaymentDate),
            FixedText(receipt.Invoice?.InvoiceNumber, 20),
            FixedAmount(receipt.Amount, 15),
            FixedText(receipt.PaymentMethod, 20),
            FixedText(receipt.ReferenceNumber, 30),
            FixedText(receipt.Currency, 3));
    }

    private static string BuildM100(Item item)
    {
        return ConcatFixed(
            FixedText("M100", 4),
            FixedText(item.SKU, 20),
            FixedText(item.Name, 50),
            FixedText(item.Category, 30),
            FixedText(item.Unit, 10),
            FixedDecimal(item.CurrentStockQty, 15, 3),
            FixedAmount(item.SellPrice, 15),
            FixedAmount(item.CostPrice, 15),
            FixedText(item.IsActive ? "Y" : "N", 1));
    }

    private static string BuildZ900(int totalRecords, string checksum, DateTime generatedAt)
    {
        return ConcatFixed(
            FixedText("Z900", 4),
            FixedNumber(totalRecords, 10),
            FixedText(checksum, 64),
            FixedTimestamp(generatedAt));
    }

    private static string BuildIniContent(
        string companyIdentifier,
        DateTime startDate,
        DateTime endDate,
        DateTime generatedAt,
        string exportFolder,
        IReadOnlyDictionary<string, int> counts,
        int totalRecords)
    {
        var a000 = ConcatFixed(
            FixedText("A000", 4),
            FixedText(companyIdentifier, 8),
            FixedDate(startDate),
            FixedDate(endDate),
            FixedTimestamp(generatedAt),
            FixedText(exportFolder, 40));

        var z900 = ConcatFixed(
            FixedText("Z900", 4),
            FixedNumber(totalRecords, 10),
            FixedNumber(GetCount(counts, "A100"), 8),
            FixedNumber(GetCount(counts, "B100"), 8),
            FixedNumber(GetCount(counts, "B110"), 8),
            FixedNumber(GetCount(counts, "C100"), 8),
            FixedNumber(GetCount(counts, "D110"), 8),
            FixedNumber(GetCount(counts, "D120"), 8),
            FixedNumber(GetCount(counts, "M100"), 8),
            FixedNumber(GetCount(counts, "Z900"), 8));

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
        using var writer = new StreamWriter(stream, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
        writer.Write(content);
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

    private static string ComputeChecksum(IEnumerable<string> lines)
    {
        var payload = string.Join("\n", lines);
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash);
    }

    private static string NormalizeCompanyIdentifier(Company company, int companyId)
    {
        var digits = OnlyDigits(company.IsraelTaxId);
        if (digits.Length == 0)
        {
            digits = companyId.ToString(CultureInfo.InvariantCulture);
        }

        if (digits.Length > 8)
        {
            digits = digits[^8..];
        }

        return digits.PadLeft(8, '0');
    }

    private static string FixedText(string? value, int width)
    {
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

    private static string FixedNumber(int? value, int width)
    {
        if (!value.HasValue)
        {
            return string.Empty.PadLeft(width, '0');
        }

        return FixedNumber(value.Value, width);
    }

    private static string FixedNumber(int value, int width)
    {
        var normalized = Math.Max(0, value).ToString(CultureInfo.InvariantCulture);
        if (normalized.Length > width)
        {
            normalized = normalized[^width..];
        }

        return normalized.PadLeft(width, '0');
    }

    private static string FixedDate(DateTime? value)
        => value.HasValue ? value.Value.ToString("yyyyMMdd", CultureInfo.InvariantCulture) : "00000000";

    private static string FixedTimestamp(DateTime value)
        => value.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture);

    private static string FixedAmount(decimal value, int width)
        => FixedDecimal(value, width, 2);

    private static string FixedDecimal(decimal value, int width, int decimals)
    {
        var normalized = value.ToString($"F{decimals}", CultureInfo.InvariantCulture);
        if (normalized.Length > width)
        {
            normalized = normalized[^width..];
        }

        return normalized.PadLeft(width, ' ');
    }

    private static string ConcatFixed(params string[] segments) => string.Concat(segments);

    private static string OnlyDigits(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return new string(value.Where(char.IsDigit).ToArray());
    }
}

