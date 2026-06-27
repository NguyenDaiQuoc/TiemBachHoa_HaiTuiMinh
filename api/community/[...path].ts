import type { IncomingMessage, ServerResponse } from 'node:http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, hasJwtSecret, readJsonBody, sendJson } from '../_shared/auth.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';

type AuthUser = { id: string; email: string; role: string };

const ok = (res: ServerResponse, data: unknown, message = 'OK', status = 200, meta?: unknown) =>
  sendJson(res, status, { success: true, data, message, ...(meta ? { meta } : {}) });

const fail = (res: ServerResponse, error: string, status = 400) => sendJson(res, status, { success: false, error });

const parsePath = (req: IncomingMessage) => {
  const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
  const rewritten = url.searchParams.get('...path') || url.searchParams.get('path');
  return (rewritten || url.pathname.replace(/^\/api\/community\/?/, '')).replace(/\/$/, '');
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

const optionalUser = async (req: IncomingMessage): Promise<AuthUser | null> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
  return userFromToken(token);
};

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

const requireUser = async (req: IncomingMessage, res: ServerResponse) => {
  const user = await optionalUser(req);
  if (!user) fail(res, 'Bạn cần đăng nhập để thực hiện thao tác này', 401);
  return user;
};

const serializeReview = (review: any, currentUserId?: string | null) => ({
  id: review.id,
  rating: review.rating,
  content: review.content,
  media: Array.isArray(review.media) ? review.media : [],
  verifiedPurchase: review.verifiedPurchase,
  helpfulCount: review.helpfulCount,
  sellerResponse: review.sellerResponse,
  sellerRespondedAt: review.sellerRespondedAt,
  createdAt: review.createdAt,
  user: {
    id: review.user.id,
    name: review.user.name || review.user.email || 'Khách hàng',
    avatar: review.user.avatar,
  },
  isHelpfulByMe: currentUserId ? review.helpfulBy?.some((entry: any) => entry.userId === currentUserId) : false,
});

const countReviewMedia = (media: unknown) => (Array.isArray(media) ? media.length : 0);

const sentimentBucket = (rating: number) => {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
};

const buildRatingBreakdown = (reviews: any[]) => {
  const base = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  for (const review of reviews) base[review.rating] = (base[review.rating] || 0) + 1;
  return base;
};

const productIdFromPath = (path: string, suffix: string) => {
  const match = path.match(new RegExp(`^products\\/([^/]+)\\/${suffix}$`));
  return match ? decodeURIComponent(match[1]) : null;
};

const handleSocialProof = async (req: IncomingMessage, res: ServerResponse, productId: string) => {
  if (req.method !== 'GET') return fail(res, 'Phương thức không được hỗ trợ', 405);

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [viewCount, soldLastHour, latestOrder, reviewCount] = await Promise.all([
    prisma.productViewEvent.count({ where: { productId, createdAt: { gte: since } } }).catch(() => 0),
    prisma.orderItem
      .aggregate({
        where: { productId, order: { createdAt: { gte: since } } },
        _sum: { quantity: true },
      })
      .then((result) => result._sum.quantity || 0)
      .catch(() => 0),
    prisma.order.findFirst({
      where: { items: { some: { productId } } },
      orderBy: { createdAt: 'desc' },
      select: { shippingAddress: true },
    }),
    prisma.productReview.count({ where: { productId } }).catch(() => 0),
  ]);

  let latestPurchaseCity: string | null = null;
  try {
    const parsed = JSON.parse(latestOrder?.shippingAddress || '{}');
    latestPurchaseCity = parsed.city || parsed.province || null;
  } catch {
    latestPurchaseCity = latestOrder?.shippingAddress?.split(',').map((item) => item.trim()).filter(Boolean).at(-1) || null;
  }

  return ok(res, {
    viewersNow: Math.max(1, viewCount),
    soldLastHour,
    reviewCount,
    latestPurchaseCity,
    trustSignals: ['Hàng được kiểm tra trước khi giao', 'Hỗ trợ đổi trả theo chính sách', 'Tư vấn nhanh qua hotline'],
  });
};

const handleTrackView = async (req: IncomingMessage, res: ServerResponse, productId: string) => {
  if (req.method !== 'POST') return fail(res, 'Phương thức không được hỗ trợ', 405);
  const user = await optionalUser(req);
  const body = await readJsonBody<any>(req);
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : null;

  await prisma.productViewEvent.create({
    data: { productId, userId: user?.id, sessionId },
  });

  return ok(res, { tracked: true });
};

const handleReviews = async (req: IncomingMessage, res: ServerResponse, productId: string) => {
  const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
  const user = await optionalUser(req);

  if (req.method === 'GET') {
    const sort = url.searchParams.get('sort') || 'recent';
    const withMedia = url.searchParams.get('withMedia') === 'true';
    const orderBy =
      sort === 'helpful'
        ? { helpfulCount: 'desc' as const }
        : sort === 'highest'
          ? { rating: 'desc' as const }
          : sort === 'lowest'
            ? { rating: 'asc' as const }
            : { createdAt: 'desc' as const };

    const where: any = { productId, ...(withMedia ? { NOT: { media: { equals: [] } } } : {}) };
    const [reviews, summaryReviews] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, avatar: true } }, helpfulBy: true },
        orderBy,
        take: 20,
      }),
      prisma.productReview.findMany({ where: { productId }, select: { rating: true, media: true } }),
    ]);

    const total = summaryReviews.length;
    const average = total ? Number((summaryReviews.reduce((sum, review) => sum + review.rating, 0) / total).toFixed(1)) : 0;
    const sentiment = summaryReviews.reduce(
      (acc: any, review) => {
        acc[sentimentBucket(review.rating)] += 1;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    return ok(res, {
      summary: {
        total,
        average,
        breakdown: buildRatingBreakdown(summaryReviews),
        mediaCount: summaryReviews.reduce((sum, review) => sum + countReviewMedia(review.media), 0),
        sentiment,
      },
      reviews: reviews.map((review) => serializeReview(review, user?.id)),
    });
  }

  if (req.method === 'POST') {
    const authUser = await requireUser(req, res);
    if (!authUser) return;
    const body = await readJsonBody<any>(req);
    const rating = Math.max(1, Math.min(5, Math.trunc(Number(body.rating) || 5)));
    const content = String(body.content || '').trim();
    const media = Array.isArray(body.media) ? body.media.slice(0, 4) : [];
    if (content.length < 10) return fail(res, 'Nội dung đánh giá cần ít nhất 10 ký tự');

    const verifiedPurchase =
      (await prisma.orderItem.count({
        where: { productId, order: { userId: authUser.id, OR: [{ status: 'DELIVERED' }, { paymentStatus: 'PAID' }] } },
      })) > 0;

    const review = await prisma.productReview.create({
      data: { productId, userId: authUser.id, rating, content, media, verifiedPurchase },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } }, helpfulBy: true },
    });

    return ok(res, serializeReview(review, authUser.id), 'Gửi đánh giá thành công', 201);
  }

  return fail(res, 'Phương thức không được hỗ trợ', 405);
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

  if (path === 'notifications' && req.method === 'GET') {
    const notifications = await prisma.appNotification.findMany({
      where: { userId: user.id, scope: 'USER' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return ok(res, serializeNotificationCenter(notifications));
  }

  if (path === 'notifications/read-all' && req.method === 'POST') {
    const result = await prisma.appNotification.updateMany({
      where: { userId: user.id, scope: 'USER', isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return ok(res, { count: result.count }, 'Đã đánh dấu toàn bộ thông báo');
  }

  const readMatch = path.match(/^notifications\/([^/]+)\/read$/);
  if (readMatch && req.method === 'PATCH') {
    const id = decodeURIComponent(readMatch[1]);
    const notification = await prisma.appNotification.findUnique({ where: { id }, select: { id: true, userId: true } });
    if (!notification || notification.userId !== user.id) return fail(res, 'Không tìm thấy thông báo', 404);
    const updated = await prisma.appNotification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
    return ok(res, updated, 'Đã đánh dấu đã đọc');
  }

  return fail(res, 'Không tìm thấy API thông báo', 404);
};

const handleHelpful = async (req: IncomingMessage, res: ServerResponse, path: string) => {
  if (req.method !== 'POST') return fail(res, 'Phương thức không được hỗ trợ', 405);
  const user = await requireUser(req, res);
  if (!user) return;
  const reviewId = decodeURIComponent(path.split('/')[1] || '');
  if (!reviewId) return fail(res, 'Thiếu mã đánh giá');

  const existing = await prisma.reviewHelpful.findUnique({ where: { reviewId_userId: { reviewId, userId: user.id } } });
  if (existing) {
    await prisma.reviewHelpful.delete({ where: { reviewId_userId: { reviewId, userId: user.id } } });
  } else {
    await prisma.reviewHelpful.create({ data: { reviewId, userId: user.id } });
  }

  const helpfulCount = await prisma.reviewHelpful.count({ where: { reviewId } });
  await prisma.productReview.update({ where: { id: reviewId }, data: { helpfulCount } });
  return ok(res, { helpfulCount, liked: !existing });
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!hasDatabase) return fail(res, 'Production chưa cấu hình DATABASE_URL.', 503);

  try {
    const path = parsePath(req);
    if (path.startsWith('notifications')) return handleNotifications(req, res, path);

    if (path === 'chat/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });
      res.write('event: ping\ndata: connected\n\n');
      return res.end();
    }

    const socialProductId = productIdFromPath(path, 'social-proof');
    if (socialProductId) return handleSocialProof(req, res, socialProductId);

    const viewProductId = productIdFromPath(path, 'view');
    if (viewProductId) return handleTrackView(req, res, viewProductId);

    const reviewsProductId = productIdFromPath(path, 'reviews');
    if (reviewsProductId) return handleReviews(req, res, reviewsProductId);

    if (path.startsWith('reviews/') && path.endsWith('/helpful')) return handleHelpful(req, res, path);

    return fail(res, 'Không tìm thấy API cộng đồng', 404);
  } catch (error) {
    console.error('Community API error:', error);
    return fail(res, 'Không thể tải dữ liệu cộng đồng', 500);
  }
}
