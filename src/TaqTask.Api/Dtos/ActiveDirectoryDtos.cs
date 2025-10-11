namespace TaqTask.Api.Dtos
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
        public string TenantId { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
    }

    public class ADConfigDto
    {
        public string ServerUrl { get; set; } = string.Empty;
        public string BindUsername { get; set; } = string.Empty;
        public string BindPassword { get; set; } = string.Empty;
        public bool UseSSL { get; set; }
        public string BaseDN { get; set; } = string.Empty; // <-- تمت إضافة هذا السطر
    }

    public class ADSearchDto
    {
        public ADConfigDto Config { get; set; } = new();
        public string SearchQuery { get; set; } = string.Empty;
    }

    // <-- تمت إضافة هذا الكلاس الجديد
    public class ADUserDto
    {
        public string? Id { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? DisplayName { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Department { get; set; }
        public string? Title { get; set; }
        public string? Manager { get; set; }
        public bool IsActive { get; set; }
    }
}
