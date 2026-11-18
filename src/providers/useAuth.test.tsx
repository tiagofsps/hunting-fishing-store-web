import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { createProvidersWrapper } from '../test/renderWithProviders';
import { getToken } from '../lib/apiClient';
import { useAuth } from './useAuth';

const user = {
  id: 22,
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Silva',
  role: 'ROLE_USER',
  enabled: true,
  phone: null,
  huntingLicenseNumber: null,
  fishingLicenseNumber: null,
  addresses: [],
};

describe('AuthProvider and useAuth', () => {
  beforeEach(() => localStorage.clear());

  it('starts as a guest when there is no saved access token', async () => {
    const paths: string[] = [];
    server.use(http.all('*', ({ request }) => {
      paths.push(new URL(request.url).pathname);
      return HttpResponse.json({});
    }));

    const { result } = renderHook(() => useAuth(), { wrapper: createProvidersWrapper({ auth: true }) });
    await waitFor(() => expect(result.current.status).toBe('guest'));
    expect(result.current.user).toBeNull();
    expect(paths).toEqual([]);
  });

  it('logs in, stores the access token and restores the user profile', async () => {
    server.use(
      http.post('/api/v1/auth/login', () => HttpResponse.json({ accessToken: 'access-1', tokenType: 'Bearer' })),
      http.get('/api/v1/auth/me', () => HttpResponse.json(user))
    );
    const { result } = renderHook(() => useAuth(), { wrapper: createProvidersWrapper({ auth: true }) });
    await waitFor(() => expect(result.current.status).toBe('guest'));

    await act(async () => result.current.login({ email: user.email, password: 'secret' }));

    expect(getToken()).toBe('access-1');
    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toMatchObject({ id: 22, email: user.email, role: 'ROLE_USER' });
  });

  it('registers from the user returned with the token without an extra me request', async () => {
    let meCalls = 0;
    server.use(
      http.post('/api/v1/auth/register', () => HttpResponse.json({ user, accessToken: 'access-register', tokenType: 'Bearer' }, { status: 201 })),
      http.get('/api/v1/auth/me', () => {
        meCalls += 1;
        return HttpResponse.json(user);
      })
    );
    const { result } = renderHook(() => useAuth(), { wrapper: createProvidersWrapper({ auth: true }) });
    await waitFor(() => expect(result.current.status).toBe('guest'));

    await act(async () => result.current.register({
      email: user.email,
      password: 'long-enough-1',
      firstName: 'Ana',
      lastName: 'Silva',
    }));

    expect(getToken()).toBe('access-register');
    expect(result.current.user?.id).toBe(22);
    expect(result.current.status).toBe('authenticated');
    expect(meCalls).toBe(0);
  });

  it('clears the token and user on logout even if the logout endpoint fails', async () => {
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(user)),
      http.post('/api/v1/auth/logout', () => HttpResponse.json({ message: 'Server error' }, { status: 500 }))
    );
    localStorage.setItem('access_token', 'access-existing');
    const { result } = renderHook(() => useAuth(), { wrapper: createProvidersWrapper({ auth: true }) });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    await act(async () => result.current.logout());

    expect(getToken()).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.status).toBe('guest');
  });

  it('clears a rejected saved token and becomes a guest', async () => {
    localStorage.setItem('access_token', 'expired');
    server.use(http.get('/api/v1/auth/me', () => HttpResponse.json({ message: 'expired' }, { status: 401 })));
    const { result } = renderHook(() => useAuth(), { wrapper: createProvidersWrapper({ auth: true }) });

    await waitFor(() => expect(result.current.status).toBe('guest'));
    expect(result.current.user).toBeNull();
    expect(getToken()).toBeNull();
  });
});
