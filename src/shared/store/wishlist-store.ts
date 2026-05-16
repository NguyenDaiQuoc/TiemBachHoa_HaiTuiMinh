import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistStore {
  ids: string[];
  toggleItem: (id: string) => void;
  hasItem: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggleItem: (id) => {
        const currentIds = get().ids;
        if (currentIds.includes(id)) {
          set({ ids: currentIds.filter((itemId) => itemId !== id) });
        } else {
          set({ ids: [...currentIds, id] });
        }
      },
      hasItem: (id) => get().ids.includes(id),
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
