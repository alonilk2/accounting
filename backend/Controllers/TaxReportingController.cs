using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using backend.DTOs.Tax;
using backend.Services.Interfaces;
using backend.Models.Tax;

namespace backend.Controllers;

/// <summary>
/// Israeli Tax Reporting Controller
/// Handles Form 6111 generation and export for Israeli Tax Authority compliance
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TaxReportingController : ControllerBase
{
    private readonly IIsraeliTaxReportingService _taxReportingService;
    private readonly ILogger<TaxReportingController> _logger;

    public TaxReportingController(
        IIsraeliTaxReportingService taxReportingService,
        ILogger<TaxReportingController> logger)
    {
        _taxReportingService = taxReportingService;
        _logger = logger;
    }

    /// <summary>
    /// יצירת דוח מבנה אחיד (טופס 6111) לרשות המסים
    /// Generate Form 6111 (Uniform Structure) report for Israeli Tax Authority
    /// </summary>
    [HttpPost("form6111/generate")]
    public async Task<ActionResult<Form6111ResponseDto>> GenerateForm6111(
        [FromBody] Form6111RequestDto request,
        [FromHeader] int companyId = 1, // TODO: Get from JWT token
        [FromHeader] string userId = "system") // TODO: Get from JWT token
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate date range
            if (request.PeriodStartDate >= request.PeriodEndDate)
            {
                return BadRequest("תאריך התחלה חייב להיות לפני תאריך סיום");
            }

            // Validate tax year
            if (request.TaxYear < 2000 || request.TaxYear > DateTime.Now.Year + 1)
            {
                return BadRequest("שנת מס לא תקינה");
            }

            var result = await _taxReportingService.GenerateForm6111Async(request, companyId, userId);

            _logger.LogInformation("Generated Form 6111 {Form6111Id} for company {CompanyId}, tax year {TaxYear}", 
                result.Id, companyId, request.TaxYear);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Invalid request for Form 6111 generation: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating Form 6111 for company {CompanyId}", companyId);
            return StatusCode(500, "שגיאה בייצור דוח מבנה אחיד");
        }
    }

    /// <summary>
    /// קבלת רשימת דוחות מבנה אחיד קיימים
    /// Get list of existing Form 6111 reports
    /// </summary>
    [HttpGet("form6111")]
    public async Task<ActionResult<IEnumerable<Form6111ResponseDto>>> GetForm6111Reports(
        [FromQuery] int? taxYear = null,
        [FromHeader] int companyId = 1) // TODO: Get from JWT token
    {
        try
        {
            var reports = await _taxReportingService.GetForm6111ReportsAsync(companyId, taxYear);
            return Ok(reports);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Form 6111 reports for company {CompanyId}", companyId);
            return StatusCode(500, "שגיאה בקבלת דוחות מבנה אחיד");
        }
    }

    /// <summary>
    /// קבלת דוח מבנה אחיד ספציפי
    /// Get specific Form 6111 report by ID
    /// </summary>
    [HttpGet("form6111/{form6111Id}")]
    public async Task<ActionResult<Form6111ResponseDto>> GetForm6111ById(
        [FromRoute] int form6111Id,
        [FromHeader] int companyId = 1) // TODO: Get from JWT token
    {
        try
        {
            var reports = await _taxReportingService.GetForm6111ReportsAsync(companyId);
            var report = reports.FirstOrDefault(r => r.Id == form6111Id);

            if (report == null)
            {
                return NotFound($"דוח מבנה אחיד {form6111Id} לא נמצא");
            }

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Form 6111 {Form6111Id} for company {CompanyId}", form6111Id, companyId);
            return StatusCode(500, "שגיאה בקבלת דוח מבנה אחיד");
        }
    }

    /// <summary>
    /// אימות נתוני דוח מבנה אחיד
    /// Validate Form 6111 report data integrity and compliance
    /// </summary>
    [HttpPost("form6111/{form6111Id}/validate")]
    public async Task<ActionResult<Form6111ValidationResultDto>> ValidateForm6111(
        [FromRoute] int form6111Id,
        [FromHeader] int companyId = 1) // TODO: Get from JWT token
    {
        try
        {
            var validation = await _taxReportingService.ValidateForm6111Async(form6111Id, companyId);
            return Ok(validation);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Form 6111 {Form6111Id}", form6111Id);
            return StatusCode(500, "שגיאה באימות דוח מבנה אחיד");
        }
    }

    /// <summary>
    /// ייצוא דוח מבנה אחיד לקובץ
    /// Export Form 6111 report to file (JSON, XML, or TXT format)
    /// </summary>
    [HttpGet("form6111/{form6111Id}/export")]
    public async Task<IActionResult> ExportForm6111(
        [FromRoute] int form6111Id,
        [FromQuery] string format = "JSON",
        [FromHeader] int companyId = 1) // TODO: Get from JWT token
    {
        try
        {
            if (!new[] { "JSON", "XML", "TXT" }.Contains(format.ToUpper()))
            {
                return BadRequest("פורמט לא נתמך. פורמטים זמינים: JSON, XML, TXT");
            }

            var export = await _taxReportingService.ExportForm6111Async(form6111Id, companyId, format);

            var contentType = format.ToUpper() switch
            {
                "JSON" => "application/json",
                "XML" => "application/xml",
                "TXT" => "text/plain",
                _ => "application/octet-stream"
            };

            return File(export.FileContent!, contentType, export.FileName);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting Form 6111 {Form6111Id}", form6111Id);
            return StatusCode(500, "שגיאה בייצוא דוח מבנה אחיד");
        }
    }

    /// <summary>
    /// עדכון סטטוס דוח מבנה אחיד
    /// Update Form 6111 report status
    /// </summary>
    [HttpPut("form6111/{form6111Id}/status")]
    public async Task<ActionResult<Form6111ResponseDto>> UpdateForm6111Status(
        [FromRoute] int form6111Id,
        [FromBody] UpdateForm6111StatusRequest request,
        [FromHeader] int companyId = 1, // TODO: Get from JWT token
        [FromHeader] string userId = "system") // TODO: Get from JWT token
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _taxReportingService.UpdateForm6111StatusAsync(
                form6111Id, companyId, request.Status, userId);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Form 6111 status {Form6111Id}", form6111Id);
            return StatusCode(500, "שגיאה בעדכון סטטוס דוח מבנה אחיד");
        }
    }

    /// <summary>
    /// חישוב דוח רווח והפסד לתקופה
    /// Calculate Profit & Loss report for specified period
    /// </summary>
    [HttpPost("profit-loss/calculate")]
    public async Task<ActionResult<Form6111ProfitLossDto>> CalculateProfitLoss(
        [FromBody] ProfitLossCalculationRequest request,
        [FromHeader] int companyId = 1) // TODO: Get from JWT token
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _taxReportingService.CalculateProfitLossAsync(
                companyId, request.StartDate, request.EndDate);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating profit & loss for company {CompanyId}", companyId);
            return StatusCode(500, "שגיאה בחישוב דוח רווח והפסד");
        }
    }

    /// <summary>
    /// חישוב מאזן לתאריך מסוים
    /// Calculate Balance Sheet as of specific date
    /// </summary>
    [HttpPost("balance-sheet/calculate")]
    public async Task<ActionResult<Form6111BalanceSheetDto>> CalculateBalanceSheet(
        [FromBody] BalanceSheetCalculationRequest request,
        [FromHeader] int companyId = 1) // TODO: Get from JWT token
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _taxReportingService.CalculateBalanceSheetAsync(
                companyId, request.AsOfDate);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating balance sheet for company {CompanyId}", companyId);
            return StatusCode(500, "שגיאה בחישוב מאזן");
        }
    }

    /// <summary>
    /// קבלת מיפוי חשבונות לפי התקן הישראלי
    /// Get Israeli standard chart of accounts mapping
    /// </summary>
    [HttpGet("chart-of-accounts/israeli-mapping")]
    public async Task<ActionResult<Dictionary<string, string>>> GetIsraeliAccountMapping(
        [FromHeader] int companyId = 1) // TODO: Get from JWT token
    {
        try
        {
            var mapping = await _taxReportingService.GetIsraeliAccountMappingAsync(companyId);
            return Ok(mapping);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Israeli account mapping for company {CompanyId}", companyId);
            return StatusCode(500, "שגיאה בקבלת מיפוי חשבונות ישראלי");
        }
    }
}

/// <summary>
/// Request DTO for updating Form 6111 status
/// </summary>
public class UpdateForm6111StatusRequest
{
    [Required]
    public Form6111Status Status { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// Request DTO for profit & loss calculation
/// </summary>
public class ProfitLossCalculationRequest
{
    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }
}

/// <summary>
/// Request DTO for balance sheet calculation
/// </summary>
public class BalanceSheetCalculationRequest
{
    [Required]
    public DateTime AsOfDate { get; set; }
}