import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type ProfileFormData } from '../validation';
import type { AuthUser } from '../../../types';
import { useLanguage } from '../../../i18n/useLanguage';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

interface ProfileSectionProps {
  user: AuthUser;
  isSaving: boolean;
  onSave: (data: ProfileFormData) => Promise<unknown>;
}

export default function ProfileSection({ user, isSaving, onSave }: ProfileSectionProps) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      huntingLicenseNumber: user.huntingLicenseNumber ?? '',
      fishingLicenseNumber: user.fishingLicenseNumber ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      huntingLicenseNumber: user.huntingLicenseNumber ?? '',
      fishingLicenseNumber: user.fishingLicenseNumber ?? '',
    });
  }, [user, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setSaved(false);
    await onSave(data);
    setSaved(true);
  });

  return (
    <section className="rounded-3xl border border-border bg-surface-raised p-6 sm:p-8">
      <h2 className="text-lg font-black tracking-tight text-ink">{t('account.profileHeading')}</h2>
      <p className="mt-1 text-xs text-muted">{t('account.profileDesc')}</p>

      {saved && (
        <p className="mt-4 rounded-xl border border-accent-border bg-accent/10 p-3 text-xs font-bold text-accent-strong">
          {t('account.profileSaved')}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <Label>{t('account.email')}</Label>
          <Input type="email" value={user.email} disabled className="opacity-60" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>{t('account.firstName')}</Label>
            <Input type="text" {...form.register('firstName')} />
            {form.formState.errors.firstName && (
              <p className="mt-1 text-[11px] font-bold text-sale">{t('account.errorRequired')}</p>
            )}
          </div>
          <div>
            <Label>{t('account.lastName')}</Label>
            <Input type="text" {...form.register('lastName')} />
            {form.formState.errors.lastName && (
              <p className="mt-1 text-[11px] font-bold text-sale">{t('account.errorRequired')}</p>
            )}
          </div>
        </div>

        <div>
          <Label>
            {t('account.phone')} <span className="font-medium text-muted">({t('account.optional')})</span>
          </Label>
          <Input type="tel" {...form.register('phone')} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>
              {t('account.huntingLicense')} <span className="font-medium text-muted">({t('account.optional')})</span>
            </Label>
            <Input type="text" {...form.register('huntingLicenseNumber')} />
          </div>
          <div>
            <Label>
              {t('account.fishingLicense')} <span className="font-medium text-muted">({t('account.optional')})</span>
            </Label>
            <Input type="text" {...form.register('fishingLicenseNumber')} />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-ink px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-ink/90 disabled:opacity-50"
        >
          {isSaving ? t('account.saving') : t('account.saveProfile')}
        </button>
      </form>
    </section>
  );
}
