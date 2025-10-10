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
    [MaxLength(255)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(100)]
    [Column("full_name")]
    public string? FullName { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("role")]
    public string Role { get; set; } = "user";

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Board> OwnedBoards { get; set; } = new List<Board>();
    public virtual ICollection<Card> CreatedCards { get; set; } = new List<Card>();
    public virtual ICollection<Card> AssignedCards { get; set; } = new List<Card>();
}
