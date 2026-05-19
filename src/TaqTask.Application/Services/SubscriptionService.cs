using Microsoft.EntityFrameworkCore;
using TaqTask.Data;
using TaqTask.Domain;
using System.Text.Json;

namespace TaqTask.Application.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly ToDoOSContext _context;

    public SubscriptionService(ToDoOSContext context)
    {
        _context = context;
    }

    public async Task<List<PlanDefinition>> GetAvailablePlansAsync()
    {
        var plans = await _context.SubscriptionPlans
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .AsNoTracking()
            .ToListAsync();

        return plans.Select(MapToDefinition).ToList();
    }

    public async Task<PlanDefinition> GetPlanAsync(int tenantId)
    {
        var subscription = await _context.TenantSubscriptions
            .Include(s => s.Plan)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TenantId == tenantId);

        if (subscription?.Plan != null)
        {
            var definition = MapToDefinition(subscription.Plan);
            return definition;
        }

        // Fallback to Tenant fields for backward compatibility
        var tenant = await _context.Tenants.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        if (tenant == null)
            return new PlanDefinition { Name = "free", DisplayName = "مجاني" };

        var plan = await _context.SubscriptionPlans.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Name == tenant.SubscriptionPlan);

        if (plan != null)
        {
            var def = MapToDefinition(plan);
            def.CurrentMaxUsers = tenant.MaxUsers;
            def.CurrentMaxBoards = tenant.MaxBoards;
            return def;
        }

        return new PlanDefinition
        {
            Name = "free",
            DisplayName = "مجاني",
            MaxUsers = tenant.MaxUsers,
            MaxBoards = tenant.MaxBoards
        };
    }

    public async Task<PlanUsage> GetUsageAsync(int tenantId)
    {
        var subscription = await _context.TenantSubscriptions
            .Include(s => s.Plan)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TenantId == tenantId);

        var plan = subscription?.Plan;

        if (plan == null)
        {
            var tenant = await _context.Tenants.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == tenantId);
            if (tenant == null) return new();

            plan = await _context.SubscriptionPlans.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Name == tenant.SubscriptionPlan);
        }

        var userCount = await _context.Users.CountAsync(u => u.TenantId == tenantId);
        var boardCount = await _context.Boards.CountAsync(b => b.TenantId == tenantId && !b.IsArchived);

        return new PlanUsage
        {
            CurrentPlan = plan?.Name ?? "free",
            CurrentUsers = userCount,
            MaxUsers = plan?.MaxUsers ?? 10,
            CurrentBoards = boardCount,
            MaxBoards = plan?.MaxBoards ?? 5
        };
    }

    public async Task InitializeTenantSubscriptionAsync(int tenantId, string planName = "free")
    {
        var plan = await _context.SubscriptionPlans
            .FirstOrDefaultAsync(p => p.Name == planName && p.IsActive);

        if (plan == null)
            plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Name == "free" && p.IsActive)
                ?? throw new InvalidOperationException("No active subscription plans available");

        var subscription = new TenantSubscription
        {
            TenantId = tenantId,
            PlanId = plan.Id,
            Status = "trial",
            TrialStart = DateTime.UtcNow,
            TrialEnd = DateTime.UtcNow.AddDays(plan.TrialDays > 0 ? plan.TrialDays : 30),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.TenantSubscriptions.Add(subscription);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> CanInviteUsersAsync(int tenantId, int additionalCount)
    {
        var maxUsers = 10;

        var subscription = await _context.TenantSubscriptions
            .Include(s => s.Plan)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TenantId == tenantId);

        if (subscription?.Plan != null)
        {
            maxUsers = subscription.Plan.MaxUsers;
        }
        else
        {
            var tenant = await _context.Tenants.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == tenantId);
            if (tenant != null)
                maxUsers = tenant.MaxUsers;
        }

        var userCount = await _context.Users.CountAsync(u => u.TenantId == tenantId);
        var pendingInvites = await _context.TenantInvitations
            .CountAsync(i => i.TenantId == tenantId && i.Status == "pending");

        return (userCount + pendingInvites + additionalCount) <= maxUsers;
    }

    public async Task<bool> CanAddUserAsync(int tenantId)
    {
        var maxUsers = 10;

        var subscription = await _context.TenantSubscriptions
            .Include(s => s.Plan)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TenantId == tenantId);

        if (subscription?.Plan != null)
        {
            maxUsers = subscription.Plan.MaxUsers;
        }
        else
        {
            var tenant = await _context.Tenants.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == tenantId);
            if (tenant != null)
                maxUsers = tenant.MaxUsers;
        }

        var count = await _context.Users.CountAsync(u => u.TenantId == tenantId);
        return count < maxUsers;
    }

    public async Task<bool> CanCreateBoardAsync(int tenantId)
    {
        var maxBoards = 5;

        var subscription = await _context.TenantSubscriptions
            .Include(s => s.Plan)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TenantId == tenantId);

        if (subscription?.Plan != null)
        {
            maxBoards = subscription.Plan.MaxBoards;
        }
        else
        {
            var tenant = await _context.Tenants.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == tenantId);
            if (tenant != null)
                maxBoards = tenant.MaxBoards;
        }

        var count = await _context.Boards.CountAsync(b => b.TenantId == tenantId && !b.IsArchived);
        return count < maxBoards;
    }

    public async Task<string> UpgradePlanAsync(int tenantId, string newPlan)
    {
        var plan = await _context.SubscriptionPlans
            .FirstOrDefaultAsync(p => p.Name == newPlan && p.IsActive)
            ?? throw new ArgumentException("Invalid or inactive plan");

        var subscription = await _context.TenantSubscriptions
            .FirstOrDefaultAsync(s => s.TenantId == tenantId);

        var oldPlanName = subscription?.Plan?.Name ?? "none";

        if (subscription == null)
        {
            subscription = new TenantSubscription
            {
                TenantId = tenantId,
                PlanId = plan.Id,
                Status = "active",
                CurrentPeriodStart = DateTime.UtcNow,
                CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.TenantSubscriptions.Add(subscription);
        }
        else
        {
            subscription.PlanId = plan.Id;
            subscription.Status = "active";
            subscription.CurrentPeriodStart = DateTime.UtcNow;
            subscription.CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1);
            subscription.UpdatedAt = DateTime.UtcNow;
        }

        // Sync Tenant fields for backward compatibility
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant != null)
        {
            tenant.SubscriptionPlan = plan.Name;
            tenant.MaxUsers = plan.MaxUsers;
            tenant.MaxBoards = plan.MaxBoards;
            tenant.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return $"Plan upgraded from {oldPlanName} to {plan.Name}";
    }

    private static PlanDefinition MapToDefinition(SubscriptionPlan plan)
    {
        return new PlanDefinition
        {
            Name = plan.Name,
            DisplayName = plan.DisplayNameAr,
            DisplayNameEn = plan.DisplayNameEn,
            MaxUsers = plan.MaxUsers,
            MaxBoards = plan.MaxBoards,
            MaxStorageMB = plan.MaxStorageMB,
            PriceMonthly = plan.PriceMonthly,
            PriceYearly = plan.PriceYearly,
            Features = JsonSerializer.Deserialize<List<string>>(plan.Features) ?? new(),
            CurrentMaxUsers = plan.MaxUsers,
            CurrentMaxBoards = plan.MaxBoards
        };
    }
}
