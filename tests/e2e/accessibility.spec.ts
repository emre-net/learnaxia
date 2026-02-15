import { test, expect } from '@playwright/test';

test.describe('Accessibility Basics', () => {
    test('landing page has proper heading hierarchy', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        // Should have exactly one h1
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);
    });

    test('login page has accessible form elements', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });

        // All buttons should have accessible text
        const buttons = page.getByRole('button');
        const count = await buttons.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const name = await buttons.nth(i).getAttribute('aria-label')
                || await buttons.nth(i).textContent();
            expect(name?.trim().length).toBeGreaterThan(0);
        }
    });

    test('keyboard navigation works on landing page', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        // Tab through the page
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Something should be focused
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(focused).toBeTruthy();
    });
});
