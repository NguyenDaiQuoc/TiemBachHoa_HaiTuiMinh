import { test, expect } from '@playwright/test';

const fitgoProduct = {
  id: 'fitgo-1',
  name: 'Tai nghe Bluetooth FitGo',
  slug: 'tai-nghe-bluetooth-fitgo',
  price: 120000,
  description: 'Tai nghe Bluetooth FitGo test product',
  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
  categoryId: 'cat-tech',
  category: 'Công nghệ',
  stock: 5,
  soldCount: 0,
  isActive: true,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

test.describe('Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/products**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [fitgoProduct], meta: { total: 1, page: 1, limit: 12 } }),
      });
    });
    await page.route('**/api/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 'cat-tech', name: 'Công nghệ', slug: 'cong-nghe', isActive: true }] }),
      });
    });

    await page.goto('/');
  });

  test('should add a product to cart', async ({ page }) => {
    const addToCartButton = page.getByTestId('add-to-cart-tai-nghe-bluetooth-fitgo');
    await addToCartButton.scrollIntoViewIfNeeded();
    await addToCartButton.click();

    await expect(page.getByText(/Đã thêm vào giỏ hàng/i)).toBeVisible();
    await expect(page.locator('header').getByText('1')).toBeVisible();
  });

  test('should open cart drawer and show item', async ({ page }) => {
    const addToCartButton = page.getByTestId('add-to-cart-tai-nghe-bluetooth-fitgo');
    await addToCartButton.scrollIntoViewIfNeeded();
    await addToCartButton.click();

    await page.getByTestId('cart-trigger').click();

    await expect(page.getByRole('heading', { name: /GIỎ HÀNG/i })).toBeVisible();
    await expect(page.locator('h4').getByText('Tai nghe Bluetooth FitGo')).toBeVisible();
  });
});
