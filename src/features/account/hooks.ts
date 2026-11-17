import { useState, useCallback } from 'react';
import type { AuthUser } from '../../types';
import { toAuthUser } from '../../utils';
import { useAuth } from '../../providers/useAuth';
import * as api from './api';
import type { AccountAddressFormData, ProfileFormData } from './validation';

/**
 * Mutations for the account area. Every call that returns a `UserResponse`
 * refreshes the shared auth user so the navbar and checkout stay in sync.
 */
export function useAccountMutations() {
  const { user, updateUser } = useAuth();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');

  const requireUserId = useCallback((): number => {
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }, [user]);

  const saveProfile = useCallback(
    async (data: ProfileFormData): Promise<AuthUser> => {
      setIsSavingProfile(true);
      setError('');
      try {
        const updated = await api.updateProfile(requireUserId(), api.toProfileUpdatePayload(data));
        const next = toAuthUser(updated);
        updateUser(next);
        return next;
      } catch (err) {
        setError(err instanceof Error ? err.message : '');
        throw err;
      } finally {
        setIsSavingProfile(false);
      }
    },
    [requireUserId, updateUser]
  );

  const createAddress = useCallback(
    async (data: AccountAddressFormData): Promise<AuthUser> => {
      setIsSavingAddress(true);
      setError('');
      try {
        const updated = await api.addAddress(requireUserId(), data);
        const next = toAuthUser(updated);
        updateUser(next);
        return next;
      } catch (err) {
        setError(err instanceof Error ? err.message : '');
        throw err;
      } finally {
        setIsSavingAddress(false);
      }
    },
    [requireUserId, updateUser]
  );

  const editAddress = useCallback(
    async (addressId: number, data: AccountAddressFormData): Promise<AuthUser> => {
      setIsSavingAddress(true);
      setError('');
      try {
        const updated = await api.updateAddress(requireUserId(), addressId, data);
        const next = toAuthUser(updated);
        updateUser(next);
        return next;
      } catch (err) {
        setError(err instanceof Error ? err.message : '');
        throw err;
      } finally {
        setIsSavingAddress(false);
      }
    },
    [requireUserId, updateUser]
  );

  const removeAddress = useCallback(
    async (addressId: number): Promise<AuthUser> => {
      setIsSavingAddress(true);
      setError('');
      try {
        const userId = requireUserId();
        await api.deleteAddress(userId, addressId);
        // DELETE returns no body, so re-read the user to drop the address.
        const refreshed = await api.fetchUser(userId);
        const next = toAuthUser(refreshed);
        updateUser(next);
        return next;
      } catch (err) {
        setError(err instanceof Error ? err.message : '');
        throw err;
      } finally {
        setIsSavingAddress(false);
      }
    },
    [requireUserId, updateUser]
  );

  const updatePassword = useCallback(
    async (payload: { currentPassword: string; newPassword: string }): Promise<void> => {
      setIsChangingPassword(true);
      setError('');
      try {
        await api.changePassword(requireUserId(), payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : '');
        throw err;
      } finally {
        setIsChangingPassword(false);
      }
    },
    [requireUserId]
  );

  return {
    isSavingProfile,
    isSavingAddress,
    isChangingPassword,
    error,
    clearError: () => setError(''),
    saveProfile,
    createAddress,
    editAddress,
    removeAddress,
    updatePassword,
  };
}
