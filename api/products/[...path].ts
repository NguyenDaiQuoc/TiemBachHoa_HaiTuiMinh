import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../_shared/auth.js';
import { ensureCoreCategories } from '../_shared/catalog.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';

const CATEGORY_RATING_MAP: Record<string, number> = {
  'my-pham': 4.8,
  'gia-dung': 4.5,
  'cong-nghe': 4.6,
};

const getRoutePath = (req: IncomingMessage) => {
  const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
  const rewritePath = url.searchParams.get('path') || url.searchParams.get('...path');
  if (rewritePath) return rewritePath.replace(/^\/+/, '') || 'index';

  const [, afterProducts = ''] = url.pathname.split('/api/products/');
  if (afterProducts) return decodeURIComponent(afterProducts).replace(/^\/+/, '') || 'index';
  return 'index';
};

const serializeListProduct = (product: any) => {
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

const serializeDetailProduct = (product: any) => {
  const categoryName = product.category?.name || 'Danh mục';
  const specifications = [
    { label: 'Danh mục', value: categoryName },
    product.subcategory ? { label: 'Loại sản phẩm', value: product.subcategory } : null,
    product.brand ? { label: 'Hãng', value: product.brand } : null,
    product.sku ? { label: 'SKU', value: product.sku } : null,
  ].filter(Boolean);

  return {
    ...product,
    image: product.images?.[0] || '',
    rating: 4.7,
    reviewCount: Math.max(12, Math.round((product.soldCount || 0) * 0.18) || 24),
    isNew: Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 21,
    variants: Array.isArray(product.variantsJson) && product.variantsJson.length ? [{ type: 'capacity', options: product.variantsJson }] : [],
    features: product.tags?.length
      ? product.tags
      : ['Sản phẩm chính hãng', 'Kiểm tra kỹ trước khi giao', 'Hỗ trợ đổi trả theo chính sách'],
    specifications,
  };
};

async function listProducts(req: IncomingMessage, res: ServerResponse) {
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

  const brandValues = brand
    ? brand
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

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
      brandValues.length ? { OR: [{ brand: { in: brandValues } }, { subcategory: { in: brandValues } }] } : {},
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
  const data = products.map(serializeListProduct).filter((product) => (requiredRating ? product.rating >= requiredRating : true));

  return sendJson(res, 200, {
    success: true,
    data,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    message: 'Tải danh sách sản phẩm thành công',
  });
}

async function getBrands(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
  const category = url.searchParams.get('category');
  const where = {
    isActive: true,
    deletedAt: null,
    brand: { not: null },
    ...(category ? { category: { OR: [{ slug: category }, { name: category }] } } : {}),
  };

  const grouped = await prisma.product.groupBy({
    by: ['brand'],
    where,
    _count: { _all: true },
    orderBy: { brand: 'asc' },
  });

  const brands = grouped
    .filter((item: any) => item.brand?.trim())
    .map((item: any) => ({ name: item.brand, count: item._count._all }));

  return sendJson(res, 200, { success: true, data: brands, message: 'Tải danh sách thương hiệu thành công' });
}

async function getFacets(res: ServerResponse) {
  const baseWhere = { isActive: true, deletedAt: null };
  const [categories, categoryCounts, brandCounts, subcategoryCounts, total] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: 'asc' } }),
    prisma.product.groupBy({ by: ['categoryId'], where: baseWhere, _count: { _all: true } }),
    prisma.product.groupBy({ by: ['categoryId', 'brand'], where: { ...baseWhere, brand: { not: null } }, _count: { _all: true } }),
    prisma.product.groupBy({ by: ['categoryId', 'subcategory'], where: { ...baseWhere, subcategory: { not: null } }, _count: { _all: true } }),
    prisma.product.count({ where: baseWhere }),
  ]);

  const countsByCategory = new Map(categoryCounts.map((item: any) => [item.categoryId, item._count._all]));
  const childrenByCategory = new Map<string, Map<string, number>>();
  const brandsByCategory = new Map<string, Map<string, number>>();
  const subcategoriesByCategory = new Map<string, Map<string, number>>();

  const addScoped = (map: Map<string, Map<string, number>>, categoryId: string, name: string | null, count: number) => {
    const cleanName = name?.trim();
    if (!cleanName) return;
    const current = map.get(categoryId) ?? new Map<string, number>();
    current.set(cleanName, (current.get(cleanName) || 0) + count);
    map.set(categoryId, current);
  };

  const addChild = (categoryId: string, name: string | null, count: number) => addScoped(childrenByCategory, categoryId, name, count);
  const toOptions = (map?: Map<string, number>) =>
    Array.from(map?.entries() || [])
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));

  brandCounts.forEach((item: any) => {
    addChild(item.categoryId, item.brand, item._count._all);
    addScoped(brandsByCategory, item.categoryId, item.brand, item._count._all);
  });
  subcategoryCounts.forEach((item: any) => {
    addChild(item.categoryId, item.subcategory, item._count._all);
    addScoped(subcategoriesByCategory, item.categoryId, item.subcategory, item._count._all);
  });

  const categoriesWithCounts = categories
    .map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      count: countsByCategory.get(category.id) || 0,
      children: toOptions(childrenByCategory.get(category.id)),
      brands: toOptions(brandsByCategory.get(category.id)),
      subcategories: toOptions(subcategoriesByCategory.get(category.id)),
    }))
    .filter((category: any) => category.count > 0 || category.children.length > 0);

  const brands = Array.from(
    brandCounts.reduce((map: Map<string, number>, item: any) => {
      const name = item.brand?.trim();
      if (name) map.set(name, (map.get(name) || 0) + item._count._all);
      return map;
    }, new Map<string, number>())
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));

  return sendJson(res, 200, {
    success: true,
    data: { categories: categoriesWithCounts, brands, total },
    message: 'Tải bộ lọc sản phẩm thành công',
  });
}

async function getProductDetail(id: string, res: ServerResponse) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }], isActive: true, deletedAt: null },
    include: { category: true },
  });

  if (!product) return sendJson(res, 404, { success: false, error: 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh' });
  return sendJson(res, 200, { success: true, data: serializeDetailProduct(product) });
}

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

    const routePath = getRoutePath(req);
    if (routePath === 'index') return listProducts(req, res);
    if (routePath === 'brands') return getBrands(req, res);
    if (routePath === 'facets') return getFacets(res);
    return getProductDetail(decodeURIComponent(routePath.split('/')[0] || ''), res);
  } catch (error) {
    console.error('Products API error:', error);
    return sendJson(res, 500, { success: false, error: 'Không thể tải dữ liệu sản phẩm' });
  }
}
