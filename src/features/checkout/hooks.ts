import { useState } from 'react';
import type { PaymentMethod, OrderResult } from './types';
import { toApiPaymentMethod } from './utils';
import * as api from './api';

export function useCheckout() {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  const placeOrder = async (params: {
    userId: number;
    shippingAddressId: number;
    billingAddressId?: number;
    couponCode?: string;
    paymentMethod: PaymentMethod;
    mbwayPhone?: string;
  }): Promise<OrderResult> => {
    setIsPlacingOrder(true);
    setError('');
    try {
      const order = await api.checkout(params.userId, {
        shippingAddressId: params.shippingAddressId,
        billingAddressId: params.billingAddressId,
        couponCode: params.couponCode,
      });
      const payment = await api.initiatePayment({
        orderId: order.id,
        paymentMethod: toApiPaymentMethod(params.paymentMethod),
        mbwayPhone: params.mbwayPhone,
      });
      return { order, payment };
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
      throw err;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return { isPlacingOrder, error, placeOrder };
}