using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using TaqTask.Api.Data;
using TaqTask.Api.Models;
using System.Security.Claims;

namespace TaqTask.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ToDoOSContext _context;

    public NotificationsController(ToDoOSContext context)
    {
        _context = context;
    }

    // GET: api/notifications
    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications()
    {
        var userId = GetCurrentUserId();
        
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .Include(n => n.RelatedCard)
            .Include(n => n.RelatedBoard)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50) // Limit to recent 50 notifications
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                RelatedCardId = n.RelatedCardId,
                RelatedBoardId = n.RelatedBoardId,
                RelatedCardTitle = n.RelatedCard != null ? n.RelatedCard.Title : null,
                RelatedBoardTitle = n.RelatedBoard != null ? n.RelatedBoard.Title : null
            })
            .ToListAsync();

        return notifications;
    }

    // GET: api/notifications/unread
    [HttpGet("unread")]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetUnreadNotifications()
    {
        var userId = GetCurrentUserId();
        
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .Include(n => n.RelatedCard)
            .Include(n => n.RelatedBoard)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                RelatedCardId = n.RelatedCardId,
                RelatedBoardId = n.RelatedBoardId,
                RelatedCardTitle = n.RelatedCard != null ? n.RelatedCard.Title : null,
                RelatedBoardTitle = n.RelatedBoard != null ? n.RelatedBoard.Title : null
            })
            .ToListAsync();

        return notifications;
    }

    // GET: api/notifications/count
    [HttpGet("count")]
    public async Task<ActionResult<NotificationCountDto>> GetNotificationCount()
    {
        var userId = GetCurrentUserId();
        
        var totalCount = await _context.Notifications
            .CountAsync(n => n.UserId == userId);
            
        var unreadCount = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        return new NotificationCountDto
        {
            Total = totalCount,
            Unread = unreadCount
        };
    }

    // GET: api/notifications/5
    [HttpGet("{id}")]
    public async Task<ActionResult<NotificationDto>> GetNotification(int id)
    {
        var userId = GetCurrentUserId();
        
        var notification = await _context.Notifications
            .Where(n => n.Id == id && n.UserId == userId)
            .Include(n => n.RelatedCard)
            .Include(n => n.RelatedBoard)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                RelatedCardId = n.RelatedCardId,
                RelatedBoardId = n.RelatedBoardId,
                RelatedCardTitle = n.RelatedCard != null ? n.RelatedCard.Title : null,
                RelatedBoardTitle = n.RelatedBoard != null ? n.RelatedBoard.Title : null
            })
            .FirstOrDefaultAsync();

        if (notification == null)
        {
            return NotFound();
        }

        return notification;
    }

    // POST: api/notifications
    [HttpPost]
    public async Task<ActionResult<Notification>> CreateNotification(CreateNotificationRequest request)
    {
        var notification = new Notification
        {
            UserId = request.UserId,
            Title = request.Title,
            Message = request.Message,
            Type = request.Type,
            IsRead = false,
            RelatedCardId = request.RelatedCardId,
            RelatedBoardId = request.RelatedBoardId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNotification), new { id = notification.Id }, notification);
    }

    // PUT: api/notifications/5/mark-read
    [HttpPut("{id}/mark-read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = GetCurrentUserId();
        
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null)
        {
            return NotFound();
        }

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PUT: api/notifications/mark-all-read
    [HttpPut("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        
        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Marked {unreadNotifications.Count} notifications as read" });
    }

    // DELETE: api/notifications/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        var userId = GetCurrentUserId();
        
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null)
        {
            return NotFound();
        }

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/notifications/clear-all
    [HttpDelete("clear-all")]
    public async Task<IActionResult> ClearAllNotifications()
    {
        var userId = GetCurrentUserId();
        
        var userNotifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .ToListAsync();

        _context.Notifications.RemoveRange(userNotifications);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Cleared {userNotifications.Count} notifications" });
    }

    // POST: api/notifications/send-to-user
    [HttpPost("send-to-user")]
    public async Task<IActionResult> SendNotificationToUser(SendNotificationRequest request)
    {
        // Check if target user exists
        var targetUser = await _context.Users.FindAsync(request.UserId);
        if (targetUser == null)
        {
            return BadRequest("Target user not found");
        }

        var notification = new Notification
        {
            UserId = request.UserId,
            Title = request.Title,
            Message = request.Message,
            Type = request.Type ?? "info",
            IsRead = false,
            RelatedCardId = request.RelatedCardId,
            RelatedBoardId = request.RelatedBoardId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification sent successfully" });
    }

    // POST: api/notifications/send-to-board-members
    [HttpPost("send-to-board-members")]
    public async Task<IActionResult> SendNotificationToBoardMembers(SendToBoardMembersRequest request)
    {
        // Get all board members
        var boardMembers = await _context.BoardMembers
            .Where(bm => bm.BoardId == request.BoardId)
            .Select(bm => bm.UserId)
            .ToListAsync();

        if (!boardMembers.Any())
        {
            return BadRequest("No board members found");
        }

        var notifications = boardMembers.Select(userId => new Notification
        {
            UserId = userId,
            Title = request.Title,
            Message = request.Message,
            Type = request.Type ?? "info",
            IsRead = false,
            RelatedCardId = request.RelatedCardId,
            RelatedBoardId = request.BoardId,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Notification sent to {notifications.Count} board members" });
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 1; // Default to admin if not found
    }
}

// DTOs for Notifications
public class NotificationDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? RelatedCardId { get; set; }
    public int? RelatedBoardId { get; set; }
    public string? RelatedCardTitle { get; set; }
    public string? RelatedBoardTitle { get; set; }
}

public class NotificationCountDto
{
    public int Total { get; set; }
    public int Unread { get; set; }
}

public class CreateNotificationRequest
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public int? RelatedCardId { get; set; }
    public int? RelatedBoardId { get; set; }
}

public class SendNotificationRequest
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Type { get; set; }
    public int? RelatedCardId { get; set; }
    public int? RelatedBoardId { get; set; }
}

public class SendToBoardMembersRequest
{
    public int BoardId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Type { get; set; }
    public int? RelatedCardId { get; set; }
}
