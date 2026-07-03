import type { IncomingMessage, ServerResponse } from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, hasJwtSecret, readJsonBody, sendJson, withoutPassword } from '../_shared/auth.js';
import { getStoreEmailFrom } from '../_shared/email.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';

type AuthUser = { id: string; email: string; role: string };

const ok = (res: ServerResponse, data: unknown, message = 'OK', status = 200) => sendJson(res, status, { success: true, data, message });
const fail = (res: ServerResponse, error: string, status = 400) => sendJson(res, status, { success: false, error });

const parsePath = (req: IncomingMessage) => {
  const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
  const rewritten = url.searchParams.get('path') || url.searchParams.get('...path');
  return (rewritten || url.pathname.replace(/^\/api\/user\/path\/?/, '')).replace(/\/$/, '');
};

const userFromToken = async (token: string): Promise<AuthUser | null> => {
  if (!hasJwtSecret || !token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
    });
    if (!user || !user.isActive || user.deletedAt) return null;
    return { id: user.id, email: user.email, role: user.role };
  } catch {
    return null;
  }
};

const requireUser = async (req: IncomingMessage, res: ServerResponse) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
  const user = await userFromToken(token);
  if (!user) fail(res, 'Authentication required', 401);
  return user;
};

const isStrongPassword = (value: string) => value.length >= 8 && value.length <= 32 && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
const NOTIFICATION_TYPES = ['ORDER_UPDATE', 'PROMOTION', 'NEWSLETTER'];
const normalizePhone = (value?: string | null) => String(value || '').replace(/\D/g, '');

const serializeNotificationCenter = (items: Array<any>) => ({
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

const handleProfile = async (req: IncomingMessage, res: ServerResponse, path: string) => {
  const authUser = await requireUser(req, res);
  if (!authUser) return;

  if (path === 'profile' && req.method === 'GET') {
    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user) return fail(res, 'Account not found', 404);
    return ok(res, withoutPassword(user));
  }

  if (path === 'profile' && req.method === 'PATCH') {
    const body = await readJsonBody<any>(req);
    const currentUser = await prisma.user.findUnique({ where: { id: authUser.id }, select: { birthDate: true } });
    if (!currentUser) return fail(res, 'Account not found', 404);

    let nextBirthDate: Date | undefined;
    if (body.birthDate !== undefined) {
      if (currentUser.birthDate) return fail(res, 'Ngày sinh chỉ được thiết lập một lần để bảo vệ ưu đãi sinh nhật', 409);
      if (body.birthDate) {
        const parsedBirthDate = new Date(String(body.birthDate));
        if (!Number.isFinite(parsedBirthDate.getTime()) || parsedBirthDate > new Date()) return fail(res, 'Ngày sinh không hợp lệ', 400);
        nextBirthDate = parsedBirthDate;
      }
    }

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        name: typeof body.name === 'string' ? body.name.trim() : undefined,
        phone: typeof body.phone === 'string' ? body.phone.trim() : undefined,
        gender: typeof body.gender === 'string' ? body.gender : undefined,
        bio: typeof body.bio === 'string' ? body.bio : undefined,
        birthDate: nextBirthDate,
      },
    });
    return ok(res, withoutPassword(user), 'Profile updated');
  }

  if (path === 'profile/avatar' && req.method === 'PATCH') {
    const body = await readJsonBody<any>(req);
    const avatar = typeof body.avatar === 'string' ? body.avatar : '';
    const user = await prisma.user.update({ where: { id: authUser.id }, data: { avatar } });
    return ok(res, { avatar: user.avatar }, 'Avatar updated');
  }

  if (path === 'profile/password' && req.method === 'POST') {
    const body = await readJsonBody<any>(req);
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    if (!isStrongPassword(newPassword)) return fail(res, 'Password must be 8-32 chars and include uppercase, number and special character', 400);

    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user) return fail(res, 'Account not found', 404);
    const matched = await bcrypt.compare(currentPassword, user.password);
    if (!matched) return fail(res, 'Current password is incorrect', 400);
    if (await bcrypt.compare(newPassword, user.password)) return fail(res, 'New password must differ from current password', 400);

    await prisma.user.update({ where: { id: authUser.id }, data: { password: await bcrypt.hash(newPassword, 10) } });
    return ok(res, { changed: true }, 'Password changed');
  }

  return fail(res, 'Profile API not found', 404);
};

const getOrderMatchers = async (user: { id: string; email: string; phone: string | null }) => {
  const normalizedPhone = normalizePhone(user.phone);
  const terms = Array.from(new Set([user.email, user.phone, normalizedPhone].map((value) => String(value || '').trim()).filter(Boolean)));
  if (user.email.toLowerCase() === 'user@haituiminh.com') return { where: { user: { role: 'CUSTOMER', deletedAt: null } } };
  return { where: { OR: [{ userId: user.id }, ...terms.map((value) => ({ shippingAddress: { contains: value } }))] } };
};

const handleMembership = async (req: IncomingMessage, res: ServerResponse, path: string) => {
  const authUser = await requireUser(req, res);
  if (!authUser) return;
  if (req.method !== 'GET') return fail(res, 'Method not allowed', 405);

  const user = await prisma.user.findUnique({ where: { id: authUser.id }, select: { id: true, email: true, phone: true } });
  if (!user) return fail(res, 'Account not found', 404);

  const matcher = await getOrderMatchers(user);
  const orders = await prisma.order.findMany({
    where: {
      AND: [
        matcher.where,
        { status: { not: 'CANCELLED' } },
        { paymentStatus: { not: 'FAILED' } },
      ],
    },
    select: { id: true, orderNumber: true, totalAmount: true, status: true, paymentStatus: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const transactions = orders.map((order) => ({
    id: `order-${order.id}`,
    type: 'EARN',
    amount: Math.floor(Number(order.totalAmount || 0) / 10000),
    description: `Tích điểm từ đơn ${order.orderNumber}`,
    createdAt: order.createdAt,
    orderNumber: order.orderNumber,
    spendAmount: order.totalAmount,
  })).filter((item) => item.amount > 0);

  if (path === 'membership/transactions') return ok(res, transactions);
  if (path === 'membership/points') {
    const points = transactions.reduce((sum, item) => sum + item.amount, 0);
    return ok(res, { points, totalSpent: orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0), eligibleOrders: orders.length });
  }

  return fail(res, 'Membership API not found', 404);
};

const serializeAddress = (address: any) => ({
  id: address.id,
  receiverName: address.receiverName,
  phone: address.phone,
  province: address.province,
  district: address.district,
  ward: address.ward,
  detail: address.detail,
  isDefault: address.isDefault,
  createdAt: address.createdAt,
  updatedAt: address.updatedAt,
});

const buildAddressData = (body: any) => {
  const detail = String(body.detail || body.address || '').trim();
  return {
    receiverName: String(body.receiverName || body.fullName || '').trim(),
    phone: String(body.phone || '').trim(),
    province: String(body.province || 'Đang cập nhật').trim(),
    district: String(body.district || 'Đang cập nhật').trim(),
    ward: String(body.ward || 'Đang cập nhật').trim(),
    detail,
    isDefault: body.isDefault === true,
  };
};

const handleAddresses = async (req: IncomingMessage, res: ServerResponse, path: string) => {
  const authUser = await requireUser(req, res);
  if (!authUser) return;

  if (path === 'addresses' && req.method === 'GET') {
    const addresses = await prisma.address.findMany({ where: { userId: authUser.id }, orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }] });
    return ok(res, addresses.map(serializeAddress));
  }

  if (path === 'addresses' && req.method === 'POST') {
    const body = await readJsonBody<any>(req);
    const data = buildAddressData(body);
    if (!data.receiverName || !data.phone || !data.detail) return fail(res, 'Vui lòng nhập đủ tên, số điện thoại và địa chỉ', 400);

    const count = await prisma.address.count({ where: { userId: authUser.id } });
    const shouldBeDefault = data.isDefault || count === 0;
    if (shouldBeDefault) await prisma.address.updateMany({ where: { userId: authUser.id, isDefault: true }, data: { isDefault: false } });

    const address = await prisma.address.create({ data: { ...data, isDefault: shouldBeDefault, userId: authUser.id } });
    return ok(res, serializeAddress(address), 'Address created', 201);
  }

  const match = path.match(/^addresses\/([^/]+)$/);
  if (match && req.method === 'PATCH') {
    const id = decodeURIComponent(match[1]);
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== authUser.id) return fail(res, 'Address not found', 404);

    const body = await readJsonBody<any>(req);
    const data = buildAddressData({ ...existing, ...body });
    if (data.isDefault) await prisma.address.updateMany({ where: { userId: authUser.id, isDefault: true, id: { not: id } }, data: { isDefault: false } });
    const address = await prisma.address.update({ where: { id }, data });
    return ok(res, serializeAddress(address), 'Address updated');
  }

  if (match && req.method === 'DELETE') {
    const id = decodeURIComponent(match[1]);
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== authUser.id) return fail(res, 'Address not found', 404);
    await prisma.address.delete({ where: { id } });
    return ok(res, { deleted: true }, 'Address deleted');
  }

  return fail(res, 'Address API not found', 404);
};

const handleNotifications = async (req: IncomingMessage, res: ServerResponse, path: string) => {
  if (path === 'notifications/stream') {
    const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
    const user = await userFromToken(url.searchParams.get('token') || '');
    if (!user) return fail(res, 'Unauthorized', 401);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    res.write('event: ping\ndata: connected\n\n');
    return res.end();
  }

  const user = await requireUser(req, res);
  if (!user) return;

  if (path === 'notifications/settings' && req.method === 'GET') {
    const settings = await prisma.notificationSetting.findMany({ where: { userId: user.id } });
    const byType = new Map(settings.map((setting) => [setting.type, setting]));
    const missingTypes = NOTIFICATION_TYPES.filter((type) => !byType.has(type));
    const created = missingTypes.length
      ? await Promise.all(missingTypes.map((type) => prisma.notificationSetting.create({ data: { userId: user.id, type, email: true, sms: false, push: true } })))
      : [];
    return ok(res, [...settings, ...created].map((setting) => ({ ...setting, emailFrom: getStoreEmailFrom() })));
  }

  const settingMatch = path.match(/^notifications\/settings\/([^/]+)$/);
  if (settingMatch && req.method === 'PATCH') {
    const type = decodeURIComponent(settingMatch[1]);
    if (!NOTIFICATION_TYPES.includes(type)) return fail(res, 'Notification type is not supported', 400);
    const body = await readJsonBody<any>(req);
    const setting = await prisma.notificationSetting.upsert({
      where: { userId_type: { userId: user.id, type } },
      create: { userId: user.id, type, email: body.email !== false, sms: body.sms === true, push: body.push !== false },
      update: {
        email: typeof body.email === 'boolean' ? body.email : undefined,
        sms: typeof body.sms === 'boolean' ? body.sms : undefined,
        push: typeof body.push === 'boolean' ? body.push : undefined,
      },
    });
    return ok(res, { ...setting, emailFrom: getStoreEmailFrom() }, 'Notification settings updated');
  }

  if (path === 'notifications' && req.method === 'GET') {
    const notifications = await prisma.appNotification.findMany({
      where: { userId: user.id, scope: 'USER' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok(res, serializeNotificationCenter(notifications));
  }

  if (path === 'notifications/read-all' && req.method === 'POST') {
    const result = await prisma.appNotification.updateMany({
      where: { userId: user.id, scope: 'USER', isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return ok(res, { count: result.count }, 'Notifications marked read');
  }

  const readMatch = path.match(new RegExp('^notifications/([^/]+)/read$'));
  if (readMatch && req.method === 'PATCH') {
    const id = decodeURIComponent(readMatch[1]);
    const notification = await prisma.appNotification.findUnique({ where: { id }, select: { id: true, userId: true } });
    if (!notification || notification.userId !== user.id) return fail(res, 'Notification not found', 404);
    const updated = await prisma.appNotification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
    return ok(res, updated, 'Notification marked read');
  }

  return fail(res, 'Notification API not found', 404);
};

const handleVouchers = async (req: IncomingMessage, res: ServerResponse) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'GET') return fail(res, 'Method not allowed', 405);

  const now = new Date();
  const vouchers = await prisma.voucher.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 50,
  });

  return ok(res, vouchers.map((voucher) => ({ ...voucher, status: 'AVAILABLE' })));
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!hasDatabase) return fail(res, 'Production is missing DATABASE_URL.', 503);
  if (!hasJwtSecret) return fail(res, 'Production is missing JWT_SECRET.', 503);

  try {
    const path = parsePath(req);
    if (path === 'profile' || path.startsWith('profile/')) return handleProfile(req, res, path);
    if (path === 'addresses' || path.startsWith('addresses/')) return handleAddresses(req, res, path);
    if (path.startsWith('membership/')) return handleMembership(req, res, path);
    if (path.startsWith('notifications')) return handleNotifications(req, res, path);
    if (path === 'vouchers') return handleVouchers(req, res);
    return fail(res, 'User API not found', 404);
  } catch (error) {
    console.error('User API error:', error);
    return fail(res, error instanceof Error ? error.message : 'Unable to load user data', 500);
  }
}
