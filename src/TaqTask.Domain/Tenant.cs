namespace TaqTask.Domain;

public class Tenant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
    public string? CompanyWebsite { get; set; }
    public bool IsActive { get; set; } = true;
    public string SubscriptionPlan { get; set; } = "free";
    public int MaxUsers { get; set; } = 10;
    public int MaxBoards { get; set; } = 5;
    public string? Features { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
