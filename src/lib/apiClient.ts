const TOKEN_KEY = 'access_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch('/api/v1/auth/refresh', { method: 'POST' });
        if (!response.ok) return null;
        const data = (await response.json()) as { accessToken?: string };
        if (data.accessToken) {
          setToken(data.accessToken);
          return data.accessToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function extractErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.length > 0) {
      return record.message;
    }
    if (record.errors && typeof record.errors === 'object') {
      const values = Object.values(record.errors as Record<string, unknown>);
      if (values.length > 0) {
        return values.map(String).join(', ');
      }
    }
  }
  return `Request failed with status ${status}`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(path, { ...options, headers });

  const isAuthAttempt = path.includes('/auth/login') || path.includes('/auth/register');

  if (response.status === 401 && !isAuthAttempt) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = new Headers(options.headers);
      if (options.body !== undefined) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(path, { ...options, headers: retryHeaders });
    }
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, extractErrorMessage(body, response.status));
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}