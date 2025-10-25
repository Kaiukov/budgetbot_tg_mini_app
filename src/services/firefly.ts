/**
 * Firefly III API Service
 * Provides utilities for interacting with Firefly III API
 */

export interface FireflyAboutResponse {
  data: {
    version: string;
    api_version: string;
    os: string;
    php_version: string;
  };
}

export interface FireflyUserResponse {
  data: {
    type: string;
    id: string;
    attributes: {
      email: string;
      blocked: boolean;
      blocked_code: string | null;
      role: string;
    };
  };
}

class FireflyService {
  private baseUrl: string;
  private apiToken: string | null = null;

  constructor() {
    // Get configuration from environment variables or localStorage
    this.baseUrl = this.getStoredUrl() || import.meta.env.VITE_FIREFLY_API_URL || '';
    this.apiToken = this.getStoredToken() || import.meta.env.VITE_FIREFLY_API_TOKEN || null;
  }

  /**
   * Get API URL from localStorage
   */
  private getStoredUrl(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('firefly_api_url');
  }

  /**
   * Get API token from localStorage
   */
  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('firefly_api_token');
  }

  /**
   * Set API token and store it
   */
  public setToken(token: string): void {
    this.apiToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('firefly_api_token', token);
    }
  }

  /**
   * Get current API token
   */
  public getToken(): string | null {
    return this.apiToken;
  }

  /**
   * Set base URL
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url;
    if (typeof window !== 'undefined') {
      localStorage.setItem('firefly_api_url', url);
    }
  }

  /**
   * Get base URL
   */
  public getBaseUrl(): string {
    if (this.baseUrl) return this.baseUrl;

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('firefly_api_url');
      if (stored) {
        this.baseUrl = stored;
        return stored;
      }
    }

    return '';
  }

  /**
   * Check if service is configured
   */
  public isConfigured(): boolean {
    return !!(this.getBaseUrl() && this.apiToken);
  }

  /**
   * Make API request
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const token = this.getToken();

    if (!token) {
      throw new Error('API token not configured');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check API connection and get about information
   */
  public async checkConnection(): Promise<{
    success: boolean;
    message: string;
    data?: FireflyAboutResponse;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'API URL or token not configured',
        };
      }

      const data = await this.makeRequest<FireflyAboutResponse>('/api/v1/about');

      return {
        success: true,
        message: `Connected to Firefly III v${data.data.version}`,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current user information
   */
  public async getCurrentUser(): Promise<FireflyUserResponse | null> {
    try {
      return await this.makeRequest<FireflyUserResponse>('/api/v1/about/user');
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Test connection with custom URL and token
   */
  public async testConnection(url: string, token: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${url}/api/v1/about`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        };
      }

      const data: FireflyAboutResponse = await response.json();

      return {
        success: true,
        message: `Connected to Firefly III v${data.data.version}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

// Export singleton instance
export const fireflyService = new FireflyService();
export default fireflyService;
