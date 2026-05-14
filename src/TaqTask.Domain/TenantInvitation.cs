namespace TaqTask.Domain;

public class TenantInvitation
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int InvitedByUserId { get; set; }
    public string InviteeEmail { get; set; } = string.Empty;
    public string Token { get; set; } = Guid.NewGuid().ToString("N");
    public string Status { get; set; } = "pending";
    public string? Role { get; set; } = "user";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);
    public DateTime? AcceptedAt { get; set; }

    public Tenant? Tenant { get; set; }
}
