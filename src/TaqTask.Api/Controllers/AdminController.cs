using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaqTask.Application.Services;
using TaqTask.Domain;

namespace TaqTask.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(ISubscriptionService subscriptionService, ILogger<AdminController> logger)
    {
        _subscriptionService = subscriptionService;
        _logger = logger;
    }

    [HttpGet("tenants")]
    public async Task<ActionResult<List<TenantSubscriptionInfo>>> GetTenants()
    {
        var tenants = await _subscriptionService.GetAllTenantsSubscriptionInfoAsync();
        return Ok(tenants);
    }

    [HttpPost("tenants/{tenantId}/extend-trial")]
    public async Task<ActionResult> ExtendTenantTrial(int tenantId, [FromBody] ExtendTrialRequest request)
    {
        try
        {
            var result = await _subscriptionService.ExtendTrialAsync(tenantId, request.Days);
            _logger.LogInformation("Admin extended trial for tenant {TenantId} by {Days} days", tenantId, request.Days);
            return Ok(new { message = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("tenants/{tenantId}/plan")]
    public async Task<ActionResult> ChangeTenantPlan(int tenantId, [FromBody] UpgradeRequest request)
    {
        try
        {
            var result = await _subscriptionService.UpgradePlanAsync(tenantId, request.PlanName);
            _logger.LogInformation("Admin changed plan for tenant {TenantId} to {Plan}", tenantId, request.PlanName);
            return Ok(new { message = result });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
