namespace TaqTask.Domain;

public class Payment
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int? SubscriptionId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "SAR";
    public string Status { get; set; } = "pending";
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public string? GatewayResponse { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public TenantSubscription? Subscription { get; set; }
}
