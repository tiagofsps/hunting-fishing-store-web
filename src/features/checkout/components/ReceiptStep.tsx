import { Link, useNavigate } from 'react-router';
import { useLanguage } from '../../../i18n/useLanguage';
import { formatCurrency } from '../../../utils';
import type { OrderResult } from '../../../lib/ordersApi';

interface ReceiptStepProps {
  orderResult: OrderResult;
}

/** Confirmation screen shown after the order is placed, with the payment instructions. */
export function ReceiptStep({ orderResult }: ReceiptStepProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-accent/40 bg-accent/20 text-accent-strong">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-black text-ink">{t('checkout.orderSuccessTitle')}</h2>
        <p className="mt-1 text-xs text-muted">{t('checkout.orderSuccessDesc')}</p>
        <div className="mt-4 inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-bold text-ink">
          {t('checkout.orderReference')}{' '}
          <span className="font-black text-accent-strong">{orderResult.order.orderNumber}</span>
        </div>
      </div>

      {orderResult.payment.paymentMethod === 'MULTIBANCO' && (
        <div className="mx-auto max-w-sm space-y-2 rounded-2xl border border-accent/40 bg-accent/10 p-5 text-left text-xs">
          <p className="font-bold uppercase tracking-wider text-ink">{t('checkout.multibancoTitle')}</p>
          <p>
            <strong className="text-muted">{t('checkout.multibancoEntity')}</strong>{' '}
            <span className="font-black text-ink">{orderResult.payment.multibancoEntity}</span>
          </p>
          <p>
            <strong className="text-muted">{t('checkout.multibancoRef')}</strong>{' '}
            <span className="font-black text-ink">{orderResult.payment.multibancoReference}</span>
          </p>
          <p>
            <strong className="text-muted">{t('cart.total')}:</strong>{' '}
            <span className="font-black text-accent-strong">{formatCurrency(orderResult.payment.amount)}</span>
          </p>
          {orderResult.payment.referenceExpiresAt && (
            <p className="text-muted">
              {t('checkout.paymentExpiry')}{' '}
              <span className="font-bold text-ink">
                {new Date(orderResult.payment.referenceExpiresAt).toLocaleString()}
              </span>
            </p>
          )}
        </div>
      )}

      {orderResult.payment.paymentMethod === 'MBWAY' && (
        <div className="mx-auto max-w-sm space-y-1 rounded-2xl border border-accent/40 bg-accent/10 p-5 text-center text-xs">
          <p className="font-bold text-ink">{t('checkout.mbwayPushAlert')}</p>
          <p className="text-muted">
            {t('checkout.mbwayPushSub')} <strong>{formatCurrency(orderResult.payment.amount)}</strong> (
            {orderResult.payment.mbwayPhone})
          </p>
        </div>
      )}

      {(orderResult.payment.paymentMethod === 'CREDIT_CARD' || orderResult.payment.paymentMethod === 'KLARNA') &&
        orderResult.payment.paymentUrl && (
          <div className="mx-auto max-w-sm space-y-2 rounded-2xl border border-accent/40 bg-accent/10 p-5 text-center text-xs">
            <p className="font-bold text-ink">{t('checkout.paymentUrlTitle')}</p>
            <a
              href={orderResult.payment.paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90"
            >
              {t('checkout.paymentUrl')}
            </a>
          </div>
        )}

      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border pt-4">
        <Link
          to={`/account/orders/${orderResult.order.orderNumber}`}
          className="rounded-xl border border-accent-border bg-accent/10 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-accent-strong hover:bg-accent/20"
        >
          {t('orders.detailTitle')}
        </Link>
        <Link
          to="/account/orders"
          className="rounded-xl border border-border bg-surface-raised px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
        >
          {t('checkout.viewMyOrders')}
        </Link>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-xl bg-ink px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-ink/90"
        >
          {t('checkout.close')}
        </button>
      </div>
    </div>
  );
}
