using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaqTask.Api.Models;

[Table("columns")]
public class BoardColumn
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("board_id")]
    public int BoardId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column("position")]
    public int Position { get; set; }

    [MaxLength(7)]
    [Column("color")]
    public string Color { get; set; } = "#6B7280";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("BoardId")]
    public virtual Board Board { get; set; } = null!;

    public virtual ICollection<Card> Cards { get; set; } = new List<Card>();
}
