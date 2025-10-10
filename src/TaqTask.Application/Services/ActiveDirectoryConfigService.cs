using TaqTask.Application.Interfaces;
using TaqTask.Domain;
using System.Threading.Tasks;

namespace TaqTask.Application.Services
{
    public class ActiveDirectoryConfigService : IActiveDirectoryConfigService
    {
        private readonly IActiveDirectoryConfigRepository _repository;

        public ActiveDirectoryConfigService(IActiveDirectoryConfigRepository repository)
        {
            _repository = repository;
        }

        public async Task<ActiveDirectoryConfig?> GetActiveDirectoryConfigAsync()
        {
            return await _repository.GetConfigAsync();
        }

        public async Task<ActiveDirectoryConfig> SaveActiveDirectoryConfigAsync(ActiveDirectoryConfig config)
        {
            return await _repository.SaveConfigAsync(config);
        }
    }
}
