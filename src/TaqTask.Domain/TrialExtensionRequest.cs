namespace TaqTask.Domain;

public class TrialExtensionRequest
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int RequestedDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public int? ApprovedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
