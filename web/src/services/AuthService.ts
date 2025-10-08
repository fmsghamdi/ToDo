// Active Directory / Office 365 Authentication Service
export interface ADConfig {
  enabled: boolean;
  domain: string;
  serverUrl: string;
  baseDN: string;
  bindUsername: string;
  bindPassword: string;
  useSSL: boolean;
  office365Integration: boolean;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface ADUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  department: string;
  title: string;
  manager?: string;
  groups: string[];
  isActive: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: ADUser;
  error?: string;
  token?: string;
}

class AuthService {
  private adConfig: ADConfig | null = null;

  // Initialize AD configuration
  setADConfig(config: ADConfig) {
    this.adConfig = config;
    localStorage.setItem('adConfig', JSON.stringify(config));
  }

  // Get AD configuration
  getADConfig(): ADConfig | null {
    if (this.adConfig) return this.adConfig;
    
    const saved = localStorage.getItem('adConfig');
    if (saved) {
      this.adConfig = JSON.parse(saved);
      return this.adConfig;
    }
    
    return null;
  }

  // Test AD connection
  async testADConnection(config: ADConfig): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing AD connection with config:', config);
      
      if (!config.domain || !config.serverUrl) {
        return { success: false, message: 'Domain and Server URL are required' };
      }

      // Call real API endpoint
      const response = await fetch('/api/ActiveDirectory/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('AD connection test result:', result);
      
      return result;
    } catch (error) {
      console.error('AD connection test failed:', error);
      return { 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  // Authenticate user with AD
  async authenticateWithAD(username: string, password: string): Promise<AuthResult> {
    const config = this.getADConfig();
    
    if (!config || !config.enabled) {
      return { success: false, error: 'Active Directory authentication is not enabled' };
    }

    try {
      // In real implementation, this would:
      // 1. Connect to AD server using LDAP
      // 2. Authenticate user credentials
      // 3. Retrieve user information and groups
      // 4. Return user data

      console.log(`Authenticating ${username} with AD...`);
      
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful authentication for demo
      if (username && password) {
        const mockUser: ADUser = {
          id: `ad_${Date.now()}`,
          username: username,
          email: `${username}@${config.domain}`,
          displayName: this.generateDisplayName(username),
          firstName: username.split('.')[0] || username,
          lastName: username.split('.')[1] || '',
          department: 'IT Department',
          title: 'Employee',
          groups: ['Domain Users', 'ToDoOS Users'],
          isActive: true
        };

        return {
          success: true,
          user: mockUser,
          token: this.generateJWTToken(mockUser)
        };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      return { 
        success: false, 
        error: `Authentication failed: ${error}` 
      };
    }
  }

  // Authenticate with Office 365
  async authenticateWithOffice365(): Promise<AuthResult> {
    const config = this.getADConfig();
    
    if (!config || !config.office365Integration) {
      return { success: false, error: 'Office 365 integration is not enabled' };
    }

    try {
      // In real implementation, this would use Microsoft Graph API
      // and MSAL (Microsoft Authentication Library)
      console.log('Authenticating with Office 365...');
      
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful O365 authentication
      const mockUser: ADUser = {
        id: `o365_${Date.now()}`,
        username: 'user@organization.gov.sa',
        email: 'user@organization.gov.sa',
        displayName: 'أحمد محمد السعودي',
        firstName: 'أحمد',
        lastName: 'السعودي',
        department: 'وزارة التقنية',
        title: 'مطور أنظمة',
        groups: ['ToDoOS Users', 'Developers'],
        isActive: true
      };

      return {
        success: true,
        user: mockUser,
        token: this.generateJWTToken(mockUser)
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Office 365 authentication failed: ${error}` 
      };
    }
  }

  // Get user groups from AD
  async getUserGroups(username: string): Promise<string[]> {
    const config = this.getADConfig();
    
    if (!config || !config.enabled) {
      return [];
    }

    try {
      // In real implementation, query AD for user groups
      console.log(`Getting groups for ${username}...`);
      
      // Mock groups based on username
      const mockGroups = [
        'Domain Users',
        'ToDoOS Users',
        username.includes('admin') ? 'Administrators' : 'Employees',
        username.includes('manager') ? 'Managers' : 'Staff'
      ];

      return mockGroups;
    } catch (error) {
      console.error('Failed to get user groups:', error);
      return [];
    }
  }

  // Sync users from AD
  async syncUsersFromAD(searchQuery: string = ''): Promise<ADUser[]> {
    const config = this.getADConfig();
    
    console.log('=== AD Sync Started ===');
    console.log('Config:', config);
    console.log('Search Query:', searchQuery);
    
    if (!config || !config.enabled) {
      console.error('AD not enabled or config missing');
      return [];
    }

    try {
      console.log('Calling API endpoint: /api/ActiveDirectory/search-users');
      
      const requestBody = {
        config: {
          enabled: config.enabled,
          domain: config.domain,
          serverUrl: config.serverUrl,
          baseDN: config.baseDN,
          bindUsername: config.bindUsername,
          bindPassword: config.bindPassword,
          useSSL: config.useSSL
        },
        searchQuery: searchQuery
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      // Call real API endpoint
      const response = await fetch('/api/ActiveDirectory/search-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const users: ADUser[] = await response.json();
      console.log('Received users from API:', users.length, 'users');
      console.log('First 3 users:', users.slice(0, 3));
      
      // Transform API response to ADUser format
      const transformedUsers = users.map(user => ({
        id: user.id || `ad_${Date.now()}`,
        username: user.username || '',
        email: user.email || '',
        displayName: user.displayName || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        department: user.department || '',
        title: user.title || '',
        manager: user.manager,
        groups: user.groups || [],
        isActive: user.isActive !== false
      }));
      
      console.log('=== AD Sync Completed Successfully ===');
      return transformedUsers;
    } catch (error) {
      console.error('=== AD Sync Failed ===');
      console.error('Error details:', error);
      
      // Return empty array on error so UI can show appropriate message
      return [];
    }
  }

  // Validate JWT token
  validateToken(token: string): boolean {
    try {
      // In real implementation, validate JWT signature and expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  // Generate display name from username
  private generateDisplayName(username: string): string {
    const parts = username.split('.');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return username;
  }

  // Generate JWT token (mock implementation)
  private generateJWTToken(user: ADUser): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      username: user.username,
      email: user.email,
      name: user.displayName,
      groups: user.groups,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = btoa('mock-signature');
    
    return `${header}.${payload}.${signature}`;
  }

  // Logout and clear tokens
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }
}

export const authService = new AuthService();
