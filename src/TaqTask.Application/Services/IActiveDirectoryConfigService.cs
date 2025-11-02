using TaqTask.Domain;
using System.Threading.Tasks;

namespace TaqTask.Application.Services
{
    public interface IActiveDirectoryConfigService
    {
        Task<ActiveDirectoryConfig?> GetActiveDirectoryConfigAsync();
        Task<ActiveDirectoryConfig> SaveActiveDirectoryConfigAsync(ActiveDirectoryConfig config);
    }
}
