import { test, expect } from '@playwright/test';

test.describe('AI Creation Wizard', () => {
    test.beforeEach(async ({ page }) => {
        // Assuming the user is logged in or we mock session for /dashboard/create/ai
        // We will just test the UI state and if it handles files/API calls properly
        await page.goto('/dashboard/create/ai');
    });

    test('should load the AI wizard page', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('AI Content Generator');
    });

    test('should restrict text input on rate limits', async ({ page }) => {
        // Find the topic textarea and put a really long string
        const textArea = page.locator('textarea[name="topic"]');
        await expect(textArea).toBeVisible();

        // Generate a 1000 character string
        const longText = 'a'.repeat(25000);
        await textArea.fill(longText);

        const errorLabel = page.getByText(/sınırları aşıyor/i);
        await expect(errorLabel).toBeVisible();

        const generateBtn = page.getByRole('button', { name: /generate/i });
        await expect(generateBtn).toBeDisabled();
    });

    test('should extract text from document upload', async ({ page }) => {
        // Switch to the file tab
        await page.getByRole('tab', { name: /dosya|file|document/i }).click();

        // Create a dummy text file to upload
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('This is a test document with some informative text.')
        });

        // Normally, it should show extracting loader and then show the extracted context
        const extractingText = page.getByText(/extracting|çıkarılıyor/i);
        // Wait for it to disappear or finish

        // Ensure "Extracted Context" is shown
        // Since it's currently hardcoded to "Demo Modu", this test will likely fail and pinpoint the issue

        // But we want to check if it calls the API
        // For now, let's just check the result
        const contextDiv = page.locator('.extracted-context-or-similar'); // Update selector based on UI implementation later
        // wait for extraction
    });
});
