import { test, expect, type Page } from '@playwright/test';

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
  test('Capture Search Grid View', async ({ page }) => {
    await page.goto('/search?q=Tai%20nghe%20Bluetooth%20FitGo');
    await hideVolatileUi(page);
    await waitForSearchReady(page);
    await expect(page).toHaveScreenshot('search-grid.png', { maxDiffPixels: 250, timeout: 15000 });
  });
});

test.describe('Visual Regression - Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Capture Mobile Homepage', async ({ page }) => {
    await page.goto('/');
    await hideVolatileUi(page);
    await waitForHomepageReady(page);
    await expect(page).toHaveScreenshot('homepage-mobile.png', { timeout: 15000 });
  });
});
