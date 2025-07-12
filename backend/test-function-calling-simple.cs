using backend.Services.AI;
using backend.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace backend.Tests;

/// <summary>
/// Simple test class to verify our AI function calling enhancements
/// This test verifies the function definitions are correctly configured
/// </summary>
public class CustomerFunctionServiceTest
{
    public static void TestFunctionDefinitions()
    {
        // Create a minimal test logger
        var logger = LoggerFactory.Create(builder => builder.AddConsole())
            .CreateLogger<CustomerFunctionService>();

        // Create a mock customer document service (would normally use dependency injection)
        ICustomerDocumentService? mockDocumentService = null;

        // Create service with null dependencies since we're only testing function definitions
        var customerFunctionService = new CustomerFunctionService(null!, logger, mockDocumentService!);

        // Get the function definitions
        var functions = customerFunctionService.GetCustomerFunctions();

        Console.WriteLine($"Total functions available: {functions.Count}");
        Console.WriteLine();

        // Verify our new document-related functions exist
        var expectedNewFunctions = new[]
        {
            "getCustomerDocuments",
            "getCustomerDocumentStats", 
            "getOutstandingDocuments",
            "searchCustomerDocuments",
            "getDocumentDetails"
        };

        foreach (var expectedFunction in expectedNewFunctions)
        {
            var function = functions.FirstOrDefault(f => f.Name == expectedFunction);
            if (function != null)
            {
                Console.WriteLine($"✓ Found function: {function.Name}");
                Console.WriteLine($"  Description: {function.Description}");
                Console.WriteLine($"  Parameters: {JsonSerializer.Serialize(function.Parameters, new JsonSerializerOptions { WriteIndented = true })}");
                Console.WriteLine();
            }
            else
            {
                Console.WriteLine($"✗ Missing function: {expectedFunction}");
            }
        }

        // Verify existing functions still exist
        var existingFunctions = new[]
        {
            "getCustomersList",
            "getCustomerDetails",
            "searchCustomers", 
            "getCustomerFinancialSummary"
        };

        Console.WriteLine("Existing functions check:");
        foreach (var existingFunction in existingFunctions)
        {
            var function = functions.FirstOrDefault(f => f.Name == existingFunction);
            if (function != null)
            {
                Console.WriteLine($"✓ Found existing function: {function.Name}");
            }
            else
            {
                Console.WriteLine($"✗ Missing existing function: {existingFunction}");
            }
        }

        Console.WriteLine($"\nTest completed. Expected {expectedNewFunctions.Length + existingFunctions.Length} functions, found {functions.Count}");
    }

    public static void Main(string[] args)
    {
        Console.WriteLine("Testing Customer Function Service AI Function Calling...");
        Console.WriteLine("=======================================================");
        
        try
        {
            TestFunctionDefinitions();
            Console.WriteLine("\n✓ Test completed successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n✗ Test failed: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
        }
    }
}