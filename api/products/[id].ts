import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../_shared/auth.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';

const serializeProduct = (product: any) => {
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
    features: product.tags?.length ? product.tags : ['Sản phẩm chính hãng', 'Kiểm tra kỹ trước khi giao', 'Hỗ trợ đổi trả theo chính sách'],
    specifications,
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
    const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
    const id = decodeURIComponent(url.pathname.split('/').pop() || '');
    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }], isActive: true, deletedAt: null },
      include: { category: true },
    });

    if (!product) return sendJson(res, 404, { success: false, error: 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh' });
    return sendJson(res, 200, { success: true, data: serializeProduct(product) });
  } catch (error) {
    console.error('Product detail API error:', error);
    return sendJson(res, 500, { success: false, error: 'Không thể tải sản phẩm' });
  }
}

