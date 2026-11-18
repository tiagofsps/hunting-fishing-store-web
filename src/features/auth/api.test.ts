import { describe, expect, it } from 'vitest';
import { recordRequests } from '../../test/recorder';
import * as api from './api';

describe('auth API', () => {
  it('logs in with a JSON body on POST', async () => {
    const requests = recordRequests({ body: { accessToken: 't', tokenType: 'Bearer' } });

    await api.login({ email: 'ana@example.com', password: 'secret' });

    expect(requests[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'ana@example.com', password: 'secret' },
    });
  });

  it('registers with POST and the full registration body', async () => {
    const requests = recordRequests({ body: { user: {}, accessToken: 't' } });
    const payload = {
      email: 'ana@example.com',
      password: 'long-enough-1',
      firstName: 'Ana',
      lastName: 'Silva',
    };

    await api.register(payload);

    expect(requests[0]).toMatchObject({ method: 'POST', path: '/api/v1/auth/register', body: payload });
  });

  it('logs out with POST and no body', async () => {
    const requests = recordRequests({ status: 204 });

    await api.logout();

    expect(requests[0].method).toBe('POST');
    expect(requests[0].path).toBe('/api/v1/auth/logout');
    expect(requests[0].body).toBeUndefined();
  });

  it('reads the current user with GET', async () => {
    const requests = recordRequests({ body: { id: 22, email: 'ana@example.com' } });

    await expect(api.me()).resolves.toMatchObject({ id: 22 });
    expect(requests[0]).toMatchObject({ method: 'GET', path: '/api/v1/auth/me' });
  });

  it('requests a password reset for an email with POST', async () => {
    const requests = recordRequests({ status: 204 });

    await api.forgotPassword('ana@example.com');

    expect(requests[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/auth/forgot-password',
      body: { email: 'ana@example.com' },
    });
  });
});
