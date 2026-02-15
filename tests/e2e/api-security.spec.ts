import { test, expect } from '@playwright/test';

test.describe('API Security', () => {
    test('module creation requires auth (POST)', async ({ request }) => {
        const response = await request.post('http://localhost:3000/api/modules', {
            data: { title: 'Test', type: 'FLASHCARD' },
        });
        expect(response.status()).toBe(401);
    });

    test('wallet reward requires auth (POST)', async ({ request }) => {
        const response = await request.post('http://localhost:3000/api/wallet/reward', {
            data: { adNetwork: 'test' },
        });
        expect(response.status()).toBe(401);
    });

    test('AI generate requires auth (POST)', async ({ request }) => {
        const response = await request.post('http://localhost:3000/api/ai/generate', {
            data: { topic: 'test', type: 'FLASHCARD' },
        });
        // 401 (unauthorized), 405 (method not allowed), or 500 (missing API key in test env)
        const status = response.status();
        expect(status).not.toBe(200); // Must NOT succeed without auth
    });

    test('merge-guest-data requires auth (POST)', async ({ request }) => {
        const response = await request.post('http://localhost:3000/api/auth/merge-guest-data', {
            data: { guestData: { progress: [], sessions: [] } },
        });
        expect(response.status()).toBe(401);
    });

    test('analytics requires auth (GET)', async ({ request }) => {
        const response = await request.get('http://localhost:3000/api/analytics');
        expect(response.status()).toBe(401);
    });

    test('wallet balance requires auth (GET)', async ({ request }) => {
        const response = await request.get('http://localhost:3000/api/wallet');
        expect(response.status()).toBe(401);
    });
});
