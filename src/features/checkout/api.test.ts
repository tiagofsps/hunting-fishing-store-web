import { describe, expect, it } from 'vitest';
import { recordRequests } from '../../test/recorder';
import * as api from './api';

const address = {
  recipientName: 'Ana Silva',
  recipientPhone: '912345678',
  street: 'Rua 1',
  city: 'Lisboa',
  postalCode: '1000-001',
  countryCode: 'PT',
  addressType: 'SHIPPING' as const,
};

describe('checkout API', () => {
  it('adds an address for the user with POST', async () => {
    const requests = recordRequests({ body: { id: 22, addresses: [] } });
    await api.addAddress(22, address);
    expect(requests[0]).toMatchObject({ method: 'POST', path: '/api/v1/users/22/addresses', body: address });
  });

  it('updates the user profile with PUT', async () => {
    const requests = recordRequests({ body: { id: 22 } });
    await api.updateProfile(22, { huntingLicenseNumber: 'H-1' });
    expect(requests[0]).toMatchObject({
      method: 'PUT',
      path: '/api/v1/users/22',
      body: { huntingLicenseNumber: 'H-1' },
    });
  });
});
