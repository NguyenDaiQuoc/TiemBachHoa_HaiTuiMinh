import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  const userPassword = await bcrypt.hash('User@123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@haituiminh.com' },
    update: {
      password: adminPassword,
      name: 'Quản trị viên Hai Tụi Mình',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@haituiminh.com',
      name: 'Quản trị viên Hai Tụi Mình',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@haituiminh.com' },
    update: {
      password: userPassword,
      name: 'Khách hàng Hai Tụi Mình',
      role: 'CUSTOMER',
      membershipPoints: 240,
      isActive: true,
    },
    create: {
      email: 'user@haituiminh.com',
      name: 'Khách hàng Hai Tụi Mình',
      password: userPassword,
      role: 'CUSTOMER',
      membershipPoints: 240,
      isActive: true,
      cart: { create: {} },
      wishlist: { create: {} },
    },
  });

  await prisma.shopProfile.upsert({
    where: { id: 'main-shop' },
    update: {
      name: 'Tiệm Bách Hóa Hai Tụi Mình',
      slug: 'hai-tui-minh',
      description: 'Cửa hàng chuyên mỹ phẩm chính hãng, đồ gia dụng tiện ích và đồ công nghệ với mức giá cạnh tranh.',
    },
    create: {
      id: 'main-shop',
      name: 'Tiệm Bách Hóa Hai Tụi Mình',
      slug: 'hai-tui-minh',
      description: 'Cửa hàng chuyên mỹ phẩm chính hãng, đồ gia dụng tiện ích và đồ công nghệ với mức giá cạnh tranh.',
    },
  });

  const cosmeticsCategory = await prisma.category.upsert({
    where: { slug: 'my-pham' },
    update: {
      name: 'Mỹ phẩm',
      description: 'Mỹ phẩm chính hãng, chăm sóc da và làm đẹp mỗi ngày.',
    },
    create: {
      name: 'Mỹ phẩm',
      slug: 'my-pham',
      description: 'Mỹ phẩm chính hãng, chăm sóc da và làm đẹp mỗi ngày.',
    },
  });

  const householdCategory = await prisma.category.upsert({
    where: { slug: 'gia-dung' },
    update: {
      name: 'Đồ gia dụng',
      description: 'Sản phẩm gia dụng tiện ích cho cuộc sống hiện đại.',
    },
    create: {
      name: 'Đồ gia dụng',
      slug: 'gia-dung',
      description: 'Sản phẩm gia dụng tiện ích cho cuộc sống hiện đại.',
    },
  });

  const techCategory = await prisma.category.upsert({
    where: { slug: 'cong-nghe' },
    update: {
      name: 'Đồ công nghệ',
      description: 'Thiết bị công nghệ chính hãng với giá dễ tiếp cận.',
    },
    create: {
      name: 'Đồ công nghệ',
      slug: 'cong-nghe',
      description: 'Thiết bị công nghệ chính hãng với giá dễ tiếp cận.',
    },
  });

  const serum = await prisma.product.upsert({
    where: { slug: 'serum-phuc-hoi-ban-dem' },
    update: {
      sku: 'COS-SERUM-001',
      costPrice: 185000,
      price: 329000,
      promotionalPrice: 299000,
      stock: 40,
      initialStock: 80,
      reorderLevel: 25,
      soldCount: 12,
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80'],
      variantsJson: [
        {
          id: 'serum-30ml',
          name: 'Dung tích',
          value: '30ml',
          sku: 'COS-SERUM-30',
          costPrice: 185000,
          price: 329000,
          promotionalPrice: 299000,
          stock: 24,
          initialStock: 48,
          images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80'],
        },
        {
          id: 'serum-50ml',
          name: 'Dung tích',
          value: '50ml',
          sku: 'COS-SERUM-50',
          costPrice: 255000,
          price: 429000,
          promotionalPrice: 399000,
          stock: 16,
          initialStock: 32,
          images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80'],
        },
      ],
    },
    create: {
      name: 'Serum phục hồi ban đêm',
      slug: 'serum-phuc-hoi-ban-dem',
      sku: 'COS-SERUM-001',
      description: 'Serum phục hồi da với bảng thành phần lành tính, phù hợp dùng mỗi tối.',
      costPrice: 185000,
      price: 329000,
      promotionalPrice: 299000,
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80'],
      categoryId: cosmeticsCategory.id,
      stock: 40,
      initialStock: 80,
      reorderLevel: 25,
      soldCount: 12,
      variantsJson: [
        {
          id: 'serum-30ml',
          name: 'Dung tích',
          value: '30ml',
          sku: 'COS-SERUM-30',
          costPrice: 185000,
          price: 329000,
          promotionalPrice: 299000,
          stock: 24,
          initialStock: 48,
          images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80'],
        },
        {
          id: 'serum-50ml',
          name: 'Dung tích',
          value: '50ml',
          sku: 'COS-SERUM-50',
          costPrice: 255000,
          price: 429000,
          promotionalPrice: 399000,
          stock: 16,
          initialStock: 32,
          images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80'],
        },
      ],
    },
  });

  const fryer = await prisma.product.upsert({
    where: { slug: 'noi-chien-mini-da-nang' },
    update: {
      sku: 'HOME-AIR-001',
      costPrice: 790000,
      price: 1190000,
      promotionalPrice: 1090000,
      stock: 18,
      initialStock: 36,
      reorderLevel: 14,
      soldCount: 7,
      images: ['https://images.unsplash.com/photo-1585515656973-24d0c5d55b66?auto=format&fit=crop&w=900&q=80'],
      variantsJson: [],
    },
    create: {
      name: 'Nồi chiên mini đa năng',
      slug: 'noi-chien-mini-da-nang',
      sku: 'HOME-AIR-001',
      description: 'Thiết kế gọn, phù hợp gia đình nhỏ và người ở trọ cần nấu nhanh.',
      costPrice: 790000,
      price: 1190000,
      promotionalPrice: 1090000,
      images: ['https://images.unsplash.com/photo-1585515656973-24d0c5d55b66?auto=format&fit=crop&w=900&q=80'],
      categoryId: householdCategory.id,
      stock: 18,
      initialStock: 36,
      reorderLevel: 14,
      soldCount: 7,
      variantsJson: [],
    },
  });

  const earbuds = await prisma.product.upsert({
    where: { slug: 'tai-nghe-bluetooth-fitgo' },
    update: {
      sku: 'TECH-EAR-001',
      costPrice: 245000,
      price: 459000,
      promotionalPrice: 429000,
      stock: 26,
      initialStock: 52,
      reorderLevel: 18,
      soldCount: 19,
      images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=900&q=80'],
      variantsJson: [
        {
          id: 'earbuds-black',
          name: 'Màu sắc',
          value: 'Đen',
          sku: 'TECH-EAR-BLK',
          costPrice: 245000,
          price: 459000,
          promotionalPrice: 429000,
          stock: 14,
          initialStock: 28,
          images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=900&q=80'],
        },
        {
          id: 'earbuds-white',
          name: 'Màu sắc',
          value: 'Trắng',
          sku: 'TECH-EAR-WHT',
          costPrice: 245000,
          price: 459000,
          promotionalPrice: 429000,
          stock: 12,
          initialStock: 24,
          images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=900&q=80'],
        },
      ],
    },
    create: {
      name: 'Tai nghe Bluetooth FitGo',
      slug: 'tai-nghe-bluetooth-fitgo',
      sku: 'TECH-EAR-001',
      description: 'Kết nối ổn định, pin lâu, phù hợp học tập và làm việc hằng ngày.',
      costPrice: 245000,
      price: 459000,
      promotionalPrice: 429000,
      images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=900&q=80'],
      categoryId: techCategory.id,
      stock: 26,
      initialStock: 52,
      reorderLevel: 18,
      soldCount: 19,
      variantsJson: [
        {
          id: 'earbuds-black',
          name: 'Màu sắc',
          value: 'Đen',
          sku: 'TECH-EAR-BLK',
          costPrice: 245000,
          price: 459000,
          promotionalPrice: 429000,
          stock: 14,
          initialStock: 28,
          images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=900&q=80'],
        },
        {
          id: 'earbuds-white',
          name: 'Màu sắc',
          value: 'Trắng',
          sku: 'TECH-EAR-WHT',
          costPrice: 245000,
          price: 459000,
          promotionalPrice: 429000,
          stock: 12,
          initialStock: 24,
          images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=900&q=80'],
        },
      ],
    },
  });

  await prisma.voucher.upsert({
    where: { code: 'HAITUIMINH10' },
    update: {
      title: 'Giảm 10% cho đơn từ 499K',
      description: 'Áp dụng cho toàn bộ đơn hàng đủ điều kiện trong tháng này.',
      type: 'PERCENT',
      value: 10,
      minOrderValue: 499000,
      maxDiscount: 100000,
      usageLimit: 200,
      isActive: true,
      shopId: 'main-shop',
    },
    create: {
      code: 'HAITUIMINH10',
      title: 'Giảm 10% cho đơn từ 499K',
      description: 'Áp dụng cho toàn bộ đơn hàng đủ điều kiện trong tháng này.',
      type: 'PERCENT',
      value: 10,
      minOrderValue: 499000,
      maxDiscount: 100000,
      usageLimit: 200,
      isActive: true,
      shopId: 'main-shop',
    },
  });

  await prisma.voucher.upsert({
    where: { code: 'FREESHIP50K' },
    update: {
      title: 'Giảm thẳng 50K',
      description: 'Khuyến mãi cho khách hàng quay lại mua sắm.',
      type: 'FIXED',
      value: 50000,
      minOrderValue: 299000,
      usageLimit: 100,
      isActive: true,
      shopId: 'main-shop',
    },
    create: {
      code: 'FREESHIP50K',
      title: 'Giảm thẳng 50K',
      description: 'Khuyến mãi cho khách hàng quay lại mua sắm.',
      type: 'FIXED',
      value: 50000,
      minOrderValue: 299000,
      usageLimit: 100,
      isActive: true,
      shopId: 'main-shop',
    },
  });

  await prisma.stockReceipt.deleteMany({
    where: {
      code: {
        in: ['PN-SEED-001', 'PN-SEED-002', 'PN-SEED-003'],
      },
    },
  });

  await prisma.stockReceipt.createMany({
    data: [
      {
        code: 'PN-SEED-001',
        mode: 'NEW_PRODUCT',
        supplier: 'Kho mỹ phẩm nội địa',
        note: 'Lô khởi tạo dữ liệu seed',
      },
      {
        code: 'PN-SEED-002',
        mode: 'NEW_PRODUCT',
        supplier: 'Nhà cung cấp gia dụng',
        note: 'Lô khởi tạo dữ liệu seed',
      },
      {
        code: 'PN-SEED-003',
        mode: 'NEW_PRODUCT',
        supplier: 'Đối tác công nghệ',
        note: 'Lô khởi tạo dữ liệu seed',
      },
    ],
  });

  const receipts = await prisma.stockReceipt.findMany({
    where: { code: { in: ['PN-SEED-001', 'PN-SEED-002', 'PN-SEED-003'] } },
    select: { id: true, code: true },
  });

  const receiptIdByCode = Object.fromEntries(receipts.map((receipt) => [receipt.code, receipt.id]));

  await prisma.stockReceiptItem.deleteMany({
    where: {
      receiptId: {
        in: Object.values(receiptIdByCode),
      },
    },
  });

  await prisma.stockReceiptItem.createMany({
    data: [
      {
        receiptId: receiptIdByCode['PN-SEED-001'],
        productId: serum.id,
        quantity: 80,
        costPrice: 185000,
        salePrice: 329000,
      },
      {
        receiptId: receiptIdByCode['PN-SEED-002'],
        productId: fryer.id,
        quantity: 36,
        costPrice: 790000,
        salePrice: 1190000,
      },
      {
        receiptId: receiptIdByCode['PN-SEED-003'],
        productId: earbuds.id,
        quantity: 52,
        costPrice: 245000,
        salePrice: 459000,
      },
    ],
  });

  await prisma.appNotification.deleteMany({
    where: {
      OR: [{ userId: admin.id }, { userId: user.id }],
    },
  });

  await prisma.appNotification.createMany({
    data: [
      {
        userId: admin.id,
        scope: 'ADMIN',
        type: 'SYSTEM',
        title: 'Bảng quản trị đã sẵn sàng',
        message: 'Bạn có thể theo dõi đơn hàng, sản phẩm, khách hàng và các thông báo vận hành tại đây.',
        link: '/admin',
      },
      {
        userId: admin.id,
        scope: 'ADMIN',
        type: 'ORDER',
        title: 'Có đơn hàng cần xác nhận',
        message: 'Một số đơn hàng đang ở trạng thái chờ xác nhận, hãy kiểm tra khu vực đơn hàng.',
        link: '/admin/orders',
      },
      {
        userId: user.id,
        scope: 'USER',
        type: 'SUCCESS',
        title: 'Chào mừng bạn đến với Hai Tụi Mình',
        message: 'Tài khoản của bạn đã sẵn sàng. Theo dõi đơn hàng và nhận ưu đãi mới nhất ngay tại đây.',
        link: '/profile',
      },
      {
        userId: user.id,
        scope: 'USER',
        type: 'PROMOTION',
        title: 'Ưu đãi thành viên mới',
        message: 'Voucher giảm giá đầu tiên của bạn đã sẵn sàng trong mục tài khoản.',
        link: '/profile/settings',
      },
    ],
  });

  console.log('Seed completed successfully.');
  console.log(`Admin: ${admin.email} / Admin@123456`);
  console.log(`User: ${user.email} / User@123456`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
