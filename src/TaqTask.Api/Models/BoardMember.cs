using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaqTask.Api.Models;

[Table("board_members")]
public class BoardMember
{
    [Required]
    [Column("board_id")]
    public int BoardId { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [MaxLength(20)]
    [Column("role")]
    public string Role { get; set; } = "member";

    [Column("added_at")]
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("BoardId")]
    public virtual Board Board { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
