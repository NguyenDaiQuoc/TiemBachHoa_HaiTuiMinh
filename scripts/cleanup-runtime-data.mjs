import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  where: { OR: [{ email: { startsWith: "runtime-" } }, { email: { startsWith: "other-" } }] },
  select: { id: true },
});
const userIds = users.map((user) => user.id);

await prisma.orderItem.deleteMany({ where: { order: { userId: { in: userIds } } } });
await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: userIds } } } });
await prisma.address.deleteMany({ where: { userId: { in: userIds } } });
await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
await prisma.wishlist.deleteMany({ where: { userId: { in: userIds } } });
await prisma.cart.deleteMany({ where: { userId: { in: userIds } } });
await prisma.user.deleteMany({ where: { id: { in: userIds } } });

await prisma.voucher.deleteMany({ where: { code: { startsWith: "RUNTIME" } } });

const products = await prisma.product.findMany({
  where: {
    OR: [
      { slug: { startsWith: "deleted-runtime-" } },
      { slug: { startsWith: "runtime-zero-" } },
      { slug: { startsWith: "runtime-bank-transfer-" } },
      { slug: { startsWith: "runtime-expiring-payment-" } },
      { slug: { startsWith: "runtime-bank-webhook-" } },
      { slug: { startsWith: "runtime-1000-shipping-" } },
      { slug: { startsWith: "runtime-voucher-shipping-" } },
      { slug: { startsWith: "runtime-rating-" } },
    ],
  },
  select: { id: true },
});
const productIds = products.map((product) => product.id);

await prisma.cartItem.deleteMany({ where: { productId: { in: productIds } } });
await prisma.orderItem.deleteMany({ where: { productId: { in: productIds } } });
await prisma.product.deleteMany({ where: { id: { in: productIds } } });

await prisma.cartItem.deleteMany({ where: { cart: { user: { email: "user@haituiminh.com" } } } });
await prisma.address.deleteMany({ where: { user: { email: "user@haituiminh.com" } } });
await prisma.user.update({
  where: { email: "user@haituiminh.com" },
  data: { name: "Khach hang Hai Tui Minh", username: null, phone: null, isActive: true },
});

console.log(JSON.stringify({ deletedUsers: userIds.length, deletedProducts: productIds.length }));
await prisma.$disconnect();
