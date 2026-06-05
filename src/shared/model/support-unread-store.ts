import { create } from 'zustand';

interface SupportUnreadState {
  userUnreadCount: number;
  adminUnreadCount: number;
  setUserUnreadCount: (count: number) => void;
  setAdminUnreadCount: (count: number) => void;
  incrementUserUnread: () => void;
  incrementAdminUnread: () => void;
  resetUserUnread: () => void;
  resetAdminUnread: () => void;
}

export const useSupportUnreadStore = create<SupportUnreadState>()((set) => ({
  userUnreadCount: 0,
  adminUnreadCount: 0,
  setUserUnreadCount: (count) => set({ userUnreadCount: Math.max(0, count) }),
  setAdminUnreadCount: (count) => set({ adminUnreadCount: Math.max(0, count) }),
  incrementUserUnread: () => set((state) => ({ userUnreadCount: state.userUnreadCount + 1 })),
  incrementAdminUnread: () => set((state) => ({ adminUnreadCount: state.adminUnreadCount + 1 })),
  resetUserUnread: () => set({ userUnreadCount: 0 }),
  resetAdminUnread: () => set({ adminUnreadCount: 0 }),
}));
