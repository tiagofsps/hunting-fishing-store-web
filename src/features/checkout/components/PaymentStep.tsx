import { useLanguage } from '../../../i18n/useLanguage';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import type { PaymentMethod } from '../types';

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  mbwayPhone: string;
  onMbwayPhoneChange: (phone: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const PAYMENT_METHODS = [
  ['mbway', 'checkout.mbwayLabel', 'checkout.mbwayDesc'],
  ['multibanco', 'checkout.multibancoLabel', 'checkout.multibancoDesc'],
  ['credit_card', 'checkout.cardLabel', 'checkout.cardDesc'],
  ['klarna', 'checkout.klarnaLabel', 'checkout.klarnaDesc'],
] as const;

/** Step 3: choose how to pay. MB WAY also needs the customer's phone number. */
export function PaymentStep({
  paymentMethod,
  onPaymentMethodChange,
  mbwayPhone,
  onMbwayPhoneChange,
  onBack,
  onNext,
}: PaymentStepProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-ink">{t('checkout.paymentMethod')}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {PAYMENT_METHODS.map(([method, labelKey, descKey]) => (
          <div
            key={method}
            onClick={() => onPaymentMethodChange(method)}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              paymentMethod === method
                ? 'border-accent-strong bg-accent/15 ring-2 ring-accent-strong'
                : 'border-border bg-surface hover:border-accent-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-ink">{t(labelKey)}</span>
              <span className="flex h-3 w-3 items-center justify-center rounded-full border border-ink">
                {paymentMethod === method && <span className="h-2 w-2 rounded-full bg-accent-strong" />}
              </span>
            </div>
            <p className="mt-2 text-xs leading-tight text-muted">{t(descKey)}</p>
          </div>
        ))}
      </div>

      {paymentMethod === 'mbway' && (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Label>{t('checkout.mbwayPhone')}</Label>
          <Input
            type="tel"
            placeholder="910 000 000"
            value={mbwayPhone}
            onChange={(e) => onMbwayPhoneChange(e.target.value)}
          />
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
          type="button"
          onClick={onNext}
          className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90"
        >
          {t('checkout.next')} →
        </button>
      </div>
    </div>
  );
}
