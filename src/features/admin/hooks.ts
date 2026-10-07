import { useCallback, useEffect, useRef } from 'react';
import { ApiError } from '../../lib/apiClient';
import { useLanguage } from '../../i18n/useLanguage';

/**
 * Maps an admin load/action failure to a user-facing message.
 *
 * A 403 means the account lacks the required permission, so it is translated
 * into an explicit message instead of echoing the backend's raw "Access Denied"
 * text after the generic `admin.errorTitle`.
 *
 * The callback keeps a stable identity: it is passed to loaders inside
 * `useEffect`, and `t` is re-created whenever the language context re-renders,
 * so depending on it would refetch page data (and reset forms) on every such
 * re-render. The latest `t` is kept in a ref instead.
 */
export function useAdminError(): (err: unknown) => string {
  const { t } = useLanguage();
  const translate = useRef(t);

  useEffect(() => {
    translate.current = t;
  }, [t]);

  return useCallback(
    (err: unknown): string => {
      if (err instanceof ApiError && err.status === 403) {
        return translate.current('admin.forbiddenAction');
      }
      return err instanceof Error ? err.message : '';
    },
    []
  );
}
