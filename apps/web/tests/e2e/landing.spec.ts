import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('renders hero section with heading', async ({ page }) => {
        await expect(page).toHaveTitle(/Learnaxia/i);

        // Hero h2: "Öğrenmenin En Verimli Hali" exists inside the features section,
        // But the main hero h1 is "Öğrenmenin En Akıllı Yolu" or something similar from HeroSection.
        const hero = page.locator('h1');
        await expect(hero).toBeVisible();
    });

    test('displays CTA button "Ücretsiz Başla"', async ({ page }) => {
        const ctaButton = page.getByRole('link', { name: /Ücretsiz Başla/i }).first();
        await expect(ctaButton).toBeVisible();
    });

    test('shows feature section with 4 cards', async ({ page }) => {
        const featureSection = page.locator('#features');
        await expect(featureSection).toBeVisible();

        const cards = featureSection.locator('h3');
        await expect(cards).toHaveCount(4);
    });

    test('CTA link points to registration or dashboard', async ({ page }) => {
        const ctaLink = page.getByRole('link', { name: /Ücretsiz Başla/i }).first();
        await expect(ctaLink).toHaveAttribute('href', /\/login\?tab=register|\/dashboard/);
    });

    test('"Nasıl Çalışır?" button scrolls to how-it-works', async ({ page }) => {
        const howItWorksLink = page.getByRole('link', { name: /Nasıl Çalışır/i }).first();
        await expect(howItWorksLink).toBeVisible();
        await expect(howItWorksLink).toHaveAttribute('href', /#how-it-works/);
    });

    test('is responsive on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');

        const hero = page.locator('h1');
        await expect(hero).toBeVisible();
    });
});
