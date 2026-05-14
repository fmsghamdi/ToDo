using Microsoft.EntityFrameworkCore;
using TaqTask.Domain;
using TaqTask.Api.Models;

namespace TaqTask.Data;

public class ToDoOSContext : DbContext
{
    private readonly ITenantProvider? _tenantProvider;

    public ToDoOSContext(DbContextOptions<ToDoOSContext> options) : base(options)
    {
    }

    public ToDoOSContext(DbContextOptions<ToDoOSContext> options, ITenantProvider tenantProvider) : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<ActiveDirectoryConfig> ActiveDirectoryConfigurations { get; set; }
    public DbSet<Board> Boards { get; set; }
    public DbSet<BoardColumn> Columns { get; set; }
    public DbSet<Card> Cards { get; set; }
    public DbSet<CardMember> CardMembers { get; set; }
    public DbSet<BoardMember> BoardMembers { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<TimeEntry> TimeEntries { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<SystemSetting> SystemSettings { get; set; }
    public DbSet<RecurringTask> RecurringTasks { get; set; }
    public DbSet<TenantInvitation> TenantInvitations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Tenant configuration
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("tenants");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Name).IsRequired().HasMaxLength(200);
            entity.Property(t => t.Subdomain).IsRequired().HasMaxLength(100);
            entity.HasIndex(t => t.Subdomain).IsUnique();
            entity.Property(t => t.Email).IsRequired().HasMaxLength(255);
            entity.Property(t => t.LogoUrl).HasMaxLength(500);
            entity.Property(t => t.PrimaryColor).HasMaxLength(7);
            entity.Property(t => t.SecondaryColor).HasMaxLength(7);
            entity.Property(t => t.CompanyAddress).HasMaxLength(500);
            entity.Property(t => t.CompanyPhone).HasMaxLength(50);
            entity.Property(t => t.CompanyWebsite).HasMaxLength(255);
            entity.Property(t => t.SubscriptionPlan).HasMaxLength(50);
            entity.Property(t => t.Features).HasMaxLength(1000);
        });

        // TenantInvitation configuration
        modelBuilder.Entity<TenantInvitation>(entity =>
        {
            entity.ToTable("tenant_invitations");
            entity.HasKey(i => i.Id);
            entity.Property(i => i.InviteeEmail).IsRequired().HasMaxLength(255);
            entity.Property(i => i.Token).IsRequired().HasMaxLength(64);
            entity.HasIndex(i => i.Token).IsUnique();
            entity.Property(i => i.Status).IsRequired().HasMaxLength(20);
            entity.Property(i => i.Role).HasMaxLength(20);
            entity.HasOne(i => i.Tenant)
                .WithMany()
                .HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure relationships
        modelBuilder.Entity<Board>()
            .HasOne(b => b.Owner)
            .WithMany(u => u.OwnedBoards)
            .HasForeignKey(b => b.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BoardColumn>()
            .HasOne(c => c.Board)
            .WithMany(b => b.Columns)
            .HasForeignKey(c => c.BoardId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Card>()
            .HasOne(c => c.Column)
            .WithMany(col => col.Cards)
            .HasForeignKey(c => c.ColumnId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Card>()
            .HasOne(c => c.Creator)
            .WithMany(u => u.CreatedCards)
            .HasForeignKey(c => c.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Card>()
            .HasOne(c => c.AssignedUser)
            .WithMany(u => u.AssignedCards)
            .HasForeignKey(c => c.AssignedTo)
            .OnDelete(DeleteBehavior.SetNull);

        // Configure composite keys
        modelBuilder.Entity<CardMember>()
            .HasKey(cm => new { cm.CardId, cm.UserId });

        modelBuilder.Entity<BoardMember>()
            .HasKey(bm => new { bm.BoardId, bm.UserId });

        // Configure check constraints
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable(table => table.HasCheckConstraint("CK_User_Role", "role IN ('admin', 'manager', 'user')"));
        });

        modelBuilder.Entity<Card>(entity =>
        {
            entity.ToTable(table => table.HasCheckConstraint("CK_Card_Priority", "priority IN ('Low', 'Medium', 'High')"));
        });

        // Configure indexes
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // Tenant relationship configurations
        modelBuilder.Entity<User>()
            .HasOne(u => u.Tenant)
            .WithMany()
            .HasForeignKey(u => u.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Board>()
            .HasOne(b => b.Tenant)
            .WithMany()
            .HasForeignKey(b => b.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BoardColumn>()
            .HasOne(c => c.Tenant)
            .WithMany()
            .HasForeignKey(c => c.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Card>()
            .HasOne(c => c.Tenant)
            .WithMany()
            .HasForeignKey(c => c.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BoardMember>()
            .HasOne(bm => bm.Tenant)
            .WithMany()
            .HasForeignKey(bm => bm.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CardMember>()
            .HasOne(cm => cm.Tenant)
            .WithMany()
            .HasForeignKey(cm => cm.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.Tenant)
            .WithMany()
            .HasForeignKey(c => c.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Attachment>()
            .HasOne(a => a.Tenant)
            .WithMany()
            .HasForeignKey(a => a.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Activity>()
            .HasOne(a => a.Tenant)
            .WithMany()
            .HasForeignKey(a => a.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Tenant)
            .WithMany()
            .HasForeignKey(n => n.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TimeEntry>()
            .HasOne(t => t.Tenant)
            .WithMany()
            .HasForeignKey(t => t.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RecurringTask>()
            .HasOne(r => r.Tenant)
            .WithMany()
            .HasForeignKey(r => r.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SystemSetting>()
            .HasOne(s => s.Tenant)
            .WithMany()
            .HasForeignKey(s => s.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global Query Filters — resolves per-request via singleton ITenantProvider
        // When _tenantProvider is null (e.g. design-time), no filtering is applied.
        modelBuilder.Entity<User>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<Board>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<BoardColumn>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<Card>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<BoardMember>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<CardMember>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<Comment>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<Attachment>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<Activity>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<Notification>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<TimeEntry>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<RecurringTask>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());
        modelBuilder.Entity<SystemSetting>().HasQueryFilter(e =>
            _tenantProvider == null || _tenantProvider.GetTenantId() == null || e.TenantId == _tenantProvider.GetTenantId());

        // Seed data
        modelBuilder.Entity<Tenant>().HasData(
            new Tenant
            {
                Id = 1,
                Name = "ToDoOS",
                Subdomain = "app",
                Email = "admin@todoos.com",
                IsActive = true,
                SubscriptionPlan = "enterprise",
                MaxUsers = 1000,
                MaxBoards = 100,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@todoos.com",
                PasswordHash = "$2b$10$rQZ9QmjlZKZvKJ9QmjlZKO",
                FullName = "مدير النظام",
                Role = "admin",
                IsActive = true,
                TenantId = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );
    }

    public override int SaveChanges()
    {
        SetTenantId();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetTenantId();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void SetTenantId()
    {
        var tenantId = _tenantProvider?.GetTenantId();
        if (tenantId == null || tenantId == 0) return;

        foreach (var entry in ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added))
        {
            var tenantIdProp = entry.Entity.GetType().GetProperty("TenantId");
            if (tenantIdProp != null && tenantIdProp.PropertyType == typeof(int))
            {
                var currentValue = tenantIdProp.GetValue(entry.Entity);
                if (currentValue is int val && val == 0)
                {
                    tenantIdProp.SetValue(entry.Entity, tenantId.Value);
                }
            }
        }
    }
}
