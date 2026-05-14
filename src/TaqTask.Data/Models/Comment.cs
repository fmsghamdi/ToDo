using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using TaqTask.Domain;

namespace TaqTask.Api.Models;

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

    
    [Column("tenant_id")]
    public int TenantId { get; set; }

    [ForeignKey("TenantId")]
    public virtual Tenant? Tenant { get; set; }
// Navigation properties
    [ForeignKey("CardId")]
    public virtual Card Card { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}



