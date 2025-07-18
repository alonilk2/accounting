using Microsoft.AspNetCore.Mvc;
using backend.DTOs.Reports;
using backend.Services.Reports;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly ICustomerStatementService _customerStatementService;

        public ReportsController(ICustomerStatementService customerStatementService)
        {
            _customerStatementService = customerStatementService;
        }

        /// <summary>
        /// יצירת כרטסת לקוח עם כל התנועות בטווח תאריכים
        /// </summary>
        [HttpPost("customer-statement")]
        public async Task<ActionResult<CustomerStatementDto>> GetCustomerStatement(
            [FromBody] CustomerStatementRequestDto request,
            [FromHeader] int companyId = 1) // TODO: Get from JWT token
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Validate date range
                if (request.FromDate > request.ToDate)
                {
                    return BadRequest("תאריך התחלה חייב להיות לפני תאריך סיום");
                }

                // Validate date range is not too long (max 2 years)
                if ((request.ToDate - request.FromDate).TotalDays > 730)
                {
                    return BadRequest("טווח התאריכים לא יכול להיות יותר משנתיים");
                }

                var statement = await _customerStatementService.GetCustomerStatementAsync(
                    request.CustomerId, 
                    request.FromDate, 
                    request.ToDate, 
                    companyId,
                    request.IncludeZeroBalanceTransactions);

                return Ok(statement);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                // Log the exception here
                // TODO: Add proper logging
                Console.WriteLine($"Error in customer statement: {ex.Message}");
                return StatusCode(500, "שגיאה פנימית בשרת");
            }
        }

        /// <summary>
        /// קבלת כרטסת לקוח עם פרמטרים של GET
        /// </summary>
        [HttpGet("customer-statement/{customerId}")]
        public async Task<ActionResult<CustomerStatementDto>> GetCustomerStatementByParams(
            [FromRoute] int customerId,
            [FromQuery, Required] DateTime fromDate,
            [FromQuery, Required] DateTime toDate,
            [FromQuery] bool includeZeroBalanceTransactions = true,
            [FromHeader] int companyId = 1) // TODO: Get from JWT token
        {
            var request = new CustomerStatementRequestDto
            {
                CustomerId = customerId,
                FromDate = fromDate,
                ToDate = toDate,
                IncludeZeroBalanceTransactions = includeZeroBalanceTransactions
            };

            return await GetCustomerStatement(request, companyId);
        }
    }
}
