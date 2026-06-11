import type { IncomingMessage, ServerResponse } from 'node:http';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { JWT_SECRET, hasJwtSecret, readJsonBody, sendJson } from '../_shared/auth.js';
import { ensureCoreCategories, getSellableCategories } from '../_shared/catalog.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';
import { generateMarketingImage } from '../../src/server/services/codex-imagen-service.js';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPERADMIN', 'STAFF']);
const MAIN_SHOP_ID = 'main-shop';

type AdminUser = { id: string; email: string; role: string };

const ok = (res: ServerResponse, data: unknown, message = 'OK', status = 200, meta?: unknown) =>
  sendJson(res, status, { success: true, data, message, ...(meta ? { meta } : {}) });

const fail = (res: ServerResponse, error: string, status = 400) => sendJson(res, status, { success: false, error });

const parsePath = (req: IncomingMessage) => {
  const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
  return url.pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');
};

const requireAdmin = async (req: IncomingMessage): Promise<AdminUser | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as AdminUser;
    if (!ADMIN_ROLES.has(String(decoded.role))) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
    });

    if (!user || !user.isActive || user.deletedAt || !ADMIN_ROLES.has(user.role)) return null;
    return { id: user.id, email: user.email, role: user.role };
  } catch {
    return null;
  }
};

const ensureShopProfile = () =>
  prisma.shopProfile.upsert({
    where: { id: MAIN_SHOP_ID },
    update: {},
    create: {
      id: MAIN_SHOP_ID,
      slug: 'hai-tui-minh',
      name: 'Tiệm bách hoá Hai Tụi Mình',
      description: 'Cửa hàng chuyên mỹ phẩm chính hãng, đồ gia dụng tiện ích và sản phẩm công nghệ với mức giá cạnh tranh.',
    },
  });

const parseDate = (value: unknown) => (typeof value === 'string' && value ? new Date(value) : null);
const textOrNull = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const stringArray = (value: unknown) => (Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : []);
const numberOr = (value: unknown, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const intOr = (value: unknown, fallback = 0) => Math.trunc(numberOr(value, fallback));
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

const serializeProduct = (product: any) => ({
  ...product,
  image: product.images?.[0] || '',
  rating: product.rating ?? 4.7,
  reviewCount: product.reviewCount ?? Math.max(12, Math.round((product.soldCount || 0) * 0.18) || 24),
  isNew: Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 21,
  variants: Array.isArray(product.variantsJson) && product.variantsJson.length ? [{ type: 'capacity', options: product.variantsJson }] : [],
});

const receiptProductSelect = { id: true, name: true, sku: true, images: true };

const ensureReceiptCategory = async (tx: Prisma.TransactionClient) =>
  tx.category.upsert({
    where: { slug: 'san-pham-nhap-kho' },
    update: { isActive: true, deletedAt: null },
    create: {
      name: 'Sản phẩm nhập kho',
      slug: 'san-pham-nhap-kho',
      description: 'Danh mục tự động cho sản phẩm được tạo từ phiếu nhập.',
      isActive: true,
    },
  });

const buildReceiptLine = (item: any) => {
  const quantity = Math.max(1, intOr(item.quantity, 1));
  const costPrice = Math.max(0, numberOr(item.costPrice));
  const salePrice = Math.max(1, numberOr(item.salePrice, 1));
  const imageUrl = textOrNull(item.imageUrl);
  const imageUrls = Array.from(new Set([...(Array.isArray(item.imageUrls) ? item.imageUrls : []), imageUrl].map(textOrNull).filter((value): value is string => Boolean(value))));
  const sku = textOrNull(item.sku);
  const productName = textOrNull(item.productName || item.name || item.search);
  const productId = textOrNull(item.productId);
  const categoryId = textOrNull(item.categoryId);

  return { productId, productName, categoryId, sku, imageUrl, imageUrls, quantity, costPrice, salePrice };
};

const createUniqueProductSlug = async (tx: Prisma.TransactionClient, name: string) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (await tx.product.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const createUniqueMarketingCampaignSlug = async (value: string) => {
  const baseSlug = slugify(value || 'chien-dich');
  let slug = baseSlug;
  let suffix = 2;

  while (await prisma.marketingCampaign.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const resolveReceiptProduct = async (
  tx: Prisma.TransactionClient,
  line: ReturnType<typeof buildReceiptLine>,
  categoryId: string,
  options: { affectsStock: boolean; supplier?: string | null }
) => {
  const sourceTags = options.affectsStock ? [] : ['on-demand', 'external-supply', ...(options.supplier ? [`supplier:${options.supplier}`] : [])];
  if (line.productId) {
    const product = await tx.product.findUnique({ where: { id: line.productId }, select: { id: true, stock: true, initialStock: true, images: true, tags: true } });
    if (!product) throw new Error('Có sản phẩm trong phiếu nhập không hợp lệ');

    const nextImages = Array.from(new Set([...(line.imageUrls || []), ...product.images]));
    const nextTags = Array.from(new Set([...(product.tags || []), ...sourceTags]));
    await tx.product.update({
      where: { id: product.id },
      data: {
        ...(options.affectsStock
          ? {
              stock: { increment: line.quantity },
              initialStock: Math.max(product.initialStock, product.stock + line.quantity),
            }
          : {}),
        costPrice: line.costPrice,
        price: line.salePrice,
        images: nextImages.length ? nextImages : [DEFAULT_PRODUCT_IMAGE],
        ...(line.sku ? { sku: line.sku } : {}),
        tags: nextTags,
        isActive: true,
        deletedAt: null,
      },
    });

    return product.id;
  }

  if (!line.productName) throw new Error('Phiếu nhập có dòng chưa có tên sản phẩm');

  const slug = await createUniqueProductSlug(tx, line.productName);
  const product = await tx.product.create({
    data: {
      name: line.productName,
      slug,
      description: 'Sản phẩm được tạo tự động từ phiếu nhập kho.',
      sku: line.sku,
      costPrice: line.costPrice,
      price: line.salePrice,
      images: line.imageUrls.length ? line.imageUrls : [DEFAULT_PRODUCT_IMAGE],
      categoryId,
      stock: options.affectsStock ? line.quantity : 0,
      initialStock: options.affectsStock ? line.quantity : 0,
      reorderLevel: 0,
      tags: sourceTags,
      variantsJson: [],
      isActive: true,
    },
    select: { id: true },
  });

  return product.id;
};

const applyReceiptLines = async (tx: Prisma.TransactionClient, rawItems: any[], options: { affectsStock?: boolean; supplier?: string | null } = {}) => {
  const lines = rawItems.map(buildReceiptLine);
  if (!lines.length) throw new Error('Phiếu nhập cần ít nhất 1 sản phẩm');
  if (lines.some((line) => (!line.productId && (!line.productName || !line.categoryId)) || line.quantity <= 0 || line.salePrice <= 0)) {
    throw new Error('Phiếu nhập cần đầy đủ sản phẩm, số lượng và giá bán');
  }

  const fallbackCategory = lines.some((line) => !line.productId && !line.categoryId) ? await ensureReceiptCategory(tx) : null;

  return Promise.all(
    lines.map(async (line) => ({
      productId: await resolveReceiptProduct(tx, line, line.categoryId || fallbackCategory?.id || '', {
        affectsStock: options.affectsStock !== false,
        supplier: options.supplier,
      }),
      quantity: line.quantity,
      costPrice: line.costPrice,
      salePrice: line.salePrice,
    }))
  );
};

const serializeOrder = (order: any) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  customerName: order.user?.name || order.user?.email || 'Khách hàng',
  customerEmail: order.user?.email || '',
  totalAmount: order.totalAmount,
  status: order.status,
  paymentStatus: order.paymentStatus,
  shippingMethod: order.shippingMethod,
  createdAt: order.createdAt,
  items: order.items || [],
  shippingAddress: (() => {
    try {
      const parsed = JSON.parse(order.shippingAddress || '{}');
      return {
        street: parsed.street || parsed.detail || order.shippingAddress || '',
        city: parsed.city || parsed.province || '',
        phone: parsed.phone || '',
      };
    } catch {
      return { street: order.shippingAddress || '', city: '', phone: '' };
    }
  })(),
});

const workflowStatus = (conversation: any) => {
  const messages = conversation.messages || [];
  const lastReadByAdminAt = conversation.lastReadByAdminAt ? new Date(conversation.lastReadByAdminAt) : null;
  const lastReadByUserAt = conversation.lastReadByUserAt ? new Date(conversation.lastReadByUserAt) : null;
  const unreadForAdmin = messages.filter((message: any) => message.sender === 'USER' && (!lastReadByAdminAt || new Date(message.createdAt) > lastReadByAdminAt)).length;
  const unreadForUser = messages.filter((message: any) => message.sender === 'ADMIN' && (!lastReadByUserAt || new Date(message.createdAt) > lastReadByUserAt)).length;
  const hasAdminReply = messages.some((message: any) => message.sender === 'ADMIN');
  const lastMessage = messages[messages.length - 1] || null;

  if (!hasAdminReply) return unreadForAdmin > 0 ? { code: 'PENDING', label: 'Đang chờ', tone: 'warning' } : { code: 'RECEIVED', label: 'Đã nhận', tone: 'info' };
  if (unreadForUser > 0 || lastMessage?.sender === 'ADMIN') return { code: 'IN_PROGRESS', label: 'Đang xử lý', tone: 'primary' };
  return { code: 'READ', label: 'Đã đọc', tone: 'success' };
};

const serializeConversation = (conversation: any, includeMessages = false) => {
  const messages = conversation.messages || [];
  const lastReadByAdminAt = conversation.lastReadByAdminAt ? new Date(conversation.lastReadByAdminAt) : null;
  const lastReadByUserAt = conversation.lastReadByUserAt ? new Date(conversation.lastReadByUserAt) : null;
  const unreadForAdmin = messages.filter((message: any) => message.sender === 'USER' && (!lastReadByAdminAt || new Date(message.createdAt) > lastReadByAdminAt)).length;
  const unreadForUser = messages.filter((message: any) => message.sender === 'ADMIN' && (!lastReadByUserAt || new Date(message.createdAt) > lastReadByUserAt)).length;
  const lastMessage = messages[messages.length - 1] || null;

  return {
    id: conversation.id,
    channel: conversation.channel,
    status: conversation.status,
    workflowStatus: workflowStatus(conversation),
    assignedAdminId: conversation.assignedAdminId,
    unreadForAdmin,
    unreadForUser,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    customer: {
      id: conversation.user?.id,
      name: conversation.user?.name,
      email: conversation.user?.email,
      avatar: conversation.user?.avatar,
    },
    lastMessage: lastMessage
      ? { id: lastMessage.id, sender: lastMessage.sender, content: lastMessage.content, createdAt: lastMessage.createdAt }
      : null,
    ...(includeMessages
      ? {
          messages: messages.map((message: any) => ({
            id: message.id,
            sender: message.sender,
            content: message.content,
            createdAt: message.createdAt,
            userId: message.userId,
          })),
        }
      : {}),
  };
};

const createAuditLog = (user: AdminUser, action: string, entity?: string, entityId?: string) =>
  prisma.auditLog.create({ data: { userId: user.id, action, entity, entityId } }).catch(() => null);

const handleStats = async (res: ServerResponse) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [orders, previousOrders, customers, previousCustomers, products, vouchers, popularProducts, recentOrders, authLogs, actionLogs] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, include: { items: true, user: { select: { name: true, email: true } } } }),
    prisma.order.findMany({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    prisma.product.findMany({ where: { deletedAt: null }, include: { category: true }, orderBy: { createdAt: 'desc' } }),
    prisma.voucher.findMany(),
    prisma.product.findMany({ where: { deletedAt: null }, include: { category: true }, orderBy: [{ soldCount: 'desc' }, { createdAt: 'desc' }], take: 5 }),
    prisma.order.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.auditLog.findMany({ where: { action: { in: ['ADMIN_LOGIN', 'ADMIN_LOGOUT'] } }, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.auditLog.findMany({ where: { action: { notIn: ['ADMIN_LOGIN', 'ADMIN_LOGOUT', 'USER_LOGIN', 'USER_LOGOUT'] } }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const previousRevenue = previousOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const growth = (current: number, previous: number) => (previous === 0 ? (current > 0 ? 100 : 0) : Number((((current - previous) / previous) * 100).toFixed(1)));
  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    return { date: key, amount: orders.filter((order) => order.createdAt.toISOString().slice(0, 10) === key).reduce((sum, order) => sum + order.totalAmount, 0) };
  });
  const lowStockCount = products.filter((product) => product.initialStock > 2 && product.stock <= Math.max(product.reorderLevel || 0, Math.ceil(product.initialStock * 0.5))).length;

  return ok(res, {
    revenue: { total: totalRevenue, growth: growth(totalRevenue, previousRevenue), chart },
    orders: { count: orders.length, growth: growth(orders.length, previousOrders.length), pending: orders.filter((order) => order.status === 'PENDING').length },
    customers: { count: await prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }), growth: growth(customers, previousCustomers) },
    products: { count: products.length, growth: 0, lowStockCount },
    vouchers: { count: vouchers.length, active: vouchers.filter((voucher) => voucher.isActive).length },
    popularProducts: popularProducts.map((product) => ({ ...serializeProduct(product), orders: product.soldCount })),
    recentOrders: recentOrders.map((order) => ({ id: order.id, orderNumber: order.orderNumber, customerName: order.user?.name || order.user?.email || 'Khách hàng', totalAmount: order.totalAmount, paymentStatus: order.paymentStatus, status: order.status, createdAt: order.createdAt })),
    authLogs: authLogs.map((log) => ({ id: log.id, user: 'Quản trị viên', action: log.action === 'ADMIN_LOGIN' ? 'Đăng nhập quản trị' : 'Đăng xuất quản trị', timeLabel: log.createdAt.toLocaleString('vi-VN') })),
    actionLogs: actionLogs.map((log) => ({ id: log.id, user: 'Quản trị viên', action: log.action.replace(/^ADMIN_/, '').replaceAll('_', ' '), timeLabel: log.createdAt.toLocaleString('vi-VN') })),
  });
};

const handleAnalytics = async (res: ServerResponse) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({ where: { createdAt: { gte: since } }, include: { items: true, user: true } });
  const products = await prisma.product.findMany({ where: { deletedAt: null }, orderBy: [{ soldCount: 'desc' }, { createdAt: 'desc' }], take: 8 });
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER', deletedAt: null }, include: { orders: true }, take: 8 });
  const timeline = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dayOrders = orders.filter((order) => order.createdAt.toISOString().slice(0, 10) === date);
    return {
      date,
      revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      sold: dayOrders.flatMap((order) => order.items).reduce((sum, item) => sum + item.quantity, 0),
      orders: dayOrders.length,
    };
  });
  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const soldProducts = orders.flatMap((order) => order.items).reduce((sum, item) => sum + item.quantity, 0);

  return ok(res, {
    timeline,
    summary: { revenue, soldProducts, orders: orders.length, profit: Math.round(revenue * 0.32) },
    bestSellingProducts: products.map((product) => ({ id: product.id, name: product.name, soldCount: product.soldCount, revenueEstimate: product.soldCount * (product.promotionalPrice || product.price) })),
    topCustomers: customers
      .map((user) => ({ id: user.id, name: user.name || user.email, totalSpent: user.orders.reduce((sum, order) => sum + order.totalAmount, 0), totalOrders: user.orders.length }))
      .sort((a, b) => b.totalSpent - a.totalSpent),
  });
};

const handleProducts = async (req: IncomingMessage, res: ServerResponse, user: AdminUser, path: string) => {
  await ensureCoreCategories(prisma);
  const id = path.split('/')[1];
  if (req.method === 'GET') {
    const products = await prisma.product.findMany({ where: { deletedAt: null }, include: { category: true }, orderBy: { createdAt: 'desc' } });
    return ok(res, products.map(serializeProduct));
  }

  if (req.method === 'POST') {
    const body = await readJsonBody<any>(req);
    const product = await prisma.product.create({
      data: {
        name: String(body.name || '').trim(),
        slug: String(body.slug || slugify(String(body.name || 'san-pham'))),
        sku: textOrNull(body.sku),
        description: String(body.description || 'Sản phẩm chính hãng tại Hai Tụi Mình.'),
        costPrice: numberOr(body.costPrice),
        price: numberOr(body.price, 1),
        promotionalPrice: body.promotionalPrice == null ? null : numberOr(body.promotionalPrice),
        images: Array.isArray(body.images) && body.images.length ? body.images : ['/favicon.svg'],
        categoryId: String(body.categoryId),
        brand: textOrNull(body.brand),
        subcategory: textOrNull(body.subcategory),
        tags: stringArray(body.tags),
        stock: intOr(body.stock),
        initialStock: intOr(body.initialStock, intOr(body.stock)),
        reorderLevel: intOr(body.reorderLevel),
        variantsJson: body.variants || [],
      },
      include: { category: true },
    });
    await createAuditLog(user, 'ADMIN_CREATE_PRODUCT', 'Product', product.id);
    return ok(res, serializeProduct(product), 'Đã tạo sản phẩm', 201);
  }

  if (!id) return fail(res, 'Thiếu mã sản phẩm', 400);
  if (req.method === 'PATCH') {
    const body = await readJsonBody<any>(req);
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.slug !== undefined ? { slug: String(body.slug).trim() } : {}),
        ...(body.sku !== undefined ? { sku: textOrNull(body.sku) } : {}),
        ...(body.description !== undefined ? { description: String(body.description) } : {}),
        ...(body.costPrice !== undefined ? { costPrice: numberOr(body.costPrice) } : {}),
        ...(body.price !== undefined ? { price: numberOr(body.price, 1) } : {}),
        ...(body.promotionalPrice !== undefined ? { promotionalPrice: body.promotionalPrice == null ? null : numberOr(body.promotionalPrice) } : {}),
        ...(body.images !== undefined ? { images: Array.isArray(body.images) ? body.images : [] } : {}),
        ...(body.categoryId !== undefined ? { categoryId: String(body.categoryId) } : {}),
        ...(body.brand !== undefined ? { brand: textOrNull(body.brand) } : {}),
        ...(body.subcategory !== undefined ? { subcategory: textOrNull(body.subcategory) } : {}),
        ...(body.tags !== undefined ? { tags: stringArray(body.tags) } : {}),
        ...(body.stock !== undefined ? { stock: intOr(body.stock) } : {}),
        ...(body.initialStock !== undefined ? { initialStock: intOr(body.initialStock) } : {}),
        ...(body.reorderLevel !== undefined ? { reorderLevel: intOr(body.reorderLevel) } : {}),
        ...(body.variants !== undefined ? { variantsJson: body.variants } : {}),
      },
      include: { category: true },
    });
    await createAuditLog(user, 'ADMIN_UPDATE_PRODUCT', 'Product', product.id);
    return ok(res, serializeProduct(product), 'Đã cập nhật sản phẩm');
  }

  if (req.method === 'DELETE') {
    await prisma.product.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
    await createAuditLog(user, 'ADMIN_DELETE_PRODUCT', 'Product', id);
    return ok(res, null, 'Đã ẩn sản phẩm');
  }
};

const handleCrud = async (req: IncomingMessage, res: ServerResponse, path: string, modelName: 'category' | 'supplier' | 'voucher' | 'marketingCampaign', options: { list?: any; create?: (body: any) => any; update?: (body: any) => any; orderBy?: any; user?: AdminUser; entity: string }) => {
  const model = (prisma as any)[modelName];
  const id = path.split('/').at(-1);
  if (req.method === 'GET') return ok(res, await model.findMany({ where: options.list || {}, orderBy: options.orderBy || { createdAt: 'desc' } }));
  if (req.method === 'POST') {
    const body = await readJsonBody<any>(req);
    if (modelName === 'voucher') await ensureShopProfile();
    const record = await model.create({ data: options.create ? await options.create(body) : body });
    if (options.user) await createAuditLog(options.user, `ADMIN_CREATE_${options.entity.toUpperCase()}`, options.entity, record.id);
    return ok(res, record, 'Đã tạo dữ liệu', 201);
  }
  if (!id) return fail(res, 'Thiếu mã dữ liệu', 400);
  if (req.method === 'PATCH') {
    const body = await readJsonBody<any>(req);
    const record = await model.update({ where: { id }, data: options.update ? options.update(body) : body });
    if (options.user) await createAuditLog(options.user, `ADMIN_UPDATE_${options.entity.toUpperCase()}`, options.entity, record.id);
    return ok(res, record, 'Đã cập nhật dữ liệu');
  }
  if (req.method === 'DELETE') {
    await model.delete({ where: { id } });
    return ok(res, null, 'Đã xóa dữ liệu');
  }
};

const handleReceipts = async (req: IncomingMessage, res: ServerResponse, user: AdminUser, path: string) => {
  const id = path.split('/').at(-1);
  if (req.method === 'GET') {
    const receipts = await prisma.stockReceipt.findMany({ include: { items: { include: { product: { select: receiptProductSelect } } } }, orderBy: { createdAt: 'desc' } });
    return ok(res, receipts);
  }

  if (req.method === 'POST') {
    const body = await readJsonBody<any>(req);
    const items = Array.isArray(body.items) ? body.items : [];
    const mode = body.mode === 'ON_DEMAND' ? 'ON_DEMAND' : 'RESTOCK';
    if (!items.length) return fail(res, 'Phiếu nhập cần ít nhất 1 sản phẩm');
    const receipt = await prisma.$transaction(async (tx) => {
      const receiptItems = await applyReceiptLines(tx, items, { affectsStock: mode !== 'ON_DEMAND', supplier: textOrNull(body.supplier) });
      return tx.stockReceipt.create({
        data: {
          code: `PN-${Date.now()}`,
          mode,
          supplier: textOrNull(body.supplier),
          note: textOrNull(body.note),
          createdById: user.id,
          createdAt: parseDate(body.receivedAt) || undefined,
          items: { create: receiptItems },
        },
        include: { items: { include: { product: { select: receiptProductSelect } } } },
      });
    });
    await createAuditLog(user, mode === 'ON_DEMAND' ? 'ADMIN_RECORD_ON_DEMAND_SUPPLY' : 'ADMIN_RESTOCK_PRODUCT', 'StockReceipt', receipt.id);
    return ok(res, receipt, 'Đã tạo phiếu nhập', 201);
  }

  if (!id) return fail(res, 'Thiếu mã phiếu nhập');
  if (req.method === 'DELETE') {
    const receipt = await prisma.stockReceipt.findUnique({ where: { id }, include: { items: true } });
    if (!receipt) return fail(res, 'Không tìm thấy phiếu nhập', 404);
    await prisma.$transaction(async (tx) => {
      if (receipt.mode !== 'ON_DEMAND') {
        for (const item of receipt.items) await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
      await tx.stockReceipt.delete({ where: { id } });
    });
    return ok(res, null, 'Đã xóa phiếu nhập');
  }

  if (req.method === 'PATCH') {
    const body = await readJsonBody<any>(req);
    const items = Array.isArray(body.items) ? body.items : null;
    const mode = body.mode === 'ON_DEMAND' ? 'ON_DEMAND' : 'RESTOCK';
    const receipt = await prisma.$transaction(async (tx) => {
      const existingReceipt = await tx.stockReceipt.findUnique({ where: { id }, include: { items: true } });
      if (!existingReceipt) throw new Error('Không tìm thấy phiếu nhập');

      let receiptItems: Array<{ productId: string; quantity: number; costPrice: number; salePrice: number }> | null = null;

      if (items) {
        if (existingReceipt.mode !== 'ON_DEMAND') {
          for (const item of existingReceipt.items) {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
          }
        }

        await tx.stockReceiptItem.deleteMany({ where: { receiptId: id } });
        receiptItems = await applyReceiptLines(tx, items, { affectsStock: mode !== 'ON_DEMAND', supplier: textOrNull(body.supplier) });
      }

      return tx.stockReceipt.update({
        where: { id },
        data: {
          mode,
          supplier: textOrNull(body.supplier),
          note: textOrNull(body.note),
          createdAt: parseDate(body.receivedAt) || undefined,
          ...(receiptItems ? { items: { create: receiptItems } } : {}),
        },
        include: { items: { include: { product: { select: receiptProductSelect } } } },
      });
    });
    return ok(res, receipt, 'Đã cập nhật phiếu nhập');
  }
};

const handleMarketingImageGenerate = async (req: IncomingMessage, res: ServerResponse, user: AdminUser) => {
  if (req.method !== 'POST') return fail(res, 'Phương thức không được hỗ trợ', 405);

  const body = await readJsonBody<any>(req);
  const prompt = String(body.prompt || '').trim();
  if (prompt.length < 8) return fail(res, 'Nhập prompt ít nhất 8 ký tự để tạo ảnh quảng cáo');

  const campaignType = ['FLASH_SALE', 'DEAL', 'PROMOTION'].includes(String(body.campaignType)) ? String(body.campaignType) : 'PROMOTION';
  const productIds = Array.isArray(body.productIds) ? body.productIds.map(String).filter(Boolean) : [];
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { name: true },
        take: 12,
      })
    : [];

  const generated = await generateMarketingImage({
    adminPrompt: prompt,
    campaignType: campaignType as 'FLASH_SALE' | 'DEAL' | 'PROMOTION',
    campaignName: textOrNull(body.campaignName),
    description: textOrNull(body.description),
    productNames: products.map((product) => product.name),
  });

  const imageRecord = await (prisma as any).generatedMarketingImage.create({
    data: {
      userId: user.id,
      prompt: generated.prompt,
      finalPrompt: generated.finalPrompt,
      campaignType,
      imageUrl: generated.imageUrl,
      imagePath: generated.imagePath,
      metadata: generated.metadata,
    },
  });
  await createAuditLog(user, 'ADMIN_GENERATE_MARKETING_IMAGE', 'GeneratedMarketingImage', imageRecord.id);
  return ok(res, imageRecord, 'Đã tạo ảnh quảng cáo', 201);
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const path = parsePath(req);

  if (path.endsWith('/stream')) {
    res.statusCode = 204;
    return res.end();
  }

  if (!hasDatabase) return fail(res, 'Production chưa cấu hình DATABASE_URL nên dữ liệu quản trị chưa thể lưu bền vững.', 503);
  if (!hasJwtSecret) return fail(res, 'Production chưa cấu hình JWT_SECRET.', 503);

  const user = await requireAdmin(req);
  if (!user) return fail(res, 'Bạn cần đăng nhập bằng tài khoản quản trị', 401);

  try {
    if (path === 'stats') return handleStats(res);
    if (path === 'analytics') return handleAnalytics(res);
    if (path === 'products' || path.startsWith('products/')) return handleProducts(req, res, user, path);
    if (path === 'orders') return ok(res, (await prisma.order.findMany({ include: { items: true, user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' } })).map(serializeOrder));
    if (path.endsWith('/status') && path.startsWith('orders/') && req.method === 'PATCH') {
      const body = await readJsonBody<any>(req);
      const id = path.split('/')[1];
      const order = await prisma.order.update({ where: { id }, data: { status: String(body.status) } });
      await createAuditLog(user, 'ADMIN_UPDATE_ORDER_STATUS', 'Order', order.id);
      return ok(res, order, 'Đã cập nhật trạng thái đơn hàng');
    }
    if (path === 'orders/batch-status' && req.method === 'POST') {
      const body = await readJsonBody<any>(req);
      const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
      await prisma.order.updateMany({ where: { id: { in: ids } }, data: { status: String(body.status) } });
      await createAuditLog(user, 'ADMIN_BATCH_UPDATE_ORDERS', 'Order');
      return ok(res, { updated: ids.length }, 'Đã cập nhật đơn hàng');
    }
    if (path === 'customers') {
      const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER', deletedAt: null }, include: { orders: true }, orderBy: { createdAt: 'desc' } });
      return ok(res, customers.map((customer) => ({ id: customer.id, name: customer.name || customer.email, email: customer.email, phone: customer.phone, avatar: customer.avatar, totalOrders: customer.orders.length, totalSpent: customer.orders.reduce((sum, order) => sum + order.totalAmount, 0), lastOrderDate: customer.orders[0]?.createdAt || customer.createdAt, status: customer.isActive ? 'ACTIVE' : 'BANNED', membershipPoints: customer.membershipPoints })));
    }
    if (path.startsWith('customers/') && req.method === 'PATCH') {
      const id = path.split('/')[1];
      const body = await readJsonBody<any>(req);
      const customer = await prisma.user.update({ where: { id }, data: { ...(body.name !== undefined ? { name: String(body.name) } : {}), ...(body.phone !== undefined ? { phone: textOrNull(body.phone) } : {}), ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}) } });
      await createAuditLog(user, body.isActive === false ? 'ADMIN_BAN_CUSTOMER' : 'ADMIN_UPDATE_CUSTOMER', 'User', id);
      return ok(res, customer, 'Đã cập nhật khách hàng');
    }
    if (path === 'settings' && req.method === 'GET') {
      const shop = await ensureShopProfile();
      return ok(res, { storeName: shop.name, contactEmail: 'hotro@haituiminh.com', hotline: '0931.454.176', address: '82/1E ấp Xuân Thới Đông 3, xã Xuân Thới Đông, Hóc Môn, TP.HCM', description: shop.description || '' });
    }
    if (path === 'settings' && req.method === 'PATCH') {
      const body = await readJsonBody<any>(req);
      const shop = await prisma.shopProfile.upsert({ where: { id: MAIN_SHOP_ID }, update: { name: String(body.storeName), description: String(body.description || '') }, create: { id: MAIN_SHOP_ID, slug: 'hai-tui-minh', name: String(body.storeName), description: String(body.description || '') } });
      await createAuditLog(user, 'ADMIN_UPDATE_SETTINGS', 'ShopProfile', MAIN_SHOP_ID);
      return ok(res, { storeName: shop.name, contactEmail: body.contactEmail, hotline: body.hotline, address: body.address, description: shop.description }, 'Đã cập nhật cài đặt');
    }
    if (path === 'categories' && req.method === 'GET') return ok(res, await getSellableCategories(prisma));
    if (path === 'categories' || path.startsWith('categories/')) return handleCrud(req, res, path, 'category', { entity: 'Category', user, list: { deletedAt: null, slug: { in: ['cong-nghe', 'gia-dung', 'my-pham'] } }, create: (body) => ({ name: String(body.name), slug: String(body.slug || slugify(String(body.name))), description: textOrNull(body.description), image: textOrNull(body.image), isActive: body.isActive !== false }), update: (body) => ({ ...body, description: textOrNull(body.description), image: textOrNull(body.image) }) });
    if (path === 'suppliers' || path.startsWith('suppliers/')) return handleCrud(req, res, path, 'supplier', { entity: 'Supplier', user, create: (body) => ({ name: String(body.name), code: textOrNull(body.code), phone: textOrNull(body.phone), email: textOrNull(body.email), address: textOrNull(body.address), note: textOrNull(body.note), isActive: body.isActive !== false }), update: (body) => ({ ...body, code: textOrNull(body.code), phone: textOrNull(body.phone), email: textOrNull(body.email), address: textOrNull(body.address), note: textOrNull(body.note) }) });
    if (path === 'vouchers' || path.startsWith('vouchers/')) return handleCrud(req, res, path, 'voucher', { entity: 'Voucher', user, create: (body) => ({ code: String(body.code).toUpperCase(), title: String(body.title), description: textOrNull(body.description), type: String(body.type || 'FIXED'), value: numberOr(body.value), minOrderValue: numberOr(body.minOrderValue), maxDiscount: body.maxDiscount == null ? null : numberOr(body.maxDiscount), usageLimit: body.usageLimit == null ? null : intOr(body.usageLimit), startsAt: parseDate(body.startsAt), endsAt: parseDate(body.endsAt), isActive: body.isActive !== false, shopId: MAIN_SHOP_ID }), update: (body) => ({ ...body, startsAt: body.startsAt === undefined ? undefined : parseDate(body.startsAt), endsAt: body.endsAt === undefined ? undefined : parseDate(body.endsAt) }) });
    if (path === 'marketing/images/generate') return handleMarketingImageGenerate(req, res, user);
    if (path === 'marketing/campaigns' || path.startsWith('marketing/campaigns/')) return handleCrud(req, res, path, 'marketingCampaign', { entity: 'MarketingCampaign', user, create: async (body) => ({ name: String(body.name), slug: await createUniqueMarketingCampaignSlug(String(body.slug || body.name || 'chien-dich')), type: String(body.type || 'PROMOTION'), description: textOrNull(body.description), bannerImage: textOrNull(body.bannerImage), productIds: body.productIds || [], startsAt: parseDate(body.startsAt), endsAt: parseDate(body.endsAt), isActive: body.isActive !== false }), update: (body) => ({ ...body, startsAt: body.startsAt === undefined ? undefined : parseDate(body.startsAt), endsAt: body.endsAt === undefined ? undefined : parseDate(body.endsAt) }) });
    if (path === 'inventory/receipts' || path.startsWith('inventory/receipts/')) return handleReceipts(req, res, user, path);
    if (path === 'notifications') {
      const notifications = await prisma.appNotification.findMany({ where: { userId: user.id, scope: 'ADMIN', type: { in: ['ORDER', 'STOCK', 'VOUCHER', 'CUSTOMER', 'PROMOTION', 'WARNING', 'SUCCESS'] } }, orderBy: { createdAt: 'desc' }, take: 50 });
      return ok(res, { items: notifications, unreadCount: notifications.filter((item) => !item.isRead).length });
    }
    if (path.startsWith('notifications/') && path.endsWith('/read') && req.method === 'PATCH') {
      const id = path.split('/')[1];
      const notification = await prisma.appNotification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
      return ok(res, notification, 'Đã đánh dấu đã đọc');
    }
    if (path === 'notifications/read-all' && req.method === 'POST') {
      const result = await prisma.appNotification.updateMany({ where: { userId: user.id, scope: 'ADMIN', isRead: false }, data: { isRead: true, readAt: new Date() } });
      return ok(res, { count: result.count }, 'Đã đánh dấu toàn bộ thông báo');
    }
    if (path === 'support/conversations') {
      const conversations = await prisma.supportConversation.findMany({ where: { channel: 'HUMAN' }, include: { user: true, messages: { orderBy: { createdAt: 'asc' } } }, orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }] });
      return ok(res, conversations.map((conversation) => serializeConversation(conversation)));
    }
    if (path.startsWith('support/conversations/') && path.endsWith('/messages') && req.method === 'POST') {
      const id = path.split('/')[2];
      const body = await readJsonBody<any>(req);
      const message = await prisma.supportMessage.create({ data: { conversationId: id, userId: user.id, sender: 'ADMIN', content: String(body.message || '') } });
      await prisma.supportConversation.update({ where: { id }, data: { assignedAdminId: user.id, lastMessageAt: new Date(), lastReadByAdminAt: new Date(), status: 'OPEN' } });
      return ok(res, { id: message.id }, 'Đã gửi tin nhắn');
    }
    if (path.startsWith('support/conversations/')) {
      const id = path.split('/')[2];
      const conversation = await prisma.supportConversation.findUnique({ where: { id }, include: { user: true, messages: { orderBy: { createdAt: 'asc' } } } });
      if (!conversation) return fail(res, 'Không tìm thấy hội thoại', 404);
      await prisma.supportConversation.update({ where: { id }, data: { lastReadByAdminAt: new Date() } }).catch(() => null);
      return ok(res, serializeConversation(conversation, true));
    }

    return fail(res, 'Không tìm thấy API quản trị', 404);
  } catch (error) {
    console.error('Admin API error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return fail(res, 'Dữ liệu đã tồn tại, vui lòng kiểm tra lại mã/tên/slug.', 409);
    if (error instanceof Error) {
      const status = error.message.includes('Chưa cấu hình công cụ tạo ảnh thật') ? 503 : 500;
      return fail(res, error.message, status);
    }
    return fail(res, 'Không thể xử lý yêu cầu quản trị', 500);
  }
}

