import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    RefreshControl, StyleSheet, Image, Platform, StatusBar
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';

type Period = 'weekly' | 'monthly' | '3month' | 'alltime';

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

const PERIODS: { key: Period; label: string }[] = [
    { key: 'weekly', label: 'Haftalık' },
    { key: 'monthly', label: 'Aylık' },
    { key: '3month', label: '3 Aylık' },
    { key: 'alltime', label: 'Genel' },
];

function formatMomentum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString('tr-TR');
}

export default function LeaderboardScreen() {
    const router = useRouter();
    const [period, setPeriod] = useState<Period>('monthly');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<LeaderboardResponse | null>(null);

    const fetchLeaderboard = useCallback(async (selectedPeriod: Period) => {
        try {
            const res = await api.get<LeaderboardResponse>(`/leaderboard?period=${selectedPeriod}&limit=50`);
            setData(res.data);
        } catch (error) {
            console.error('[Leaderboard] Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchLeaderboard(period);
    }, [period, fetchLeaderboard]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLeaderboard(period);
    }, [period, fetchLeaderboard]);

    const handlePeriodChange = (p: Period) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPeriod(p);
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
            <View style={[
                styles.entryCard,
                isMe && { borderColor: `${tierColor}60`, backgroundColor: 'rgba(255, 255, 255, 0.05)' }
            ]}>
                <View style={styles.rankContainer}>
                    {renderRankBadge(item.rank)}
                </View>

                {item.image ? (
                    <Image source={{ uri: item.image }} style={[styles.avatar, { borderColor: `${tierColor}50` }]} />
                ) : (
                    <View style={[styles.avatarFallback, { borderColor: `${tierColor}50` }]}>
                        <Text style={styles.avatarEmoji}>{item.tier?.emoji || '⚡'}</Text>
                    </View>
                )}

                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.userName, isMe && styles.currentUserName]} numberOfLines={1}>
                            {item.name || 'Öğrenci'}
                        </Text>
                        {isMe && <Text style={styles.youBadge}>(Sen)</Text>}
                    </View>
                    {item.handle ? (
                        <Text style={styles.userHandle} numberOfLines={1}>@{item.handle}</Text>
                    ) : (
                        <View style={styles.tierPill}>
                            <Text style={[styles.tierPillText, { color: tierColor }]}>
                                {item.tier?.emoji} {item.tier?.label}
                            </Text>
                        </View>
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
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Liderlik Tablosu</Text>
                    <Text style={styles.headerSubtitle}>Öğrenme Momentum Sıralaması</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Period Filters */}
            <View style={styles.periodRow}>
                {PERIODS.map(p => {
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

            {/* Content */}
            {loading ? (
                <View style={styles.centered}>
                    <BrandLoader size="lg" label="Sıralama yükleniyor..." />
                </View>
            ) : (
                <FlatList
                    data={data?.entries || []}
                    keyExtractor={(item) => item.userId}
                    renderItem={renderEntry}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyEmoji}>🏆</Text>
                            <Text style={styles.emptyTitle}>Henüz Skor Yok</Text>
                            <Text style={styles.emptySubtitle}>Bu dönemde soru çözerek sıralamaya ilk giren sen ol!</Text>
                        </View>
                    }
                />
            )}

            {/* Pinned My Rank Card (if not in visible top entries) */}
            {data?.myEntry && (
                <View style={styles.pinnedBar}>
                    <View style={styles.pinnedContent}>
                        <View style={styles.rankContainer}>
                            {renderRankBadge(data.myEntry.rank)}
                        </View>
                        <View style={styles.infoContainer}>
                            <Text style={styles.pinnedTitle}>Senin Sıralaman</Text>
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
    container: {
        flex: 1,
        backgroundColor: '#030712',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 12 : 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F8FAFC',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    periodRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    periodChip: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    periodChipActive: {
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        borderColor: '#38BDF8',
    },
    periodText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#94A3B8',
    },
    periodTextActive: {
        color: '#38BDF8',
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 100,
        gap: 10,
    },
    entryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0B0F19',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    rankContainer: {
        width: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    medal: {
        fontSize: 20,
    },
    rankNumber: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748B',
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 2,
        marginLeft: 6,
    },
    avatarFallback: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        marginLeft: 6,
    },
    avatarEmoji: {
        fontSize: 18,
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F1F5F9',
        maxWidth: 160,
    },
    currentUserName: {
        color: '#38BDF8',
        fontWeight: '700',
    },
    youBadge: {
        fontSize: 11,
        color: '#38BDF8',
        fontWeight: '600',
    },
    userHandle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    tierPill: {
        marginTop: 3,
        alignSelf: 'flex-start',
    },
    tierPillText: {
        fontSize: 11,
        fontWeight: '600',
    },
    scoreContainer: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    momentumValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#F8FAFC',
        fontVariant: ['tabular-nums'],
    },
    momentumLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    pinnedBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        paddingTop: 12,
        backgroundColor: '#0F172A',
        borderTopWidth: 1,
        borderTopColor: 'rgba(56, 189, 248, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    pinnedContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pinnedTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#38BDF8',
    },
    pinnedSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },
    pinnedScore: {
        fontSize: 17,
        fontWeight: '800',
        color: '#38BDF8',
    },
});
