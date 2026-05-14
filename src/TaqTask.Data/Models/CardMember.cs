using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using TaqTask.Domain;

namespace TaqTask.Api.Models;

[Table("card_members")]
public class CardMember
{
    [Column("card_id")]
    public int CardId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("joined_at")]
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    
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



