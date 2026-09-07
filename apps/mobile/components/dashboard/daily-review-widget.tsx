import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, AppState, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { t } from '@learnaxia/shared';
import { BrandLoader } from '@/components/ui/brand-loader';
import * as Haptics from 'expo-haptics';
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
            <View style={styles.loadingContainer}>
                <View style={styles.loadingContent}>
                    <BrandLoader size={48} />
                </View>
            </View>
        );
    }

    if (error && !data) return null;

    if (data?.totalDue === 0) {
        return (
            <View style={styles.completedContainer}>
                <LinearGradient
                    colors={['rgba(6, 182, 212, 0.05)', 'rgba(59, 130, 246, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.completedContent}>
                    <View style={styles.completedIconWrapper}>
                        <MaterialIcons name="psychology" size={32} color="#06B6D4" />
                    </View>
                    <Text style={styles.completedTitle}>{t('dashboard.dailyReview.completedTitle', currentLang)}</Text>
                    <Text style={styles.completedDesc}>{t('dashboard.dailyReview.completedDesc', currentLang)}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Top Gradient Border matching Web */}
            <LinearGradient
                colors={['#3B82F6', '#22D3EE', '#A855F7']} // blue-500, cyan-400, purple-500
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.topBorderLine}
            />

            <View style={styles.content}>
                <View style={styles.header}>
                    <View>
                        <View style={styles.titleRow}>
                            <MaterialIcons name="psychology" size={24} color="#3B82F6" />
                            <Text style={styles.titleText}>{t('dashboard.dailyReview.title', currentLang)}</Text>
                        </View>
                        <View style={styles.subtitleRow}>
                            <Text style={styles.subtitlePrefix}>{t('dashboard.dailyReview.duePrefix', currentLang)} </Text>
                            <View style={styles.dueBadge}>
                                <Text style={styles.dueBadgeText}>{data?.totalDue || 0} {t('dashboard.dailyReview.dueCards', currentLang)}</Text>
                            </View>
                            <Text style={styles.subtitleSuffix}> {t('dashboard.dailyReview.dueSuffix', currentLang)}</Text>
                        </View>
                    </View>
                </View>

                {/* Modules List */}
                {data?.modules.slice(0, 3).map((m, idx) => (
                    <View key={m.module.id || idx} style={styles.moduleCard}>
                        <View style={styles.moduleInfoRow}>
                            <View style={styles.moduleInfo}>
                                <Text style={styles.moduleTitle} numberOfLines={1}>{m.module.title}</Text>
                                {m.module.category && (
                                    <View style={styles.moduleCategoryRow}>
                                        <MaterialIcons name="menu-book" size={12} color="#64748B" />
                                        <Text style={styles.moduleCategoryText}>{m.module.category}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.dueCountBadge}>
                                <Text style={styles.dueCountText}>{m.dueCount} Due</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.studyButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(`/study/${m.module.id}?mode=SM2` as any);
                            }}
                        >
                            <MaterialIcons name="play-arrow" size={14} color="white" />
                            <Text style={styles.studyButtonText}>{t('dashboard.dailyReview.studyJustThis', currentLang)}</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Mix All Button */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.mixAllButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push('/study/daily' as any);
                    }}
                >
                    <Text style={styles.mixAllText}>{t('dashboard.mixAll', currentLang)}</Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#60A5FA" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  loadingContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  loadingContent: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(6, 182, 212, 0.2)', // cyan border
    borderWidth: 1,
    position: 'relative',
  },
  completedContent: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  completedIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.1)', // cyan-900/40 equivalent
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  completedDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)', // blue-500/20
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.03)', // glass equivalent
  },
  topBorderLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 20,
  },
  content: {
    padding: 24,
    position: 'relative',
    zIndex: 10,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginLeft: 8,
    letterSpacing: -0.5,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitlePrefix: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  dueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  dueBadgeText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  subtitleSuffix: {
    color: '#94A3B8',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  moduleCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)', // bg-card
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  moduleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  moduleInfo: {
    flex: 1,
    marginRight: 12,
  },
  moduleTitle: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  moduleCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleCategoryText: {
    color: '#64748B',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  dueCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-900/30
  },
  dueCountText: {
    color: '#F87171', // red-400
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  studyButton: {
    backgroundColor: '#2563EB', // blue-600
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8, // matching Web's small button radius
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  studyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  mixAllButton: {
    width: '100%',
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 8, // match web's standard radius
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
    borderColor: 'rgba(59, 130, 246, 0.3)', // border-blue-500/30
  },
  mixAllText: {
    color: '#60A5FA', // text-blue-600
    fontWeight: '600',
    fontSize: 14,
  },
});
