using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Novell.Directory.Ldap;
using System.Net.Sockets;
using System.Text.Json;
using TaqTask.Application.Services;
using TaqTask.Domain;
using TaqTask.Api.Models;

namespace TaqTask.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class ActiveDirectoryController : ControllerBase
    {
        private readonly ILogger<ActiveDirectoryController> _logger;
        private readonly IConfiguration _configuration;
        private readonly IActiveDirectoryConfigService _adConfigService;

        public ActiveDirectoryController(ILogger<ActiveDirectoryController> logger, IConfiguration configuration, IActiveDirectoryConfigService adConfigService)
        {
            _logger = logger;
            _configuration = configuration;
            _adConfigService = adConfigService;
        }

        // Get AD Configuration
        [HttpGet("config")]
        public async Task<IActionResult> GetConfig()
        {
            _logger.LogInformation("Fetching AD configuration.");
            var config = await _adConfigService.GetActiveDirectoryConfigAsync();
            if (config == null)
            {
                return NotFound(new { message = "Active Directory configuration not found." });
            }
            return Ok(config);
        }

        // Save AD Configuration
        [HttpPost("config")]
        public async Task<IActionResult> SaveConfig([FromBody] ADConfigSaveDto configDto)
        {
            _logger.LogInformation($"Saving AD configuration: {JsonSerializer.Serialize(configDto)}");
            var existingConfig = await _adConfigService.GetActiveDirectoryConfigAsync();
            ActiveDirectoryConfig config;

            if (existingConfig == null)
            {
                config = new ActiveDirectoryConfig
                {
                    Enabled = configDto.Enabled,
                    Domain = configDto.Domain,
                    ServerUrl = configDto.ServerUrl,
                    BaseDN = configDto.BaseDN,
                    BindUsername = configDto.BindUsername,
                    BindPassword = configDto.BindPassword,
                    UseSSL = configDto.UseSSL,
                    Office365Integration = configDto.Office365Integration,
                    TenantId = configDto.TenantId,
                    ClientId = configDto.ClientId,
                    ClientSecret = configDto.ClientSecret
                };
            }
            else
            {
                config = existingConfig;
                config.Enabled = configDto.Enabled;
                config.Domain = configDto.Domain;
                config.ServerUrl = configDto.ServerUrl;
                config.BaseDN = configDto.BaseDN;
                config.BindUsername = configDto.BindUsername;
                config.BindPassword = configDto.BindPassword;
                config.UseSSL = config.UseSSL;
                config.Office365Integration = configDto.Office365Integration;
                config.TenantId = configDto.TenantId;
                config.ClientId = configDto.ClientId;
                config.ClientSecret = configDto.ClientSecret;
            }

            var savedConfig = await _adConfigService.SaveActiveDirectoryConfigAsync(config);
            return Ok(savedConfig);
        }

        // Test AD Connection
        [HttpPost("test-connection")]
        public async Task<IActionResult> TestConnection([FromBody] ADConfigDto config)
        {
            _logger.LogInformation($"Starting AD connection test with config: {JsonSerializer.Serialize(config)}");

            if (string.IsNullOrEmpty(config.ServerUrl) || string.IsNullOrEmpty(config.BindUsername) || string.IsNullOrEmpty(config.BindPassword))
            {
                return BadRequest(new { success = false, message = "Server URL, Bind Username, and Bind Password are required for connection test." });
            }

            try
            {
                using (var ldapConnection = new LdapConnection { SecureSocketLayer = config.UseSSL })
                {
                    await Task.Run(() => ldapConnection.Connect(config.ServerUrl, config.UseSSL ? LdapConnection.DefaultSslPort : LdapConnection.DefaultPort));
                    await Task.Run(() => ldapConnection.Bind(config.BindUsername, config.BindPassword));
                    return Ok(new { success = true, message = "Active Directory connection successful." });
                }
            }
            catch (LdapException ex)
            {
                _logger.LogError(ex, "Active Directory connection failed with LDAP error.");
                return StatusCode(500, new { success = false, message = $"LDAP connection failed: {ex.Message}" });
            }
            catch (SocketException ex)
            {
                _logger.LogError(ex, "Active Directory connection failed with socket error.");
                return StatusCode(500, new { success = false, message = $"Network connection failed: {ex.Message}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred during Active Directory connection test.");
                return StatusCode(500, new { success = false, message = $"An unexpected error occurred: {ex.Message}" });
            }
        }

        // Search AD Users
        [HttpPost("search-users")]
        public async Task<IActionResult> SearchUsers([FromBody] ADSearchDto searchDto)
        {
            _logger.LogInformation($"Searching AD users with config: {JsonSerializer.Serialize(searchDto.Config)} and query: {searchDto.SearchQuery}");

            var config = searchDto.Config;
            if (string.IsNullOrEmpty(config.ServerUrl) || string.IsNullOrEmpty(config.BindUsername) || string.IsNullOrEmpty(config.BindPassword) || string.IsNullOrEmpty(config.BaseDN))
            {
                return BadRequest(new { success = false, message = "Server URL, Bind Username, Bind Password, and Base DN are required for user search." });
            }

            try
            {
                using (var ldapConnection = new LdapConnection { SecureSocketLayer = config.UseSSL })
                {
                    await Task.Run(() => ldapConnection.Connect(config.ServerUrl, config.UseSSL ? LdapConnection.DefaultSslPort : LdapConnection.DefaultPort));
                    await Task.Run(() => ldapConnection.Bind(config.BindUsername, config.BindPassword));

                    string searchFilter = string.IsNullOrEmpty(searchDto.SearchQuery)
                        ? "(objectClass=user)"
                        : $"(&(objectClass=user)(|(sAMAccountName=*{searchDto.SearchQuery}*)(displayName=*{searchDto.SearchQuery}*)(mail=*{searchDto.SearchQuery}*)))";

                    var searchResults = await Task.Run(() => ldapConnection.Search(
                        config.BaseDN,
                        2, // SCOPE_SUB
                        searchFilter,
                        new[] { "sAMAccountName", "displayName", "mail", "givenName", "sn", "department", "title", "manager" },
                        false
                    ));

                    var users = new List<ADUserDto>();
                    while (searchResults.HasMore())
                    {
                        var entry = searchResults.Next();
                        if (entry != null)
                        {
                            users.Add(new ADUserDto
                            {
                                Id = entry.GetAttribute("sAMAccountName")?.StringValue,
                                Username = entry.GetAttribute("sAMAccountName")?.StringValue,
                                Email = entry.GetAttribute("mail")?.StringValue,
                                DisplayName = entry.GetAttribute("displayName")?.StringValue,
                                FirstName = entry.GetAttribute("givenName")?.StringValue,
                                LastName = entry.GetAttribute("sn")?.StringValue,
                                Department = entry.GetAttribute("department")?.StringValue,
                                Title = entry.GetAttribute("title")?.StringValue,
                                Manager = entry.GetAttribute("manager")?.StringValue,
                                IsActive = true // Assuming all found users are active
                            });
                        }
                    }
                    return Ok(users);
                }
            }
            catch (LdapException ex)
            {
                _logger.LogError(ex, "Active Directory user search failed with LDAP error.");
                return StatusCode(500, new { success = false, message = $"LDAP search failed: {ex.Message}" });
            }
            catch (SocketException ex)
            {
                _logger.LogError(ex, "Active Directory user search failed with socket error.");
                return StatusCode(500, new { success = false, message = $"Network connection failed: {ex.Message}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred during Active Directory user search.");
                return StatusCode(500, new { success = false, message = $"An unexpected error occurred: {ex.Message}" });
            }
        }
    }
}
