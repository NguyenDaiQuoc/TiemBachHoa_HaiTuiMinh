import { test, expect } from '@playwright/test';

test.describe('Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should add a product to cart', async ({ page }) => {
    // Wait for product grid to load
    const productCard = page.locator('div:has-text("Nến Thơm Đà Lạt")').first();
    
    // Hover to reveal button
    await productCard.hover();
    
    const addToCartButton = productCard.getByRole('button', { name: /THÊM VÀO GIỎ/i });
    await addToCartButton.click();
    
    // Check for toast
    await expect(page.getByText(/Đã thêm .* vào giỏ hàng/i)).toBeVisible();
    
    // Check cart counter in header
    const cartCounter = page.locator('header').getByText('1');
    await expect(cartCounter).toBeVisible();
  });

  test('should open cart drawer and show item', async ({ page }) => {
    // Add item first
    const productCard = page.locator('div:has-text("Nến Thơm Đà Lạt")').first();
    await productCard.hover();
    await productCard.getByRole('button', { name: /THÊM VÀO GIỎ/i }).click();

    // Click cart icon (it's inside the CartDrawer trigger)
    await page.locator('header').getByRole('button', { name: /shopping bag/i }).click();
    
    // Check drawer title
    await expect(page.getByText('Giỏ hàng của bạn')).toBeVisible();
    
    // Check if item is in drawer
    await expect(page.locator('h4').getByText('Nến Thơm Đà Lạt')).toBeVisible();
  });
});
