import express from "express";
import prisma from "../shared/lib/prisma.js";
import { sendSuccess } from "./utils/api-response.js";

const router = express.Router();

const coreCategories = [
  { name: 'Đồ công nghệ', slug: 'cong-nghe', description: 'Thiết bị và phụ kiện công nghệ chính hãng.' },
  { name: 'Đồ gia dụng', slug: 'gia-dung', description: 'Sản phẩm gia dụng tiện ích cho cuộc sống hiện đại.' },
  { name: 'Mỹ phẩm', slug: 'my-pham', description: 'Mỹ phẩm chính hãng, chăm sóc da và làm đẹp mỗi ngày.' },
];

const ensureCoreCategories = async () => {
  await Promise.all(
    coreCategories.map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name, description: category.description, isActive: true, deletedAt: null },
        create: { ...category, isActive: true },
      })
    )
  );
  await prisma.category.updateMany({ where: { slug: 'san-pham-nhap-kho' }, data: { isActive: false } }).catch(() => undefined);
};

router.get("/", async (_req, res, next) => {
  try {
    await ensureCoreCategories();
    const categories = await prisma.category.findMany({
      where: {
        slug: { in: coreCategories.map((category) => category.slug) },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
});

export default router;
