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
    [Column("column_id")]
    public int ColumnId { get; set; }

    [Required]
    [MaxLength(200)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [MaxLength(10)]
    [Column("priority")]
    public string Priority { get; set; } = "Medium";

    [Column("due_date")]
    public DateTime? DueDate { get; set; }

    [Column("start_date")]
    public DateTime? StartDate { get; set; }

    [Required]
    [Column("position")]
    public int Position { get; set; }

    [MaxLength(7)]
    [Column("color")]
    public string? Color { get; set; }

    [MaxLength(500)]
    [Column("tags")]
    public string? Tags { get; set; }

    [Column("estimated_hours", TypeName = "decimal(5,2)")]
    public decimal? EstimatedHours { get; set; }

    [Column("actual_hours", TypeName = "decimal(5,2)")]
    public decimal ActualHours { get; set; } = 0;

    [Required]
    [Column("created_by")]
    public int CreatedBy { get; set; }

    [Column("assigned_to")]
    public int? AssignedTo { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ColumnId")]
    public virtual BoardColumn Column { get; set; } = null!;

    [ForeignKey("CreatedBy")]
    public virtual User Creator { get; set; } = null!;

    [ForeignKey("AssignedTo")]
    public virtual User? AssignedUser { get; set; }

    public virtual ICollection<CardMember> Members { get; set; } = new List<CardMember>();
    public virtual ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public virtual ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
