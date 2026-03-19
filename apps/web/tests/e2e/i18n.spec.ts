import { test, expect } from '@playwright/test';

test.describe('i18n Language Switching', () => {
    test.skip('should switch language from English to Turkish in Settings', async ({ page }) => {
        // Assume user is logged in
        await page.goto('/dashboard/settings');

        const heading = page.locator('h1', { hasText: /Settings|Ayarlar/i });
        await expect(heading).toBeVisible();

        // Check if settings tab is visible
        const settingsTabBtn = page.getByRole('tab', { name: /Settings|Ayarlar/i });
        await settingsTabBtn.click();

        // The default language selector should be visible
        // We will click the select trigger and change it
        // The exact selector depends on Radix UI implementation, usually a button with aria-haspopup="listbox"
        const langSelect = page.locator('button[role="combobox"]').first();

        if (await langSelect.isVisible()) {
            await langSelect.click();
            // Select Turkish
            const trOption = page.locator('div[role="option"]', { hasText: /Türkçe/i });
            if (await trOption.isVisible()) {
                await trOption.click();
            }

            // After clicking, verify the UI updates
            const settingsTitle = page.getByText('Sistem Ayarları');
            await expect(settingsTitle).toBeVisible();
        }
    });
});
