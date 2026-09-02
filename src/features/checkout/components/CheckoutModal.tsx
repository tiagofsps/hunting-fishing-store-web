import React, { useState } from 'react';
import type { CartItem } from '../../home-page/types';
import type { PaymentMethod, ShippingAddress, OrderResult } from '../types';
import { formatCurrency, getProductPrice } from '../../home-page/utils';
import { useLanguage } from '../../../i18n/LanguageContext';
import { STORE_CONFIG } from '../../../config/store';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderCompleted: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onOrderCompleted,
}: CheckoutModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const requiresLicense = cartItems.some((item) => item.product.requiresLicense);

  const [step, setStep] = useState<number>(1);
  const [shipping, setShipping] = useState<ShippingAddress>({
    fullName: '',
    email: '',
    phone: '',
    nif: '',
    street: '',
    postalCode: '',
    city: '',
    country: 'Portugal',
  });

  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mbway');
  const [mbwayPhone, setMbwayPhone] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');

  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.selectedItem ? item.selectedItem.price : getProductPrice(item.product);
    return acc + price * item.quantity;
  }, 0);

  const shippingFee = subtotal >= 75 ? 0 : 4.95;
  const total = subtotal + shippingFee;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (requiresLicense) {
        setStep(2);
      } else {
        setStep(3);
      }
    } else if (step === 2) {
      if (!licenseFile) {
        alert(t('checkout.licenseUploadLabel'));
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBackStep = () => {
    if (step === 3 && !requiresLicense) {
      setStep(1);
    } else {
      setStep(step - 1);
    }
  };

  const handlePlaceOrder = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      const generatedOrderId = `WL-${Math.floor(100000 + Math.random() * 900000)}`;

      const result: OrderResult = {
        orderId: generatedOrderId,
        createdAt: new Date().toISOString(),
        items: [...cartItems],
        subtotal,
        shippingFee,
        total,
        shipping,
        paymentMethod,
        mbwayPhone: paymentMethod === 'mbway' ? mbwayPhone || shipping.phone : undefined,
        multibancoEntity: paymentMethod === 'multibanco' ? '21345' : undefined,
        multibancoRef: paymentMethod === 'multibanco' ? `${Math.floor(100000000 + Math.random() * 900000000)}` : undefined,
      };

      setOrderResult(result);
      setIsSubmitting(false);
      setStep(5);
      onOrderCompleted();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/70 backdrop-blur-sm transition-opacity"
        onClick={step === 5 ? onClose : undefined}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div className="relative w-full max-w-3xl transform overflow-hidden rounded-3xl bg-surface-raised p-6 text-left shadow-2xl transition-all sm:p-8 border border-border">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-5 mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-accent-strong">
                {STORE_CONFIG.name} Store
              </span>
              <h2 className="text-xl font-black text-ink">{t('checkout.title')}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted hover:bg-surface-hover hover:text-ink transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Indicator (Steps 1 to 4) */}
          {step < 5 && (
            <div className="mb-8 flex items-center justify-between text-xs font-bold text-muted border-b border-border pb-4">
              <span className={step >= 1 ? 'text-accent-strong font-black' : ''}>
                1. {t('checkout.stepShipping')}
              </span>
              {requiresLicense && (
                <>
                  <span>→</span>
                  <span className={step >= 2 ? 'text-accent-strong font-black' : ''}>
                    2. {t('checkout.stepLicense')}
                  </span>
                </>
              )}
              <span>→</span>
              <span className={step >= 3 ? 'text-accent-strong font-black' : ''}>
                {requiresLicense ? '3' : '2'}. {t('checkout.stepPayment')}
              </span>
              <span>→</span>
              <span className={step >= 4 ? 'text-accent-strong font-black' : ''}>
                {requiresLicense ? '4' : '3'}. {t('checkout.stepReview')}
              </span>
            </div>
          )}

          {/* STEP 1: Shipping & Customer Info */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">{t('checkout.fullName')} *</label>
                  <input
                    type="text"
                    required
                    value={shipping.fullName}
                    onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                    className="w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">{t('checkout.email')} *</label>
                  <input
                    type="email"
                    required
                    value={shipping.email}
                    onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                    className="w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">{t('checkout.phone')} *</label>
                  <input
                    type="tel"
                    required
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    className="w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">{t('checkout.nif')}</label>
                  <input
                    type="text"
                    value={shipping.nif}
                    onChange={(e) => setShipping({ ...shipping, nif: e.target.value })}
                    className="w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">{t('checkout.address')} *</label>
                <input
                  type="text"
                  required
                  value={shipping.street}
                  onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                  className="w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">{t('checkout.postalCode')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="4000-000"
                    value={shipping.postalCode}
                    onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                    className="w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">{t('checkout.city')} *</label>
                  <input
                    type="text"
                    required
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    className="w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong"
                  />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 transition-all"
                >
                  {t('checkout.next')} →
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: License Upload */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5">
                <div className="flex items-center gap-3 text-amber-600 font-bold text-sm">
                  <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{t('checkout.licenseNoticeTitle')}</span>
                </div>
                <p className="mt-2 text-xs text-body leading-relaxed">
                  {t('checkout.licenseNoticeDesc')}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center bg-surface hover:border-accent-strong transition-colors">
                <input
                  type="file"
                  id="license-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="license-input" className="cursor-pointer flex flex-col items-center">
                  <svg className="h-10 w-10 text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-xs font-bold text-ink">{t('checkout.licenseUploadLabel')}</span>
                  {licenseFile && (
                    <span className="mt-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent-strong border border-accent/30">
                      {t('checkout.licenseFileSelected')} {licenseFile.name}
                    </span>
                  )}
                </label>
              </div>

              <div className="mt-8 pt-4 border-t border-border flex justify-between">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="rounded-xl border border-border bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
                >
                  ← {t('checkout.back')}
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!licenseFile}
                  className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 disabled:opacity-50"
                >
                  {t('checkout.next')} →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Method Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-ink">{t('checkout.paymentMethod')}</h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* MB Way */}
                <div
                  onClick={() => setPaymentMethod('mbway')}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    paymentMethod === 'mbway' ? 'border-accent-strong bg-accent/15 ring-2 ring-accent-strong' : 'border-border bg-surface hover:border-accent-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-ink text-sm">MB WAY</span>
                    <span className="h-3 w-3 rounded-full border border-ink flex items-center justify-center">
                      {paymentMethod === 'mbway' && <span className="h-2 w-2 rounded-full bg-accent-strong" />}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-tight">{t('checkout.mbwayDesc')}</p>
                </div>

                {/* Multibanco */}
                <div
                  onClick={() => setPaymentMethod('multibanco')}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    paymentMethod === 'multibanco' ? 'border-accent-strong bg-accent/15 ring-2 ring-accent-strong' : 'border-border bg-surface hover:border-accent-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-ink text-sm">Multibanco</span>
                    <span className="h-3 w-3 rounded-full border border-ink flex items-center justify-center">
                      {paymentMethod === 'multibanco' && <span className="h-2 w-2 rounded-full bg-accent-strong" />}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-tight">{t('checkout.multibancoDesc')}</p>
                </div>

                {/* Credit Card */}
                <div
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    paymentMethod === 'credit_card' ? 'border-accent-strong bg-accent/15 ring-2 ring-accent-strong' : 'border-border bg-surface hover:border-accent-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-ink text-sm">Cartão de Crédito</span>
                    <span className="h-3 w-3 rounded-full border border-ink flex items-center justify-center">
                      {paymentMethod === 'credit_card' && <span className="h-2 w-2 rounded-full bg-accent-strong" />}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-tight">{t('checkout.cardDesc')}</p>
                </div>

                {/* Klarna */}
                <div
                  onClick={() => setPaymentMethod('klarna')}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    paymentMethod === 'klarna' ? 'border-accent-strong bg-accent/15 ring-2 ring-accent-strong' : 'border-border bg-surface hover:border-accent-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-ink text-sm">Klarna.</span>
                    <span className="h-3 w-3 rounded-full border border-ink flex items-center justify-center">
                      {paymentMethod === 'klarna' && <span className="h-2 w-2 rounded-full bg-accent-strong" />}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-tight">{t('checkout.klarnaDesc')}</p>
                </div>
              </div>

              {/* Dynamic Inputs per Payment Method */}
              {paymentMethod === 'mbway' && (
                <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
                  <label className="block text-xs font-bold text-ink mb-1">{t('checkout.mbwayPhone')}</label>
                  <input
                    type="tel"
                    placeholder="910 000 000"
                    value={mbwayPhone || shipping.phone}
                    onChange={(e) => setMbwayPhone(e.target.value)}
                    className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-xs border border-border outline-none focus:border-accent-strong"
                  />
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div className="mt-4 rounded-2xl border border-border bg-surface p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">{t('checkout.cardNumber')}</label>
                    <input
                      type="text"
                      placeholder="4000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-xs border border-border outline-none focus:border-accent-strong"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">{t('checkout.cardExpiry')}</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-xs border border-border outline-none focus:border-accent-strong"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">{t('checkout.cardCvc')}</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-xs border border-border outline-none focus:border-accent-strong"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-border flex justify-between">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="rounded-xl border border-border bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
                >
                  ← {t('checkout.back')}
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
                >
                  {t('checkout.next')} →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-2 text-xs">
                <h4 className="font-bold text-ink uppercase tracking-wider mb-2">{t('checkout.stepShipping')}</h4>
                <p><strong className="text-ink">{shipping.fullName}</strong> ({shipping.email} • {shipping.phone})</p>
                <p className="text-muted">{shipping.street}, {shipping.postalCode} {shipping.city}</p>
                {shipping.nif && <p className="text-muted">NIF: {shipping.nif}</p>}
              </div>

              {/* Order Summary */}
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                <h4 className="font-bold text-ink uppercase tracking-wider text-xs">{t('cart.title')}</h4>
                <div className="divide-y divide-border max-h-48 overflow-y-auto">
                  {cartItems.map((item, idx) => {
                    const price = item.selectedItem ? item.selectedItem.price : getProductPrice(item.product);
                    return (
                      <div key={idx} className="py-2 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-ink">{item.product.name} (x{item.quantity})</p>
                          {item.selectedItem && <p className="text-[10px] text-muted">SKU: {item.selectedItem.sku}</p>}
                        </div>
                        <span className="font-bold text-ink">{formatCurrency(price * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border pt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-muted">
                    <span>{t('cart.subtotal')}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>{t('cart.shipping')}</span>
                    <span>{shippingFee === 0 ? t('cart.shippingFree') : formatCurrency(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between font-black text-ink text-base pt-2 border-t border-border">
                    <span>{t('cart.total')}</span>
                    <span className="text-accent-strong">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border flex justify-between">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="rounded-xl border border-border bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
                >
                  ← {t('checkout.back')}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handlePlaceOrder}
                  className="rounded-xl bg-accent px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent/90 shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? '...' : t('checkout.placeOrder')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Order Confirmation / Receipt */}
          {step === 5 && orderResult && (
            <div className="text-center py-6 space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-accent-strong border border-accent/40">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h3 className="text-2xl font-black text-ink">{t('checkout.orderSuccessTitle')}</h3>
                <p className="mt-1 text-xs text-muted">{t('checkout.orderSuccessDesc')}</p>
                <div className="mt-4 inline-block rounded-full bg-surface px-4 py-1.5 text-xs font-bold text-ink border border-border">
                  {t('checkout.orderReference')} <span className="text-accent-strong font-black">{orderResult.orderId}</span>
                </div>
              </div>

              {/* Dynamic Payment Instruction Card */}
              {orderResult.paymentMethod === 'multibanco' && (
                <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5 max-w-sm mx-auto text-left text-xs space-y-2">
                  <p className="font-bold text-ink uppercase tracking-wider">Dados de Pagamento Multibanco:</p>
                  <p><strong className="text-muted">{t('checkout.multibancoEntity')}</strong> <span className="font-black text-ink">{orderResult.multibancoEntity}</span></p>
                  <p><strong className="text-muted">{t('checkout.multibancoRef')}</strong> <span className="font-black text-ink">{orderResult.multibancoRef}</span></p>
                  <p><strong className="text-muted">{t('cart.total')}:</strong> <span className="font-black text-accent-strong">{formatCurrency(orderResult.total)}</span></p>
                </div>
              )}

              {orderResult.paymentMethod === 'mbway' && (
                <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5 max-w-sm mx-auto text-center text-xs space-y-1">
                  <p className="font-bold text-ink">{t('checkout.mbwayPushAlert')}</p>
                  <p className="text-muted">{t('checkout.mbwayPushSub')} <strong>{formatCurrency(orderResult.total)}</strong> ({orderResult.mbwayPhone})</p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-ink px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 transition-all shadow-md"
                >
                  {t('checkout.close')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
