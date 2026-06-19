import type { IncomingMessage, ServerResponse } from 'node:http';
import bcrypt from 'bcryptjs';
import { readJsonBody, sendJson } from '../_shared/auth.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';

const ok = (res: ServerResponse, data: unknown, message = 'OK', status = 200) =>
  sendJson(res, status, { success: true, data, message });

const fail = (res: ServerResponse, error: string, status = 400) => sendJson(res, status, { success: false, error });

const parsePath = (req: IncomingMessage) => {
  const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
  const rewritten = url.searchParams.get('...path') || url.searchParams.get('path');
  return (rewritten || url.pathname.replace(/^\/api\/orders\/?/, '')).replace(/\/$/, '');
};

const numberOr = (value: unknown, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const intOr = (value: unknown, fallback = 0) => Math.trunc(numberOr(value, fallback));
const textOrNull = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

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

const methodDays: Record<string, number> = {
  STANDARD: 7,
  FAST: 5,
  EXPRESS: 2,
};

const createOrderNumber = () => `HTM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

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
  const shippingFee = shippingFeeByMethod[order.shippingMethod] || 0;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    items: order.items || [],
    totalAmount: order.totalAmount,
    shippingInfo,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod || 'BANK_TRANSFER',
    shippingMethodId: order.shippingMethod,
    shippingFee,
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

  if (!items.length) return fail(res, 'Giỏ hàng trống', 400);
  if (!textOrNull(shippingInfo.fullName) || !textOrNull(shippingInfo.phone) || !textOrNull(shippingInfo.address)) {
    return fail(res, 'Vui lòng nhập đầy đủ tên, số điện thoại và địa chỉ giao hàng', 400);
  }

  const ids = items.map((item: any) => String(item.id || item.productId || '')).filter(Boolean);
  const products = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true, deletedAt: null }, include: { category: true } });
  const productMap = new Map(products.map((product) => [product.id, product] as const));

  const normalizedItems = items.map((item: any) => {
    const productId = String(item.id || item.productId || '');
    const product = productMap.get(productId);
    const quantity = Math.max(1, intOr(item.quantity, 1));
    if (!product) throw new Error('Có sản phẩm không hợp lệ trong giỏ hàng');
    if (product.stock < quantity) throw new Error(`Sản phẩm ${product.name} không đủ tồn kho`);
    const price = product.promotionalPrice || product.price;
    return { product, quantity, price };
  });

  const shippingFee = shippingFeeByMethod[shippingMethod] ?? shippingFeeByMethod.STANDARD;
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = subtotal + shippingFee;
  const customer = await ensureCustomer(shippingInfo);
  const orderNumber = createOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: customer.id,
        orderNumber,
        totalAmount,
        shippingAddress: JSON.stringify(shippingInfo),
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

    for (const item of normalizedItems) {
      await tx.product.update({
        where: { id: item.product.id },
        data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
      });
    }

    return created;
  });

  return ok(res, { ...serializeOrder(order), paymentMethod }, 'Đã tạo đơn hàng', 201);
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
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
      include: { items: true },
    });
  });

  return ok(res, { order: serializeOrder(expired), restoredItems }, 'Expired order cancelled and stock restored');
};

const orderStage = (order: any) => {
  if (order.status === 'CANCELLED') return 'DELIVERY_FAILED';
  if (order.status === 'DELIVERED') return 'DELIVERED';
  if (['SHIPPING', 'DELIVERING'].includes(order.status)) return 'OUT_FOR_DELIVERY';
  if (['PROCESSING', 'PACKING'].includes(order.status)) return 'PICKED_UP';
  return 'PENDING_PICKUP';
};

const completedStatuses = (current: string) => {
  const order = ['PENDING_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const index = Math.max(0, order.indexOf(current));
  return new Set(order.slice(0, index + 1));
};

const buildTracking = (order: any) => {
  const serialized = serializeOrder(order);
  const currentStatus = orderStage(order);
  const completed = completedStatuses(currentStatus);
  const createdAt = new Date(order.createdAt).getTime();
  const destinationName = [serialized.shippingInfo.fullName, serialized.shippingInfo.address, serialized.shippingInfo.city]
    .filter(Boolean)
    .join(' - ');
  const provider = providerByMethod[order.shippingMethod] || 'GHN';
  const origin = { lat: 10.8953, lng: 106.5771, name: 'Kho Hai Tụi Mình - Hóc Môn, TP.HCM', type: 'ORIGIN' };
  const destination = { lat: 10.7963, lng: 106.6675, name: destinationName || 'Địa chỉ nhận hàng', type: 'DESTINATION' };
  const eventData = [
    ['PENDING_PICKUP', origin, createdAt, order.paymentStatus === 'PAID' ? 'Đơn hàng đã được xác nhận thanh toán.' : 'Đơn hàng đã được ghi nhận và đang chờ xác nhận thanh toán.'],
    ['PICKED_UP', origin, createdAt + 6 * 60 * 60 * 1000, 'Cửa hàng đang chuẩn bị và đóng gói đơn hàng.'],
    ['IN_TRANSIT', origin, createdAt + 18 * 60 * 60 * 1000, 'Đơn hàng đã sẵn sàng bàn giao cho đơn vị vận chuyển.'],
    ['OUT_FOR_DELIVERY', destination, createdAt + 30 * 60 * 60 * 1000, 'Đơn hàng đang trong giai đoạn giao đến địa chỉ nhận.'],
    ['DELIVERED', destination, createdAt + 48 * 60 * 60 * 1000, 'Đơn hàng đã giao thành công.'],
  ] as const;

  const events = eventData.map(([status, location, timestamp, description], index) => ({
    id: `${order.id}-${index}`,
    status,
    location,
    timestamp: new Date(timestamp).toISOString(),
    description,
    isCompleted: completed.has(status),
  }));

  return {
    trackingId: order.orderNumber,
    orderId: order.id,
    order: serialized,
    provider,
    status: currentStatus,
    estimatedArrival: serialized.estimatedArrival,
    events,
    currentLocation: [...events].reverse().find((event) => event.isCompleted)?.location || origin,
    origin,
    destination,
    progress: Math.max(0.12, events.filter((event) => event.isCompleted).length / events.length),
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
  return ok(res, buildTracking(order));
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!hasDatabase) return fail(res, 'Production chưa cấu hình DATABASE_URL.', 503);

  try {
    const path = parsePath(req);
    if (path === 'checkout') return createCheckoutOrder(req, res);
    if (path === 'expire') return expireCheckoutOrder(req, res);
    if (path === 'track') return trackOrder(req, res);
    return fail(res, 'Không tìm thấy API đơn hàng', 404);
  } catch (error) {
    console.error('Orders API error:', error);
    return fail(res, error instanceof Error ? error.message : 'Không thể xử lý đơn hàng', 500);
  }
}
