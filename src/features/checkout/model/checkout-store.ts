
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ShippingInfo, Order, OrderStatus, PaymentStatus } from '@/src/entities/order/model/types';
import { PaymentMethod } from '@/src/entities/payment/model/types';
import { ShippingMethodId } from '@/src/entities/shipping/model/types';
import { generateOrderId } from '@/src/entities/order/lib/order-utils';
import { calculateShippingPrice, estimateArrival } from '@/src/entities/shipping/lib/shipping-engine';
import { useAuthStore } from '@/src/shared/model/auth-store';

interface CheckoutState {
  shippingInfo: ShippingInfo | null;
  selectedPaymentMethod: PaymentMethod | null;
  selectedShippingMethod: ShippingMethodId | null;
  currentOrder: Order | null;
  
  setShippingInfo: (info: ShippingInfo) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setShippingMethod: (methodId: ShippingMethodId) => void;
  createOrder: (items: any[], totalAmount: number) => Promise<Order>;
  resetCheckout: () => void;
  updateOrderStatus: (status: OrderStatus, paymentStatus?: PaymentStatus) => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      shippingInfo: null,
      selectedPaymentMethod: null,
      selectedShippingMethod: ShippingMethodId.STANDARD,
      currentOrder: null,

      setShippingInfo: (info) => set({ shippingInfo: info }),
      setPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
      setShippingMethod: (methodId) => set({ selectedShippingMethod: methodId }),
      
      createOrder: async (items, totalAmount) => {
        const { shippingInfo, selectedPaymentMethod, selectedShippingMethod } = get();
        if (!shippingInfo || !selectedPaymentMethod || !selectedShippingMethod) {
          throw new Error('Missing shipping or payment info');
        }

        const shippingFee = calculateShippingPrice(selectedShippingMethod);
        const arrival = estimateArrival(selectedShippingMethod);
        const fallbackOrderId = generateOrderId();

        const draftOrder: Order = {
          id: fallbackOrderId,
          items,
          totalAmount: totalAmount + shippingFee,
          shippingInfo,
          paymentMethod: selectedPaymentMethod,
          shippingMethodId: selectedShippingMethod,
          shippingFee,
          estimatedArrival: arrival,
          trackingId: `TM${Math.floor(10000000 + Math.random() * 90000000)}`,
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.UNPAID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const response = await fetch('/api/orders/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(useAuthStore.getState().token ? { Authorization: 'Bearer ' + useAuthStore.getState().token } : {}) },
          body: JSON.stringify({
            items,
            shippingInfo,
            paymentMethod: selectedPaymentMethod,
            shippingMethodId: selectedShippingMethod,
          }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || payload?.message || 'Không thể tạo đơn hàng');
        }

        const persistedOrder = {
          ...draftOrder,
          ...payload.data,
          items: payload.data?.items?.length ? payload.data.items : draftOrder.items,
          paymentMethod: selectedPaymentMethod,
          shippingInfo,
          shippingFee: payload.data?.shippingFee ?? shippingFee,
          estimatedArrival: payload.data?.estimatedArrival ?? arrival,
          trackingId: payload.data?.trackingId || payload.data?.orderNumber || draftOrder.trackingId,
        } as Order;

        set({ currentOrder: persistedOrder });
        return persistedOrder;
      },

      updateOrderStatus: (status, paymentStatus) => {
        const { currentOrder } = get();
        if (!currentOrder) return;

        set({
          currentOrder: {
            ...currentOrder,
            status,
            paymentStatus: paymentStatus ?? currentOrder.paymentStatus,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      resetCheckout: () => set({ 
        shippingInfo: null, 
        selectedPaymentMethod: null, 
        selectedShippingMethod: ShippingMethodId.STANDARD,
        currentOrder: null 
      }),
    }),
    {
      name: 'checkout-storage',
    }
  )
);
