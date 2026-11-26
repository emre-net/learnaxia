import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import { BrandLoader } from '@/components/ui/brand-loader';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';

interface DailyActivity {
    date: string;
    duration: number;
    solved?: number;
}

interface ModuleStat {
    id?: string;
    title: string;
    accuracy: number;
    totalInteractions?: number;
}

interface AnalyticsStats {
    averageAccuracy: number;
    totalSolved: number;
    totalStudyMinutes: number;
    modulesStarted?: number;
}

interface AnalyticsData {
    stats?: AnalyticsStats;
    dailyActivity?: DailyActivity[];
    moduleStats?: ModuleStat[];
}

export default function AnalyticsScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const isTr = language === 'tr';
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [fetchError, setFetchError] = useState(false);

    const fetchAnalytics = useCallback(async () => {
        setFetchError(false);
        try {
            const res = await api.get('/mobile/analytics');
            setData(res.data);
        } catch (error) {
            if (__DEV__) console.error('[Analytics] Error fetching:', error);
            setFetchError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Zero-fill trailing 7 calendar days so chart always shows balanced 7 bars
    const last7DaysChart = useMemo(() => {
        const rawMap = new Map<string, number>();
        for (const item of data?.dailyActivity || []) {
            rawMap.set(item.date, item.duration || 0);
        }
        const days: { date: string; duration: number; dayLabel: string }[] = [];
        for (let offset = 6; offset >= 0; offset--) {
            const d = new Date();
            d.setDate(d.getDate() - offset);
            const iso = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { weekday: 'short' }).slice(0, 2);
            days.push({
                date: iso,
                duration: rawMap.get(iso) || 0,
                dayLabel: label,
            });
        }
        return days;
    }, [data?.dailyActivity, isTr]);

    const totalLast7Min = useMemo(
        () => last7DaysChart.reduce((acc, d) => acc + d.duration, 0),
        [last7DaysChart]
    );

    const maxDuration = Math.max(...last7DaysChart.map((a) => a.duration), 1);

    if (loading) {
        return (
            <Screen style={styles.centered}>
                <BrandLoader size="lg" label={t('analytics.analyzing', language)} />
            </Screen>
        );
    }

    if (fetchError) {
        return (
            <Screen style={styles.centered}>
                <View style={styles.errorIconWrapper}>
                    <MaterialIcons name="wifi-off" size={40} color="#71717A" />
                </View>
                <Text style={styles.errorTitle}>Analitik Yüklenemedi</Text>
                <Text style={styles.errorDesc}>İnternet bağlantınızı kontrol edin</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                        setLoading(true);
                        fetchAnalytics();
                    }}
                >
                    <MaterialIcons name="refresh" size={18} color="#38BDF8" />
                    <Text style={styles.retryText}>{t('common.retry', language)}</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    return (
        <Screen style={styles.screen}>
            <ScrollView
                style={{ flex: 1 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#71717A" />}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        style={styles.backBtn}
                    >
                        <MaterialIcons name="arrow-back" size={22} color="#F4F4F5" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('analytics.title', language)}</Text>
                </View>

                {/* 7-Day Zero-Filled Activity Chart */}
                <View style={styles.section}>
                    <View style={styles.card}>
                        <View style={styles.cardTopRow}>
                            <Text style={styles.sectionLabel}>{t('analytics.last7Days', language)}</Text>
                            <Text style={styles.total7Tag}>
                                {totalLast7Min} {isTr ? 'dk' : 'min'}
                            </Text>
                        </View>

                        <View style={styles.chartRow}>
                            {last7DaysChart.map((day) => {
                                const heightPct = day.duration > 0 ? Math.max((day.duration / maxDuration) * 100, 8) : 4;
                                return (
                                    <View key={day.date} style={styles.chartBar}>
                                        <View style={styles.chartBarTrack}>
                                            <View style={styles.chartBarBg} />
                                            <View
                                                style={[
                                                    styles.chartBarFill,
                                                    {
                                                        height: `${heightPct}%`,
                                                        backgroundColor: day.duration > 0 ? '#38BDF8' : '#27272A',
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.chartDayLabel}>{day.dayLabel}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Performance Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('analytics.performanceSummary', language)}</Text>

                    <View style={styles.row}>
                        <View style={[styles.perfCard, { flex: 1, marginRight: 6 }]}>
                            <View style={[styles.perfIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                                <MaterialIcons name="psychology" size={20} color="#10B981" />
                            </View>
                            <Text style={styles.perfLabel}>{t('analytics.accuracyRate', language)}</Text>
                            <Text style={[styles.perfValue, { color: '#10B981' }]}>
                                %{data?.stats?.averageAccuracy || 0}
                            </Text>
                        </View>

                        <View style={[styles.perfCard, { flex: 1, marginLeft: 6 }]}>
                            <View style={[styles.perfIcon, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                                <MaterialIcons name="local-fire-department" size={20} color="#38BDF8" />
                            </View>
                            <Text style={styles.perfLabel}>{t('analytics.totalSolved', language)}</Text>
                            <Text style={[styles.perfValue, { color: '#38BDF8' }]}>
                                {data?.stats?.totalSolved || 0}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.row, { marginTop: 12 }]}>
                        <View style={[styles.perfCard, { flex: 1, marginRight: 6 }]}>
                            <View style={[styles.perfIcon, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                                <MaterialIcons name="schedule" size={20} color="#F59E0B" />
                            </View>
                            <Text style={styles.perfLabel}>
                                {isTr ? 'Toplam Süre' : 'Total Time'}
                            </Text>
                            <Text style={[styles.perfValue, { color: '#F59E0B' }]}>
                                {data?.stats?.totalStudyMinutes || 0} {isTr ? 'dk' : 'min'}
                            </Text>
                        </View>

                        <View style={[styles.perfCard, { flex: 1, marginLeft: 6 }]}>
                            <View style={[styles.perfIcon, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                                <MaterialIcons name="library-books" size={20} color="#A855F7" />
                            </View>
                            <Text style={styles.perfLabel}>
                                {isTr ? 'Aktif Modül' : 'Active Modules'}
                            </Text>
                            <Text style={[styles.perfValue, { color: '#A855F7' }]}>
                                {data?.stats?.modulesStarted || 0}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', marginTop: 14 }]}>
                        <View
                            style={[
                                styles.perfIcon,
                                {
                                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                    marginRight: 16,
                                    marginBottom: 0,
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                },
                            ]}
                        >
                            <MaterialIcons name="trending-up" size={24} color="#38BDF8" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.perfLabel}>{t('analytics.weeklyProgress', language)}</Text>
                            <Text style={[styles.perfValue, { fontSize: 15, color: '#F4F4F5', lineHeight: 21 }]}>
                                {t('analytics.weeklyProgressDesc', language)} ({totalLast7Min} {isTr ? 'dk bu hafta' : 'min this week'})
                            </Text>
                        </View>
                    </View>
                </View>

                {data?.moduleStats && data.moduleStats.length > 0 && (
                    <View style={[styles.section, { marginBottom: 48 }]}>
                        <Text style={styles.sectionLabel}>{t('analytics.moduleMastery', language)}</Text>

                        {data.moduleStats.slice(0, 6).map((mod, i) => (
                            <View key={mod.id || i} style={styles.masteryRow}>
                                <View style={styles.masteryHeader}>
                                    <Text style={styles.masteryTitle} numberOfLines={1}>
                                        {mod.title}
                                    </Text>
                                    <Text style={styles.masteryPercent}>%{mod.accuracy}</Text>
                                </View>
                                <View style={styles.masteryTrack}>
                                    <View style={[styles.masteryFill, { width: `${mod.accuracy}%` }]} />
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#09090B',
    },
    centered: {
        flex: 1,
        backgroundColor: '#09090B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 20,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    headerTitle: {
        color: '#F4F4F5',
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    total7Tag: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
    },
    sectionLabel: {
        color: '#A1A1AA',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#121215',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    row: {
        flexDirection: 'row',
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 150,
        paddingHorizontal: 6,
    },
    chartBar: {
        flex: 1,
        alignItems: 'center',
    },
    chartBarTrack: {
        width: 16,
        height: '100%',
        position: 'relative',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    chartBarBg: {
        position: 'absolute',
        bottom: 0,
        width: 16,
        height: '100%',
        borderRadius: 8,
        backgroundColor: '#18181B',
    },
    chartBarFill: {
        width: 16,
        borderRadius: 8,
    },
    chartDayLabel: {
        color: '#A1A1AA',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 8,
    },
    perfCard: {
        backgroundColor: '#121215',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    perfIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    perfLabel: {
        color: '#A1A1AA',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    perfValue: {
        color: '#F4F4F5',
        fontSize: 22,
        fontWeight: '800',
    },
    masteryRow: {
        marginBottom: 16,
        backgroundColor: '#121215',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    masteryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    masteryTitle: {
        color: '#F4F4F5',
        fontWeight: '600',
        fontSize: 14,
        flex: 1,
        marginRight: 12,
    },
    masteryPercent: {
        color: '#38BDF8',
        fontWeight: '700',
        fontSize: 14,
    },
    masteryTrack: {
        height: 6,
        backgroundColor: '#18181B',
        borderRadius: 3,
        overflow: 'hidden',
    },
    masteryFill: {
        height: '100%',
        backgroundColor: '#38BDF8',
        borderRadius: 3,
    },
    errorIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    errorTitle: {
        color: '#F4F4F5',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    errorDesc: {
        color: '#A1A1AA',
        fontSize: 13,
        marginBottom: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121215',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    retryText: {
        color: '#38BDF8',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});
