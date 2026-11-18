import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useLanguage } from '../../../i18n/useLanguage';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

export interface LicenseFormValues {
  huntingLicenseNumber?: string;
  fishingLicenseNumber?: string;
}

interface LicenseStepProps {
  missingHunting: boolean;
  missingFishing: boolean;
  licenseForm: UseFormReturn<LicenseFormValues>;
  onSave: (data: LicenseFormValues) => Promise<void>;
  isSavingLicense: boolean;
  onBack: () => void;
}

/** Step 2 (only when the cart needs a licence): collect the missing licence numbers. */
export function LicenseStep({
  missingHunting,
  missingFishing,
  licenseForm,
  onSave,
  isSavingLicense,
  onBack,
}: LicenseStepProps) {
  const { t } = useLanguage();
  const id = useId();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
        <div className="flex items-center gap-3 text-sm font-bold text-amber-600">
          <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{t('checkout.licenseMissingTitle')}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-body">{t('checkout.licenseMissingDesc')}</p>
      </div>

      <form onSubmit={licenseForm.handleSubmit(onSave)} className="space-y-4">
        {missingHunting && (
          <div>
            <Label htmlFor={`${id}-huntingLicense`}>{t('checkout.huntingLicense')}</Label>
            <Input id={`${id}-huntingLicense`} type="text" {...licenseForm.register('huntingLicenseNumber')} />
          </div>
        )}
        {missingFishing && (
          <div>
            <Label htmlFor={`${id}-fishingLicense`}>{t('checkout.fishingLicense')}</Label>
            <Input id={`${id}-fishingLicense`} type="text" {...licenseForm.register('fishingLicenseNumber')} />
          </div>
        )}

        <div className="mt-8 flex justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-border bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
          >
            ← {t('checkout.back')}
          </button>
          <button
            type="submit"
            disabled={isSavingLicense}
            className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
          >
            {isSavingLicense ? '...' : t('checkout.saveLicense')}
          </button>
        </div>
      </form>
    </div>
  );
}
