using TaqTask.Domain;

namespace TaqTask.Application.Services;

public interface ISubscriptionService
{
    Task<List<PlanDefinition>> GetAvailablePlansAsync();
    Task<PlanDefinition> GetPlanAsync(int tenantId);
    Task<PlanUsage> GetUsageAsync(int tenantId);
    Task<bool> CanAddUserAsync(int tenantId);
    Task<bool> CanInviteUsersAsync(int tenantId, int additionalCount);
    Task<bool> CanCreateBoardAsync(int tenantId);
    Task<string> UpgradePlanAsync(int tenantId, string newPlan);
    Task<string> ExtendTrialAsync(int tenantId, int additionalDays);
    Task<List<TenantSubscriptionInfo>> GetAllTenantsSubscriptionInfoAsync();
    Task InitializeTenantSubscriptionAsync(int tenantId, string planName = "free");
}
