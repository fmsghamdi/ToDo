using System.Security.Claims;
using TaqTask.Domain;

namespace TaqTask.Api.Services;

public class TenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? GetTenantId()
    {
        var tenantIdClaim = _httpContextAccessor.HttpContext?.User?
            .FindFirst("TenantId")?.Value;

        if (int.TryParse(tenantIdClaim, out var tenantId))
            return tenantId;

        return null;
    }

    public string? GetTenantName()
    {
        return _httpContextAccessor.HttpContext?.User?
            .FindFirst("TenantName")?.Value;
    }
}
