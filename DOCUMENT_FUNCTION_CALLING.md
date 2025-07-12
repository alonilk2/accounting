# Customer Document AI Function Calling Features

## Overview

Enhanced the AI Assistant with 5 new function calling capabilities to retrieve and analyze customer document information. These functions integrate with the existing CustomerDocumentService to provide comprehensive document access through natural language queries.

## New Functions Added

### 1. getCustomerDocuments
**Purpose**: Get all documents for a customer with optional filtering
**Parameters**:
- `CustomerId` (required): Customer ID
- `CompanyId` (required): Company ID for multi-tenant security
- `FromDate` (optional): Start date filter (YYYY-MM-DD format)
- `ToDate` (optional): End date filter (YYYY-MM-DD format)  
- `DocumentType` (optional): Filter by type (SalesOrder, Invoice, Receipt, POSSale)

**Sample Usage**: "Get all documents for customer ID 1" or "Show me all invoices for customer 5 from January 2025"

### 2. getCustomerDocumentStats
**Purpose**: Get statistical summary of customer documents
**Parameters**:
- `CustomerId` (required): Customer ID
- `CompanyId` (required): Company ID

**Returns**: Count and totals for sales orders, invoices, receipts, outstanding balances, etc.
**Sample Usage**: "Show me document statistics for customer ID 1"

### 3. getOutstandingDocuments
**Purpose**: Get unpaid invoices and incomplete sales orders
**Parameters**:
- `CustomerId` (required): Customer ID
- `CompanyId` (required): Company ID

**Returns**: Lists of unpaid invoices (Sent/Overdue status) and incomplete sales orders
**Sample Usage**: "What outstanding documents does customer ID 1 have?"

### 4. searchCustomerDocuments
**Purpose**: Search customer documents by content
**Parameters**:
- `CustomerId` (required): Customer ID
- `CompanyId` (required): Company ID
- `SearchTerm` (required): Search term (document number, amount, description)

**Sample Usage**: "Search for documents containing 'INV-001' for customer ID 1"

### 5. getDocumentDetails
**Purpose**: Get detailed information about a specific document
**Parameters**:
- `DocumentId` (required): Document ID
- `DocumentType` (required): Document type (SalesOrder, Invoice, Receipt)
- `CompanyId` (required): Company ID

**Returns**: Complete document details including line items
**Sample Usage**: "Get details for invoice ID 1"

## Technical Implementation

### Architecture
- **Service**: CustomerFunctionService (extended existing service)
- **Dependencies**: ICustomerDocumentService (reuses existing document logic)
- **Security**: Multi-tenant filtering on all queries using CompanyId
- **Error Handling**: Comprehensive validation and Hebrew error messages

### Function Registration
Functions are automatically registered in the AI Assistant's function calling system:

```csharp
public List<FunctionDefinition> GetCustomerFunctions()
{
    // Returns all 9 functions (4 existing + 5 new)
}
```

### Execution Flow
1. AI Assistant receives natural language query
2. OpenAI determines appropriate function to call
3. Function parameters extracted from user intent
4. CustomerFunctionService routes to appropriate method
5. Business logic executed with security filtering
6. Results returned in structured JSON format
7. AI Assistant presents results in natural Hebrew

## Usage Examples

### Natural Language Queries
- "תראה לי את כל המסמכים של לקוח מספר 1" (Show me all documents for customer 1)
- "איזה חשבוניות לא שולמו עבור הלקוח הזה?" (Which invoices are unpaid for this customer?)
- "חפש מסמכים עם המספר INV-2025-001" (Search for documents with number INV-2025-001)
- "תן לי סטטיסטיקות על המסמכים של הלקוח" (Give me statistics on the customer's documents)

### Response Format
All functions return structured JSON with Hebrew descriptions:
```json
{
  "functionName": "getCustomerDocuments",
  "isSuccess": true,
  "result": "מסמכי הלקוח [CustomerName] (5 מסמכים, סה״כ: ₪1,250.00):\n{...}"
}
```

## Security Features

### Multi-Tenant Isolation
- All queries filtered by `CompanyId`
- No cross-tenant data access possible
- Consistent with existing security architecture

### Input Validation
- Required parameters validation
- Date format validation
- Document type validation
- SQL injection prevention through EF Core

## Integration with Existing Features

### Reuses Existing Services
- **CustomerDocumentService**: For document retrieval and statistics
- **DbContext**: For direct database queries where needed
- **Existing Models**: SalesOrder, Invoice, Receipt entities

### Maintains Consistency
- Same error handling patterns
- Same Hebrew localization
- Same JSON serialization settings
- Same logging patterns

## Testing

### Manual Testing
Use the provided `test-ai-documents.http` file to test the AI Assistant endpoints with various document-related queries.

### Expected Function Count
Total functions available: 9
- 4 existing customer functions
- 5 new document functions

## Benefits

1. **Enhanced User Experience**: Natural language document queries
2. **Comprehensive Document Access**: All document types supported
3. **Flexible Filtering**: Date ranges, document types, search terms
4. **Multi-Language Support**: Hebrew descriptions and responses
5. **Secure Multi-Tenancy**: Company-level data isolation
6. **Minimal Code Impact**: Extends existing architecture patterns