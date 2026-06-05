export interface AppNotificationItem {
  id: string;
  scope: 'USER' | 'ADMIN';
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ORDER' | 'PROMOTION' | 'SYSTEM' | 'STOCK' | 'CUSTOMER' | 'VOUCHER' | string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationCenterPayload {
  items: AppNotificationItem[];
  unreadCount: number;
}
