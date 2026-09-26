import { Link } from 'react-router';
import type { CartItem } from '../types';
import { formatCurrency, getProductImageUrl, getProductPrice } from '../utils';
import { useLanguage } from '../i18n/useLanguage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, itemSku: string | undefined, delta: number) => void;
  onRemoveItem: (productId: number, itemSku?: string) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
}: CartDrawerProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => {
    const itemPrice = item.selectedItem ? item.selectedItem.price : getProductPrice(item.product);
    return acc + itemPrice * item.quantity;
  }, 0);

  const freeShippingThreshold = 75;
  const remainingForFreeShipping = freeShippingThreshold - subtotal;
  const progressPercent = Math.min(100, Math.max(0, (subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="pointer-events-auto relative w-screen max-w-md bg-surface shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-300">
          
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-ink">{t('cart.title')}</h2>
              <span className="rounded-full bg-accent/30 px-2.5 py-0.5 text-xs font-bold text-ink">
                {totalItemCount} {totalItemCount === 1 ? t('cart.itemSingular') : t('cart.itemPlural')}
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink hover:bg-surface-hover transition-colors"
              aria-label={t('cart.close')}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-surface-raised px-5 py-3 border-b border-border text-xs">
            {remainingForFreeShipping <= 0 ? (
              <p className="font-bold text-accent-strong">{t('cart.freeShippingAchieved')}</p>
            ) : (
              <p className="font-medium text-body">
                {t('cart.freeShippingRemainingPrefix')}
                <strong className="text-ink font-bold">{formatCurrency(remainingForFreeShipping)}</strong>
                {t('cart.freeShippingRemainingSuffix')}
              </p>
            )}
            <div className="mt-2 h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-accent-strong transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-raised text-muted mb-4 border border-border">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-base font-bold text-ink">{t('cart.emptyTitle')}</p>
                <p className="mt-1 text-xs text-muted max-w-xs">{t('cart.emptyDesc')}</p>
                <button
                  onClick={onClose}
                  className="mt-6 rounded-xl bg-ink px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
                >
                  {t('cart.continueShopping')}
                </button>
              </div>
            ) : (
              cartItems.map((item, index) => {
                const itemPrice = item.selectedItem ? item.selectedItem.price : getProductPrice(item.product);
                const imageUrl = getProductImageUrl(item.product);
                const sku = item.selectedItem?.sku;

                return (
                  <div
                    key={`${item.product.id}-${sku || index}`}
                    className="flex gap-4 p-3 rounded-2xl border border-border bg-surface-raised shadow-xs relative group"
                  >
                    <img
                      src={imageUrl}
                      alt={item.product.name}
                      className="h-20 w-20 rounded-xl object-cover border border-border bg-surface shrink-0"
                    />

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-xs font-bold text-ink line-clamp-1">{item.product.name}</h3>
                          <button
                            onClick={() => onRemoveItem(item.product.id, sku)}
                            className="text-muted hover:text-sale transition-colors p-1"
                            title={t('cart.removeTooltip')}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {item.selectedItem && (
                          <p className="text-[10px] text-muted mt-0.5">
                            SKU: {item.selectedItem.sku || 'N/A'} {item.selectedItem.attributes ? `• ${Object.values(item.selectedItem.attributes).join(' - ')}` : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-black text-ink">
                          {formatCurrency(itemPrice * item.quantity)}
                        </span>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, sku, -1)}
                            className="text-body hover:text-ink font-bold text-xs w-4 h-4 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-ink w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, sku, 1)}
                            className="text-body hover:text-ink font-bold text-xs w-4 h-4 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-border p-5 bg-surface-raised space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-body">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-bold text-ink">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-body">
                  <span>{t('cart.shipping')}</span>
                  <span className="font-bold text-accent-strong">
                    {subtotal >= freeShippingThreshold ? t('cart.shippingFree') : formatCurrency(4.95)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-ink pt-2 border-t border-border/60">
                  <span>{t('cart.total')}</span>
                  <span>
                    {formatCurrency(subtotal + (subtotal >= freeShippingThreshold ? 0 : 4.95))}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenCheckout();
                }}
                className="w-full rounded-xl bg-ink py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{t('cart.checkoutButton')}</span>
                <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <Link
                to="/cart"
                onClick={onClose}
                className="block w-full text-center text-[11px] font-bold uppercase tracking-wider text-muted hover:text-accent-strong transition-colors"
              >
                {t('cart.viewCart')}
              </Link>

              <button
                onClick={onClearCart}
                className="w-full text-center text-[11px] text-muted hover:text-sale transition-colors font-medium"
              >
                {t('cart.clearCart')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
