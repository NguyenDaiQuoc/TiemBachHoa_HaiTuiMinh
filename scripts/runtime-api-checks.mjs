import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = "http://localhost:3000";
const jwtSecret = process.env.JWT_SECRET || "dev-local-jwt-secret-change-me-2026-anti-phase9";
const results = [];

function record(id, status, detail) {
  results.push({ id, status, detail });
}

async function check(id, fn) {
  try {
    const detail = await fn();
    record(id, "PASS", detail || "OK");
  } catch (error) {
    record(id, "FAIL", error?.message || String(error));
  }
}

function cookieHeaderFrom(response) {
  const cookie = response.headers.get("set-cookie");
  return cookie ? cookie.split(";")[0] : "";
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body, cookie: cookieHeaderFrom(response) };
}

async function login(email = "user@haituiminh.com", password = "User@123456") {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.ok(result.body.token);
  return { token: result.body.token, cookie: result.cookie, user: result.body.user };
}

async function resetSeedUser() {
  const user = await prisma.user.findUnique({ where: { email: "user@haituiminh.com" }, include: { cart: true } });
  if (!user) return;
  if (user.cart) await prisma.cartItem.deleteMany({ where: { cartId: user.cart.id } });
  await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } });
  await prisma.order.deleteMany({ where: { userId: user.id } });
  await prisma.address.deleteMany({ where: { userId: user.id } });
  await prisma.user.update({
    where: { id: user.id },
    data: { username: null, phone: null, name: "Khach hang Runtime", isActive: true },
  });
}

async function productFixture() {
  const product = await prisma.product.findFirst({
    where: { isActive: true, deletedAt: null, stock: { gt: 10 } },
    orderBy: { createdAt: "asc" },
  });
  assert.ok(product, "No seeded active product with stock > 10");
  return product;
}

await resetSeedUser();

await check("API-AUTH-001", async () => {
  const email = `runtime-${Date.now()}@example.com`;
  const result = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "Runtime@123456", name: "Runtime User" }),
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  assert.ok(result.body.token);
  assert.ok(result.cookie.startsWith("refreshToken="));
  return "201 + token + refresh cookie";
});

await check("API-AUTH-002", async () => {
  const result = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "user@haituiminh.com", password: "User@123456", name: "Duplicate" }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-AUTH-003", async () => {
  const result = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "not-an-email", password: "User@123456", name: "Bad Email" }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-AUTH-004", async () => {
  const result = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "short-pass@example.com", password: "12345", name: "Short Pass" }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-AUTH-005", async () => {
  const result = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "short-name@example.com", password: "User@123456", name: "A" }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-AUTH-006", async () => {
  const email = `runtime-cart-${Date.now()}@example.com`;
  const result = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "Runtime@123456", name: "Runtime Cart" }),
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  const user = await prisma.user.findUnique({ where: { email }, include: { cart: true, wishlist: true } });
  assert.ok(user?.cart);
  assert.ok(user?.wishlist);
  return "user + cart + wishlist created";
});

await check("API-AUTH-007", async () => {
  await login();
  return "login 200 + token";
});

await check("API-AUTH-008", async () => {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "none@example.com", password: "User@123456" }),
  });
  assert.equal(result.response.status, 401);
  return JSON.stringify(result.body);
});

await check("API-AUTH-009", async () => {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "user@haituiminh.com", password: "Wrong@123456" }),
  });
  assert.equal(result.response.status, 401);
  return JSON.stringify(result.body);
});

await check("API-AUTH-010", async () => {
  await prisma.user.update({ where: { email: "user@haituiminh.com" }, data: { isActive: false } });
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "user@haituiminh.com", password: "User@123456" }),
  });
  await prisma.user.update({ where: { email: "user@haituiminh.com" }, data: { isActive: true } });
  assert.equal(result.response.status, 403);
  return JSON.stringify(result.body);
});

const auth = await login();

await check("API-AUTH-011", async () => {
  const result = await request("/api/auth/me", { headers: { Authorization: `Bearer ${auth.token}` } });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.email, "user@haituiminh.com");
  assert.equal(result.body.deletedAt, undefined);
  return "me returns safe user";
});

await check("API-AUTH-012", async () => {
  const result = await request("/api/auth/me");
  assert.equal(result.response.status, 401);
  return JSON.stringify(result.body);
});

await check("API-AUTH-013", async () => {
  const expired = jwt.sign({ id: auth.user.id, role: auth.user.role, email: auth.user.email }, jwtSecret, { expiresIn: -1 });
  const result = await request("/api/auth/me", { headers: { Authorization: `Bearer ${expired}` } });
  assert.equal(result.response.status, 401);
  return JSON.stringify(result.body);
});

await check("API-AUTH-014", async () => {
  const fresh = await login();
  const result = await request("/api/auth/refresh", { method: "POST", headers: { Cookie: fresh.cookie } });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.ok(result.body.token);
  assert.ok(result.cookie.startsWith("refreshToken="));
  return "refresh token rotated";
});

await check("API-AUTH-015", async () => {
  const expired = await prisma.refreshToken.create({
    data: { token: `expired-${Date.now()}`, userId: auth.user.id, expiresAt: new Date(Date.now() - 1000) },
  });
  const result = await request("/api/auth/refresh", { method: "POST", headers: { Cookie: `refreshToken=${expired.token}` } });
  assert.equal(result.response.status, 401);
  return JSON.stringify(result.body);
});

await check("API-AUTH-016", async () => {
  const fresh = await login();
  const result = await request("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: fresh.cookie, Authorization: `Bearer ${fresh.token}` },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.success, true);
  return "logout success";
});

await check("API-PROD-001", async () => {
  const result = await request("/api/products");
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.ok(Array.isArray(result.body.data));
  assert.ok(result.body.meta.total >= result.body.data.length);
  return `total=${result.body.meta.total}`;
});

await check("API-PROD-002", async () => {
  const result = await request("/api/products?query=tai%20nghe");
  assert.equal(result.response.status, 200);
  assert.ok(result.body.data.some((item) => /tai|nghe|bluetooth/i.test(`${item.name} ${item.description} ${item.sku}`)));
  return `matches=${result.body.data.length}`;
});

await check("API-PROD-003", async () => {
  const result = await request("/api/products?category=cong-nghe");
  assert.equal(result.response.status, 200);
  assert.ok(result.body.data.every((item) => item.category?.slug === "cong-nghe"));
  return `matches=${result.body.data.length}`;
});

await check("API-PROD-004", async () => {
  const result = await request("/api/products?minPrice=100000&maxPrice=500000");
  assert.equal(result.response.status, 200);
  assert.ok(result.body.data.every((item) => item.price >= 100000 && item.price <= 500000));
  return `matches=${result.body.data.length}`;
});

await check("API-PROD-005", async () => {
  const result = await request("/api/products?sortBy=price-asc&limit=48");
  assert.equal(result.response.status, 200);
  const prices = result.body.data.map((item) => item.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  return "price asc";
});

await check("API-PROD-006", async () => {
  const result = await request("/api/products?sortBy=price-desc&limit=48");
  assert.equal(result.response.status, 200);
  const prices = result.body.data.map((item) => item.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => b - a));
  return "price desc";
});

await check("API-PROD-007", async () => {
  const result = await request("/api/products?sortBy=popular&limit=48");
  assert.equal(result.response.status, 200);
  const sold = result.body.data.map((item) => item.soldCount);
  assert.deepEqual(sold, [...sold].sort((a, b) => b - a));
  return "popular desc";
});

await check("API-PROD-008", async () => {
  const p1 = await request("/api/products?page=1&limit=5");
  const p2 = await request("/api/products?page=2&limit=5");
  assert.equal(p1.response.status, 200);
  assert.equal(p2.response.status, 200);
  assert.equal(p2.body.meta.page, 2);
  assert.notDeepEqual(p1.body.data.map((item) => item.id), p2.body.data.map((item) => item.id));
  return "page 2 differs from page 1";
});

await check("API-PROD-009", async () => {
  const result = await request("/api/products?limit=1000");
  assert.equal(result.response.status, 200);
  assert.equal(result.body.meta.limit, 48);
  assert.ok(result.body.data.length <= 48);
  return "limit capped 48";
});

await check("API-PROD-010", async () => {
  const baseProduct = await productFixture();
  const timestamp = Date.now();
  const highRated = await prisma.product.create({
    data: {
      name: `Runtime rating high ${timestamp}`,
      slug: `runtime-rating-high-${timestamp}`,
      description: "Runtime high rating product",
      categoryId: baseProduct.categoryId,
      costPrice: 1000,
      price: 2000,
      stock: 4,
      images: [],
      isActive: true,
      reviews: {
        create: [
          { userId: auth.user.id, rating: 5, content: "Excellent runtime review" },
        ],
      },
    },
  });
  await prisma.product.create({
    data: {
      name: `Runtime rating low ${timestamp}`,
      slug: `runtime-rating-low-${timestamp}`,
      description: "Runtime low rating product",
      categoryId: baseProduct.categoryId,
      costPrice: 1000,
      price: 2000,
      stock: 4,
      images: [],
      isActive: true,
      reviews: {
        create: [
          { userId: auth.user.id, rating: 3, content: "Average runtime review" },
        ],
      },
    },
  });
  const result = await request(`/api/products?query=${encodeURIComponent(`Runtime rating high ${timestamp}`)}&minRating=4.9&limit=1&page=1`);
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.meta.total, 1);
  assert.equal(result.body.meta.totalPages, 1);
  assert.equal(result.body.data.length, 1);
  assert.equal(result.body.data[0].id, highRated.id);
  assert.equal(result.body.data[0].rating, 5);
  return "minRating filters before pagination and uses ProductReview average";
});

await check("API-PROD-011", async () => {
  const product = await productFixture();
  const result = await request(`/api/products/${product.id}`);
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.data.id, product.id);
  return product.id;
});

await check("API-PROD-012", async () => {
  const result = await request("/api/products/00000000-0000-0000-0000-000000000000");
  assert.equal(result.response.status, 404);
  return JSON.stringify(result.body);
});

await check("API-PROD-013", async () => {
  const product = await productFixture();
  const clone = await prisma.product.create({
    data: {
      name: `Deleted runtime ${Date.now()}`,
      slug: `deleted-runtime-${Date.now()}`,
      sku: `DEL-${Date.now()}`,
      description: "Deleted runtime product",
      categoryId: product.categoryId,
      costPrice: 1000,
      price: 2000,
      stock: 1,
      images: [],
      isActive: true,
      deletedAt: new Date(),
    },
  });
  const result = await request(`/api/products/${clone.id}`);
  assert.equal(result.response.status, 404);
  return "soft-deleted hidden";
});

await check("API-PROD-014", async () => {
  const result = await request("/api/products/brands");
  assert.equal(result.response.status, 200);
  assert.ok(Array.isArray(result.body.data));
  return `brands=${result.body.data.length}`;
});

await check("API-PROD-015", async () => {
  const result = await request("/api/products/facets");
  assert.equal(result.response.status, 200);
  assert.ok(Array.isArray(result.body.data.categories));
  assert.ok(Array.isArray(result.body.data.brands));
  return `categories=${result.body.data.categories.length}`;
});

await check("API-CART-001", async () => {
  const result = await request("/api/cart", { headers: { Authorization: `Bearer ${auth.token}` } });
  assert.equal(result.response.status, 200);
  assert.ok(result.body.data.id);
  return "cart returned";
});

await check("API-CART-002", async () => {
  const result = await request("/api/cart");
  assert.equal(result.response.status, 401);
  return JSON.stringify(result.body);
});

const product = await productFixture();

await check("API-CART-003", async () => {
  const result = await request("/api/cart/items", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ productId: product.id, quantity: 2 }),
  });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.data.quantity, 2);
  return "added qty=2";
});

await check("API-CART-004", async () => {
  const quantityThatFitsSingleRequestButExceedsCart = Math.max(1, product.stock - 1);
  const result = await request("/api/cart/items", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ productId: product.id, quantity: quantityThatFitsSingleRequestButExceedsCart }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-CART-005", async () => {
  const result = await request("/api/cart/items", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ productId: "not-uuid", quantity: 1 }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-CART-006", async () => {
  const result = await request("/api/cart/items", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ productId: product.id, quantity: 0 }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-CART-007", async () => {
  const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: auth.user.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: product.id } });
  const before = await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 1 } });
  const result = await request("/api/cart/items", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  assert.equal(result.response.status, 200);
  const after = await prisma.cartItem.findUnique({ where: { id: before.id } });
  assert.equal(after.quantity, before.quantity + 1);
  return "upsert incremented";
});

const ownCartItem = await prisma.cartItem.findFirstOrThrow({ where: { productId: product.id, cart: { userId: auth.user.id } } });

await check("API-CART-008", async () => {
  const result = await request(`/api/cart/items/${ownCartItem.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ quantity: 3 }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.quantity, 3);
  return "updated qty=3";
});

const otherEmail = `other-${Date.now()}@example.com`;
await prisma.user.create({
  data: {
    email: otherEmail,
    name: "Other User",
    password: "unused",
    cart: { create: { items: { create: { productId: product.id, quantity: 1 } } } },
    wishlist: { create: {} },
  },
});
const otherItem = await prisma.cartItem.findFirstOrThrow({ where: { cart: { user: { email: otherEmail } } } });

await check("API-CART-009", async () => {
  const result = await request(`/api/cart/items/${otherItem.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ quantity: 2 }),
  });
  assert.equal(result.response.status, 404);
  return "foreign cart item blocked";
});

await check("API-CART-010", async () => {
  const item = await prisma.cartItem.findFirstOrThrow({ where: { productId: product.id, cart: { userId: auth.user.id } } });
  const result = await request(`/api/cart/items/${item.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  assert.equal(result.response.status, 200);
  const after = await prisma.cartItem.findUnique({ where: { id: item.id } });
  assert.equal(after, null);
  return "deleted";
});

await check("API-CART-011", async () => {
  const result = await request(`/api/cart/items/${otherItem.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  assert.equal(result.response.status, 404);
  return "foreign cart item delete blocked";
});

await prisma.cartItem.deleteMany({ where: { cart: { userId: auth.user.id } } });
await prisma.cartItem.create({ data: { cartId: (await prisma.cart.findUniqueOrThrow({ where: { userId: auth.user.id } })).id, productId: product.id, quantity: 1 } });

await check("API-ORDER-001", async () => {
  const before = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
  const result = await request("/api/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ shippingAddress: "123 Nguyen Trai, Quan 1, TP HCM", shippingMethod: "STANDARD", paymentMethod: "COD" }),
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
  assert.equal(after.stock, before.stock - 1);
  const cartItems = await prisma.cartItem.count({ where: { cart: { userId: auth.user.id } } });
  assert.equal(cartItems, 0);
  return "order created, stock decremented, cart cleared";
});

await check("API-ORDER-002", async () => {
  const result = await request("/api/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ shippingAddress: "123 Nguyen Trai, Quan 1, TP HCM" }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await prisma.cartItem.create({ data: { cartId: (await prisma.cart.findUniqueOrThrow({ where: { userId: auth.user.id } })).id, productId: product.id, quantity: 1 } });

await check("API-ORDER-003", async () => {
  const result = await request("/api/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ shippingAddress: "ngan" }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-ORDER-004", async () => {
  const temp = await prisma.product.create({
    data: {
      name: `Runtime zero ${Date.now()}`,
      slug: `runtime-zero-${Date.now()}`,
      description: "Runtime zero stock product",
      categoryId: product.categoryId,
      costPrice: 1000,
      price: 2000,
      stock: 0,
      images: [],
      isActive: true,
    },
  });
  await prisma.cartItem.deleteMany({ where: { cart: { userId: auth.user.id } } });
  await prisma.cartItem.create({ data: { cartId: (await prisma.cart.findUniqueOrThrow({ where: { userId: auth.user.id } })).id, productId: temp.id, quantity: 1 } });
  const result = await request("/api/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ shippingAddress: "123 Nguyen Trai, Quan 1, TP HCM" }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-ORDER-005", async () => {
  const temp = await prisma.product.create({
    data: {
      name: `Runtime bank transfer ${Date.now()}`,
      slug: `runtime-bank-transfer-${Date.now()}`,
      description: "Runtime bank transfer stock reservation product",
      categoryId: product.categoryId,
      costPrice: 1000,
      price: 2000,
      stock: 1,
      images: [],
      isActive: true,
    },
  });
  await prisma.cartItem.deleteMany({ where: { cart: { userId: auth.user.id } } });
  await prisma.cartItem.create({ data: { cartId: (await prisma.cart.findUniqueOrThrow({ where: { userId: auth.user.id } })).id, productId: temp.id, quantity: 1 } });
  const result = await request("/api/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ shippingAddress: "123 Nguyen Trai, Quan 1, TP HCM", paymentMethod: "BANK_TRANSFER" }),
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  assert.equal(result.body.data.status, "PENDING");
  const after = await prisma.product.findUniqueOrThrow({ where: { id: temp.id } });
  assert.equal(after.stock, 0);
  return "bank transfer order created and stock reserved";
});

await check("API-ORDER-008", async () => {
  const temp = await prisma.product.create({
    data: {
      name: `Runtime expiring payment ${Date.now()}`,
      slug: `runtime-expiring-payment-${Date.now()}`,
      description: "Runtime payment timeout stock release product",
      categoryId: product.categoryId,
      costPrice: 1000,
      price: 2000,
      stock: 1,
      images: [],
      isActive: true,
    },
  });
  await prisma.cartItem.deleteMany({ where: { cart: { userId: auth.user.id } } });
  await prisma.cartItem.create({ data: { cartId: (await prisma.cart.findUniqueOrThrow({ where: { userId: auth.user.id } })).id, productId: temp.id, quantity: 1 } });

  const checkout = await request("/api/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ shippingAddress: "123 Nguyen Trai, Quan 1, TP HCM", paymentMethod: "BANK_TRANSFER" }),
  });
  assert.equal(checkout.response.status, 201, JSON.stringify(checkout.body));
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: temp.id } })).stock, 0);

  await prisma.order.update({
    where: { id: checkout.body.data.id },
    data: { createdAt: new Date(Date.now() - 11 * 60 * 1000) },
  });

  const expired = await request("/api/orders/expire", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ orderId: checkout.body.data.id }),
  });
  assert.equal(expired.response.status, 200, JSON.stringify(expired.body));
  assert.equal(expired.body.data.order.status, "CANCELLED");
  assert.equal(expired.body.data.order.paymentStatus, "FAILED");
  assert.equal(expired.body.data.restoredItems.length, 1);
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: temp.id } })).stock, 1);

  const idempotent = await request("/api/orders/expire", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ orderId: checkout.body.data.id }),
  });
  assert.equal(idempotent.response.status, 200, JSON.stringify(idempotent.body));
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: temp.id } })).stock, 1);
  return "expired pending payment released stock exactly once";
});

await check("API-ORDER-009", async () => {
  const temp = await prisma.product.create({
    data: {
      name: `Runtime bank webhook ${Date.now()}`,
      slug: `runtime-bank-webhook-${Date.now()}`,
      description: "Runtime bank webhook auto confirmation product",
      categoryId: product.categoryId,
      costPrice: 1000,
      price: 2000,
      stock: 1,
      images: [],
      isActive: true,
    },
  });
  const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: auth.user.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartItem.create({ data: { cartId: cart.id, productId: temp.id, quantity: 1 } });

  const checkout = await request("/api/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ shippingAddress: "123 Nguyen Trai, Quan 1, TP HCM", paymentMethod: "BANK_TRANSFER" }),
  });
  assert.equal(checkout.response.status, 201, JSON.stringify(checkout.body));
  assert.equal(checkout.body.data.status, "PENDING");
  assert.equal(checkout.body.data.paymentStatus, "UNPAID");
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: temp.id } })).stock, 0);

  const webhook = await request("/api/orders/bank-transfer/webhook", {
    method: "POST",
    body: JSON.stringify({
      transactionId: `runtime-bank-webhook-${Date.now()}`,
      amount: checkout.body.data.totalAmount,
      content: `Thanh toan don hang ${checkout.body.data.orderNumber}`,
    }),
  });
  assert.equal(webhook.response.status, 200, JSON.stringify(webhook.body));
  assert.equal(webhook.body.data.matched, true);
  assert.equal(webhook.body.data.order.status, "PROCESSING");
  assert.equal(webhook.body.data.order.paymentStatus, "PAID");

  const tracked = await request(`/api/orders/track?code=${encodeURIComponent(checkout.body.data.orderNumber)}`);
  assert.equal(tracked.response.status, 200, JSON.stringify(tracked.body));
  assert.equal(tracked.body.data.order.paymentStatus, "PAID");
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: temp.id } })).stock, 0);
  return "bank transfer webhook auto-confirmed payment and tracking sees PAID";
});

await check("API-ORDER-010", async () => {
  const temp = await prisma.product.create({
    data: {
      name: `Runtime 1000 shipping ${Date.now()}`,
      slug: `runtime-1000-shipping-${Date.now()}`,
      description: "Runtime 1000 VND shipping fee product",
      categoryId: product.categoryId,
      costPrice: 500,
      price: 1000,
      stock: 2,
      images: ["/favicon.svg"],
      isActive: true,
    },
  });
  const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: auth.user.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartItem.create({ data: { cartId: cart.id, productId: temp.id, quantity: 1 } });

  const checkout = await request("/api/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ shippingAddress: "123 Nguyen Trai, Quan 1, TP HCM", shippingMethod: "STANDARD", paymentMethod: "BANK_TRANSFER" }),
  });
  assert.equal(checkout.response.status, 201, JSON.stringify(checkout.body));
  assert.equal(checkout.body.data.totalAmount, 21000);
  assert.equal(checkout.body.data.shippingMethod, "STANDARD");
  return "1000 VND product keeps 20000 VND standard shipping";
});

await check("API-ORDER-011", async () => {
  await prisma.shopProfile.upsert({
    where: { id: "main-shop" },
    update: {},
    create: { id: "main-shop", name: "Hai Tui Minh", slug: "hai-tui-minh" },
  });
  const temp = await prisma.product.create({
    data: {
      name: `Runtime voucher shipping ${Date.now()}`,
      slug: `runtime-voucher-shipping-${Date.now()}`,
      description: "Runtime voucher checkout product",
      categoryId: product.categoryId,
      costPrice: 500,
      price: 1000,
      stock: 2,
      images: ["/favicon.svg"],
      isActive: true,
    },
  });
  const code = `RUNTIME${Date.now()}`;
  await prisma.voucher.create({
    data: {
      code,
      title: "Runtime voucher",
      type: "FIXED",
      value: 500,
      minOrderValue: 0,
      usageLimit: 10,
      isActive: true,
      shopId: "main-shop",
    },
  });
  const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: auth.user.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartItem.create({ data: { cartId: cart.id, productId: temp.id, quantity: 1 } });

  const validate = await request("/api/orders/voucher/validate", {
    method: "POST",
    body: JSON.stringify({ code, items: [{ id: temp.id, quantity: 1 }] }),
  });
  assert.equal(validate.response.status, 200, JSON.stringify(validate.body));
  assert.equal(validate.body.data.discount, 500);

  const checkout = await request("/api/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ shippingAddress: "123 Nguyen Trai, Quan 1, TP HCM", shippingMethod: "STANDARD", paymentMethod: "BANK_TRANSFER", voucherCode: code }),
  });
  assert.equal(checkout.response.status, 201, JSON.stringify(checkout.body));
  assert.equal(checkout.body.data.totalAmount, 20500);
  return "voucher discounted subtotal before shipping";
});

await check("API-ORDER-012", async () => {
  const temp = await prisma.product.upsert({
    where: { slug: "test" },
    update: {
      name: "test",
      price: 2000,
      stock: 20,
      images: ["/favicon.svg"],
      isActive: true,
      deletedAt: null,
    },
    create: {
      name: "test",
      slug: "test",
      description: "Runtime special banking test product",
      categoryId: product.categoryId,
      costPrice: 500,
      price: 2000,
      stock: 20,
      images: ["/favicon.svg"],
      isActive: true,
    },
  });
  const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: auth.user.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartItem.create({ data: { cartId: cart.id, productId: temp.id, quantity: 1 } });

  const checkout = await request("/api/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ shippingAddress: "123 Nguyen Trai, Quan 1, TP HCM", shippingMethod: "STANDARD", paymentMethod: "BANK_TRANSFER", voucherCode: "TEST500" }),
  });
  assert.equal(checkout.response.status, 201, JSON.stringify(checkout.body));
  assert.equal(checkout.body.data.totalAmount, 2000);
  assert.equal(checkout.body.data.shippingFee, 0);
  assert.equal(checkout.body.data.checkoutMeta.voucherDiscount, 0);
  assert.equal(checkout.body.data.checkoutMeta.testCheckoutOnly, true);
  return "slug test checkout total stays exactly 2000 with no shipping or voucher discount";
});

await prisma.cartItem.deleteMany({ where: { cart: { userId: auth.user.id } } });
await prisma.cartItem.create({ data: { cartId: (await prisma.cart.findUniqueOrThrow({ where: { userId: auth.user.id } })).id, productId: product.id, quantity: 1 } });

await check("API-ORDER-006", async () => {
  await request("/api/orders/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ shippingAddress: "456 Le Loi, Quan 3, TP HCM", paymentMethod: "COD" }),
  });
  const result = await request("/api/orders", { headers: { Authorization: `Bearer ${auth.token}` } });
  assert.equal(result.response.status, 200);
  assert.ok(Array.isArray(result.body.data));
  assert.ok(result.body.data.length >= 1);
  return `orders=${result.body.data.length}`;
});

await check("API-ORDER-007", async () => {
  const other = await prisma.user.findUniqueOrThrow({ where: { email: otherEmail } });
  const foreignOrder = await prisma.order.create({
    data: {
      userId: other.id,
      orderNumber: `FOREIGN-${Date.now()}`,
      totalAmount: 1000,
      shippingAddress: "123 Foreign Address",
      shippingMethod: "STANDARD",
      items: { create: [{ productId: product.id, name: product.name, quantity: 1, price: 1000, image: "" }] },
    },
  });
  const result = await request(`/api/orders/${foreignOrder.id}`, { headers: { Authorization: `Bearer ${auth.token}` } });
  assert.equal(result.response.status, 404);
  return "foreign order blocked";
});

await check("API-USER-001", async () => {
  const result = await request("/api/user/profile", { headers: { Authorization: `Bearer ${auth.token}` } });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.password, undefined);
  return "profile safe";
});

await check("API-USER-002", async () => {
  const result = await request("/api/user/profile", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ name: "Runtime Name" }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.name, "Runtime Name");
  return "name updated";
});

await check("API-USER-003", async () => {
  await prisma.user.update({ where: { email: otherEmail }, data: { username: `taken-${Date.now()}` } });
  const other = await prisma.user.findUniqueOrThrow({ where: { email: otherEmail } });
  const result = await request("/api/user/profile", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ username: other.username }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-USER-004", async () => {
  const result = await request("/api/user/profile", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ phone: "12345" }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-USER-005", async () => {
  const result = await request("/api/user/profile/password", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ currentPassword: "User@123456", newPassword: "User@123456" }),
  });
  assert.equal(result.response.status, 200);
  return "password accepted";
});

await check("API-USER-006", async () => {
  const result = await request("/api/user/profile/password", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ currentPassword: "Wrong@123456", newPassword: "User@123456" }),
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await prisma.address.deleteMany({ where: { userId: auth.user.id } });

await check("API-USER-007", async () => {
  const result = await request("/api/user/addresses", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ receiverName: "Runtime User", phone: "0900000000", province: "HCM", district: "Q1", ward: "Ward 1", detail: "123 Runtime Street" }),
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.data.isDefault, true);
  return "first address default";
});

await check("API-USER-008", async () => {
  const address = await prisma.address.findFirstOrThrow({ where: { userId: auth.user.id, isDefault: true } });
  const result = await request(`/api/user/addresses/${address.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  assert.equal(result.response.status, 400);
  return JSON.stringify(result.body);
});

await check("API-USER-009", async () => {
  const other = await prisma.user.findUniqueOrThrow({ where: { email: otherEmail } });
  const address = await prisma.address.create({
    data: { userId: other.id, receiverName: "Other", phone: "0900000001", province: "HCM", district: "Q1", ward: "Ward 2", detail: "456 Other Street" },
  });
  const result = await request(`/api/user/addresses/${address.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  assert.equal(result.response.status, 404);
  return "foreign address delete blocked";
});

await check("API-USER-010", async () => {
  const response = await fetch(`${baseUrl}/api/user/notifications/stream?token=${encodeURIComponent(auth.token)}`);
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("content-type").includes("text/event-stream"));
  await response.body.cancel();
  return "SSE stream opened";
});

await check("SEC-001", async () => {
  const bad = jwt.sign({ id: auth.user.id, role: auth.user.role, email: auth.user.email }, "wrong-secret", { expiresIn: "15m" });
  const result = await request("/api/auth/me", { headers: { Authorization: `Bearer ${bad}` } });
  assert.equal(result.response.status, 401);
  return "wrong secret rejected";
});

await check("SEC-002", async () => {
  const decoded = jwt.decode(auth.token);
  assert.equal(decoded.exp - decoded.iat, 900);
  return `ttl=${decoded.exp - decoded.iat}`;
});

await check("SEC-006", async () => {
  const other = await prisma.user.findUniqueOrThrow({ where: { email: otherEmail } });
  const foreignOrder = await prisma.order.create({
    data: {
      userId: other.id,
      orderNumber: `SEC-FOREIGN-${Date.now()}`,
      totalAmount: 1000,
      shippingAddress: "123 Foreign Address",
      shippingMethod: "STANDARD",
      items: { create: [{ productId: product.id, name: product.name, quantity: 1, price: 1000, image: "" }] },
    },
  });
  const result = await request(`/api/orders/${foreignOrder.id}`, { headers: { Authorization: `Bearer ${auth.token}` } });
  assert.equal(result.response.status, 404);
  return "order IDOR blocked";
});

await check("SEC-007", async () => {
  const result = await request(`/api/cart/items/${otherItem.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ quantity: 2 }),
  });
  assert.equal(result.response.status, 404);
  return "cart IDOR blocked";
});

await check("SEC-008", async () => {
  const result = await request("/api/admin/products", { headers: { Authorization: `Bearer ${auth.token}` } });
  assert.equal(result.response.status, 403);
  return "customer forbidden";
});

await check("SEC-009", async () => {
  const result = await request("/api/health");
  assert.equal(result.response.headers.get("x-content-type-options"), "nosniff");
  assert.ok(result.response.headers.get("x-frame-options"));
  assert.ok(result.response.headers.get("content-security-policy"));
  return "helmet headers present; CSP enabled";
});

await check("SEC-013", async () => {
  const burst = await Promise.all(Array.from({ length: 105 }, () => request("/api/products?limit=1")));
  const statuses = burst.map((item) => item.response.status);
  assert.ok(statuses.includes(429), `No 429 in statuses ${statuses.join(",")}`);
  return `429 count=${statuses.filter((status) => status === 429).length}`;
});

console.log(JSON.stringify({ summary: {
  total: results.length,
  passed: results.filter((item) => item.status === "PASS").length,
  failed: results.filter((item) => item.status === "FAIL").length,
}, results }, null, 2));

await prisma.$disconnect();
