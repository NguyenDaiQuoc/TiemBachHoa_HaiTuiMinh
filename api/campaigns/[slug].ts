import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from '../_shared/auth.js';
import { hasDatabase, prisma } from '../_shared/prisma.js';
import { serializePublicProduct } from '../_shared/product-serializer.js';

const normalizeProductIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return typeof record.id === 'string' ? record.id : typeof record.productId === 'string' ? record.productId : '';
      }
      return '';
    })
    .filter((item): item is string => Boolean(item));
};

const serializeCampaign = (campaign: any) => ({
  id: campaign.id,
  name: campaign.name,
  slug: campaign.slug,
  type: campaign.type,
  description: campaign.description,
  bannerImage: campaign.bannerImage,
  productIds: normalizeProductIds(campaign.productIds),
  startsAt: campaign.startsAt,
  endsAt: campaign.endsAt,
  isActive: campaign.isActive,
  createdAt: campaign.createdAt,
  updatedAt: campaign.updatedAt,
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { success: false, error: 'Phương thức không được hỗ trợ' });
  }

  if (!hasDatabase) {
    return sendJson(res, 503, { success: false, error: 'Production chưa cấu hình DATABASE_URL nên chưa thể tải chiến dịch.' });
  }

  try {
    const url = new URL(req.url || '/', 'https://haituiminh.vercel.app');
    const slug = decodeURIComponent(url.pathname.split('/').pop() || '').trim();

    if (!slug) {
      return sendJson(res, 400, { success: false, error: 'Thiếu slug chiến dịch' });
    }

    const now = new Date();
    const campaign = await prisma.marketingCampaign.findFirst({
      where: {
        slug,
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      },
    });

    if (!campaign) {
      return sendJson(res, 404, { success: false, error: 'Chiến dịch không tồn tại, chưa bắt đầu hoặc đã kết thúc' });
    }

    const productIds = normalizeProductIds(campaign.productIds);
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds }, isActive: true, deletedAt: null },
          include: { category: true },
          orderBy: [{ soldCount: 'desc' }, { createdAt: 'desc' }],
        })
      : [];

    const byId = new Map(products.map((product) => [product.id, product]));
    const sortedProducts = productIds.map((id) => byId.get(id)).filter(Boolean);

    return sendJson(res, 200, {
      success: true,
      data: {
        campaign: serializeCampaign(campaign),
        products: sortedProducts.map(serializePublicProduct),
      },
    });
  } catch (error) {
    console.error('Campaign detail API error:', error);
    return sendJson(res, 500, { success: false, error: 'Không thể tải chiến dịch' });
  }
}
