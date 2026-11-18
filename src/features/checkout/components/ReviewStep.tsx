import { useId } from 'react';
import { useLanguage } from '../../../i18n/useLanguage';
import type { Address } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

interface ReviewStepProps {
  requiresLicense: boolean;
  /** The shipping address the customer selected, if it still exists. */
  address: Address | undefined;
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  onBack: () => void;
  onPlaceOrder: () => void;
  isPlacingOrder: boolean;
}

/** Step 4: confirm the shipping address, apply a coupon and place the order. */
export function ReviewStep({
  requiresLicense,
  address,
  couponCode,
  onCouponCodeChange,
  onBack,
  onPlaceOrder,
  isPlacingOrder,
}: ReviewStepProps) {
  const { t } = useLanguage();
  const id = useId();

  return (
    <div className="space-y-6">
      {requiresLicense && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-xs font-bold text-amber-600">{t('checkout.licenseNoticeTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed text-body">{t('checkout.licenseNoticeDesc')}</p>
        </div>
      )}

      <div className="space-y-2 rounded-2xl border border-border bg-surface p-4 text-xs">
        <h3 className="mb-2 font-bold uppercase tracking-wider text-ink">{t('checkout.stepShipping')}</h3>
        {!address ? (
          <p className="text-muted">{t('checkout.errorAddressRequired')}</p>
        ) : (
          <>
            <p>
              <strong className="text-ink">{address.recipientName}</strong> ({address.recipientPhone})
            </p>
            <p className="text-muted">
              {address.street}, {address.postalCode} {address.city} ({address.countryCode})
            </p>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <Label htmlFor={`${id}-coupon`}>{t('checkout.couponLabel')}</Label>
        <div className="flex gap-2">
          <Input
            id={`${id}-coupon`}
            type="text"
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
            placeholder={t('checkout.couponPlaceholder')}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted">{t('checkout.couponHint')}</p>
      </div>

      <div className="mt-8 flex justify-between border-t border-border pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-border bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
        >
          ← {t('checkout.back')}
        </button>
        <button
          type="button"
          disabled={isPlacingOrder}
          onClick={onPlaceOrder}
          className="rounded-xl bg-accent px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-ink shadow-md transition-all hover:bg-accent/90 active:scale-95 disabled:opacity-50"
        >
          {isPlacingOrder ? '...' : t('checkout.placeOrder')}
        </button>
      </div>
    </div>
  );
}
