using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Novell.Directory.Ldap;

namespace TaqTask.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class ActiveDirectoryController : ControllerBase
    {
        private readonly ILogger<ActiveDirectoryController> _logger;
        private readonly IConfiguration _configuration;

        public ActiveDirectoryController(ILogger<ActiveDirectoryController> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        // Test AD Connection
        [HttpPost("test-connection")]
        public async Task<IActionResult> TestConnection([FromBody] ADConfigDto config)
        {
            try
            {
                using var connection = new LdapConnection();
                connection.Connect(config.ServerUrl, config.UseSSL ? 636 : 389);
                
                if (config.UseSSL)
                {
                    connection.SecureSocketLayer = true;
                }
                
                var bindDn = FormatBindDn(config);
                connection.Bind(bindDn, config.BindPassword);
                
                return Ok(new { 
                    success = true, 
                    message = $"Successfully connected to {config.Domain}" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AD connection test failed");
                return Ok(new { 
                    success = false, 
                    message = $"Connection failed: {ex.Message}" 
                });
            }
        }

        // Search users in AD
        [HttpPost("search-users")]
        public async Task<IActionResult> SearchUsers([FromBody] ADSearchRequest request)
        {
            try
            {
                var config = request.Config;
                var users = new List<ADUserDto>();

                _logger.LogInformation($"Connecting to AD: {config.ServerUrl}");

                using var connection = new LdapConnection();
                connection.Connect(config.ServerUrl, config.UseSSL ? 636 : 389);
                
                if (config.UseSSL)
                {
                    connection.SecureSocketLayer = true;
                }

                var bindDn = FormatBindDn(config);
                _logger.LogInformation($"Binding with: {bindDn}");
                connection.Bind(bindDn, config.BindPassword);
                
                _logger.LogInformation("Connected and bound successfully");

                // Build LDAP filter
                string filter = BuildSearchFilter(request.SearchQuery);
                _logger.LogInformation($"Search filter: {filter}");
                
                var searchConstraints = new LdapSearchConstraints
                {
                    MaxResults = 1000,
                    TimeLimit = 30000 // 30 seconds
                };

                var searchResults = connection.Search(
                    config.BaseDN,
                    LdapConnection.ScopeSub,
                    filter,
                    new string[] { 
                        "sAMAccountName", 
                        "mail", 
                        "displayName", 
                        "givenName", 
                        "sn", 
                        "department", 
                        "title", 
                        "manager",
                        "memberOf",
                        "userAccountControl"
                    },
                    false,
                    searchConstraints
                );

                var count = 0;
                while (searchResults.HasMore())
                {
                    try
                    {
                        var entry = searchResults.Next();
                        count++;
                        
                        var user = new ADUserDto
                        {
                            Id = Guid.NewGuid().ToString(),
                            Username = GetAttributeValue(entry, "sAMAccountName"),
                            Email = GetAttributeValue(entry, "mail"),
                            DisplayName = GetAttributeValue(entry, "displayName"),
                            FirstName = GetAttributeValue(entry, "givenName"),
                            LastName = GetAttributeValue(entry, "sn"),
                            Department = GetAttributeValue(entry, "department"),
                            Title = GetAttributeValue(entry, "title"),
                            Manager = GetAttributeValue(entry, "manager"),
                            Groups = GetAttributeValues(entry, "memberOf")
                                .Select(dn => ExtractCNFromDN(dn))
                                .ToList(),
                            IsActive = IsUserActive(entry)
                        };

                        // Only add users with email addresses
                        if (!string.IsNullOrEmpty(user.Email))
                        {
                            users.Add(user);
                        }
                    }
                    catch (LdapException ex)
                    {
                        if (ex.ResultCode == LdapException.SizeLimitExceeded)
                        {
                            break;
                        }
                        _logger.LogWarning(ex, "Error processing AD entry");
                    }
                }

                _logger.LogInformation($"Found {count} total entries, returning {users.Count} users with email");
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AD search failed");
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        // Authenticate user with AD
        [HttpPost("authenticate")]
        [AllowAnonymous]
        public async Task<IActionResult> Authenticate([FromBody] ADAuthRequest request)
        {
            try
            {
                var config = request.Config;
                
                using var connection = new LdapConnection();
                connection.Connect(config.ServerUrl, config.UseSSL ? 636 : 389);
                
                if (config.UseSSL)
                {
                    connection.SecureSocketLayer = true;
                }

                // Try to bind with user credentials
                var userDn = $"{request.Username}@{config.Domain}";
                connection.Bind(userDn, request.Password);

                // Get user information
                var searchResults = connection.Search(
                    config.BaseDN,
                    LdapConnection.ScopeSub,
                    $"(sAMAccountName={request.Username})",
                    new string[] { 
                        "sAMAccountName", 
                        "mail", 
                        "displayName", 
                        "givenName", 
                        "sn", 
                        "department", 
                        "title",
                        "memberOf"
                    },
                    false
                );

                if (searchResults.HasMore())
                {
                    var entry = searchResults.Next();
                    var user = new ADUserDto
                    {
                        Id = Guid.NewGuid().ToString(),
                        Username = GetAttributeValue(entry, "sAMAccountName"),
                        Email = GetAttributeValue(entry, "mail"),
                        DisplayName = GetAttributeValue(entry, "displayName"),
                        FirstName = GetAttributeValue(entry, "givenName"),
                        LastName = GetAttributeValue(entry, "sn"),
                        Department = GetAttributeValue(entry, "department"),
                        Title = GetAttributeValue(entry, "title"),
                        Groups = GetAttributeValues(entry, "memberOf")
                            .Select(dn => ExtractCNFromDN(dn))
                            .ToList(),
                        IsActive = true
                    };

                    return Ok(new { success = true, user });
                }

                return Ok(new { success = false, error = "User not found" });
            }
            catch (LdapException ex)
            {
                _logger.LogError(ex, "AD authentication failed");
                return Ok(new { success = false, error = "Invalid credentials" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AD authentication error");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Helper methods
        private string FormatBindDn(ADConfigDto config)
        {
            // If username already contains @domain, use it as-is
            if (config.BindUsername.Contains("@"))
            {
                return config.BindUsername;
            }
            // If username contains backslash (DOMAIN\user), convert to UPN
            else if (config.BindUsername.Contains("\\"))
            {
                var parts = config.BindUsername.Split('\\');
                return $"{parts[1]}@{config.Domain}";
            }
            // Otherwise, append @domain
            else
            {
                return $"{config.BindUsername}@{config.Domain}";
            }
        }

        private string BuildSearchFilter(string searchQuery)
        {
            if (string.IsNullOrWhiteSpace(searchQuery))
            {
                return "(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))";
            }

            return $"(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2))(|(sAMAccountName=*{searchQuery}*)(mail=*{searchQuery}*)(displayName=*{searchQuery}*)(givenName=*{searchQuery}*)(sn=*{searchQuery}*)(department=*{searchQuery}*)))";
        }

        private string GetAttributeValue(LdapEntry entry, string attributeName)
        {
            try
            {
                var attribute = entry.GetAttribute(attributeName);
                return attribute?.StringValue ?? string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }

        private List<string> GetAttributeValues(LdapEntry entry, string attributeName)
        {
            var values = new List<string>();
            try
            {
                var attribute = entry.GetAttribute(attributeName);
                if (attribute != null)
                {
                    foreach (var value in attribute.StringValueArray)
                    {
                        if (!string.IsNullOrEmpty(value))
                        {
                            values.Add(value);
                        }
                    }
                }
            }
            catch { }
            return values;
        }

        private string ExtractCNFromDN(string dn)
        {
            try
            {
                if (string.IsNullOrEmpty(dn)) return string.Empty;
                
                var cnIndex = dn.IndexOf("CN=", StringComparison.OrdinalIgnoreCase);
                if (cnIndex < 0) return dn;
                
                var start = cnIndex + 3;
                var commaIndex = dn.IndexOf(',', start);
                
                if (commaIndex < 0) return dn.Substring(start);
                
                return dn.Substring(start, commaIndex - start);
            }
            catch
            {
                return dn;
            }
        }

        private bool IsUserActive(LdapEntry entry)
        {
            try
            {
                var uacValue = GetAttributeValue(entry, "userAccountControl");
                if (int.TryParse(uacValue, out int uac))
                {
                    // Check if account is disabled (bit 2)
                    return (uac & 0x0002) == 0;
                }
            }
            catch { }
            return true;
        }
    }

    // DTOs
    public class ADConfigDto
    {
        public bool Enabled { get; set; }
        public string Domain { get; set; } = string.Empty;
        public string ServerUrl { get; set; } = string.Empty;
        public string BaseDN { get; set; } = string.Empty;
        public string BindUsername { get; set; } = string.Empty;
        public string BindPassword { get; set; } = string.Empty;
        public bool UseSSL { get; set; }
    }

    public class ADSearchRequest
    {
        public ADConfigDto Config { get; set; } = new();
        public string SearchQuery { get; set; } = string.Empty;
    }

    public class ADAuthRequest
    {
        public ADConfigDto Config { get; set; } = new();
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ADUserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Manager { get; set; } = string.Empty;
        public List<string> Groups { get; set; } = new();
        public bool IsActive { get; set; }
    }
}
