using Microsoft.AspNetCore.Mvc;
using backend.Services.Sales;
using backend.DTOs.Sales;

namespace backend.Controllers;

/// <summary>
/// API עבור ניהול חשבוניות מס-קבלה
/// מסמכים שמשלבים יחד חשבונית מס וקבלה, מתאימים לעסקים שמקבלים תשלום מיידי
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TaxInvoiceReceiptsController : ControllerBase
{
    private readonly ITaxInvoiceReceiptService _taxInvoiceReceiptService;

    public TaxInvoiceReceiptsController(ITaxInvoiceReceiptService taxInvoiceReceiptService)
    {
        _taxInvoiceReceiptService = taxInvoiceReceiptService;
    }

    /// <summary>
    /// קבלת רשימת חשבוניות מס-קבלה עם סינון וחיפוש
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<object>> GetTaxInvoiceReceipts(
        [FromQuery] TaxInvoiceReceiptFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // בסביבה אמיתית נקבל את companyId מה-JWT token
            int companyId = 1; // Temporary - should come from JWT claims

            var (items, totalCount) = await _taxInvoiceReceiptService.GetTaxInvoiceReceiptsAsync(
                companyId, filter, cancellationToken);

            return Ok(new
            {
                items,
                totalCount,
                page = filter.Page,
                pageSize = filter.PageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// קבלת חשבונית מס-קבלה לפי מזהה
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TaxInvoiceReceiptDto>> GetTaxInvoiceReceipt(
        int id, CancellationToken cancellationToken = default)
    {
        try
        {
            // בסביבה אמיתית נקבל את companyId מה-JWT token
            int companyId = 1; // Temporary - should come from JWT claims

            var taxInvoiceReceipt = await _taxInvoiceReceiptService.GetTaxInvoiceReceiptByIdAsync(
                id, companyId, cancellationToken);

            if (taxInvoiceReceipt == null)
            {
                return NotFound(new { error = "חשבונית מס-קבלה לא נמצאה" });
            }

            return Ok(taxInvoiceReceipt);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// יצירת חשבונית מס-קבלה חדשה
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TaxInvoiceReceiptDto>> CreateTaxInvoiceReceipt(
        [FromBody] CreateTaxInvoiceReceiptDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // בסביבה אמיתית נקבל את companyId מה-JWT token
            int companyId = 1; // Temporary - should come from JWT claims

            var taxInvoiceReceipt = await _taxInvoiceReceiptService.CreateTaxInvoiceReceiptAsync(
                dto, companyId, cancellationToken);

            return CreatedAtAction(
                nameof(GetTaxInvoiceReceipt),
                new { id = taxInvoiceReceipt.Id },
                taxInvoiceReceipt);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "שגיאה פנימית בשרת", details = ex.Message });
        }
    }

    /// <summary>
    /// עדכון חשבונית מס-קבלה
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<TaxInvoiceReceiptDto>> UpdateTaxInvoiceReceipt(
        int id,
        [FromBody] UpdateTaxInvoiceReceiptDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // בסביבה אמיתית נקבל את companyId מה-JWT token
            int companyId = 1; // Temporary - should come from JWT claims

            var taxInvoiceReceipt = await _taxInvoiceReceiptService.UpdateTaxInvoiceReceiptAsync(
                id, dto, companyId, cancellationToken);

            return Ok(taxInvoiceReceipt);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "שגיאה פנימית בשרת", details = ex.Message });
        }
    }

    /// <summary>
    /// ביטול חשבונית מס-קבלה
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult> CancelTaxInvoiceReceipt(
        int id, CancellationToken cancellationToken = default)
    {
        try
        {
            // בסביבה אמיתית נקבל את companyId מה-JWT token
            int companyId = 1; // Temporary - should come from JWT claims

            var success = await _taxInvoiceReceiptService.CancelTaxInvoiceReceiptAsync(
                id, companyId, cancellationToken);

            if (!success)
            {
                return NotFound(new { error = "חשבונית מס-קבלה לא נמצאה" });
            }

            return Ok(new { message = "חשבונית מס-קבלה בוטלה בהצלחה" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "שגיאה פנימית בשרת", details = ex.Message });
        }
    }

    /// <summary>
    /// מחיקה רכה של חשבונית מס-קבלה
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTaxInvoiceReceipt(
        int id, CancellationToken cancellationToken = default)
    {
        try
        {
            // בסביבה אמיתית נקבל את companyId מה-JWT token
            int companyId = 1; // Temporary - should come from JWT claims

            var success = await _taxInvoiceReceiptService.DeleteTaxInvoiceReceiptAsync(
                id, companyId, cancellationToken);

            if (!success)
            {
                return NotFound(new { error = "חשבונית מס-קבלה לא נמצאה" });
            }

            return Ok(new { message = "חשבונית מס-קבלה נמחקה בהצלחה" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "שגיאה פנימית בשרת", details = ex.Message });
        }
    }

    /// <summary>
    /// קבלת מספר המסמך הבא
    /// </summary>
    [HttpGet("next-document-number")]
    public async Task<ActionResult<object>> GetNextDocumentNumber(
        CancellationToken cancellationToken = default)
    {
        try
        {
            // בסביבה אמיתית נקבל את companyId מה-JWT token
            int companyId = 1; // Temporary - should come from JWT claims

            var nextNumber = await _taxInvoiceReceiptService.GenerateNextDocumentNumberAsync(
                companyId, cancellationToken);

            return Ok(new { documentNumber = nextNumber });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
