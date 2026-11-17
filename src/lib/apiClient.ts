const TOKEN_KEY = 'access_token';
const LANGUAGE_KEY = 'app_lang';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function currentLanguage(): 'en' | 'pt' {
  return localStorage.getItem(LANGUAGE_KEY) === 'pt' ? 'pt' : 'en';
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
        if (!response.ok) {
          // The refresh cookie is gone or rejected: the stored access token is
          // unusable and can never be renewed. Drop it so the session degrades
          // to a clean guest instead of re-sending a dead token forever.
          clearToken();
          return null;
        }
        const data = (await response.json()) as { accessToken?: string };
        if (data.accessToken) {
          setToken(data.accessToken);
          return data.accessToken;
        }
        clearToken();
        return null;
      } catch {
        // Network failure is transient; keep the token so a later request can retry.
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

/** Builds the headers every API request carries: language, optional JSON type, and the Bearer token. */
function buildHeaders(options: RequestInit, token: string | null): Headers {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept-Language', currentLanguage());
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

/**
 * Sends a request and, on a 401, refreshes the access token once and retries.
 * Shared by JSON and text responses so both recover from an expired session the
 * same way. Login/register failures and anonymous catalog reads never refresh.
 */
async function sendAuthenticated(path: string, options: RequestInit): Promise<Response> {
  let response = await fetch(path, { ...options, headers: buildHeaders(options, getToken()) });

  const isAuthAttempt = path.includes('/auth/login') || path.includes('/auth/register');

  // Anonymous catalog reads are public. A 401 there means an auth problem, not
  // an expired token, so retrying after a refresh only burns rate-limit quota
  // on /auth/refresh and hides the real server error behind a 401.
  const isPublicRead =
    !getToken() &&
    (path.startsWith('/api/v1/products') ||
      path.startsWith('/api/v1/categories') ||
      path.startsWith('/api/v1/brands') ||
      path.startsWith('/api/v1/promotions'));

  if (response.status === 401 && !isAuthAttempt && !isPublicRead) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await fetch(path, { ...options, headers: buildHeaders(options, newToken) });
    }
  }

  return response;
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // ignore parse errors
  }
  return new ApiError(response.status, extractErrorMessage(body, response.status));
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await sendAuthenticated(path, options);

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** Fetches a plain-text response (for example CSV exports) with the same auth and refresh behaviour as `apiFetch`. */
export async function apiFetchText(path: string, options: RequestInit = {}): Promise<string> {
  const response = await sendAuthenticated(path, options);

  if (!response.ok) {
    throw await toApiError(response);
  }
  return response.text();
}
