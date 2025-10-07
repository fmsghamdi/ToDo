using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.DirectoryServices.Protocols;
using System.Net;

namespace TaqTask.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
                using var connection = CreateLdapConnection(config);
                connection.Bind();
                
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

                using var connection = CreateLdapConnection(config);
                connection.Bind();

                // Build LDAP filter
                string filter = BuildSearchFilter(request.SearchQuery);
                
                var searchRequest = new SearchRequest(
                    config.BaseDN,
                    filter,
                    SearchScope.Subtree,
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
                    }
                );

                var response = (SearchResponse)connection.SendRequest(searchRequest);

                foreach (SearchResultEntry entry in response.Entries)
                {
                    try
                    {
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
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error processing AD entry");
                    }
                }

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AD search failed");
                return StatusCode(500, new { error = ex.Message });
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
                var identifier = new LdapDirectoryIdentifier(config.ServerUrl, config.UseSSL ? 636 : 389);
                
                using var connection = new LdapConnection(identifier)
                {
                    AuthType = AuthType.Basic
                };

                if (config.UseSSL)
                {
                    connection.SessionOptions.SecureSocketLayer = true;
                    connection.SessionOptions.VerifyServerCertificate = (conn, cert) => true;
                }

                // Try to bind with user credentials
                var credentials = new NetworkCredential(
                    $"{request.Username}@{config.Domain}",
                    request.Password
                );
                
                connection.Bind(credentials);

                // Get user information
                var searchRequest = new SearchRequest(
                    config.BaseDN,
                    $"(sAMAccountName={request.Username})",
                    SearchScope.Subtree,
                    new string[] { 
                        "sAMAccountName", 
                        "mail", 
                        "displayName", 
                        "givenName", 
                        "sn", 
                        "department", 
                        "title",
                        "memberOf"
                    }
                );

                var response = (SearchResponse)connection.SendRequest(searchRequest);

                if (response.Entries.Count > 0)
                {
                    var entry = response.Entries[0];
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
        private LdapConnection CreateLdapConnection(ADConfigDto config)
        {
            try
            {
                _logger.LogInformation($"Creating LDAP connection to {config.ServerUrl}:{(config.UseSSL ? 636 : 389)}");
                
                var identifier = new LdapDirectoryIdentifier(config.ServerUrl, config.UseSSL ? 636 : 389);
                var connection = new LdapConnection(identifier)
                {
                    AuthType = AuthType.Basic,
                    Timeout = TimeSpan.FromSeconds(30)
                };

                if (config.UseSSL)
                {
                    connection.SessionOptions.SecureSocketLayer = true;
                    connection.SessionOptions.VerifyServerCertificate = (conn, cert) => true;
                }
                else
                {
                    // For non-SSL, set protocol version
                    connection.SessionOptions.ProtocolVersion = 3;
                }

                // Try different credential formats
                NetworkCredential credentials;
                
                // If username already contains @domain, use it as-is
                if (config.BindUsername.Contains("@"))
                {
                    _logger.LogInformation($"Using UPN format: {config.BindUsername}");
                    credentials = new NetworkCredential(config.BindUsername, config.BindPassword);
                }
                // If username contains backslash (DOMAIN\user), use it as-is
                else if (config.BindUsername.Contains("\\"))
                {
                    _logger.LogInformation($"Using DOMAIN\\user format: {config.BindUsername}");
                    credentials = new NetworkCredential(config.BindUsername, config.BindPassword);
                }
                // Otherwise, try UPN format (user@domain)
                else
                {
                    var upn = config.BindUsername.EndsWith($".{config.Domain}") 
                        ? config.BindUsername 
                        : $"{config.BindUsername}@{config.Domain}";
                    _logger.LogInformation($"Constructed UPN: {upn}");
                    credentials = new NetworkCredential(upn, config.BindPassword);
                }
                
                connection.Credential = credentials;

                _logger.LogInformation("LDAP connection created successfully");
                return connection;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create LDAP connection");
                throw;
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

        private string GetAttributeValue(SearchResultEntry entry, string attributeName)
        {
            try
            {
                if (entry.Attributes.Contains(attributeName))
                {
                    var attribute = entry.Attributes[attributeName];
                    if (attribute != null && attribute.Count > 0)
                    {
                        return attribute[0]?.ToString() ?? string.Empty;
                    }
                }
            }
            catch { }
            return string.Empty;
        }

        private List<string> GetAttributeValues(SearchResultEntry entry, string attributeName)
        {
            var values = new List<string>();
            try
            {
                if (entry.Attributes.Contains(attributeName))
                {
                    var attribute = entry.Attributes[attributeName];
                    if (attribute != null)
                    {
                        for (int i = 0; i < attribute.Count; i++)
                        {
                            var value = attribute[i]?.ToString();
                            if (!string.IsNullOrEmpty(value))
                            {
                                values.Add(value);
                            }
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

        private bool IsUserActive(SearchResultEntry entry)
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
