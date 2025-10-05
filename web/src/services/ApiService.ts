// API Service for connecting to backend
class ApiService {
  private baseUrl: string;

  constructor() {
    // Try to detect if API server is running locally
    this.baseUrl = 'http://localhost:5169/api';
  }

  // Generic API call method
  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async checkHealth(): Promise<{ status: string; message: string }> {
    return this.apiCall('/health');
  }

  // Boards API
  async getBoards(): Promise<unknown[]> {
    return this.apiCall('/boards');
  }

  async createBoard(board: { title: string; description?: string; color?: string }): Promise<unknown> {
    return this.apiCall('/boards', {
      method: 'POST',
      body: JSON.stringify(board),
    });
  }

  async updateBoard(id: string, board: { title: string; description?: string; color?: string }): Promise<unknown> {
    return this.apiCall(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(board),
    });
  }

  async deleteBoard(id: string): Promise<{ success: boolean; message?: string }> {
    return this.apiCall(`/boards/${id}`, {
      method: 'DELETE',
    });
  }

  // Cards API (placeholder for now)
  async getCards(): Promise<unknown[]> {
    // For now, return empty array - will implement later
    return [];
  }

  async createCard(card: any): Promise<unknown> {
    // Placeholder - will implement later
    return { id: Date.now().toString(), ...card };
  }

  async updateCard(id: string, card: any): Promise<unknown> {
    // Placeholder - will implement later
    return { id, ...card };
  }

  async deleteCard(id: string): Promise<unknown> {
    // Placeholder - will implement later
    return { success: true };
  }

  // Test if API server is available
  async isApiAvailable(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
