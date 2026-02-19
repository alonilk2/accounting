using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Compliance;

/// <summary>
/// Request DTO for Israeli Tax Authority unified format export.
/// </summary>
public sealed class UnifiedFormatExportRequestDto
{
    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }
}

