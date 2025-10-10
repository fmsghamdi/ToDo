using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaqTask.Api.Models;

[Table("cards")]
public class Card
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

    [Required]
    [Column("column_id")]
    public int ColumnId { get; set; }

    [Column("board_id")]
    public int? BoardId { get; set; }

    [Required]
    [Column("created_by")]
    public int CreatedBy { get; set; }

    [Column("assigned_to")]
    public int? AssignedTo { get; set; }

    [MaxLength(10)]
    [Column("priority")]
    public string Priority { get; set; } = "Medium";

    [Column("due_date")]
    public DateTime? DueDate { get; set; }

    [Column("estimated_hours")]
    public double? EstimatedHours { get; set; }

    [Column("actual_hours")]
    public double? ActualHours { get; set; }

    [Column("status")]
    public string Status { get; set; } = "To Do";

    [Column("tags")]
    public string? Tags { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ColumnId")]
    public virtual BoardColumn Column { get; set; } = null!;

    [ForeignKey("BoardId")]
    public virtual Board? Board { get; set; }

    [ForeignKey("CreatedBy")]
    public virtual User Creator { get; set; } = null!;

    [ForeignKey("AssignedTo")]
    public virtual User? AssignedUser { get; set; }
}
