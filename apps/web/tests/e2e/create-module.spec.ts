import { test, expect } from '@playwright/test';

test.describe('Module Creation Flow', () => {
    test('create page is accessible (may redirect to login)', async ({ page }) => {
        const response = await page.goto('/create');
        const status = response?.status() ?? 500;
        expect(status).toBeLessThan(500);
    });

    test('manual create page is accessible', async ({ page }) => {
        const response = await page.goto('/create/manual');
        const status = response?.status() ?? 500;
        expect(status).toBeLessThan(500);
    });
});
