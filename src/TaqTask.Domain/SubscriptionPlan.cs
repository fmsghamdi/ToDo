namespace TaqTask.Domain;

public class SubscriptionPlan
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayNameAr { get; set; } = string.Empty;
    public string DisplayNameEn { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal PriceMonthly { get; set; }
    public decimal PriceYearly { get; set; }
    public int MaxUsers { get; set; }
    public int MaxBoards { get; set; }
    public int MaxStorageMB { get; set; }
    public int TrialDays { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public string Features { get; set; } = "[]";
    public string? MoyasarPlanId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
