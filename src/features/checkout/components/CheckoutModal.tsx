import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CartItem, AuthUser } from '../../../types';
import { formatCurrency, getProductPrice, toAuthUser } from '../../../utils';
import { useLanguage } from '../../../i18n/useLanguage';
import { ApiError } from '../../../lib/apiClient';
import { addressSchema, type AddressFormData } from '../validation';
import * as api from '../api';
import { useCheckout } from '../hooks';
import type { PaymentMethod, OrderResult } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currentUser: AuthUser | null;
  onOrderCompleted: () => void;
  onRequireLogin: () => void;
  onUserUpdated: (user: AuthUser) => void;
}

type Step = 'address' | 'license' | 'payment' | 'review' | 'receipt';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  currentUser,
  onOrderCompleted,
  onRequireLogin,
  onUserUpdated,
}: CheckoutModalProps) {
  const { t } = useLanguage();
  const { isPlacingOrder, placeOrder } = useCheckout();

  const [step, setStep] = useState<Step>('address');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('multibanco');
  const [mbwayPhone, setMbwayPhone] = useState('');
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSavingLicense, setIsSavingLicense] = useState(false);

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipientName: '',
      recipientPhone: '',
      street: '',
      city: '',
      postalCode: '',
      countryCode: 'PT',
      addressType: 'SHIPPING',
    },
  });

  const licenseForm = useForm<{ huntingLicenseNumber?: string; fishingLicenseNumber?: string }>({
    defaultValues: {
      huntingLicenseNumber: currentUser?.huntingLicenseNumber ?? '',
      fishingLicenseNumber: currentUser?.fishingLicenseNumber ?? '',
    },
  });

  const wasOpenRef = useRef(false);

  // Reset the flow each time the modal opens (not on every user change).
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setStep('address');
      setError('');
      setOrderResult(null);
      setShowAddressForm(false);
      setSelectedAddressId(currentUser?.addresses[0]?.id ?? null);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, currentUser]);

  // Keep the license form in sync with the current user's profile.
  useEffect(() => {
    licenseForm.reset({
      huntingLicenseNumber: currentUser?.huntingLicenseNumber ?? '',
      fishingLicenseNumber: currentUser?.fishingLicenseNumber ?? '',
    });
  }, [currentUser, licenseForm]);

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className="fixed inset-0 bg-ink/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('checkout.title')}
            className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-surface-raised p-6 text-left shadow-2xl transition-all sm:p-8 border border-border"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted hover:bg-surface-hover hover:text-ink transition-colors"
              aria-label={t('common.close')}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-accent-strong border border-accent/40">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-ink">{t('checkout.signInRequired')}</h3>
              <p className="text-xs text-muted leading-relaxed">{t('checkout.signInRequiredDesc')}</p>
              <button
                type="button"
                onClick={onRequireLogin}
                className="mt-2 w-full rounded-xl bg-ink py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 active:scale-95 transition-all shadow-md"
              >
                {t('checkout.signInButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.selectedItem ? item.selectedItem.price : getProductPrice(item.product);
    return acc + price * item.quantity;
  }, 0);

  const shippingFee = subtotal >= 75 ? 0 : 4.95;
  const total = subtotal + shippingFee;

  const requiresLicense = cartItems.some((item) => item.product.requiresLicense);

  const requiredLicenseTypes = new Set<'HUNTING' | 'FISHING'>();
  cartItems.forEach((item) => {
    if (!item.product.requiresLicense) return;
    if (item.product.licenseType === 'HUNTING') requiredLicenseTypes.add('HUNTING');
    else if (item.product.licenseType === 'FISHING') requiredLicenseTypes.add('FISHING');
    else {
      requiredLicenseTypes.add('HUNTING');
      requiredLicenseTypes.add('FISHING');
    }
  });
  const missingHunting = requiredLicenseTypes.has('HUNTING') && !currentUser.huntingLicenseNumber;
  const missingFishing = requiredLicenseTypes.has('FISHING') && !currentUser.fishingLicenseNumber;
  const needsLicenseStep = missingHunting || missingFishing;

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) {
      if (err.status === 401) return t('auth.errorInvalidCredentials');
      if (err.status === 429) return t('auth.errorRateLimited');
      return err.message;
    }
    return t('checkout.errorGeneric');
  };

  const handleSaveAddress = async (data: AddressFormData) => {
    setError('');
    setIsSavingAddress(true);
    try {
      const updated = await api.addAddress(currentUser.id, data);
      onUserUpdated(toAuthUser(updated));
      const newAddress = updated.addresses[updated.addresses.length - 1];
      if (newAddress) setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
      addressForm.reset();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSaveLicense = async (data: { huntingLicenseNumber?: string; fishingLicenseNumber?: string }) => {
    setError('');
    setIsSavingLicense(true);
    try {
      const updated = await api.updateProfile(currentUser.id, {
        huntingLicenseNumber: data.huntingLicenseNumber || undefined,
        fishingLicenseNumber: data.fishingLicenseNumber || undefined,
      });
      onUserUpdated(toAuthUser(updated));
      setStep('payment');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSavingLicense(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (selectedAddressId === null) {
      setError(t('checkout.errorAddressRequired'));
      return;
    }
    if (paymentMethod === 'mbway' && mbwayPhone.trim().length < 9) {
      setError(t('checkout.errorMbwayPhone'));
      return;
    }
    setError('');
    try {
      const result = await placeOrder({
        userId: currentUser.id,
        shippingAddressId: selectedAddressId,
        paymentMethod,
        mbwayPhone: paymentMethod === 'mbway' ? mbwayPhone.trim() : undefined,
      });
      setOrderResult(result);
      setStep('receipt');
      onOrderCompleted();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const inputClass =
    'w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong text-ink font-medium';

  const stepNumber = (label: string, active: boolean, done: boolean) => (
    <span className={active ? 'text-accent-strong font-black' : done ? 'text-ink font-bold' : ''}>{label}</span>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/70 backdrop-blur-sm transition-opacity"
        onClick={step === 'receipt' ? onClose : undefined}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('checkout.title')}
          className="relative w-full max-w-3xl transform overflow-hidden rounded-3xl bg-surface-raised p-6 text-left shadow-2xl transition-all sm:p-8 border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-5 mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-accent-strong">
                {t('checkout.title')}
              </span>
              <h2 className="text-xl font-black text-ink">{t('checkout.title')}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted hover:bg-surface-hover hover:text-ink transition-colors"
              aria-label={t('common.close')}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Indicator */}
          {step !== 'receipt' && (
            <div className="mb-8 flex items-center justify-between text-xs font-bold text-muted border-b border-border pb-4">
              {stepNumber(`1. ${t('checkout.stepShipping')}`, step === 'address', false)}
              {needsLicenseStep && (
                <>
                  <span>→</span>
                  {stepNumber(`2. ${t('checkout.stepLicense')}`, step === 'license', false)}
                </>
              )}
              <span>→</span>
              {stepNumber(
                `${needsLicenseStep ? '3' : '2'}. ${t('checkout.stepPayment')}`,
                step === 'payment',
                false
              )}
              <span>→</span>
              {stepNumber(
                `${needsLicenseStep ? '4' : '3'}. ${t('checkout.stepReview')}`,
                step === 'review',
                false
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-sale/10 border border-sale/30 p-3 text-xs font-bold text-sale text-center">
              {error}
            </div>
          )}

          {/* STEP: Address */}
          {step === 'address' && (
            <div className="space-y-4">
              {currentUser.addresses.length > 0 && !showAddressForm ? (
                <>
                  <h3 className="text-sm font-bold text-ink">{t('checkout.selectAddress')}</h3>
                  <div className="space-y-3">
                    {currentUser.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-accent-strong bg-accent/15 ring-2 ring-accent-strong'
                            : 'border-border bg-surface hover:border-accent-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-ink text-sm">{addr.recipientName}</p>
                            <p className="mt-1 text-xs text-muted">
                              {addr.street}, {addr.postalCode} {addr.city}
                            </p>
                            <p className="text-xs text-muted">
                              {addr.countryCode} • {addr.recipientPhone}
                            </p>
                          </div>
                          <span className="h-3 w-3 rounded-full border border-ink flex items-center justify-center">
                            {selectedAddressId === addr.id && <span className="h-2 w-2 rounded-full bg-accent-strong" />}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="text-xs font-bold text-accent-strong hover:underline"
                  >
                    + {t('checkout.addNewAddress')}
                  </button>
                  <div className="mt-8 pt-4 border-t border-border flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(needsLicenseStep ? 'license' : 'payment')}
                      disabled={selectedAddressId === null}
                      className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 disabled:opacity-50 transition-all"
                    >
                      {t('checkout.next')} →
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={addressForm.handleSubmit(handleSaveAddress)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">{t('checkout.recipientName')} *</label>
                      <input type="text" {...addressForm.register('recipientName')} className={inputClass} />
                      {addressForm.formState.errors.recipientName && (
                        <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">{t('checkout.recipientPhone')} *</label>
                      <input type="tel" {...addressForm.register('recipientPhone')} className={inputClass} />
                      {addressForm.formState.errors.recipientPhone && (
                        <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">{t('checkout.address')} *</label>
                    <input type="text" {...addressForm.register('street')} className={inputClass} />
                    {addressForm.formState.errors.street && (
                      <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">{t('checkout.postalCode')} *</label>
                      <input type="text" placeholder="4000-000" {...addressForm.register('postalCode')} className={inputClass} />
                      {addressForm.formState.errors.postalCode && (
                        <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">{t('checkout.city')} *</label>
                      <input type="text" {...addressForm.register('city')} className={inputClass} />
                      {addressForm.formState.errors.city && (
                        <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">{t('checkout.countryCode')} *</label>
                      <input type="text" maxLength={2} placeholder="PT" {...addressForm.register('countryCode')} className={inputClass} />
                      {addressForm.formState.errors.countryCode && (
                        <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorCountryCode')}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">{t('checkout.addressType')}</label>
                    <select {...addressForm.register('addressType')} className={inputClass}>
                      <option value="SHIPPING">{t('checkout.shipping')}</option>
                      <option value="BILLING">{t('checkout.billing')}</option>
                    </select>
                  </div>

                  <div className="mt-8 pt-4 border-t border-border flex justify-between">
                    {currentUser.addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="rounded-xl border border-border bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
                      >
                        {t('checkout.cancel')}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSavingAddress}
                      className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 disabled:opacity-50 transition-all"
                    >
                      {isSavingAddress ? '...' : t('checkout.saveAddress')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP: License */}
          {step === 'license' && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5">
                <div className="flex items-center gap-3 text-amber-600 font-bold text-sm">
                  <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{t('checkout.licenseMissingTitle')}</span>
                </div>
                <p className="mt-2 text-xs text-body leading-relaxed">{t('checkout.licenseMissingDesc')}</p>
              </div>

              <form onSubmit={licenseForm.handleSubmit(handleSaveLicense)} className="space-y-4">
                {missingHunting && (
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">{t('checkout.huntingLicense')}</label>
                    <input type="text" {...licenseForm.register('huntingLicenseNumber')} className={inputClass} />
                  </div>
                )}
                {missingFishing && (
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">{t('checkout.fishingLicense')}</label>
                    <input type="text" {...licenseForm.register('fishingLicenseNumber')} className={inputClass} />
                  </div>
                )}

                <div className="mt-8 pt-4 border-t border-border flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('address')}
                    className="rounded-xl border border-border bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
                  >
                    ← {t('checkout.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingLicense}
                    className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 disabled:opacity-50 transition-all"
                  >
                    {isSavingLicense ? '...' : t('checkout.saveLicense')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP: Payment */}
          {step === 'payment' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-ink">{t('checkout.paymentMethod')}</h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ['mbway', 'MB WAY', 'checkout.mbwayDesc'],
                    ['multibanco', 'Multibanco', 'checkout.multibancoDesc'],
                    ['credit_card', 'Cartão de Crédito', 'checkout.cardDesc'],
                    ['klarna', 'Klarna.', 'checkout.klarnaDesc'],
                  ] as const
                ).map(([method, label, descKey]) => (
                  <div
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      paymentMethod === method
                        ? 'border-accent-strong bg-accent/15 ring-2 ring-accent-strong'
                        : 'border-border bg-surface hover:border-accent-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-ink text-sm">{label}</span>
                      <span className="h-3 w-3 rounded-full border border-ink flex items-center justify-center">
                        {paymentMethod === method && <span className="h-2 w-2 rounded-full bg-accent-strong" />}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted leading-tight">{t(descKey)}</p>
                  </div>
                ))}
              </div>

              {paymentMethod === 'mbway' && (
                <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
                  <label className="block text-xs font-bold text-ink mb-1">{t('checkout.mbwayPhone')}</label>
                  <input
                    type="tel"
                    placeholder="910 000 000"
                    value={mbwayPhone}
                    onChange={(e) => setMbwayPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-border flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(needsLicenseStep ? 'license' : 'address')}
                  className="rounded-xl border border-border bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
                >
                  ← {t('checkout.back')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 transition-all"
                >
                  {t('checkout.next')} →
                </button>
              </div>
            </div>
          )}

          {/* STEP: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              {requiresLicense && (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
                  <p className="text-xs font-bold text-amber-600">{t('checkout.licenseNoticeTitle')}</p>
                  <p className="mt-1 text-xs text-body leading-relaxed">{t('checkout.licenseNoticeDesc')}</p>
                </div>
              )}

              <div className="rounded-2xl border border-border bg-surface p-4 space-y-2 text-xs">
                <h4 className="font-bold text-ink uppercase tracking-wider mb-2">{t('checkout.stepShipping')}</h4>
                {(() => {
                  const addr = currentUser.addresses.find((a) => a.id === selectedAddressId);
                  if (!addr) return <p className="text-muted">{t('checkout.errorAddressRequired')}</p>;
                  return (
                    <>
                      <p>
                        <strong className="text-ink">{addr.recipientName}</strong> ({addr.recipientPhone})
                      </p>
                      <p className="text-muted">
                        {addr.street}, {addr.postalCode} {addr.city} ({addr.countryCode})
                      </p>
                    </>
                  );
                })()}
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
                          <p className="font-bold text-ink">
                            {item.product.name} (x{item.quantity})
                          </p>
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
                  onClick={() => setStep('payment')}
                  className="rounded-xl border border-border bg-surface px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
                >
                  ← {t('checkout.back')}
                </button>
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="rounded-xl bg-accent px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent/90 shadow-md active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isPlacingOrder ? '...' : t('checkout.placeOrder')}
                </button>
              </div>
            </div>
          )}

          {/* STEP: Receipt */}
          {step === 'receipt' && orderResult && (
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
                  {t('checkout.orderReference')}{' '}
                  <span className="text-accent-strong font-black">{orderResult.order.orderNumber}</span>
                </div>
              </div>

              {/* Dynamic Payment Instruction Card */}
              {orderResult.payment.paymentMethod === 'MULTIBANCO' && (
                <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5 max-w-sm mx-auto text-left text-xs space-y-2">
                  <p className="font-bold text-ink uppercase tracking-wider">{t('checkout.multibancoTitle')}</p>
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
                <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5 max-w-sm mx-auto text-center text-xs space-y-1">
                  <p className="font-bold text-ink">{t('checkout.mbwayPushAlert')}</p>
                  <p className="text-muted">
                    {t('checkout.mbwayPushSub')} <strong>{formatCurrency(orderResult.payment.amount)}</strong> (
                    {orderResult.payment.mbwayPhone})
                  </p>
                </div>
              )}

              {(orderResult.payment.paymentMethod === 'CREDIT_CARD' || orderResult.payment.paymentMethod === 'KLARNA') &&
                orderResult.payment.paymentUrl && (
                  <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5 max-w-sm mx-auto text-center text-xs space-y-2">
                    <p className="font-bold text-ink">{t('checkout.paymentUrlTitle')}</p>
                    <a
                      href={orderResult.payment.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90 transition-all"
                    >
                      {t('checkout.paymentUrl')}
                    </a>
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