/**
 * Unified HTTP Client for Sync API
 * Cookie-based auth — session carried by HttpOnly cookie.
 * No bearer tokens in localStorage.
 */

function safeJsonStringify(obj: any): string {
  const replacer = (_key: string, value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '\uFFFD')
        .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD');
    }
    return value;
  };
  return JSON.stringify(obj, replacer);
}

interface ApiError {
  status: number;
  statusText: string;
  message: string;
  body?: string;
}

export class ApiClient {
  private syncApiKey: string | null = null;
  private readonly DEFAULT_TIMEOUT_MS = 30000;

  constructor() {
    this.syncApiKey = import.meta.env.VITE_SYNC_API_KEY || null;
    this.resolveBaseUrl();

    console.log('Api: initialized', {
      hasSyncApiKey: !!this.syncApiKey,
    });
  }

  private resolveBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL || '';
  }

  private buildHeaders(): Record<string, string> {
    if (!this.syncApiKey) {
      throw new Error('Sync API key not configured');
    }

    return {
      'X-Anonymous-Key': this.syncApiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private async executeRequest<T>(
    url: string,
    config: RequestInit,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        const error: ApiError = {
          status: response.status,
          statusText: response.statusText,
          message: `API request failed: ${response.status} ${response.statusText}`,
          body: errorBody,
        };
        throw error;
      }

      const data = await response.json() as T;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  public async request<T>(
    path: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      auth?: string; // Ignored — auth is now cookie-based
      timeout?: number;
    }
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      timeout = this.DEFAULT_TIMEOUT_MS,
    } = options || {};

    const baseUrl = this.resolveBaseUrl();
    const url = `${baseUrl}${path}`;

    try {
      const headers = this.buildHeaders();

      const config: RequestInit = {
        method,
        headers,
        credentials: 'include',
        ...(method !== 'GET' && body && {
          body: safeJsonStringify(body),
        }),
      };

      const data = await this.executeRequest<T>(url, config, timeout);

      return data;
    } catch (error) {
      const err = error as any;

      if (err.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      throw error;
    }
  }

  public get<T>(path: string, timeout?: number): Promise<T> {
    return this.request<T>(path, { method: 'GET', timeout });
  }

  public post<T>(path: string, body?: any, timeout?: number): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, timeout });
  }

  public put<T>(path: string, body?: any, timeout?: number): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body, timeout });
  }

  public delete<T>(path: string, timeout?: number): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', timeout });
  }

  public getBaseUrl(): string {
    return this.resolveBaseUrl();
  }

  public isConfigured(): boolean {
    return !!this.syncApiKey;
  }
}

export const apiClient = new ApiClient();
