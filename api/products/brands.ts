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
    return sendJson(res, 503, { error: 'Production chưa cấu hình DATABASE_URL nên chưa thể tải thương hiệu.' });
  }

  try {
    await ensureCoreCategories(prisma);

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
  } catch (error) {
    console.error('Product brands API error:', error);
    return sendJson(res, 500, { success: false, error: 'Không thể tải danh sách thương hiệu' });
  }
}
