import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../_shared/auth.js';
import { ensureCoreCategories } from '../_shared/catalog.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';

const CATEGORY_RATING_MAP: Record<string, number> = {
  'my-pham': 4.8,
  'gia-dung': 4.5,
  'cong-nghe': 4.6,
};

const serializeProduct = (product: any) => {
  const categorySlug = product.category?.slug ?? '';
  const rating = CATEGORY_RATING_MAP[categorySlug] ?? 4.7;

  return {
    ...product,
    image: product.images?.[0] || '',
    rating,
    reviewCount: Math.max(12, Math.round((product.soldCount || 0) * 0.18) || 24),
    isNew: Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 21,
    variants: Array.isArray(product.variantsJson) && product.variantsJson.length ? [{ type: 'capacity', options: product.variantsJson }] : [],
    features: product.tags || [],
  };
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Phương thức không được hỗ trợ' });
  }

  if (!hasDatabase) {
    return sendJson(res, 503, { error: 'Production chưa cấu hình DATABASE_URL nên chưa thể tải sản phẩm thật.' });
  }

  try {
    await ensureCoreCategories(prisma);

    const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
    const query = url.searchParams.get('query');
    const category = url.searchParams.get('category');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const minRating = url.searchParams.get('minRating');
    const sortBy = url.searchParams.get('sortBy');
    const brand = url.searchParams.get('brand');
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(48, Math.max(1, Number(url.searchParams.get('limit')) || 12));
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      deletedAt: null,
      AND: [
        query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { sku: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {},
        category ? { OR: [{ category: { slug: category } }, { category: { name: category } }] } : {},
        brand
          ? {
              OR: [
                {
                  brand: {
                    in: brand
                      .split(',')
                      .map((value) => value.trim())
                      .filter(Boolean),
                  },
                },
                {
                  subcategory: {
                    in: brand
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

    const orderBy: any =
      sortBy === 'price-asc'
        ? { price: 'asc' }
        : sortBy === 'price-desc'
          ? { price: 'desc' }
          : sortBy === 'popular'
            ? [{ soldCount: 'desc' }, { createdAt: 'desc' }]
            : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: { category: true }, orderBy, skip, take: limit }),
      prisma.product.count({ where }),
    ]);

    const requiredRating = minRating ? Number(minRating) : null;
    const data = products.map(serializeProduct).filter((product) => (requiredRating ? product.rating >= requiredRating : true));

    return sendJson(res, 200, {
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      message: 'Tải danh sách sản phẩm thành công',
    });
  } catch (error) {
    console.error('Products API error:', error);
    return sendJson(res, 500, { success: false, error: 'Không thể tải danh sách sản phẩm' });
  }
}

