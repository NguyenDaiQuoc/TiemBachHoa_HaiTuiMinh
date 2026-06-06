import type { PrismaClient } from '@prisma/client';

const SELLABLE_CATEGORY_SLUGS = ['cong-nghe', 'gia-dung', 'my-pham'] as const;
const RECEIPT_CATEGORY_SLUG = 'san-pham-nhap-kho';

const CORE_CATEGORIES = [
  {
    name: '?? c?ng ngh?',
    slug: 'cong-nghe',
    description: 'Thi?t b? v? ph? ki?n c?ng ngh? ch?nh h?ng.',
    image: 'https://images.unsplash.com/photo-1549463512-2051282a77bb?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: '?? gia d?ng',
    slug: 'gia-dung',
    description: 'S?n ph?m gia d?ng ti?n ?ch cho cu?c s?ng hi?n ??i.',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'M? ph?m',
    slug: 'my-pham',
    description: 'M? ph?m ch?nh h?ng, ch?m s?c da v? l?m ??p m?i ng?y.',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop',
  },
];

type PrismaLike = Pick<PrismaClient, 'category'>;

export const ensureCoreCategories = async (prisma: PrismaLike) => {
  const categories = await Promise.all(
    CORE_CATEGORIES.map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name, description: category.description, image: category.image, isActive: true, deletedAt: null },
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
