import express from "express";
import prisma from "../shared/lib/prisma.js";
import { authenticate, authorizeAdmin } from "./auth-middleware.js";
import { sendSuccess, sendError } from "./utils/api-response.js";
import { z } from "zod";

const router = express.Router();

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string(),
  price: z.number().positive(),
  images: z.array(z.string()),
  categoryId: z.string().uuid(),
  stock: z.number().int().min(0),
});

// Admin stats
router.get("/stats", authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const [userCount, productCount, orderCount, revenue] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true }
      })
    ]);

    return sendSuccess(res, {
      userCount,
      productCount,
      orderCount,
      revenue: revenue._sum.totalAmount || 0
    });
  } catch (error) {
    next(error);
  }
});

// Manage products
router.post("/products", authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({ data });
    return sendSuccess(res, product, "Đã tạo sản phẩm", 201);
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.patch("/products/:id", authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({ 
      where: { id: req.params.id },
      data 
    });
    return sendSuccess(res, product, "Đã cập nhật sản phẩm");
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

router.delete("/products/:id", authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { 
        isActive: false,
        deletedAt: new Date()
      }
    });
    return sendSuccess(res, null, "Đã xóa sản phẩm");
  } catch (error) {
    next(error);
  }
});

// Manage orders
router.get("/orders", authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: { 
        items: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
});

// Batch update order status
router.post("/orders/batch-status", authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const { ids, status } = z.object({
      ids: z.array(z.string().uuid()),
      status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    }).parse(req.body);

    await prisma.order.updateMany({
      where: { id: { in: ids } },
      data: { status }
    });

    return sendSuccess(res, { message: `Updated ${ids.length} orders to ${status}` });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id/status", authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const { status } = z.object({ 
      status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]) 
    }).parse(req.body);

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });

    return sendSuccess(res, order, "Đã cập nhật trạng thái đơn hàng");
  } catch (error) {
    if (error instanceof z.ZodError) return sendError(res, error.issues[0].message);
    next(error);
  }
});

export default router;
