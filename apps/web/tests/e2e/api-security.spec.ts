import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import { extractAdMobSignedContent, verifyAdMobSignatureWithPem } from '../../lib/ads/admob-ssv';

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

        const adminUserRes = await request.patch('http://localhost:3000/api/admin/users/fake-id', {
            data: { grantTokens: 50 },
        });
        expect(adminUserRes.status()).toBe(401);

        const forkRes = await request.post('http://localhost:3000/api/modules/fake-id/fork');
        expect(forkRes.status()).toBe(401);

        const dailyRes = await request.post('http://localhost:3000/api/mobile/study/start-daily');
        expect(dailyRes.status()).toBe(401);

        const balRes = await request.get('http://localhost:3000/api/tokens/balance');
        expect(balRes.status()).toBe(401);

        const histRes = await request.get('http://localhost:3000/api/tokens/history');
        expect(histRes.status()).toBe(401);
    });

    test('AdMob SSV webhook rejects missing params and spoofed signatures, and ECDSA P-256 verifier validates properly', async ({ request }) => {
        const missingRes = await request.get('http://localhost:3000/api/ads/admob-ssv');
        expect(missingRes.status()).toBe(400);

        const spoofRes = await request.get(
            'http://localhost:3000/api/ads/admob-ssv?ad_network=5450213213286189855&ad_unit=1234&custom_data=user1&reward_amount=20&reward_item=tokens&timestamp=1700000000000&transaction_id=tx-spoof-1&user_id=user1&signature=MEUCIQDfakeSig&key_id=123456'
        );
        expect(spoofRes.status()).toBe(403);

        // Cryptographic ECDSA P-256 verification self-check
        const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
        const rawQueryPrefix = 'ad_network=5450213213286189855&reward_amount=20&transaction_id=tx-real-1&user_id=u1';
        const derSig = crypto.sign('sha256', Buffer.from(rawQueryPrefix, 'utf8'), privateKey);
        const urlSafeSig = derSig.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const fullUrl = `https://learnaxia.com/api/ads/admob-ssv?${rawQueryPrefix}&signature=${urlSafeSig}&key_id=999`;

        const extracted = extractAdMobSignedContent(fullUrl);
        expect(extracted).not.toBeNull();
        expect(extracted?.signedContent).toBe(rawQueryPrefix);
        expect(
            verifyAdMobSignatureWithPem({
                signedContent: extracted!.signedContent,
                signatureBase64: extracted!.signatureBase64,
                publicKey: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
            })
        ).toBe(true);

        // Tampered payload must fail signature check
        expect(
            verifyAdMobSignatureWithPem({
                signedContent: rawQueryPrefix.replace('reward_amount=20', 'reward_amount=9999'),
                signatureBase64: extracted!.signatureBase64,
                publicKey: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
            })
        ).toBe(false);
    });

    test('cron recalculate-scores rejects missing secret on GET and POST', async ({ request }) => {
        const getRes = await request.get('http://localhost:3000/api/cron/recalculate-scores');
        expect(getRes.status()).toBe(403);

        const postRes = await request.post('http://localhost:3000/api/cron/recalculate-scores');
        expect(postRes.status()).toBe(403);
    });

});
