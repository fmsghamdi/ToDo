using TaqTask.Domain;
using System.Threading.Tasks;

namespace TaqTask.Application.Interfaces
{
    public interface IActiveDirectoryConfigRepository
    {
        Task<ActiveDirectoryConfig?> GetConfigAsync();
        Task<ActiveDirectoryConfig> SaveConfigAsync(ActiveDirectoryConfig config);
    }
}
