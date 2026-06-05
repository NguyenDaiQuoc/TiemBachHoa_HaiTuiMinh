import type { Prisma } from '@prisma/client';
import prisma from '../../shared/lib/prisma.js';
import { emitBulkNotificationStream, emitNotificationStream } from './notification-stream-service.js';

type NotificationInput = {
  title: string;
  message: string;
  type?: string;
  link?: string | null;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
};

export const createUserNotification = async (userId: string, input: NotificationInput) => {
  const notification = await prisma.appNotification.create({
    data: {
      userId,
      scope: 'USER',
      type: input.type || 'INFO',
      title: input.title,
      message: input.message,
      link: input.link || null,
      metadata: input.metadata || undefined,
    },
  });

  emitNotificationStream(userId, 'USER');
  return notification;
};

export const createAdminNotifications = async (input: NotificationInput) => {
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'SUPERADMIN', 'STAFF'] },
      deletedAt: null,
      isActive: true,
    },
    select: { id: true },
  });

  if (admins.length === 0) return { count: 0 };

  const result = await prisma.appNotification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      scope: 'ADMIN',
      type: input.type || 'INFO',
      title: input.title,
      message: input.message,
      link: input.link || null,
      metadata: input.metadata || undefined,
    })),
  });

  emitBulkNotificationStream(admins.map((admin) => ({ userId: admin.id, scope: 'ADMIN' })));
  return result;
};

export const serializeNotificationCenter = (items: Array<any>) => ({
  items: items.map((item) => ({
    id: item.id,
    scope: item.scope,
    type: item.type,
    title: item.title,
    message: item.message,
    link: item.link,
    isRead: item.isRead,
    readAt: item.readAt,
    createdAt: item.createdAt,
    metadata: item.metadata,
  })),
  unreadCount: items.filter((item) => !item.isRead).length,
});
