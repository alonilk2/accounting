using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs.Reports;
using backend.Models.Sales;

namespace backend.Services.Reports
{
    public interface ICustomerStatementService
    {
        Task<CustomerStatementDto> GetCustomerStatementAsync(int customerId, DateTime fromDate, DateTime toDate, int companyId, bool includeZeroBalanceTransactions = true);
    }

    public class CustomerStatementService : ICustomerStatementService
    {
        private readonly AccountingDbContext _context;

        public CustomerStatementService(AccountingDbContext context)
        {
            _context = context;
        }

        public async Task<CustomerStatementDto> GetCustomerStatementAsync(
            int customerId, 
            DateTime fromDate, 
            DateTime toDate, 
            int companyId, 
            bool includeZeroBalanceTransactions = true)
        {
            // Validate customer exists and belongs to company
            var customer = await _context.Customers
                .Where(c => c.Id == customerId && c.CompanyId == companyId)
                .FirstOrDefaultAsync();

            if (customer == null)
            {
                throw new ArgumentException($"Customer with ID {customerId} not found or doesn't belong to company");
            }

            // Calculate opening balance (all transactions before fromDate)
            var openingBalance = await CalculateOpeningBalanceAsync(customerId, fromDate, companyId);

            // Get all transactions in the date range
            var transactions = await GetCustomerTransactionsAsync(customerId, fromDate, toDate, companyId, includeZeroBalanceTransactions);

            // Calculate running balances
            var transactionsWithBalance = CalculateRunningBalances(transactions, openingBalance);

            // Calculate closing balance
            var closingBalance = transactionsWithBalance.LastOrDefault()?.Balance ?? openingBalance;

            // Generate summary
            var summary = GenerateStatementSummary(transactionsWithBalance, fromDate, toDate);

            return new CustomerStatementDto
            {
                Customer = new CustomerInfoDto
                {
                    Id = customer.Id,
                    Name = customer.Name,
                    Address = customer.Address,
                    Phone = customer.Phone,
                    Email = customer.Email,
                    TaxId = customer.TaxId
                },
                FromDate = fromDate,
                ToDate = toDate,
                OpeningBalance = openingBalance,
                ClosingBalance = closingBalance,
                Transactions = transactionsWithBalance,
                Summary = summary
            };
        }

        private async Task<decimal> CalculateOpeningBalanceAsync(int customerId, DateTime fromDate, int companyId)
        {
            var invoicesBalance = await _context.Invoices
                .Where(i => i.CustomerId == customerId && 
                           i.CompanyId == companyId && 
                           i.InvoiceDate < fromDate)
                .SumAsync(i => i.TotalAmount);

            var receiptsBalance = await _context.Receipts
                .Where(r => r.Invoice!.CustomerId == customerId && 
                           r.Invoice.CompanyId == companyId && 
                           r.PaymentDate < fromDate)
                .SumAsync(r => r.Amount);

            return invoicesBalance - receiptsBalance;
        }

        private async Task<List<CustomerTransactionDto>> GetCustomerTransactionsAsync(
            int customerId, 
            DateTime fromDate, 
            DateTime toDate, 
            int companyId,
            bool includeZeroBalanceTransactions)
        {
            var transactions = new List<CustomerTransactionDto>();

            // Get invoices
            var invoices = await _context.Invoices
                .Where(i => i.CustomerId == customerId && 
                           i.CompanyId == companyId && 
                           i.InvoiceDate >= fromDate && 
                           i.InvoiceDate <= toDate)
                .OrderBy(i => i.InvoiceDate)
                .ToListAsync();

            foreach (var invoice in invoices)
            {
                if (!includeZeroBalanceTransactions && invoice.TotalAmount == 0)
                    continue;

                transactions.Add(new CustomerTransactionDto
                {
                    Date = invoice.InvoiceDate,
                    TransactionType = "Invoice",
                    DocumentNumber = $"INV-{invoice.Id:D6}",
                    Description = $"חשבונית מס' {invoice.Id}",
                    Debit = invoice.TotalAmount,
                    Credit = 0,
                    Balance = 0, // Will be calculated later
                    Status = invoice.Status.ToString(),
                    PaymentMethod = null
                });
            }

            // Get receipts
            var receipts = await _context.Receipts
                .Include(r => r.Invoice)
                .Where(r => r.Invoice!.CustomerId == customerId && 
                           r.Invoice.CompanyId == companyId && 
                           r.PaymentDate >= fromDate && 
                           r.PaymentDate <= toDate)
                .OrderBy(r => r.PaymentDate)
                .ToListAsync();

            foreach (var receipt in receipts)
            {
                if (!includeZeroBalanceTransactions && receipt.Amount == 0)
                    continue;

                transactions.Add(new CustomerTransactionDto
                {
                    Date = receipt.PaymentDate,
                    TransactionType = "Receipt",
                    DocumentNumber = $"RCP-{receipt.Id:D6}",
                    Description = $"תשלום עבור חשבונית {receipt.InvoiceId}",
                    Debit = 0,
                    Credit = receipt.Amount,
                    Balance = 0, // Will be calculated later
                    Status = "Completed",
                    PaymentMethod = receipt.PaymentMethod
                });
            }

            // Sort all transactions by date
            return transactions.OrderBy(t => t.Date).ThenBy(t => t.TransactionType).ToList();
        }

        private List<CustomerTransactionDto> CalculateRunningBalances(
            List<CustomerTransactionDto> transactions, 
            decimal openingBalance)
        {
            decimal runningBalance = openingBalance;

            foreach (var transaction in transactions)
            {
                runningBalance += transaction.Debit - transaction.Credit;
                transaction.Balance = runningBalance;
            }

            return transactions;
        }

        private CustomerStatementSummaryDto GenerateStatementSummary(
            List<CustomerTransactionDto> transactions, 
            DateTime fromDate, 
            DateTime toDate)
        {
            var totalDebits = transactions.Sum(t => t.Debit);
            var totalCredits = transactions.Sum(t => t.Credit);
            var netChange = totalDebits - totalCredits;
            var totalTransactions = transactions.Count;
            var averageTransactionAmount = totalTransactions > 0 
                ? transactions.Sum(t => Math.Abs(t.Debit - t.Credit)) / totalTransactions 
                : 0;

            // Generate monthly activity
            var monthlyActivity = transactions
                .GroupBy(t => new { t.Date.Year, t.Date.Month })
                .Select(g => new MonthlyActivityDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM yyyy", new System.Globalization.CultureInfo("he-IL")),
                    TotalDebits = g.Sum(t => t.Debit),
                    TotalCredits = g.Sum(t => t.Credit),
                    NetAmount = g.Sum(t => t.Debit - t.Credit),
                    TransactionCount = g.Count()
                })
                .OrderBy(m => m.Year)
                .ThenBy(m => m.Month)
                .ToList();

            return new CustomerStatementSummaryDto
            {
                TotalDebits = totalDebits,
                TotalCredits = totalCredits,
                NetChange = netChange,
                TotalTransactions = totalTransactions,
                AverageTransactionAmount = averageTransactionAmount,
                MonthlyActivity = monthlyActivity
            };
        }
    }
}
