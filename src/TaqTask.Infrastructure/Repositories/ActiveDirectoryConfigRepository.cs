using Microsoft.EntityFrameworkCore;
using TaqTask.Application.Interfaces;
using TaqTask.Domain;
using System.Threading.Tasks;

namespace TaqTask.Infrastructure.Repositories
{
    public class ActiveDirectoryConfigRepository : IActiveDirectoryConfigRepository
    {
        private readonly DbContext _context;

        public ActiveDirectoryConfigRepository(DbContext context)
        {
            _context = context;
        }

        public async Task<ActiveDirectoryConfig?> GetConfigAsync()
        {
            return await ((dynamic)_context).ActiveDirectoryConfigurations.AsNoTracking().FirstOrDefaultAsync();
        }

        public async Task<ActiveDirectoryConfig> SaveConfigAsync(ActiveDirectoryConfig config)
        {
            // Check if a configuration already exists (assuming only one AD config)
            var adConfigs = ((dynamic)_context).ActiveDirectoryConfigurations;
            var existingConfig = await adConfigs.FirstOrDefaultAsync();

            if (existingConfig == null) // No existing configuration, add new one
            {
                config.CreatedAt = DateTime.UtcNow;
                config.UpdatedAt = DateTime.UtcNow;
                adConfigs.Add(config);
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
                config = existingConfig; // Ensure the returned config has the updated values and ID
            }

            await _context.SaveChangesAsync();
            return config; // Return the saved/updated config
        }
    }
}
