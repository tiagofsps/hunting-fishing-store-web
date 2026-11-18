import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/apiClient';
import { createProvidersWrapper } from '../../test/renderWithProviders';
import { useAdminError } from './hooks';

describe('useAdminError', () => {
  it('uses a translated permission message for 403 errors', () => {
    const { result } = renderHook(() => useAdminError(), { wrapper: createProvidersWrapper() });

    expect(result.current(new ApiError(403, 'Access Denied'))).toBe("You don't have permission to perform this action.");
  });

  it('preserves other API messages and ordinary error messages', () => {
    const { result } = renderHook(() => useAdminError(), { wrapper: createProvidersWrapper() });

    expect(result.current(new ApiError(404, 'Not found'))).toBe('Not found');
    expect(result.current(new Error('Network error'))).toBe('Network error');
  });

  it('returns an empty string for a non-Error value', () => {
    const { result } = renderHook(() => useAdminError(), { wrapper: createProvidersWrapper() });
    expect(result.current({ message: 'not an Error instance' })).toBe('');
  });

  it('keeps a stable callback identity across rerenders', () => {
    const { result, rerender } = renderHook(() => useAdminError(), { wrapper: createProvidersWrapper() });
    const initial = result.current;
    rerender();
    expect(result.current).toBe(initial);
  });
});
