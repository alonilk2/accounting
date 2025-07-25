using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddBankTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Agents_Companies_CompanyId",
                table: "Agents");

            migrationBuilder.DropForeignKey(
                name: "FK_Agents_Companies_CompanyId1",
                table: "Agents");

            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_Companies_CompanyId",
                table: "AuditLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_Companies_CompanyId1",
                table: "AuditLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_ChartOfAccounts_Companies_CompanyId",
                table: "ChartOfAccounts");

            migrationBuilder.DropForeignKey(
                name: "FK_ChartOfAccounts_Companies_CompanyId1",
                table: "ChartOfAccounts");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_Companies_CompanyId",
                table: "ChatMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Companies_CompanyId",
                table: "Customers");

            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Companies_CompanyId1",
                table: "Customers");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryNoteLines_Companies_CompanyId",
                table: "DeliveryNoteLines");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryNotes_Companies_CompanyId",
                table: "DeliveryNotes");

            migrationBuilder.DropForeignKey(
                name: "FK_InventoryTransactions_Companies_CompanyId",
                table: "InventoryTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Companies_CompanyId",
                table: "Invoices");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_Companies_CompanyId",
                table: "Items");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_Companies_CompanyId1",
                table: "Items");

            migrationBuilder.DropForeignKey(
                name: "FK_JournalEntries_Companies_CompanyId",
                table: "JournalEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Companies_CompanyId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_POSSales_Companies_CompanyId",
                table: "POSSales");

            migrationBuilder.DropForeignKey(
                name: "FK_POSSales_Companies_CompanyId1",
                table: "POSSales");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseInvoiceLines_Companies_CompanyId",
                table: "PurchaseInvoiceLines");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseInvoices_Companies_CompanyId",
                table: "PurchaseInvoices");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderLines_Companies_CompanyId",
                table: "PurchaseOrderLines");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Companies_CompanyId",
                table: "PurchaseOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Companies_CompanyId1",
                table: "PurchaseOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_QuoteLines_Companies_CompanyId",
                table: "QuoteLines");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotes_Companies_CompanyId",
                table: "Quotes");

            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_Companies_CompanyId",
                table: "Receipts");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesOrderLines_Companies_CompanyId",
                table: "SalesOrderLines");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesOrders_Companies_CompanyId",
                table: "SalesOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesOrders_Companies_CompanyId1",
                table: "SalesOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_StandingOrders_Companies_CompanyId",
                table: "StandingOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_StandingOrders_Companies_CompanyId1",
                table: "StandingOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_SupplierPayments_Companies_CompanyId",
                table: "SupplierPayments");

            migrationBuilder.DropForeignKey(
                name: "FK_Suppliers_Companies_CompanyId",
                table: "Suppliers");

            migrationBuilder.DropForeignKey(
                name: "FK_Suppliers_Companies_CompanyId1",
                table: "Suppliers");

            migrationBuilder.DropForeignKey(
                name: "FK_TaxInvoiceReceiptLines_Companies_CompanyId",
                table: "TaxInvoiceReceiptLines");

            migrationBuilder.DropForeignKey(
                name: "FK_TaxInvoiceReceipts_Companies_CompanyId",
                table: "TaxInvoiceReceipts");

            migrationBuilder.DropIndex(
                name: "IX_Suppliers_CompanyId1",
                table: "Suppliers");

            migrationBuilder.DropIndex(
                name: "IX_StandingOrders_CompanyId1",
                table: "StandingOrders");

            migrationBuilder.DropIndex(
                name: "IX_SalesOrders_CompanyId1",
                table: "SalesOrders");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_CompanyId1",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_POSSales_CompanyId1",
                table: "POSSales");

            migrationBuilder.DropIndex(
                name: "IX_Items_CompanyId1",
                table: "Items");

            migrationBuilder.DropIndex(
                name: "IX_Customers_CompanyId1",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_ChartOfAccounts_CompanyId1",
                table: "ChartOfAccounts");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_CompanyId1",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_Agents_CompanyId1",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "StandingOrders");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "POSSales");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "ChartOfAccounts");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "Agents");

            migrationBuilder.CreateTable(
                name: "BankTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BankTransactionNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ValueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BranchNumber = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    AccountNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ReferenceNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CounterpartyName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CounterpartyAccount = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsReconciled = table.Column<bool>(type: "bit", nullable: false),
                    ReconciledDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReconciledByUserId = table.Column<int>(type: "int", nullable: true),
                    ChartOfAccountId = table.Column<int>(type: "int", nullable: true),
                    ReceiptId = table.Column<int>(type: "int", nullable: true),
                    PaymentId = table.Column<int>(type: "int", nullable: true),
                    JournalEntryId = table.Column<int>(type: "int", nullable: true),
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
                    table.PrimaryKey("PK_BankTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BankTransactions_ChartOfAccounts_ChartOfAccountId",
                        column: x => x.ChartOfAccountId,
                        principalTable: "ChartOfAccounts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BankTransactions_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_BankTransactions_JournalEntries_JournalEntryId",
                        column: x => x.JournalEntryId,
                        principalTable: "JournalEntries",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_BankTransactions_ChartOfAccountId",
                table: "BankTransactions",
                column: "ChartOfAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_BankTransactions_CompanyId",
                table: "BankTransactions",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_BankTransactions_JournalEntryId",
                table: "BankTransactions",
                column: "JournalEntryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Agents_Companies_CompanyId",
                table: "Agents",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditLogs_Companies_CompanyId",
                table: "AuditLogs",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_ChartOfAccounts_Companies_CompanyId",
                table: "ChartOfAccounts",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_Companies_CompanyId",
                table: "ChatMessages",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Companies_CompanyId",
                table: "Customers",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryNoteLines_Companies_CompanyId",
                table: "DeliveryNoteLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryNotes_Companies_CompanyId",
                table: "DeliveryNotes",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryTransactions_Companies_CompanyId",
                table: "InventoryTransactions",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Companies_CompanyId",
                table: "Invoices",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Items_Companies_CompanyId",
                table: "Items",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_JournalEntries_Companies_CompanyId",
                table: "JournalEntries",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Companies_CompanyId",
                table: "Payments",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_POSSales_Companies_CompanyId",
                table: "POSSales",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseInvoiceLines_Companies_CompanyId",
                table: "PurchaseInvoiceLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseInvoices_Companies_CompanyId",
                table: "PurchaseInvoices",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderLines_Companies_CompanyId",
                table: "PurchaseOrderLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Companies_CompanyId",
                table: "PurchaseOrders",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_QuoteLines_Companies_CompanyId",
                table: "QuoteLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Quotes_Companies_CompanyId",
                table: "Quotes",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_Companies_CompanyId",
                table: "Receipts",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_SalesOrderLines_Companies_CompanyId",
                table: "SalesOrderLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_SalesOrders_Companies_CompanyId",
                table: "SalesOrders",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_StandingOrders_Companies_CompanyId",
                table: "StandingOrders",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_SupplierPayments_Companies_CompanyId",
                table: "SupplierPayments",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Suppliers_Companies_CompanyId",
                table: "Suppliers",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_TaxInvoiceReceiptLines_Companies_CompanyId",
                table: "TaxInvoiceReceiptLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_TaxInvoiceReceipts_Companies_CompanyId",
                table: "TaxInvoiceReceipts",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Agents_Companies_CompanyId",
                table: "Agents");

            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_Companies_CompanyId",
                table: "AuditLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_ChartOfAccounts_Companies_CompanyId",
                table: "ChartOfAccounts");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_Companies_CompanyId",
                table: "ChatMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Companies_CompanyId",
                table: "Customers");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryNoteLines_Companies_CompanyId",
                table: "DeliveryNoteLines");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryNotes_Companies_CompanyId",
                table: "DeliveryNotes");

            migrationBuilder.DropForeignKey(
                name: "FK_InventoryTransactions_Companies_CompanyId",
                table: "InventoryTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Companies_CompanyId",
                table: "Invoices");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_Companies_CompanyId",
                table: "Items");

            migrationBuilder.DropForeignKey(
                name: "FK_JournalEntries_Companies_CompanyId",
                table: "JournalEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Companies_CompanyId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_POSSales_Companies_CompanyId",
                table: "POSSales");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseInvoiceLines_Companies_CompanyId",
                table: "PurchaseInvoiceLines");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseInvoices_Companies_CompanyId",
                table: "PurchaseInvoices");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderLines_Companies_CompanyId",
                table: "PurchaseOrderLines");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Companies_CompanyId",
                table: "PurchaseOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_QuoteLines_Companies_CompanyId",
                table: "QuoteLines");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotes_Companies_CompanyId",
                table: "Quotes");

            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_Companies_CompanyId",
                table: "Receipts");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesOrderLines_Companies_CompanyId",
                table: "SalesOrderLines");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesOrders_Companies_CompanyId",
                table: "SalesOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_StandingOrders_Companies_CompanyId",
                table: "StandingOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_SupplierPayments_Companies_CompanyId",
                table: "SupplierPayments");

            migrationBuilder.DropForeignKey(
                name: "FK_Suppliers_Companies_CompanyId",
                table: "Suppliers");

            migrationBuilder.DropForeignKey(
                name: "FK_TaxInvoiceReceiptLines_Companies_CompanyId",
                table: "TaxInvoiceReceiptLines");

            migrationBuilder.DropForeignKey(
                name: "FK_TaxInvoiceReceipts_Companies_CompanyId",
                table: "TaxInvoiceReceipts");

            migrationBuilder.DropTable(
                name: "BankTransactions");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "Suppliers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "StandingOrders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "SalesOrders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "PurchaseOrders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "POSSales",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "Items",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "Customers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "ChartOfAccounts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "AuditLogs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "Agents",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_CompanyId1",
                table: "Suppliers",
                column: "CompanyId1");

            migrationBuilder.CreateIndex(
                name: "IX_StandingOrders_CompanyId1",
                table: "StandingOrders",
                column: "CompanyId1");

            migrationBuilder.CreateIndex(
                name: "IX_SalesOrders_CompanyId1",
                table: "SalesOrders",
                column: "CompanyId1");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_CompanyId1",
                table: "PurchaseOrders",
                column: "CompanyId1");

            migrationBuilder.CreateIndex(
                name: "IX_POSSales_CompanyId1",
                table: "POSSales",
                column: "CompanyId1");

            migrationBuilder.CreateIndex(
                name: "IX_Items_CompanyId1",
                table: "Items",
                column: "CompanyId1");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_CompanyId1",
                table: "Customers",
                column: "CompanyId1");

            migrationBuilder.CreateIndex(
                name: "IX_ChartOfAccounts_CompanyId1",
                table: "ChartOfAccounts",
                column: "CompanyId1");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_CompanyId1",
                table: "AuditLogs",
                column: "CompanyId1");

            migrationBuilder.CreateIndex(
                name: "IX_Agents_CompanyId1",
                table: "Agents",
                column: "CompanyId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Agents_Companies_CompanyId",
                table: "Agents",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Agents_Companies_CompanyId1",
                table: "Agents",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AuditLogs_Companies_CompanyId",
                table: "AuditLogs",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditLogs_Companies_CompanyId1",
                table: "AuditLogs",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChartOfAccounts_Companies_CompanyId",
                table: "ChartOfAccounts",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ChartOfAccounts_Companies_CompanyId1",
                table: "ChartOfAccounts",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_Companies_CompanyId",
                table: "ChatMessages",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Companies_CompanyId",
                table: "Customers",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Companies_CompanyId1",
                table: "Customers",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryNoteLines_Companies_CompanyId",
                table: "DeliveryNoteLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryNotes_Companies_CompanyId",
                table: "DeliveryNotes",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryTransactions_Companies_CompanyId",
                table: "InventoryTransactions",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Companies_CompanyId",
                table: "Invoices",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Items_Companies_CompanyId",
                table: "Items",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Items_Companies_CompanyId1",
                table: "Items",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_JournalEntries_Companies_CompanyId",
                table: "JournalEntries",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Companies_CompanyId",
                table: "Payments",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_POSSales_Companies_CompanyId",
                table: "POSSales",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_POSSales_Companies_CompanyId1",
                table: "POSSales",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseInvoiceLines_Companies_CompanyId",
                table: "PurchaseInvoiceLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseInvoices_Companies_CompanyId",
                table: "PurchaseInvoices",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderLines_Companies_CompanyId",
                table: "PurchaseOrderLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Companies_CompanyId",
                table: "PurchaseOrders",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Companies_CompanyId1",
                table: "PurchaseOrders",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_QuoteLines_Companies_CompanyId",
                table: "QuoteLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Quotes_Companies_CompanyId",
                table: "Quotes",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_Companies_CompanyId",
                table: "Receipts",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SalesOrderLines_Companies_CompanyId",
                table: "SalesOrderLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SalesOrders_Companies_CompanyId",
                table: "SalesOrders",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SalesOrders_Companies_CompanyId1",
                table: "SalesOrders",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_StandingOrders_Companies_CompanyId",
                table: "StandingOrders",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StandingOrders_Companies_CompanyId1",
                table: "StandingOrders",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SupplierPayments_Companies_CompanyId",
                table: "SupplierPayments",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Suppliers_Companies_CompanyId",
                table: "Suppliers",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Suppliers_Companies_CompanyId1",
                table: "Suppliers",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TaxInvoiceReceiptLines_Companies_CompanyId",
                table: "TaxInvoiceReceiptLines",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaxInvoiceReceipts_Companies_CompanyId",
                table: "TaxInvoiceReceipts",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
