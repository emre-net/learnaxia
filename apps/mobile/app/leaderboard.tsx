import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    RefreshControl, StyleSheet, Image, Platform, StatusBar, ScrollView
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TIERS, type TierKey } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';

type Period = 'weekly' | 'monthly' | '3month' | 'alltime';
type TierFilter = 'all' | TierKey;

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string | null;
    handle: string | null;
    image: string | null;
    momentum: number;
    tier: { key: string; label: string; emoji: string; color: string };
    isCurrentUser: boolean;
}

interface LeaderboardResponse {
    period: Period;
    entries: LeaderboardEntry[];
    myEntry: LeaderboardEntry | null;
    total: number;
}

function formatMomentum(n?: number): string {
    if (n == null || isNaN(n)) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString('tr-TR');
}

export default function LeaderboardScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const isTr = language === 'tr';

    const [period, setPeriod] = useState<Period>('monthly');
    const [tierFilter, setTierFilter] = useState<TierFilter>('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [data, setData] = useState<LeaderboardResponse | null>(null);
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

    const PERIODS: { key: Period; label: string }[] = [
        { key: 'weekly', label: isTr ? 'Haftalık' : 'Weekly' },
        { key: 'monthly', label: isTr ? 'Aylık' : 'Monthly' },
        { key: '3month', label: isTr ? '3 Aylık' : '3 Months' },
        { key: 'alltime', label: isTr ? 'Genel' : 'All Time' },
    ];

    const fetchLeaderboard = useCallback(async (selectedPeriod: Period, selectedTier: TierFilter) => {
        setFetchError(false);
        try {
            const res = await api.get<LeaderboardResponse>(
                `/leaderboard?period=${selectedPeriod}&tier=${selectedTier}&limit=50`
            );
            setData(res.data);
        } catch (error) {
            if (__DEV__) console.error('[Leaderboard] Fetch error:', error);
            setFetchError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchLeaderboard(period, tierFilter);
    }, [period, tierFilter, fetchLeaderboard]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLeaderboard(period, tierFilter);
    }, [period, tierFilter, fetchLeaderboard]);

    const handlePeriodChange = (p: Period) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPeriod(p);
    };

    const handleTierChange = (tf: TierFilter) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTierFilter(tf);
    };

    const renderRankBadge = (rank: number) => {
        if (rank === 1) return <Text style={styles.medal}>🥇</Text>;
        if (rank === 2) return <Text style={styles.medal}>🥈</Text>;
        if (rank === 3) return <Text style={styles.medal}>🥉</Text>;
        return <Text style={styles.rankNumber}>{rank}</Text>;
    };

    const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
        const isMe = item.isCurrentUser;
        const tierColor = item.tier?.color || '#38BDF8';

        return (
            <View
                style={[
                    styles.entryCard,
                    isMe && { borderColor: `${tierColor}70`, backgroundColor: '#18181B' },
                ]}
            >
                <View style={styles.rankContainer}>{renderRankBadge(item.rank)}</View>

                {Boolean(item.image) && !failedImages[item.userId] ? (
                    <Image
                        source={{ uri: item.image! }}
                        style={[styles.avatar, { borderColor: `${tierColor}60` }]}
                        onError={() => setFailedImages((prev) => ({ ...prev, [item.userId]: true }))}
                    />
                ) : (
                    <View style={[styles.avatarFallback, { borderColor: `${tierColor}60` }]}>
                        <Text style={styles.avatarEmoji}>{item.tier?.emoji || '⚡'}</Text>
                    </View>
                )}

                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.userName, isMe && styles.currentUserName]} numberOfLines={1}>
                            {item.name || (item.handle ? `@${item.handle}` : isTr ? 'Öğrenci' : 'Learner')}
                        </Text>
                        {isMe && <Text style={styles.youBadge}>{isTr ? '(Sen)' : '(You)'}</Text>}
                    </View>
                    {item.handle ? (
                        <Text style={styles.userHandle} numberOfLines={1}>
                            @{item.handle} • {item.tier?.emoji} {item.tier?.label}
                        </Text>
                    ) : (
                        <Text style={[styles.tierPillText, { color: tierColor }]}>
                            {item.tier?.emoji} {item.tier?.label}
                        </Text>
                    )}
                </View>

                <View style={styles.scoreContainer}>
                    <Text style={styles.momentumValue}>{formatMomentum(item.momentum)}</Text>
                    <Text style={styles.momentumLabel}>pts</Text>
                </View>
            </View>
        );
    };

    return (
        <Screen style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#09090B" />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={22} color="#F4F4F5" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{isTr ? 'Liderlik Tablosu' : 'Leaderboard'}</Text>
                    <Text style={styles.headerSubtitle}>
                        {isTr ? 'Öğrenme Momentum Sıralaması' : 'Momentum Rankings'}
                    </Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Period Filters */}
            <View style={styles.periodRow}>
                {PERIODS.map((p) => {
                    const active = period === p.key;
                    return (
                        <TouchableOpacity
                            key={p.key}
                            onPress={() => handlePeriodChange(p.key)}
                            style={[styles.periodChip, active && styles.periodChipActive]}
                        >
                            <Text style={[styles.periodText, active && styles.periodTextActive]}>
                                {p.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Shared Tier Filters */}
            <View style={styles.tierFilterWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierScrollContent}>
                    <TouchableOpacity
                        onPress={() => handleTierChange('all')}
                        style={[styles.tierFilterChip, tierFilter === 'all' && styles.tierFilterChipActive]}
                    >
                        <Text style={[styles.tierFilterText, tierFilter === 'all' && styles.tierFilterTextActive]}>
                            {isTr ? 'Tüm Ligler' : 'All Tiers'}
                        </Text>
                    </TouchableOpacity>
                    {TIERS.map((tier) => {
                        const active = tierFilter === tier.key;
                        return (
                            <TouchableOpacity
                                key={tier.key}
                                onPress={() => handleTierChange(tier.key)}
                                style={[
                                    styles.tierFilterChip,
                                    active && { borderColor: tier.color, backgroundColor: `${tier.color}20` },
                                ]}
                            >
                                <Text style={[styles.tierFilterText, active && { color: '#F4F4F5', fontWeight: '700' }]}>
                                    {tier.emoji} {isTr ? tier.label : tier.labelEn}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <BrandLoader size="lg" label={isTr ? 'Sıralama yükleniyor...' : 'Loading leaderboard...'} />
                </View>
            ) : fetchError ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cloud-offline-outline" size={44} color="#71717A" style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyTitle}>
                        {isTr ? 'Sıralama Yüklenemedi' : 'Could Not Load Leaderboard'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {isTr ? 'İnternet bağlantınızı kontrol edip tekrar deneyin.' : 'Check your internet connection.'}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => {
                            setLoading(true);
                            fetchLeaderboard(period, tierFilter);
                        }}
                    >
                        <Ionicons name="refresh" size={16} color="#09090B" />
                        <Text style={styles.retryBtnText}>{isTr ? 'Tekrar Dene' : 'Retry'}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={data?.entries || []}
                    keyExtractor={(item) => item.userId}
                    renderItem={renderEntry}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyEmoji}>🏆</Text>
                            <Text style={styles.emptyTitle}>{isTr ? 'Henüz Skor Yok' : 'No Scores Yet'}</Text>
                            <Text style={styles.emptySubtitle}>
                                {isTr
                                    ? 'Bu dönemde ve ligde ilk sıraya yerleşen sen ol!'
                                    : 'Be the first to place on the board!'}
                            </Text>
                        </View>
                    }
                />
            )}

            {!loading && !fetchError && !data?.entries?.some((e) => e.isCurrentUser) && !!data?.myEntry && (
                <View style={styles.pinnedBar}>
                    <View style={styles.pinnedContent}>
                        <View style={styles.rankContainer}>{renderRankBadge(data.myEntry.rank)}</View>
                        <View style={styles.infoContainer}>
                            <Text style={styles.pinnedTitle}>{isTr ? 'Senin Sıralaman' : 'Your Rank'}</Text>
                            <Text style={styles.pinnedSubtitle}>
                                {data.myEntry.tier?.emoji} {data.myEntry.tier?.label}
                            </Text>
                        </View>
                        <View style={styles.scoreContainer}>
                            <Text style={styles.pinnedScore}>{formatMomentum(data.myEntry.momentum)}</Text>
                            <Text style={styles.momentumLabel}>pts</Text>
                        </View>
                    </View>
                </View>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#09090B' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 12 : 20, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: '#18181B',
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#121215',
        borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center',
    },
    headerTitleContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#F4F4F5', letterSpacing: -0.3 },
    headerSubtitle: { fontSize: 12, color: '#71717A', marginTop: 2 },
    periodRow: {
        flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8,
    },
    periodChip: {
        flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 12,
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A',
    },
    periodChipActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
    periodText: { fontSize: 12, fontWeight: '600', color: '#A1A1AA' },
    periodTextActive: { color: '#09090B', fontWeight: '700' },
    tierFilterWrap: { paddingBottom: 10 },
    tierScrollContent: { paddingHorizontal: 16, gap: 8 },
    tierFilterChip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A',
    },
    tierFilterChipActive: { backgroundColor: 'rgba(56, 189, 248, 0.14)', borderColor: '#38BDF8' },
    tierFilterText: { color: '#A1A1AA', fontSize: 12, fontWeight: '600' },
    tierFilterTextActive: { color: '#38BDF8', fontWeight: '700' },
    listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100, gap: 10 },
    entryCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#121215',
        borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14,
        borderWidth: 1, borderColor: '#27272A',
    },
    rankContainer: { width: 34, alignItems: 'center', justifyContent: 'center' },
    medal: { fontSize: 20 },
    rankNumber: { fontSize: 15, fontWeight: '700', color: '#71717A' },
    avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, marginLeft: 6 },
    avatarFallback: {
        width: 42, height: 42, borderRadius: 21, backgroundColor: '#18181B',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginLeft: 6,
    },
    avatarEmoji: { fontSize: 18 },
    infoContainer: { flex: 1, marginLeft: 12 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    userName: { fontSize: 14, fontWeight: '600', color: '#F4F4F5', maxWidth: 160 },
    currentUserName: { color: '#38BDF8', fontWeight: '700' },
    youBadge: { fontSize: 11, color: '#38BDF8', fontWeight: '600' },
    userHandle: { fontSize: 12, color: '#71717A', marginTop: 2 },
    tierPillText: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    scoreContainer: { alignItems: 'flex-end', marginLeft: 8 },
    momentumValue: { fontSize: 15, fontWeight: '800', color: '#F4F4F5', fontVariant: ['tabular-nums'] },
    momentumLabel: { fontSize: 11, fontWeight: '600', color: '#71717A' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 72 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#F4F4F5', marginBottom: 6 },
    emptySubtitle: { fontSize: 13, color: '#71717A', textAlign: 'center', paddingHorizontal: 32 },
    retryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18,
        backgroundColor: '#38BDF8', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
    },
    retryBtnText: { color: '#09090B', fontWeight: '700', fontSize: 14 },
    pinnedBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16, paddingTop: 12,
        backgroundColor: '#121215', borderTopWidth: 1, borderTopColor: '#27272A',
    },
    pinnedContent: { flexDirection: 'row', alignItems: 'center' },
    pinnedTitle: { fontSize: 14, fontWeight: '700', color: '#38BDF8' },
    pinnedSubtitle: { fontSize: 12, color: '#A1A1AA', marginTop: 1 },
    pinnedScore: { fontSize: 17, fontWeight: '800', color: '#38BDF8' },
});
