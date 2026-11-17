import { useLanguage } from '../../../i18n/useLanguage';
import { localizedText } from '../../../i18n/localizedContent';
import { formatCurrency, getProductPrice } from '../../../utils';
import type { CartItem } from '../../../types';

interface OrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
}

/** Sticky side panel listing the cart lines and the totals. */
export function OrderSummary({ cartItems, subtotal, shippingFee, total }: OrderSummaryProps) {
  const { language, t } = useLanguage();

  return (
    <aside className="h-fit rounded-3xl border border-border bg-surface-raised p-6 lg:sticky lg:top-32">
      <h2 className="text-xs font-bold uppercase tracking-widest text-ink">{t('cart.orderSummary')}</h2>
      <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto">
        {cartItems.map((item) => {
          const price = item.selectedItem ? item.selectedItem.price : getProductPrice(item.product);
          const productText = localizedText(item.product, language);
          return (
            <li key={`${item.product.id}-${item.selectedItem?.id ?? 'default'}`} className="flex justify-between gap-3 text-xs">
              <span className="font-bold text-ink">
                {productText.name} <span className="text-muted">x{item.quantity}</span>
              </span>
              <span className="shrink-0 font-bold text-ink">{formatCurrency(price * item.quantity)}</span>
            </li>
          );
        })}
      </ul>
      <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-body">
          <dt>{t('cart.subtotal')}</dt>
          <dd className="font-bold text-ink">{formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex justify-between text-body">
          <dt>{t('cart.shipping')}</dt>
          <dd className={`font-bold ${shippingFee === 0 ? 'text-accent-strong' : 'text-ink'}`}>
            {shippingFee === 0 ? t('cart.shippingFree') : formatCurrency(shippingFee)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-black text-ink">
          <dt>{t('cart.total')}</dt>
          <dd>{formatCurrency(total)}</dd>
        </div>
      </dl>
    </aside>
  );
}
