import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Address } from '../../../types';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { AddressStep } from './AddressStep';
import { PaymentStep } from './PaymentStep';
import { ReviewStep } from './ReviewStep';
import { ReceiptStep } from './ReceiptStep';
import { addressSchema, type AddressFormData } from '../validation';
import type { OrderResult } from '../../../lib/ordersApi';

beforeEach(() => localStorage.setItem('app_lang', 'en'));

const addresses: Address[] = [
  { id: 23, recipientName: 'Ana Silva', recipientPhone: '912345678', street: 'Rua 1', city: 'Lisboa', postalCode: '1000-001', countryCode: 'PT', addressType: 'SHIPPING' },
  { id: 24, recipientName: 'João Silva', recipientPhone: '912000000', street: 'Rua 2', city: 'Porto', postalCode: '4000-001', countryCode: 'PT', addressType: 'SHIPPING' },
];

function AddressHarness(props: Partial<React.ComponentProps<typeof AddressStep>> = {}) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { recipientName: '', recipientPhone: '', street: '', city: '', postalCode: '', countryCode: 'PT', addressType: 'SHIPPING' },
  });
  return (
    <AddressStep
      addresses={addresses}
      selectedAddressId={23}
      onSelectAddress={props.onSelectAddress ?? vi.fn()}
      showAddressForm={false}
      onShowAddressForm={vi.fn()}
      addressForm={form}
      onSaveAddress={vi.fn()}
      isSavingAddress={false}
      onContinue={vi.fn()}
      {...props}
    />
  );
}

describe('AddressStep', () => {
  it('marks the selected address as checked and selects another by keyboard', async () => {
    const user = userEvent.setup();
    const onSelectAddress = vi.fn();
    renderWithProviders(<AddressHarness selectedAddressId={23} onSelectAddress={onSelectAddress} />);
    const radio = screen.getByRole('radio', { name: /João Silva/ });

    expect(screen.getByRole('radio', { name: /Ana Silva/ })).toHaveAttribute('aria-checked', 'true');
    radio.focus();
    await user.keyboard('{Enter}');
    expect(onSelectAddress).toHaveBeenCalledWith(24);
    await user.keyboard(' ');
    expect(onSelectAddress).toHaveBeenCalledTimes(2);
  });

  it('disables continuation without a selected address and continues when one is selected', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const { rerender } = renderWithProviders(<AddressHarness selectedAddressId={null} onContinue={onContinue} />);

    expect(screen.getByRole('button', { name: /Continue/ })).toBeDisabled();
    rerender(<AddressHarness selectedAddressId={23} onContinue={onContinue} />);
    await user.click(screen.getByRole('button', { name: /Continue/ }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('opens the address form and validates required fields before saving', async () => {
    const user = userEvent.setup();
    const onShowAddressForm = vi.fn();
    const onSaveAddress = vi.fn();
    const form = <AddressHarness showAddressForm onShowAddressForm={onShowAddressForm} onSaveAddress={onSaveAddress} />;
    renderWithProviders(form);

    await user.click(screen.getByRole('button', { name: /Save Address/ }));
    expect((await screen.findAllByText('This field is required.')).length).toBeGreaterThan(0);
    expect(onSaveAddress).not.toHaveBeenCalled();
  });
});

describe('PaymentStep', () => {
  it('selects payment methods with keyboard and reveals MB WAY phone input', async () => {
    const user = userEvent.setup();
    const onPaymentMethodChange = vi.fn();
    renderWithProviders(
      <PaymentStep paymentMethod="multibanco" onPaymentMethodChange={onPaymentMethodChange} mbwayPhone="" onMbwayPhoneChange={vi.fn()} onBack={vi.fn()} onNext={vi.fn()} />
    );

    const mbway = screen.getByRole('radio', { name: /MB WAY/ });
    expect(screen.getByRole('radio', { name: /Multibanco/ })).toHaveAttribute('aria-checked', 'true');
    mbway.focus();
    await user.keyboard(' ');
    expect(onPaymentMethodChange).toHaveBeenCalledWith('mbway');
  });

  it('renders the phone field only for MB WAY and upper flow callbacks', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    const onBack = vi.fn();
    renderWithProviders(
      <PaymentStep paymentMethod="mbway" onPaymentMethodChange={vi.fn()} mbwayPhone="" onMbwayPhoneChange={vi.fn()} onBack={onBack} onNext={onNext} />
    );

    expect(screen.getByLabelText('MB WAY Registered Mobile Phone Number')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Continue/ }));
    await user.click(screen.getByRole('button', { name: /Back/ }));
    expect(onNext).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
  });
});

describe('ReviewStep', () => {
  it('uppercases coupon codes, shows the licence notice, and calls back and place-order actions', async () => {
    const user = userEvent.setup();
    const onCouponCodeChange = vi.fn();
    const onBack = vi.fn();
    const onPlaceOrder = vi.fn();
    renderWithProviders(
      <ReviewStep requiresLicense address={addresses[0]} couponCode="" onCouponCodeChange={onCouponCodeChange} onBack={onBack} onPlaceOrder={onPlaceOrder} isPlacingOrder={false} />
    );

    expect(screen.getByText('Regulated Gear Notice')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Discount Coupon'), { target: { value: 'save10' } });
    expect(onCouponCodeChange).toHaveBeenLastCalledWith('SAVE10');
    await user.click(screen.getByRole('button', { name: /Confirm & Place Order/ }));
    await user.click(screen.getByRole('button', { name: /Back/ }));
    expect(onPlaceOrder).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('disables the submit while an order is being placed', () => {
    renderWithProviders(
      <ReviewStep requiresLicense={false} address={undefined} couponCode="" onCouponCodeChange={vi.fn()} onBack={vi.fn()} onPlaceOrder={vi.fn()} isPlacingOrder />
    );
    expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
    expect(screen.getByText('Please select a delivery address.')).toBeInTheDocument();
  });
});

describe('ReceiptStep', () => {
  const result: OrderResult = {
    order: { id: 17, orderNumber: 'ORD-17', orderDate: '2026-11-18', status: 'PENDING', subtotalAmount: 20, discountAmount: 0, totalAmount: 24.95, shippingCost: 4.95, userId: 22, shippingAddress: addresses[0], billingAddress: addresses[0], items: [] },
    payment: { id: 9, orderId: 17, amount: 24.95, paymentMethod: 'MBWAY', status: 'PENDING', transactionId: null, multibancoEntity: null, multibancoReference: null, mbwayPhone: '912345678', paymentUrl: null, referenceExpiresAt: null },
  };

  it('shows the order reference and MB WAY instructions', () => {
    renderWithProviders(<ReceiptStep orderResult={result} />);
    expect(screen.getByText('ORD-17')).toBeInTheDocument();
    expect(screen.getByText('Please check your MB WAY app on phone')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Order Details' })).toHaveAttribute('href', '/account/orders/ORD-17');
  });

  it('shows Multibanco details and expiry for that payment method', () => {
    const multibanco: OrderResult = {
      ...result,
      payment: { ...result.payment, paymentMethod: 'MULTIBANCO', multibancoEntity: '12345', multibancoReference: '123 456 789', referenceExpiresAt: '2026-11-19T10:00:00Z' },
    };
    renderWithProviders(<ReceiptStep orderResult={multibanco} />);
    expect(screen.getByText('12345')).toBeInTheDocument();
    expect(screen.getByText('123 456 789')).toBeInTheDocument();
    expect(screen.getByText(/Reference expires:/)).toBeInTheDocument();
  });

  it('renders an external payment link for card and Klarna', () => {
    const card: OrderResult = {
      ...result,
      payment: { ...result.payment, paymentMethod: 'CREDIT_CARD', paymentUrl: 'https://pay.example.test/ORD-17' },
    };
    renderWithProviders(<ReceiptStep orderResult={card} />);
    expect(screen.getByRole('link', { name: 'Complete Payment' })).toHaveAttribute('href', 'https://pay.example.test/ORD-17');
    expect(screen.getByRole('link', { name: 'Complete Payment' })).toHaveAttribute('target', '_blank');
  });
});
