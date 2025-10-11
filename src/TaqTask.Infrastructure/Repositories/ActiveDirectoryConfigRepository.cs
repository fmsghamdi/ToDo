using Microsoft.EntityFrameworkCore;
using TaqTask.Application.Interfaces;
using TaqTask.Domain;
using System.Threading.Tasks;
using TaqTask.Data;

namespace TaqTask.Infrastructure.Repositories
{
    public class ActiveDirectoryConfigRepository : IActiveDirectoryConfigRepository
    {
        private readonly ToDoOSContext _context;

        public ActiveDirectoryConfigRepository(ToDoOSContext context)
        {
            _context = context;
        }

        public async Task<ActiveDirectoryConfig?> GetConfigAsync()
        {
            // <-- تم التعديل هنا للاسم الصحيح للجدول في DbContext
            return await _context.ActiveDirectoryConfigurations.AsNoTracking().FirstOrDefaultAsync();
        }

        public async Task<ActiveDirectoryConfig> SaveConfigAsync(ActiveDirectoryConfig config)
        {
            // <-- تم التعديل هنا للاسم الصحيح للجدول في DbContext
            var existingConfig = await _context.ActiveDirectoryConfigurations.FirstOrDefaultAsync();

            if (existingConfig == null) // No existing configuration, add new one
            {
                config.CreatedAt = DateTime.UtcNow;
                config.UpdatedAt = DateTime.UtcNow;
                _context.ActiveDirectoryConfigurations.Add(config); // <-- تم التعديل هنا
            }
            else // Existing configuration found, update it
            {
                // Update properties of the existing entity
                existingConfig.Enabled = config.Enabled;
                existingConfig.Domain = config.Domain;
                existingConfig.ServerUrl = config.ServerUrl;
                existingConfig.BaseDN = config.BaseDN;
                existingConfig.BindUsername = config.BindUsername;
                existingConfig.BindPassword = config.BindPassword;
                existingConfig.UseSSL = config.UseSSL;
                existingConfig.Office365Integration = config.Office365Integration;
                existingConfig.TenantId = config.TenantId;
                existingConfig.ClientId = config.ClientId;
                existingConfig.ClientSecret = config.ClientSecret;
                existingConfig.UpdatedAt = DateTime.UtcNow;

                // Mark the existing entity as modified
                _context.Entry(existingConfig).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync();
            return config; // Return the saved/updated config
        }
    }
}
