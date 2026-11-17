import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '../../cart/hooks';
import { useAuth } from '../../auth/hooks';
import { toAuthUser } from '../../../utils';
import { useLanguage } from '../../../i18n/useLanguage';
import { ApiError } from '../../../lib/apiClient';
import { addressSchema, type AddressFormData } from '../validation';
import * as api from '../api';
import { useCheckout } from '../hooks';
import type { CheckoutStep, PaymentMethod } from '../types';
import type { OrderResult } from '../../../lib/ordersApi';
import { AddressStep } from './AddressStep';
import { LicenseStep, type LicenseFormValues } from './LicenseStep';
import { OrderSummary } from './OrderSummary';
import { PaymentStep } from './PaymentStep';
import { ReceiptStep } from './ReceiptStep';
import { ReviewStep } from './ReviewStep';
import { StepIndicator } from './StepIndicator';

/** Display-only estimate; the backend computes the authoritative order total. */
const FREE_SHIPPING_THRESHOLD = 75;
const SHIPPING_FEE = 4.95;

/**
 * Checkout container: owns the step state, forms and API calls, and renders one
 * step component per stage. The steps themselves are presentational.
 */
export default function CheckoutPage() {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const { cartItems, clearCart, subtotal } = useCart();
  const { isPlacingOrder, placeOrder } = useCheckout();

  const [step, setStep] = useState<CheckoutStep>('address');
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

  const licenseForm = useForm<LicenseFormValues>({
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

  const selectedAddress = user.addresses.find((a) => a.id === selectedAddressId);

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

  const handleSaveLicense = async (data: LicenseFormValues) => {
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

  const goToAfterAddress = () => setStep(needsLicenseStep ? 'license' : 'payment');

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

        {step !== 'receipt' && <StepIndicator step={step} needsLicenseStep={needsLicenseStep} />}

        {error && (
          <div className="mt-6 rounded-xl border border-sale/30 bg-sale/10 p-3 text-center text-xs font-bold text-sale">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            {step === 'address' && (
              <AddressStep
                addresses={user.addresses}
                selectedAddressId={selectedAddressId}
                onSelectAddress={setSelectedAddressId}
                showAddressForm={showAddressForm}
                onShowAddressForm={setShowAddressForm}
                addressForm={addressForm}
                onSaveAddress={handleSaveAddress}
                isSavingAddress={isSavingAddress}
                onContinue={goToAfterAddress}
              />
            )}

            {step === 'license' && (
              <LicenseStep
                missingHunting={missingHunting}
                missingFishing={missingFishing}
                licenseForm={licenseForm}
                onSave={handleSaveLicense}
                isSavingLicense={isSavingLicense}
                onBack={() => setStep('address')}
              />
            )}

            {step === 'payment' && (
              <PaymentStep
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                mbwayPhone={mbwayPhone}
                onMbwayPhoneChange={setMbwayPhone}
                onBack={() => setStep(needsLicenseStep ? 'license' : 'address')}
                onNext={() => setStep('review')}
              />
            )}

            {step === 'review' && (
              <ReviewStep
                requiresLicense={requiresLicense}
                address={selectedAddress}
                couponCode={couponCode}
                onCouponCodeChange={setCouponCode}
                onBack={() => setStep('payment')}
                onPlaceOrder={handlePlaceOrder}
                isPlacingOrder={isPlacingOrder}
              />
            )}

            {step === 'receipt' && orderResult && <ReceiptStep orderResult={orderResult} />}
          </div>

          {step !== 'receipt' && (
            <OrderSummary cartItems={cartItems} subtotal={subtotal} shippingFee={shippingFee} total={total} />
          )}
        </div>
      </div>
    </div>
  );
}
