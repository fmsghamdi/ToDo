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

[Table("time_entries")]
public class TimeEntry
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("card_id")]
    public int CardId { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("duration")]
    public int Duration { get; set; } // in minutes

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    [Column("start_time")]
    public DateTime? StartTime { get; set; }

    [Column("end_time")]
    public DateTime? EndTime { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CardId")]
    public virtual Card Card { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

[Table("attachments")]
public class Attachment
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("card_id")]
    public int CardId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("filename")]
    public string Filename { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("original_name")]
    public string OriginalName { get; set; } = string.Empty;

    [Required]
    [Column("file_size")]
    public long FileSize { get; set; }

    [MaxLength(100)]
    [Column("mime_type")]
    public string? MimeType { get; set; }

    [Required]
    [MaxLength(500)]
    [Column("file_path")]
    public string FilePath { get; set; } = string.Empty;

    [Required]
    [Column("uploaded_by")]
    public int UploadedBy { get; set; }

    [Column("uploaded_at")]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CardId")]
    public virtual Card Card { get; set; } = null!;

    [ForeignKey("UploadedBy")]
    public virtual User UploadedByUser { get; set; } = null!;
}

[Table("comments")]
public class Comment
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("card_id")]
    public int CardId { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CardId")]
    public virtual Card Card { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

[Table("notifications")]
public class Notification
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [MaxLength(200)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column("type")]
    public string Type { get; set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("related_card_id")]
    public int? RelatedCardId { get; set; }

    [Column("related_board_id")]
    public int? RelatedBoardId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("RelatedCardId")]
    public virtual Card? RelatedCard { get; set; }

    [ForeignKey("RelatedBoardId")]
    public virtual Board? RelatedBoard { get; set; }
}

[Table("system_settings")]
public class SystemSetting
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("setting_key")]
    public string SettingKey { get; set; } = string.Empty;

    [Column("setting_value")]
    public string? SettingValue { get; set; }

    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

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

// AD DTOs
public class ADConfigDto
{
    public bool Enabled { get; set; }
    public string Domain { get; set; } = string.Empty;
    public string ServerUrl { get; set; } = string.Empty;
    public string BaseDN { get; set; } = string.Empty;
    public string BindUsername { get; set; } = string.Empty;
    public string BindPassword { get; set; } = string.Empty;
    public bool UseSSL { get; set; }
    public bool Office365Integration { get; set; }
    public string? TenantId { get; set; }
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }
}

public class ADSearchDto
{
    public ADConfigDto Config { get; set; } = null!;
    public string SearchQuery { get; set; } = string.Empty;
}

public class ADUserDto
{
    public string? Id { get; set; }
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? DisplayName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Department { get; set; }
    public string? Title { get; set; }
    public string? Manager { get; set; }
    public bool IsActive { get; set; }
}
