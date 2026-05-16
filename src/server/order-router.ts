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
});

// Create order details from cart
router.post("/checkout", authenticate, async (req: any, res, next) => {
  try {
    const { shippingAddress, shippingMethod } = checkoutSchema.parse(req.body);

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
    let totalAmount = 0;
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return sendError(res, `Sản phẩm ${item.product.name} không đủ tồn kho`, 400);
      }
      totalAmount += item.product.price * item.quantity;
    }

    const orderNumber = `H2MTM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Atomic transaction for order creation and stock reduction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          orderNumber,
          totalAmount,
          shippingAddress,
          shippingMethod,
          status: "PENDING",
          paymentStatus: "UNPAID",
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
              image: item.product.images[0] || ""
            }))
          }
        },
        include: { items: true }
      });

      // 2. Reduce stock & update sold count
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity }
          }
        });
      }

      // 3. Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return sendSuccess(res, order, "Đặt hàng thành công", 201);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
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
