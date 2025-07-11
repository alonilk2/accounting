using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FixReceiptInvoiceRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_SalesOrders_SalesOrderId",
                table: "Receipts");

            migrationBuilder.RenameColumn(
                name: "SalesOrderId",
                table: "Receipts",
                newName: "InvoiceId");

            migrationBuilder.RenameIndex(
                name: "IX_Receipts_SalesOrderId",
                table: "Receipts",
                newName: "IX_Receipts_InvoiceId");

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Receipts",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_Invoices_InvoiceId",
                table: "Receipts",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_Invoices_InvoiceId",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Receipts");

            migrationBuilder.RenameColumn(
                name: "InvoiceId",
                table: "Receipts",
                newName: "SalesOrderId");

            migrationBuilder.RenameIndex(
                name: "IX_Receipts_InvoiceId",
                table: "Receipts",
                newName: "IX_Receipts_SalesOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_SalesOrders_SalesOrderId",
                table: "Receipts",
                column: "SalesOrderId",
                principalTable: "SalesOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
