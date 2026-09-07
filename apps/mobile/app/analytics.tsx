import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet, RefreshControl } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import { BrandLoader } from '@/components/ui/brand-loader';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';

const { width } = Dimensions.get('window');

/** Tip güvenli analytics veri yapısı */
interface DailyActivity {
    date: string;
    duration: number;
    solved: number;
}

interface ModuleStat {
    id: string;
    title: string;
    accuracy: number;
    solved: number;
}

interface AnalyticsStats {
    averageAccuracy: number;
    totalSolved: number;
    totalStudyMinutes: number;
    streak: number;
}

interface AnalyticsData {
    stats?: AnalyticsStats;
    dailyActivity?: DailyActivity[];
    moduleStats?: ModuleStat[];
}

export default function AnalyticsScreen() {
    const router = useRouter();
    const { language } = useLanguage();
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
            console.error('[Analytics] Error fetching:', error);
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

    if (loading) {
        return (
            <Screen style={styles.centered}>
                <BrandLoader size="lg" label={t('analytics.analyzing', language)} />
            </Screen>
        );
    }

    // Hata durumu
    if (fetchError) {
        return (
            <Screen style={styles.centered}>
                <View style={styles.errorIconWrapper}>
                    <MaterialIcons name="wifi-off" size={40} color="#475569" />
                </View>
                <Text style={styles.errorTitle}>Analitik Yüklenemedi</Text>
                <Text style={styles.errorDesc}>İnternet bağlantınızı kontrol edin</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => { setLoading(true); fetchAnalytics(); }}
                >
                    <MaterialIcons name="refresh" size={18} color="#60A5FA" />
                    <Text style={styles.retryText}>Tekrar Dene</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    const activity: DailyActivity[] = data?.dailyActivity || [];
    const maxDuration = Math.max(...activity.map((a) => a.duration), 1);

    // Last 7 days chart
    const chartData = activity.slice(-7);

    return (
        <Screen style={styles.screen}>
            <ScrollView
                style={{ flex: 1 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        style={styles.backBtn}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('analytics.title', language)}</Text>
                </View>

                {/* Activity Chart */}
                <View style={styles.section}>
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>{t('analytics.last7Days', language)}</Text>

                        {chartData.length === 0 ? (
                            <View style={styles.emptyChart}>
                                <MaterialIcons name="bar-chart" size={32} color="#334155" />
                                <Text style={styles.emptyChartText}>Henüz çalışma verisi yok</Text>
                            </View>
                        ) : (
                            <View style={styles.chartRow}>
                                {chartData.map((day, i) => {
                                    const height = (day.duration / maxDuration) * 100;
                                    const date = new Date(day.date);
                                    const dayName = date
                                        .toLocaleDateString('tr-TR', { weekday: 'short' })
                                        .charAt(0)
                                        .toUpperCase();

                                    return (
                                        <View key={i} style={styles.chartBar}>
                                            <View style={styles.chartBarTrack}>
                                                <View style={styles.chartBarBg} />
                                                <LinearGradient
                                                    colors={['#00D2FF', '#3B82F6']}
                                                    style={[styles.chartBarFill, { height: `${Math.max(height, 5)}%` }]}
                                                />
                                            </View>
                                            <Text style={styles.chartDayLabel}>{dayName}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>

                {/* Performance Cards */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('analytics.performanceSummary', language)}</Text>

                    <View style={styles.row}>
                        {/* Doğruluk */}
                        <View style={[styles.perfCard, { flex: 1, marginRight: 8 }]}>
                            <View style={[styles.perfIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <MaterialIcons name="psychology" size={20} color="#10B981" />
                            </View>
                            <Text style={styles.perfLabel}>{t('analytics.accuracyRate', language)}</Text>
                            <Text style={[styles.perfValue, { color: '#10B981' }]}>
                                %{data?.stats?.averageAccuracy || 0}
                            </Text>
                        </View>

                        {/* Toplam Çözülen */}
                        <View style={[styles.perfCard, { flex: 1, marginLeft: 8 }]}>
                            <View style={[styles.perfIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <MaterialIcons name="local-fire-department" size={20} color="#3B82F6" />
                            </View>
                            <Text style={styles.perfLabel}>{t('analytics.totalSolved', language)}</Text>
                            <Text style={[styles.perfValue, { color: '#3B82F6' }]}>
                                {data?.stats?.totalSolved || 0}
                            </Text>
                        </View>
                    </View>

                    {/* Haftalık İlerleme */}
                    <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', marginTop: 16 }]}>
                        <View style={[styles.perfIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)', marginRight: 20, width: 56, height: 56, borderRadius: 16 }]}>
                            <MaterialIcons name="trending-up" size={28} color="#A855F7" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.perfLabel}>{t('analytics.weeklyProgress', language)}</Text>
                            <Text style={[styles.perfValue, { fontSize: 18, color: '#F8FAFC' }]}>
                                {t('analytics.weeklyProgressDesc', language)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Module Mastery */}
                {data?.moduleStats && data.moduleStats.length > 0 && (
                    <View style={[styles.section, { marginBottom: 48 }]}>
                        <Text style={styles.sectionLabel}>{t('analytics.moduleMastery', language)}</Text>

                        {data.moduleStats.slice(0, 5).map((mod, i) => (
                            <View key={mod.id || i} style={styles.masteryRow}>
                                <View style={styles.masteryHeader}>
                                    <Text style={styles.masteryTitle} numberOfLines={1}>{mod.title}</Text>
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
        backgroundColor: '#050A14',
    },
    centered: {
        flex: 1,
        backgroundColor: '#050A14',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 24,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#090F1D',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#182234',
    },
    headerTitle: {
        color: '#F8FAFC',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 28,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 4,
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#090F1D',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: '#182234',
    },
    row: {
        flexDirection: 'row',
    },
    // Chart
    chartRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 160,
        paddingHorizontal: 8,
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
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
    },
    chartBarFill: {
        width: 16,
        borderRadius: 8,
    },
    chartDayLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 8,
    },
    emptyChart: {
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyChartText: {
        color: '#475569',
        fontSize: 13,
        marginTop: 8,
        fontWeight: '500',
    },
    // Performance
    perfCard: {
        backgroundColor: '#090F1D',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#182234',
    },
    perfIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    perfLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    perfValue: {
        color: '#F8FAFC',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    // Mastery
    masteryRow: {
        marginBottom: 20,
    },
    masteryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    masteryTitle: {
        color: '#F8FAFC',
        fontWeight: '700',
        fontSize: 14,
        flex: 1,
        marginRight: 12,
    },
    masteryPercent: {
        color: '#60A5FA',
        fontWeight: '700',
        fontSize: 14,
    },
    masteryTrack: {
        height: 6,
        backgroundColor: '#182234',
        borderRadius: 3,
        overflow: 'hidden',
    },
    masteryFill: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 3,
    },
    // Hata ekranı
    errorIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#090F1D',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#182234',
    },
    errorTitle: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    errorDesc: {
        color: '#64748B',
        fontSize: 13,
        marginBottom: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    retryText: {
        color: '#60A5FA',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});
