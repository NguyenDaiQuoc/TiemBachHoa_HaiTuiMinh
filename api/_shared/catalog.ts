import type { PrismaClient } from '@prisma/client';

const SELLABLE_CATEGORY_SLUGS = ['cong-nghe', 'gia-dung', 'my-pham'] as const;
const RECEIPT_CATEGORY_SLUG = 'san-pham-nhap-kho';

const CORE_CATEGORIES = [
  {
    name: 'Đồ công nghệ',
    slug: 'cong-nghe',
    description: 'Thiết bị và phụ kiện công nghệ chính hãng.',
  },
  {
    name: 'Đồ gia dụng',
    slug: 'gia-dung',
    description: 'Sản phẩm gia dụng tiện ích cho cuộc sống hiện đại.',
  },
  {
    name: 'Mỹ phẩm',
    slug: 'my-pham',
    description: 'Mỹ phẩm chính hãng, chăm sóc da và làm đẹp mỗi ngày.',
  },
];

type PrismaLike = Pick<PrismaClient, 'category'>;

export const ensureCoreCategories = async (prisma: PrismaLike) => {
  const categories = await Promise.all(
    CORE_CATEGORIES.map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name, description: category.description, isActive: true, deletedAt: null },
        create: { ...category, isActive: true },
      })
    )
  );

  await prisma.category
    .updateMany({
      where: { slug: RECEIPT_CATEGORY_SLUG },
      data: { isActive: false },
    })
    .catch(() => undefined);

  return categories;
};

export const getSellableCategories = async (prisma: PrismaLike) => {
  await ensureCoreCategories(prisma);

  return prisma.category.findMany({
    where: {
      slug: { in: [...SELLABLE_CATEGORY_SLUGS] },
      isActive: true,
      deletedAt: null,
    },
    orderBy: { name: 'asc' },
  });
};

export const sellableCategorySlugs = SELLABLE_CATEGORY_SLUGS;
