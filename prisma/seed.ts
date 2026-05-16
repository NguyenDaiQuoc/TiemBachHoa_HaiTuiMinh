import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@haityiminh.vn' },
    update: {},
    create: {
      email: 'admin@haityiminh.vn',
      name: 'Admin Hai Tụi Mình',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // User
  await prisma.user.upsert({
    where: { email: 'demo@haityiminh.vn' },
    update: {},
    create: {
      email: 'demo@haityiminh.vn',
      name: 'Người dùng Demo',
      password: userPassword,
      role: 'CUSTOMER',
    },
  });

  // Categories
  const decorCategory = await prisma.category.upsert({
    where: { slug: 'decor' },
    update: {},
    create: {
      name: 'Trang trí',
      slug: 'decor',
      description: 'Phụ kiện decor không gian sống',
    }
  });

  const skincareCategory = await prisma.category.upsert({
    where: { slug: 'skincare' },
    update: {},
    create: {
      name: 'Chăm sóc da',
      slug: 'skincare',
      description: 'Mỹ phẩm hữu cơ thuần khiết',
    }
  });

  // Products
  await prisma.product.upsert({
    where: { slug: 'nen-thom-da-lat-chieu-mua' },
    update: {},
    create: {
      name: 'Nến Thơm Đà Lạt Chiều Mưa',
      slug: 'nen-thom-da-lat-chieu-mua',
      description: 'Hương thơm nồng nàn của rừng thông sau cơn mưa.',
      price: 350000,
      images: ['https://images.unsplash.com/photo-1602928292900-5c31776ceee3?q=80&w=2070&auto=format&fit=crop'],
      categoryId: decorCategory.id,
      stock: 45,
    }
  });

  await prisma.product.upsert({
    where: { slug: 'tinh-dau-buoi-organic' },
    update: {},
    create: {
      name: 'Tinh Dầu Bưởi Organic',
      slug: 'tinh-dau-buoi-organic',
      description: 'Kích thích mọc tóc và thư giãn.',
      price: 180000,
      images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800'],
      categoryId: skincareCategory.id,
      stock: 120,
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
