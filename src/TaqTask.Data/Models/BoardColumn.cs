using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using TaqTask.Domain;

namespace TaqTask.Api.Models;

[Table("board_columns")]
public class BoardColumn
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("board_id")]
    public int BoardId { get; set; }

    [Column("position")]
    public int Position { get; set; } = 0;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    
    [Column("tenant_id")]
    public int TenantId { get; set; }

    [ForeignKey("TenantId")]
    public virtual Tenant? Tenant { get; set; }
// Navigation properties
    [ForeignKey("BoardId")]
    public virtual Board Board { get; set; } = null!;

    public virtual ICollection<Card> Cards { get; set; } = new List<Card>();
}



