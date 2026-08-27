import type { IncomingMessage, ServerResponse } from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, hasJwtSecret, readJsonBody, sendJson } from '../_shared/auth.js';
import { fetchCarrierTracking, isCarrierCode } from '../_shared/carrier-tracking.js';
import { getStoreEmailFrom, sendOrderConfirmationEmail } from '../_shared/email.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';

const ok = (res: ServerResponse, data: unknown, message = 'OK', status = 200) =>
  sendJson(res, status, { success: true, data, message });

const fail = (res: ServerResponse, error: string, status = 400) => sendJson(res, status, { success: false, error });

const parsePath = (req: IncomingMessage) => {
  const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
  const rewritten = url.searchParams.get('...path') || url.searchParams.get('path');
  return (rewritten || url.pathname.replace(/^\/api\/orders\/?/, '')).replace(/\/$/, '');
};

const normalizePhone = (value?: string | null) => String(value || '').replace(/\D/g, '');
const uniqueStrings = (values: Array<string | null | undefined>) => Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));

const numberOr = (value: unknown, fallback = 0) => (value === null || value === undefined || value === '' ? fallback : Number.isFinite(Number(value)) ? Number(value) : fallback);
const intOr = (value: unknown, fallback = 0) => Math.trunc(numberOr(value, fallback));
const textOrNull = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const normalizeMoney = (value: number) => Math.round(value);

const shippingFeeByMethod: Record<string, number> = {
  STANDARD: 20000,
  FAST: 35000,
  EXPRESS: 55000,
};

const providerByMethod: Record<string, string> = {
  STANDARD: 'GHN',
  FAST: 'GHTK',
  EXPRESS: 'VIETTEL_POST',
};

const carrierPublicTrackingUrl = (carrier?: string | null, trackingCode?: string | null) => {
  if (!carrier || !trackingCode) return null;
  const encoded = encodeURIComponent(trackingCode);
  if (carrier === 'SPX') return `https://spx.vn/m/order/tracking?tracking_number=${encoded}`;
  if (carrier === 'GHN') return `https://donhang.ghn.vn/?order_code=${encoded}`;
  if (carrier === 'GHTK') return `https://i.ghtk.vn/${encoded}`;
  if (carrier === 'VIETTEL_POST') return `https://viettelpost.vn/tra-cuu-hanh-trinh-don/?code=${encoded}`;
  return null;
};

const carrierDisplayName = (carrier?: string | null) => {
  if (carrier === 'SPX') return 'SPX Express';
  if (carrier === 'GHN') return 'Giao Hàng Nhanh';
  if (carrier === 'GHTK') return 'Giao Hàng Tiết Kiệm';
  if (carrier === 'VIETTEL_POST') return 'Viettel Post';
  return 'Đơn vị vận chuyển';
};

const methodDays: Record<string, number> = {
  STANDARD: 7,
  FAST: 5,
  EXPRESS: 2,
};

const FREE_SHIPPING_MEMBER_MIN = 500_000;
const TEST_CHECKOUT_SLUG = 'test';
const birthdayDiscountByTier = [5, 8, 12, 15];

const isTestCheckoutOnly = (items: Array<{ product: { slug?: string | null } }>) =>
  items.length === 1 && String(items[0]?.product?.slug || '').trim().toLowerCase() === TEST_CHECKOUT_SLUG;

const calculateVoucherDiscount = (voucher: any, subtotal: number) => {
  if (!voucher) return 0;
  const rawDiscount = voucher.type === 'PERCENT' ? Math.round((subtotal * numberOr(voucher.value)) / 100) : numberOr(voucher.value);
  const cappedDiscount = voucher.maxDiscount ? Math.min(rawDiscount, numberOr(voucher.maxDiscount)) : rawDiscount;
  return Math.max(0, Math.min(subtotal, cappedDiscount));
};

const findApplicableVoucher = async (client: any, code: string, subtotal: number, productIds: string[]) => {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) return { voucher: null, discount: 0, error: null };

  const now = new Date();
  const voucher = await client.voucher.findUnique({
    where: { code: normalizedCode },
    include: { products: { select: { productId: true } } },
  });

  if (!voucher || !voucher.isActive) return { voucher: null, discount: 0, error: 'Voucher không tồn tại hoặc đã tạm ngưng' };
  if (voucher.startsAt && voucher.startsAt > now) return { voucher: null, discount: 0, error: 'Voucher chưa đến thời gian sử dụng' };
  if (voucher.endsAt && voucher.endsAt < now) return { voucher: null, discount: 0, error: 'Voucher đã hết hạn' };
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) return { voucher: null, discount: 0, error: 'Voucher đã hết lượt sử dụng' };
  if (subtotal < numberOr(voucher.minOrderValue)) return { voucher: null, discount: 0, error: 'Đơn hàng chưa đạt giá trị tối thiểu của voucher' };

  const scopedProductIds = voucher.products.map((item: any) => item.productId);
  if (scopedProductIds.length && !productIds.some((id) => scopedProductIds.includes(id))) {
    return { voucher: null, discount: 0, error: 'Voucher không áp dụng cho sản phẩm trong giỏ hàng' };
  }

  return { voucher, discount: calculateVoucherDiscount(voucher, subtotal), error: null };
};

const getBirthdayDiscountPercent = (points = 0) => {
  if (points >= 500) return birthdayDiscountByTier[3];
  if (points >= 200) return birthdayDiscountByTier[2];
  if (points >= 50) return birthdayDiscountByTier[1];
  return birthdayDiscountByTier[0];
};

const isBirthdayMonth = (birthDate?: Date | string | null) => {
  if (!birthDate) return false;
  const parsed = new Date(birthDate);
  if (!Number.isFinite(parsed.getTime())) return false;
  return parsed.getMonth() === new Date().getMonth();
};

const createOrderNumber = () => `HTM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

type AuthUser = { id: string; email: string; role: string };

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

const optionalUser = async (req: IncomingMessage) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
  return userFromToken(token);
};

const requireUser = async (req: IncomingMessage, res: ServerResponse) => {
  const user = await optionalUser(req);
  if (!user) fail(res, 'Bạn cần đăng nhập để xem đơn hàng', 401);
  return user;
};

const committedOrderStatuses = new Set(['PROCESSING', 'SHIPPED', 'DELIVERED', 'PACKING', 'SHIPPING', 'DELIVERING']);
const inventoryReservedOrderStatuses = new Set(['PENDING', ...committedOrderStatuses]);
const shouldRestoreInventory = (status: string) => inventoryReservedOrderStatuses.has(status);

const commitOrderItems = async (tx: any, items: Array<{ product: { id: string; name: string; stock: number }; quantity: number }>) => {
  for (const item of items) {
    const latest = await tx.product.findUnique({ where: { id: item.product.id }, select: { id: true, name: true, stock: true } });
    if (!latest) throw new Error('Có sản phẩm không hợp lệ trong đơn hàng');
    if (latest.stock < item.quantity) throw new Error(`Sản phẩm ${latest.name} chỉ còn ${latest.stock} trong kho`);
    await tx.product.update({
      where: { id: item.product.id },
      data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
    });
  }
};

const restoreOrderItems = async (tx: any, order: { items: Array<{ productId: string; quantity: number }> }) => {
  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
    });
  }
};

const stringFromPath = (input: Record<string, unknown>, paths: string[][]) => {
  for (const path of paths) {
    let value: unknown = input;
    for (const key of path) {
      value = typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined;
    }
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
};

const numberFromPath = (input: Record<string, unknown>, paths: string[][]) => {
  for (const path of paths) {
    let value: unknown = input;
    for (const key of path) {
      value = typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined;
    }
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value.replace(/[^\d.-]/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
};

const extractBankTransfer = (body: Record<string, unknown>) => ({
  amount: numberFromPath(body, [
    ['amount'],
    ['transferAmount'],
    ['transfer_amount'],
    ['creditAmount'],
    ['credit_amount'],
    ['amountIn'],
    ['amount_in'],
    ['data', 'amount'],
    ['data', 'transferAmount'],
    ['transaction', 'amount'],
  ]),
  content: stringFromPath(body, [
    ['content'],
    ['description'],
    ['memo'],
    ['note'],
    ['transferContent'],
    ['transactionContent'],
    ['addInfo'],
    ['data', 'content'],
    ['data', 'description'],
    ['transaction', 'content'],
    ['transaction', 'description'],
  ]),
  orderNumber: stringFromPath(body, [
    ['orderNumber'],
    ['order_number'],
    ['orderCode'],
    ['order_code'],
    ['data', 'orderNumber'],
    ['transaction', 'orderNumber'],
  ]),
  transactionId: stringFromPath(body, [
    ['transactionId'],
    ['transaction_id'],
    ['referenceCode'],
    ['reference_code'],
    ['id'],
    ['data', 'id'],
    ['transaction', 'id'],
  ]),
});

const webhookSecretFromRequest = (req: IncomingMessage) => {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice('Bearer '.length).trim();
  return String(req.headers['x-payment-webhook-secret'] || req.headers['x-webhook-secret'] || '');
};

const verifyPaymentWebhook = (req: IncomingMessage) => {
  const expected = process.env.PAYMENT_WEBHOOK_SECRET || '';
  if (!expected) return process.env.NODE_ENV !== 'production';
  return webhookSecretFromRequest(req) === expected;
};

const parseShippingAddress = (raw: string) => {
  try {
    const parsed = JSON.parse(raw || '{}');
    return {
      fullName: parsed.fullName || parsed.name || parsed.receiverName || 'Khách hàng',
      email: parsed.email || '',
      phone: parsed.phone || '',
      address: parsed.address || parsed.detail || parsed.street || raw,
      note: parsed.note || '',
      city: parsed.city || parsed.province || '',
    };
  } catch {
    return { fullName: 'Khách hàng', email: '', phone: '', address: raw, note: '', city: '' };
  }
};

const parseShippingJson = (raw: string) => {
  try {
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const reverseGeocode = async (lat: number, lng: number) => {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEOCODING_API_KEY;

  if (googleKey) {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('language', 'vi');
    url.searchParams.set('region', 'vn');
    url.searchParams.set('key', googleKey);
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const payload = await response.json().catch(() => null);
    const address = payload?.results?.[0]?.formatted_address;
    if (response.ok && typeof address === 'string' && address.trim()) {
      return { address: address.trim(), provider: 'GOOGLE', mapUrl: `https://www.google.com/maps?q=${lat},${lng}` };
    }
  }

  return { address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, provider: 'COORDINATES', mapUrl: `https://www.google.com/maps?q=${lat},${lng}` };
};

const getUserOrderMatchers = async (user: { id: string; email: string; phone: string | null }) => {
  const normalizedPhone = normalizePhone(user.phone);
  const relatedUserWhere: any[] = [{ id: user.id }, { email: user.email }];

  if (user.phone) relatedUserWhere.push({ phone: user.phone });
  if (normalizedPhone.length >= 6) relatedUserWhere.push({ phone: { contains: normalizedPhone } });

  const relatedUsers = await prisma.user.findMany({
    where: { OR: relatedUserWhere },
    select: { id: true, email: true, phone: true },
  });

  return {
    relatedUserIds: uniqueStrings(relatedUsers.map((item) => item.id)),
    relatedTerms: uniqueStrings([
      user.email,
      user.phone,
      normalizedPhone,
      ...relatedUsers.flatMap((item) => [item.email, item.phone, normalizePhone(item.phone)]),
    ]),
  };
};

const shouldUseDemoOrderFallback = (user: { email: string }) => user.email.toLowerCase() === 'user@haituiminh.com';

const ensureCustomer = async (shippingInfo: any) => {
  const email = textOrNull(shippingInfo.email) || `guest-${String(shippingInfo.phone || Date.now()).replace(/\D/g, '') || Date.now()}@haituiminh.local`;
  const name = textOrNull(shippingInfo.fullName) || 'Khách hàng';
  const phone = textOrNull(shippingInfo.phone);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { name: existing.name || name, phone: existing.phone || phone, isActive: true, deletedAt: null },
    });
  }

  const password = await bcrypt.hash(`guest-${Date.now()}-${Math.random()}`, 10);
  return prisma.user.create({
    data: { email, password, name, phone, role: 'CUSTOMER', isActive: true },
  });
};

const serializeOrder = (order: any) => {
  const shippingInfo = parseShippingAddress(order.shippingAddress || '{}');
  const shippingJson = parseShippingJson(order.shippingAddress || '{}');
  const checkoutMeta = shippingJson._checkout || {};
  const shippingFee = numberOr(checkoutMeta.shippingFee, shippingFeeByMethod[order.shippingMethod] || 0);
  const paymentMethod = checkoutMeta.paymentMethod || order.paymentMethod || 'BANK_TRANSFER';

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    items: order.items || [],
    totalAmount: order.totalAmount,
    shippingInfo,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod,
    shippingMethodId: order.shippingMethod,
    shippingFee,
    checkoutMeta,
    estimatedArrival: new Date(new Date(order.createdAt).getTime() + (methodDays[order.shippingMethod] || 7) * 86400000).toISOString(),
    trackingId: order.orderNumber,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

const createCheckoutOrder = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return fail(res, 'Phương thức không được hỗ trợ', 405);

  const body = await readJsonBody<any>(req);
  const items: any[] = Array.isArray(body.items) ? body.items : [];
  const shippingInfo = body.shippingInfo || {};
  const shippingMethod = String(body.shippingMethodId || body.shippingMethod || 'STANDARD').toUpperCase();
  const paymentMethod = String(body.paymentMethod || 'BANK_TRANSFER').toUpperCase();
  const voucherCode = textOrNull(body.voucherCode)?.toUpperCase() || '';

  if (!items.length) return fail(res, 'Giỏ hàng trống', 400);
  if (!textOrNull(shippingInfo.fullName) || !textOrNull(shippingInfo.phone) || !textOrNull(shippingInfo.address)) {
    return fail(res, 'Vui lòng nhập đầy đủ tên, số điện thoại và địa chỉ giao hàng', 400);
  }

  const requestedByProduct = new Map<string, number>();
  for (const item of items) {
    const productId = String(item.id || item.productId || '');
    if (!productId) continue;
    requestedByProduct.set(productId, (requestedByProduct.get(productId) || 0) + Math.max(1, intOr(item.quantity, 1)));
  }

  const ids = [...requestedByProduct.keys()];
  if (!ids.length) return fail(res, 'Giỏ hàng không có sản phẩm hợp lệ', 400);

  const products = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true, deletedAt: null }, include: { category: true } });
  const productMap = new Map<string, any>(products.map((product: any) => [product.id, product]));

  const normalizedItems = ids.map((productId) => {
    const product = productMap.get(productId);
    const quantity = requestedByProduct.get(productId) || 0;
    if (!product) throw new Error('Có sản phẩm không hợp lệ trong giỏ hàng');
    if (quantity <= 0) throw new Error('Số lượng sản phẩm không hợp lệ');
    if (product.stock < quantity) throw new Error(`Sản phẩm ${product.name} chỉ còn ${product.stock} trong kho`);
    const price = product.promotionalPrice || product.price;
    return { product, quantity, price };
  });

  const baseShippingFee = shippingFeeByMethod[shippingMethod] ?? shippingFeeByMethod.STANDARD;
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const testCheckoutOnly = isTestCheckoutOnly(normalizedItems);
  const authUser = await optionalUser(req);
  const customer = authUser
    ? await prisma.user.update({
        where: { id: authUser.id },
        data: {
          name: textOrNull(shippingInfo.fullName) || undefined,
          phone: textOrNull(shippingInfo.phone) || undefined,
          isActive: true,
          deletedAt: null,
        },
      })
    : await ensureCustomer(shippingInfo);
  const birthdayDiscountPercent = !testCheckoutOnly && isBirthdayMonth(customer.birthDate) ? getBirthdayDiscountPercent(numberOr(customer.membershipPoints, 0)) : 0;
  const membershipDiscount = Math.round((subtotal * birthdayDiscountPercent) / 100);
  const voucherResult = testCheckoutOnly
    ? { voucher: null, discount: 0, error: null }
    : await findApplicableVoucher(prisma, voucherCode, Math.max(0, subtotal - membershipDiscount), ids);
  if (voucherResult.error) return fail(res, voucherResult.error, 400);
  const voucherDiscount = voucherResult.discount;
  const shippingFee = testCheckoutOnly ? 0 : subtotal >= FREE_SHIPPING_MEMBER_MIN ? 0 : baseShippingFee;
  const totalAmount = Math.max(0, subtotal - membershipDiscount - voucherDiscount) + shippingFee;
  const checkoutMeta = {
    subtotal,
    shippingFee,
    baseShippingFee,
    testCheckoutOnly,
    membershipDiscount,
    voucherCode: voucherResult.voucher?.code || null,
    voucherDiscount,
    birthdayDiscountPercent,
    freeShippingApplied: shippingFee === 0 && baseShippingFee > 0,
    paymentMethod,
  };
  const orderNumber = createOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: customer.id,
        orderNumber,
        totalAmount,
        voucherId: voucherResult.voucher?.id || null,
        shippingAddress: JSON.stringify({ ...shippingInfo, _checkout: checkoutMeta }),
        shippingMethod,
        status: paymentMethod === 'COD' ? 'PROCESSING' : 'PENDING',
        paymentStatus: 'UNPAID',
        items: {
          create: normalizedItems.map(({ product, quantity, price }) => ({
            productId: product.id,
            name: product.name,
            quantity,
            price,
            image: product.images[0] || '/favicon.svg',
          })),
        },
      },
      include: { items: true },
    });

    await commitOrderItems(tx, normalizedItems);
    if (voucherResult.voucher) {
      await tx.voucher.update({
        where: { id: voucherResult.voucher.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    await tx.appNotification.create({
      data: {
        userId: customer.id,
        scope: 'USER',
        type: 'ORDER',
        title: 'Đã ghi nhận đơn hàng',
        message: `Đơn ${orderNumber} đã được tạo. Bạn có thể theo dõi trạng thái trong lịch sử đơn hàng.`,
        link: `/tracking?code=${encodeURIComponent(orderNumber)}`,
        metadata: { orderId: created.id, orderNumber, emailFrom: getStoreEmailFrom() },
      },
    });

    return created;
  });

  sendOrderConfirmationEmail({ order, shippingInfo, paymentMethod, checkoutMeta }).catch((error) => {
    console.error('Order confirmation email error:', error);
  });

  return ok(res, { ...serializeOrder(order), paymentMethod }, 'Đã tạo đơn hàng', 201);
};

const validateCheckoutVoucher = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);

  const body = await readJsonBody<any>(req);
  const code = textOrNull(body.code || body.voucherCode)?.toUpperCase() || '';
  const items: any[] = Array.isArray(body.items) ? body.items : [];
  if (!code) return fail(res, 'Vui lòng nhập mã voucher', 400);
  if (!items.length) return fail(res, 'Giỏ hàng trống', 400);

  const requestedByProduct = new Map<string, number>();
  for (const item of items) {
    const productId = String(item.id || item.productId || '');
    if (!productId) continue;
    requestedByProduct.set(productId, (requestedByProduct.get(productId) || 0) + Math.max(1, intOr(item.quantity, 1)));
  }

  const ids = [...requestedByProduct.keys()];
  const products = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true, deletedAt: null } });
  const productMap = new Map<string, any>(products.map((product: any) => [product.id, product]));
  const subtotal = ids.reduce((sum, productId) => {
    const product = productMap.get(productId);
    const quantity = requestedByProduct.get(productId) || 0;
    return product ? sum + (product.promotionalPrice || product.price) * quantity : sum;
  }, 0);

  const voucherResult = await findApplicableVoucher(prisma, code, subtotal, ids);
  if (voucherResult.error) return fail(res, voucherResult.error, 400);

  return ok(res, {
    code: voucherResult.voucher.code,
    title: voucherResult.voucher.title,
    type: voucherResult.voucher.type,
    value: voucherResult.voucher.value,
    discount: voucherResult.discount,
    subtotal,
  }, 'Đã áp dụng voucher');
};

const listUserOrders = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'GET') return fail(res, 'Method not allowed', 405);
  const authUser = await requireUser(req, res);
  if (!authUser) return;

  const user = await prisma.user.findUnique({ where: { id: authUser.id }, select: { id: true, email: true, phone: true } });
  if (!user) return fail(res, 'Không tìm thấy tài khoản', 404);

  const { relatedUserIds, relatedTerms } = await getUserOrderMatchers(user);
  const orders = await prisma.order.findMany({
    where: { OR: [{ userId: { in: relatedUserIds } }, ...relatedTerms.map((value) => ({ shippingAddress: { contains: value } }))] },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!orders.length && shouldUseDemoOrderFallback(user)) {
    const demoOrders = await prisma.order.findMany({
      where: { user: { role: 'CUSTOMER', deletedAt: null } },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok(res, demoOrders.map(serializeOrder));
  }

  const uniqueOrders = Array.from(new Map(orders.map((order) => [order.id, order])).values());
  return ok(res, uniqueOrders.map(serializeOrder));
};

const getUserOrder = async (req: IncomingMessage, res: ServerResponse, code: string) => {
  if (req.method !== 'GET') return fail(res, 'Method not allowed', 405);
  const authUser = await requireUser(req, res);
  if (!authUser) return;

  const user = await prisma.user.findUnique({ where: { id: authUser.id }, select: { id: true, email: true, phone: true } });
  if (!user) return fail(res, 'Không tìm thấy tài khoản', 404);
  const { relatedUserIds, relatedTerms } = await getUserOrderMatchers(user);

  const order = await prisma.order.findFirst({
    where: {
      AND: [
        { OR: [{ id: code }, { orderNumber: code }] },
        { OR: [{ userId: { in: relatedUserIds } }, ...relatedTerms.map((value) => ({ shippingAddress: { contains: value } }))] },
      ],
    },
    include: { items: true },
  });

  if (!order && shouldUseDemoOrderFallback(user)) {
    const demoOrder = await prisma.order.findFirst({
      where: { AND: [{ OR: [{ id: code }, { orderNumber: code }] }, { user: { role: 'CUSTOMER', deletedAt: null } }] },
      include: { items: true },
    });
    if (demoOrder) return ok(res, serializeOrder(demoOrder));
  }

  if (!order) return fail(res, 'Không tìm thấy đơn hàng', 404);
  return ok(res, serializeOrder(order));
};

const expireCheckoutOrder = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);

  const body = await readJsonBody<any>(req);
  const code = textOrNull(body.orderId) || textOrNull(body.orderNumber) || textOrNull(body.trackingId);
  if (!code) return fail(res, 'Missing order code', 400);

  const order = await prisma.order.findFirst({
    where: { OR: [{ id: code }, { orderNumber: code }] },
    include: { items: { include: { product: { include: { category: true } } } } },
  });

  if (!order) return fail(res, 'Order not found', 404);
  if (order.paymentStatus === 'PAID') return fail(res, 'Order is already paid', 409);

  const restoredItems = order.items.map((item) => ({
    ...item.product,
    image: item.image || item.product.images?.[0] || '/favicon.svg',
    images: item.product.images?.length ? item.product.images : [item.image || '/favicon.svg'],
    category: item.product.category,
    quantity: item.quantity,
    price: item.price,
  }));

  if (order.status === 'CANCELLED' || order.status === 'FAILED' || order.paymentStatus === 'FAILED') {
    return ok(res, { order: serializeOrder(order), restoredItems }, 'Order already expired');
  }

  const expired = await prisma.$transaction(async (tx) => {
    if (shouldRestoreInventory(order.status)) {
      await restoreOrderItems(tx, order);
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
      include: { items: true },
    });
  });

  return ok(res, { order: serializeOrder(expired), restoredItems }, 'Order cancelled and cart restored');
};

const confirmBankTransferWebhook = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);
  if (!verifyPaymentWebhook(req)) return fail(res, 'Invalid payment webhook secret', 401);

  const body = await readJsonBody<Record<string, unknown>>(req);
  const transfer = extractBankTransfer(body || {});

  if (!transfer.orderNumber && !transfer.content) return fail(res, 'Missing transfer content or order number', 400);
  if (!Number.isFinite(transfer.amount) || transfer.amount <= 0) return fail(res, 'Invalid transfer amount', 400);

  const result = await prisma.$transaction(async (tx) => {
    const candidates = await tx.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: { in: ['UNPAID', 'PENDING'] },
        ...(transfer.orderNumber ? { orderNumber: transfer.orderNumber } : { orderNumber: { not: '' } }),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: transfer.orderNumber ? 1 : 50,
    });

    const normalizedContent = transfer.content.toUpperCase();
    const matchedOrder = candidates.find((order: any) =>
      transfer.orderNumber ? order.orderNumber === transfer.orderNumber : normalizedContent.includes(order.orderNumber.toUpperCase())
    );

    if (!matchedOrder) return { status: 'NOT_MATCHED' as const };
    if (normalizeMoney(transfer.amount) < normalizeMoney(matchedOrder.totalAmount)) {
      return { status: 'AMOUNT_TOO_LOW' as const };
    }

    const order = await tx.order.update({
      where: { id: matchedOrder.id },
      data: { status: 'PROCESSING', paymentStatus: 'PAID' },
      include: { items: true },
    });

    return { status: 'CONFIRMED' as const, order };
  });

  if (result.status === 'NOT_MATCHED') return ok(res, { matched: false }, 'No pending order matched this transfer');
  if (result.status === 'AMOUNT_TOO_LOW') return fail(res, 'Transfer amount is lower than order total', 409);

  return ok(
    res,
    { matched: true, order: serializeOrder(result.order), transactionId: transfer.transactionId },
    'Bank transfer payment confirmed'
  );
};

const orderStage = (order: any) => {
  if (order.status === 'CANCELLED') return 'DELIVERY_FAILED';
  if (order.status === 'DELIVERED') return 'DELIVERED';
  if (['SHIPPED', 'SHIPPING', 'DELIVERING'].includes(order.status)) return 'OUT_FOR_DELIVERY';
  if (['PROCESSING', 'PACKING'].includes(order.status)) return 'PICKED_UP';
  return 'PENDING_PICKUP';
};

const buildTracking = async (order: any) => {
  const serialized = serializeOrder(order);
  const currentStatus = orderStage(order);
  const shippingJson = parseShippingJson(order.shippingAddress);
  const destinationName = [serialized.shippingInfo.fullName, serialized.shippingInfo.address, serialized.shippingInfo.city]
    .filter(Boolean)
    .join(' - ');
  const origin = { lat: null, lng: null, name: 'Kho Hai Tụi Mình', type: 'ORIGIN' };
  const destination = { lat: null, lng: null, name: destinationName || 'Địa chỉ nhận hàng', type: 'DESTINATION' };
  const savedTracking = shippingJson.deliveryTracking && typeof shippingJson.deliveryTracking === 'object' ? shippingJson.deliveryTracking : {};
  const savedEvents = Array.isArray(savedTracking.events) ? savedTracking.events : [];
  const trackingMode = savedTracking.mode === 'CARRIER' ? 'CARRIER' : 'SELF';
  const configuredCarrier = isCarrierCode(savedTracking.carrier) ? savedTracking.carrier : providerByMethod[order.shippingMethod];
  const carrierTrackingCode = textOrNull(savedTracking.carrierTrackingCode);
  const carrierResult = trackingMode === 'CARRIER' && configuredCarrier && carrierTrackingCode
    ? await fetchCarrierTracking(configuredCarrier, carrierTrackingCode)
    : null;

  const baseEvents = [{
    id: `${order.id}-created`,
    status: 'PENDING_PICKUP',
    location: origin,
    timestamp: new Date(order.createdAt).toISOString(),
    description: order.paymentStatus === 'PAID'
      ? 'Đơn hàng đã được ghi nhận và đã xác nhận thanh toán.'
      : 'Đơn hàng đã được ghi nhận trong hệ thống.',
    isCompleted: true,
    isSystemEvent: true,
  }];

  const manualEvents = savedEvents.map((event: any, index: number) => ({
    id: event.id || `${order.id}-manual-${index}`,
    status: event.status === 'DELIVERED' ? 'DELIVERED' : 'OUT_FOR_DELIVERY',
    location: {
      lat: Number.isFinite(Number(event.lat)) ? Number(event.lat) : null,
      lng: Number.isFinite(Number(event.lng)) ? Number(event.lng) : null,
      name: event.address || event.note || 'Người giao vừa cập nhật hành trình',
      type: event.status === 'DELIVERED' ? 'DESTINATION' : 'COURIER',
    },
    timestamp: event.timestamp || new Date().toISOString(),
    description: event.status === 'DELIVERED'
      ? 'Người giao đã hoàn thành đơn hàng và gửi ảnh minh chứng.'
      : `Người giao cập nhật hành trình: ${event.address || event.note || 'đang trên đường giao'}`,
    isCompleted: true,
    isManualEvent: true,
    proofImage: event.proofImage || null,
  }));

  const carrierEvents = (carrierResult?.events || []).map((event, index) => ({
    id: event.id || `${order.id}-carrier-${index}`,
    status: currentStatus === 'DELIVERED' ? 'DELIVERED' : currentStatus === 'PENDING_PICKUP' ? 'PICKED_UP' : 'OUT_FOR_DELIVERY',
    location: {
      lat: null,
      lng: null,
      name: event.locationName || event.description || 'Đơn vị vận chuyển vừa cập nhật hành trình',
      type: 'CARRIER',
    },
    timestamp: event.timestamp || carrierResult?.lastSyncAt || new Date().toISOString(),
    description: event.description,
    isCompleted: true,
    isCarrierEvent: true,
    carrier: carrierResult ? { code: carrierResult.carrier, trackingCode: carrierResult.trackingCode, publicTrackingUrl: carrierPublicTrackingUrl(carrierResult.carrier, carrierResult.trackingCode) } : null,
  }));

  if (trackingMode === 'CARRIER' && carrierTrackingCode && !carrierEvents.length) {
    const publicTrackingUrl = carrierPublicTrackingUrl(configuredCarrier, carrierTrackingCode);
    const hasMissingConfig = carrierResult?.error?.startsWith('Thiếu ');
    const carrierName = carrierDisplayName(configuredCarrier);
    carrierEvents.push({
      id: `${order.id}-carrier-pending`,
      status: currentStatus === 'PENDING_PICKUP' ? 'PENDING_PICKUP' : 'OUT_FOR_DELIVERY',
      location: { lat: null, lng: null, name: `Mã vận đơn ${carrierTrackingCode}`, type: 'CARRIER' },
      timestamp: savedTracking.carrierBoundAt || new Date(order.updatedAt || order.createdAt).toISOString(),
      description: hasMissingConfig
        ? `Đã lưu mã vận đơn ${carrierName}. Bấm mở trang ${carrierName} để tra cứu trực tiếp khi chưa có API đối tác.`
        : carrierResult?.error
          ? `Đã lưu mã vận đơn, chưa lấy được dữ liệu mới từ ${carrierName}. Bạn có thể mở trang tra cứu trực tiếp.`
          : `Đã lưu mã vận đơn ${carrierName}. Hệ thống sẽ lấy dữ liệu khi đơn vị vận chuyển phản hồi.`,
      isCompleted: true,
      isCarrierEvent: true,
      carrier: configuredCarrier ? { code: configuredCarrier, trackingCode: carrierTrackingCode, publicTrackingUrl } : null,
    });
  }

  const events = [...baseEvents, ...manualEvents, ...carrierEvents].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const geoEvents = events.filter((event: any) => event.location?.lat !== null && event.location?.lng !== null && Number.isFinite(Number(event.location?.lat)) && Number.isFinite(Number(event.location?.lng)));
  const currentGeoLocation = [...geoEvents].reverse()[0]?.location || null;

  return {
    trackingId: order.orderNumber,
    orderId: order.id,
    order: serialized,
    provider: configuredCarrier || 'SELF',
    trackingMode,
    status: currentStatus,
    estimatedArrival: serialized.estimatedArrival,
    events,
    currentLocation: currentGeoLocation || [...events].reverse()[0]?.location || origin,
    origin,
    destination,
    progress: events.length > 1 ? Math.min(1, (events.length - 1) / Math.max(1, events.length + (currentStatus === 'DELIVERED' ? 0 : 1))) : 0,
    hasLiveLocation: Boolean(currentGeoLocation),
    source: carrierResult ? 'CARRIER_API_ON_DEMAND' : 'ORDER_DATABASE',
    carrier: {
      mode: trackingMode,
      code: configuredCarrier || null,
      trackingCode: carrierTrackingCode,
      configured: Boolean(carrierResult?.configured),
      lastSyncAt: carrierResult?.lastSyncAt || null,
      error: carrierResult?.error?.startsWith('Thiếu ') ? null : carrierResult?.error || null,
      publicTrackingUrl: carrierPublicTrackingUrl(configuredCarrier, carrierTrackingCode),
    },
  };
};
const trackOrder = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'GET') return fail(res, 'Phương thức không được hỗ trợ', 405);
  const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
  const code = textOrNull(url.searchParams.get('code'));
  if (!code) return fail(res, 'Vui lòng nhập mã đơn hàng hoặc mã vận đơn');

  const order = await prisma.order.findFirst({
    where: { OR: [{ id: code }, { orderNumber: code }] },
    include: { items: true },
  });

  if (!order) return fail(res, 'Không tìm thấy đơn hàng', 404);
  return ok(res, await buildTracking(order));
};

const appendCheckpointLocation = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return fail(res, 'Method not allowed', 405);

  const body = await readJsonBody<any>(req);
  const code = textOrNull(body.code) || textOrNull(body.orderId) || textOrNull(body.orderNumber);
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!code) return fail(res, 'Missing order code', 400);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return fail(res, 'Invalid GPS coordinates', 400);
  }

  const order = await prisma.order.findFirst({
    where: { OR: [{ id: code }, { orderNumber: code }] },
    include: { items: true },
  });

  if (!order) return fail(res, 'Order not found', 404);

  const envelope = parseShippingJson(order.shippingAddress || '{}');
  const deliveryTracking = envelope.deliveryTracking && typeof envelope.deliveryTracking === 'object' ? envelope.deliveryTracking : {};
  const events = Array.isArray(deliveryTracking.events) ? deliveryTracking.events : [];
  const now = new Date().toISOString();
  const resolved = textOrNull(body.address)
    ? { address: textOrNull(body.address) as string, provider: 'CLIENT', mapUrl: `https://www.google.com/maps?q=${lat},${lng}` }
    : await reverseGeocode(lat, lng);
  const nextEvent = {
    id: `checkpoint-${Date.now()}`,
    status: String(body.status || '').toUpperCase() === 'DELIVERED' ? 'DELIVERED' : 'OUT_FOR_DELIVERY',
    lat,
    lng,
    address: resolved.address,
    note: textOrNull(body.note) || 'Người giao chủ động gửi checkpoint GPS',
    mapUrl: textOrNull(body.mapUrl) || resolved.mapUrl,
    geocodeProvider: resolved.provider,
    accuracy: Number.isFinite(Number(body.accuracy)) ? Number(body.accuracy) : null,
    timestamp: now,
    source: 'SHIPPER_CHECKPOINT',
  };

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: nextEvent.status === 'DELIVERED' ? 'DELIVERED' : order.status === 'PROCESSING' || order.status === 'PACKING' ? 'SHIPPED' : order.status,
      paymentStatus: nextEvent.status === 'DELIVERED' ? 'PAID' : order.paymentStatus,
      shippingAddress: JSON.stringify({
        ...envelope,
        deliveryTracking: {
          ...deliveryTracking,
          mode: 'SELF',
          checkpointLastSeenAt: now,
          events: [...events, nextEvent].slice(-120),
        },
      }),
    },
    include: { items: true },
  });

  return ok(res, { tracking: await buildTracking(updated), event: nextEvent }, 'Đã lưu checkpoint giao hàng');
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!hasDatabase) return fail(res, 'Production chưa cấu hình DATABASE_URL.', 503);

  try {
    const path = parsePath(req);
    if (!path) return listUserOrders(req, res);
    if (path === 'checkout') return createCheckoutOrder(req, res);
    if (path === 'voucher/validate') return validateCheckoutVoucher(req, res);
    if (path === 'expire' || path === 'cancel') return expireCheckoutOrder(req, res);
    if (path === 'bank-transfer/webhook') return confirmBankTransferWebhook(req, res);
    if (path === 'track') return trackOrder(req, res);
    if (path === 'live-location' || path === 'checkpoint-location') return appendCheckpointLocation(req, res);
    if (path) return getUserOrder(req, res, decodeURIComponent(path));
    return fail(res, 'Không tìm thấy API đơn hàng', 404);
  } catch (error) {
    console.error('Orders API error:', error);
    return fail(res, error instanceof Error ? error.message : 'Không thể xử lý đơn hàng', 500);
  }
}
