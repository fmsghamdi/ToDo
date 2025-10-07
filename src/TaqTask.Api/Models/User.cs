using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaqTask.Api.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("username")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("full_name")]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(255)]
    [Column("avatar")]
    public string? Avatar { get; set; }

    [MaxLength(20)]
    [Column("role")]
    public string Role { get; set; } = "user";

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("is_ad_user")]
    public bool IsAdUser { get; set; } = false;

    [MaxLength(100)]
    [Column("ad_username")]
    public string? AdUsername { get; set; }

    [MaxLength(100)]
    [Column("department")]
    public string? Department { get; set; }

    [MaxLength(100)]
    [Column("job_title")]
    public string? JobTitle { get; set; }

    [MaxLength(20)]
    [Column("phone")]
    public string? Phone { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("last_login")]
    public DateTime? LastLogin { get; set; }

    // Navigation properties
    public virtual ICollection<Board> OwnedBoards { get; set; } = new List<Board>();
    public virtual ICollection<Card> CreatedCards { get; set; } = new List<Card>();
    public virtual ICollection<Card> AssignedCards { get; set; } = new List<Card>();
    public virtual ICollection<BoardMember> BoardMemberships { get; set; } = new List<BoardMember>();
    public virtual ICollection<CardMember> CardMemberships { get; set; } = new List<CardMember>();
    public virtual ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public virtual ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
