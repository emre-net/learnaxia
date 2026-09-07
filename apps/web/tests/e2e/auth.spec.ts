import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('login page renders with heading', async ({ page }) => {
        await page.goto('/login');

        // h3: "Tekrar Hoş Geldin"
        const heading = page.locator('h3:has-text("Tekrar Hoş Geldin")').or(page.locator('h1:has-text("Tekrar Hoş Geldin")')).or(page.locator('.text-2xl:has-text("Tekrar Hoş Geldin")'));
        await expect(heading.first()).toBeVisible();
    });

    test('shows Google sign-in button', async ({ page }) => {
        await page.goto('/login');

        // Button text: "Google ile Devam Et"
        const googleBtn = page.getByRole('button', { name: /Google ile Devam Et/i });
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
