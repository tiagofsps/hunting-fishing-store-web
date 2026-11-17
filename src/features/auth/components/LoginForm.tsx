import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useLanguage } from '../../../i18n/useLanguage';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import type { LoginFormData } from '../validation';

interface LoginFormProps {
  form: UseFormReturn<LoginFormData>;
  onSubmit: (data: LoginFormData) => Promise<void>;
  isSubmitting: boolean;
  onForgotPassword: () => void;
}

/** Sign-in form inside the auth dialog. */
export function LoginForm({ form, onSubmit, isSubmitting, onForgotPassword }: LoginFormProps) {
  const { t } = useLanguage();
  const id = useId();
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor={`${id}-email`}>{t('auth.email')}</Label>
        <Input id={`${id}-email`} type="email" {...form.register('email')} />
        {errors.email && <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorInvalidEmail')}</p>}
      </div>

      <div>
        <Label htmlFor={`${id}-password`}>{t('auth.password')}</Label>
        <Input id={`${id}-password`} type="password" {...form.register('password')} />
        {errors.password && <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorPasswordRequired')}</p>}
      </div>

      <button
        type="button"
        onClick={onForgotPassword}
        className="text-xs font-bold text-accent-strong hover:underline"
      >
        {t('auth.forgotPassword')}
      </button>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-ink py-3.5 mt-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
      >
        {isSubmitting ? '...' : t('auth.submitLogin')}
      </button>
    </form>
  );
}
