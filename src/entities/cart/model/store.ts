import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../../product/model/types';

interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  restoreItems: (products: Array<Product & { quantity?: number }>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },
      restoreItems: (products) => {
        const items = get().items;
        const nextItems = [...items];

        for (const product of products) {
          const quantity = Math.max(1, Number(product.quantity) || 1);
          const existingIndex = nextItems.findIndex((item) => item.id === product.id);

          if (existingIndex >= 0) {
            nextItems[existingIndex] = { ...nextItems[existingIndex], quantity: nextItems[existingIndex].quantity + quantity };
          } else {
            nextItems.push({ ...product, quantity });
          }
        }

        set({ items: nextItems });
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: 'cart-storage',
    }
  )
);
