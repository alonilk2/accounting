using backend.DTOs.Tax;

namespace backend.Services.Interfaces;

/// <summary>
/// Interface for Israeli Tax Reporting Service
/// Handles Form 6111 generation and validation for Tax Authority compliance
/// </summary>
public interface IIsraeliTaxReportingService
{
    /// <summary>
    /// Generate Form 6111 report for specified period
    /// </summary>
    Task<Form6111ResponseDto> GenerateForm6111Async(
        Form6111RequestDto request, 
        int companyId, 
        string userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validate Form 6111 data integrity and compliance
    /// </summary>
    Task<Form6111ValidationResultDto> ValidateForm6111Async(
        int form6111Id, 
        int companyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Export Form 6111 in specified format (JSON, XML, TXT)
    /// </summary>
    Task<Form6111ExportDto> ExportForm6111Async(
        int form6111Id, 
        int companyId, 
        string format = "JSON",
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get existing Form 6111 reports for company
    /// </summary>
    Task<IEnumerable<Form6111ResponseDto>> GetForm6111ReportsAsync(
        int companyId, 
        int? taxYear = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate profit & loss for specified period
    /// </summary>
    Task<Form6111ProfitLossDto> CalculateProfitLossAsync(
        int companyId, 
        DateTime startDate, 
        DateTime endDate,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate balance sheet as of specified date
    /// </summary>
    Task<Form6111BalanceSheetDto> CalculateBalanceSheetAsync(
        int companyId, 
        DateTime asOfDate,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate tax adjustments
    /// </summary>
    Task<Form6111TaxAdjustmentDto> CalculateTaxAdjustmentsAsync(
        int companyId, 
        decimal accountingProfit, 
        DateTime startDate, 
        DateTime endDate,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get Israeli standard chart of accounts mapping
    /// </summary>
    Task<Dictionary<string, string>> GetIsraeliAccountMappingAsync(
        int companyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update Form 6111 status
    /// </summary>
    Task<Form6111ResponseDto> UpdateForm6111StatusAsync(
        int form6111Id, 
        int companyId, 
        Models.Tax.Form6111Status status, 
        string userId,
        CancellationToken cancellationToken = default);
}