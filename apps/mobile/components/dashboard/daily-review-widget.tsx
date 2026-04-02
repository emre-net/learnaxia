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
    const dataRef = React.useRef<DailyQueueData | null>(null);

    // Keep ref in sync
    React.useEffect(() => { dataRef.current = data; }, [data]);

    const fetchDailyQueue = useCallback(async () => {
        try {
            const res = await api.get('/mobile/study/daily-queue');
            setData(res.data);
            setError(null);
        } catch (err: any) {
            console.error('[DailyReviewWidget] Fetch error:', err);
            // Non-critical error, if we have old data we keep it, otherwise show empty
            if (!dataRef.current) {
                setData({ totalDue: 0, modules: [] });
            }
        } finally {
            setLoading(false);
        }
    }, []);

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
            <View 
                className="rounded-[32px] border border-ocean-border overflow-hidden mb-6"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
            >
                <View className="p-8 items-center justify-center">
                    <BrandLoader size={48} />
                </View>
            </View>
        );
    }

    if (error && !data) return null;

    if (data?.totalDue === 0) {
        return (
            <View 
                className="rounded-[32px] overflow-hidden mb-6"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1 }}
            >
                <View className="p-8 items-center justify-center">
                    <View 
                        className="w-16 h-16 rounded-3xl items-center justify-center mb-4"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                    >
                        <MaterialIcons name="psychology" size={32} color="#10B981" />
                    </View>
                    <Text className="text-xl font-bold text-white mb-2 text-center tracking-tight">{t('dashboard.dailyReview.completedTitle', currentLang)}</Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-sm text-center font-medium leading-5">{t('dashboard.dailyReview.completedDesc', currentLang)}</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="rounded-[32px] border border-ocean-border overflow-hidden mb-6 relative bg-ocean-panel shadow-2xl">
            <LinearGradient
                colors={['rgba(0, 210, 255, 0.08)', 'rgba(59, 130, 246, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            <View className="p-5 relative z-10 w-full">
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <View className="flex-row items-center mb-1">
                            <MaterialIcons name="psychology" size={24} color="#00D2FF" />
                            <Text className="text-xl font-black text-white ml-2 tracking-tight">{t('dashboard.dailyReview.title', currentLang)}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-xs font-medium">{t('dashboard.dailyReview.duePrefix', currentLang)} </Text>
                            <View 
                                className="px-2.5 py-0.5 rounded-lg ml-1 border"
                                style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
                            >
                                <Text className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{data?.totalDue || 0} {t('dashboard.dailyReview.dueCards', currentLang)}</Text>
                            </View>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-xs ml-1 font-medium"> {t('dashboard.dailyReview.dueSuffix', currentLang)}</Text>
                        </View>
                    </View>
                </View>

                {/* Modules List */}
                {data?.modules.slice(0, 3).map((m, idx) => (
                    <View 
                        key={m.module.id || idx} 
                        className="rounded-2xl p-4 border mb-3 flex-row justify-between items-center"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                        <View className="flex-1 mr-3">
                            <Text className="text-white font-bold text-sm mb-1 tracking-tight" numberOfLines={1}>{m.module.title}</Text>
                            {m.module.category && (
                                <View 
                                    className="flex-row items-center"
                                    style={{ opacity: 0.4 }}
                                >
                                    <MaterialIcons name="menu-book" size={12} color="white" />
                                    <Text className="text-white text-[10px] ml-1 font-bold">{m.module.category}</Text>
                                </View>
                            )}
                        </View>
                        <View className="items-end">
                            <View 
                                className="px-2 py-0.5 rounded mb-2 border"
                                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                            >
                                <Text className="text-red-400 text-[9px] font-black tracking-widest uppercase">{m.dueCount} Due</Text>
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                className="bg-blue-600 px-3 py-1.5 rounded-xl flex-row items-center"
                                style={{ 
                                  elevation: 4,
                                  shadowColor: 'rgba(59, 130, 246, 0.2)',
                                  shadowOffset: { width: 0, height: 4 },
                                  shadowOpacity: 1,
                                  shadowRadius: 10
                                }}
                                onPress={() => router.push(`/study/${m.module.id}?mode=SM2` as any)}
                            >
                                <MaterialIcons name="play-arrow" size={14} color="white" />
                                <Text className="text-white text-[10px] font-black tracking-widest uppercase ml-1">{t('study.moduleActions.study', currentLang)}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {/* Mix All Button */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    className="w-full mt-2 py-3.5 rounded-2xl flex-row items-center justify-center border"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
                    onPress={() => router.push('/study/daily' as any)}
                >
                    <Text className="text-blue-400 font-black text-xs uppercase tracking-[2px]">{t('dashboard.mixAll', currentLang)}</Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#00D2FF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
}
