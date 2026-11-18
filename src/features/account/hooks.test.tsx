import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { createProvidersWrapper } from '../../test/renderWithProviders';
import { setToken } from '../../lib/apiClient';
import { useAuth } from '../../providers/useAuth';
import { useAccountMutations } from './hooks';

const baseUser = {
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
const address = {
  id: 23,
  recipientName: 'Ana Silva',
  recipientPhone: '912345678',
  street: 'Rua 1',
  city: 'Lisboa',
  postalCode: '1000-001',
  countryCode: 'PT',
  addressType: 'SHIPPING' as const,
};

function installAuth() {
  setToken('session-token');
  server.use(http.get('/api/v1/auth/me', () => HttpResponse.json(baseUser)));
}

describe('useAccountMutations', () => {
  beforeEach(() => localStorage.clear());

  it('saves a profile, sends only changed fields, and synchronizes shared auth state', async () => {
    installAuth();
    let body: unknown;
    server.use(http.put('/api/v1/users/22', async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ ...baseUser, firstName: 'Anabela', phone: '912000000' });
    }));

    const { result } = renderHook(() => ({ mutations: useAccountMutations(), auth: useAuth() }), {
      wrapper: createProvidersWrapper({ auth: true }),
    });
    await waitFor(() => expect(result.current.auth.status).toBe('authenticated'));
    let updated;
    await act(async () => {
      updated = await result.current.mutations.saveProfile({
        firstName: 'Anabela', lastName: '', phone: '912000000', huntingLicenseNumber: '', fishingLicenseNumber: '',
      });
    });

    expect(body).toEqual({ firstName: 'Anabela', phone: '912000000' });
    expect(updated).toMatchObject({ firstName: 'Anabela', phone: '912000000' });
    expect(result.current.auth.user).toMatchObject({ firstName: 'Anabela', phone: '912000000' });
    expect(result.current.mutations.isSavingProfile).toBe(false);
  });

  it('creates and edits addresses and refreshes the shared user', async () => {
    installAuth();
    let savedUser = { ...baseUser, addresses: [] as typeof address[] };
    server.use(
      http.post('/api/v1/users/22/addresses', () => {
        savedUser = { ...baseUser, addresses: [address] };
        return HttpResponse.json(savedUser);
      }),
      http.put('/api/v1/users/22/addresses/23', () => {
        savedUser = { ...baseUser, addresses: [{ ...address, city: 'Porto' }] };
        return HttpResponse.json(savedUser);
      })
    );
    const { result } = renderHook(() => ({ mutations: useAccountMutations(), auth: useAuth() }), {
      wrapper: createProvidersWrapper({ auth: true }),
    });
    await waitFor(() => expect(result.current.auth.status).toBe('authenticated'));

    await act(async () => result.current.mutations.createAddress(address));
    expect(result.current.auth.user?.addresses).toHaveLength(1);
    await act(async () => result.current.mutations.editAddress(23, address));
    expect(result.current.auth.user?.addresses[0].city).toBe('Porto');
    expect(result.current.mutations.isSavingAddress).toBe(false);
  });

  it('deletes an address then re-fetches the user because DELETE has no body', async () => {
    installAuth();
    let userReads = 0;
    server.use(
      http.delete('/api/v1/users/22/addresses/23', () => new HttpResponse(null, { status: 204 })),
      http.get('/api/v1/users/22', () => {
        userReads += 1;
        return HttpResponse.json({ ...baseUser, addresses: [] });
      })
    );
    const { result } = renderHook(() => ({ mutations: useAccountMutations(), auth: useAuth() }), {
      wrapper: createProvidersWrapper({ auth: true }),
    });
    await waitFor(() => expect(result.current.auth.status).toBe('authenticated'));

    await act(async () => result.current.mutations.removeAddress(23));

    expect(userReads).toBe(1);
    expect(result.current.auth.user?.addresses).toEqual([]);
  });

  it('changes the password and tracks its pending state', async () => {
    installAuth();
    let resolveRequest!: () => void;
    server.use(http.post('/api/v1/users/22/password', () => new Promise<Response>((resolve) => {
      resolveRequest = () => resolve(new HttpResponse(null, { status: 204 }));
    })));
    const { result } = renderHook(() => ({ mutations: useAccountMutations(), auth: useAuth() }), {
      wrapper: createProvidersWrapper({ auth: true }),
    });
    await waitFor(() => expect(result.current.auth.status).toBe('authenticated'));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.mutations.updatePassword({ currentPassword: 'old', newPassword: 'new-password' });
    });
    await waitFor(() => expect(result.current.mutations.isChangingPassword).toBe(true));
    await act(async () => {
      resolveRequest();
      await pending;
    });
    expect(result.current.mutations.isChangingPassword).toBe(false);
  });

  it('records a server error, rethrows it, and can clear the error', async () => {
    installAuth();
    server.use(http.put('/api/v1/users/22', () => HttpResponse.json({ message: 'Profile rejected' }, { status: 400 })));
    const { result } = renderHook(() => ({ mutations: useAccountMutations(), auth: useAuth() }), {
      wrapper: createProvidersWrapper({ auth: true }),
    });
    await waitFor(() => expect(result.current.auth.status).toBe('authenticated'));

    await act(async () => {
      await result.current.mutations.saveProfile({ firstName: 'New', lastName: '', phone: '', huntingLicenseNumber: '', fishingLicenseNumber: '' }).catch(() => undefined);
    });
    expect(result.current.mutations.error).toBe('Profile rejected');
    act(() => result.current.mutations.clearError());
    expect(result.current.mutations.error).toBe('');
  });
});
