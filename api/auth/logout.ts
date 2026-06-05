import type { IncomingMessage, ServerResponse } from 'node:http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, sendJson } from '../_shared/auth.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPERADMIN', 'STAFF']);

const getCookie = (req: IncomingMessage, name: string) => {
  const cookieHeader = req.headers.cookie || '';
  const parts = cookieHeader.split(';').map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { success: false, error: 'Phương thức không được hỗ trợ' });
  }

  if (!hasDatabase) {
    return sendJson(res, 200, { success: true });
  }

  const refreshToken = getCookie(req, 'refreshToken');
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => null);
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { id: string; role: string; email: string };
      await prisma.auditLog
        .create({
          data: {
            userId: decoded.id,
            action: ADMIN_ROLES.has(decoded.role) ? 'ADMIN_LOGOUT' : 'USER_LOGOUT',
            entity: 'User',
            entityId: decoded.id,
          },
        })
        .catch(() => null);
    } catch {
      // Local client logout should still succeed if the token is already invalid.
    }
  }

  res.setHeader('Set-Cookie', 'refreshToken=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  return sendJson(res, 200, { success: true });
}
