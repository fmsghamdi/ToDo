using TaqTask.Domain;

namespace TaqTask.Application.Services;

public interface ISubscriptionService
{
    Task<List<PlanDefinition>> GetAvailablePlansAsync();
    Task<PlanDefinition> GetPlanAsync(int tenantId);
    Task<PlanUsage> GetUsageAsync(int tenantId);
    Task<bool> CanAddUserAsync(int tenantId);
    Task<bool> CanCreateBoardAsync(int tenantId);
    Task<string> UpgradePlanAsync(int tenantId, string newPlan);
}
