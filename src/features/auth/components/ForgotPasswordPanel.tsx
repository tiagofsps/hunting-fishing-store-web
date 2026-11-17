import { useId, type FormEvent } from 'react';
import { useLanguage } from '../../../i18n/useLanguage';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

interface ForgotPasswordPanelProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sent: boolean;
  error: string;
  isSubmitting: boolean;
  onBack: () => void;
}

/** Password-reset request. Shows a generic confirmation once the request is sent. */
export function ForgotPasswordPanel({
  email,
  onEmailChange,
  onSubmit,
  sent,
  error,
  isSubmitting,
  onBack,
}: ForgotPasswordPanelProps) {
  const { t } = useLanguage();
  const id = useId();

  return (
    <div>
      <h2 className="text-xl font-black text-ink">{t('auth.forgotTitle')}</h2>
      <p className="mt-2 text-xs text-muted">{t('auth.forgotDesc')}</p>

      {sent ? (
        <div className="mt-6 rounded-xl bg-accent/10 border border-accent/30 p-4 text-xs font-bold text-ink">
          {t('auth.forgotSent')}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-sale/10 border border-sale/30 p-3 text-xs font-bold text-sale text-center">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor={`${id}-email`}>{t('auth.email')}</Label>
            <Input
              id={`${id}-email`}
              type="email"
              required
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-ink py-3.5 mt-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
          >
            {isSubmitting ? '...' : t('auth.sendReset')}
          </button>
        </form>
      )}

      <button type="button" onClick={onBack} className="mt-4 text-xs font-bold text-accent-strong hover:underline">
        ← {t('auth.backToLogin')}
      </button>
    </div>
  );
}
