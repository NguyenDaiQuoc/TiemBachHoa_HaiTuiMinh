import express from 'express';
import prisma from '../shared/lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { env } from '../shared/config/env.js';
import { logAction } from './services/audit-service.js';
import { createUserNotification } from './services/notification-service.js';

const router = express.Router();
const JWT_SECRET = env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
});

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

const serializeAuthUser = <T extends Record<string, any>>(user: T) => {
  const { deletedAt, ...safeUser } = user;
  return safeUser;
};

const isAdminRole = (role: string) => ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(role);

const generateAccessToken = (user: { id: string; role: string; email: string }) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

const generateRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  return prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email này đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        cart: { create: {} },
        wishlist: { create: {} },
      },
      select: authUserSelect,
    });

    const accessToken = generateAccessToken(createdUser);
    const refreshTokenDoc = await generateRefreshToken(createdUser.id);

    res.cookie('refreshToken', refreshTokenDoc.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: serializeAuthUser(createdUser),
      token: accessToken,
    });

    await logAction({
      userId: createdUser.id,
      action: 'USER_REGISTER',
      ip: req.ip,
    });

    await createUserNotification(createdUser.id, {
      type: 'SUCCESS',
      title: 'Chào mừng đến với Tiệm Bách Hóa Hai Tụi Mình',
      message: 'Tài khoản của bạn đã sẵn sàng. Hãy theo dõi đơn hàng, lưu sản phẩm yêu thích và nhận ưu đãi mới nhất.',
      link: '/profile',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }

    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận CSKH để được hỗ trợ.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
    }

    const fullUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: authUserSelect,
    });

    const accessToken = generateAccessToken(fullUser);
    const refreshTokenDoc = await generateRefreshToken(fullUser.id);

    res.cookie('refreshToken', refreshTokenDoc.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: serializeAuthUser(fullUser),
      token: accessToken,
    });

    await logAction({
      userId: fullUser.id,
      action: isAdminRole(fullUser.role) ? 'ADMIN_LOGIN' : 'USER_LOGIN',
      ip: req.ip,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }

    console.error('Login error:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.' });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: authUserSelect,
    });

    if (!user || user.deletedAt || !user.isActive) {
      return res.status(401).json({ error: 'User not found' });
    }

    return res.json(serializeAuthUser(user));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.status(401).json({ error: 'Token missing' });

  try {
    const tokenDoc = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenDoc || tokenDoc.expiresAt < new Date() || tokenDoc.user.deletedAt || !tokenDoc.user.isActive) {
      if (tokenDoc) {
        await prisma.refreshToken.delete({ where: { id: tokenDoc.id } });
      }
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    await prisma.refreshToken.delete({ where: { id: tokenDoc.id } });
    const newRefreshTokenDoc = await generateRefreshToken(tokenDoc.user.id);

    res.cookie('refreshToken', newRefreshTokenDoc.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    const accessToken = generateAccessToken(tokenDoc.user);
    return res.json({ token: accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: 'Refresh failed' });
  }
});

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.cookies;
  const authHeader = req.headers.authorization;

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; email: string };
      await logAction({
        userId: decoded.id,
        action: isAdminRole(decoded.role) ? 'ADMIN_LOGOUT' : 'USER_LOGOUT',
        ip: req.ip,
      });
    } catch {
      // ignore logging failures
    }
  }

  res.clearCookie('refreshToken');
  return res.json({ success: true });
});

export default router;
