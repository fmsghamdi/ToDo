namespace TaqTask.Domain;

public class PlanDefinition
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string DisplayNameEn { get; set; } = string.Empty;
    public int MaxUsers { get; set; }
    public int MaxBoards { get; set; }
    public int MaxStorageMB { get; set; }
    public decimal PriceMonthly { get; set; }
    public decimal PriceYearly { get; set; }
    public List<string> Features { get; set; } = new();

    public int CurrentMaxUsers { get; set; }
    public int CurrentMaxBoards { get; set; }

    public bool HasFeature(string feature) => Features.Contains(feature);
}

public class TenantSubscriptionInfo
{
    public int TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string TenantEmail { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string Plan { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? TrialStart { get; set; }
    public DateTime? TrialEnd { get; set; }
    public int DaysRemaining { get; set; }
    public int UserCount { get; set; }
    public int BoardCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PlanUsage
{
    public string CurrentPlan { get; set; } = "free";
    public int CurrentUsers { get; set; }
    public int MaxUsers { get; set; }
    public int CurrentBoards { get; set; }
    public int MaxBoards { get; set; }
    public int UsersPercent => MaxUsers > 0 ? (int)((double)CurrentUsers / MaxUsers * 100) : 0;
    public int BoardsPercent => MaxBoards > 0 ? (int)((double)CurrentBoards / MaxBoards * 100) : 0;
    public string Status { get; set; } = "active";
    public DateTime? TrialStart { get; set; }
    public DateTime? TrialEnd { get; set; }
    public int DaysRemaining { get; set; }
}
