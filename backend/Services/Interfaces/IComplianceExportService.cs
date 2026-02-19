namespace backend.Services.Interfaces;

/// <summary>
/// Contract for unified-format compliance export (INI.TXT + BKMVDATA.TXT).
/// </summary>
public interface IComplianceExportService
{
    Task<UnifiedFormatExportArtifact> ExportUnifiedFormatAsync(
        int companyId,
        string userId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Export artifact returned by compliance export service.
/// </summary>
public sealed class UnifiedFormatExportArtifact
{
    public required byte[] ZipContent { get; init; }
    public required string DownloadFileName { get; init; }
    public required string FolderPath { get; init; }
    public required string IniContent { get; init; }
    public required string BkmvDataContent { get; init; }
    public required string ExportLogContent { get; init; }
    public required IReadOnlyDictionary<string, int> RecordCounts { get; init; }
}

