using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ChangeReceiptRelationFromSalesOrderToInvoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Add new InvoiceId column to Receipts table
            migrationBuilder.AddColumn<int>(
                name: "InvoiceId",
                table: "Receipts",
                type: "int",
                nullable: true);

            // Step 2: Add Currency column to Receipts table
            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Receipts",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "ILS");

            // Step 3: Add ReferenceNumber column to Receipts table
            migrationBuilder.AddColumn<string>(
                name: "ReferenceNumber",
                table: "Receipts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            // Step 4: Update existing receipts to point to invoices
            // This assumes there's a 1:1 or 1:many relationship between SalesOrder and Invoice
            migrationBuilder.Sql(@"
                UPDATE r 
                SET r.InvoiceId = i.Id
                FROM Receipts r
                INNER JOIN Invoices i ON r.SalesOrderId = i.SalesOrderId
                WHERE r.InvoiceId IS NULL AND i.Id IS NOT NULL
            ");

            // Step 5: For receipts that don't have corresponding invoices, we need to create invoices
            // This is a complex operation that might need manual handling based on business logic
            migrationBuilder.Sql(@"
                -- Create invoices for sales orders that have receipts but no invoices
                INSERT INTO Invoices (
                    CompanyId, CustomerId, SalesOrderId, InvoiceNumber, InvoiceDate, 
                    DueDate, Status, SubtotalAmount, TaxAmount, TotalAmount, PaidAmount, 
                    Currency, CustomerName, CustomerAddress, CustomerTaxId, CustomerContact,
                    CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
                )
                SELECT DISTINCT
                    so.CompanyId,
                    so.CustomerId,
                    so.Id as SalesOrderId,
                    'INV-' + CAST(YEAR(GETDATE()) AS VARCHAR) + '-' + RIGHT('0000' + CAST(ROW_NUMBER() OVER (ORDER BY so.Id) + ISNULL(
                        (SELECT MAX(CAST(RIGHT(InvoiceNumber, 4) AS INT)) 
                         FROM Invoices 
                         WHERE InvoiceNumber LIKE 'INV-' + CAST(YEAR(GETDATE()) AS VARCHAR) + '-%'), 0) AS VARCHAR), 4) as InvoiceNumber,
                    so.OrderDate as InvoiceDate,
                    DATEADD(day, 30, so.OrderDate) as DueDate,
                    CASE 
                        WHEN so.PaidAmount >= so.TotalAmount THEN 3 -- Paid
                        WHEN so.PaidAmount > 0 THEN 2 -- Sent (partially paid)
                        ELSE 1 -- Draft
                    END as Status,
                    so.SubtotalAmount,
                    so.TaxAmount,
                    so.TotalAmount,
                    so.PaidAmount,
                    so.Currency,
                    c.Name as CustomerName,
                    c.Address as CustomerAddress,
                    c.TaxId as CustomerTaxId,
                    c.Contact as CustomerContact,
                    so.CreatedAt,
                    so.UpdatedAt,
                    so.CreatedBy,
                    so.UpdatedBy
                FROM SalesOrders so
                INNER JOIN Customers c ON so.CustomerId = c.Id
                INNER JOIN Receipts r ON so.Id = r.SalesOrderId
                WHERE NOT EXISTS (
                    SELECT 1 FROM Invoices i WHERE i.SalesOrderId = so.Id
                )
            ");

            // Step 6: Update receipts to point to the newly created invoices
            migrationBuilder.Sql(@"
                UPDATE r 
                SET r.InvoiceId = i.Id
                FROM Receipts r
                INNER JOIN Invoices i ON r.SalesOrderId = i.SalesOrderId
                WHERE r.InvoiceId IS NULL
            ");

            // Step 7: Create invoice lines for the new invoices based on sales order lines
            migrationBuilder.Sql(@"
                INSERT INTO InvoiceLines (
                    InvoiceId, ItemId, LineNumber, Description, ItemSku,
                    Quantity, UnitPrice, DiscountPercent, TaxRate, TaxAmount, LineTotal
                )
                SELECT 
                    i.Id as InvoiceId,
                    sol.ItemId,
                    sol.LineNumber,
                    sol.Description,
                    it.SKU as ItemSku,
                    sol.Quantity,
                    sol.UnitPrice,
                    sol.DiscountPercent,
                    sol.TaxRate,
                    sol.TaxAmount,
                    sol.LineTotal
                FROM Invoices i
                INNER JOIN SalesOrderLines sol ON i.SalesOrderId = sol.SalesOrderId
                LEFT JOIN Items it ON sol.ItemId = it.Id
                WHERE NOT EXISTS (
                    SELECT 1 FROM InvoiceLines il WHERE il.InvoiceId = i.Id
                )
            ");

            // Step 8: Make InvoiceId required and drop SalesOrderId
            migrationBuilder.AlterColumn<int>(
                name: "InvoiceId",
                table: "Receipts",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            // Step 9: Drop the foreign key constraint for SalesOrderId
            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_SalesOrders_SalesOrderId",
                table: "Receipts");

            // Step 10: Drop the SalesOrderId column
            migrationBuilder.DropColumn(
                name: "SalesOrderId",
                table: "Receipts");

            // Step 11: Create foreign key constraint for InvoiceId
            migrationBuilder.CreateIndex(
                name: "IX_Receipts_InvoiceId",
                table: "Receipts",
                column: "InvoiceId");

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
            // Drop the new foreign key
            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_Invoices_InvoiceId",
                table: "Receipts");

            migrationBuilder.DropIndex(
                name: "IX_Receipts_InvoiceId",
                table: "Receipts");

            // Add back SalesOrderId column
            migrationBuilder.AddColumn<int>(
                name: "SalesOrderId",
                table: "Receipts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // Restore data to SalesOrderId from InvoiceId via Invoice.SalesOrderId
            migrationBuilder.Sql(@"
                UPDATE r 
                SET r.SalesOrderId = i.SalesOrderId
                FROM Receipts r
                INNER JOIN Invoices i ON r.InvoiceId = i.Id
                WHERE i.SalesOrderId IS NOT NULL
            ");

            // Drop new columns
            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "ReferenceNumber",
                table: "Receipts");

            // Recreate the old foreign key
            migrationBuilder.CreateIndex(
                name: "IX_Receipts_SalesOrderId",
                table: "Receipts",
                column: "SalesOrderId");

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
