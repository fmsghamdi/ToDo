using Microsoft.EntityFrameworkCore;
using TaqTask.Data;
using TaqTask.Domain;

namespace TaqTask.Application.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly ToDoOSContext _context;

    public SubscriptionService(ToDoOSContext context)
    {
        _context = context;
    }

    private static readonly Dictionary<string, PlanDefinition> Plans = new()
    {
        ["free"] = new()
        {
            Name = "free",
            DisplayName = "مجاني",
            DisplayNameEn = "Free",
            MaxUsers = 10,
            MaxBoards = 5,
            MaxStorageMB = 100,
            PriceMonthly = 0,
            PriceYearly = 0,
            Features = new() { "basic_boards", "basic_collaboration" }
        },
        ["pro"] = new()
        {
            Name = "pro",
            DisplayName = "احترافي",
            DisplayNameEn = "Professional",
            MaxUsers = 50,
            MaxBoards = 50,
            MaxStorageMB = 1024,
            PriceMonthly = 29,
            PriceYearly = 290,
            Features = new() { "basic_boards", "basic_collaboration", "advanced_reports", "priority_support", "integrations" }
        },
        ["enterprise"] = new()
        {
            Name = "enterprise",
            DisplayName = "مؤسسات",
            DisplayNameEn = "Enterprise",
            MaxUsers = 1000,
            MaxBoards = 500,
            MaxStorageMB = 10240,
            PriceMonthly = 99,
            PriceYearly = 990,
            Features = new() { "basic_boards", "basic_collaboration", "advanced_reports", "priority_support", "integrations", "sso", "audit_logs", "api_access" }
        }
    };

    public Task<List<PlanDefinition>> GetAvailablePlansAsync()
    {
        return Task.FromResult(Plans.Values.ToList());
    }

    public async Task<PlanDefinition> GetPlanAsync(int tenantId)
    {
        var tenant = await _context.Tenants.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        if (tenant == null) return Plans["free"];

        var plan = Plans.GetValueOrDefault(tenant.SubscriptionPlan, Plans["free"]);
        plan.CurrentMaxUsers = tenant.MaxUsers;
        plan.CurrentMaxBoards = tenant.MaxBoards;
        return plan;
    }

    public async Task<PlanUsage> GetUsageAsync(int tenantId)
    {
        var tenant = await _context.Tenants.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        if (tenant == null) return new();

        var userCount = await _context.Users.CountAsync(u => u.TenantId == tenantId);
        var boardCount = await _context.Boards.CountAsync(b => b.TenantId == tenantId && !b.IsArchived);

        return new PlanUsage
        {
            CurrentPlan = tenant.SubscriptionPlan,
            CurrentUsers = userCount,
            MaxUsers = tenant.MaxUsers,
            CurrentBoards = boardCount,
            MaxBoards = tenant.MaxBoards
        };
    }

    public async Task<bool> CanAddUserAsync(int tenantId)
    {
        var tenant = await _context.Tenants.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return false;

        var count = await _context.Users.CountAsync(u => u.TenantId == tenantId);
        return count < tenant.MaxUsers;
    }

    public async Task<bool> CanCreateBoardAsync(int tenantId)
    {
        var tenant = await _context.Tenants.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return false;

        var count = await _context.Boards.CountAsync(b => b.TenantId == tenantId && !b.IsArchived);
        return count < tenant.MaxBoards;
    }

    public async Task<string> UpgradePlanAsync(int tenantId, string newPlan)
    {
        if (!Plans.ContainsKey(newPlan))
            throw new ArgumentException("Invalid plan");

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId)
            ?? throw new InvalidOperationException("Tenant not found");

        var oldPlan = tenant.SubscriptionPlan;
        tenant.SubscriptionPlan = newPlan;
        tenant.MaxUsers = Plans[newPlan].MaxUsers;
        tenant.MaxBoards = Plans[newPlan].MaxBoards;
        tenant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return $"Plan upgraded from {oldPlan} to {newPlan}";
    }
}
