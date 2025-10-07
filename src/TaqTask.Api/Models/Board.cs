using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaqTask.Api.Models;

[Table("boards")]
public class Board
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [MaxLength(7)]
    [Column("color")]
    public string Color { get; set; } = "#3B82F6";

    [Required]
    [Column("owner_id")]
    public int OwnerId { get; set; }

    [Column("is_public")]
    public bool IsPublic { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("OwnerId")]
    public virtual User Owner { get; set; } = null!;

    public virtual ICollection<BoardColumn> Columns { get; set; } = new List<BoardColumn>();
    public virtual ICollection<BoardMember> Members { get; set; } = new List<BoardMember>();
    public virtual ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public virtual ICollection<RecurringTask> RecurringTasks { get; set; } = new List<RecurringTask>();
}
