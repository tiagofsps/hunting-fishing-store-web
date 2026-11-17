import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { ApiError, apiFetch, apiFetchText, clearToken, getToken, setToken } from './apiClient';

const API = '/api/v1';

describe('apiFetch request headers', () => {
  it('sends the stored access token as a Bearer header', async () => {
    setToken('token-1');
    let authorization: string | null = null;
    server.use(
      http.get(`${API}/auth/me`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({ id: 1 });
      })
    );

    await apiFetch(`${API}/auth/me`);

    expect(authorization).toBe('Bearer token-1');
  });

  it('omits the Authorization header for guests', async () => {
    let authorization: string | null = 'unset';
    server.use(
      http.get(`${API}/products`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({ content: [] });
      })
    );

    await apiFetch(`${API}/products`);

    expect(authorization).toBeNull();
  });

  it('sends Accept-Language from the stored language, defaulting to English', async () => {
    const seen: Array<string | null> = [];
    server.use(
      http.get(`${API}/products`, ({ request }) => {
        seen.push(request.headers.get('Accept-Language'));
        return HttpResponse.json({});
      })
    );

    await apiFetch(`${API}/products`);
    localStorage.setItem('app_lang', 'pt');
    await apiFetch(`${API}/products`);
    localStorage.setItem('app_lang', 'fr');
    await apiFetch(`${API}/products`);

    expect(seen).toEqual(['en', 'pt', 'en']);
  });

  it('sets a JSON Content-Type only when there is a body', async () => {
    const contentTypes: Array<string | null> = [];
    server.use(
      http.post(`${API}/carts`, ({ request }) => {
        contentTypes.push(request.headers.get('Content-Type'));
        return HttpResponse.json({});
      })
    );

    await apiFetch(`${API}/carts`, { method: 'POST', body: JSON.stringify({ a: 1 }) });
    await apiFetch(`${API}/carts`, { method: 'POST' });

    expect(contentTypes[0]).toContain('application/json');
    expect(contentTypes[1]).toBeNull();
  });
});

describe('apiFetch responses', () => {
  it('parses a JSON success body', async () => {
    server.use(http.get(`${API}/brands`, () => HttpResponse.json([{ id: 1, name: 'Acme' }])));

    await expect(apiFetch(`${API}/brands`)).resolves.toEqual([{ id: 1, name: 'Acme' }]);
  });

  it('resolves undefined for a 204 No Content response', async () => {
    server.use(http.delete(`${API}/carts/items/1`, () => new HttpResponse(null, { status: 204 })));

    await expect(apiFetch(`${API}/carts/items/1`, { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('throws an ApiError carrying the server message', async () => {
    server.use(
      http.post(`${API}/orders`, () => HttpResponse.json({ message: 'Stock exhausted' }, { status: 409 }))
    );

    const error = await apiFetch(`${API}/orders`, { method: 'POST' }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, message: 'Stock exhausted' });
  });

  it('joins validation field errors when there is no top-level message', async () => {
    server.use(
      http.post(`${API}/users`, () =>
        HttpResponse.json({ errors: { email: 'invalid', password: 'too short' } }, { status: 400 })
      )
    );

    await expect(apiFetch(`${API}/users`, { method: 'POST' })).rejects.toMatchObject({
      status: 400,
      message: 'invalid, too short',
    });
  });

  it('falls back to a status message when the error body is not JSON', async () => {
    server.use(http.get(`${API}/coupons`, () => new HttpResponse('<html>Bad gateway</html>', { status: 502 })));

    await expect(apiFetch(`${API}/coupons`)).rejects.toMatchObject({
      status: 502,
      message: 'Request failed with status 502',
    });
  });
});

describe('apiFetch token refresh', () => {
  it('refreshes an expired token once and retries the original request', async () => {
    setToken('expired');
    let calls = 0;
    server.use(
      http.get(`${API}/orders`, ({ request }) => {
        calls += 1;
        if (request.headers.get('Authorization') === 'Bearer fresh') {
          return HttpResponse.json([{ id: 9 }]);
        }
        return HttpResponse.json({ message: 'expired' }, { status: 401 });
      }),
      http.post(`${API}/auth/refresh`, () => HttpResponse.json({ accessToken: 'fresh' }))
    );

    await expect(apiFetch(`${API}/orders`)).resolves.toEqual([{ id: 9 }]);

    expect(calls).toBe(2);
    expect(getToken()).toBe('fresh');
  });

  it('shares one refresh between concurrent 401s', async () => {
    setToken('expired');
    let refreshCalls = 0;
    server.use(
      http.get(`${API}/orders`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer fresh'
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({}, { status: 401 })
      ),
      http.post(`${API}/auth/refresh`, async () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'fresh' });
      })
    );

    const results = await Promise.all([
      apiFetch(`${API}/orders`),
      apiFetch(`${API}/orders`),
      apiFetch(`${API}/orders`),
    ]);

    expect(results).toHaveLength(3);
    expect(refreshCalls).toBe(1);
  });

  it('clears the token and surfaces the 401 when the refresh is rejected', async () => {
    setToken('dead');
    server.use(
      http.get(`${API}/orders`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${API}/auth/refresh`, () => HttpResponse.json({}, { status: 401 }))
    );

    await expect(apiFetch(`${API}/orders`)).rejects.toMatchObject({ status: 401 });
    expect(getToken()).toBeNull();
  });

  it('keeps the token when the refresh fails because of the network', async () => {
    setToken('still-good');
    server.use(
      http.get(`${API}/orders`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${API}/auth/refresh`, () => HttpResponse.error())
    );

    await expect(apiFetch(`${API}/orders`)).rejects.toMatchObject({ status: 401 });
    expect(getToken()).toBe('still-good');
  });

  it('does not try to refresh after a failed login', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(`${API}/auth/login`, () => HttpResponse.json({ message: 'Bad password' }, { status: 401 })),
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'x' });
      })
    );

    await expect(apiFetch(`${API}/auth/login`, { method: 'POST' })).rejects.toMatchObject({
      message: 'Bad password',
    });
    expect(refreshCalls).toBe(0);
  });

  it('does not refresh anonymous catalog reads', async () => {
    clearToken();
    let refreshCalls = 0;
    server.use(
      http.get(`${API}/products`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'x' });
      })
    );

    await expect(apiFetch(`${API}/products`)).rejects.toMatchObject({ status: 401 });
    expect(refreshCalls).toBe(0);
  });
});

describe('apiFetchText', () => {
  it('returns the response body as text with the auth headers', async () => {
    setToken('admin-token');
    let authorization: string | null = null;
    server.use(
      http.get(`${API}/newsletter/export`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return new HttpResponse('email\na@b.pt\n', { headers: { 'Content-Type': 'text/csv' } });
      })
    );

    await expect(apiFetchText(`${API}/newsletter/export`)).resolves.toBe('email\na@b.pt\n');
    expect(authorization).toBe('Bearer admin-token');
  });

  it('throws an ApiError with the parsed server message on failure', async () => {
    server.use(
      http.get(`${API}/newsletter/export`, () => HttpResponse.json({ message: 'Forbidden' }, { status: 403 }))
    );

    await expect(apiFetchText(`${API}/newsletter/export`)).rejects.toMatchObject({
      status: 403,
      message: 'Forbidden',
    });
  });
});
