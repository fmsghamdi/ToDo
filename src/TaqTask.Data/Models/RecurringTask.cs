using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaqTask.Api.Models;

[Table("recurring_tasks")]
public class RecurringTask
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
    [Column("board_id")]
    public int BoardId { get; set; }

    [Required]
    [Column("column_id")]
    public int ColumnId { get; set; }

    [Column("assigned_to")]
    public int? AssignedTo { get; set; }

    [MaxLength(10)]
    [Column("priority")]
    public string Priority { get; set; } = "Medium";

    [Required]
    [MaxLength(20)]
    [Column("recurrence_type")]
    public string RecurrenceType { get; set; } = string.Empty;

    [Column("recurrence_interval")]
    public int RecurrenceInterval { get; set; } = 1;

    [MaxLength(20)]
    [Column("recurrence_days")]
    public string? RecurrenceDays { get; set; }

    [Required]
    [Column("start_date")]
    public DateTime StartDate { get; set; }

    [Column("end_date")]
    public DateTime? EndDate { get; set; }

    [Column("last_created")]
    public DateTime? LastCreated { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Required]
    [Column("created_by")]
    public int CreatedBy { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("BoardId")]
    public virtual Board Board { get; set; } = null!;

    [ForeignKey("ColumnId")]
    public virtual BoardColumn Column { get; set; } = null!;

    [ForeignKey("AssignedTo")]
    public virtual User? AssignedUser { get; set; }

    [ForeignKey("CreatedBy")]
    public virtual User Creator { get; set; } = null!;
}
