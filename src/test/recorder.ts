import { http, HttpResponse } from 'msw';
import { server } from './server';

export interface RecordedRequest {
  method: string;
  /** Path without the query string, e.g. `/api/v1/orders/ORD-1/status`. */
  path: string;
  query: URLSearchParams;
  /** Parsed JSON body, the raw text when it is not JSON, or `undefined` when empty. */
  body: unknown;
  headers: Headers;
}

interface CannedResponse {
  status?: number;
  body?: unknown;
}

/**
 * Records every request made during a test and answers each with the canned
 * response. Lets API tests assert the exact method, path, query and body that
 * left the client, which is the contract the backend depends on.
 */
export function recordRequests(response: CannedResponse = {}): RecordedRequest[] {
  const requests: RecordedRequest[] = [];

  server.use(
    http.all('*', async ({ request }) => {
      const url = new URL(request.url);
      const text = await request.text();
      let body: unknown = undefined;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      requests.push({
        method: request.method,
        path: url.pathname,
        query: url.searchParams,
        body,
        headers: request.headers,
      });

      const status = response.status ?? 200;
      if (status === 204) return new HttpResponse(null, { status });
      // Strings are sent as they are (CSV exports); everything else as JSON.
      if (typeof response.body === 'string') {
        return new HttpResponse(response.body, { status, headers: { 'Content-Type': 'text/csv' } });
      }
      return HttpResponse.json(response.body ?? {}, { status });
    })
  );

  return requests;
}
