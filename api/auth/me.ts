import type { IncomingMessage, ServerResponse } from 'node:http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, sendJson, withoutPassword, hasJwtSecret } from '../_shared/auth.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  username: true,
  phone: true,
  avatar: true,
  gender: true,
  birthDate: true,
  bio: true,
  role: true,
  isActive: true,
  membershipPoints: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Phương thức không được hỗ trợ' });
  }

  if (!hasDatabase) {
    return sendJson(res, 503, { error: 'Production chưa cấu hình DATABASE_URL.' });
  }

  if (!hasJwtSecret) {
    return sendJson(res, 503, { error: 'Production chưa cấu hình JWT_SECRET.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendJson(res, 401, { error: 'Chưa đăng nhập' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: authUserSelect });

    if (!user || user.deletedAt || !user.isActive) {
      return sendJson(res, 401, { error: 'Phiên đăng nhập không hợp lệ' });
    }

    return sendJson(res, 200, withoutPassword(user));
  } catch {
    return sendJson(res, 401, { error: 'Phiên đăng nhập không hợp lệ' });
  }
}

