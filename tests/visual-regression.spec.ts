import { test, expect, type Page } from '@playwright/test';

const visualProduct = {
  id: 'fitgo-1',
  name: 'Tai nghe Bluetooth FitGo',
  slug: 'tai-nghe-bluetooth-fitgo',
  price: 120000,
  description: 'Tai nghe Bluetooth FitGo test product',
  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
  categoryId: 'cat-tech',
  category: { id: 'cat-tech', name: 'Công nghệ', slug: 'cong-nghe' },
  stock: 5,
  soldCount: 12,
  rating: 4.8,
  reviewCount: 24,
  isActive: true,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

const visualCategories = [
  { id: 'cat-tech', name: 'Công nghệ', slug: 'cong-nghe', isActive: true, count: 1, children: [], brands: [], subcategories: [] },
  { id: 'cat-cosmetics', name: 'Mỹ phẩm', slug: 'my-pham', isActive: true, count: 0, children: [], brands: [], subcategories: [] },
  { id: 'cat-home', name: 'Đồ gia dụng', slug: 'gia-dung', isActive: true, count: 0, children: [], brands: [], subcategories: [] },
];

async function mockCatalogApi(page: Page) {
  await page.route('**/api/products**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/facets')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { categories: visualCategories, brands: [], total: 1 } }),
      });
      return;
    }
    if (url.pathname.endsWith('/brands')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [visualProduct], meta: { total: 1, page: 1, limit: 12, totalPages: 1 } }),
    });
  });

  await page.route('**/api/categories**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: visualCategories }),
    });
  });
}

async function waitForHomepageReady(page: Page) {
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
}

async function hideVolatileUi(page: Page) {
  await page.addStyleTag({
    content: `
      .fixed.bottom-3.right-3,
      .md\\:bottom-6.md\\:right-6 {
        display: none !important;
      }
    `,
  });
}

async function waitForSearchReady(page: Page) {
  await expect(page.getByTestId('product-card-tai-nghe-bluetooth-fitgo')).toBeVisible({ timeout: 15000 });
}

test.describe('Visual Regression - Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogApi(page);
  });

  test('Capture Homepage Light Mode', async ({ page }) => {
    await page.goto('/');
    await hideVolatileUi(page);
    await waitForHomepageReady(page);
    // Force light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await expect(page).toHaveScreenshot('homepage-light.png', { timeout: 15000 });
  });

  test('Capture Homepage Dark Mode', async ({ page }) => {
    await page.goto('/');
    await hideVolatileUi(page);
    await waitForHomepageReady(page);
    // Force dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await expect(page).toHaveScreenshot('homepage-dark.png', { timeout: 15000 });
  });
});

test.describe('Visual Regression - Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogApi(page);
  });

  test('Capture Search Grid View', async ({ page }) => {
    await page.goto('/search?q=Tai%20nghe%20Bluetooth%20FitGo');
    await hideVolatileUi(page);
    await waitForSearchReady(page);
    await expect(page).toHaveScreenshot('search-grid.png', { maxDiffPixels: 250, timeout: 15000 });
  });
});

test.describe('Visual Regression - Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await mockCatalogApi(page);
  });

  test('Capture Mobile Homepage', async ({ page }) => {
    await page.goto('/');
    await hideVolatileUi(page);
    await waitForHomepageReady(page);
    await expect(page).toHaveScreenshot('homepage-mobile.png', { timeout: 15000 });
  });
});
