using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Reports
{
    public class CustomerStatementRequestDto
    {
        [Required]
        public int CustomerId { get; set; }

        [Required]
        public DateTime FromDate { get; set; }

        [Required]
        public DateTime ToDate { get; set; }

        public bool IncludeZeroBalanceTransactions { get; set; } = true;
    }

    public class CustomerStatementDto
    {
        public CustomerInfoDto Customer { get; set; } = null!;
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public decimal OpeningBalance { get; set; }
        public decimal ClosingBalance { get; set; }
        public List<CustomerTransactionDto> Transactions { get; set; } = new();
        public CustomerStatementSummaryDto Summary { get; set; } = null!;
    }

    public class CustomerInfoDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? TaxId { get; set; }
    }

    public class CustomerTransactionDto
    {
        public DateTime Date { get; set; }
        public string TransactionType { get; set; } = null!; // "Invoice", "Receipt", "Credit Note"
        public string DocumentNumber { get; set; } = null!;
        public string Description { get; set; } = null!;
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public decimal Balance { get; set; }
        public string? PaymentMethod { get; set; }
        public string Status { get; set; } = null!;
    }

    public class CustomerStatementSummaryDto
    {
        public decimal TotalDebits { get; set; }
        public decimal TotalCredits { get; set; }
        public decimal NetChange { get; set; }
        public int TotalTransactions { get; set; }
        public decimal AverageTransactionAmount { get; set; }
        public List<MonthlyActivityDto> MonthlyActivity { get; set; } = new();
    }

    public class MonthlyActivityDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = null!;
        public decimal TotalDebits { get; set; }
        public decimal TotalCredits { get; set; }
        public decimal NetAmount { get; set; }
        public int TransactionCount { get; set; }
    }
}
