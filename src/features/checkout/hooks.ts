import { useState } from 'react';
import type { PaymentMethod } from './types';
import { toApiPaymentMethod } from './utils';
import { placeOrder, initiatePayment, storePaymentForOrder, type OrderResult } from '../../lib/ordersApi';

export function useCheckout() {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  const placeOrderAndPay = async (params: {
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
      const order = await placeOrder(params.userId, {
        shippingAddressId: params.shippingAddressId,
        billingAddressId: params.billingAddressId,
        couponCode: params.couponCode,
      });
      const payment = await initiatePayment({
        orderId: order.id,
        paymentMethod: toApiPaymentMethod(params.paymentMethod),
        mbwayPhone: params.mbwayPhone,
      });
      storePaymentForOrder(order.orderNumber, payment);
      return { order, payment };
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
      throw err;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return { isPlacingOrder, error, placeOrder: placeOrderAndPay };
}
