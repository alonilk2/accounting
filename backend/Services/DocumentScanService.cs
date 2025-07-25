using Azure;
using Azure.AI.FormRecognizer.DocumentAnalysis;
using Azure.Identity;
using Azure.Storage.Blobs;
using backend.DTOs.AI;
using backend.Models.Accounting;
using backend.Models.Suppliers;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using backend.Data;

namespace backend.Services;

/// <summary>
/// Service for scanning documents using Azure Form Recognizer and creating expenses
/// </summary>
public class DocumentScanService : IDocumentScanService
{
    private readonly DocumentAnalysisClient _formRecognizerClient;
    private readonly BlobServiceClient? _blobServiceClient;
    private readonly AccountingDbContext _context;
    private readonly IExpenseService _expenseService;
    private readonly ISupplierService _supplierService;
    private readonly ILogger<DocumentScanService> _logger;
    private readonly IConfiguration _configuration;

    public DocumentScanService(
        AccountingDbContext context,
        IExpenseService expenseService,
        ISupplierService supplierService,
        ILogger<DocumentScanService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _expenseService = expenseService;
        _supplierService = supplierService;
        _logger = logger;
        _configuration = configuration;

        // Initialize Azure Form Recognizer client with Managed Identity
        var formRecognizerEndpoint = _configuration["Azure:FormRecognizer:Endpoint"];
        if (string.IsNullOrEmpty(formRecognizerEndpoint))
        {
            throw new InvalidOperationException("Azure Form Recognizer endpoint not configured");
        }

        // Use Managed Identity for authentication in production, API key for local development
        var credential = new DefaultAzureCredential();
        _formRecognizerClient = new DocumentAnalysisClient(new Uri(formRecognizerEndpoint), credential);

        // Initialize Blob Storage client for document storage
        var storageConnectionString = _configuration.GetConnectionString("AzureStorage");
        if (!string.IsNullOrEmpty(storageConnectionString))
        {
            _blobServiceClient = new BlobServiceClient(storageConnectionString);
        }
        else
        {
            // Use Managed Identity for Blob Storage
            var storageAccountUrl = _configuration["Azure:Storage:AccountUrl"];
            if (!string.IsNullOrEmpty(storageAccountUrl))
            {
                _blobServiceClient = new BlobServiceClient(new Uri(storageAccountUrl), credential);
            }
        }
    }

    public async Task<DocumentScanResponse> ScanDocumentAsync(
        DocumentScanRequest request, 
        int companyId, 
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;
        
        try
        {
            _logger.LogInformation("Starting document scan for company {CompanyId}, file: {FileName}", 
                companyId, request.FileName);

            // Validate request
            if (string.IsNullOrEmpty(request.FileData))
            {
                return new DocumentScanResponse
                {
                    IsSuccess = false,
                    ErrorMessage = "File data is required"
                };
            }

            // Convert base64 to bytes
            byte[] fileBytes;
            try
            {
                fileBytes = Convert.FromBase64String(request.FileData);
            }
            catch (FormatException)
            {
                return new DocumentScanResponse
                {
                    IsSuccess = false,
                    ErrorMessage = "Invalid file data format"
                };
            }

            // Store document first
            string? documentUrl = null;
            if (_blobServiceClient != null)
            {
                try
                {
                    documentUrl = await StoreDocumentAsync(
                        request.FileData, 
                        request.FileName, 
                        request.ContentType, 
                        companyId, 
                        cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to store document, proceeding with scan");
                }
            }

            // Analyze document with Form Recognizer
            using var documentStream = new MemoryStream(fileBytes);
            
            // Choose appropriate model based on document type
            string modelId = request.DocumentType switch
            {
                DocumentType.Receipt => "prebuilt-receipt",
                DocumentType.Invoice => "prebuilt-invoice", 
                _ => "prebuilt-invoice" // Default to invoice model
            };

            var operation = await _formRecognizerClient.AnalyzeDocumentAsync(
                WaitUntil.Completed, 
                modelId, 
                documentStream, 
                cancellationToken: cancellationToken);

            var result = operation.Value;
            var processingTime = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;

            // Extract data from the analysis result
            var extractedData = await ExtractExpenseDataAsync(result, companyId, request.SupplierId, cancellationToken);
            
            // Calculate confidence score
            var confidenceScore = CalculateConfidenceScore(result);

            // Identify fields that need review
            var reviewRequired = IdentifyFieldsNeedingReview(extractedData, confidenceScore);

            _logger.LogInformation("Document scan completed for company {CompanyId} in {ProcessingTime}ms with confidence {ConfidenceScore}", 
                companyId, processingTime, confidenceScore);

            return new DocumentScanResponse
            {
                IsSuccess = true,
                ConfidenceScore = confidenceScore,
                ProcessingTimeMs = processingTime,
                ExtractedData = extractedData,
                DocumentUrl = documentUrl,
                ReviewRequired = reviewRequired
            };
        }
        catch (RequestFailedException ex) when (ex.Status == 400)
        {
            _logger.LogError(ex, "Form Recognizer request failed for company {CompanyId}", companyId);
            return new DocumentScanResponse
            {
                IsSuccess = false,
                ErrorMessage = "Unable to process document. Please ensure it's a valid invoice or receipt.",
                ProcessingTimeMs = (int)(DateTime.UtcNow - startTime).TotalMilliseconds
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during document scan for company {CompanyId}", companyId);
            return new DocumentScanResponse
            {
                IsSuccess = false,
                ErrorMessage = "An unexpected error occurred while processing the document.",
                ProcessingTimeMs = (int)(DateTime.UtcNow - startTime).TotalMilliseconds
            };
        }
    }

    public async Task<int> CreateExpenseFromScannedDataAsync(
        CreateExpenseFromScanRequest request, 
        int companyId, 
        string userId, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating expense from scanned data for company {CompanyId}", companyId);

            var expenseData = request.ExpenseData;
            
            // Create supplier if needed
            int? supplierId = null;
            if (expenseData.Supplier != null)
            {
                if (expenseData.Supplier.IsNewSupplier && request.CreateNewSupplier)
                {
                    supplierId = await CreateSupplierFromScannedDataAsync(
                        expenseData.Supplier, 
                        companyId, 
                        userId, 
                        cancellationToken);
                }
                else
                {
                    supplierId = expenseData.Supplier.SupplierId;
                }
            }

            // Create expense request
            // Calculate the correct net amount - if we have total and VAT rate, calculate net amount
            decimal netAmount;
            decimal vatRate = expenseData.VatRate ?? 18m;
            
            if (expenseData.NetAmount.HasValue && expenseData.NetAmount > 0)
            {
                // We have explicit net amount
                netAmount = expenseData.NetAmount.Value;
            }
            else if (expenseData.TotalAmount.HasValue && expenseData.TotalAmount > 0)
            {
                // Calculate net amount from total amount
                netAmount = Math.Round(expenseData.TotalAmount.Value / (1 + (vatRate / 100)), 2);
            }
            else
            {
                netAmount = 0;
            }

            var createExpenseRequest = new backend.DTOs.Accounting.CreateExpenseDto
            {
                ExpenseDate = expenseData.DocumentDate ?? DateTime.Today,
                SupplierId = supplierId,
                SupplierName = expenseData.Supplier?.Name,
                Category = (backend.Models.Accounting.ExpenseCategory)(expenseData.SuggestedCategory ?? 1), // Default category
                Description = expenseData.Description ?? "Scanned document",
                DescriptionHebrew = expenseData.DescriptionHebrew,
                Amount = netAmount, // Always use net amount - ExpenseService will calculate total
                VatRate = vatRate,
                Currency = expenseData.Currency ?? "ILS",
                PaymentMethod = expenseData.PaymentMethod,
                ReceiptNumber = expenseData.DocumentNumber,
                Status = expenseData.Status.HasValue 
                    ? (backend.Models.Accounting.ExpenseStatus)expenseData.Status.Value 
                    : backend.Models.Accounting.ExpenseStatus.Draft, // Default to Draft if not specified
                Notes = request.ReviewNotes,
                IsTaxDeductible = true // Default for business expenses
            };

            _logger.LogInformation("Creating expense from scanned data - NetAmount: {NetAmount}, VATRate: {VatRate}, TotalCalculated: {TotalCalculated}", 
                netAmount, vatRate, netAmount * (1 + (vatRate / 100)));

            // Create the expense
            var expense = await _expenseService.CreateExpenseAsync(createExpenseRequest, companyId, userId, cancellationToken);

            // Update with attachment if available
            if (!string.IsNullOrEmpty(request.DocumentUrl))
            {
                await UpdateExpenseAttachmentAsync(expense.Id, request.DocumentUrl, companyId, cancellationToken);
            }

            _logger.LogInformation("Created expense {ExpenseId} from scanned data for company {CompanyId}", 
                expense.Id, companyId);

            return expense.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create expense from scanned data for company {CompanyId}", companyId);
            throw;
        }
    }

    public async Task<string> StoreDocumentAsync(
        string fileData, 
        string fileName, 
        string contentType, 
        int companyId, 
        CancellationToken cancellationToken = default)
    {
        if (_blobServiceClient == null)
        {
            throw new InvalidOperationException("Blob storage not configured");
        }

        try
        {
            var containerName = "scanned-documents";
            var blobContainer = _blobServiceClient.GetBlobContainerClient(containerName);
            
            // Ensure container exists
            await blobContainer.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

            // Generate unique blob name
            var fileExtension = Path.GetExtension(fileName);
            var blobName = $"company-{companyId}/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}{fileExtension}";

            var blobClient = blobContainer.GetBlobClient(blobName);
            
            // Convert base64 to bytes and upload
            var fileBytes = Convert.FromBase64String(fileData);
            using var stream = new MemoryStream(fileBytes);
            
            await blobClient.UploadAsync(
                stream, 
                new Azure.Storage.Blobs.Models.BlobHttpHeaders { ContentType = contentType },
                cancellationToken: cancellationToken);

            _logger.LogInformation("Stored document {BlobName} for company {CompanyId}", blobName, companyId);
            
            return blobClient.Uri.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to store document for company {CompanyId}", companyId);
            throw;
        }
    }

    private async Task<ScannedExpenseData> ExtractExpenseDataAsync(
        AnalyzeResult result, 
        int companyId, 
        int? supplierId, 
        CancellationToken cancellationToken)
    {
        var extractedData = new ScannedExpenseData();

        // Extract data from Form Recognizer result
        foreach (var document in result.Documents)
        {
            // Extract supplier information
            extractedData.Supplier = await ExtractSupplierInfoAsync(document, companyId, supplierId, cancellationToken);
            
            // Extract document details
            extractedData.DocumentDate = GetFieldValue<DateTime?>(document, "InvoiceDate") ?? 
                                        GetFieldValue<DateTime?>(document, "TransactionDate");
            
            extractedData.DocumentNumber = GetFieldValue<string>(document, "InvoiceId") ?? 
                                          GetFieldValue<string>(document, "ReceiptNumber");
            
            extractedData.TotalAmount = GetFieldValue<decimal?>(document, "InvoiceTotal") ?? 
                                       GetFieldValue<decimal?>(document, "TotalPrice");
            
            extractedData.NetAmount = GetFieldValue<decimal?>(document, "SubTotal");
            extractedData.VatAmount = GetFieldValue<decimal?>(document, "TotalTax");
            
            // Calculate VAT rate if amounts are available
            if (extractedData.NetAmount > 0 && extractedData.VatAmount > 0)
            {
                extractedData.VatRate = Math.Round((extractedData.VatAmount.Value / extractedData.NetAmount.Value) * 100, 2);
            }
            
            // Set currency (default to ILS for Israeli businesses)
            extractedData.Currency = "ILS";
            
            // Extract line items
            extractedData.LineItems = ExtractLineItems(document);
            
            // Generate description from available data
            extractedData.Description = GenerateDescription(document);
            
            // Suggest expense category based on content
            extractedData.SuggestedCategory = SuggestExpenseCategory(extractedData.Description, extractedData.Supplier?.Name);
        }

        return extractedData;
    }

    private async Task<SupplierInfo> ExtractSupplierInfoAsync(
        AnalyzedDocument document, 
        int companyId, 
        int? knownSupplierId, 
        CancellationToken cancellationToken)
    {
        var supplierInfo = new SupplierInfo();

        // Extract supplier name
        supplierInfo.Name = GetFieldValue<string>(document, "VendorName") ?? 
                           GetFieldValue<string>(document, "MerchantName");

        // Extract supplier tax ID
        supplierInfo.TaxId = GetFieldValue<string>(document, "VendorTaxId");

        // Extract supplier address
        supplierInfo.Address = GetFieldValue<string>(document, "VendorAddress") ?? 
                              GetFieldValue<string>(document, "MerchantAddress");

        // Try to match with existing supplier
        if (knownSupplierId.HasValue)
        {
            supplierInfo.SupplierId = knownSupplierId.Value;
            supplierInfo.IsNewSupplier = false;
        }
        else if (!string.IsNullOrEmpty(supplierInfo.Name) || !string.IsNullOrEmpty(supplierInfo.TaxId))
        {
            var existingSupplier = await FindExistingSupplierAsync(supplierInfo, companyId, cancellationToken);
            if (existingSupplier != null)
            {
                supplierInfo.SupplierId = existingSupplier.Id;
                supplierInfo.IsNewSupplier = false;
                // Update with complete info from database
                supplierInfo.Name = existingSupplier.Name;
                supplierInfo.TaxId = existingSupplier.TaxId;
                supplierInfo.Address = existingSupplier.Address;
                supplierInfo.Phone = existingSupplier.Phone;
            }
            else
            {
                supplierInfo.IsNewSupplier = true;
            }
        }

        return supplierInfo;
    }

    private T? GetFieldValue<T>(AnalyzedDocument document, string fieldName)
    {
        if (document.Fields.TryGetValue(fieldName, out var field) && field.Content != null)
        {
            try
            {
                if (typeof(T) == typeof(string))
                {
                    return (T)(object)field.Content;
                }
                else if (typeof(T) == typeof(decimal?) || typeof(T) == typeof(decimal))
                {
                    if (field.Value != null)
                    {
                        var doubleValue = GetNumericFieldValue(field.Value);
                        if (doubleValue != 0.0)
                        {
                            return (T)(object)(decimal)doubleValue;
                        }
                    }
                }
                else if (typeof(T) == typeof(DateTime?) || typeof(T) == typeof(DateTime))
                {
                    if (field.Value != null)
                    {
                        var dateValue = field.Value.AsDate();
                        if (dateValue != DateTimeOffset.MinValue) // AsDate() returns MinValue if parsing fails
                        {
                            return (T)(object)dateValue.DateTime;
                        }
                    }
                }
            }
            catch
            {
                // Field exists but couldn't be converted
            }
        }
        
        return default(T);
    }

    private List<ScannedLineItem> ExtractLineItems(AnalyzedDocument document)
    {
        var lineItems = new List<ScannedLineItem>();

        if (document.Fields.TryGetValue("Items", out var itemsField) && itemsField.Value != null)
        {
            var items = itemsField.Value.AsList();
            foreach (var item in items)
            {
                var lineItem = new ScannedLineItem();
                var itemDocument = item.Value.AsDictionary();

                if (itemDocument.TryGetValue("Description", out var desc))
                    lineItem.Description = desc.Content;
                
                if (itemDocument.TryGetValue("Quantity", out var qty) && qty.Value != null)
                {
                    var qtyValue = GetNumericFieldValue(qty.Value);
                    if (qtyValue != 0.0)
                        lineItem.Quantity = (decimal)qtyValue;
                }
                
                if (itemDocument.TryGetValue("UnitPrice", out var price) && price.Value != null)
                {
                    var priceValue = GetNumericFieldValue(price.Value);
                    if (priceValue != 0.0)
                        lineItem.UnitPrice = (decimal)priceValue;
                }
                
                if (itemDocument.TryGetValue("Amount", out var amount) && amount.Value != null)
                {
                    var amountValue = GetNumericFieldValue(amount.Value);
                    if (amountValue != 0.0)
                        lineItem.Total = (decimal)amountValue;
                }

                lineItems.Add(lineItem);
            }
        }

        return lineItems;
    }

    /// <summary>
    /// Helper method to safely extract numeric values from DocumentFieldValue
    /// Handles both Double and Currency field types
    /// </summary>
    private double GetNumericFieldValue(DocumentFieldValue fieldValue)
    {
        try
        {
            // Try Currency type first (common for financial documents)
            try
            {
                var currencyValue = fieldValue.AsCurrency();
                return currencyValue.Amount;
            }
            catch { }
            
            // Try Double type
            try
            {
                return fieldValue.AsDouble();
            }
            catch { }
            
            // Try Int64 type
            try
            {
                return (double)fieldValue.AsInt64();
            }
            catch { }
            
            // Try parsing as string if other types fail
            try
            {
                var stringValue = fieldValue.AsString();
                if (double.TryParse(stringValue, out var parsedValue))
                {
                    return parsedValue;
                }
            }
            catch { }
            
            return 0.0;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to extract numeric value from field");
            return 0.0;
        }
    }

    private string GenerateDescription(AnalyzedDocument document)
    {
        var vendorName = GetFieldValue<string>(document, "VendorName") ?? 
                        GetFieldValue<string>(document, "MerchantName");
        
        var invoiceId = GetFieldValue<string>(document, "InvoiceId") ?? 
                       GetFieldValue<string>(document, "ReceiptNumber");

        if (!string.IsNullOrEmpty(vendorName) && !string.IsNullOrEmpty(invoiceId))
        {
            return $"{vendorName} - {invoiceId}";
        }
        else if (!string.IsNullOrEmpty(vendorName))
        {
            return vendorName;
        }
        else if (!string.IsNullOrEmpty(invoiceId))
        {
            return $"Invoice {invoiceId}";
        }
        
        return "Scanned document";
    }

    private int SuggestExpenseCategory(string? description, string? supplierName)
    {
        // Simple category suggestion based on keywords
        var content = $"{description} {supplierName}".ToLowerInvariant();
        
        if (content.Contains("fuel") || content.Contains("gas") || content.Contains("דלק"))
            return 3; // Travel & Transportation
        
        if (content.Contains("office") || content.Contains("supplies") || content.Contains("משרד"))
            return 2; // Office Supplies
        
        if (content.Contains("food") || content.Contains("meal") || content.Contains("restaurant") || content.Contains("אוכל"))
            return 4; // Meals & Entertainment
        
        if (content.Contains("software") || content.Contains("subscription") || content.Contains("תוכנה"))
            return 7; // Software & Technology
        
        return 1; // General Business Expense (default)
    }

    private async Task<Supplier?> FindExistingSupplierAsync(
        SupplierInfo supplierInfo, 
        int companyId, 
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(supplierInfo.TaxId))
        {
            return await _context.Suppliers
                .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.TaxId == supplierInfo.TaxId, cancellationToken);
        }
        
        if (!string.IsNullOrEmpty(supplierInfo.Name))
        {
            return await _context.Suppliers
                .FirstOrDefaultAsync(s => s.CompanyId == companyId && 
                                        s.Name.ToLower().Contains(supplierInfo.Name.ToLower()), cancellationToken);
        }

        return null;
    }

    private async Task<int> CreateSupplierFromScannedDataAsync(
        SupplierInfo supplierInfo, 
        int companyId, 
        string userId, 
        CancellationToken cancellationToken)
    {
        var supplier = new Supplier
        {
            CompanyId = companyId,
            Name = supplierInfo.Name ?? "Unknown Supplier",
            TaxId = supplierInfo.TaxId,
            Address = supplierInfo.Address,
            Phone = supplierInfo.Phone,
            IsActive = true,
            PaymentTermsDays = 30, // Default payment terms
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync(cancellationToken);
        
        return supplier.Id;
    }

    private async Task UpdateExpenseAttachmentAsync(
        int expenseId, 
        string documentUrl, 
        int companyId, 
        CancellationToken cancellationToken)
    {
        var expense = await _context.Expenses
            .FirstOrDefaultAsync(e => e.Id == expenseId && e.CompanyId == companyId, cancellationToken);
        
        if (expense != null)
        {
            expense.AttachmentPath = documentUrl;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    private decimal CalculateConfidenceScore(AnalyzeResult result)
    {
        if (!result.Documents.Any())
            return 0m;

        var totalConfidence = 0.0;
        var fieldCount = 0;

        foreach (var document in result.Documents)
        {
            foreach (var field in document.Fields.Values)
            {
                if (field.Confidence.HasValue)
                {
                    totalConfidence += field.Confidence.Value;
                    fieldCount++;
                }
            }
        }

        return fieldCount > 0 ? (decimal)(totalConfidence / fieldCount) : 0m;
    }

    private List<string> IdentifyFieldsNeedingReview(ScannedExpenseData data, decimal confidenceScore)
    {
        var reviewRequired = new List<string>();

        if (confidenceScore < 0.7m)
            reviewRequired.Add("Overall confidence is low - please review all fields");

        if (data.TotalAmount == null || data.TotalAmount <= 0)
            reviewRequired.Add("Amount");

        if (data.DocumentDate == null)
            reviewRequired.Add("Date");

        if (data.Supplier?.IsNewSupplier == true)
            reviewRequired.Add("Supplier");

        if (string.IsNullOrEmpty(data.Description))
            reviewRequired.Add("Description");

        return reviewRequired;
    }
}
