namespace TaqTask.Domain;

public class TenantSubscription
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int PlanId { get; set; }
    public string Status { get; set; } = "trial";
    public DateTime TrialStart { get; set; }
    public DateTime TrialEnd { get; set; }
    public DateTime? CurrentPeriodStart { get; set; }
    public DateTime? CurrentPeriodEnd { get; set; }
    public bool CancelAtPeriodEnd { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public SubscriptionPlan Plan { get; set; } = null!;
}
