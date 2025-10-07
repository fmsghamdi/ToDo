using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaqTask.Api.Models;

[Table("card_members")]
public class CardMember
{
    [Required]
    [Column("card_id")]
    public int CardId { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("added_at")]
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CardId")]
    public virtual Card Card { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
