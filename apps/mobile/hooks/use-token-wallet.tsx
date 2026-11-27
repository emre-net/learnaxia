import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TOKEN_CONFIG, TokenBalanceSummary, extractApiErrorMessage } from '@learnaxia/shared';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RewardedAdService } from '@/services/rewarded-ad.service';

interface TokenWalletContextValue {
    wallet: TokenBalanceSummary | null;
    loading: boolean;
    watchingAd: boolean;
    refreshWallet: () => Promise<TokenBalanceSummary | null>;
    watchRewardedAd: () => Promise<boolean>;
    handleAiError: (err: unknown, fallbackMessage: string) => void;
}

const TokenWalletContext = createContext<TokenWalletContextValue>({
    wallet: null,
    loading: false,
    watchingAd: false,
    refreshWallet: async () => null,
    watchRewardedAd: async () => false,
    handleAiError: () => {},
});

export function isInsufficientTokensError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const obj = err as { response?: { status?: number; data?: { code?: string } } };
    return obj.response?.status === 402 || obj.response?.data?.code === 'INSUFFICIENT_TOKENS';
}

export function TokenWalletProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<TokenBalanceSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [watchingAd, setWatchingAd] = useState(false);

    const refreshWallet = useCallback(async (): Promise<TokenBalanceSummary | null> => {
        if (!user?.id) {
            setWallet(null);
            return null;
        }
        setLoading(true);
        try {
            const res = await api.get<TokenBalanceSummary>('/tokens/balance');
            setWallet(res.data);
            return res.data;
        } catch {
            return null;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            refreshWallet();
        } else {
            setWallet(null);
        }
    }, [user?.id, refreshWallet]);

    const watchRewardedAd = useCallback(async (): Promise<boolean> => {
        if (!user?.id || watchingAd) return false;

        if (wallet && wallet.dailyAdsRemaining <= 0) {
            Alert.alert(
                'Günlük Reklam Sınırı',
                `Bugünlük en fazla ${wallet.maxDailyAds} ödüllü reklam hakkını tamamladınız. Yarın tekrar deneyin!`
            );
            return false;
        }

        setWatchingAd(true);
        const beforeBonus = wallet?.bonusTokens ?? 0;
        const beforeAdsCount = wallet?.dailyAdsWatched ?? 0;

        try {
            const adResult = await RewardedAdService.showRewardedAd(user.id);

            if (adResult.nativeUnavailable && __DEV__) {
                // Non-production developer sandbox fallback when AdMob native binary isn't linked (e.g., Expo Go)
                try {
                    const devRes = await api.post<{ ok: boolean; wallet?: TokenBalanceSummary }>('/ads/dev-reward');
                    if (devRes.data?.wallet) {
                        setWallet(devRes.data.wallet);
                    } else {
                        await refreshWallet();
                    }
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Jeton Kazanıldı', `+${TOKEN_CONFIG.REWARDED_AD_BONUS} bonus jeton hesabınıza tanımlandı (Dev Sandbox).`);
                    return true;
                } catch (devErr) {
                    Alert.alert('Reklam Hazır Değil', extractApiErrorMessage(devErr, 'Ödüllü reklam şu an kullanılamıyor.'));
                    return false;
                }
            }

            if (!adResult.earned) {
                if (adResult.error) {
                    Alert.alert('Reklam Yüklenemedi', adResult.error);
                } else if (adResult.cancelled) {
                    Alert.alert('Ödül Verilmedi', 'Bonus jeton kazanmak için reklamı sonuna kadar izlemelisiniz.');
                }
                return false;
            }

            // Poll briefly for Google SSV webhook completion
            for (let attempt = 0; attempt < 5; attempt++) {
                await new Promise<void>((r) => setTimeout(r, 1200));
                const fresh = await refreshWallet();
                if (
                    fresh &&
                    (fresh.bonusTokens > beforeBonus || fresh.dailyAdsWatched > beforeAdsCount)
                ) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Jeton Eklendi', `+${TOKEN_CONFIG.REWARDED_AD_BONUS} bonus jeton bakiyenize yansıdı!`);
                    return true;
                }
            }

            Alert.alert(
                'Ödül İşleniyor',
                'Reklam tamamlama sinyali Google AdMob tarafından sunucuya iletiliyor; bakiyeniz birkaç saniye içinde güncellenecektir.'
            );
            return true;
        } catch (err) {
            Alert.alert('Hata', extractApiErrorMessage(err, 'Reklam ödülü işlenemedi.'));
            return false;
        } finally {
            setWatchingAd(false);
        }
    }, [user?.id, watchingAd, wallet, refreshWallet]);

    const handleAiError = useCallback(
        (err: unknown, fallbackMessage: string) => {
            if (isInsufficientTokensError(err)) {
                const errData = (err as { response?: { data?: { wallet?: TokenBalanceSummary; required?: number } } })
                    .response?.data;
                if (errData?.wallet) {
                    setWallet(errData.wallet);
                }
                const required = errData?.required ?? 10;
                const available = errData?.wallet?.totalAvailable ?? wallet?.totalAvailable ?? 0;

                Alert.alert(
                    'Yetersiz AI Jetonu',
                    `Bu AI işlemi için ${required} jeton gerekiyor (mevcut: ${available}). Kısa bir ödüllü reklam izleyerek +${TOKEN_CONFIG.REWARDED_AD_BONUS} bonus jeton kazanabilirsiniz.`,
                    [
                        { text: 'Vazgeç', style: 'cancel' },
                        {
                            text: `Reklam İzle (+${TOKEN_CONFIG.REWARDED_AD_BONUS})`,
                            onPress: () => {
                                watchRewardedAd();
                            },
                        },
                    ]
                );
                return;
            }

            Alert.alert('Hata', extractApiErrorMessage(err, fallbackMessage));
        },
        [wallet?.totalAvailable, watchRewardedAd]
    );

    return (
        <TokenWalletContext.Provider
            value={{
                wallet,
                loading,
                watchingAd,
                refreshWallet,
                watchRewardedAd,
                handleAiError,
            }}
        >
            {children}
        </TokenWalletContext.Provider>
    );
}

export function useTokenWallet() {
    return useContext(TokenWalletContext);
}
