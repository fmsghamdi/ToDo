using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaqTask.Application.Services;
using TaqTask.Domain;

namespace TaqTask.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubscriptionController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;
    private readonly ILogger<SubscriptionController> _logger;

    public SubscriptionController(ISubscriptionService subscriptionService, ILogger<SubscriptionController> logger)
    {
        _subscriptionService = subscriptionService;
        _logger = logger;
    }

    private int? GetTenantId()
    {
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (int.TryParse(tenantIdClaim, out var tenantId))
            return tenantId;
        return null;
    }

    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<ActionResult<List<PlanDefinition>>> GetPlans()
    {
        var plans = await _subscriptionService.GetAvailablePlansAsync();
        return Ok(plans);
    }

    [HttpGet("current")]
    public async Task<ActionResult<PlanDefinition>> GetCurrentPlan()
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var plan = await _subscriptionService.GetPlanAsync(tenantId.Value);
        return Ok(plan);
    }

    [HttpGet("usage")]
    public async Task<ActionResult<PlanUsage>> GetUsage()
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        var usage = await _subscriptionService.GetUsageAsync(tenantId.Value);
        return Ok(usage);
    }

    [HttpPut("upgrade")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> UpgradePlan([FromBody] UpgradeRequest request)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        try
        {
            var result = await _subscriptionService.UpgradePlanAsync(tenantId.Value, request.PlanName);
            _logger.LogInformation("Tenant {TenantId} upgraded to plan: {Plan}", tenantId, request.PlanName);
            return Ok(new { message = result });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("extend-trial")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> ExtendTrial([FromBody] ExtendTrialRequest request)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();

        try
        {
            var result = await _subscriptionService.ExtendTrialAsync(tenantId.Value, request.Days);
            _logger.LogInformation("Tenant {TenantId} trial extended by {Days} days", tenantId, request.Days);
            return Ok(new { message = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public class UpgradeRequest
{
    public string PlanName { get; set; } = string.Empty;
}

public class ExtendTrialRequest
{
    public int Days { get; set; } = 30;
}
