import express from 'express';
import { z } from 'zod';
import prisma from '../shared/lib/prisma.js';
import { authenticate, authorizeAdmin, verifyAccessToken } from './auth-middleware.js';
import { sendSuccess, sendError } from './utils/api-response.js';
import { createAdminNotifications, createUserNotification, serializeNotificationCenter } from './services/notification-service.js';
import { emitNotificationStream, registerNotificationStream, unregisterNotificationStream } from './services/notification-stream-service.js';
import { emitSupportStreamToAdmins, emitSupportStreamToUser, registerSupportStream, unregisterSupportStream } from './services/support-stream-service.js';
import { generateMarketingImage } from './services/codex-imagen-service.js';

const router = express.Router();
const prismaAny = prisma as any;

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  value: z.string().min(1),
  sku: z.string().min(1),
  costPrice: z.number().min(0),
  price: z.number().positive(),
  promotionalPrice: z.number().min(0).optional().nullable(),
  stock: z.number().int().min(0),
  initialStock: z.number().int().min(0).optional(),
  images: z.array(z.string()).default([]),
});

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  sku: z.string().min(2).optional().nullable(),
  description: z.string().min(10),
  costPrice: z.number().min(0),
  price: z.number().positive(),
  promotionalPrice: z.number().min(0).optional().nullable(),
  images: z.array(z.string()).min(1),
  categoryId: z.string().uuid(),
  brand: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().min(0),
  initialStock: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional().nullable(),
  variants: z.array(variantSchema).optional(),
});

const receiptLineSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  productName: z.string().min(2).max(180).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  costPrice: z.number().min(0),
  salePrice: z.number().positive(),
});

const inventoryReceiptSchema = z.object({
  supplier: z.string().min(2).max(160).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  receivedAt: z.string().datetime().optional().nullable(),
  items: z.array(receiptLineSchema).min(1, 'Phiếu nhập cần ít nhất 1 sản phẩm.'),
});

const importStockSchema = z.object({
  productId: z.string().uuid().optional(),
  mode: z.enum(['RESTOCK', 'NEW_PRODUCT']),
  quantity: z.number().int().positive(),
  supplier: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  product: productSchema.optional(),
});

const settingsSchema = z.object({
  storeName: z.string().min(2),
  contactEmail: z.string().email(),
  hotline: z.string().min(8),
  address: z.string().min(5),
  description: z.string().min(10),
});

const voucherSchema = z.object({
  code: z.string().min(3).max(32).transform((value) => value.toUpperCase().trim()),
  title: z.string().min(3).max(120),
  description: z.string().max(300).optional().nullable(),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().positive(),
  minOrderValue: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean(),
});

const customerUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional().nullable(),
  isActive: z.boolean().optional(),
});

const categorySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(160),
  description: z.string().max(400).optional().nullable(),
  image: z.string().optional().nullable(),
  isActive: z.boolean(),
});

const supplierSchema = z.object({
  name: z.string().min(2).max(160),
  code: z.string().max(40).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  isActive: z.boolean(),
});

const supportReplySchema = z.object({
  message: z.string().min(2).max(1200),
});

const marketingCampaignSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(180),
  type: z.enum(['FLASH_SALE', 'DEAL', 'PROMOTION']),
  description: z.string().max(500).optional().nullable(),
  bannerImage: z.string().optional().nullable(),
  productIds: z.array(z.string().uuid()).optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean(),
});

const marketingImagePromptSchema = z.object({
  prompt: z.string().min(8).max(1200),
  campaignType: z.enum(['FLASH_SALE', 'DEAL', 'PROMOTION']).default('PROMOTION'),
  campaignName: z.string().max(160).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  productIds: z.array(z.string().uuid()).optional().nullable(),
});

const MAIN_SHOP_ID = 'main-shop';
const SELLABLE_CATEGORY_SLUGS = ['cong-nghe', 'gia-dung', 'my-pham'];
const CORE_CATEGORIES = [
  { name: 'Đồ công nghệ', slug: 'cong-nghe', description: 'Thiết bị và phụ kiện công nghệ chính hãng.' },
  { name: 'Đồ gia dụng', slug: 'gia-dung', description: 'Sản phẩm gia dụng tiện ích cho cuộc sống hiện đại.' },
  { name: 'Mỹ phẩm', slug: 'my-pham', description: 'Mỹ phẩm chính hãng, chăm sóc da và làm đẹp mỗi ngày.' },
];

const ensureCoreCategories = async () => {
  await Promise.all(
    CORE_CATEGORIES.map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name, description: category.description, isActive: true, deletedAt: null },
        create: { ...category, isActive: true },
      })
    )
  );
  await prisma.category.updateMany({ where: { slug: 'san-pham-nhap-kho' }, data: { isActive: false } }).catch(() => undefined);
};

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const percentGrowth = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const isProductLowStock = (product: { stock: number; initialStock: number; reorderLevel: number }) => {
  if (product.initialStock <= 2) return false;
  const threshold = Math.max(product.reorderLevel || 0, Math.ceil(product.initialStock * 0.5));
  return threshold > 0 && product.stock <= threshold;
};

const formatAdminAction = (action: string) => {
  const labelMap: Record<string, string> = {
    ADMIN_LOGIN: 'Đăng nhập quản trị',
    ADMIN_LOGOUT: 'Đăng xuất quản trị',
    ADMIN_CREATE_PRODUCT: 'Tạo sản phẩm',
    ADMIN_UPDATE_PRODUCT: 'Cập nhật sản phẩm',
    ADMIN_DELETE_PRODUCT: 'Ẩn sản phẩm',
    ADMIN_RESTOCK_PRODUCT: 'Bổ sung hàng',
    ADMIN_IMPORT_NEW_PRODUCT: 'Nhập hàng mới',
    ADMIN_UPDATE_ORDER_STATUS: 'Cập nhật trạng thái đơn hàng',
    ADMIN_BATCH_UPDATE_ORDERS: 'Cập nhật hàng loạt đơn hàng',
    ADMIN_CREATE_VOUCHER: 'Tạo voucher',
    ADMIN_UPDATE_VOUCHER: 'Cập nhật voucher',
    ADMIN_UPDATE_SETTINGS: 'Cập nhật cấu hình cửa hàng',
    ADMIN_UPDATE_CUSTOMER: 'Cập nhật khách hàng',
    ADMIN_BAN_CUSTOMER: 'Khóa tài khoản khách hàng',
    ADMIN_UNBAN_CUSTOMER: 'Mở khóa tài khoản khách hàng',
  };

  return labelMap[action] || action.replace(/^ADMIN_/, '').replaceAll('_', ' ');
};

const ensureShopProfile = async () =>
  prismaAny.shopProfile.upsert({
    where: { id: MAIN_SHOP_ID },
    update: {},
    create: {
      id: MAIN_SHOP_ID,
      slug: 'hai-tui-minh',
      name: 'Tiệm Bách Hóa Hai Tụi Mình',
      description: 'Tiệm chuyên mỹ phẩm chính hãng, đồ gia dụng tiện ích và đồ công nghệ với mức giá cạnh tranh.',
      coverImage: null,
    },
  });

const parseDateValue = (value?: string | null) => (value ? new Date(value) : null);

const normalizeOptionalText = (value?: string | null) => {
  const next = value?.trim();
  return next ? next : null;
};

const DEFAULT_PRODUCT_IMAGE = '/favicon.svg';

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;

const ensureReceiptCategory = async (tx: any) =>
  tx.category.upsert({
    where: { slug: 'san-pham-nhap-kho' },
    update: { isActive: true, deletedAt: null },
    create: {
      name: 'San pham nhap kho',
      slug: 'san-pham-nhap-kho',
      description: 'Danh muc tu dong cho san pham duoc tao tu phieu nhap.',
      isActive: true,
    },
  });

const createUniqueProductSlug = async (tx: any, name: string) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (await tx.product.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const resolveReceiptProduct = async (
  tx: any,
  line: { productId?: string | null; productName?: string | null; categoryId?: string | null; imageUrl?: string | null; quantity: number; costPrice: number; salePrice: number },
  categoryId: string
) => {
  const imageUrl = normalizeOptionalText(line.imageUrl || null);

  if (line.productId) {
    const product = await tx.product.findUnique({
      where: { id: line.productId },
      select: { id: true, stock: true, initialStock: true, images: true },
    });
    if (!product) throw new Error('Co san pham trong phieu nhap khong hop le.');

    const nextImages = imageUrl && !product.images.includes(imageUrl) ? [imageUrl, ...product.images] : product.images;
    await tx.product.update({
      where: { id: product.id },
      data: {
        stock: { increment: line.quantity },
        initialStock: Math.max(product.initialStock, product.stock + line.quantity),
        costPrice: line.costPrice,
        price: line.salePrice,
        images: nextImages.length ? nextImages : [DEFAULT_PRODUCT_IMAGE],
        isActive: true,
        deletedAt: null,
      },
    });

    return product.id;
  }

  const productName = normalizeOptionalText(line.productName || null);
  if (!productName) throw new Error('Phieu nhap co dong chua co ten san pham.');

  const product = await tx.product.create({
    data: {
      name: productName,
      slug: await createUniqueProductSlug(tx, productName),
      description: 'San pham duoc tao tu dong tu phieu nhap kho.',
      costPrice: line.costPrice,
      price: line.salePrice,
      images: [imageUrl || DEFAULT_PRODUCT_IMAGE],
      categoryId,
      stock: line.quantity,
      initialStock: line.quantity,
      reorderLevel: 0,
      variantsJson: [],
      isActive: true,
    },
    select: { id: true },
  });

  return product.id;
};

const applyReceiptLines = async (tx: any, items: Array<{ productId?: string | null; productName?: string | null; categoryId?: string | null; imageUrl?: string | null; quantity: number; costPrice: number; salePrice: number }>) => {
  if (!items.length) throw new Error('Phieu nhap can it nhat 1 san pham.');
  if (items.some((item) => (!item.productId && (!normalizeOptionalText(item.productName || null) || !item.categoryId)) || item.quantity <= 0 || item.salePrice <= 0)) {
    throw new Error('Phieu nhap can day du san pham, so luong va gia ban.');
  }

  const fallbackCategory = items.some((item) => !item.productId && !item.categoryId) ? await ensureReceiptCategory(tx) : null;

  return Promise.all(
    items.map(async (item) => ({
      productId: await resolveReceiptProduct(tx, item, item.categoryId || fallbackCategory?.id || ''),
      quantity: item.quantity,
      costPrice: item.costPrice,
      salePrice: item.salePrice,
    }))
  );
};

const deriveSupportWorkflowStatus = (conversation: any) => {
  const lastReadByAdminAt = conversation.lastReadByAdminAt ? new Date(conversation.lastReadByAdminAt) : null;
  const lastReadByUserAt = conversation.lastReadByUserAt ? new Date(conversation.lastReadByUserAt) : null;
  const messages = conversation.messages || [];
  const lastMessage = messages[messages.length - 1] || null;
  const unreadForAdmin = messages.filter(
    (message: any) => message.sender === 'USER' && (!lastReadByAdminAt || new Date(message.createdAt) > lastReadByAdminAt)
  ).length;
  const unreadForUser = messages.filter(
    (message: any) => message.sender === 'ADMIN' && (!lastReadByUserAt || new Date(message.createdAt) > lastReadByUserAt)
  ).length;
  const hasAdminReply = messages.some((message: any) => message.sender === 'ADMIN');

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

const serializeSupportInboxItem = (conversation: any) => {
  const lastReadByAdminAt = conversation.lastReadByAdminAt ? new Date(conversation.lastReadByAdminAt) : null;
  const lastReadByUserAt = conversation.lastReadByUserAt ? new Date(conversation.lastReadByUserAt) : null;
  const messages = conversation.messages || [];
  const unreadForAdmin = messages.filter(
    (message: any) => message.sender === 'USER' && (!lastReadByAdminAt || new Date(message.createdAt) > lastReadByAdminAt)
  ).length;
  const unreadForUser = messages.filter(
    (message: any) => message.sender === 'ADMIN' && (!lastReadByUserAt || new Date(message.createdAt) > lastReadByUserAt)
  ).length;
  const lastMessage = messages[messages.length - 1] || null;

  return {
    id: conversation.id,
    channel: conversation.channel,
    status: conversation.status,
    workflowStatus: deriveSupportWorkflowStatus(conversation),
    assignedAdminId: conversation.assignedAdminId ?? null,
    unreadForAdmin,
    unreadForUser,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    customer: {
      id: conversation.user.id,
      name: conversation.user.name,
      email: conversation.user.email,
      avatar: conversation.user.avatar ?? null,
    },
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          sender: lastMessage.sender,
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
        }
      : null,
    messages: messages.map((message: any) => ({
      id: message.id,
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt,
      userId: message.userId ?? null,
    })),
  };
};

const serializeProduct = (product: any) => ({
  ...product,
  image: product.images?.[0] || '',
  variants:
    Array.isArray(product.variantsJson) && product.variantsJson.length
      ? [
          {
            type: 'capacity',
            options: product.variantsJson,
          },
        ]
      : [],
});

const syncReceiptItems = async (receiptId: string, items: Array<{ productId: string; quantity: number; costPrice: number; salePrice: number }>) => {
  const existingReceipt = await prismaAny.stockReceipt.findUnique({
    where: { id: receiptId },
    include: { items: true },
  });

  if (!existingReceipt) {
    throw new Error('Không tìm thấy phiếu nhập');
  }

  const grouped = new Map<string, { productId: string; quantity: number; costPrice: number; salePrice: number }>();
  for (const item of items) {
    const current = grouped.get(item.productId);
    if (current) {
      grouped.set(item.productId, {
        productId: item.productId,
        quantity: current.quantity + item.quantity,
        costPrice: item.costPrice,
        salePrice: item.salePrice,
      });
    } else {
      grouped.set(item.productId, { ...item });
    }
  }

  const normalizedItems = Array.from(grouped.values());
  const previousMap = new Map<string, { productId: string; quantity: number; costPrice: number; salePrice: number }>(
    existingReceipt.items.map((item: any) => [item.productId, item])
  );
  const nextMap = new Map<string, { productId: string; quantity: number; costPrice: number; salePrice: number }>(
    normalizedItems.map((item) => [item.productId, item])
  );
  const productIds = Array.from(new Set<string>([...previousMap.keys(), ...nextMap.keys()]));

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, stock: true, initialStock: true, reorderLevel: true, costPrice: true, price: true, name: true },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  for (const productId of productIds) {
    const product = productMap.get(productId);
    if (!product) {
      throw new Error('Có sản phẩm trong phiếu nhập không còn tồn tại.');
    }

    const previousQuantity = previousMap.get(productId)?.quantity || 0;
    const nextQuantity = nextMap.get(productId)?.quantity || 0;
    const diff = nextQuantity - previousQuantity;

    if (diff < 0 && product.stock < Math.abs(diff)) {
      throw new Error(`Không thể giảm phiếu nhập cho ${product.name} vì tồn kho hiện tại không đủ.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const productId of productIds) {
      const product = productMap.get(productId)!;
      const previousQuantity = previousMap.get(productId)?.quantity || 0;
      const nextQuantity = nextMap.get(productId)?.quantity || 0;
      const diff = nextQuantity - previousQuantity;

      if (diff === 0) {
        const unchanged = nextMap.get(productId);
        if (unchanged && (unchanged.costPrice !== product.costPrice || unchanged.salePrice !== product.price)) {
          await tx.product.update({
            where: { id: productId },
            data: {
              costPrice: unchanged.costPrice,
              price: unchanged.salePrice,
            },
          });
        }
        continue;
      }

      const nextCostPrice = nextMap.get(productId)?.costPrice;
      const nextSalePrice = nextMap.get(productId)?.salePrice;

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: diff },
          initialStock: diff > 0 ? Math.max(product.initialStock, product.stock + diff) : product.initialStock,
          costPrice: nextCostPrice ?? product.costPrice,
          price: nextSalePrice ?? product.price,
        },
      });
    }

    await tx.stockReceiptItem.deleteMany({ where: { receiptId } });
    await tx.stockReceiptItem.createMany({
      data: normalizedItems.map((item) => ({
        receiptId,
        productId: item.productId,
        quantity: item.quantity,
        costPrice: item.costPrice,
        salePrice: item.salePrice,
      })),
    });
  });
};

router.get('/support/stream', async (req: any, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = verifyAccessToken(token);
    if (!['ADMIN', 'SUPERADMIN', 'STAFF'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    registerSupportStream({ scope: 'ADMIN' }, res);

    const heartbeat = setInterval(() => {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unregisterSupportStream({ scope: 'ADMIN' }, res);
    });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.use(authenticate, authorizeAdmin);

router.get('/notifications', async (req: any, res, next) => {
  try {
    const notifications = await prisma.appNotification.findMany({
      where: { userId: req.user.id, scope: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const filteredNotifications = notifications.filter((item) => {
      const title = String(item.title || '').toLowerCase();
      const action = String((item.metadata as any)?.action || '').toLowerCase();
      const isAdminAuthNoise =
        title.includes('đăng nhập quản trị') ||
        title.includes('đăng xuất quản trị') ||
        title.includes('quản trị viên đăng nhập') ||
        title.includes('quản trị viên đăng xuất') ||
        action === 'admin_login' ||
        action === 'admin_logout';

      return !isAdminAuthNoise;
    });

    return sendSuccess(res, serializeNotificationCenter(filteredNotifications.slice(0, 25)));
  } catch (error) {
    next(error);
  }
});

router.get('/notifications/stream', async (req: any, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = verifyAccessToken(token);
    if (!['ADMIN', 'SUPERADMIN', 'STAFF'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    registerNotificationStream(user.id, 'ADMIN', res);

    const heartbeat = setInterval(() => {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unregisterNotificationStream(user.id, 'ADMIN', res);
    });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.patch('/notifications/:id/read', async (req: any, res, next) => {
  try {
    const notification = await prisma.appNotification.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true, scope: true },
    });

    if (!notification || notification.userId !== req.user.id || notification.scope !== 'ADMIN') {
      return sendError(res, 'Không tìm thấy thông báo', 404);
    }

    const updated = await prisma.appNotification.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    });

    emitNotificationStream(req.user.id, 'ADMIN');

    return sendSuccess(res, updated, 'Đã đánh dấu đã đọc');
  } catch (error) {
    next(error);
  }
});

router.post('/notifications/read-all', async (req: any, res, next) => {
  try {
    const result = await prisma.appNotification.updateMany({
      where: { userId: req.user.id, scope: 'ADMIN', isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    emitNotificationStream(req.user.id, 'ADMIN');

    return sendSuccess(res, { count: result.count }, 'Đã đánh dấu toàn bộ thông báo');
  } catch (error) {
    next(error);
  }
});

router.get('/support/conversations', async (_req: any, res, next) => {
  try {
    const conversations = await prismaAny.supportConversation.findMany({
      where: { channel: 'HUMAN' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    });

    return sendSuccess(
      res,
      conversations.map((conversation: any) => {
        const serialized = serializeSupportInboxItem(conversation);
        const { messages, ...summary } = serialized;
        return summary;
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get('/support/conversations/:id', async (req: any, res, next) => {
  try {
    const conversation = await prismaAny.supportConversation.findFirst({
      where: { id: req.params.id, channel: 'HUMAN' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return sendError(res, 'Không tìm thấy hội thoại hỗ trợ', 404);
    }

    await prismaAny.supportConversation.update({
      where: { id: conversation.id },
      data: {
        assignedAdminId: req.user?.id,
        lastReadByAdminAt: new Date(),
        status: 'RECEIVED',
      },
    });

    const refreshed = await prismaAny.supportConversation.findUnique({
      where: { id: conversation.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return sendSuccess(res, serializeSupportInboxItem(refreshed));
  } catch (error) {
    next(error);
  }
});

router.post('/support/conversations/:id/messages', async (req: any, res, next) => {
  try {
    const body = supportReplySchema.parse(req.body);
    const conversation = await prismaAny.supportConversation.findFirst({
      where: { id: req.params.id, channel: 'HUMAN' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!conversation) {
      return sendError(res, 'Không tìm thấy hội thoại hỗ trợ', 404);
    }

    const reply = await prismaAny.supportMessage.create({
      data: {
        conversationId: conversation.id,
        userId: req.user?.id,
        sender: 'ADMIN',
        content: body.message,
      },
    });

    await prismaAny.supportConversation.update({
      where: { id: conversation.id },
      data: {
        assignedAdminId: req.user?.id,
        lastMessageAt: reply.createdAt,
        lastReadByAdminAt: reply.createdAt,
        status: 'IN_PROGRESS',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'ADMIN_REPLY_SUPPORT_CHAT',
        entity: 'SupportConversation',
        entityId: conversation.id,
      },
    });

    emitSupportStreamToUser(conversation.user.id, { kind: 'message', conversationId: conversation.id, channel: 'HUMAN', sender: 'ADMIN' });
    emitSupportStreamToAdmins({ kind: 'message', conversationId: conversation.id, channel: 'HUMAN', sender: 'ADMIN' });

    await createUserNotification(conversation.user.id, {
      type: 'CUSTOMER',
      title: 'Nhân viên đã phản hồi cuộc trò chuyện',
      message: `${req.user?.name || req.user?.email || 'Nhân viên tư vấn'} vừa gửi phản hồi cho bạn.`,
      metadata: {
        category: 'customer',
        conversationId: conversation.id,
        channel: 'HUMAN',
      },
    });

    return sendSuccess(res, { id: reply.id }, 'Đã gửi phản hồi cho khách hàng');
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.get('/categories', async (_req, res, next) => {
  try {
    await ensureCoreCategories();
    const categories = await prisma.category.findMany({
      where: { deletedAt: null, slug: { in: SELLABLE_CATEGORY_SLUGS } },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
});

router.post('/categories', async (req: any, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: normalizeOptionalText(data.description),
        image: normalizeOptionalText(data.image),
        isActive: data.isActive,
      },
    });

    await prisma.auditLog.create({ data: { userId: req.user?.id, action: 'ADMIN_CREATE_CATEGORY', entity: 'Category', entityId: category.id } });
    return sendSuccess(res, category, 'Đã tạo danh mục', 201);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.patch('/categories/:id', async (req: any, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description === undefined ? undefined : normalizeOptionalText(data.description),
        image: data.image === undefined ? undefined : normalizeOptionalText(data.image),
        isActive: data.isActive,
      },
    });

    await prisma.auditLog.create({ data: { userId: req.user?.id, action: 'ADMIN_UPDATE_CATEGORY', entity: 'Category', entityId: category.id } });
    return sendSuccess(res, category, 'Đã cập nhật danh mục');
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.delete('/categories/:id', async (req: any, res, next) => {
  try {
    await prisma.category.update({
      where: { id: req.params.id },
      data: { isActive: false, deletedAt: new Date() },
    });
    await prisma.auditLog.create({ data: { userId: req.user?.id, action: 'ADMIN_DELETE_CATEGORY', entity: 'Category', entityId: req.params.id } });
    return sendSuccess(res, null, 'Đã ẩn danh mục');
  } catch (error) {
    next(error);
  }
});

router.get('/suppliers', async (_req, res, next) => {
  try {
    const suppliers = await prismaAny.supplier.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return sendSuccess(res, suppliers);
  } catch (error) {
    next(error);
  }
});

router.post('/suppliers', async (req: any, res, next) => {
  try {
    const data = supplierSchema.parse(req.body);
    const supplier = await prismaAny.supplier.create({
      data: {
        name: data.name,
        code: normalizeOptionalText(data.code),
        phone: normalizeOptionalText(data.phone),
        email: normalizeOptionalText(data.email),
        address: normalizeOptionalText(data.address),
        note: normalizeOptionalText(data.note),
        isActive: data.isActive,
      },
    });
    await prisma.auditLog.create({ data: { userId: req.user?.id, action: 'ADMIN_CREATE_SUPPLIER', entity: 'Supplier', entityId: supplier.id } });
    return sendSuccess(res, supplier, 'Đã tạo nhà cung cấp', 201);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.patch('/suppliers/:id', async (req: any, res, next) => {
  try {
    const data = supplierSchema.partial().parse(req.body);
    const supplier = await prismaAny.supplier.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        code: data.code === undefined ? undefined : normalizeOptionalText(data.code),
        phone: data.phone === undefined ? undefined : normalizeOptionalText(data.phone),
        email: data.email === undefined ? undefined : normalizeOptionalText(data.email),
        address: data.address === undefined ? undefined : normalizeOptionalText(data.address),
        note: data.note === undefined ? undefined : normalizeOptionalText(data.note),
        isActive: data.isActive,
      },
    });
    await prisma.auditLog.create({ data: { userId: req.user?.id, action: 'ADMIN_UPDATE_SUPPLIER', entity: 'Supplier', entityId: supplier.id } });
    return sendSuccess(res, supplier, 'Đã cập nhật nhà cung cấp');
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.delete('/suppliers/:id', async (req: any, res, next) => {
  try {
    await prismaAny.supplier.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    await prisma.auditLog.create({ data: { userId: req.user?.id, action: 'ADMIN_DELETE_SUPPLIER', entity: 'Supplier', entityId: req.params.id } });
    return sendSuccess(res, null, 'Đã ngừng kích hoạt nhà cung cấp');
  } catch (error) {
    next(error);
  }
});

router.get('/marketing/campaigns', async (_req, res, next) => {
  try {
    const campaigns = await prismaAny.marketingCampaign.findMany({
      orderBy: [{ isActive: 'desc' }, { startsAt: 'desc' }, { createdAt: 'desc' }],
    });
    return sendSuccess(
      res,
      campaigns.map((campaign: any) => ({
        ...campaign,
        productIds: Array.isArray(campaign.productIds) ? campaign.productIds : [],
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.post('/marketing/images/generate', async (req: any, res, next) => {
  try {
    const data = marketingImagePromptSchema.parse(req.body);
    const products = data.productIds?.length
      ? await prisma.product.findMany({
          where: { id: { in: data.productIds } },
          select: { name: true },
          take: 12,
        })
      : [];

    const generated = await generateMarketingImage({
      adminPrompt: data.prompt,
      campaignType: data.campaignType,
      campaignName: data.campaignName,
      description: data.description,
      productNames: products.map((product) => product.name),
    });

    const imageRecord = await prismaAny.generatedMarketingImage.create({
      data: {
        userId: req.user?.id || null,
        prompt: generated.prompt,
        finalPrompt: generated.finalPrompt,
        campaignType: data.campaignType,
        imageUrl: generated.imageUrl,
        imagePath: generated.imagePath,
        metadata: generated.metadata,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'ADMIN_GENERATE_MARKETING_IMAGE',
        entity: 'GeneratedMarketingImage',
        entityId: imageRecord.id,
      },
    });

    return sendSuccess(res, imageRecord, 'Đã tạo ảnh quảng cáo', 201);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    if (error instanceof Error) return sendError(res, error.message, 500);
    next(error);
  }
});

router.post('/marketing/campaigns', async (req: any, res, next) => {
  try {
    const data = marketingCampaignSchema.parse(req.body);
    const campaign = await prismaAny.marketingCampaign.create({
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        description: normalizeOptionalText(data.description),
        bannerImage: normalizeOptionalText(data.bannerImage),
        productIds: data.productIds || [],
        startsAt: parseDateValue(data.startsAt),
        endsAt: parseDateValue(data.endsAt),
        isActive: data.isActive,
      },
    });
    await prisma.auditLog.create({ data: { userId: req.user?.id, action: 'ADMIN_CREATE_MARKETING_CAMPAIGN', entity: 'MarketingCampaign', entityId: campaign.id } });
    return sendSuccess(res, { ...campaign, productIds: Array.isArray(campaign.productIds) ? campaign.productIds : [] }, 'Đã tạo chiến dịch', 201);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.patch('/marketing/campaigns/:id', async (req: any, res, next) => {
  try {
    const data = marketingCampaignSchema.partial().parse(req.body);
    const campaign = await prismaAny.marketingCampaign.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        description: data.description === undefined ? undefined : normalizeOptionalText(data.description),
        bannerImage: data.bannerImage === undefined ? undefined : normalizeOptionalText(data.bannerImage),
        productIds: data.productIds === undefined ? undefined : data.productIds || [],
        startsAt: data.startsAt === undefined ? undefined : parseDateValue(data.startsAt),
        endsAt: data.endsAt === undefined ? undefined : parseDateValue(data.endsAt),
        isActive: data.isActive,
      },
    });
    await prisma.auditLog.create({ data: { userId: req.user?.id, action: 'ADMIN_UPDATE_MARKETING_CAMPAIGN', entity: 'MarketingCampaign', entityId: campaign.id } });
    return sendSuccess(res, { ...campaign, productIds: Array.isArray(campaign.productIds) ? campaign.productIds : [] }, 'Đã cập nhật chiến dịch');
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.delete('/marketing/campaigns/:id', async (req: any, res, next) => {
  try {
    await prismaAny.marketingCampaign.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    await prisma.auditLog.create({ data: { userId: req.user?.id, action: 'ADMIN_DELETE_MARKETING_CAMPAIGN', entity: 'MarketingCampaign', entityId: req.params.id } });
    return sendSuccess(res, null, 'Đã ngừng chiến dịch');
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (_req, res, next) => {
  try {
    await ensureShopProfile();
    const now = new Date();
    const sevenDaysAgo = daysAgo(7);
    const fourteenDaysAgo = daysAgo(14);

    const [
      totalRevenue,
      currentRevenue,
      previousRevenue,
      totalOrders,
      currentOrders,
      previousOrders,
      totalCustomers,
      currentCustomers,
      previousCustomers,
      totalProducts,
      currentProducts,
      previousProducts,
      lowStockProducts,
      totalVouchers,
      activeVouchers,
      chartOrders,
      popularProducts,
      recentOrders,
      auditLogs,
    ] = await Promise.all([
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.order.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
      prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
      prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
      prisma.product.count({ where: { deletedAt: null, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
      prisma.product.findMany({
        where: { deletedAt: null, isActive: true },
        select: { stock: true, initialStock: true, reorderLevel: true },
      }),
      prismaAny.voucher.count(),
      prismaAny.voucher.count({ where: { isActive: true } }),
      prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.product.findMany({
        where: { deletedAt: null, isActive: true },
        include: { category: true, _count: { select: { orderItems: true } } },
        orderBy: [{ soldCount: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),
      prisma.order.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.auditLog.findMany({
        where: { action: { startsWith: 'ADMIN_' } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const chartMap = new Map<string, number>();
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - index);
      chartMap.set(date.toISOString().slice(0, 10), 0);
    }

    chartOrders.forEach((order) => {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (chartMap.has(key)) chartMap.set(key, (chartMap.get(key) || 0) + order.totalAmount);
    });

    return sendSuccess(res, {
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        growth: percentGrowth(currentRevenue._sum.totalAmount || 0, previousRevenue._sum.totalAmount || 0),
        chart: Array.from(chartMap.entries()).map(([date, amount]) => ({ date, amount })),
      },
      orders: {
        count: totalOrders,
        growth: percentGrowth(currentOrders, previousOrders),
        pending: await prisma.order.count({ where: { status: 'PENDING' } }),
      },
      customers: {
        count: totalCustomers,
        growth: percentGrowth(currentCustomers, previousCustomers),
      },
      products: {
        count: totalProducts,
        growth: percentGrowth(currentProducts, previousProducts),
        lowStockCount: lowStockProducts.filter(isProductLowStock).length,
      },
      vouchers: {
        count: totalVouchers,
        active: activeVouchers,
      },
      popularProducts: popularProducts.map((product) => ({
        ...serializeProduct(product),
        orders: product._count.orderItems,
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || order.user?.email || 'Khách hàng',
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        status: order.status,
        createdAt: order.createdAt,
      })),
      authLogs: auditLogs
        .filter((log) => ['ADMIN_LOGIN', 'ADMIN_LOGOUT'].includes(log.action))
        .map((log) => ({
          id: log.id,
          user: 'Qu?n tr? vi?n',
          action: formatAdminAction(log.action),
          timeLabel: new Date(log.createdAt).toLocaleString('vi-VN'),
        })),
      actionLogs: auditLogs
        .filter((log) => !['ADMIN_LOGIN', 'ADMIN_LOGOUT'].includes(log.action))
        .map((log) => ({
          id: log.id,
          user: 'Qu?n tr? vi?n',
          action: formatAdminAction(log.action),
          timeLabel: new Date(log.createdAt).toLocaleString('vi-VN'),
        })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics', async (req, res, next) => {
  try {
    const period = String(req.query.period || '7d');
    const days = period === '30d' ? 30 : period === '365d' ? 365 : 7;
    const startDate = daysAgo(days);

    const [orders, products, topCustomers] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
        include: { items: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.product.findMany({
        where: { deletedAt: null },
        orderBy: { soldCount: 'desc' },
        take: 8,
      }),
      prisma.user.findMany({
        where: { role: 'CUSTOMER', deletedAt: null },
        include: { orders: true },
        take: 5,
      }),
    ]);

    const byDate = new Map<string, { revenue: number; sold: number; orders: number }>();
    orders.forEach((order) => {
      const key = order.createdAt.toISOString().slice(0, 10);
      const current = byDate.get(key) || { revenue: 0, sold: 0, orders: 0 };
      current.revenue += order.totalAmount;
      current.sold += order.items.reduce((sum, item) => sum + item.quantity, 0);
      current.orders += 1;
      byDate.set(key, current);
    });

    return sendSuccess(res, {
      timeline: Array.from(byDate.entries()).map(([date, value]) => ({ date, ...value })),
      summary: {
        revenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        soldProducts: orders.flatMap((order) => order.items).reduce((sum, item) => sum + item.quantity, 0),
        orders: orders.length,
        profit: orders.reduce((sum, order) => sum + order.items.reduce((inner, item) => inner + item.price * item.quantity, 0), 0),
      },
      bestSellingProducts: products.map((product) => ({
        id: product.id,
        name: product.name,
        soldCount: product.soldCount,
        revenueEstimate: product.soldCount * product.price,
      })),
      topCustomers: topCustomers.map((customer) => ({
        id: customer.id,
        name: customer.name || customer.email,
        totalSpent: customer.orders.reduce((sum, order) => sum + order.totalAmount, 0),
        totalOrders: customer.orders.length,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/customers', async (_req, res, next) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER', deletedAt: null },
      include: {
        orders: {
          select: { id: true, totalAmount: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(
      res,
      customers.map((customer) => ({
        id: customer.id,
        name: customer.name || customer.email,
        email: customer.email,
        phone: customer.phone || 'Chưa cập nhật',
        totalOrders: customer.orders.length,
        totalSpent: customer.orders.reduce((sum, order) => sum + order.totalAmount, 0),
        lastOrderDate: customer.orders[0]?.createdAt || customer.createdAt,
        status: customer.isActive ? 'ACTIVE' : 'BANNED',
        avatar: customer.avatar,
        membershipPoints: customer.membershipPoints,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.patch('/customers/:id', async (req: any, res, next) => {
  try {
    const data = customerUpdateSchema.parse(req.body);
    const customer = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, phone: true, isActive: true, membershipPoints: true, avatar: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: data.isActive === false ? 'ADMIN_BAN_CUSTOMER' : data.isActive === true ? 'ADMIN_UNBAN_CUSTOMER' : 'ADMIN_UPDATE_CUSTOMER',
        entity: 'User',
        entityId: customer.id,
      },
    });

    await createAdminNotifications({
      type: 'CUSTOMER',
      title: data.isActive === false ? 'Khóa tài khoản khách hàng' : data.isActive === true ? 'Mở khóa tài khoản khách hàng' : 'Cập nhật hồ sơ khách hàng',
      message: `${customer.name || customer.email} vừa được cập nhật trong hệ thống quản trị.`,
      link: '/admin/customers',
      metadata: { category: 'customer' },
    });

    await createUserNotification(customer.id, {
      type: data.isActive === false ? 'WARNING' : 'INFO',
      title: data.isActive === false ? 'Tài khoản bị tạm khóa' : data.isActive === true ? 'Tài khoản đã được mở lại' : 'Thông tin tài khoản đã được cập nhật',
      message:
        data.isActive === false
          ? 'Tài khoản của bạn hiện đã bị tạm khóa. Vui lòng liên hệ bộ phận CSKH để được hỗ trợ.'
          : data.isActive === true
            ? 'Tài khoản của bạn đã được mở khóa và có thể sử dụng bình thường.'
            : 'Thông tin tài khoản của bạn vừa được cập nhật từ hệ thống.',
      link: '/profile/settings',
    });

    return sendSuccess(res, customer, 'Đã cập nhật người dùng');
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.get('/settings', async (_req, res, next) => {
  try {
    const shop = await ensureShopProfile();
    return sendSuccess(res, {
      storeName: shop.name,
      contactEmail: 'hotro@haituiminh.com',
      hotline: '0931.454.176',
      address: '82/1E ấp Xuân Thới Đông 3, xã Xuân Thới Đông, Hóc Môn, TP.HCM',
      description: shop.description || 'Tiệm chuyên mỹ phẩm chính hãng, đồ gia dụng tiện ích và sản phẩm công nghệ với mức giá cạnh tranh.',
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/settings', async (req: any, res, next) => {
  try {
    const data = settingsSchema.parse(req.body);
    await prismaAny.shopProfile.upsert({
      where: { id: MAIN_SHOP_ID },
      update: { name: data.storeName, description: data.description },
      create: { id: MAIN_SHOP_ID, slug: 'hai-tui-minh', name: data.storeName, description: data.description },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'ADMIN_UPDATE_SETTINGS',
        entity: 'ShopProfile',
        entityId: MAIN_SHOP_ID,
      },
    });

    await createAdminNotifications({
      type: 'SYSTEM',
      title: 'Cập nhật cấu hình cửa hàng',
      message: `Cấu hình chung của cửa hàng vừa được cập nhật bởi ${req.user?.email || 'quản trị viên'}.`,
      link: '/admin/settings',
    });

    return sendSuccess(res, data, 'Đã cập nhật cấu hình cửa hàng');
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.get('/vouchers', async (_req, res, next) => {
  try {
    await ensureShopProfile();
    const vouchers = await prismaAny.voucher.findMany({ orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }] });
    return sendSuccess(res, vouchers);
  } catch (error) {
    next(error);
  }
});

router.post('/vouchers', async (req, res, next) => {
  try {
    await ensureShopProfile();
    const data = voucherSchema.parse(req.body);
    const voucher = await prismaAny.voucher.create({
      data: { ...data, startsAt: parseDateValue(data.startsAt), endsAt: parseDateValue(data.endsAt), shopId: MAIN_SHOP_ID },
    });
    await prisma.auditLog.create({ data: { userId: (req as any).user?.id, action: 'ADMIN_CREATE_VOUCHER', entity: 'Voucher', entityId: voucher.id } });

    await createAdminNotifications({
      type: 'PROMOTION',
      title: 'Voucher mới đã được tạo',
      message: `${voucher.code} đã sẵn sàng với tiêu đề "${voucher.title}".`,
      link: '/admin/vouchers',
      metadata: { category: 'voucher' },
    });

    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER', deletedAt: null, isActive: true },
      select: { id: true },
    });

    if (customers.length > 0) {
      await prisma.appNotification.createMany({
        data: customers.map((customer) => ({
          userId: customer.id,
          scope: 'USER',
          type: 'PROMOTION',
          title: 'Voucher mới dành cho bạn',
          message: `${voucher.title} đã được cập nhật. Xem ngay để không bỏ lỡ ưu đãi mới.`,
          link: '/profile/settings',
        })),
      });
    }

    return sendSuccess(res, voucher, 'Đã tạo voucher mới', 201);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.patch('/vouchers/:id', async (req, res, next) => {
  try {
    const data = voucherSchema.partial().parse(req.body);
    const voucher = await prismaAny.voucher.update({
      where: { id: req.params.id },
      data: {
        ...data,
        startsAt: data.startsAt === undefined ? undefined : parseDateValue(data.startsAt),
        endsAt: data.endsAt === undefined ? undefined : parseDateValue(data.endsAt),
      },
    });
    await prisma.auditLog.create({ data: { userId: (req as any).user?.id, action: 'ADMIN_UPDATE_VOUCHER', entity: 'Voucher', entityId: voucher.id } });

    await createAdminNotifications({
      type: 'PROMOTION',
      title: 'Voucher đã được cập nhật',
      message: `${voucher.code} vừa được chỉnh sửa trong khu vực quản trị.`,
      link: '/admin/vouchers',
    });

    return sendSuccess(res, voucher, 'Đã cập nhật voucher');
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.post('/inventory/receive', async (req: any, res, next) => {
  try {
    const data = importStockSchema.parse(req.body);
    let productId = data.productId;

    if (data.mode === 'NEW_PRODUCT') {
      if (!data.product) return sendError(res, 'Thiếu thông tin sản phẩm mới');
      const product = await prisma.product.create({
        data: {
          name: data.product.name,
          slug: data.product.slug,
          sku: data.product.sku || null,
          description: data.product.description,
          costPrice: data.product.costPrice,
          price: data.product.price,
          promotionalPrice: data.product.promotionalPrice || null,
          images: data.product.images,
          categoryId: data.product.categoryId,
          stock: data.quantity,
          initialStock: data.quantity,
          reorderLevel: data.product.reorderLevel || 0,
          variantsJson: data.product.variants || [],
        },
      });
      productId = product.id;
    } else if (productId) {
      const existing = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
      await prisma.product.update({
        where: { id: productId },
        data: {
          stock: { increment: data.quantity },
          initialStock: Math.max(existing.initialStock, existing.stock + data.quantity),
        },
      });
    }

    if (!productId) return sendError(res, 'Không xác định được sản phẩm để nhập hàng');

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    const receipt = await prismaAny.stockReceipt.create({
      data: {
        code: `PN-${Date.now()}`,
        mode: data.mode,
        supplier: data.supplier || null,
        note: data.note || null,
        createdById: req.user?.id || null,
        items: {
          create: {
            productId,
            quantity: data.quantity,
            costPrice: product.costPrice,
            salePrice: product.price,
          },
        },
      },
      include: { items: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: data.mode === 'NEW_PRODUCT' ? 'ADMIN_IMPORT_NEW_PRODUCT' : 'ADMIN_RESTOCK_PRODUCT',
        entity: 'StockReceipt',
        entityId: receipt.id,
      },
    });

    await createAdminNotifications({
      type: 'SYSTEM',
      title: data.mode === 'NEW_PRODUCT' ? 'Nhập hàng mới' : 'Bổ sung tồn kho',
      message: `${product.name} vừa được ${data.mode === 'NEW_PRODUCT' ? 'tạo mới và nhập kho' : `bổ sung thêm ${data.quantity} sản phẩm`}.`,
      link: '/admin/products',
      metadata: { category: 'stock' },
    });

    return sendSuccess(res, receipt, 'Đã nhập hàng thành công', 201);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.get('/inventory/receipts', async (_req, res, next) => {
  try {
    const receipts = await prismaAny.stockReceipt.findMany({
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true, images: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return sendSuccess(res, receipts);
  } catch (error) {
    next(error);
  }
});

router.post('/inventory/receipts', async (req: any, res, next) => {
  try {
    const data = inventoryReceiptSchema.parse(req.body);
    const receipt = await prisma.$transaction(async (tx) => {
      const receiptItems = await applyReceiptLines(tx, data.items);

      return tx.stockReceipt.create({
        data: {
          code: `PN-${Date.now()}`,
          mode: 'RESTOCK',
          supplier: data.supplier || null,
          note: data.note || null,
          createdById: req.user?.id || null,
          createdAt: data.receivedAt ? new Date(data.receivedAt) : undefined,
          items: { create: receiptItems },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true, images: true } } } },
        },
      });
    });

    return sendSuccess(res, receipt, 'Da tao phieu nhap thanh cong', 201);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    if (error instanceof Error) return sendError(res, error.message);
    next(error);
  }
});

router.patch('/inventory/receipts/:id', async (req: any, res, next) => {
  try {
    const data = inventoryReceiptSchema.parse(req.body);
    const existing = await prismaAny.stockReceipt.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!existing) {
      return sendError(res, 'Khong tim thay phieu nhap.', 404);
    }

    const receipt = await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }

      await tx.stockReceiptItem.deleteMany({ where: { receiptId: req.params.id } });
      const receiptItems = await applyReceiptLines(tx, data.items);

      return tx.stockReceipt.update({
        where: { id: req.params.id },
        data: {
          supplier: data.supplier || null,
          note: data.note || null,
          createdAt: data.receivedAt ? new Date(data.receivedAt) : existing.createdAt,
          items: { create: receiptItems },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true, images: true } } } },
        },
      });
    });

    return sendSuccess(res, receipt, 'Da cap nhat phieu nhap');
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    if (error instanceof Error) return sendError(res, error.message);
    next(error);
  }
});

router.delete('/inventory/receipts/:id', async (req, res, next) => {
  try {
    const receipt = await prismaAny.stockReceipt.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true } } },
    });

    if (!receipt) {
      return sendError(res, 'Không tìm thấy phiếu nhập.', 404);
    }

    for (const item of receipt.items) {
      if (item.product.stock < item.quantity) {
        return sendError(res, `Không thể xóa phiếu vì tồn kho của ${item.product.name} hiện tại thấp hơn số đã nhập.`);
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of receipt.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      await tx.stockReceipt.delete({ where: { id: req.params.id } });
    });

    return sendSuccess(res, null, 'Đã xóa phiếu nhập');
  } catch (error) {
    next(error);
  }
});

router.post('/products', async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        sku: data.sku || null,
        description: data.description,
        costPrice: data.costPrice,
        price: data.price,
        promotionalPrice: data.promotionalPrice || null,
        images: data.images,
        categoryId: data.categoryId,
        brand: normalizeOptionalText(data.brand || null),
        subcategory: normalizeOptionalText(data.subcategory || null),
        tags: data.tags || [],
        stock: data.stock,
        initialStock: data.initialStock ?? data.stock,
        reorderLevel: data.reorderLevel || 0,
        variantsJson: data.variants || [],
      },
    });
    await prisma.auditLog.create({ data: { userId: (req as any).user?.id, action: 'ADMIN_CREATE_PRODUCT', entity: 'Product', entityId: product.id } });

    await createAdminNotifications({
      type: 'SUCCESS',
      title: 'Sản phẩm mới đã được tạo',
      message: `${product.name} đã được thêm vào danh mục bán hàng.`,
      link: '/admin/products',
    });

    return sendSuccess(res, product, 'Đã tạo sản phẩm', 201);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.patch('/products/:id', async (req, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...data,
        sku: data.sku === undefined ? undefined : data.sku || null,
        brand: data.brand === undefined ? undefined : normalizeOptionalText(data.brand || null),
        subcategory: data.subcategory === undefined ? undefined : normalizeOptionalText(data.subcategory || null),
        tags: data.tags === undefined ? undefined : data.tags || [],
        promotionalPrice: data.promotionalPrice === undefined ? undefined : data.promotionalPrice || null,
        variantsJson: data.variants === undefined ? undefined : data.variants,
      },
    });
    await prisma.auditLog.create({ data: { userId: (req as any).user?.id, action: 'ADMIN_UPDATE_PRODUCT', entity: 'Product', entityId: product.id } });

    await createAdminNotifications({
      type: 'INFO',
      title: 'Sản phẩm đã được cập nhật',
      message: `${product.name} vừa được cập nhật thông tin bán hàng.`,
      link: '/admin/products',
    });

    return sendSuccess(res, product, 'Đã cập nhật sản phẩm');
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false, deletedAt: new Date() } });
    await prisma.auditLog.create({ data: { userId: (req as any).user?.id, action: 'ADMIN_DELETE_PRODUCT', entity: 'Product', entityId: req.params.id } });

    await createAdminNotifications({
      type: 'WARNING',
      title: 'Sản phẩm đã bị ẩn',
      message: `${product.name} đã được ẩn khỏi gian hàng.`,
      link: '/admin/products',
    });

    return sendSuccess(res, null, 'Đã xóa sản phẩm');
  } catch (error) {
    next(error);
  }
});

router.get('/orders', async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
});

router.post('/orders/batch-status', async (req, res, next) => {
  try {
    const { ids, status } = z
      .object({
        ids: z.array(z.string().uuid()),
        status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
      })
      .parse(req.body);

    const orders = await prisma.order.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, orderNumber: true },
    });

    await prisma.order.updateMany({ where: { id: { in: ids } }, data: { status } });
    await prisma.auditLog.create({ data: { userId: (req as any).user?.id, action: 'ADMIN_BATCH_UPDATE_ORDERS', entity: 'Order' } });

    await createAdminNotifications({
      type: 'ORDER',
      title: 'Cập nhật hàng loạt đơn hàng',
      message: `${ids.length} đơn hàng vừa được chuyển sang trạng thái ${status}.`,
      link: '/admin/orders',
      metadata: { category: 'order' },
    });

    if (orders.length > 0) {
      await prisma.appNotification.createMany({
        data: orders.map((order) => ({
          userId: order.userId,
          scope: 'USER',
          type: 'ORDER',
          title: 'Đơn hàng được cập nhật',
          message: `Đơn hàng ${order.orderNumber} của bạn vừa chuyển sang trạng thái ${status}.`,
          link: '/profile/orders',
        })),
      });
    }

    return sendSuccess(res, { updated: ids.length }, `Đã cập nhật ${ids.length} đơn hàng`);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']) }).parse(req.body);
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
    await prisma.auditLog.create({ data: { userId: (req as any).user?.id, action: 'ADMIN_UPDATE_ORDER_STATUS', entity: 'Order', entityId: order.id } });

    await createAdminNotifications({
      type: 'ORDER',
      title: 'Đơn hàng đã được cập nhật',
      message: `${order.orderNumber} vừa chuyển sang trạng thái ${status}.`,
      link: '/admin/orders',
    });

    await createUserNotification(order.userId, {
      type: 'ORDER',
      title: 'Đơn hàng của bạn vừa đổi trạng thái',
      message: `Đơn hàng ${order.orderNumber} hiện ở trạng thái ${status}.`,
      link: '/profile/orders',
    });

    return sendSuccess(res, order, 'Đã cập nhật trạng thái đơn hàng');
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

export default router;
