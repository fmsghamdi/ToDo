using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using TaqTask.Domain;

namespace TaqTask.Api.Models;

[Table("board_members")]
public class BoardMember
{
    [Column("board_id")]
    public int BoardId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("role")]
    public string Role { get; set; } = "member";

    [Column("joined_at")]
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    
    [Column("tenant_id")]
    public int TenantId { get; set; }

    [ForeignKey("TenantId")]
    public virtual Tenant? Tenant { get; set; }
// Navigation properties
    [ForeignKey("BoardId")]
    public virtual Board Board { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}



