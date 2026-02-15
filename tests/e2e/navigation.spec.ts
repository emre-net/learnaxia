import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
    test('landing page is accessible at root', async ({ page }) => {
        const response = await page.goto('/');
        expect(response?.status()).toBeLessThan(400);
    });

    test('login page is accessible', async ({ page }) => {
        const response = await page.goto('/login');
        expect(response?.status()).toBeLessThan(400);
    });

    test('404 page shows for unknown routes', async ({ page }) => {
        const response = await page.goto('/this-page-does-not-exist-12345');
        expect(response?.status()).toBe(404);
    });

    test('API health check - modules endpoint exists', async ({ page }) => {
        const response = await page.goto('/api/modules');
        const status = response?.status() ?? 500;
        expect([200, 401]).toContain(status);
    });

    test('API health check - analytics endpoint exists', async ({ page }) => {
        const response = await page.goto('/api/analytics');
        const status = response?.status() ?? 500;
        expect([200, 401]).toContain(status);
    });
});
