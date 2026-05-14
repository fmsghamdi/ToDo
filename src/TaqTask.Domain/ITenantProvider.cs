namespace TaqTask.Domain;

public interface ITenantProvider
{
    int? GetTenantId();
    string? GetTenantName();
}
