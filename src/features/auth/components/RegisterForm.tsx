import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useLanguage } from '../../../i18n/useLanguage';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import type { RegisterFormData } from '../validation';

interface RegisterFormProps {
  form: UseFormReturn<RegisterFormData>;
  onSubmit: (data: RegisterFormData) => Promise<void>;
  isSubmitting: boolean;
}

/** Account creation form inside the auth dialog. Licence numbers are optional. */
export function RegisterForm({ form, onSubmit, isSubmitting }: RegisterFormProps) {
  const { t } = useLanguage();
  const id = useId();
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-firstName`}>{t('auth.firstName')}</Label>
          <Input id={`${id}-firstName`} type="text" {...form.register('firstName')} />
          {errors.firstName && <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorRequired')}</p>}
        </div>
        <div>
          <Label htmlFor={`${id}-lastName`}>{t('auth.lastName')}</Label>
          <Input id={`${id}-lastName`} type="text" {...form.register('lastName')} />
          {errors.lastName && <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorRequired')}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor={`${id}-email`}>{t('auth.email')}</Label>
        <Input id={`${id}-email`} type="email" {...form.register('email')} />
        {errors.email && <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorInvalidEmail')}</p>}
      </div>

      <div>
        <Label htmlFor={`${id}-password`}>{t('auth.password')}</Label>
        <Input id={`${id}-password`} type="password" {...form.register('password')} />
        {errors.password && <p className="mt-1 text-[11px] font-bold text-sale">{t('auth.errorPasswordMin')}</p>}
      </div>

      <div>
        <Label htmlFor={`${id}-phone`}>{t('auth.phone')}</Label>
        <Input id={`${id}-phone`} type="tel" {...form.register('phone')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-hunting`}>{t('auth.huntingLicense')}</Label>
          <Input id={`${id}-hunting`} type="text" {...form.register('huntingLicenseNumber')} />
        </div>
        <div>
          <Label htmlFor={`${id}-fishing`}>{t('auth.fishingLicense')}</Label>
          <Input id={`${id}-fishing`} type="text" {...form.register('fishingLicenseNumber')} />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-ink py-3.5 mt-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
      >
        {isSubmitting ? '...' : t('auth.submitRegister')}
      </button>
    </form>
  );
}
