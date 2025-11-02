using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaqTask.Api.Models;

[Table("activities")]
public class Activity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("card_id")]
    public int? CardId { get; set; }

    [Column("board_id")]
    public int? BoardId { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("type")]
    public string Type { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [Column("old_value")]
    public string? OldValue { get; set; }

    [Column("new_value")]
    public string? NewValue { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CardId")]
    public virtual Card? Card { get; set; }

    [ForeignKey("BoardId")]
    public virtual Board? Board { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
