import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../_shared/auth.js';
import { ensureCoreCategories } from '../_shared/catalog.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Phương thức không được hỗ trợ' });
  }

  if (!hasDatabase) {
    return sendJson(res, 503, { error: 'Production chưa cấu hình DATABASE_URL nên chưa thể tải bộ lọc sản phẩm.' });
  }

  try {
    await ensureCoreCategories(prisma);

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

    const addChild = (categoryId: string, name: string | null, count: number) => {
      const cleanName = name?.trim();
      if (!cleanName) return;
      const current = childrenByCategory.get(categoryId) ?? new Map<string, number>();
      current.set(cleanName, (current.get(cleanName) || 0) + count);
      childrenByCategory.set(categoryId, current);
    };

    brandCounts.forEach((item: any) => addChild(item.categoryId, item.brand, item._count._all));
    subcategoryCounts.forEach((item: any) => addChild(item.categoryId, item.subcategory, item._count._all));

    const categoriesWithCounts = categories
      .map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        count: countsByCategory.get(category.id) || 0,
        children: Array.from(childrenByCategory.get(category.id)?.entries() || [])
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi')),
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
  } catch (error) {
    console.error('Product facets API error:', error);
    return sendJson(res, 500, { success: false, error: 'Không thể tải bộ lọc sản phẩm' });
  }
}
