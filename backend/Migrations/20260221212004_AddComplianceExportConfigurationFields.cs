using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddComplianceExportConfigurationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ComplianceCompanyIdentifier",
                table: "Companies",
                type: "nvarchar(8)",
                maxLength: 8,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ComplianceLanguageCode",
                table: "Companies",
                type: "nvarchar(2)",
                maxLength: 2,
                nullable: false,
                defaultValue: "HE");

            migrationBuilder.AddColumn<string>(
                name: "ComplianceSoftwareName",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "UnifiedFormatExporter");

            migrationBuilder.AddColumn<string>(
                name: "ComplianceSoftwareVendor",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "AccountingSaaS");

            migrationBuilder.AddColumn<string>(
                name: "ComplianceSoftwareVersion",
                table: "Companies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "1.0.0");

            migrationBuilder.CreateTable(
                name: "Form6111Reports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TaxYear = table.Column<int>(type: "int", nullable: false),
                    PeriodStartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PeriodEndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GeneratedBy = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ProfitLossData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TaxAdjustmentData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BalanceSheetData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DataHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    CompanyId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Form6111Reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Form6111Reports_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Form6111Reports_CompanyId",
                table: "Form6111Reports",
                column: "CompanyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Form6111Reports");

            migrationBuilder.DropColumn(
                name: "ComplianceCompanyIdentifier",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "ComplianceLanguageCode",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "ComplianceSoftwareName",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "ComplianceSoftwareVendor",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "ComplianceSoftwareVersion",
                table: "Companies");
        }
    }
}
