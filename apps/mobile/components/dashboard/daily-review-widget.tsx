import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, AppState } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { t } from '@learnaxia/shared';
import { BrandLoader } from '@/components/ui/brand-loader';
import api from '@/lib/api';

const currentLang = 'tr'; // Default to Turkish for now

interface DueModule {
    module: {
        id: string;
        title: string;
        description: string | null;
        category: string | null;
    };
    dueCount: number;
    itemIds: string[];
}

interface DailyQueueData {
    totalDue: number;
    modules: DueModule[];
}

export function DailyReviewWidget() {
    const router = useRouter();
    const [data, setData] = useState<DailyQueueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDailyQueue = useCallback(async () => {
        try {
            const res = await api.get('/mobile/study/daily-queue');
            setData(res.data);
            setError(null);
        } catch (err: any) {
            console.error('[DailyReviewWidget] Fetch error:', err);
            // Non-critical error, if we have old data we keep it, otherwise show empty
            if (!data) {
                setData({ totalDue: 0, modules: [] });
            }
        } finally {
            setLoading(false);
        }
    }, [data]);

    useEffect(() => {
        fetchDailyQueue();

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                fetchDailyQueue();
            }
        });

        return () => subscription.remove();
    }, [fetchDailyQueue]);

    if (loading && !data) {
        return (
            <View className="rounded-3xl border border-blue-500/20 overflow-hidden mb-6" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
                <View className="p-8 items-center justify-center">
                    <BrandLoader size={48} />
                </View>
            </View>
        );
    }

    if (error && !data) return null;

    if (data?.totalDue === 0) {
        return (
            <View className="rounded-3xl border border-emerald-500/20 overflow-hidden mb-6" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                <View className="p-8 items-center justify-center">
                    <View className="w-16 h-16 rounded-full bg-emerald-500/20 items-center justify-center mb-4">
                        <MaterialIcons name="psychology" size={32} color="#10B981" />
                    </View>
                    <Text className="text-xl font-bold text-white mb-2 text-center tracking-tight">{t('dashboard.dailyReview.completedTitle', currentLang)}</Text>
                    <Text className="text-slate-400 text-sm text-center">{t('dashboard.dailyReview.completedDesc', currentLang)}</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="rounded-3xl border border-blue-500/20 overflow-hidden mb-6 relative bg-slate-900">
            <LinearGradient
                colors={['rgba(59, 130, 246, 0.1)', 'rgba(168, 85, 247, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
            />
            {/* Top Border Gradient */}
            <LinearGradient
                colors={['#3B82F6', '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="absolute top-0 left-0 right-0 h-1"
            />

            <View className="p-5 relative z-10 w-full">
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <View className="flex-row items-center mb-1">
                            <MaterialIcons name="psychology" size={24} color="#3B82F6" />
                            <Text className="text-xl font-bold text-white ml-2">{t('dashboard.dailyReview.title', currentLang)}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Text className="text-slate-400 text-xs">{t('dashboard.dailyReview.duePrefix', currentLang)} </Text>
                            <View className="bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-md ml-1">
                                <Text className="text-blue-400 text-[10px] font-bold">{data?.totalDue || 0} {t('dashboard.dailyReview.dueCards', currentLang)}</Text>
                            </View>
                            <Text className="text-slate-400 text-xs ml-1"> {t('dashboard.dailyReview.dueSuffix', currentLang)}</Text>
                        </View>
                    </View>
                </View>

                {/* Modules List */}
                {data?.modules.slice(0, 3).map((m, idx) => (
                    <View key={m.module.id || idx} className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/50 mb-3 flex-row justify-between items-center">
                        <View className="flex-1 mr-3">
                            <Text className="text-white font-semibold text-sm mb-1" numberOfLines={1}>{m.module.title}</Text>
                            {m.module.category && (
                                <View className="flex-row items-center">
                                    <MaterialIcons name="menu-book" size={12} color="#94A3B8" />
                                    <Text className="text-slate-400 text-[10px] ml-1">{m.module.category}</Text>
                                </View>
                            )}
                        </View>
                        <View className="items-end">
                            <View className="bg-red-500/20 px-2 py-1 rounded-md mb-2">
                                <Text className="text-red-400 text-[10px] font-bold">{m.dueCount} Due</Text>
                            </View>
                            <TouchableOpacity
                                className="bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center"
                                onPress={() => router.push(`/study/${m.module.id}?mode=SM2` as any)}
                            >
                                <MaterialIcons name="play-arrow" size={14} color="white" />
                                <Text className="text-white text-[10px] font-bold ml-1">{t('study.moduleActions.study', currentLang)}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {/* Mix All Button */}
                <TouchableOpacity
                    className="w-full mt-2 border border-blue-500/30 py-3 rounded-xl flex-row items-center justify-center bg-blue-900/20"
                    onPress={() => router.push('/study/daily' as any)}
                >
                    <Text className="text-blue-400 font-bold text-sm">{t('dashboard.mixAll', currentLang)}</Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#60A5FA" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
}
