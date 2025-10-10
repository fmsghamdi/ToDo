namespace TaqTask.Api.Models
{
    public class ADConfigSaveDto
    {
        public bool Enabled { get; set; }
        public string Domain { get; set; } = string.Empty;
        public string ServerUrl { get; set; } = string.Empty;
        public string BaseDN { get; set; } = string.Empty;
        public string BindUsername { get; set; } = string.Empty;
        public string BindPassword { get; set; } = string.Empty;
        public bool UseSSL { get; set; }
        public bool Office365Integration { get; set; }
        public string? TenantId { get; set; }
        public string? ClientId { get; set; }
        public string? ClientSecret { get; set; }
    }
}
