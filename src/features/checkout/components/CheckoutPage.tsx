import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '../../cart/hooks';
import { useAuth } from '../../auth/hooks';
import { formatCurrency, getProductPrice, toAuthUser } from '../../../utils';
import { useLanguage } from '../../../i18n/useLanguage';
import { ApiError } from '../../../lib/apiClient';
import { addressSchema, type AddressFormData } from '../validation';
import * as api from '../api';
import { useCheckout } from '../hooks';
import type { PaymentMethod } from '../types';
import type { OrderResult } from '../../../lib/ordersApi';

/** Display-only estimate; the backend computes the authoritative order total. */
const FREE_SHIPPING_THRESHOLD = 75;
const SHIPPING_FEE = 4.95;

type Step = 'address' | 'license' | 'payment' | 'review' | 'receipt';

const INPUT_CLASS =
  'w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong text-ink font-medium';

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const { cartItems, clearCart, subtotal } = useCart();
  const { isPlacingOrder, placeOrder } = useCheckout();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('address');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(user?.addresses[0]?.id ?? null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('multibanco');
  const [mbwayPhone, setMbwayPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
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
      huntingLicenseNumber: user?.huntingLicenseNumber ?? '',
      fishingLicenseNumber: user?.fishingLicenseNumber ?? '',
    },
  });

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
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
  const missingHunting = requiredLicenseTypes.has('HUNTING') && !user?.huntingLicenseNumber;
  const missingFishing = requiredLicenseTypes.has('FISHING') && !user?.fishingLicenseNumber;
  const needsLicenseStep = missingHunting || missingFishing;

  if (!user) return null;
  // The backend rejects an empty cart with a 500, so guard before submitting.
  if (cartItems.length === 0 && step !== 'receipt') return <Navigate to="/cart" replace />;

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
      const updated = await api.addAddress(user.id, data);
      updateUser(toAuthUser(updated));
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
      const updated = await api.updateProfile(user.id, {
        huntingLicenseNumber: data.huntingLicenseNumber || undefined,
        fishingLicenseNumber: data.fishingLicenseNumber || undefined,
      });
      updateUser(toAuthUser(updated));
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
    // Build the order from the lines the user actually sees, so the placed
    // order matches the summary. A line with no productItemId cannot be
    // ordered; rather than silently dropping it (which would create an order
    // missing items the customer paid for) or sending an empty array (which
    // the backend rejects as an empty cart), omit `items` and let the backend
    // fall back to the server cart.
    const orderable = cartItems.flatMap((i) =>
      i.selectedItem ? [{ productItemId: i.selectedItem.id, quantity: i.quantity }] : []
    );
    const items = cartItems.length > 0 && orderable.length === cartItems.length ? orderable : undefined;
    try {
      const result = await placeOrder({
        userId: user.id,
        shippingAddressId: selectedAddressId,
        couponCode: couponCode.trim() || undefined,
        items,
        paymentMethod,
        mbwayPhone: paymentMethod === 'mbway' ? mbwayPhone.trim() : undefined,
      });
      setOrderResult(result);
      setStep('receipt');
      clearCart();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const stepLabel = (label: string, active: boolean) => (
    <span className={active ? 'text-accent-strong font-black' : 'text-muted font-bold'}>{label}</span>
  );

  const summaryPanel = (
    <aside className="h-fit rounded-3xl border border-border bg-surface-raised p-6 lg:sticky lg:top-32">
      <h2 className="text-xs font-bold uppercase tracking-widest text-ink">{t('cart.orderSummary')}</h2>
      <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto">
        {cartItems.map((item) => {
          const price = item.selectedItem ? item.selectedItem.price : getProductPrice(item.product);
          return (
            <li key={`${item.product.id}-${item.selectedItem?.id ?? 'default'}`} className="flex justify-between gap-3 text-xs">
              <span className="font-bold text-ink">
                {item.product.name} <span className="text-muted">x{item.quantity}</span>
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

  return (
    <div className="bg-surface py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-accent-strong">{t('checkout.title')}</span>
            <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">{t('checkout.title')}</h1>
          </div>
          {step !== 'receipt' && (
            <Link
              to="/cart"
              className="rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-body hover:bg-surface-hover"
            >
              ← {t('checkout.backToCart')}
            </Link>
          )}
        </header>

        {/* Step indicator */}
        {step !== 'receipt' && (
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
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-sale/30 bg-sale/10 p-3 text-center text-xs font-bold text-sale">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            {/* STEP: Address */}
            {step === 'address' && (
              <div className="space-y-4">
                {user.addresses.length > 0 && !showAddressForm ? (
                  <>
                    <h3 className="text-sm font-bold text-ink">{t('checkout.selectAddress')}</h3>
                    <div className="space-y-3">
                      {user.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                            selectedAddressId === addr.id
                              ? 'border-accent-strong bg-accent/15 ring-2 ring-accent-strong'
                              : 'border-border bg-surface hover:border-accent-border'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-ink">{addr.recipientName}</p>
                              <p className="mt-1 text-xs text-muted">
                                {addr.street}, {addr.postalCode} {addr.city}
                              </p>
                              <p className="text-xs text-muted">
                                {addr.countryCode} • {addr.recipientPhone}
                              </p>
                            </div>
                            <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full border border-ink">
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
                    <div className="mt-8 flex justify-end border-t border-border pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(needsLicenseStep ? 'license' : 'payment')}
                        disabled={selectedAddressId === null}
                        className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
                      >
                        {t('checkout.next')} →
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={addressForm.handleSubmit(handleSaveAddress)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-ink">{t('checkout.recipientName')} *</label>
                        <input type="text" {...addressForm.register('recipientName')} className={INPUT_CLASS} />
                        {addressForm.formState.errors.recipientName && (
                          <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-ink">{t('checkout.recipientPhone')} *</label>
                        <input type="tel" {...addressForm.register('recipientPhone')} className={INPUT_CLASS} />
                        {addressForm.formState.errors.recipientPhone && (
                          <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink">{t('checkout.address')} *</label>
                      <input type="text" {...addressForm.register('street')} className={INPUT_CLASS} />
                      {addressForm.formState.errors.street && (
                        <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-ink">{t('checkout.postalCode')} *</label>
                        <input type="text" placeholder="4000-000" {...addressForm.register('postalCode')} className={INPUT_CLASS} />
                        {addressForm.formState.errors.postalCode && (
                          <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-ink">{t('checkout.city')} *</label>
                        <input type="text" {...addressForm.register('city')} className={INPUT_CLASS} />
                        {addressForm.formState.errors.city && (
                          <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorRequired')}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-ink">{t('checkout.countryCode')} *</label>
                        <input type="text" maxLength={2} placeholder="PT" {...addressForm.register('countryCode')} className={INPUT_CLASS} />
                        {addressForm.formState.errors.countryCode && (
                          <p className="mt-1 text-[11px] font-bold text-sale">{t('checkout.errorCountryCode')}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink">{t('checkout.addressType')}</label>
                      <select {...addressForm.register('addressType')} className={INPUT_CLASS}>
                        <option value="SHIPPING">{t('checkout.shipping')}</option>
                        <option value="BILLING">{t('checkout.billing')}</option>
                      </select>
                    </div>

                    <div className="mt-8 flex justify-between border-t border-border pt-4">
                      {user.addresses.length > 0 && (
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
                        className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
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
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                  <div className="flex items-center gap-3 text-sm font-bold text-amber-600">
                    <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{t('checkout.licenseMissingTitle')}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-body">{t('checkout.licenseMissingDesc')}</p>
                </div>

                <form onSubmit={licenseForm.handleSubmit(handleSaveLicense)} className="space-y-4">
                  {missingHunting && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink">{t('checkout.huntingLicense')}</label>
                      <input type="text" {...licenseForm.register('huntingLicenseNumber')} className={INPUT_CLASS} />
                    </div>
                  )}
                  {missingFishing && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink">{t('checkout.fishingLicense')}</label>
                      <input type="text" {...licenseForm.register('fishingLicenseNumber')} className={INPUT_CLASS} />
                    </div>
                  )}

                  <div className="mt-8 flex justify-between border-t border-border pt-4">
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
                      className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
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
                      ['mbway', 'checkout.mbwayLabel', 'checkout.mbwayDesc'],
                      ['multibanco', 'checkout.multibancoLabel', 'checkout.multibancoDesc'],
                      ['credit_card', 'checkout.cardLabel', 'checkout.cardDesc'],
                      ['klarna', 'checkout.klarnaLabel', 'checkout.klarnaDesc'],
                    ] as const
                  ).map(([method, labelKey, descKey]) => (
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
                    <label className="mb-1 block text-xs font-bold text-ink">{t('checkout.mbwayPhone')}</label>
                    <input
                      type="tel"
                      placeholder="910 000 000"
                      value={mbwayPhone}
                      onChange={(e) => setMbwayPhone(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                )}

                <div className="mt-8 flex justify-between border-t border-border pt-4">
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
                    className="rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90"
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
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-xs font-bold text-amber-600">{t('checkout.licenseNoticeTitle')}</p>
                    <p className="mt-1 text-xs leading-relaxed text-body">{t('checkout.licenseNoticeDesc')}</p>
                  </div>
                )}

                <div className="space-y-2 rounded-2xl border border-border bg-surface p-4 text-xs">
                  <h3 className="mb-2 font-bold uppercase tracking-wider text-ink">{t('checkout.stepShipping')}</h3>
                  {(() => {
                    const addr = user.addresses.find((a) => a.id === selectedAddressId);
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

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <label className="mb-1 block text-xs font-bold text-ink">{t('checkout.couponLabel')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder={t('checkout.couponPlaceholder')}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted">{t('checkout.couponHint')}</p>
                </div>

                <div className="mt-8 flex justify-between border-t border-border pt-4">
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
                    className="rounded-xl bg-accent px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-ink shadow-md transition-all hover:bg-accent/90 active:scale-95 disabled:opacity-50"
                  >
                    {isPlacingOrder ? '...' : t('checkout.placeOrder')}
                  </button>
                </div>
              </div>
            )}

            {/* STEP: Receipt */}
            {step === 'receipt' && orderResult && (
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
            )}
          </div>

          {step !== 'receipt' && summaryPanel}
        </div>
      </div>
    </div>
  );
}