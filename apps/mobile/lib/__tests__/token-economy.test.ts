import { TOKEN_CONFIG, t, getTokenTransactionLabel } from '@learnaxia/shared';
import { isInsufficientTokensError } from '../../hooks/use-token-wallet';
import { RewardedAdService } from '../../services/rewarded-ad.service';

jest.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: null, isLoading: false }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => undefined),
        removeItem: jest.fn(async () => undefined),
        getAllKeys: jest.fn(async () => []),
        multiRemove: jest.fn(async () => undefined),
    },
}));

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(async () => null),
    setItemAsync: jest.fn(async () => undefined),
    deleteItemAsync: jest.fn(async () => undefined),
}));

describe('AI Token Economy & Rewarded Ads Contract Tests', () => {
    it('defines positive AI action costs within daily free allowance', () => {
        expect(TOKEN_CONFIG.DAILY_FREE_TOKENS).toBe(30);
        expect(TOKEN_CONFIG.REWARDED_AD_BONUS).toBe(20);
        expect(TOKEN_CONFIG.MAX_DAILY_REWARDED_ADS).toBe(8);

        for (const cost of Object.values(TOKEN_CONFIG.COSTS)) {
            expect(cost).toBeGreaterThan(0);
            expect(cost).toBeLessThanOrEqual(TOKEN_CONFIG.DAILY_FREE_TOKENS);
        }
    });

    it('provides tr and en translations for token wallet and rewarded ads', () => {
        expect(t('tokens.walletTitle', 'tr')).toBe('AI Jeton Cüzdanı');
        expect(t('tokens.walletTitle', 'en')).toBe('AI Token Wallet');
        expect(t('tokens.watchAdCta', 'tr', { amount: 20 })).toContain('+20 Jeton');
    });

    it('detects 402 INSUFFICIENT_TOKENS errors reliably', () => {
        expect(isInsufficientTokensError({ response: { status: 402 } })).toBe(true);
        expect(isInsufficientTokensError({ response: { status: 400, data: { code: 'INSUFFICIENT_TOKENS' } } })).toBe(true);
        expect(isInsufficientTokensError({ response: { status: 500 } })).toBe(false);
        expect(isInsufficientTokensError(null)).toBe(false);
    });

    it('formats token transaction labels consistently in tr and en', () => {
        expect(getTokenTransactionLabel('DAILY_FREE', 'AI_MODULE', 'tr')).toContain('AI Modül Üretimi');
        expect(getTokenTransactionLabel('REWARDED_AD', null, 'en')).toBe('Rewarded Ad Bonus');
        expect(getTokenTransactionLabel('REFUND', 'AI_NOTE', 'tr')).toContain('Otomatik AI İadesi');
    });

    it('degrades gracefully when native Google Mobile Ads binary is not present in Jest', async () => {
        expect(typeof RewardedAdService.isNativeAvailable()).toBe('boolean');
        const res = await RewardedAdService.showRewardedAd('test-user-id');
        expect(res.earned).toBe(false);
    });
});
