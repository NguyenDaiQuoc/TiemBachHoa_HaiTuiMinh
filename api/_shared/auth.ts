import type { IncomingMessage, ServerResponse } from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  phone: string | null;
  avatar: string | null;
  gender: string | null;
  birthDate: Date | string | null;
  bio: string | null;
  role: string;
  isActive: boolean;
  membershipPoints: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type LoginPayload = {
  email?: string;
  password?: string;
};

export const JWT_SECRET = process.env.JWT_SECRET || '';
export const hasJwtSecret = Boolean(process.env.JWT_SECRET);

export const sendJson = (res: ServerResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

export const readJsonBody = async <T extends Record<string, unknown> = LoginPayload>(req: IncomingMessage): Promise<T> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody) return {} as T;

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return {} as T;
  }
};

export const withoutPassword = <T extends AuthUser & { password?: string; deletedAt?: Date | string | null }>(user: T): AuthUser => {
  const { password: _password, deletedAt: _deletedAt, ...safeUser } = user;
  return safeUser;
};

export const createToken = (user: { id: string; email: string; role: string }) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });

export const verifyPassword = async (plainPassword: string, hashedPassword: string) => bcrypt.compare(plainPassword, hashedPassword);
