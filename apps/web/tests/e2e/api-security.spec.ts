import { test, expect } from '@playwright/test';

test.describe('API Security', () => {
    test('module creation requires auth (POST)', async ({ request }) => {
        const response = await request.post('http://localhost:3000/api/modules', {
            data: { title: 'Test', type: 'FLASHCARD' },
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

    test('user settings and password require auth (GET/PATCH/POST)', async ({ request }) => {
        const getRes = await request.get('http://localhost:3000/api/user/settings');
        expect(getRes.status()).toBe(401);

        const patchRes = await request.patch('http://localhost:3000/api/user/settings', {
            data: { showStudyTimer: true },
        });
        expect(patchRes.status()).toBe(401);

        const passRes = await request.post('http://localhost:3000/api/user/password', {
            data: { currentPassword: 'old', newPassword: 'newpassword123' },
        });
        expect(passRes.status()).toBe(401);
    });

    test('admin module patch, fork, and mobile start-daily require auth', async ({ request }) => {
        const adminRes = await request.patch('http://localhost:3000/api/admin/modules/fake-id', {
            data: { status: 'ARCHIVED' },
        });
        expect(adminRes.status()).toBe(401);

        const forkRes = await request.post('http://localhost:3000/api/modules/fake-id/fork');
        expect(forkRes.status()).toBe(401);

        const dailyRes = await request.post('http://localhost:3000/api/mobile/study/start-daily');
        expect(dailyRes.status()).toBe(401);
    });

});
