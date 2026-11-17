import { useLanguage } from '../../../i18n/useLanguage';
import type { CheckoutStep } from '../types';

interface StepIndicatorProps {
  step: CheckoutStep;
  needsLicenseStep: boolean;
}

function stepLabel(label: string, active: boolean) {
  return <span className={active ? 'text-accent-strong font-black' : 'text-muted font-bold'}>{label}</span>;
}

/** Breadcrumb showing the checkout steps; the license step only appears when required. */
export function StepIndicator({ step, needsLicenseStep }: StepIndicatorProps) {
  const { t } = useLanguage();

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 text-xs border-b border-border pb-4">
      {stepLabel(`1. ${t('checkout.stepShipping')}`, step === 'address')}
      {needsLicenseStep && (
        <>
          <span className="text-muted">→</span>
          {stepLabel(`2. ${t('checkout.stepLicense')}`, step === 'license')}
        </>
      )}
      <span className="text-muted">→</span>
      {stepLabel(`${needsLicenseStep ? 3 : 2}. ${t('checkout.stepPayment')}`, step === 'payment')}
      <span className="text-muted">→</span>
      {stepLabel(`${needsLicenseStep ? 4 : 3}. ${t('checkout.stepReview')}`, step === 'review')}
    </div>
  );
}
