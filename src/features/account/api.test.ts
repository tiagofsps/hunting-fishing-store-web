import { describe, expect, it } from 'vitest';
import { recordRequests } from '../../test/recorder';
import * as api from './api';
import { toProfileUpdatePayload } from './api';

const address = {
  recipientName: 'Ana Silva',
  recipientPhone: '912345678',
  street: 'Rua 1',
  city: 'Lisboa',
  postalCode: '1000-001',
  countryCode: 'PT',
  addressType: 'SHIPPING' as const,
};

describe('toProfileUpdatePayload', () => {
  it('sends only the fields that have a value, because the backend applies a partial update', () => {
    expect(
      toProfileUpdatePayload({
        firstName: 'Ana',
        lastName: '',
        phone: '',
        huntingLicenseNumber: 'H-1',
        fishingLicenseNumber: '',
      })
    ).toEqual({ firstName: 'Ana', huntingLicenseNumber: 'H-1' });
  });

  it('is empty when nothing changed', () => {
    expect(
      toProfileUpdatePayload({ firstName: '', lastName: '', phone: '', huntingLicenseNumber: '', fishingLicenseNumber: '' })
    ).toEqual({});
  });
});

describe('account API', () => {
  it('fetches a user by id with GET', async () => {
    const requests = recordRequests({ body: { id: 22 } });
    await api.fetchUser(22);
    expect(requests[0]).toMatchObject({ method: 'GET', path: '/api/v1/users/22' });
  });

  it('updates the profile with PUT on the user', async () => {
    const requests = recordRequests({ body: { id: 22 } });
    await api.updateProfile(22, { phone: '912345678' });
    expect(requests[0]).toMatchObject({ method: 'PUT', path: '/api/v1/users/22', body: { phone: '912345678' } });
  });

  it('adds an address with POST under the user', async () => {
    const requests = recordRequests({ body: { id: 22, addresses: [] } });
    await api.addAddress(22, address);
    expect(requests[0]).toMatchObject({ method: 'POST', path: '/api/v1/users/22/addresses', body: address });
  });

  it('updates a specific address with PUT', async () => {
    const requests = recordRequests({ body: { id: 22, addresses: [] } });
    await api.updateAddress(22, 23, address);
    expect(requests[0]).toMatchObject({ method: 'PUT', path: '/api/v1/users/22/addresses/23', body: address });
  });

  it('deletes a specific address with DELETE', async () => {
    const requests = recordRequests({ status: 204 });
    await api.deleteAddress(22, 23);
    expect(requests[0]).toMatchObject({ method: 'DELETE', path: '/api/v1/users/22/addresses/23' });
  });

  it('changes the password with POST to the password sub-resource', async () => {
    const requests = recordRequests({ status: 204 });
    await api.changePassword(22, { currentPassword: 'old', newPassword: 'new-password' });
    expect(requests[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/users/22/password',
      body: { currentPassword: 'old', newPassword: 'new-password' },
    });
  });
});
