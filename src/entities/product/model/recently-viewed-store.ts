import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './types';

interface RecentlyViewedState {
  products: Product[];
  addProduct: (product: Product) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      products: [],
      addProduct: (product) => 
        set((state) => {
          const filtered = state.products.filter((p) => p.id !== product.id);
          return {
            products: [product, ...filtered].slice(0, 10),
          };
        }),
      clear: () => set({ products: [] }),
    }),
    {
      name: 'recently-viewed-storage',
    }
  )
);
