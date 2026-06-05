import type { Response } from 'express';

type NotificationScope = 'USER' | 'ADMIN';

const streams = new Map<string, Set<Response>>();

const streamKey = (userId: string, scope: NotificationScope) => `${scope}:${userId}`;

export const registerNotificationStream = (userId: string, scope: NotificationScope, res: Response) => {
  const key = streamKey(userId, scope);
  const current = streams.get(key) || new Set<Response>();
  current.add(res);
  streams.set(key, current);

  res.write(`event: ready\n`);
  res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);
};

export const unregisterNotificationStream = (userId: string, scope: NotificationScope, res: Response) => {
  const key = streamKey(userId, scope);
  const current = streams.get(key);
  if (!current) return;
  current.delete(res);
  if (current.size === 0) {
    streams.delete(key);
  }
};

export const emitNotificationStream = (userId: string, scope: NotificationScope, payload: Record<string, unknown> = { kind: 'refresh' }) => {
  const key = streamKey(userId, scope);
  const current = streams.get(key);
  if (!current || current.size === 0) return;

  const body = `event: notification\ndata: ${JSON.stringify(payload)}\n\n`;
  current.forEach((res) => res.write(body));
};

export const emitBulkNotificationStream = (targets: Array<{ userId: string; scope: NotificationScope }>, payload: Record<string, unknown> = { kind: 'refresh' }) => {
  targets.forEach((target) => emitNotificationStream(target.userId, target.scope, payload));
};
