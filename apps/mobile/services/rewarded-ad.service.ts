import { Platform } from 'react-native';

export interface RewardedAdResult {
    earned: boolean;
    nativeUnavailable?: boolean;
    cancelled?: boolean;
    error?: string;
}

type GoogleAdsModule = typeof import('react-native-google-mobile-ads');

function getGoogleAdsModule(): GoogleAdsModule | null {
    if (Platform.OS === 'web') return null;
    try {
        // Lazy require keeps Jest and Expo Go from crashing when native AdMob binaries are absent
        return require('react-native-google-mobile-ads') as GoogleAdsModule;
    } catch {
        return null;
    }
}

export function resolveRewardedAdUnitId(ads: GoogleAdsModule): string {
    const envId =
        Platform.OS === 'ios'
            ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS_ID
            : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID_ID;

    if (envId && envId.trim()) {
        return envId.trim();
    }
    return ads.TestIds.REWARDED;
}

export class RewardedAdService {
    static isNativeAvailable(): boolean {
        const ads = getGoogleAdsModule();
        return Boolean(ads?.RewardedAd && ads?.RewardedAdEventType);
    }

    static async showRewardedAd(userId: string): Promise<RewardedAdResult> {
        const ads = getGoogleAdsModule();
        if (!ads?.RewardedAd || !ads?.RewardedAdEventType) {
            return {
                earned: false,
                nativeUnavailable: true,
                error: 'Native AdMob modülü bu derlemede etkin değil.',
            };
        }

        const unitId = resolveRewardedAdUnitId(ads);

        return new Promise<RewardedAdResult>((resolve) => {
            let earned = false;
            let settled = false;
            const unsubscribers: (() => void)[] = [];

            const finish = (res: RewardedAdResult) => {
                if (settled) return;
                settled = true;
                for (const unsub of unsubscribers) {
                    try {
                        unsub();
                    } catch {
                        // Ignore listener cleanup errors
                    }
                }
                resolve(res);
            };

            try {
                const rewarded = ads.RewardedAd.createForAdRequest(unitId, {
                    requestNonPersonalizedAdsOnly: true,
                    serverSideVerificationOptions: {
                        userId,
                        customData: userId,
                    },
                });

                const timer = setTimeout(() => {
                    finish({ earned: false, error: 'Reklam zamanında yüklenemedi.' });
                }, 25_000);

                unsubscribers.push(() => clearTimeout(timer));

                unsubscribers.push(
                    rewarded.addAdEventListener(ads.RewardedAdEventType.LOADED, () => {
                        rewarded.show().catch((err: unknown) => {
                            finish({
                                earned: false,
                                error: err instanceof Error ? err.message : 'Reklam gösterilemedi.',
                            });
                        });
                    })
                );

                unsubscribers.push(
                    rewarded.addAdEventListener(ads.RewardedAdEventType.EARNED_REWARD, () => {
                        earned = true;
                    })
                );

                unsubscribers.push(
                    rewarded.addAdEventListener(ads.AdEventType.CLOSED, () => {
                        finish({ earned, cancelled: !earned });
                    })
                );

                unsubscribers.push(
                    rewarded.addAdEventListener(ads.AdEventType.ERROR, (err: Error) => {
                        finish({
                            earned: false,
                            error: err?.message || 'Reklam yüklenirken hata oluştu.',
                        });
                    })
                );

                rewarded.load();
            } catch (err) {
                finish({
                    earned: false,
                    nativeUnavailable: true,
                    error: err instanceof Error ? err.message : 'Reklam başlatılamadı.',
                });
            }
        });
    }
}
