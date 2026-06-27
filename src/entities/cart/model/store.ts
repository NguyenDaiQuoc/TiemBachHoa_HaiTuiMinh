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

const getMaxStock = (product: Pick<Product, 'stock'>) => Math.max(0, Math.trunc(Number(product.stock) || 0));
const clampQuantity = (product: Pick<Product, 'stock'>, quantity: number) => {
  const maxStock = getMaxStock(product);
  if (maxStock <= 0) return 0;
  return Math.min(maxStock, Math.max(1, Math.trunc(quantity) || 1));
};

const sanitizeCartItems = (items: CartItem[]) =>
  items
    .map((item) => ({ ...item, quantity: clampQuantity(item, item.quantity) }))
    .filter((item) => item.quantity > 0);

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const maxStock = getMaxStock(product);
        if (maxStock <= 0) return;
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, ...product, quantity: clampQuantity(product, item.quantity + 1) }
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
          const quantity = clampQuantity(product, Number(product.quantity) || 1);
          if (quantity <= 0) continue;
          const existingIndex = nextItems.findIndex((item) => item.id === product.id);

          if (existingIndex >= 0) {
            const merged = { ...nextItems[existingIndex], ...product };
            nextItems[existingIndex] = { ...merged, quantity: clampQuantity(merged, nextItems[existingIndex].quantity + quantity) };
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
          items: get().items
            .map((item) => (item.id === productId ? { ...item, quantity: clampQuantity(item, quantity) } : item))
            .filter((item) => item.quantity > 0),
        });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: 'cart-storage',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CartStore> | undefined;
        return {
          ...currentState,
          ...persisted,
          items: sanitizeCartItems(Array.isArray(persisted?.items) ? persisted.items : []),
        };
      },
    }
  )
);
