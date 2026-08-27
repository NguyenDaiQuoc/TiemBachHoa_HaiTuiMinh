import express from "express";
import prisma from "../shared/lib/prisma.js";
import { authenticate } from "./auth-middleware.js";
import { sendSuccess, sendError } from "./utils/api-response.js";
import { z } from "zod";

const router = express.Router();

const checkoutSchema = z.object({
  shippingAddress: z.string().min(10, "Địa chỉ giao hàng quá ngắn"),
  shippingMethod: z.string().default("STANDARD"),
  paymentMethod: z.string().default("COD"),
  voucherCode: z.string().optional(),
});

const PAYMENT_CONFIRMATION_TIMEOUT_MS = Number(process.env.PAYMENT_CONFIRMATION_TIMEOUT_MS || 10 * 60 * 1000);
const pendingPaymentStatuses = new Set(["PENDING", "UNPAID"]);
const shippingFeeByMethod: Record<string, number> = { STANDARD: 20000, FAST: 35000, EXPRESS: 55000 };
const TEST_CHECKOUT_SLUG = "test";

const isTestCheckoutOnly = (items: Array<{ product: { slug?: string | null } }>) =>
  items.length === 1 && String(items[0]?.product?.slug || "").trim().toLowerCase() === TEST_CHECKOUT_SLUG;

const orderReleaseSchema = z.object({
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  trackingId: z.string().optional(),
});

const bankTransferWebhookSchema = z.object({}).passthrough();
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "";

const orderLookupWhere = (body: z.infer<typeof orderReleaseSchema>) => {
  if (body.orderId) return { id: body.orderId };
  if (body.orderNumber) return { orderNumber: body.orderNumber };
  if (body.trackingId) return { orderNumber: body.trackingId };
  return null;
};

const isPendingUnpaidOrder = (order: { status: string; paymentStatus: string }) =>
  order.status === "PENDING" && pendingPaymentStatuses.has(order.paymentStatus);

const stringFromPath = (input: Record<string, unknown>, paths: string[][]) => {
  for (const path of paths) {
    let value: unknown = input;
    for (const key of path) {
      value = typeof value === "object" && value !== null ? (value as Record<string, unknown>)[key] : undefined;
    }
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};

const numberFromPath = (input: Record<string, unknown>, paths: string[][]) => {
  for (const path of paths) {
    let value: unknown = input;
    for (const key of path) {
      value = typeof value === "object" && value !== null ? (value as Record<string, unknown>)[key] : undefined;
    }
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const normalized = value.replace(/[^\d.-]/g, "");
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
};

const extractBankTransfer = (body: Record<string, unknown>) => {
  const content = stringFromPath(body, [
    ["content"],
    ["description"],
    ["memo"],
    ["note"],
    ["transferContent"],
    ["transactionContent"],
    ["addInfo"],
    ["data", "content"],
    ["data", "description"],
    ["transaction", "content"],
    ["transaction", "description"],
  ]);
  const amount = numberFromPath(body, [
    ["amount"],
    ["transferAmount"],
    ["transfer_amount"],
    ["creditAmount"],
    ["credit_amount"],
    ["amountIn"],
    ["amount_in"],
    ["data", "amount"],
    ["data", "transferAmount"],
    ["transaction", "amount"],
  ]);
  const orderNumber = stringFromPath(body, [
    ["orderNumber"],
    ["order_number"],
    ["orderCode"],
    ["order_code"],
    ["data", "orderNumber"],
    ["transaction", "orderNumber"],
  ]);
  const transactionId = stringFromPath(body, [
    ["transactionId"],
    ["transaction_id"],
    ["referenceCode"],
    ["reference_code"],
    ["id"],
    ["data", "id"],
    ["transaction", "id"],
  ]);

  return { amount, content, orderNumber, transactionId };
};

const webhookSecretFromRequest = (req: express.Request) => {
  const auth = req.header("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim();
  return req.header("x-payment-webhook-secret") || req.header("x-webhook-secret") || "";
};

const verifyPaymentWebhook = (req: express.Request) => {
  if (!PAYMENT_WEBHOOK_SECRET) return process.env.NODE_ENV !== "production";
  return webhookSecretFromRequest(req) === PAYMENT_WEBHOOK_SECRET;
};

const normalizeMoney = (value: number) => Math.round(value);

const numberOr = (value: unknown, fallback = 0) =>
  value === null || value === undefined || value === "" ? fallback : Number.isFinite(Number(value)) ? Number(value) : fallback;

const calculateVoucherDiscount = (voucher: any, subtotal: number) => {
  if (!voucher) return 0;
  const rawDiscount = voucher.type === "PERCENT" ? Math.round((subtotal * numberOr(voucher.value)) / 100) : numberOr(voucher.value);
  const cappedDiscount = voucher.maxDiscount ? Math.min(rawDiscount, numberOr(voucher.maxDiscount)) : rawDiscount;
  return Math.max(0, Math.min(subtotal, cappedDiscount));
};

const findApplicableVoucher = async (client: any, code: string, subtotal: number, productIds: string[]) => {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) return { voucher: null, discount: 0, error: null };

  const now = new Date();
  const voucher = await client.voucher.findUnique({
    where: { code: normalizedCode },
    include: { products: { select: { productId: true } } },
  });

  if (!voucher || !voucher.isActive) return { voucher: null, discount: 0, error: "Voucher không tồn tại hoặc đã tạm ngưng" };
  if (voucher.startsAt && voucher.startsAt > now) return { voucher: null, discount: 0, error: "Voucher chưa đến thời gian sử dụng" };
  if (voucher.endsAt && voucher.endsAt < now) return { voucher: null, discount: 0, error: "Voucher đã hết hạn" };
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) return { voucher: null, discount: 0, error: "Voucher đã hết lượt sử dụng" };
  if (subtotal < numberOr(voucher.minOrderValue)) return { voucher: null, discount: 0, error: "Đơn hàng chưa đạt giá trị tối thiểu của voucher" };

  const scopedProductIds = voucher.products.map((item: any) => item.productId);
  if (scopedProductIds.length && !productIds.some((id) => scopedProductIds.includes(id))) {
    return { voucher: null, discount: 0, error: "Voucher không áp dụng cho sản phẩm trong giỏ hàng" };
  }

  return { voucher, discount: calculateVoucherDiscount(voucher, subtotal), error: null };
};

const confirmBankTransferPayment = async ({
  orderNumber,
  content,
  amount,
  transactionId,
}: {
  orderNumber: string;
  content: string;
  amount: number;
  transactionId: string;
}) =>
  prisma.$transaction(async (tx) => {
    const candidates = await tx.order.findMany({
      where: {
        status: "PENDING",
        paymentStatus: { in: ["UNPAID", "PENDING"] },
        ...(orderNumber
          ? { orderNumber }
          : {
              orderNumber: {
                not: "",
              },
            }),
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: orderNumber ? 1 : 50,
    });

    const normalizedContent = content.toUpperCase();
    const matchedOrder = candidates.find((order) =>
      orderNumber ? order.orderNumber === orderNumber : normalizedContent.includes(order.orderNumber.toUpperCase())
    );

    if (!matchedOrder) return { status: "NOT_MATCHED" as const };
    if (normalizeMoney(amount) < normalizeMoney(matchedOrder.totalAmount)) {
      return { status: "AMOUNT_TOO_LOW" as const, order: matchedOrder };
    }

    const order = await tx.order.update({
      where: { id: matchedOrder.id },
      data: {
        status: "PROCESSING",
        paymentStatus: "PAID",
      },
      include: { items: true },
    });

    return {
      status: "CONFIRMED" as const,
      order,
      transactionId,
    };
  });

const releasePendingOrderInventory = async (tx: any, order: { items: Array<{ productId: string; quantity: number }> }) => {
  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: { increment: item.quantity },
        soldCount: { decrement: item.quantity },
      },
    });
  }
};

const toRestoredCartItems = (
  items: Array<{
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      description: string;
      price: number;
      costPrice: number;
      images: string[];
      stock: number;
      categoryId: string;
      brand: string | null;
      sku: string | null;
      tags: string[];
      isActive: boolean;
      soldCount: number;
    };
  }>
) =>
  items.map((item) => ({
    ...item.product,
    stock: item.product.stock + item.quantity,
    quantity: item.quantity,
  }));

const releasePendingPaymentOrder = async ({
  userId,
  lookup,
  requireExpired,
}: {
  userId: string;
  lookup: NonNullable<ReturnType<typeof orderLookupWhere>>;
  requireExpired: boolean;
}) =>
  prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { ...lookup, userId },
      include: { items: { include: { product: true } } },
    });

    if (!order) return { status: "NOT_FOUND" as const };
    if (order.status === "CANCELLED") return { status: "ALREADY_CANCELLED" as const, order, restoredItems: [] };
    if (!isPendingUnpaidOrder(order)) return { status: "NOT_RELEASABLE" as const, order };
    if (requireExpired && Date.now() - order.createdAt.getTime() < PAYMENT_CONFIRMATION_TIMEOUT_MS) {
      return { status: "NOT_EXPIRED" as const, order };
    }

    await releasePendingOrderInventory(tx, order);

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED", paymentStatus: "FAILED" },
      include: { items: true },
    });

    return {
      status: "RELEASED" as const,
      order: updatedOrder,
      restoredItems: toRestoredCartItems(order.items),
    };
  });

// Create order details from cart
router.post("/checkout", authenticate, async (req: any, res, next) => {
  try {
    const { shippingAddress, shippingMethod, paymentMethod, voucherCode } = checkoutSchema.parse(req.body);
    const normalizedPaymentMethod = paymentMethod.toUpperCase();
    const normalizedShippingMethod = shippingMethod.toUpperCase();

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return sendError(res, "Giỏ hàng trống", 400);
    }

    // Validate stock and calculate total
    let subtotal = 0;
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return sendError(res, `Sản phẩm ${item.product.name} không đủ tồn kho`, 400);
      }
      subtotal += (item.product.promotionalPrice || item.product.price) * item.quantity;
    }
    const testCheckoutOnly = isTestCheckoutOnly(cart.items);
    const shippingFee = testCheckoutOnly ? 0 : shippingFeeByMethod[normalizedShippingMethod] ?? shippingFeeByMethod.STANDARD;
    const voucherResult = testCheckoutOnly
      ? { voucher: null, discount: 0, error: null }
      : await findApplicableVoucher(prisma, voucherCode || "", subtotal, cart.items.map((item) => item.productId));
    if (voucherResult.error) return sendError(res, voucherResult.error, 400);
    const totalAmount = Math.max(0, subtotal - voucherResult.discount) + shippingFee;
    const checkoutMeta = {
      subtotal,
      shippingFee,
      testCheckoutOnly,
      voucherCode: voucherResult.voucher?.code || null,
      voucherDiscount: voucherResult.discount,
      paymentMethod: normalizedPaymentMethod,
    };

    const orderNumber = `H2MTM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Atomic transaction for order creation and stock reservation.
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          orderNumber,
          totalAmount,
          voucherId: voucherResult.voucher?.id || null,
          shippingAddress: JSON.stringify({ raw: shippingAddress, _checkout: checkoutMeta }),
          shippingMethod: normalizedShippingMethod,
          status: normalizedPaymentMethod === "COD" ? "PROCESSING" : "PENDING",
          paymentStatus: "UNPAID",
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.promotionalPrice || item.product.price,
              image: item.product.images[0] || ""
            }))
          }
        },
        include: { items: true }
      });

      // 2. Reserve stock immediately for every payment method.
      // Bank transfer orders stay pending for payment, but inventory is no longer oversold.
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity }
          }
        });

        if (updated.count !== 1) {
          throw new Error(`Sản phẩm ${item.product.name} không đủ tồn kho`);
        }
      }

      if (voucherResult.voucher) {
        await tx.voucher.update({
          where: { id: voucherResult.voucher.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 3. Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return sendSuccess(res, { ...order, shippingFee, checkoutMeta }, "Đặt hàng thành công", 201);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    if (error instanceof Error && error.message.includes("không đủ tồn kho")) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
});

router.post("/expire", authenticate, async (req: any, res, next) => {
  try {
    const body = orderReleaseSchema.parse(req.body);
    const lookup = orderLookupWhere(body);

    if (!lookup) return sendError(res, "Thiếu thông tin đơn hàng cần hủy", 400);

    const result = await releasePendingPaymentOrder({ userId: req.user.id, lookup, requireExpired: true });

    if (result.status === "NOT_FOUND") return sendError(res, "Không tìm thấy đơn hàng", 404);
    if (result.status === "NOT_EXPIRED") return sendError(res, "Đơn hàng chưa hết hạn thanh toán", 409);
    if (result.status === "NOT_RELEASABLE") return sendError(res, "Đơn hàng không ở trạng thái chờ thanh toán", 409);

    return sendSuccess(
      res,
      {
        order: result.order,
        restoredItems: result.restoredItems || [],
      },
      result.status === "ALREADY_CANCELLED"
        ? "Don hang da duoc huy truoc do"
        : "Don qua han da duoc huy va hoan ton kho"
    );
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.post("/cancel", authenticate, async (req: any, res, next) => {
  try {
    const body = orderReleaseSchema.parse(req.body);
    const lookup = orderLookupWhere(body);

    if (!lookup) return sendError(res, "Thiếu thông tin đơn hàng cần hủy", 400);

    const result = await releasePendingPaymentOrder({ userId: req.user.id, lookup, requireExpired: false });

    if (result.status === "NOT_FOUND") return sendError(res, "Không tìm thấy đơn hàng", 404);
    if (result.status === "NOT_RELEASABLE") return sendError(res, "Đơn hàng không ở trạng thái chờ thanh toán", 409);

    return sendSuccess(
      res,
      {
        order: result.order,
        restoredItems: result.restoredItems || [],
      },
      result.status === "ALREADY_CANCELLED"
        ? "Don hang da duoc huy truoc do"
        : "Đã hủy đơn chờ thanh toán và hoàn tồn kho"
    );
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.post("/bank-transfer/webhook", async (req, res, next) => {
  try {
    if (!verifyPaymentWebhook(req)) {
      return sendError(res, "Invalid payment webhook secret", 401);
    }

    const body = bankTransferWebhookSchema.parse(req.body);
    const transfer = extractBankTransfer(body);

    if (!transfer.orderNumber && !transfer.content) {
      return sendError(res, "Missing transfer content or order number", 400);
    }

    if (!Number.isFinite(transfer.amount) || transfer.amount <= 0) {
      return sendError(res, "Invalid transfer amount", 400);
    }

    const result = await confirmBankTransferPayment(transfer);

    if (result.status === "NOT_MATCHED") {
      return sendSuccess(res, { matched: false }, "No pending order matched this transfer");
    }

    if (result.status === "AMOUNT_TOO_LOW") {
      return sendError(res, "Transfer amount is lower than order total", 409);
    }

    return sendSuccess(res, {
      matched: true,
      order: result.order,
      transactionId: result.transactionId,
    }, "Bank transfer payment confirmed");
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.post("/voucher/validate", async (req, res, next) => {
  try {
    const code = String(req.body?.code || req.body?.voucherCode || "").trim().toUpperCase();
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!code) return sendError(res, "Vui lòng nhập mã voucher", 400);
    if (!items.length) return sendError(res, "Giỏ hàng trống", 400);

    const requestedByProduct = new Map<string, number>();
    for (const item of items) {
      const productId = String(item.id || item.productId || "");
      if (!productId) continue;
      const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1));
      requestedByProduct.set(productId, (requestedByProduct.get(productId) || 0) + quantity);
    }

    const productIds = [...requestedByProduct.keys()];
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true, deletedAt: null } });
    const productMap = new Map(products.map((product) => [product.id, product]));
    const subtotal = productIds.reduce((sum, productId) => {
      const product = productMap.get(productId);
      const quantity = requestedByProduct.get(productId) || 0;
      return product ? sum + (product.promotionalPrice || product.price) * quantity : sum;
    }, 0);

    const voucherResult = await findApplicableVoucher(prisma, code, subtotal, productIds);
    if (voucherResult.error) return sendError(res, voucherResult.error, 400);

    return sendSuccess(res, {
      code: voucherResult.voucher.code,
      title: voucherResult.voucher.title,
      type: voucherResult.voucher.type,
      value: voucherResult.voucher.value,
      discount: voucherResult.discount,
      subtotal,
    }, "Đã áp dụng voucher");
  } catch (error) {
    next(error);
  }
});

router.get("/track", async (req, res, next) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code.trim() : "";
    if (!code) return sendError(res, "Missing order tracking code", 400);

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: code }, { orderNumber: code }] },
      include: { items: true },
    });

    if (!order) return sendError(res, "Order not found", 404);
    return sendSuccess(res, { order });
  } catch (error) {
    next(error);
  }
});

// Get user orders
router.get("/", authenticate, async (req: any, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });
    return sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
});

// Get single order
router.get("/:id", authenticate, async (req: any, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });

    if (!order || order.userId !== req.user.id) {
      return sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    return sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
});

export default router;
