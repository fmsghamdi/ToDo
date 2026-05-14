using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using TaqTask.Domain;

namespace TaqTask.Api.Models;

[Table("boards")]
public class Board
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("owner_id")]
    public int OwnerId { get; set; }

    [Column("background_color")]
    public string? BackgroundColor { get; set; }

    [Column("is_archived")]
    public bool IsArchived { get; set; } = false;

    [Column("is_public")]
    public bool IsPublic { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    
    [Column("tenant_id")]
    public int TenantId { get; set; }

    [ForeignKey("TenantId")]
    public virtual Tenant? Tenant { get; set; }
// Navigation properties
    [ForeignKey("OwnerId")]
    public virtual User Owner { get; set; } = null!;

    public virtual ICollection<BoardColumn> Columns { get; set; } = new List<BoardColumn>();
}



