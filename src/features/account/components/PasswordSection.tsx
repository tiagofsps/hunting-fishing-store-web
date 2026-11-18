import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordSchema, type PasswordFormData } from '../validation';
import { useLanguage } from '../../../i18n/useLanguage';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

interface PasswordSectionProps {
  isSaving: boolean;
  onChangePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<void>;
}

export default function PasswordSection({ isSaving, onChangePassword }: PasswordSectionProps) {
  const { t } = useLanguage();
  const id = useId();
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
          <Label htmlFor={`${id}-currentPassword`}>{t('account.currentPassword')}</Label>
          <Input id={`${id}-currentPassword`} type="password" autoComplete="current-password" {...form.register('currentPassword')} />
          {form.formState.errors.currentPassword && (
            <p className="mt-1 text-[11px] font-bold text-sale">{t('account.errorRequired')}</p>
          )}
        </div>
        <div>
          <Label htmlFor={`${id}-newPassword`}>{t('account.newPassword')}</Label>
          <Input id={`${id}-newPassword`} type="password" autoComplete="new-password" {...form.register('newPassword')} />
          {form.formState.errors.newPassword && (
            <p className="mt-1 text-[11px] font-bold text-sale">{t('account.errorRequired')}</p>
          )}
        </div>
        <div>
          <Label htmlFor={`${id}-confirmPassword`}>{t('account.confirmPassword')}</Label>
          <Input id={`${id}-confirmPassword`} type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
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
