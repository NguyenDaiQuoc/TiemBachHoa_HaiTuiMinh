import express from 'express';
import prisma from '../shared/lib/prisma.js';
import { sendError, sendSuccess } from './utils/api-response.js';

const router = express.Router();

const CATEGORY_RATING_MAP: Record<string, number> = {
  'my-pham': 4.8,
  'gia-dung': 4.5,
  'cong-nghe': 4.6,
};

router.get('/', async (req, res, next) => {
  const {
    query,
    category,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
    limit = 12,
    page = 1,
  } = req.query;

  try {
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.min(48, Math.max(1, Number(limit) || 12));
    const skip = (parsedPage - 1) * parsedLimit;

    const where: any = {
      isActive: true,
      deletedAt: null,
      AND: [
        query
          ? {
              OR: [
                { name: { contains: String(query), mode: 'insensitive' } },
                { description: { contains: String(query), mode: 'insensitive' } },
              ],
            }
          : {},
        category
          ? {
              OR: [
                { category: { slug: String(category) } },
                { category: { name: String(category) } },
              ],
            }
          : {},
        minPrice ? { price: { gte: Number(minPrice) } } : {},
        maxPrice ? { price: { lte: Number(maxPrice) } } : {},
      ],
    };

    const orderBy =
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
    const enrichedProducts = products
      .map((product) => {
        const categorySlug = typeof product.category === 'object' ? product.category.slug : '';
        const fallbackRating = CATEGORY_RATING_MAP[categorySlug] ?? 4.5;
        const reviewCount = Math.max(12, Math.round(product.soldCount * 0.18) || 24);

        return {
          ...product,
          image: product.images?.[0] || '',
          rating: fallbackRating,
          reviewCount,
          isNew: Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 21,
        };
      })
      .filter((product) => (requiredRating ? product.rating >= requiredRating : true));

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

    const categorySlug = typeof product.category === 'object' ? product.category.slug : '';
    const rating = CATEGORY_RATING_MAP[categorySlug] ?? 4.5;

    return sendSuccess(res, {
      ...product,
      image: product.images?.[0] || '',
      rating,
      reviewCount: Math.max(12, Math.round(product.soldCount * 0.18) || 24),
      isNew: Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 21,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
