using System.Text.Json;
using backend.Controllers;
using backend.Data;
using backend.DTOs.Compliance;
using backend.DTOs.Tax;
using backend.Models.Core;
using backend.Models.Tax;
using backend.Services.Core;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Backend.Tests.Controllers;

public class FeatureGatingControllerTests
{
    [Fact]
    public async Task TaxReportingController_Returns403_ForNonEntitledCompany()
    {
        await using var context = CreateContext();
        await SeedCompanyAsync(context, companyId: 7, plan: "Basic");

        var companyService = new CompanyService(context, NullLogger<CompanyService>.Instance);
        var taxService = new StubTaxReportingService();
        var controller = new TaxReportingController(
            taxService,
            companyService,
            NullLogger<TaxReportingController>.Instance);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var actionResult = await controller.GetForm6111Reports(companyId: 7);

        var objectResult = Assert.IsType<ObjectResult>(actionResult.Result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);

        var payload = JsonSerializer.Serialize(objectResult.Value);
        Assert.Contains("feature_access_denied", payload);
        Assert.Contains("/company-management", payload);
        Assert.False(taxService.WasCalled);
    }

    [Fact]
    public async Task ComplianceController_Returns403_ForNonEntitledCompany()
    {
        await using var context = CreateContext();
        await SeedCompanyAsync(context, companyId: 8, plan: "Basic");

        var companyService = new CompanyService(context, NullLogger<CompanyService>.Instance);
        var complianceService = new StubComplianceExportService();
        var controller = new ComplianceController(
            complianceService,
            companyService,
            NullLogger<ComplianceController>.Instance);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        controller.ControllerContext.HttpContext.Request.Headers["X-Company-Id"] = "8";
        controller.ControllerContext.HttpContext.Request.Headers["X-User-Id"] = "user-1";

        var result = await controller.ExportUnifiedFormat(
            new UnifiedFormatExportRequestDto
            {
                StartDate = new DateTime(2026, 01, 01),
                EndDate = new DateTime(2026, 01, 31),
            },
            CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);

        var payload = JsonSerializer.Serialize(objectResult.Value);
        Assert.Contains("feature_access_denied", payload);
        Assert.Contains("/company-management", payload);
        Assert.False(complianceService.WasCalled);
    }

    private static AccountingDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AccountingDbContext>()
            .UseInMemoryDatabase($"feature-gating-controller-tests-{Guid.NewGuid()}")
            .Options;

        return new AccountingDbContext(options);
    }

    private static async Task SeedCompanyAsync(AccountingDbContext context, int companyId, string plan)
    {
        context.Companies.Add(new Company
        {
            Id = companyId,
            Name = $"Feature Gate {companyId}",
            IsraelTaxId = "534567890",
            Currency = "ILS",
            IsActive = true,
            SubscriptionPlan = plan,
            CreatedBy = "seed",
            UpdatedBy = "seed"
        });

        await context.SaveChangesAsync();
    }

    private sealed class StubComplianceExportService : IComplianceExportService
    {
        public bool WasCalled { get; private set; }

        public Task<UnifiedFormatExportArtifact> ExportUnifiedFormatAsync(
            int companyId,
            string userId,
            DateTime startDate,
            DateTime endDate,
            CancellationToken cancellationToken = default)
        {
            WasCalled = true;

            return Task.FromResult(new UnifiedFormatExportArtifact
            {
                ZipContent = Array.Empty<byte>(),
                DownloadFileName = "dummy.zip",
                FolderPath = "OPENFRMT/",
                IniContent = string.Empty,
                BkmvDataContent = string.Empty,
                ExportLogContent = string.Empty,
                RecordCounts = new Dictionary<string, int>()
            });
        }
    }

    private sealed class StubTaxReportingService : IIsraeliTaxReportingService
    {
        public bool WasCalled { get; private set; }

        public Task<Form6111ResponseDto> GenerateForm6111Async(Form6111RequestDto request, int companyId, string userId, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            throw new NotImplementedException();
        }

        public Task<Form6111ValidationResultDto> ValidateForm6111Async(int form6111Id, int companyId, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            throw new NotImplementedException();
        }

        public Task<Form6111ExportDto> ExportForm6111Async(int form6111Id, int companyId, string format = "JSON", CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            throw new NotImplementedException();
        }

        public Task<IEnumerable<Form6111ResponseDto>> GetForm6111ReportsAsync(int companyId, int? taxYear = null, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            throw new NotImplementedException();
        }

        public Task<Form6111ProfitLossDto> CalculateProfitLossAsync(int companyId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            throw new NotImplementedException();
        }

        public Task<Form6111BalanceSheetDto> CalculateBalanceSheetAsync(int companyId, DateTime asOfDate, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            throw new NotImplementedException();
        }

        public Task<Form6111TaxAdjustmentDto> CalculateTaxAdjustmentsAsync(int companyId, decimal accountingProfit, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            throw new NotImplementedException();
        }

        public Task<Dictionary<string, string>> GetIsraeliAccountMappingAsync(int companyId, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            throw new NotImplementedException();
        }

        public Task<Form6111ResponseDto> UpdateForm6111StatusAsync(int form6111Id, int companyId, Form6111Status status, string userId, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            throw new NotImplementedException();
        }
    }
}
