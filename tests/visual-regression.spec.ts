import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Homepage', () => {
  test('Capture Homepage Light Mode', async ({ page }) => {
    await page.goto('/');
    // Force light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await expect(page).toHaveScreenshot('homepage-light.png', { fullPage: true });
  });

  test('Capture Homepage Dark Mode', async ({ page }) => {
    await page.goto('/');
    // Force dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await expect(page).toHaveScreenshot('homepage-dark.png', { fullPage: true });
  });
});

test.describe('Visual Regression - Search Page', () => {
  test('Capture Search Grid View', async ({ page }) => {
    await page.goto('/search?q=iPhone');
    await expect(page).toHaveScreenshot('search-grid.png');
  });
});

test.describe('Visual Regression - Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Capture Mobile Homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });
});
