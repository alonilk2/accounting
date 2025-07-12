using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryAdjustmentAccountToExistingCompanies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add Inventory Adjustment account for all existing companies that don't already have it
            migrationBuilder.Sql(@"
                INSERT INTO [ChartOfAccounts] (
                    [CompanyId], 
                    [AccountNumber], 
                    [Name], 
                    [NameHebrew], 
                    [Type], 
                    [Level], 
                    [CurrentBalance], 
                    [IsActive], 
                    [IsControlAccount], 
                    [IsDebitNormal], 
                    [IsDeleted], 
                    [CreatedAt], 
                    [UpdatedAt], 
                    [CreatedBy], 
                    [UpdatedBy]
                )
                SELECT 
                    c.[Id] as CompanyId,
                    '525' as AccountNumber,
                    'Inventory Adjustment' as Name,
                    'התאמת מלאי' as NameHebrew,
                    5 as Type, -- AccountType.Expense = 5
                    2 as Level,
                    0.0 as CurrentBalance,
                    1 as IsActive,
                    0 as IsControlAccount,
                    1 as IsDebitNormal,
                    0 as IsDeleted,
                    GETUTCDATE() as CreatedAt,
                    GETUTCDATE() as UpdatedAt,
                    'system' as CreatedBy,
                    'system' as UpdatedBy
                FROM [Companies] c
                WHERE c.[IsDeleted] = 0
                AND NOT EXISTS (
                    SELECT 1 FROM [ChartOfAccounts] coa 
                    WHERE coa.[CompanyId] = c.[Id] 
                    AND coa.[Name] = 'Inventory Adjustment' 
                    AND coa.[Type] = 5
                    AND coa.[IsDeleted] = 0
                )
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove the Inventory Adjustment accounts that were added
            migrationBuilder.Sql(@"
                DELETE FROM [ChartOfAccounts] 
                WHERE [Name] = 'Inventory Adjustment' 
                AND [Type] = 5 
                AND [AccountNumber] = '525'
            ");
        }
    }
}
