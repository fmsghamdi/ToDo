using Microsoft.EntityFrameworkCore;
using TaqTask.Domain;
using TaqTask.Api.Models;

namespace TaqTask.Data;

public class ToDoOSContext : DbContext
{
    public ToDoOSContext(DbContextOptions<ToDoOSContext> options) : base(options)
    {
    }

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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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

        // Seed data
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@todoos.com",
                PasswordHash = "$2b$10$rQZ9QmjlZKZvKJ9QmjlZKO", // This should be properly hashed
                FullName = "مدير النظام",
                Role = "admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );
    }
}
