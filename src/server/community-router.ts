import express from 'express';
import { z } from 'zod';
import prisma from '../shared/lib/prisma.js';
import { env } from '../shared/config/env.js';
import { authenticate, authorize, verifyAccessToken } from './auth-middleware.js';
import { createAdminNotifications, createUserNotification } from './services/notification-service.js';
import { emitSupportStreamToAdmins, emitSupportStreamToUser, registerSupportStream, unregisterSupportStream } from './services/support-stream-service.js';
import { sendError, sendSuccess } from './utils/api-response.js';

const router = express.Router();
const prismaAny = prisma as any;

const MAIN_SHOP_ID = 'main-shop';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().min(10).max(1200),
  media: z
    .array(
      z.object({
        type: z.enum(['image', 'video']),
        url: z.string().min(1),
      })
    )
    .max(4)
    .optional()
    .default([]),
});

const replySchema = z.object({
  content: z.string().min(5).max(800),
});

const chatSchema = z.object({
  channel: z.enum(['AI', 'HUMAN']).default('AI'),
  message: z.string().min(2).max(1200),
});

const supportReplySchema = z.object({
  message: z.string().min(2).max(1200),
});

const referralClaimSchema = z.object({
  code: z.string().min(4).max(24),
});

const COMMUNITY_MISSIONS = [
  {
    slug: 'review-first-product',
    title: 'Viết đánh giá đầu tiên',
    description: 'Chia sẻ cảm nhận sau khi mua hàng để giúp cộng đồng mua sắm tốt hơn.',
    actionType: 'REVIEW_COUNT',
    targetCount: 1,
    rewardPoints: 25,
  },
  {
    slug: 'review-three-products',
    title: 'Đánh giá 3 sản phẩm',
    description: 'Hoàn thành 3 bài đánh giá để mở thêm điểm thưởng thành viên.',
    actionType: 'REVIEW_COUNT',
    targetCount: 3,
    rewardPoints: 80,
  },
  {
    slug: 'daily-checkin-streak',
    title: 'Điểm danh 7 ngày',
    description: 'Duy trì thói quen quay lại mỗi ngày để tích lũy điểm thưởng.',
    actionType: 'CHECKIN_STREAK',
    targetCount: 7,
    rewardPoints: 70,
  },
  {
    slug: 'buy-three-orders',
    title: 'Hoàn tất 3 đơn hàng',
    description: 'Mở khóa ưu đãi khi hoàn thành ba đơn hàng thành công.',
    actionType: 'ORDER_COUNT',
    targetCount: 3,
    rewardPoints: 120,
  },
];

const COMMUNITY_BADGES = [
  {
    slug: 'first-reviewer',
    name: 'Người mở lời',
    description: 'Hoàn thành bài đánh giá đầu tiên.',
    icon: 'star',
    thresholdType: 'REVIEW_COUNT',
    thresholdValue: 1,
  },
  {
    slug: 'trusted-buyer',
    name: 'Khách mua tin cậy',
    description: 'Hoàn tất 3 đơn hàng thành công.',
    icon: 'shield',
    thresholdType: 'ORDER_COUNT',
    thresholdValue: 3,
  },
  {
    slug: 'community-regular',
    name: 'Thành viên gắn bó',
    description: 'Điểm danh liên tiếp 7 ngày.',
    icon: 'flame',
    thresholdType: 'CHECKIN_STREAK',
    thresholdValue: 7,
  },
];

const parseDayKey = (date = new Date()) => date.toISOString().slice(0, 10);

const getFirstName = (name?: string | null) => {
  if (!name) return 'bạn';
  return name.trim().split(/\s+/).slice(-1)[0] || 'bạn';
};

const extractCity = (address?: string | null) => {
  if (!address) return null;
  const segments = address
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return segments.length ? segments[segments.length - 1] : null;
};

const deriveSupportWorkflowStatus = (conversation: any) => {
  const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
  const lastMessage = messages[messages.length - 1] || null;
  const hasAdminReply = messages.some((message: any) => message.sender === 'ADMIN');
  const lastReadByAdminAt = conversation.lastReadByAdminAt ? new Date(conversation.lastReadByAdminAt) : null;
  const lastReadByUserAt = conversation.lastReadByUserAt ? new Date(conversation.lastReadByUserAt) : null;

  const unreadForAdmin = messages.filter(
    (message: any) => message.sender === 'USER' && (!lastReadByAdminAt || new Date(message.createdAt) > lastReadByAdminAt)
  ).length;
  const unreadForUser = messages.filter(
    (message: any) => message.sender === 'ADMIN' && (!lastReadByUserAt || new Date(message.createdAt) > lastReadByUserAt)
  ).length;

  if (!hasAdminReply) {
    return unreadForAdmin > 0
      ? { code: 'PENDING', label: 'Đang chờ', tone: 'warning' as const }
      : { code: 'RECEIVED', label: 'Đã nhận', tone: 'info' as const };
  }

  if (unreadForUser > 0 || lastMessage?.sender === 'ADMIN') {
    return { code: 'IN_PROGRESS', label: 'Đang xử lý', tone: 'primary' as const };
  }

  return { code: 'READ', label: 'Đã đọc', tone: 'success' as const };
};

const serializeSupportConversation = (conversation: any) => ({
  id: conversation.id,
  channel: conversation.channel,
  status: conversation.status,
  assignedAdminId: conversation.assignedAdminId ?? null,
  lastMessageAt: conversation.lastMessageAt,
  workflowStatus: deriveSupportWorkflowStatus(conversation),
  messages: (conversation.messages || []).map((message: any) => ({
    id: message.id,
    sender: message.sender,
    content: message.content,
    createdAt: message.createdAt,
    userId: message.userId ?? null,
  })),
});

const findOrCreateSupportConversation = async (userId: string, channel: 'AI' | 'HUMAN') =>
  prismaAny.supportConversation.upsert({
    where: { userId_channel: { userId, channel } },
    update: {},
    create: {
      userId,
      channel,
    },
  });

const sentimentBucket = (rating: number) => {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
};

const countReviewMedia = (media: unknown) => {
  if (!Array.isArray(media)) return 0;
  return media.length;
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
    name: review.user.name || review.user.email,
    avatar: review.user.avatar,
  },
  isHelpfulByMe: currentUserId ? review.helpfulBy?.some((entry: any) => entry.userId === currentUserId) : false,
});

const buildRatingBreakdown = (reviews: any[]) => {
  const base = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  for (const review of reviews) {
    base[review.rating] = (base[review.rating] || 0) + 1;
  }
  return base;
};

const ensureCommunitySeeds = async () => {
  await prismaAny.shopProfile.upsert({
    where: { id: MAIN_SHOP_ID },
    update: {},
    create: {
      id: MAIN_SHOP_ID,
      slug: 'hai-tui-minh',
      name: 'Tiệm bách hoá Hai Tụi Mình',
      description: 'Cộng đồng mua sắm dành cho mỹ phẩm chính hãng, đồ gia dụng tiện ích và sản phẩm công nghệ.',
    },
  });

  for (const mission of COMMUNITY_MISSIONS) {
    await prismaAny.rewardMission.upsert({
      where: { slug: mission.slug },
      update: mission,
      create: mission,
    });
  }

  for (const badge of COMMUNITY_BADGES) {
    await prismaAny.achievementBadge.upsert({
      where: { slug: badge.slug },
      update: badge,
      create: badge,
    });
  }
};

const getUserMetrics = async (userId: string) => {
  const [reviewCount, completedOrders, latestCheckIn] = await Promise.all([
    prismaAny.productReview.count({ where: { userId } }),
    prisma.order.count({
      where: {
        userId,
        OR: [{ status: 'DELIVERED' }, { paymentStatus: 'PAID' }],
      },
    }),
    prismaAny.dailyCheckIn.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    reviewCount,
    completedOrders,
    streak: latestCheckIn?.streak || 0,
  };
};

const syncMissionProgress = async (userId: string) => {
  const [missions, metrics] = await Promise.all([
    prismaAny.rewardMission.findMany({ where: { isActive: true } }),
    getUserMetrics(userId),
  ]);

  const progressItems = [];

  for (const mission of missions) {
    const progressValue =
      mission.actionType === 'REVIEW_COUNT'
        ? metrics.reviewCount
        : mission.actionType === 'ORDER_COUNT'
          ? metrics.completedOrders
          : mission.actionType === 'CHECKIN_STREAK'
            ? metrics.streak
            : 0;

    const progress = await prismaAny.userMissionProgress.upsert({
      where: {
        userId_missionId: {
          userId,
          missionId: mission.id,
        },
      },
      update: {
        progress: progressValue,
        completedAt: progressValue >= mission.targetCount ? new Date() : null,
      },
      create: {
        userId,
        missionId: mission.id,
        progress: progressValue,
        completedAt: progressValue >= mission.targetCount ? new Date() : null,
      },
      include: { mission: true },
    });

    progressItems.push(progress);
  }

  return progressItems;
};

const syncAchievements = async (userId: string) => {
  const [badges, metrics] = await Promise.all([
    prismaAny.achievementBadge.findMany(),
    getUserMetrics(userId),
  ]);

  const unlocked = [];

  for (const badge of badges) {
    const metric =
      badge.thresholdType === 'REVIEW_COUNT'
        ? metrics.reviewCount
        : badge.thresholdType === 'ORDER_COUNT'
          ? metrics.completedOrders
          : badge.thresholdType === 'CHECKIN_STREAK'
            ? metrics.streak
            : 0;

    if (metric >= badge.thresholdValue) {
      const achievement = await prismaAny.userAchievement.upsert({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badge.id,
          },
        },
        update: {},
        create: {
          userId,
          badgeId: badge.id,
        },
        include: { badge: true },
      });

      unlocked.push(achievement);
    }
  }

  return unlocked;
};

const ensureReferralProfile = async (userId: string) => {
  const existing = await prismaAny.referralProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  const code = `HTM${userId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
  return prismaAny.referralProfile.create({
    data: {
      userId,
      code,
    },
  });
};

const suggestProductsForMessage = async (message: string) => {
  const normalized = message.toLowerCase();
  const categoryHints = [
    normalized.includes('da') || normalized.includes('mụn') || normalized.includes('serum') || normalized.includes('mỹ phẩm')
      ? 'my-pham'
      : null,
    normalized.includes('gia dụng') || normalized.includes('nhà bếp') || normalized.includes('nồi') || normalized.includes('máy lọc')
      ? 'gia-dung'
      : null,
    normalized.includes('tai nghe') || normalized.includes('công nghệ') || normalized.includes('sạc') || normalized.includes('loa')
      ? 'cong-nghe'
      : null,
  ].filter(Boolean);

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      OR: [
        { name: { contains: message, mode: 'insensitive' } },
        { description: { contains: message, mode: 'insensitive' } },
        ...(categoryHints.length
          ? [
              {
                category: {
                  slug: { in: categoryHints as string[] },
                },
              },
            ]
          : []),
      ],
    },
    include: { category: true },
    take: 3,
    orderBy: [{ soldCount: 'desc' }, { createdAt: 'desc' }],
  });

  return products;
};

const generateFallbackAssistantReply = async (userId: string, message: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const products = await suggestProductsForMessage(message);
  const greeting = `Chào ${getFirstName(user?.name)}, `;

  if (products.length) {
    const lines = products.map(
      (product, index) =>
        `${index + 1}. ${product.name} - ${product.price.toLocaleString('vi-VN')}đ (${typeof product.category === 'object' ? product.category.name : 'Danh mục'})`
    );

    return (
      `${greeting}mình đã chọn nhanh vài gợi ý phù hợp để bạn cân nhắc:\n\n` +
      `${lines.join('\n')}\n\n` +
      `Nếu bạn nói rõ thêm nhu cầu như tầm giá, loại da, mục đích sử dụng hoặc món đang phân vân, mình sẽ chốt lại gợi ý sát hơn và đề xuất luôn combo hoặc deal phù hợp để bạn đặt hàng nhanh.`
    );
  }

  return (
    `${greeting}mình có thể hỗ trợ tư vấn sản phẩm, so sánh lựa chọn, giải thích ưu đãi và gợi ý đơn phù hợp để bạn chốt nhanh hơn.\n\n` +
    `Bạn có thể nhắn theo một trong các cách sau:\n` +
    `- "Tư vấn serum cho da dầu mụn"\n` +
    `- "Gợi ý đồ gia dụng dưới 1 triệu"\n` +
    `- "Tôi muốn mua tai nghe chính hãng có pin tốt"\n\n` +
    `Mình sẽ dựa trên nhu cầu đó để đề xuất phương án mua hàng cụ thể.`
  );
};

const generateAssistantReply = async (userId: string, message: string) => {
  if (env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY as string });
      const suggestions = await suggestProductsForMessage(message);
      const inventoryContext =
        suggestions.length > 0
          ? suggestions
              .map(
                (product) =>
                  `- ${product.name} | ${product.price.toLocaleString('vi-VN')}đ | ${typeof product.category === 'object' ? product.category.name : 'Danh mục'} | tồn ${product.stock}`
              )
              .join('\n')
          : 'Hiện chưa có gợi ý sản phẩm cụ thể từ truy vấn này.';

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  `Bạn là trợ lý bán hàng cho Tiệm bách hoá Hai Tụi Mình. ` +
                  `Hãy trả lời bằng tiếng Việt chuyên nghiệp, ngắn gọn, có định hướng chốt đơn nhưng không gây áp lực. ` +
                  `Chỉ tư vấn các nhóm hàng: mỹ phẩm chính hãng, đồ gia dụng tiện ích, đồ công nghệ. ` +
                  `Nếu có gợi ý sản phẩm trong kho thì ưu tiên dùng chúng.\n\n` +
                  `Gợi ý hiện có:\n${inventoryContext}\n\n` +
                  `Tin nhắn khách hàng: ${message}`,
              },
            ],
          },
        ],
      });

      const text = response.text?.trim();
      if (text) return text;
    } catch {
      // Fallback below
    }
  }

  return generateFallbackAssistantReply(userId, message);
};

router.use(async (_req, _res, next) => {
  try {
    await ensureCommunitySeeds();
    next();
  } catch (error) {
    next(error);
  }
});

router.get('/shop', async (req: any, res, next) => {
  try {
    const currentUserId = req.headers.authorization ? (req.user?.id as string | undefined) : undefined;
    const [shop, followerCount] = await Promise.all([
      prismaAny.shopProfile.findUnique({ where: { id: MAIN_SHOP_ID } }),
      prismaAny.shopFollow.count({ where: { shopId: MAIN_SHOP_ID } }),
    ]);

    let following = false;
    let notificationsEnabled = false;
    if (currentUserId) {
      const follow = await prismaAny.shopFollow.findUnique({
        where: {
          shopId_userId: {
            shopId: MAIN_SHOP_ID,
            userId: currentUserId,
          },
        },
      });
      following = !!follow;
      notificationsEnabled = !!follow?.notificationsEnabled;
    }

    return sendSuccess(res, {
      ...shop,
      followerCount,
      following,
      notificationsEnabled,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/shop/follow', authenticate, async (req: any, res, next) => {
  try {
    const existing = await prismaAny.shopFollow.findUnique({
      where: {
        shopId_userId: {
          shopId: MAIN_SHOP_ID,
          userId: req.user.id,
        },
      },
    });

    if (existing) {
      await prismaAny.shopFollow.delete({
        where: {
          shopId_userId: {
            shopId: MAIN_SHOP_ID,
            userId: req.user.id,
          },
        },
      });
    } else {
      await prismaAny.shopFollow.create({
        data: {
          shopId: MAIN_SHOP_ID,
          userId: req.user.id,
        },
      });
    }

    const followerCount = await prismaAny.shopFollow.count({ where: { shopId: MAIN_SHOP_ID } });

    return sendSuccess(res, {
      following: !existing,
      followerCount,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/feed', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const take = Math.min(12, Math.max(4, Number(req.query.limit) || 6));
    const skip = (page - 1) * take;

    const [reviews, trendingProducts, totalReviews] = await Promise.all([
      prismaAny.productReview.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          product: { select: { id: true, name: true, image: true, images: true, price: true, category: true } },
        },
        where: {
          OR: [{ media: { not: null } }, { verifiedPurchase: true }],
        },
        orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.product.findMany({
        where: { isActive: true, deletedAt: null },
        include: { category: true },
        orderBy: [{ soldCount: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),
      prismaAny.productReview.count({
        where: {
          OR: [{ media: { not: null } }, { verifiedPurchase: true }],
        },
      }),
    ]);

    const items = reviews.map((review: any) => ({
      id: review.id,
      type: 'review',
      createdAt: review.createdAt,
      review: serializeReview(review),
      product: {
        ...review.product,
        image: review.product.image || review.product.images?.[0] || '',
      },
      engagement: {
        helpfulCount: review.helpfulCount,
        badge: review.verifiedPurchase ? 'Đã mua hàng' : 'Khách chia sẻ',
      },
    }));

    return res.status(200).json({
      success: true,
      data: {
        items,
        trendingProducts: trendingProducts.map((product) => ({
          ...product,
          image: product.images?.[0] || '',
        })),
      },
      meta: {
        page,
        limit: take,
        total: totalReviews,
        hasMore: skip + take < totalReviews,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/products/:productId/social-proof', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [viewCount, soldLastHour, latestOrder, reviewCount] = await Promise.all([
      prismaAny.productViewEvent.count({
        where: {
          productId,
          createdAt: { gte: thirtyMinutesAgo },
        },
      }),
      prisma.orderItem.count({
        where: {
          productId,
          order: {
            createdAt: { gte: oneHourAgo },
          },
        },
      }),
      prisma.orderItem.findFirst({
        where: { productId },
        include: {
          order: {
            select: {
              shippingAddress: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          order: {
            createdAt: 'desc',
          },
        },
      }),
      prismaAny.productReview.count({ where: { productId } }),
    ]);

    return sendSuccess(res, {
      viewersNow: viewCount,
      soldLastHour,
      reviewCount,
      latestPurchaseCity: extractCity(latestOrder?.order?.shippingAddress),
      trustSignals: [
        'Cửa hàng chính hãng',
        'Thanh toán an toàn',
        'Giao hàng nhanh',
        'Đánh giá đã xác minh',
      ],
    });
  } catch (error) {
    next(error);
  }
});

router.post('/products/:productId/view', async (req: any, res, next) => {
  try {
    const { productId } = req.params;
    const body = z
      .object({
        sessionId: z.string().optional(),
        city: z.string().optional(),
      })
      .parse(req.body || {});

    await prismaAny.productViewEvent.create({
      data: {
        productId,
        userId: req.user?.id || null,
        sessionId: body.sessionId,
        city: body.city,
      },
    });

    return sendSuccess(res, { tracked: true });
  } catch (error) {
    next(error);
  }
});

router.get('/products/:productId/reviews', async (req: any, res, next) => {
  try {
    const { productId } = req.params;
    const sort = String(req.query.sort || 'recent');
    const withMedia = req.query.withMedia === 'true';

    const orderBy =
      sort === 'highest'
        ? [{ rating: 'desc' }, { createdAt: 'desc' }]
        : sort === 'lowest'
          ? [{ rating: 'asc' }, { createdAt: 'desc' }]
          : sort === 'helpful'
            ? [{ helpfulCount: 'desc' }, { createdAt: 'desc' }]
            : [{ createdAt: 'desc' }];

    const reviews = await prismaAny.productReview.findMany({
      where: {
        productId,
        ...(withMedia ? { media: { not: null } } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        helpfulBy: { select: { userId: true } },
      },
      orderBy,
    });

    const summaryReviews = await prismaAny.productReview.findMany({
      where: { productId },
      select: {
        rating: true,
        media: true,
      },
    });

    const breakdown = buildRatingBreakdown(summaryReviews);
    const total = summaryReviews.length;
    const average = total
      ? Number((summaryReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / total).toFixed(1))
      : 0;

    const sentiment = summaryReviews.reduce(
      (acc: any, review: any) => {
        acc[sentimentBucket(review.rating)] += 1;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    return sendSuccess(res, {
      summary: {
        total,
        average,
        breakdown,
        mediaCount: summaryReviews.reduce((sum: number, review: any) => sum + countReviewMedia(review.media), 0),
        sentiment,
      },
      reviews: reviews.map((review: any) => serializeReview(review, req.user?.id)),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/products/:productId/reviews', authenticate, async (req: any, res, next) => {
  try {
    const { productId } = req.params;
    const body = reviewSchema.parse(req.body);

    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: req.user.id,
        },
      },
      include: { order: true },
    });

    const review = await prismaAny.productReview.create({
      data: {
        productId,
        userId: req.user.id,
        rating: body.rating,
        content: body.content,
        media: body.media,
        verifiedPurchase: !!purchased,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        helpfulBy: { select: { userId: true } },
      },
    });

    await syncMissionProgress(req.user.id);
    await syncAchievements(req.user.id);

    return sendSuccess(res, serializeReview(review, req.user.id), 'Gửi đánh giá thành công', 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.issues[0].message);
    }
    next(error);
  }
});

router.post('/reviews/:reviewId/helpful', authenticate, async (req: any, res, next) => {
  try {
    const { reviewId } = req.params;
    const existing = await prismaAny.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: req.user.id,
        },
      },
    });

    if (existing) {
      await prismaAny.reviewHelpful.delete({
        where: {
          reviewId_userId: {
            reviewId,
            userId: req.user.id,
          },
        },
      });
    } else {
      await prismaAny.reviewHelpful.create({
        data: {
          reviewId,
          userId: req.user.id,
        },
      });
    }

    const helpfulCount = await prismaAny.reviewHelpful.count({ where: { reviewId } });
    await prismaAny.productReview.update({
      where: { id: reviewId },
      data: { helpfulCount },
    });

    return sendSuccess(res, {
      helpfulCount,
      liked: !existing,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reviews/:reviewId/respond', authenticate, authorize('ADMIN', 'STAFF', 'SUPERADMIN'), async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const body = replySchema.parse(req.body);

    const review = await prismaAny.productReview.update({
      where: { id: reviewId },
      data: {
        sellerResponse: body.content,
        sellerRespondedAt: new Date(),
      },
    });

    return sendSuccess(res, review, 'Đã gửi phản hồi từ cửa hàng');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.issues[0].message);
    }
    next(error);
  }
});

router.get('/check-in/status', authenticate, async (req: any, res, next) => {
  try {
    const todayKey = parseDayKey();
    const latest = await prismaAny.dailyCheckIn.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, {
      checkedInToday: latest?.dayKey === todayKey,
      streak: latest?.streak || 0,
      lastCheckInAt: latest?.createdAt || null,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/check-in', authenticate, async (req: any, res, next) => {
  try {
    const today = new Date();
    const todayKey = parseDayKey(today);
    const yesterdayKey = parseDayKey(new Date(today.getTime() - 24 * 60 * 60 * 1000));

    const existingToday = await prismaAny.dailyCheckIn.findUnique({
      where: {
        userId_dayKey: {
          userId: req.user.id,
          dayKey: todayKey,
        },
      },
    });

    if (existingToday) {
      return sendError(res, 'Bạn đã điểm danh hôm nay rồi');
    }

    const latest = await prismaAny.dailyCheckIn.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const streak = latest?.dayKey === yesterdayKey ? latest.streak + 1 : 1;
    const pointsEarned = streak >= 7 ? 25 : 10;

    const checkIn = await prismaAny.dailyCheckIn.create({
      data: {
        userId: req.user.id,
        dayKey: todayKey,
        streak,
        pointsEarned,
      },
    });

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        membershipPoints: {
          increment: pointsEarned,
        },
      },
    });

    await prisma.membershipTransaction.create({
      data: {
        userId: req.user.id,
        type: 'EARN',
        amount: pointsEarned,
        description: `Điểm danh cộng đồng ngày ${todayKey}`,
      },
    });

    await syncMissionProgress(req.user.id);
    await syncAchievements(req.user.id);

    return sendSuccess(res, checkIn, 'Điểm danh thành công');
  } catch (error) {
    next(error);
  }
});

router.get('/referral', authenticate, async (req: any, res, next) => {
  try {
    const profile = await ensureReferralProfile(req.user.id);
    const events = await prismaAny.referralEvent.findMany({
      where: { referrerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return sendSuccess(res, {
      profile,
      events,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/referral/claim', authenticate, async (req: any, res, next) => {
  try {
    const body = referralClaimSchema.parse(req.body);
    const myProfile = await ensureReferralProfile(req.user.id);

    if (myProfile.referredByCode) {
      return sendError(res, 'Tài khoản này đã gắn mã giới thiệu trước đó');
    }

    if (myProfile.code === body.code) {
      return sendError(res, 'Không thể dùng mã giới thiệu của chính bạn');
    }

    const referrerProfile = await prismaAny.referralProfile.findUnique({
      where: { code: body.code },
    });

    if (!referrerProfile) {
      return sendError(res, 'Mã giới thiệu không hợp lệ');
    }

    await prismaAny.referralProfile.update({
      where: { userId: req.user.id },
      data: { referredByCode: body.code },
    });

    await prismaAny.referralEvent.create({
      data: {
        referrerId: referrerProfile.userId,
        referredUserId: req.user.id,
        code: body.code,
        rewardPoints: 50,
        status: 'REWARDED',
      },
    });

    await prisma.user.update({
      where: { id: referrerProfile.userId },
      data: {
        membershipPoints: {
          increment: 50,
        },
      },
    });

    await prisma.membershipTransaction.create({
      data: {
        userId: referrerProfile.userId,
        type: 'EARN',
        amount: 50,
        description: `Thưởng giới thiệu từ mã ${body.code}`,
      },
    });

    await prismaAny.referralProfile.update({
      where: { userId: referrerProfile.userId },
      data: {
        totalInvites: { increment: 1 },
        totalRewards: { increment: 50 },
      },
    });

    return sendSuccess(res, { claimed: true }, 'Áp dụng mã giới thiệu thành công');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.issues[0].message);
    }
    next(error);
  }
});

router.get('/missions', authenticate, async (req: any, res, next) => {
  try {
    const [missions, achievements] = await Promise.all([
      syncMissionProgress(req.user.id),
      syncAchievements(req.user.id),
    ]);

    return sendSuccess(res, {
      missions: missions.map((progress: any) => ({
        id: progress.id,
        progress: progress.progress,
        completedAt: progress.completedAt,
        rewardClaimed: progress.rewardClaimed,
        mission: progress.mission,
      })),
      achievements,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/chat', authenticate, async (req: any, res, next) => {
  try {
    const channel = req.query.channel === 'HUMAN' ? 'HUMAN' : 'AI';
    const baseConversation = await findOrCreateSupportConversation(req.user.id, channel);

    const conversation = await prismaAny.supportConversation.update({
      where: { id: baseConversation.id },
      data:
        channel === 'HUMAN'
          ? {
              lastReadByUserAt: new Date(),
              status: 'READ',
            }
          : {},
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    return sendSuccess(res, serializeSupportConversation(conversation));
  } catch (error) {
    next(error);
  }
});

router.get('/chat/stream', async (req: any, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = verifyAccessToken(token);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    registerSupportStream({ scope: 'USER', userId: user.id }, res);

    const heartbeat = setInterval(() => {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unregisterSupportStream({ scope: 'USER', userId: user.id }, res);
    });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/chat', authenticate, async (req: any, res, next) => {
  try {
    const body = chatSchema.parse(req.body);
    const conversation = await findOrCreateSupportConversation(req.user.id, body.channel);

    const userMessage = await prismaAny.supportMessage.create({
      data: {
        conversationId: conversation.id,
        userId: req.user.id,
        sender: 'USER',
        content: body.message,
      },
    });
    await prismaAny.supportConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: userMessage.createdAt,
        lastReadByUserAt: userMessage.createdAt,
        status: body.channel === 'HUMAN' ? 'PENDING' : conversation.status,
      },
    });

    if (body.channel === 'AI') {
      const assistantReply = await generateAssistantReply(req.user.id, body.message);

      const assistantMessage = await prismaAny.supportMessage.create({
        data: {
          conversationId: conversation.id,
          sender: 'ASSISTANT',
          content: assistantReply,
        },
      });

      await prismaAny.supportConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: assistantMessage.createdAt,
        },
      });

      emitSupportStreamToUser(req.user.id, { kind: 'message', channel: 'AI', conversationId: conversation.id, sender: 'ASSISTANT' });

      return sendSuccess(res, {
        userMessage,
        assistantMessage,
      });
    }

    const customer = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, email: true },
    });

    await createAdminNotifications({
      type: 'CUSTOMER',
      title: 'Tin nhắn tư vấn mới từ khách hàng',
      message: `${customer?.name || customer?.email || 'Khách hàng'} vừa gửi yêu cầu tư vấn cho nhân viên.`,
      link: `/admin/support?conversation=${conversation.id}`,
      metadata: {
        category: 'customer',
        conversationId: conversation.id,
        channel: 'HUMAN',
      },
    });

    emitSupportStreamToUser(req.user.id, { kind: 'message', channel: 'HUMAN', conversationId: conversation.id, sender: 'USER' });
    emitSupportStreamToAdmins({ kind: 'message', channel: 'HUMAN', conversationId: conversation.id, sender: 'USER' });

    return sendSuccess(res, {
      userMessage,
      assistantMessage: null,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.issues[0].message);
    }
    next(error);
  }
});

export default router;
