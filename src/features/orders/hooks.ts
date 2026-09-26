import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { listUserOrders, getOrderByNumber, getPaymentForOrder, type OrderResponse, type PaymentResponse } from '../../lib/ordersApi';
import { useAuth } from '../auth/hooks';

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    const userId = user?.id;
    if (userId === undefined) return;

    let cancelled = false;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listUserOrders(userId);
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [user, reloadToken]);

  return { orders, loading, error, reload };
}

export function useOrderDetail() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!orderNumber) return;

    let cancelled = false;
    const number = orderNumber;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrderByNumber(number);
        if (cancelled) return;
        setOrder(data);
        setPayment(getPaymentForOrder(data.orderNumber));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [orderNumber, reloadToken]);

  return { order, payment, loading, error, reload };
}
