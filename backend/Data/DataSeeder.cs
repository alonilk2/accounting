using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models.Core;
using backend.Models.Identity;
using backend.Models.Accounting;
using backend.Models.Inventory;
using backend.Models.Sales;

namespace backend.Data;

/// <summary>
/// Database seeding for initial system data
/// Creates default roles, chart of accounts, and admin user
/// </summary>
public static class DataSeeder
{
    /// <summary>
    /// Seeds the database with essential initial data
    /// </summary>
    public static async Task SeedAsync(AccountingDbContext context)
    {
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Seed roles
        await SeedRoles(context);

        // Seed template chart of accounts first (CompanyId = 0)
        await SeedDefaultChartOfAccounts(context);

        // Seed default company (this will also create company-specific chart of accounts)
        await SeedDefaultCompany(context);
        
        // Always ensure there's at least one active company for development/testing
        await EnsureDefaultCompanyExists(context);

        // Seed demo customers for company 1
        await SeedDemoCustomers(context);
    }

    private static async Task SeedRoles(AccountingDbContext context)
    {
        if (await context.Roles.AnyAsync())
            return; // Roles already seeded

        var roles = new[]
        {
            new Role
            {
                Name = "System Administrator",
                Description = "Full system access including user management",
                Permissions = """{"all": true}"""
            },
            new Role
            {
                Name = "Business Owner",
                Description = "Full access to company data and operations",
                Permissions = """{"company": {"read": true, "write": true, "delete": true}, "users": {"read": true, "write": true}, "reports": {"read": true, "export": true}}"""
            },
            new Role
            {
                Name = "Accountant",
                Description = "Full accounting access including compliance exports",
                Permissions = """{"accounting": {"read": true, "write": true}, "reports": {"read": true, "export": true}, "compliance": {"read": true, "export": true}}"""
            },
            new Role
            {
                Name = "Bookkeeper",
                Description = "Day-to-day transaction entry and basic reporting",
                Permissions = """{"transactions": {"read": true, "write": true}, "customers": {"read": true, "write": true}, "suppliers": {"read": true, "write": true}, "inventory": {"read": true, "write": true}}"""
            },
            new Role
            {
                Name = "Sales User",
                Description = "Sales operations and customer management",
                Permissions = """{"sales": {"read": true, "write": true}, "customers": {"read": true, "write": true}, "pos": {"read": true, "write": true}}"""
            },
            new Role
            {
                Name = "View Only",
                Description = "Read-only access to reports and data",
                Permissions = """{"read_only": true}"""
            }
        };

        context.Roles.AddRange(roles);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDefaultChartOfAccounts(AccountingDbContext context)
    {
        if (await context.ChartOfAccounts.AnyAsync())
            return; // Chart of accounts already exists

        // Create a template company with ID 0 if it doesn't exist
        var templateCompany = await context.Companies.FirstOrDefaultAsync(c => c.Id == 0);
        if (templateCompany == null)
        {
            // Use raw SQL to create a company with specific ID 0
            await context.Database.ExecuteSqlRawAsync(@"
                SET IDENTITY_INSERT Companies ON;
                INSERT INTO Companies (Id, Name, IsraelTaxId, Address, City, PostalCode, Country, Phone, Email, Currency, FiscalYearStartMonth, TimeZone, IsActive, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy, IsDeleted)
                VALUES (0, 'Template Company', '000000000', 'Template Address', 'Template City', '00000', 'Template Country', '00-0000000', 'template@example.com', 'ILS', 1, 'UTC', 0, GETUTCDATE(), GETUTCDATE(), 'System', 'System', 0);
                SET IDENTITY_INSERT Companies OFF;
            ");
        }

        // This would typically be seeded per company, but we can create a template
        // The actual implementation would create these accounts when a new company is set up
        var defaultAccounts = new[]
        {
            // Assets (1000-1999)
            new ChartOfAccount
            {
                AccountNumber = "1000",
                Name = "Current Assets",
                NameHebrew = "נכסים שוטפים",
                Type = AccountType.Asset,
                Level = 1,
                IsControlAccount = true,
                CompanyId = 0 // Template - will be copied per company
            },
            new ChartOfAccount
            {
                AccountNumber = "1100",
                Name = "Cash",
                NameHebrew = "מזומן",
                Type = AccountType.Asset,
                Level = 2,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "1110",
                Name = "Checking Account",
                NameHebrew = "חשבון עובר ושב",
                Type = AccountType.Asset,
                Level = 2,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "1200",
                Name = "Accounts Receivable",
                NameHebrew = "חייבים",
                Type = AccountType.Asset,
                Level = 2,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "1300",
                Name = "Inventory",
                NameHebrew = "מלאי",
                Type = AccountType.Asset,
                Level = 2,
                CompanyId = 0
            },

            // Liabilities (2000-2999)
            new ChartOfAccount
            {
                AccountNumber = "2000",
                Name = "Current Liabilities",
                NameHebrew = "התחייבויות שוטפות",
                Type = AccountType.Liability,
                Level = 1,
                IsControlAccount = true,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "2100",
                Name = "Accounts Payable",
                NameHebrew = "זכאים",
                Type = AccountType.Liability,
                Level = 2,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "2200",
                Name = "VAT Payable",
                NameHebrew = "מע\"מ לתשלום",
                Type = AccountType.Liability,
                Level = 2,
                CompanyId = 0
            },

            // Equity (3000-3999)
            new ChartOfAccount
            {
                AccountNumber = "3000",
                Name = "Owner's Equity",
                NameHebrew = "הון עצמי",
                Type = AccountType.Equity,
                Level = 1,
                IsControlAccount = true,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "3100",
                Name = "Capital",
                NameHebrew = "הון מניות",
                Type = AccountType.Equity,
                Level = 2,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "3200",
                Name = "Retained Earnings",
                NameHebrew = "רווח כלול",
                Type = AccountType.Equity,
                Level = 2,
                CompanyId = 0
            },

            // Revenue (4000-4999)
            new ChartOfAccount
            {
                AccountNumber = "4000",
                Name = "Revenue",
                NameHebrew = "הכנסות",
                Type = AccountType.Revenue,
                Level = 1,
                IsControlAccount = true,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "4100",
                Name = "Sales Revenue",
                NameHebrew = "הכנסות ממכירות",
                Type = AccountType.Revenue,
                Level = 2,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "4200",
                Name = "Service Revenue",
                NameHebrew = "הכנסות משירותים",
                Type = AccountType.Revenue,
                Level = 2,
                CompanyId = 0
            },

            // Expenses (5000-5999)
            new ChartOfAccount
            {
                AccountNumber = "5000",
                Name = "Cost of Goods Sold",
                NameHebrew = "עלות מכר",
                Type = AccountType.Expense,
                Level = 1,
                IsControlAccount = true,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "5100",
                Name = "Material Costs",
                NameHebrew = "עלות חומרים",
                Type = AccountType.Expense,
                Level = 2,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "5200",
                Name = "Inventory Adjustment",
                NameHebrew = "התאמת מלאי",
                Type = AccountType.Expense,
                Level = 2,
                CompanyId = 0
            },

            // Operating Expenses (6000-6999)
            new ChartOfAccount
            {
                AccountNumber = "6000",
                Name = "Operating Expenses",
                NameHebrew = "הוצאות תפעוליות",
                Type = AccountType.Expense,
                Level = 1,
                IsControlAccount = true,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "6100",
                Name = "Salaries and Wages",
                NameHebrew = "שכר עבודה",
                Type = AccountType.Expense,
                Level = 2,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "6200",
                Name = "Rent Expense",
                NameHebrew = "הוצאות שכירות",
                Type = AccountType.Expense,
                Level = 2,
                CompanyId = 0
            },
            new ChartOfAccount
            {
                AccountNumber = "6300",
                Name = "Utilities",
                NameHebrew = "שירותים",
                Type = AccountType.Expense,
                Level = 2,
                CompanyId = 0
            }
        };

        // Note: These are template accounts with CompanyId = 0
        // In actual implementation, these would be copied to each new company
        context.ChartOfAccounts.AddRange(defaultAccounts);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Creates default chart of accounts for a new company
    /// </summary>
    public static async Task CreateCompanyChartOfAccounts(AccountingDbContext context, int companyId)
    {
        // Get template accounts (CompanyId = 0)
        var templateAccounts = await context.ChartOfAccounts
            .Where(a => a.CompanyId == 0)
            .ToListAsync();

        if (!templateAccounts.Any())
            return;

        // Create company-specific accounts based on template
        var companyAccounts = templateAccounts.Select(template => new ChartOfAccount
        {
            CompanyId = companyId,
            AccountNumber = template.AccountNumber,
            Name = template.Name,
            NameHebrew = template.NameHebrew,
            Type = template.Type,
            Level = template.Level,
            IsControlAccount = template.IsControlAccount,
            IsActive = template.IsActive,
            Description = template.Description,
            IsDebitNormal = template.IsDebitNormal
        }).ToList();

        // Set up parent-child relationships
        var accountMap = new Dictionary<string, ChartOfAccount>();
        foreach (var account in companyAccounts)
        {
            accountMap[account.AccountNumber] = account;
        }

        foreach (var account in companyAccounts)
        {
            var template = templateAccounts.First(t => t.AccountNumber == account.AccountNumber);
            if (template.ParentAccountId.HasValue)
            {
                var parentTemplate = templateAccounts.First(t => t.Id == template.ParentAccountId);
                if (accountMap.TryGetValue(parentTemplate.AccountNumber, out var parentAccount))
                {
                    account.ParentAccount = parentAccount;
                }
            }
        }

        context.ChartOfAccounts.AddRange(companyAccounts);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDefaultCompany(AccountingDbContext context)
    {
        // Check if company with ID 1 specifically exists
        var defaultCompanyExists = await context.Companies.AnyAsync(c => c.Id == 1);
        if (defaultCompanyExists)
            return; // Default company already exists

        // Check if a company with the same IsraelTaxId already exists
        var existingCompanyWithTaxId = await context.Companies.AnyAsync(c => c.IsraelTaxId == "123456789");
        if (existingCompanyWithTaxId)
        {
            // If a company with this tax ID exists, we'll skip creating the default company
            // or we could generate a unique tax ID
            return;
        }

        // Use raw SQL to create a company with specific ID 1
        await context.Database.ExecuteSqlRawAsync(@"
            SET IDENTITY_INSERT Companies ON;
            INSERT INTO Companies (Id, Name, IsraelTaxId, Address, City, PostalCode, Country, Phone, Email, Currency, FiscalYearStartMonth, TimeZone, IsActive, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy, IsDeleted)
            VALUES (1, 'Default Test Company', '123456789', '123 Test Street', 'Tel Aviv', '12345', 'Israel', '03-1234567', 'info@testcompany.com', 'ILS', 1, 'Israel Standard Time', 1, GETUTCDATE(), GETUTCDATE(), 'System', 'System', 0);
            SET IDENTITY_INSERT Companies OFF;
        ");
        
        // Create default chart of accounts for the company
        await CreateCompanyChartOfAccounts(context, 1);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Ensures there's at least one active company in the database
    /// This is useful for development and testing scenarios
    /// </summary>
    public static async Task EnsureDefaultCompanyExists(AccountingDbContext context)
    {
        // Check if company with ID 1 specifically exists and is active
        var defaultCompanyExists = await context.Companies.AnyAsync(c => c.Id == 1 && c.IsActive && !c.IsDeleted);
        
        if (!defaultCompanyExists)
        {
            // First check if ID 1 exists but is inactive/deleted
            var inactiveDefaultExists = await context.Companies.AnyAsync(c => c.Id == 1);
            
            if (inactiveDefaultExists)
            {
                // Reactivate existing company with ID 1
                var company = await context.Companies.FirstAsync(c => c.Id == 1);
                company.IsActive = true;
                company.IsDeleted = false;
                company.UpdatedAt = DateTime.UtcNow;
                company.UpdatedBy = "System";
            }
            else
            {
                // Check if a company with the same IsraelTaxId already exists
                var existingCompanyWithTaxId = await context.Companies.AnyAsync(c => c.IsraelTaxId == "123456789");
                if (!existingCompanyWithTaxId)
                {
                    // Create new company with ID 1 only if the tax ID is not already used
                    await context.Database.ExecuteSqlRawAsync(@"
                        SET IDENTITY_INSERT Companies ON;
                        INSERT INTO Companies (Id, Name, IsraelTaxId, Address, City, PostalCode, Country, Phone, Email, Currency, FiscalYearStartMonth, TimeZone, IsActive, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy, IsDeleted)
                        VALUES (1, 'Default Test Company', '123456789', '123 Test Street', 'Tel Aviv', '12345', 'Israel', '03-1234567', 'info@testcompany.com', 'ILS', 1, 'Israel Standard Time', 1, GETUTCDATE(), GETUTCDATE(), 'System', 'System', 0);
                        SET IDENTITY_INSERT Companies OFF;
                    ");
                }
                else
                {
                    // If tax ID is taken, create with a different tax ID
                    await context.Database.ExecuteSqlRawAsync(@"
                        SET IDENTITY_INSERT Companies ON;
                        INSERT INTO Companies (Id, Name, IsraelTaxId, Address, City, PostalCode, Country, Phone, Email, Currency, FiscalYearStartMonth, TimeZone, IsActive, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy, IsDeleted)
                        VALUES (1, 'Default Test Company', '123456788', '123 Test Street', 'Tel Aviv', '12345', 'Israel', '03-1234567', 'info@testcompany.com', 'ILS', 1, 'Israel Standard Time', 1, GETUTCDATE(), GETUTCDATE(), 'System', 'System', 0);
                        SET IDENTITY_INSERT Companies OFF;
                    ");
                }
            }
            
            // Ensure chart of accounts exists for this company
            var hasChartOfAccounts = await context.ChartOfAccounts.AnyAsync(c => c.CompanyId == 1);
            if (!hasChartOfAccounts)
            {
                await CreateCompanyChartOfAccounts(context, 1);
            }
            
            await context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Seeds demo inventory items for company 1
    /// </summary>
    private static async Task SeedDemoItems(AccountingDbContext context)
    {
        const int companyId = 1;
        
        // Check if items already exist for company 1
        if (await context.Items.AnyAsync(i => i.CompanyId == companyId))
            return; // Items already seeded

        var demoItems = new[]
        {
            // Office Supplies Category
            new Item
            {
                CompanyId = companyId,
                SKU = "OFF-001",
                Name = "A4 Paper Ream",
                NameHebrew = "חבילת נייר A4",
                Description = "500 sheets of white A4 copy paper",
                Category = "Office Supplies",
                Unit = "ream",
                CostPrice = 15.00m,
                SellPrice = 22.00m,
                CurrentStockQty = 50,
                ReorderPoint = 10,
                MaxStockLevel = 100,
                ItemType = "Product",
                IsInventoryTracked = true,
                IsActive = true,
                IsSellable = true,
                IsPurchasable = true,
                Weight = 2.5m,
                Barcode = "1234567890123",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Item
            {
                CompanyId = companyId,
                SKU = "OFF-002",
                Name = "Blue Ballpoint Pen",
                NameHebrew = "עט כחול",
                Description = "Classic blue ink ballpoint pen",
                Category = "Office Supplies",
                Unit = "piece",
                CostPrice = 2.50m,
                SellPrice = 5.00m,
                CurrentStockQty = 200,
                ReorderPoint = 50,
                MaxStockLevel = 500,
                ItemType = "Product",
                IsInventoryTracked = true,
                IsActive = true,
                IsSellable = true,
                IsPurchasable = true,
                Weight = 0.01m,
                Barcode = "1234567890124",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Item
            {
                CompanyId = companyId,
                SKU = "OFF-003",
                Name = "Desktop Calculator",
                NameHebrew = "מחשבון שולחני",
                Description = "12-digit desktop calculator with large display",
                Category = "Office Supplies",
                Unit = "piece",
                CostPrice = 45.00m,
                SellPrice = 75.00m,
                CurrentStockQty = 15,
                ReorderPoint = 5,
                MaxStockLevel = 30,
                ItemType = "Product",
                IsInventoryTracked = true,
                IsActive = true,
                IsSellable = true,
                IsPurchasable = true,
                Weight = 0.8m,
                Barcode = "1234567890125",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },

            // Technology Category
            new Item
            {
                CompanyId = companyId,
                SKU = "TECH-001",
                Name = "USB Flash Drive 32GB",
                NameHebrew = "כונן USB 32GB",
                Description = "High-speed USB 3.0 flash drive 32GB capacity",
                Category = "Technology",
                Unit = "piece",
                CostPrice = 25.00m,
                SellPrice = 45.00m,
                CurrentStockQty = 30,
                ReorderPoint = 10,
                MaxStockLevel = 100,
                ItemType = "Product",
                IsInventoryTracked = true,
                IsActive = true,
                IsSellable = true,
                IsPurchasable = true,
                Weight = 0.05m,
                Barcode = "1234567890126",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Item
            {
                CompanyId = companyId,
                SKU = "TECH-002",
                Name = "Wireless Mouse",
                NameHebrew = "עכבר אלחוטי",
                Description = "Ergonomic wireless optical mouse with USB receiver",
                Category = "Technology",
                Unit = "piece",
                CostPrice = 60.00m,
                SellPrice = 95.00m,
                CurrentStockQty = 25,
                ReorderPoint = 8,
                MaxStockLevel = 50,
                ItemType = "Product",
                IsInventoryTracked = true,
                IsActive = true,
                IsSellable = true,
                IsPurchasable = true,
                Weight = 0.15m,
                Barcode = "1234567890127",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Item
            {
                CompanyId = companyId,
                SKU = "TECH-003",
                Name = "HDMI Cable 2m",
                NameHebrew = "כבל HDMI 2 מטר",
                Description = "High-speed HDMI cable 2 meters length",
                Category = "Technology",
                Unit = "piece",
                CostPrice = 18.00m,
                SellPrice = 35.00m,
                CurrentStockQty = 40,
                ReorderPoint = 15,
                MaxStockLevel = 80,
                ItemType = "Product",
                IsInventoryTracked = true,
                IsActive = true,
                IsSellable = true,
                IsPurchasable = true,
                Weight = 0.3m,
                Barcode = "1234567890128",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },

            // Services Category
            new Item
            {
                CompanyId = companyId,
                SKU = "SRV-001",
                Name = "IT Consulting Hour",
                NameHebrew = "שעת ייעוץ מחשבים",
                Description = "Professional IT consulting and support services",
                Category = "Services",
                Unit = "hour",
                CostPrice = 0.00m,
                SellPrice = 150.00m,
                CurrentStockQty = 0,
                ReorderPoint = 0,
                MaxStockLevel = 0,
                ItemType = "Service",
                IsInventoryTracked = false,
                IsActive = true,
                IsSellable = true,
                IsPurchasable = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Item
            {
                CompanyId = companyId,
                SKU = "SRV-002",
                Name = "Software Installation",
                NameHebrew = "התקנת תוכנה",
                Description = "Professional software installation and configuration",
                Category = "Services",
                Unit = "service",
                CostPrice = 0.00m,
                SellPrice = 200.00m,
                CurrentStockQty = 0,
                ReorderPoint = 0,
                MaxStockLevel = 0,
                ItemType = "Service",
                IsInventoryTracked = false,
                IsActive = true,
                IsSellable = true,
                IsPurchasable = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },

            // Food & Beverages Category (for office/retail)
            new Item
            {
                CompanyId = companyId,
                SKU = "F&B-001",
                Name = "Coffee Beans 1kg",
                NameHebrew = "פולי קפה 1 ק\"ג",
                Description = "Premium arabica coffee beans",
                Category = "Food & Beverages",
                Unit = "kg",
                CostPrice = 80.00m,
                SellPrice = 120.00m,
                CurrentStockQty = 20,
                ReorderPoint = 5,
                MaxStockLevel = 50,
                ItemType = "Product",
                IsInventoryTracked = true,
                IsActive = true,
                IsSellable = true,
                IsPurchasable = true,
                Weight = 1.0m,
                Barcode = "1234567890129",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Item
            {
                CompanyId = companyId,
                SKU = "F&B-002",
                Name = "Bottled Water 500ml",
                NameHebrew = "מים בבקבוק 500 מ\"ל",
                Description = "Natural spring water 500ml bottle",
                Category = "Food & Beverages",
                Unit = "bottle",
                CostPrice = 2.00m,
                SellPrice = 4.50m,
                CurrentStockQty = 100,
                ReorderPoint = 24,
                MaxStockLevel = 200,
                ItemType = "Product",
                IsInventoryTracked = true,
                IsActive = true,
                IsSellable = true,
                IsPurchasable = true,
                Weight = 0.5m,
                Barcode = "1234567890130",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },

            // Assembly Item Example
            new Item
            {
                CompanyId = companyId,
                SKU = "ASM-001",
                Name = "Office Starter Kit",
                NameHebrew = "ערכת התחלה למשרד",
                Description = "Complete office starter kit with essential supplies",
                Category = "Assemblies",
                Unit = "kit",
                CostPrice = 100.00m,
                SellPrice = 180.00m,
                CurrentStockQty = 0,
                ReorderPoint = 0,
                MaxStockLevel = 20,
                ItemType = "Assembly",
                IsInventoryTracked = true,
                IsActive = true,
                IsSellable = true,
                IsPurchasable = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            }
        };

        context.Items.AddRange(demoItems);
        await context.SaveChangesAsync();

        // Create a sample BOM for the assembly item
        var assemblyItem = await context.Items.FirstAsync(i => i.SKU == "ASM-001" && i.CompanyId == companyId);
        var paperItem = await context.Items.FirstAsync(i => i.SKU == "OFF-001" && i.CompanyId == companyId);
        var penItem = await context.Items.FirstAsync(i => i.SKU == "OFF-002" && i.CompanyId == companyId);
        var calcItem = await context.Items.FirstAsync(i => i.SKU == "OFF-003" && i.CompanyId == companyId);

        var bomItems = new[]
        {
            new InventoryBOM
            {
                ParentItemId = assemblyItem.Id,
                ComponentItemId = paperItem.Id,
                Quantity = 2, // 2 reams of paper
                IsActive = true,
                Notes = "A4 paper for office use",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new InventoryBOM
            {
                ParentItemId = assemblyItem.Id,
                ComponentItemId = penItem.Id,
                Quantity = 10, // 10 pens
                IsActive = true,
                Notes = "Ballpoint pens for writing",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new InventoryBOM
            {
                ParentItemId = assemblyItem.Id,
                ComponentItemId = calcItem.Id,
                Quantity = 1, // 1 calculator
                IsActive = true,
                Notes = "Desktop calculator",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            }
        };

        context.InventoryBOMs.AddRange(bomItems);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds demo customers for company 1
    /// </summary>
    private static async Task SeedDemoCustomers(AccountingDbContext context)
    {
        const int companyId = 1;
        
        // Check if customers already exist for company 1
        if (await context.Customers.AnyAsync(c => c.CompanyId == companyId))
            return; // Customers already seeded

        var demoCustomers = new[]
        {
            new Customer
            {
                CompanyId = companyId,
                Name = "Acme Corporation",
                NameHebrew = "תאגיד אקמי",
                Contact = "John Doe",
                Email = "john.doe@acme.com",
                Phone = "03-9876543",
                Address = "456 Business Rd",
                City = "Tel Aviv",
                PostalCode = "54321",
                Country = "Israel",
                PaymentTermsDays = 30,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Customer
            {
                CompanyId = companyId,
                Name = "Beta Ltd.",
                NameHebrew = "בטא בע\"מ",
                Contact = "Jane Smith",
                Email = "jane.smith@beta.com",
                Phone = "03-7654321",
                Address = "789 Corporate Blvd",
                City = "Jerusalem",
                PostalCode = "65432",
                Country = "Israel",
                PaymentTermsDays = 30,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            }
        };

        context.Customers.AddRange(demoCustomers);
        await context.SaveChangesAsync();
    }
}
