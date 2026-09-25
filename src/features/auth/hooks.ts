import { useState, useEffect, useCallback } from 'react';
import * as api from './api';
import { getToken, setToken, clearToken } from '../../lib/apiClient';
import { toAuthUser } from '../../utils';
import type { AuthUser } from '../../types';
import type { LoginFormData, RegisterFormData } from './validation';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getToken()) {
        if (!cancelled) setStatus('guest');
        return;
      }
      try {
        const current = await api.me();
        if (!cancelled) {
          setUser(toAuthUser(current));
          setStatus('authenticated');
        }
      } catch {
        clearToken();
        if (!cancelled) {
          setUser(null);
          setStatus('guest');
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginFormData) => {
    const response = await api.login(payload);
    setToken(response.accessToken);
    const current = await api.me();
    setUser(toAuthUser(current));
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (payload: RegisterFormData) => {
    const response = await api.register(payload);
    setToken(response.accessToken);
    setUser(toAuthUser(response.user));
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore logout errors; always clear local state
    }
    clearToken();
    setUser(null);
    setStatus('guest');
  }, []);

  const updateUser = useCallback((next: AuthUser) => {
    setUser(next);
  }, []);

  return { user, status, login, register, logout, updateUser };
}