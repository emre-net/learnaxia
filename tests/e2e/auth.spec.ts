import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('login page renders with heading', async ({ page }) => {
        await page.goto('/login');

        // h1: "Hesabına Giriş Yap"
        const heading = page.locator('h1');
        await expect(heading).toBeVisible();
        await expect(heading).toContainText(/Hesabına Giriş Yap/i);
    });

    test('shows Google sign-in button', async ({ page }) => {
        await page.goto('/login');

        // Button text: "Google ile Giriş Yap"
        const googleBtn = page.getByRole('button', { name: /Google ile Giriş Yap/i });
        await expect(googleBtn).toBeVisible();
    });

    test('shows terms and privacy links', async ({ page }) => {
        await page.goto('/login');

        const termsLink = page.getByRole('link', { name: /Kullanım Şartları/i });
        const privacyLink = page.getByRole('link', { name: /Gizlilik Politikası/i });
        await expect(termsLink).toBeVisible();
        await expect(privacyLink).toBeVisible();
    });

    test('login page has correct title', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveTitle(/Giriş Yap/i);
    });
});
