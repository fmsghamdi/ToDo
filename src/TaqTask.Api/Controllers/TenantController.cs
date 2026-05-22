using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using TaqTask.Data;
using TaqTask.Domain;
using TaqTask.Api.Models;
using TaqTask.Infrastructure.Services;
using TaqTask.Application.Services;

namespace TaqTask.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenantController : ControllerBase
{
    private readonly ToDoOSContext _context;
    private readonly ILogger<TenantController> _logger;
    private readonly ISubscriptionService _subscriptionService;

    public TenantController(ToDoOSContext context, ILogger<TenantController> logger, ISubscriptionService subscriptionService)
    {
        _context = context;
        _logger = logger;
        _subscriptionService = subscriptionService;
    }

    // POST: api/tenant/register
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<TenantResponse>> Register(TenantRegisterRequest request)
    {
        if (await _context.Tenants.AnyAsync(t => t.Subdomain == request.Subdomain))
        {
            return BadRequest(new { message = "Subdomain already taken" });
        }

        if (await _context.Tenants.AnyAsync(t => t.Email == request.Email))
        {
            return BadRequest(new { message = "Email already registered" });
        }

        // Block disposable emails
        if (DisposableEmailChecker.IsDisposable(request.Email))
        {
            return BadRequest(new { message = "Disposable email addresses are not allowed. Please use a permanent email." });
        }

        var tenant = new Tenant
        {
            Name = request.Name,
            Subdomain = request.Subdomain.ToLowerInvariant(),
            Email = request.Email,
            CompanyAddress = request.CompanyAddress,
            CompanyPhone = request.CompanyPhone,
            CompanyWebsite = request.CompanyWebsite,
            SubscriptionPlan = "free",
            MaxUsers = 10,
            MaxBoards = 5,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        // Initialize tenant subscription with free trial
        await _subscriptionService.InitializeTenantSubscriptionAsync(tenant.Id, "free");

        _logger.LogInformation("New tenant registered: {TenantName} ({Subdomain})", tenant.Name, tenant.Subdomain);

        return Ok(MapTenantToResponse(tenant));
    }

    // GET: api/tenant/{id}/branding
    [HttpGet("{id}/branding")]
    [AllowAnonymous]
    public async Task<ActionResult<BrandingResponse>> GetBranding(int id)
    {
        var tenant = await _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);

        if (tenant == null)
        {
            return NotFound(new { message = "Tenant not found" });
        }

        return Ok(new BrandingResponse
        {
            TenantId = tenant.Id,
            Name = tenant.Name,
            LogoUrl = tenant.LogoUrl,
            PrimaryColor = tenant.PrimaryColor ?? "#3B82F6",
            SecondaryColor = tenant.SecondaryColor ?? "#6B7280",
            CompanyAddress = tenant.CompanyAddress,
            CompanyPhone = tenant.CompanyPhone,
            CompanyWebsite = tenant.CompanyWebsite
        });
    }

    // GET: api/tenant/current
    [HttpGet("current")]
    [Authorize]
    public async Task<ActionResult<TenantResponse>> GetCurrentTenant()
    {
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (!int.TryParse(tenantIdClaim, out var tenantId))
        {
            return Unauthorized();
        }

        var tenant = await _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        if (tenant == null)
        {
            return NotFound(new { message = "Tenant not found" });
        }

        return Ok(MapTenantToResponse(tenant));
    }

    // PUT: api/tenant/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<TenantResponse>> UpdateTenant(int id, TenantUpdateRequest request)
    {
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (!int.TryParse(tenantIdClaim, out var userTenantId) || userTenantId != id)
        {
            return Forbid();
        }

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == id);

        if (tenant == null)
        {
            return NotFound(new { message = "Tenant not found" });
        }

        if (request.Name != null) tenant.Name = request.Name;
        if (request.LogoUrl != null) tenant.LogoUrl = request.LogoUrl;
        if (request.PrimaryColor != null) tenant.PrimaryColor = request.PrimaryColor;
        if (request.SecondaryColor != null) tenant.SecondaryColor = request.SecondaryColor;
        if (request.CompanyAddress != null) tenant.CompanyAddress = request.CompanyAddress;
        if (request.CompanyPhone != null) tenant.CompanyPhone = request.CompanyPhone;
        if (request.CompanyWebsite != null) tenant.CompanyWebsite = request.CompanyWebsite;

        tenant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Tenant updated: {TenantName} ({Id})", tenant.Name, tenant.Id);

        return Ok(MapTenantToResponse(tenant));
    }

    // POST: api/tenant/invitations
    [HttpPost("invitations")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<List<InvitationResponse>>> CreateInvitations(InviteRequest request)
    {
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (!int.TryParse(tenantIdClaim, out var tenantId))
            return Unauthorized();

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null)
            return NotFound(new { message = "Tenant not found" });

        // Check user limit
        if (!await _subscriptionService.CanInviteUsersAsync(tenantId, request.Emails.Count))
        {
            var usage = await _subscriptionService.GetUsageAsync(tenantId);
            return BadRequest(new { message = $"User limit exceeded. Max: {usage.MaxUsers}" });
        }

        var created = new List<InvitationResponse>();
        foreach (var email in request.Emails.Distinct())
        {
            if (string.IsNullOrWhiteSpace(email)) continue;

            // Skip if user already exists
            if (await _context.Users.AnyAsync(u => u.Email == email && u.TenantId == tenantId))
                continue;

            // Skip if already invited
            if (await _context.TenantInvitations.AnyAsync(i =>
                i.InviteeEmail == email && i.TenantId == tenantId && i.Status == "pending"))
                continue;

            var invitation = new TenantInvitation
            {
                TenantId = tenantId,
                InvitedByUserId = userId,
                InviteeEmail = email,
                Role = request.Role ?? "user",
                Token = Guid.NewGuid().ToString("N"),
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.TenantInvitations.Add(invitation);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Invitation created for {Email} to tenant {TenantId}", email, tenantId);

            created.Add(new InvitationResponse
            {
                Id = invitation.Id,
                InviteeEmail = invitation.InviteeEmail,
                Token = invitation.Token,
                Status = invitation.Status,
                Role = invitation.Role,
                CreatedAt = invitation.CreatedAt,
                ExpiresAt = invitation.ExpiresAt
            });
        }

        return Ok(created);
    }

    // GET: api/tenant/invitations
    [HttpGet("invitations")]
    [Authorize]
    public async Task<ActionResult<List<InvitationResponse>>> GetInvitations()
    {
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (!int.TryParse(tenantIdClaim, out var tenantId))
            return Unauthorized();

        var invitations = await _context.TenantInvitations
            .Where(i => i.TenantId == tenantId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvitationResponse
            {
                Id = i.Id,
                InviteeEmail = i.InviteeEmail,
                Token = i.Token,
                Status = i.Status,
                Role = i.Role,
                CreatedAt = i.CreatedAt,
                ExpiresAt = i.ExpiresAt,
                AcceptedAt = i.AcceptedAt
            })
            .ToListAsync();

        return Ok(invitations);
    }

    // GET: api/tenant/invitations/by-token/{token}
    [HttpGet("invitations/by-token/{token}")]
    [AllowAnonymous]
    public async Task<ActionResult<InvitationResponse>> GetInvitationByToken(string token)
    {
        var invitation = await _context.TenantInvitations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(i => i.Token == token && i.Status == "pending");

        if (invitation == null || invitation.ExpiresAt < DateTime.UtcNow)
            return NotFound(new { message = "Invalid or expired invitation" });

        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .Where(t => t.Id == invitation.TenantId)
            .Select(t => new { t.Name, t.Subdomain })
            .FirstOrDefaultAsync();

        return Ok(new InvitationResponse
        {
            Id = invitation.Id,
            InviteeEmail = invitation.InviteeEmail,
            Token = invitation.Token,
            Status = invitation.Status,
            Role = invitation.Role,
            TenantName = tenant?.Name,
            TenantSubdomain = tenant?.Subdomain,
            CreatedAt = invitation.CreatedAt,
            ExpiresAt = invitation.ExpiresAt
        });
    }

    // POST: api/tenant/invitations/{token}/accept
    [HttpPost("invitations/{token}/accept")]
    [AllowAnonymous]
    public async Task<ActionResult> AcceptInvitation(string token, [FromBody] AcceptInviteRequest request)
    {
        var invitation = await _context.TenantInvitations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(i => i.Token == token && i.Status == "pending");

        if (invitation == null || invitation.ExpiresAt < DateTime.UtcNow)
            return NotFound(new { message = "Invalid or expired invitation" });

        // Check if user already exists
        if (await _context.Users.IgnoreQueryFilters()
            .AnyAsync(u => u.Email == request.Email && u.TenantId == invitation.TenantId))
            return BadRequest(new { message = "User already exists in this tenant" });

        // Block disposable emails
        if (DisposableEmailChecker.IsDisposable(request.Email))
            return BadRequest(new { message = "Disposable email addresses are not allowed. Please use a permanent email." });

        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == invitation.TenantId);

        if (tenant == null || !tenant.IsActive)
            return BadRequest(new { message = "Tenant is not active" });

        // Check user limit
        if (!await _subscriptionService.CanAddUserAsync(invitation.TenantId))
            return BadRequest(new { message = "Tenant user limit reached" });

        // Create user
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCryptOrSha256(request.Password),
            FullName = request.FullName,
            Role = invitation.Role ?? "user",
            IsActive = true,
            TenantId = invitation.TenantId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        // Update invitation
        invitation.Status = "accepted";
        invitation.AcceptedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Invitation accepted: {Email} joined tenant {TenantId}",
            request.Email, invitation.TenantId);

        return Ok(new { message = "Account created successfully", tenantId = invitation.TenantId });
    }

    // DELETE: api/tenant/invitations/{id}
    [HttpDelete("invitations/{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> CancelInvitation(int id)
    {
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (!int.TryParse(tenantIdClaim, out var tenantId))
            return Unauthorized();

        var invitation = await _context.TenantInvitations
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (invitation == null)
            return NotFound(new { message = "Invitation not found" });

        invitation.Status = "cancelled";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Invitation cancelled" });
    }

    private static string BCryptOrSha256(string password)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashedBytes = sha256.ComputeHash(
            System.Text.Encoding.UTF8.GetBytes(password + "ToDoOS_Salt"));
        return Convert.ToBase64String(hashedBytes);
    }

    private static TenantResponse MapTenantToResponse(Tenant tenant)
    {
        return new TenantResponse
        {
            Id = tenant.Id,
            Name = tenant.Name,
            Subdomain = tenant.Subdomain,
            Email = tenant.Email,
            LogoUrl = tenant.LogoUrl,
            PrimaryColor = tenant.PrimaryColor,
            SecondaryColor = tenant.SecondaryColor,
            CompanyAddress = tenant.CompanyAddress,
            CompanyPhone = tenant.CompanyPhone,
            CompanyWebsite = tenant.CompanyWebsite,
            IsActive = tenant.IsActive,
            SubscriptionPlan = tenant.SubscriptionPlan,
            MaxUsers = tenant.MaxUsers,
            MaxBoards = tenant.MaxBoards,
            Features = tenant.Features,
            CreatedAt = tenant.CreatedAt
        };
    }
}

// DTOs
public class InviteRequest
{
    public List<string> Emails { get; set; } = new();
    public string? Role { get; set; } = "user";
}

public class AcceptInviteRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}

public class InvitationResponse
{
    public int Id { get; set; }
    public string InviteeEmail { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string? TenantName { get; set; }
    public string? TenantSubdomain { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
}

public class TenantRegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
    public string? CompanyWebsite { get; set; }
}

public class TenantUpdateRequest
{
    public string? Name { get; set; }
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
    public string? CompanyWebsite { get; set; }
}

public class TenantResponse
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
    public bool IsActive { get; set; }
    public string SubscriptionPlan { get; set; } = "free";
    public int MaxUsers { get; set; }
    public int MaxBoards { get; set; }
    public string? Features { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BrandingResponse
{
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string PrimaryColor { get; set; } = "#3B82F6";
    public string SecondaryColor { get; set; } = "#6B7280";
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
    public string? CompanyWebsite { get; set; }
}
