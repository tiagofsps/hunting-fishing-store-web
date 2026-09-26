import { apiFetch } from '../../lib/apiClient';
import type { NewsletterSubscriptionResponse } from './types';

const BASE_URL = '/api/v1';

export async function subscribeNewsletter(email: string): Promise<NewsletterSubscriptionResponse> {
  return apiFetch<NewsletterSubscriptionResponse>(`${BASE_URL}/newsletter/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function unsubscribeNewsletter(email: string): Promise<void> {
  await apiFetch<void>(`${BASE_URL}/newsletter/subscribe`, {
    method: 'DELETE',
    body: JSON.stringify({ email }),
  });
}