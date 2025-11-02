using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using TaqTask.Data;
using TaqTask.Api.Models;

namespace TaqTask.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ToDoOSContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        ToDoOSContext context, 
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        // ✅ CRITICAL FIX: Always fetch fresh user data from DB including role
        var user = await _context.Users
            .AsNoTracking() // Ensure no caching
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for email: {Email}", request.Email);
            return BadRequest(new { message = "Invalid email or password" });
        }

        _logger.LogInformation("Successful login for user: {Username}, Role: {Role}", user.Username, user.Role);

        // Update last login
        user.UpdatedAt = DateTime.UtcNow;
        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        // ✅ Generate JWT token with FRESH role from database
        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        var response = new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            User = MapUserToDto(user),
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };

        return Ok(response);
    }

    // POST: api/auth/ad-login - For Active Directory authenticated users
    [HttpPost("ad-login")]
    public async Task<ActionResult<LoginResponse>> ADLogin(ADLoginRequest request)
    {
        _logger.LogInformation("AD login attempt for username: {Username}", request.Username);

        // ✅ CRITICAL FIX: For AD users, ALWAYS fetch user data from DB by username/email
        // This ensures roles are pulled from the central database, not client cache
        var user = await _context.Users
            .AsNoTracking() // No cache
            .FirstOrDefaultAsync(u => 
                (u.Username == request.Username || u.Email == request.Email) && 
                u.IsActive);

        if (user == null)
        {
            // If user doesn't exist in DB yet, create them with default role
            _logger.LogInformation("Creating new AD user in database: {Username}", request.Username);
            
            user = new User
            {
                Username = request.Username,
                Email = request.Email,
                FullName = request.DisplayName,
                PasswordHash = GenerateRandomPasswordHash(), // AD users don't use local password
                Role = "user", // Default role - admin must assign proper role
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Created new AD user: {Username} with default role: user", request.Username);
        }
        else
        {
            // ✅ Update user info but PRESERVE the role assigned by admin
            _logger.LogInformation("Existing AD user login: {Username}, Current Role: {Role}", user.Username, user.Role);
            
            user.FullName = request.DisplayName;
            user.UpdatedAt = DateTime.UtcNow;
            
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        // ✅ CRITICAL: Generate token with role DIRECTLY from database
        _logger.LogInformation("Generating token for AD user: {Username} with role: {Role}", user.Username, user.Role);
        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        var response = new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            User = MapUserToDto(user),
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };

        return Ok(response);
    }

    // POST: api/auth/register
    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register(RegisterRequest request)
    {
        // Check if user already exists
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
        {
            return BadRequest(new { message = "Username already taken" });
        }

        // Create new user
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            FullName = request.FullName,
            Role = "user", // Default role
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Generate JWT token
        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        var response = new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            User = MapUserToDto(user),
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };

        return Ok(response);
    }

    // POST: api/auth/refresh
    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponse>> RefreshToken(RefreshTokenRequest request)
    {
        var principal = GetPrincipalFromExpiredToken(request.Token);
        if (principal == null)
        {
            return BadRequest(new { message = "Invalid token" });
        }

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return BadRequest(new { message = "Invalid token" });
        }

        // ✅ CRITICAL: Fetch fresh user data with current role from DB
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
            
        if (user == null)
        {
            return BadRequest(new { message = "User not found or inactive" });
        }

        _logger.LogInformation("Token refresh for user: {Username}, Current Role: {Role}", user.Username, user.Role);

        // Generate new tokens with FRESH role data
        var newToken = GenerateJwtToken(user);
        var newRefreshToken = GenerateRefreshToken();

        var response = new LoginResponse
        {
            Token = newToken,
            RefreshToken = newRefreshToken,
            User = MapUserToDto(user),
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };

        return Ok(response);
    }

    // GET: api/auth/me - Get current user with FRESH data from DB
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // ✅ CRITICAL: Always fetch fresh data from DB
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
            
        if (user == null)
        {
            return Unauthorized();
        }

        _logger.LogInformation("Fetching current user: {Username}, Role: {Role}", user.Username, user.Role);

        return Ok(MapUserToDto(user));
    }

    // POST: api/auth/logout
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logged out successfully" });
    }

    // Helper Methods
    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "ToDoOS_Super_Secret_Key_2024_Change_In_Production");
        
        // ✅ CRITICAL: Include role claim from database
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role), // ← Role from DB
            new Claim("FullName", user.FullName ?? ""),
            new Claim("username", user.Username)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(24),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key), 
                SecurityAlgorithms.HmacSha256Signature),
            Issuer = jwtSettings["Issuer"] ?? "ToDoOS",
            Audience = jwtSettings["Audience"] ?? "ToDoOS-Users"
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private string GenerateRandomPasswordHash()
    {
        var randomPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        return HashPassword(randomPassword);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "ToDoOS_Super_Secret_Key_2024_Change_In_Production");

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }
            return principal;
        }
        catch
        {
            return null;
        }
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + "ToDoOS_Salt"));
        return Convert.ToBase64String(hashedBytes);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return HashPassword(password) == hash;
    }

    private static UserDto MapUserToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role, // ← Always from DB
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }
}

// DTOs
public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ADLoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
}

public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
}

public class RefreshTokenRequest
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
