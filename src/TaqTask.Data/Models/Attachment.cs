using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaqTask.Api.Models;

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
