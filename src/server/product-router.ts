import express from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../shared/lib/prisma.js';
import { sendError, sendSuccess } from './utils/api-response.js';

const router = express.Router();

const productInclude = {
  category: true,
  reviews: {
    select: { rating: true },
  },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const getReviewStats = (reviews: ProductWithRelations['reviews']) => {
  if (!reviews.length) return { rating: 0, reviewCount: 0 };
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return {
    rating: Number(average.toFixed(1)),
    reviewCount: reviews.length,
  };
};

const serializeProduct = (product: ProductWithRelations) => {
  const { reviews, ...productData } = product;
  const { rating, reviewCount } = getReviewStats(reviews);
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
    ...productData,
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
        req.query.brand
          ? {
              OR: [
                {
                  brand: {
                    in: String(req.query.brand)
                      .split(',')
                      .map((value) => value.trim())
                      .filter(Boolean),
                  },
                },
                {
                  subcategory: {
                    in: String(req.query.brand)
                      .split(',')
                      .map((value) => value.trim())
                      .filter(Boolean),
                  },
                },
              ],
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

    const requiredRating = minRating ? Number(minRating) : null;
    const queryLimit = requiredRating ? undefined : parsedLimit;
    const querySkip = requiredRating ? undefined : skip;

    const products = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: querySkip,
      take: queryLimit,
    });

    const enrichedProducts = products.map(serializeProduct).filter((product) => (requiredRating ? product.rating >= requiredRating : true));
    const total = requiredRating ? enrichedProducts.length : await prisma.product.count({ where });
    const paginatedProducts = requiredRating ? enrichedProducts.slice(skip, skip + parsedLimit) : enrichedProducts;

    return res.status(200).json({
      success: true,
      data: paginatedProducts,
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

router.get('/brands', async (req, res, next) => {
  try {
    const { category } = req.query;

    const where = {
      isActive: true,
      deletedAt: null,
      brand: { not: null },
      ...(category
        ? { category: { OR: [{ slug: String(category) }, { name: String(category) }] } }
        : {}),
    } as Prisma.ProductWhereInput;

    const grouped = await prisma.product.groupBy({
      by: ['brand'],
      where,
      _count: { _all: true },
      orderBy: { brand: 'asc' },
    });

    const brands = grouped
      .filter((item) => item.brand && item.brand.trim())
      .map((item) => ({ name: item.brand as string, count: item._count._all }));

    return res.status(200).json({ success: true, data: brands, message: 'Tải danh sách thương hiệu thành công' });
  } catch (error) {
    next(error);
  }
});

router.get('/facets', async (_req, res, next) => {
  try {
    const baseWhere: Prisma.ProductWhereInput = { isActive: true, deletedAt: null };

    const categories = await prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    const categoryCounts = await prisma.product.groupBy({
      by: ['categoryId'],
      where: baseWhere,
      _count: { _all: true },
    });
    const brandCounts = await prisma.product.groupBy({
      by: ['categoryId', 'brand'],
      where: { ...baseWhere, brand: { not: null } },
      _count: { _all: true },
    });
    const subcategoryCounts = await prisma.product.groupBy({
      by: ['categoryId', 'subcategory'],
      where: { ...baseWhere, subcategory: { not: null } },
      _count: { _all: true },
    });
    const total = await prisma.product.count({ where: baseWhere });

    const countsByCategory = new Map(categoryCounts.map((item) => [item.categoryId, item._count._all]));

    const childrenByCategory = new Map<string, Map<string, number>>();
    const brandsByCategory = new Map<string, Map<string, number>>();
    const subcategoriesByCategory = new Map<string, Map<string, number>>();
    const addChild = (categoryId: string, name: string | null, count: number) => {
      const cleanName = name?.trim();
      if (!cleanName) return;
      const current = childrenByCategory.get(categoryId) ?? new Map<string, number>();
      current.set(cleanName, (current.get(cleanName) || 0) + count);
      childrenByCategory.set(categoryId, current);
    };

    const addScoped = (map: Map<string, Map<string, number>>, categoryId: string, name: string | null, count: number) => {
      const cleanName = name?.trim();
      if (!cleanName) return;
      const current = map.get(categoryId) ?? new Map<string, number>();
      current.set(cleanName, (current.get(cleanName) || 0) + count);
      map.set(categoryId, current);
    };

    brandCounts.forEach((item) => {
      addChild(item.categoryId, item.brand, item._count._all);
      addScoped(brandsByCategory, item.categoryId, item.brand, item._count._all);
    });
    subcategoryCounts.forEach((item) => {
      addChild(item.categoryId, item.subcategory, item._count._all);
      addScoped(subcategoriesByCategory, item.categoryId, item.subcategory, item._count._all);
    });

    const toOptions = (map?: Map<string, number>) =>
      Array.from(map?.entries() || [])
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));

    const categoryFacets = categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        count: countsByCategory.get(category.id) || 0,
        children: toOptions(childrenByCategory.get(category.id)),
        brands: toOptions(brandsByCategory.get(category.id)),
        subcategories: toOptions(subcategoriesByCategory.get(category.id)),
      }))
      .filter((category) => category.count > 0 || category.children.length > 0);

    const brands = Array.from(
      brandCounts.reduce((map, item) => {
        const name = item.brand?.trim();
        if (name) map.set(name, (map.get(name) || 0) + item._count._all);
        return map;
      }, new Map<string, number>())
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));

    return res.status(200).json({
      success: true,
      data: { categories: categoryFacets, brands, total },
      message: 'Tải bộ lọc sản phẩm thành công',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productInclude,
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
