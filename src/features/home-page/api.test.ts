import { describe, expect, it } from 'vitest';
import { recordRequests } from '../../test/recorder';
import * as api from './api';

describe('home-page newsletter API', () => {
  it('subscribes an email with POST', async () => {
    const requests = recordRequests({ status: 201, body: { id: 1, email: 'fan@example.com', active: true } });
    await expect(api.subscribeNewsletter('fan@example.com')).resolves.toMatchObject({ active: true });
    expect(requests[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/newsletter/subscribe',
      body: { email: 'fan@example.com' },
    });
  });

  it('unsubscribes an email with DELETE and a body', async () => {
    const requests = recordRequests({ status: 204 });
    await api.unsubscribeNewsletter('fan@example.com');
    expect(requests[0]).toMatchObject({
      method: 'DELETE',
      path: '/api/v1/newsletter/subscribe',
      body: { email: 'fan@example.com' },
    });
  });
});
