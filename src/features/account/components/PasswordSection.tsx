import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordSchema, type PasswordFormData } from '../validation';
import { useLanguage } from '../../../i18n/useLanguage';

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong text-ink font-medium';

interface PasswordSectionProps {
  isSaving: boolean;
  onChangePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<void>;
}

export default function PasswordSection({ isSaving, onChangePassword }: PasswordSectionProps) {
  const { t } = useLanguage();
  const [changed, setChanged] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setChanged(false);
    await onChangePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
    form.reset();
    setChanged(true);
  });

  return (
    <section className="rounded-3xl border border-border bg-surface-raised p-6 sm:p-8">
      <h2 className="text-lg font-black tracking-tight text-ink">{t('account.passwordHeading')}</h2>
      <p className="mt-1 text-xs text-muted">{t('account.passwordDesc')}</p>

      {changed && (
        <p className="mt-4 rounded-xl border border-accent-border bg-accent/10 p-3 text-xs font-bold text-accent-strong">
          {t('account.passwordChanged')}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-5">
        <div>
          <label className="mb-1 block text-xs font-bold text-ink">{t('account.currentPassword')}</label>
          <input type="password" autoComplete="current-password" {...form.register('currentPassword')} className={inputClass} />
          {form.formState.errors.currentPassword && (
            <p className="mt-1 text-[11px] font-bold text-sale">{t('account.errorRequired')}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-ink">{t('account.newPassword')}</label>
          <input type="password" autoComplete="new-password" {...form.register('newPassword')} className={inputClass} />
          {form.formState.errors.newPassword && (
            <p className="mt-1 text-[11px] font-bold text-sale">{t('account.errorRequired')}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-ink">{t('account.confirmPassword')}</label>
          <input type="password" autoComplete="new-password" {...form.register('confirmPassword')} className={inputClass} />
          {form.formState.errors.confirmPassword && (
            <p className="mt-1 text-[11px] font-bold text-sale">
              {form.formState.errors.confirmPassword.message === 'passwordsDoNotMatch'
                ? t('account.passwordsDoNotMatch')
                : t('account.errorRequired')}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-ink px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-ink/90 disabled:opacity-50"
        >
          {isSaving ? t('account.saving') : t('account.changePassword')}
        </button>
      </form>
    </section>
  );
}
