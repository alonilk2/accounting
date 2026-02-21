# Progress Report

## Date
- 2026-02-21

## Scope
- Unified format remediation backlog (`docs/plans/unified-format-remediation-backlog.md`)
- Completed:
  - Epic 1, Item 1.1 (Rigid record schema definition)
  - Epic 1, Item 1.2 (Dedicated formatters)
  - Epic 1, Item 1.3 (Encoding + line-ending standardization in ZIP entries)
  - Epic 2, Item 2.1 (INI `A000`/`Z900` required-field + closure/count integrity)
  - Epic 2, Item 2.2 (Record builders rewrite for `A100/B100/B110/C100/D110/D120/M100/Z900`)
  - Epic 2, Item 2.3 (Closure checksum + closing-record alignment with export logic)
  - Epic 4, Item 4.1 (Company/system configuration fields for `A000`/`A100` with defaults)
  - Epic 4, Item 4.2 (Strict Israeli tax-ID check-digit validation + fallback hardening)

## Completed Work
- Added schema infrastructure under `backend/Services/Compliance/Schema/`:
  - `ComplianceFieldFormat.cs`
  - `ComplianceRecordSchema.cs`
  - `ComplianceRecordSchemas.cs`
- Defined record schemas for all required record types:
  - `A000`, `A100`, `B100`, `B110`, `C100`, `D110`, `D120`, `M100`, `Z900`
  - Includes both `INI_Z900` and `BKMV_Z900`
- Added internal field mapping table:
  - Field name -> position/length/format/required metadata (`FieldLayoutByName`)
- Integrated schema length validation into export generation:
  - Every emitted line is validated against the expected schema length
  - Validation wired into `ComplianceExportService`
- Extended tests to verify:
  - All generated BKMV lines match schema lengths
  - INI lines (`A000`, `Z900`) match schema lengths
  - Required schema set is fully defined
- Added dedicated formatters under `backend/Services/Compliance/Formatting/`:
  - `TextFormatter.cs`
  - `NumericFormatter.cs`
  - `DateFormatter.cs`
  - `AmountFormatter.cs`
- Refactored `ComplianceExportService` to use formatter layer instead of inline `Fixed*` helpers.
- Added strict numeric validation for string-backed numeric fields:
  - Export now throws when alphabetic characters are present in numeric fields.
- Added formatter unit tests in:
  - `backend/tests/Backend.Tests/Compliance/ComplianceFieldFormatterTests.cs`
- Updated compliance golden files for strict numeric-field formatting + checksum changes.
- Standardized ZIP entry writing in `ComplianceExportService.AddZipEntry`:
  - Forces UTF-8 encoding without BOM
  - Normalizes all line endings to CRLF before writing bytes
- Added byte-level regression checks in:
  - `backend/tests/Backend.Tests/Compliance/ComplianceExportServiceTests.cs`
  - Verifies exported `INI.TXT`, `BKMVDATA.TXT`, `EXPORT.LOG` bytes match golden content encoded as UTF-8 (no BOM) with CRLF line endings
  - Verifies no UTF-8 BOM is present and no lone LF/CR line endings exist in ZIP entry bytes
- Reworked `ComplianceExportService` record builders to be schema-driven:
  - Introduced a centralized `BuildRecord` path that formats values by schema field type (`Text/Numeric/Date/Timestamp/Amount/Decimal/Checksum/Path`)
  - Added required-field enforcement per schema field during record construction
- Switched record linkage fields from prefixed business strings to internal numeric keys:
  - `B100.TransactionNumber` now uses internal journal entry id key
  - `C100`/`D110`/`D120` now share internal invoice id link keys
  - `D120.ReceiptNumber` now uses internal receipt id key
  - `M100.ItemSku` and `D110.ItemSku` now use internal item id link keys
  - Removed `INV-`/`REC-`/`SKU-` prefixed values from emitted BKMV linkage fields
- Added parent-child integrity enforcement in export generation:
  - Export now fails if a `D120` receipt references an invoice that is missing from exported `C100` headers
- Replaced generic SHA256 hash closure with deterministic numeric closure checksum logic for `BKMV Z900`.
- Added explicit closure validation before packaging:
  - `BKMV Z900` must be final record, record totals must match, and checksum must match computed closure
  - `INI Z900` totals/counts are validated against actual emitted BKMV record counts
- Updated compliance golden files for Epic 2 output changes:
  - `expected_bkmvdata.txt`
  - `expected_export_log.txt`
- Expanded compliance integration tests to cover Epic 2 behavior:
  - Asserts numeric linkage keys and `C100`/`D110`/`D120` key consistency
  - Asserts checksum field shape in `Z900`
  - Asserts export throws when a receipt points to a non-exported invoice header
- Added company-level unified-format configuration fields in `backend/Models/Core/Company.cs`:
  - `ComplianceCompanyIdentifier`
  - `ComplianceSoftwareVendor`
  - `ComplianceSoftwareName`
  - `ComplianceSoftwareVersion`
  - `ComplianceLanguageCode`
- Added EF migration for the new compliance configuration columns:
  - `backend/Migrations/20260221212004_AddComplianceExportConfigurationFields.cs`
- Expanded `A000` and `A100` schemas to include required software metadata and language fields.
- Wired export metadata into `ComplianceExportService`:
  - `A000` and `A100` now emit software vendor/name/version + language from company configuration
  - Missing values are defaulted to non-empty system defaults to keep required export fields populated
- Added strict Israeli tax-ID validation to export:
  - Company tax ID must pass official 9-digit check-digit validation (no fallback to company id)
  - Optional invoice customer tax ID now fails export when provided with invalid check digit
- Centralized Israeli tax-ID algorithm in:
  - `backend/Services/Core/IsraeliTaxIdValidator.cs`
  - Reused by `CompanyService.ValidateTaxIdAsync`
- Updated compliance golden files for Epic 4 output changes:
  - `expected_ini.txt`
  - `expected_bkmvdata.txt`
  - `expected_export_log.txt`
- Expanded compliance integration tests for Epic 4:
  - Asserts configured software metadata is present in `A000` and `A100`
  - Asserts export throws on invalid company tax-ID check digit

## Verification
- Ran:
  - `dotnet test backend/tests/Backend.Tests/Backend.Tests.csproj --filter Compliance --nologo`
- Result:
  - Passed: 15
  - Failed: 0
  - Skipped: 0

## Next Suggested Step
- Epic 5, Item 5.1: improve compliance export API responses to return structured pre-export validation errors to frontend clients.
