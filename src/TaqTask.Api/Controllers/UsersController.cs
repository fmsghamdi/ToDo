using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaqTask.Api.Data;
using TaqTask.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace TaqTask.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ToDoOSContext _context;

    public UsersController(ToDoOSContext context)
    {
        _context = context;
    }

    // GET: api/users
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await _context.Users
            .Where(u => u.IsActive)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullName = u.FullName,
                Avatar = u.Avatar,
                Role = u.Role,
                IsActive = u.IsActive,
                IsAdUser = u.IsAdUser,
                Department = u.Department,
                JobTitle = u.JobTitle,
                Phone = u.Phone,
                CreatedAt = u.CreatedAt,
                LastLogin = u.LastLogin
            })
            .ToListAsync();

        return users;
    }

    // GET: api/users/5
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        var user = await _context.Users
            .Where(u => u.Id == id)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullName = u.FullName,
                Avatar = u.Avatar,
                Role = u.Role,
                IsActive = u.IsActive,
                IsAdUser = u.IsAdUser,
                Department = u.Department,
                JobTitle = u.JobTitle,
                Phone = u.Phone,
                CreatedAt = u.CreatedAt,
                LastLogin = u.LastLogin
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound();
        }

        return user;
    }

    // GET: api/users/profile/{username}
    [HttpGet("profile/{username}")]
    public async Task<ActionResult<UserProfileDto>> GetUserProfile(string username)
    {
        var user = await _context.Users
            .Include(u => u.OwnedBoards)
            .Include(u => u.CreatedCards)
            .Include(u => u.AssignedCards)
            .Where(u => u.Username == username && u.IsActive)
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound();
        }

        var profile = new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Avatar = user.Avatar,
            Role = user.Role,
            Department = user.Department,
            JobTitle = user.JobTitle,
            Phone = user.Phone,
            CreatedAt = user.CreatedAt,
            LastLogin = user.LastLogin,
            TotalBoards = user.OwnedBoards.Count,
            TotalCreatedCards = user.CreatedCards.Count,
            TotalAssignedCards = user.AssignedCards.Count
        };

        return profile;
    }

    // POST: api/users
    [HttpPost]
    public async Task<ActionResult<UserDto>> PostUser(CreateUserRequest request)
    {
        // Check if username or email already exists
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
        {
            return BadRequest("Username already exists");
        }

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest("Email already exists");
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            FullName = request.FullName,
            Avatar = request.Avatar,
            Role = request.Role ?? "user",
            IsActive = true,
            IsAdUser = false,
            Department = request.Department,
            JobTitle = request.JobTitle,
            Phone = request.Phone,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Avatar = user.Avatar,
            Role = user.Role,
            IsActive = user.IsActive,
            IsAdUser = user.IsAdUser,
            Department = user.Department,
            JobTitle = user.JobTitle,
            Phone = user.Phone,
            CreatedAt = user.CreatedAt,
            LastLogin = user.LastLogin
        };

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, userDto);
    }

    // PUT: api/users/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutUser(int id, UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        // Check if new username or email conflicts with existing users
        if (!string.IsNullOrEmpty(request.Username) && request.Username != user.Username)
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username && u.Id != id))
            {
                return BadRequest("Username already exists");
            }
            user.Username = request.Username;
        }

        if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != id))
            {
                return BadRequest("Email already exists");
            }
            user.Email = request.Email;
        }

        // Update other fields
        if (!string.IsNullOrEmpty(request.FullName))
            user.FullName = request.FullName;
        
        if (request.Avatar != null)
            user.Avatar = request.Avatar;
        
        if (!string.IsNullOrEmpty(request.Role))
            user.Role = request.Role;
        
        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;
        
        if (request.Department != null)
            user.Department = request.Department;
        
        if (request.JobTitle != null)
            user.JobTitle = request.JobTitle;
        
        if (request.Phone != null)
            user.Phone = request.Phone;

        // Update password if provided
        if (!string.IsNullOrEmpty(request.NewPassword))
        {
            user.PasswordHash = HashPassword(request.NewPassword);
        }

        user.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!UserExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    // DELETE: api/users/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        // Soft delete - just mark as inactive
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/users/5/change-password
    [HttpPost("{id}/change-password")]
    public async Task<IActionResult> ChangePassword(int id, ChangePasswordRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        // Verify current password
        if (!VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest("Current password is incorrect");
        }

        // Update password
        user.PasswordHash = HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully" });
    }

    // GET: api/users/search?query=john
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<UserDto>>> SearchUsers(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("Query parameter is required");
        }

        var users = await _context.Users
            .Where(u => u.IsActive && 
                       (u.FullName.Contains(query) || 
                        u.Username.Contains(query) || 
                        u.Email.Contains(query)))
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullName = u.FullName,
                Avatar = u.Avatar,
                Role = u.Role,
                IsActive = u.IsActive,
                Department = u.Department,
                JobTitle = u.JobTitle
            })
            .Take(20) // Limit results
            .ToListAsync();

        return users;
    }

    private bool UserExists(int id)
    {
        return _context.Users.Any(e => e.Id == id);
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
}

// DTOs
public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsAdUser { get; set; }
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLogin { get; set; }
}

public class UserProfileDto : UserDto
{
    public int TotalBoards { get; set; }
    public int TotalCreatedCards { get; set; }
    public int TotalAssignedCards { get; set; }
}

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Role { get; set; }
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public string? Phone { get; set; }
}

public class UpdateUserRequest
{
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public string? Avatar { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public string? Phone { get; set; }
    public string? NewPassword { get; set; }
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
