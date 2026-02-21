using System.Collections.ObjectModel;

namespace backend.Services.Compliance.Schema;

public sealed class ComplianceRecordSchema
{
    public ComplianceRecordSchema(string schemaId, string recordType, params ComplianceSchemaField[] fields)
    {
        if (string.IsNullOrWhiteSpace(schemaId))
        {
            throw new ArgumentException("SchemaId is required.", nameof(schemaId));
        }

        if (string.IsNullOrWhiteSpace(recordType))
        {
            throw new ArgumentException("RecordType is required.", nameof(recordType));
        }

        if (fields.Length == 0)
        {
            throw new ArgumentException("At least one field is required.", nameof(fields));
        }

        SchemaId = schemaId;
        RecordType = recordType;

        var runningPosition = 1;
        foreach (var field in fields)
        {
            field.Start = runningPosition;
            runningPosition += field.Length;
        }

        Fields = Array.AsReadOnly(fields);
        TotalLength = fields.Sum(f => f.Length);

        var map = new Dictionary<string, ComplianceFieldLayout>(StringComparer.OrdinalIgnoreCase);
        foreach (var field in fields)
        {
            map[field.Name] = new ComplianceFieldLayout(
                field.Start,
                field.Length,
                field.Format,
                field.Required,
                field.DecimalPlaces);
        }

        FieldLayoutByName = new ReadOnlyDictionary<string, ComplianceFieldLayout>(map);
    }

    public string SchemaId { get; }

    public string RecordType { get; }

    public int TotalLength { get; }

    public IReadOnlyList<ComplianceSchemaField> Fields { get; }

    // Internal lookup table: FieldName -> Position/Length/Format metadata.
    public IReadOnlyDictionary<string, ComplianceFieldLayout> FieldLayoutByName { get; }
}

public sealed class ComplianceSchemaField
{
    public ComplianceSchemaField(string name, int length, ComplianceFieldFormat format, bool required, int decimalPlaces = 0)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Field name is required.", nameof(name));
        }

        if (length <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(length), "Field length must be positive.");
        }

        if (decimalPlaces < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(decimalPlaces), "Decimal places cannot be negative.");
        }

        Name = name;
        Length = length;
        Format = format;
        Required = required;
        DecimalPlaces = decimalPlaces;
    }

    public string Name { get; }

    public int Length { get; }

    public ComplianceFieldFormat Format { get; }

    public bool Required { get; }

    public int DecimalPlaces { get; }

    public int Start { get; internal set; }
}

public sealed record ComplianceFieldLayout(
    int Position,
    int Length,
    ComplianceFieldFormat Format,
    bool Required,
    int DecimalPlaces);
