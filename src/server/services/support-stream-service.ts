import type { Response } from 'express';

type SupportStreamTarget =
  | { scope: 'USER'; userId: string }
  | { scope: 'ADMIN' };

const streams = new Map<string, Set<Response>>();

const streamKey = (target: SupportStreamTarget) => (target.scope === 'ADMIN' ? 'ADMIN' : `USER:${target.userId}`);

export const registerSupportStream = (target: SupportStreamTarget, res: Response) => {
  const key = streamKey(target);
  const current = streams.get(key) || new Set<Response>();
  current.add(res);
  streams.set(key, current);

  res.write(`event: ready\n`);
  res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);
};

export const unregisterSupportStream = (target: SupportStreamTarget, res: Response) => {
  const key = streamKey(target);
  const current = streams.get(key);
  if (!current) return;
  current.delete(res);
  if (current.size === 0) {
    streams.delete(key);
  }
};

export const emitSupportStream = (
  target: SupportStreamTarget,
  payload: Record<string, unknown> = { kind: 'refresh' }
) => {
  const key = streamKey(target);
  const current = streams.get(key);
  if (!current || current.size === 0) return;

  const body = `event: support\ndata: ${JSON.stringify(payload)}\n\n`;
  current.forEach((res) => res.write(body));
};

export const emitSupportStreamToUser = (userId: string, payload: Record<string, unknown>) => {
  emitSupportStream({ scope: 'USER', userId }, payload);
};

export const emitSupportStreamToAdmins = (payload: Record<string, unknown>) => {
  emitSupportStream({ scope: 'ADMIN' }, payload);
};
