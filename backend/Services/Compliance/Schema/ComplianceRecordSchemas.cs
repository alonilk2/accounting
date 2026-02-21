namespace backend.Services.Compliance.Schema;

public static class ComplianceRecordSchemas
{
    public static readonly ComplianceRecordSchema A000 = new(
        schemaId: "INI_A000",
        recordType: "A000",
        new ComplianceSchemaField("RecordType", 4, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("CompanyIdentifier", 8, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("StartDate", 8, ComplianceFieldFormat.Date, true),
        new ComplianceSchemaField("EndDate", 8, ComplianceFieldFormat.Date, true),
        new ComplianceSchemaField("GeneratedAt", 14, ComplianceFieldFormat.Timestamp, true),
        new ComplianceSchemaField("SoftwareVendor", 20, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("SoftwareName", 30, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("SoftwareVersion", 10, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("LanguageCode", 2, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("ExportFolder", 40, ComplianceFieldFormat.Path, true));

    public static readonly ComplianceRecordSchema A100 = new(
        schemaId: "BKMV_A100",
        recordType: "A100",
        new ComplianceSchemaField("RecordType", 4, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("CompanyTaxId", 15, ComplianceFieldFormat.Numeric, true),
        new ComplianceSchemaField("CompanyName", 50, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("StartDate", 8, ComplianceFieldFormat.Date, true),
        new ComplianceSchemaField("EndDate", 8, ComplianceFieldFormat.Date, true),
        new ComplianceSchemaField("GeneratedAt", 14, ComplianceFieldFormat.Timestamp, true),
        new ComplianceSchemaField("SoftwareVendor", 20, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("SoftwareName", 30, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("SoftwareVersion", 10, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("LanguageCode", 2, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("UserId", 20, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("Currency", 3, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("CompanyIdentifier", 8, ComplianceFieldFormat.Numeric, true));

    public static readonly ComplianceRecordSchema B100 = new(
        schemaId: "BKMV_B100",
        recordType: "B100",
        new ComplianceSchemaField("RecordType", 4, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("TransactionNumber", 20, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("TransactionDate", 8, ComplianceFieldFormat.Date, true),
        new ComplianceSchemaField("AccountNumber", 20, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("Description", 60, ComplianceFieldFormat.Text, false),
        new ComplianceSchemaField("DebitAmount", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2),
        new ComplianceSchemaField("CreditAmount", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2),
        new ComplianceSchemaField("ReferenceType", 10, ComplianceFieldFormat.Text, false),
        new ComplianceSchemaField("ReferenceId", 10, ComplianceFieldFormat.Numeric, false));

    public static readonly ComplianceRecordSchema B110 = new(
        schemaId: "BKMV_B110",
        recordType: "B110",
        new ComplianceSchemaField("RecordType", 4, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("AccountNumber", 20, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("AccountName", 50, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("AccountType", 10, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("IsActive", 1, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("ParentAccountId", 20, ComplianceFieldFormat.Numeric, false),
        new ComplianceSchemaField("CurrentBalance", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2));

    public static readonly ComplianceRecordSchema C100 = new(
        schemaId: "BKMV_C100",
        recordType: "C100",
        new ComplianceSchemaField("RecordType", 4, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("InvoiceNumber", 20, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("InvoiceDate", 8, ComplianceFieldFormat.Date, true),
        new ComplianceSchemaField("CustomerTaxId", 15, ComplianceFieldFormat.Numeric, false),
        new ComplianceSchemaField("CustomerName", 50, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("SubtotalAmount", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2),
        new ComplianceSchemaField("TaxAmount", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2),
        new ComplianceSchemaField("TotalAmount", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2),
        new ComplianceSchemaField("Currency", 3, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("DueDate", 8, ComplianceFieldFormat.Date, false));

    public static readonly ComplianceRecordSchema D110 = new(
        schemaId: "BKMV_D110",
        recordType: "D110",
        new ComplianceSchemaField("RecordType", 4, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("InvoiceNumber", 20, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("LineNumber", 5, ComplianceFieldFormat.Numeric, true),
        new ComplianceSchemaField("ItemSku", 20, ComplianceFieldFormat.Text, false),
        new ComplianceSchemaField("Description", 50, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("Quantity", 15, ComplianceFieldFormat.Decimal, true, decimalPlaces: 3),
        new ComplianceSchemaField("UnitPrice", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2),
        new ComplianceSchemaField("TaxRate", 7, ComplianceFieldFormat.Decimal, true, decimalPlaces: 2),
        new ComplianceSchemaField("TaxAmount", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2),
        new ComplianceSchemaField("LineTotal", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2));

    public static readonly ComplianceRecordSchema D120 = new(
        schemaId: "BKMV_D120",
        recordType: "D120",
        new ComplianceSchemaField("RecordType", 4, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("ReceiptNumber", 20, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("PaymentDate", 8, ComplianceFieldFormat.Date, true),
        new ComplianceSchemaField("InvoiceNumber", 20, ComplianceFieldFormat.Text, false),
        new ComplianceSchemaField("Amount", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2),
        new ComplianceSchemaField("PaymentMethod", 20, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("ReferenceNumber", 30, ComplianceFieldFormat.Text, false),
        new ComplianceSchemaField("Currency", 3, ComplianceFieldFormat.Text, true));

    public static readonly ComplianceRecordSchema M100 = new(
        schemaId: "BKMV_M100",
        recordType: "M100",
        new ComplianceSchemaField("RecordType", 4, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("ItemSku", 20, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("ItemName", 50, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("Category", 30, ComplianceFieldFormat.Text, false),
        new ComplianceSchemaField("Unit", 10, ComplianceFieldFormat.Text, false),
        new ComplianceSchemaField("CurrentStockQty", 15, ComplianceFieldFormat.Decimal, true, decimalPlaces: 3),
        new ComplianceSchemaField("SellPrice", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2),
        new ComplianceSchemaField("CostPrice", 15, ComplianceFieldFormat.Amount, true, decimalPlaces: 2),
        new ComplianceSchemaField("IsActive", 1, ComplianceFieldFormat.Text, true));

    public static readonly ComplianceRecordSchema BkmvZ900 = new(
        schemaId: "BKMV_Z900",
        recordType: "Z900",
        new ComplianceSchemaField("RecordType", 4, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("TotalRecords", 10, ComplianceFieldFormat.Numeric, true),
        new ComplianceSchemaField("Checksum", 64, ComplianceFieldFormat.Checksum, true),
        new ComplianceSchemaField("GeneratedAt", 14, ComplianceFieldFormat.Timestamp, true));

    public static readonly ComplianceRecordSchema IniZ900 = new(
        schemaId: "INI_Z900",
        recordType: "Z900",
        new ComplianceSchemaField("RecordType", 4, ComplianceFieldFormat.Text, true),
        new ComplianceSchemaField("TotalRecords", 10, ComplianceFieldFormat.Numeric, true),
        new ComplianceSchemaField("CountA100", 8, ComplianceFieldFormat.Numeric, true),
        new ComplianceSchemaField("CountB100", 8, ComplianceFieldFormat.Numeric, true),
        new ComplianceSchemaField("CountB110", 8, ComplianceFieldFormat.Numeric, true),
        new ComplianceSchemaField("CountC100", 8, ComplianceFieldFormat.Numeric, true),
        new ComplianceSchemaField("CountD110", 8, ComplianceFieldFormat.Numeric, true),
        new ComplianceSchemaField("CountD120", 8, ComplianceFieldFormat.Numeric, true),
        new ComplianceSchemaField("CountM100", 8, ComplianceFieldFormat.Numeric, true),
        new ComplianceSchemaField("CountZ900", 8, ComplianceFieldFormat.Numeric, true));

    public static readonly IReadOnlyDictionary<string, ComplianceRecordSchema> BkmvByRecordType =
        new Dictionary<string, ComplianceRecordSchema>(StringComparer.Ordinal)
        {
            [A100.RecordType] = A100,
            [B100.RecordType] = B100,
            [B110.RecordType] = B110,
            [C100.RecordType] = C100,
            [D110.RecordType] = D110,
            [D120.RecordType] = D120,
            [M100.RecordType] = M100,
            [BkmvZ900.RecordType] = BkmvZ900
        };

    public static readonly IReadOnlyDictionary<string, ComplianceRecordSchema> AllBySchemaId =
        new Dictionary<string, ComplianceRecordSchema>(StringComparer.Ordinal)
        {
            [A000.SchemaId] = A000,
            [A100.SchemaId] = A100,
            [B100.SchemaId] = B100,
            [B110.SchemaId] = B110,
            [C100.SchemaId] = C100,
            [D110.SchemaId] = D110,
            [D120.SchemaId] = D120,
            [M100.SchemaId] = M100,
            [BkmvZ900.SchemaId] = BkmvZ900,
            [IniZ900.SchemaId] = IniZ900
        };
}
