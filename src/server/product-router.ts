import express from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../shared/lib/prisma.js';
import { sendError, sendSuccess } from './utils/api-response.js';

const router = express.Router();

const CATEGORY_RATING_MAP: Record<string, number> = {
  'my-pham': 4.8,
  'gia-dung': 4.5,
  'cong-nghe': 4.6,
};

const serializeProduct = (product: Prisma.ProductGetPayload<{ include: { category: true } }>) => {
  const categorySlug = product.category?.slug ?? '';
  const rating = CATEGORY_RATING_MAP[categorySlug] ?? 4.5;
  const reviewCount = Math.max(12, Math.round(product.soldCount * 0.18) || 24);
  const variants =
    Array.isArray(product.variantsJson) && product.variantsJson.length
      ? [
          {
            type: 'capacity' as const,
            options: product.variantsJson,
          },
        ]
      : [];

  return {
    ...product,
    image: product.images?.[0] || '',
    rating,
    reviewCount,
    isNew: Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 21,
    variants,
  };
};

router.get('/', async (req, res, next) => {
  const { query, category, minPrice, maxPrice, minRating, sortBy, limit = 12, page = 1 } = req.query;

  try {
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.min(48, Math.max(1, Number(limit) || 12));
    const skip = (parsedPage - 1) * parsedLimit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
      AND: [
        query
          ? {
              OR: [
                { name: { contains: String(query), mode: 'insensitive' } },
                { description: { contains: String(query), mode: 'insensitive' } },
                { sku: { contains: String(query), mode: 'insensitive' } },
              ],
            }
          : {},
        category
          ? {
              OR: [{ category: { slug: String(category) } }, { category: { name: String(category) } }],
            }
          : {},
        minPrice ? { price: { gte: Number(minPrice) } } : {},
        maxPrice ? { price: { lte: Number(maxPrice) } } : {},
      ],
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] =
      sortBy === 'price-asc'
        ? { price: 'asc' }
        : sortBy === 'price-desc'
          ? { price: 'desc' }
          : sortBy === 'popular'
            ? [{ soldCount: 'desc' }, { createdAt: 'desc' }]
            : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: parsedLimit,
      }),
      prisma.product.count({ where }),
    ]);

    const requiredRating = minRating ? Number(minRating) : null;
    const enrichedProducts = products.map(serializeProduct).filter((product) => (requiredRating ? product.rating >= requiredRating : true));

    return res.status(200).json({
      success: true,
      data: enrichedProducts,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
      },
      message: 'Tải danh sách sản phẩm thành công',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });

    if (!product || !product.isActive || product.deletedAt) {
      return sendError(res, 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh', 404);
    }

    return sendSuccess(res, serializeProduct(product));
  } catch (error) {
    next(error);
  }
});

export default router;
