import express from "express";
import prisma from "../shared/lib/prisma.js";
import { authenticate, verifyAccessToken } from "./auth-middleware.js";
import { sendSuccess, sendError } from "./utils/api-response.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { serializeNotificationCenter } from "./services/notification-service.js";
import { emitNotificationStream, registerNotificationStream, unregisterNotificationStream } from "./services/notification-stream-service.js";

const router = express.Router();

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const emptyToNull = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const profileSchema = z.object({
  name: z.preprocess(emptyToUndefined, z.string().min(2).optional()),
  phone: z.preprocess(emptyToNull, z.string().min(10).max(15).nullable().optional()),
  avatar: z.preprocess(emptyToNull, z.string().nullable().optional()),
  username: z.preprocess(emptyToNull, z.string().min(3).nullable().optional()),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "HIDDEN"]).optional().nullable(),
  birthDate: z.preprocess(emptyToNull, z.string().nullable().optional()),
  bio: z.preprocess(emptyToNull, z.string().max(200).nullable().optional()),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

const addressSchema = z.object({
  receiverName: z.string().min(2),
  phone: z.string().min(10).max(15),
  province: z.string(),
  district: z.string(),
  ward: z.string(),
  detail: z.string(),
  isDefault: z.boolean().optional(),
});

router.get("/profile", authenticate, async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { notifications: true },
    });

    if (!user) {
      return sendError(res, "Người dùng không tồn tại", 404);
    }

    const { password, ...safeUser } = user;
    return sendSuccess(res, safeUser);
  } catch (error) {
    next(error);
  }
});

router.patch("/profile", authenticate, async (req: any, res, next) => {
  try {
    const body = profileSchema.parse(req.body);
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.username !== undefined) updateData.username = body.username;
    if (body.gender !== undefined) updateData.gender = body.gender || "HIDDEN";
    if (body.bio !== undefined) updateData.bio = body.bio;

    if (body.username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: body.username,
          id: { not: req.user.id },
        },
        select: { id: true },
      });

      if (existingUsername) {
        return sendError(res, "Username đã được sử dụng", 400);
      }
    }

    if (body.birthDate) {
      updateData.birthDate = new Date(body.birthDate);
    } else if (body.birthDate === null) {
      updateData.birthDate = null;
    }

    if (Object.keys(updateData).length === 0) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { notifications: true },
      });

      if (!currentUser) {
        return sendError(res, "Người dùng không tồn tại", 404);
      }

      const { password, ...safeUser } = currentUser;
      return sendSuccess(res, safeUser, "Không có thay đổi nào cần lưu");
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: { notifications: true },
    });

    const { password, ...safeUser } = user;
    return sendSuccess(res, safeUser, "Đã cập nhật thông tin cá nhân");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.issues[0].message);
    }
    next(error);
  }
});

router.get("/membership/points", authenticate, async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { membershipPoints: true },
    });
    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
});

router.get("/membership/transactions", authenticate, async (req: any, res, next) => {
  try {
    const transactions = await prisma.membershipTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return sendSuccess(res, transactions);
  } catch (error) {
    next(error);
  }
});

router.get("/notifications/settings", authenticate, async (req: any, res, next) => {
  try {
    const settings = await prisma.notificationSetting.findMany({
      where: { userId: req.user.id },
    });

    const defaultTypes = ["ORDER_UPDATE", "PROMOTION", "NEWSLETTER"];
    const existingTypes = settings.map((setting) => setting.type);
    const missingTypes = defaultTypes.filter((type) => !existingTypes.includes(type));

    if (missingTypes.length > 0) {
      const newSettings = await Promise.all(
        missingTypes.map((type) =>
          prisma.notificationSetting.create({
            data: { userId: req.user.id, type },
          })
        )
      );

      return sendSuccess(res, [...settings, ...newSettings]);
    }

    return sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", authenticate, async (req: any, res, next) => {
  try {
    const notifications = await prisma.appNotification.findMany({
      where: { userId: req.user.id, scope: "USER" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return sendSuccess(res, serializeNotificationCenter(notifications));
  } catch (error) {
    next(error);
  }
});

router.get("/notifications/stream", async (req: any, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = verifyAccessToken(token);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });

    registerNotificationStream(user.id, "USER", res);

    const heartbeat = setInterval(() => {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 20000);

    req.on("close", () => {
      clearInterval(heartbeat);
      unregisterNotificationStream(user.id, "USER", res);
    });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});

router.patch("/notifications/:id/read", authenticate, async (req: any, res, next) => {
  try {
    const notification = await prisma.appNotification.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true },
    });

    if (!notification || notification.userId !== req.user.id) {
      return sendError(res, "Không tìm thấy thông báo", 404);
    }

    const updated = await prisma.appNotification.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    });

    emitNotificationStream(req.user.id, "USER");

    return sendSuccess(res, updated, "Đã đánh dấu đã đọc");
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/read-all", authenticate, async (req: any, res, next) => {
  try {
    const result = await prisma.appNotification.updateMany({
      where: { userId: req.user.id, scope: "USER", isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    emitNotificationStream(req.user.id, "USER");

    return sendSuccess(res, { count: result.count }, "Đã đánh dấu toàn bộ thông báo");
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/settings/:type", authenticate, async (req: any, res, next) => {
  try {
    const { type } = req.params;
    const body = z
      .object({
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
        push: z.boolean().optional(),
      })
      .parse(req.body);

    const setting = await prisma.notificationSetting.upsert({
      where: {
        userId_type: {
          userId: req.user.id,
          type,
        },
      },
      update: body,
      create: {
        userId: req.user.id,
        type,
        ...body,
      },
    });

    return sendSuccess(res, setting, "Đã cập nhật cài đặt thông báo");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.issues[0].message);
    }
    next(error);
  }
});

router.post("/profile/password", authenticate, async (req: any, res, next) => {
  try {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return sendError(res, "Người dùng không tồn tại", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, "Mật khẩu hiện tại không đúng", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    return sendSuccess(res, null, "Đã đổi mật khẩu thành công");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.issues[0].message);
    }
    next(error);
  }
});

router.get("/addresses", authenticate, async (req: any, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return sendSuccess(res, addresses);
  } catch (error) {
    next(error);
  }
});

router.post("/addresses", authenticate, async (req: any, res, next) => {
  try {
    const data = addressSchema.parse(req.body);

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    } else {
      const count = await prisma.address.count({ where: { userId: req.user.id } });
      if (count === 0) {
        (data as any).isDefault = true;
      }
    }

    const address = await prisma.address.create({
      data: { ...data, userId: req.user.id },
    });

    return sendSuccess(res, address, "Đã thêm địa chỉ mới", 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.issues[0].message);
    }
    next(error);
  }
});

router.patch("/addresses/:id", authenticate, async (req: any, res, next) => {
  try {
    const data = addressSchema.partial().parse(req.body);
    const { id } = req.params;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return sendError(res, "Không tìm thấy địa chỉ", 404);
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data,
    });

    return sendSuccess(res, address, "Đã cập nhật địa chỉ");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.issues[0].message);
    }
    next(error);
  }
});

router.delete("/addresses/:id", authenticate, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findUnique({ where: { id } });

    if (!existing || existing.userId !== req.user.id) {
      return sendError(res, "Không tìm thấy địa chỉ", 404);
    }

    if (existing.isDefault) {
      return sendError(
        res,
        "Không thể xóa địa chỉ mặc định. Vui lòng đặt địa chỉ khác làm mặc định trước.",
        400
      );
    }

    await prisma.address.delete({ where: { id } });
    return sendSuccess(res, null, "Đã xóa địa chỉ");
  } catch (error) {
    next(error);
  }
});

router.patch("/profile/avatar", authenticate, async (req: any, res, next) => {
  try {
    const avatar = z.string().min(1).parse(req.body.avatar);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar },
    });

    return sendSuccess(res, { avatar: user.avatar }, "Đã cập nhật ảnh đại diện");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.issues[0].message);
    }
    next(error);
  }
});

export default router;
