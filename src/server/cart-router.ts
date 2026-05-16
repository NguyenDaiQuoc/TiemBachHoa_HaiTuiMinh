import express from "express";
import prisma from "../shared/lib/prisma.js";
import { authenticate } from "./auth-middleware.js";
import { sendSuccess, sendError } from "./utils/api-response.js";
import { z } from "zod";

const router = express.Router();

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

// Get user cart
router.get("/", authenticate, async (req: any, res, next) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
        include: {
          items: {
            include: { product: true }
          }
        }
      });
    }

    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
});

// Add item to cart
router.post("/items", authenticate, async (req: any, res, next) => {
  try {
    const { productId, quantity } = cartItemSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive || product.deletedAt) {
      return sendError(res, "Sản phẩm không khả dụng", 404);
    }

    if (product.stock < quantity) {
      return sendError(res, "Số lượng tồn kho không đủ", 400);
    }

    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.user.id } });
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId
        }
      },
      update: {
        quantity: { increment: quantity }
      },
      create: {
        cartId: cart.id,
        productId,
        quantity
      }
    });

    return sendSuccess(res, cartItem, "Đã thêm vào giỏ hàng");
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

// Update item quantity
router.patch("/items/:itemId", authenticate, async (req: any, res, next) => {
  try {
    const { quantity } = z.object({ quantity: z.number().int().min(1) }).parse(req.body);
    const { itemId } = req.params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true, cart: true }
    });

    if (!cartItem || cartItem.cart.userId !== req.user.id) {
      return sendError(res, "Không tìm thấy sản phẩm trong giỏ hàng", 404);
    }

    if (cartItem.product.stock < quantity) {
      return sendError(res, "Số lượng tồn kho không đủ", 400);
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });

    return sendSuccess(res, updatedItem, "Đã cập nhật số lượng");
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

// Remove item from cart
router.delete("/items/:itemId", authenticate, async (req: any, res, next) => {
  try {
    const { itemId } = req.params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true }
    });

    if (!cartItem || cartItem.cart.userId !== req.user.id) {
      return sendError(res, "Không tìm thấy sản phẩm trong giỏ hàng", 404);
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return sendSuccess(res, null, "Đã xóa sản phẩm khỏi giỏ hàng");
  } catch (error) {
    next(error);
  }
});

export default router;
