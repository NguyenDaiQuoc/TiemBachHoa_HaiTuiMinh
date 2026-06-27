import { test, expect } from '@playwright/test';

test.describe('Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should add a product to cart', async ({ page }) => {
    const addToCartButton = page.getByTestId('add-to-cart-tai-nghe-bluetooth-fitgo');
    await addToCartButton.scrollIntoViewIfNeeded();
    await addToCartButton.click();
    
    // Check for toast
    await expect(page.getByText(/Đã thêm vào giỏ hàng/i)).toBeVisible();
    
    // Check cart counter in header
    const cartCounter = page.locator('header').getByText('1');
    await expect(cartCounter).toBeVisible();
  });

  test('should open cart drawer and show item', async ({ page }) => {
    const addToCartButton = page.getByTestId('add-to-cart-tai-nghe-bluetooth-fitgo');
    await addToCartButton.scrollIntoViewIfNeeded();
    await addToCartButton.click();

    await page.getByTestId('cart-trigger').click();
    
    // Check drawer title
    await expect(page.getByRole('heading', { name: /GIỎ HÀNG/i })).toBeVisible();
    
    // Check if item is in drawer
    await expect(page.locator('h4').getByText('Tai nghe Bluetooth FitGo')).toBeVisible();
  });
});
