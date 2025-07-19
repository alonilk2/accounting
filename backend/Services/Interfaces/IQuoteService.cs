using backend.Models.Sales;
using backend.DTOs.Sales;
using backend.DTOs.Shared;

namespace backend.Services.Interfaces;

/// <summary>
/// Interface for Quote Service
/// Handles quote operations with multi-tenant support
/// </summary>
public interface IQuoteService : IBaseService<Quote>
{
    Task<PaginatedResponse<QuoteDto>> GetQuotesAsync(int companyId, int? customerId = null, QuoteStatus? status = null, 
        DateTime? fromDate = null, DateTime? toDate = null, string? searchTerm = null, 
        int page = 1, int pageSize = 50, CancellationToken cancellationToken = default);

    Task<QuoteDto?> GetQuoteAsync(int id, int companyId, CancellationToken cancellationToken = default);

    Task<QuoteDto> CreateQuoteAsync(CreateQuoteRequest request, int companyId, CancellationToken cancellationToken = default);

    Task<QuoteDto> UpdateQuoteAsync(int id, CreateQuoteRequest request, int companyId, CancellationToken cancellationToken = default);

    Task<QuoteDto> UpdateQuoteStatusAsync(int id, QuoteStatus status, int companyId, CancellationToken cancellationToken = default);

    Task<bool> DeleteQuoteAsync(int id, int companyId, CancellationToken cancellationToken = default);

    Task<QuoteDto> DuplicateQuoteAsync(int id, int companyId, CancellationToken cancellationToken = default);

    Task<int> ConvertToSalesOrderAsync(int id, ConvertQuoteToOrderRequest request, int companyId, CancellationToken cancellationToken = default);

    Task<string> GenerateQuoteNumberAsync(int companyId, CancellationToken cancellationToken = default);

    Task<decimal[]> CalculateQuoteTotalsAsync(List<CreateQuoteLineRequest> lines, CancellationToken cancellationToken = default);
}
