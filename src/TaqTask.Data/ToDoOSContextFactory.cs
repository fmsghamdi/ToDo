using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TaqTask.Data;

/// <summary>
/// Design-time factory for EF Core migrations.
/// Uses a placeholder connection string — override with env var or config in production.
/// </summary>
public class ToDoOSContextFactory : IDesignTimeDbContextFactory<ToDoOSContext>
{
    public ToDoOSContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ToDoOSContext>();
        var connectionString = "Server=localhost;Database=ToDoOS;User=root;Password=;";
        var serverVersion = ServerVersion.Parse("8.0.32-mysql");
        optionsBuilder.UseMySql(connectionString, serverVersion);
        return new ToDoOSContext(optionsBuilder.Options);
    }
}
