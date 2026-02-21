using System.Security.Claims;
using backend.DTOs.Compliance;
using backend.Services.Interfaces;
using backend.Services.Core;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

/// <summary>
/// Unified format export controller for Israeli Tax Authority compliance.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class ComplianceController : ControllerBase
{
    private readonly IComplianceExportService _complianceExportService;
    private readonly ICompanyService _companyService;
    private readonly ILogger<ComplianceController> _logger;

    public ComplianceController(
        IComplianceExportService complianceExportService,
        ICompanyService companyService,
        ILogger<ComplianceController> logger)
    {
        _complianceExportService = complianceExportService;
        _companyService = companyService;
        _logger = logger;
    }

    /// <summary>
    /// Exports Israeli unified format package (INI.TXT + BKMVDATA.TXT).
    /// </summary>
    [HttpPost("export")]
    public async Task<IActionResult> ExportUnifiedFormat(
        [FromBody] UnifiedFormatExportRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var startDate = request.StartDate.Date;
        var endDate = request.EndDate.Date;

        if (startDate > endDate)
        {
            return BadRequest("StartDate must be on or before EndDate.");
        }

        if ((endDate - startDate).TotalDays > 366)
        {
            return BadRequest("Date range must not exceed 366 days.");
        }

        if (!TryResolveRequestContext(out var companyId, out var userId, out var failureResult))
        {
            return failureResult!;
        }

        var evaluation = await _companyService.EvaluateFeatureAccessAsync(
            companyId,
            FeatureEntitlements.DoubleEntryAccountingFeature,
            cancellationToken);
        if (!evaluation.HasAccess)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                error = "feature_access_denied",
                reason = evaluation.Reason,
                reasonCode = evaluation.ReasonCode,
                feature = evaluation.Feature,
                currentPlan = evaluation.CurrentPlan,
                upgradePath = evaluation.UpgradePath
            });
        }

        try
        {
            var artifact = await _complianceExportService.ExportUnifiedFormatAsync(
                companyId,
                userId,
                startDate,
                endDate,
                cancellationToken);

            return File(artifact.ZipContent, "application/zip", artifact.DownloadFileName);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Export request failed because company was not found.");
            return NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Export request failed validation.");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while exporting unified format.");
            return StatusCode(StatusCodes.Status500InternalServerError, "Failed to export unified format package.");
        }
    }

    private bool TryResolveRequestContext(out int companyId, out string userId, out IActionResult? failureResult)
    {
        companyId = 0;
        userId = string.Empty;

        var companyClaim = User.FindFirstValue("companyId")
                           ?? User.FindFirstValue("company_id")
                           ?? User.FindFirstValue("tenant_id");

        var companyHeader = Request.Headers["X-Company-Id"].FirstOrDefault()
                            ?? Request.Headers["companyId"].FirstOrDefault();

        if (!TryParsePositiveInt(companyClaim, out companyId) &&
            !TryParsePositiveInt(companyHeader, out companyId))
        {
            failureResult = BadRequest("Missing company context. Provide companyId claim or X-Company-Id header.");
            return false;
        }

        userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? User.FindFirstValue("sub")
                 ?? User.FindFirstValue("user_id")
                 ?? Request.Headers["X-User-Id"].FirstOrDefault()
                 ?? Request.Headers["userId"].FirstOrDefault()
                 ?? string.Empty;

        if (string.IsNullOrWhiteSpace(userId))
        {
            failureResult = BadRequest("Missing user context. Provide user identifier claim or X-User-Id header.");
            return false;
        }

        failureResult = null;
        return true;
    }

    private static bool TryParsePositiveInt(string? value, out int parsed)
    {
        if (int.TryParse(value, out parsed) && parsed > 0)
        {
            return true;
        }

        parsed = 0;
        return false;
    }
}
