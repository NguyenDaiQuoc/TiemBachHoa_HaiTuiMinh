import type { IncomingMessage, ServerResponse } from 'node:http';
import { createToken, readJsonBody, sendJson, verifyPassword, withoutPassword, hasJwtSecret } from '../_shared/auth.js';
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Phương thức không được hỗ trợ' });
  }

  if (!hasDatabase) {
    return sendJson(res, 503, { error: 'Production chưa cấu hình DATABASE_URL nên không thể đăng nhập bằng dữ liệu thật.' });
  }

  if (!hasJwtSecret) {
    return sendJson(res, 503, { error: 'Production chưa cấu hình JWT_SECRET.' });
  }

  const { email = '', password = '' } = await readJsonBody(req);
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail.includes('@') || password.length < 6) {
    return sendJson(res, 400, { error: 'Email hoặc mật khẩu không hợp lệ' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, password: true, role: true, isActive: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return sendJson(res, 401, { error: 'Email hoặc mật khẩu không chính xác' });
    }

    if (!user.isActive) {
      return sendJson(res, 403, { error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận CSKH để được hỗ trợ.' });
    }

    const passwordMatched = await verifyPassword(password, user.password);
    if (!passwordMatched) {
      return sendJson(res, 401, { error: 'Email hoặc mật khẩu không chính xác' });
    }

    const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: authUserSelect });
    const safeUser = withoutPassword(fullUser);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(user.role) ? 'ADMIN_LOGIN' : 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
      },
    }).catch(() => null);

    return sendJson(res, 200, {
      user: safeUser,
      token: createToken(safeUser),
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendJson(res, 500, { error: 'Không thể đăng nhập lúc này. Vui lòng kiểm tra kết nối cơ sở dữ liệu.' });
  }
}

