import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, RefreshControl, StyleSheet, Linking, Alert, ActionSheetIOS, Platform } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';
import Constants from 'expo-constants';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const { language, setLanguage } = useLanguage();
    const [profileData, setProfileData] = useState<{
        stats?: { modules: number; collections: number };
    } | null>(null);
    const [analyticsData, setAnalyticsData] = useState<{
        totalStudyMinutes?: number;
    } | null>(null);
    const [scoreData, setScoreData] = useState<{
        momentum: { thisMonth: number; allTime: number };
        tier: { thisMonth: { key: string; label: string; emoji: string; color: string; progress: number; pointsToNext: number | null } };
        metrics: { studyMinutes: number; cardsReviewed: number; accuracyRate: number; activeDays: number };
        badges: Array<{ key: string; emoji: string; label: string }>;
    } | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const [profileRes, analyticsRes, scoreRes] = await Promise.all([
                api.get('/mobile/user/profile').catch(() => ({ data: null })),
                api.get('/mobile/analytics').catch(() => ({ data: { stats: {} } })),
                api.get('/scores/me').catch(() => ({ data: null })),
            ]);
            setProfileData(profileRes.data);
            setAnalyticsData(analyticsRes.data?.stats || {});
            setScoreData(scoreRes.data);
        } catch (error) {
            console.error('[ProfileScreen] Error fetching profile:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfile();
    }, [fetchProfile]);

    const handleLanguageChange = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const langs = [
            { label: 'Türkçe', value: 'tr' },
            { label: 'English', value: 'en' },
        ];
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [...langs.map(l => l.label), 'İptal'],
                    cancelButtonIndex: langs.length,
                    title: 'Dil Seçin',
                },
                (idx) => {
                    if (idx < langs.length) {
                        const chosen = langs[idx].value;
                        setLanguage(chosen as 'tr' | 'en');
                        api.patch('/mobile/user/account/language', { language: chosen }).catch(console.error);
                    }
                }
            );
        } else {
            Alert.alert(
                'Dil Seçin',
                undefined,
                [
                    ...langs.map(l => ({
                        text: l.label,
                        onPress: () => {
                            setLanguage(l.value as 'tr' | 'en');
                            api.patch('/mobile/user/account/language', { language: l.value }).catch(console.error);
                        },
                    })),
                    { text: 'İptal', style: 'cancel' as const },
                ]
            );
        }
    };

    const handleNotificationSettings = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'denied') {
            Alert.alert(
                'Bildirimler Kapalı',
                'Bildirimleri etkinleştirmek için lütfen sistem ayarlarını açın.',
                [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
                ]
            );
        } else {
            await Notifications.requestPermissionsAsync();
            Linking.openSettings();
        }
    };

    const handleDeleteAccount = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            'Hesabımı Sil',
            'Tüm verileriniz 30 gün içinde kalıcı olarak silinecek. Bu işlem geri alınamaz.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Devam Et',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Emin misiniz?',
                            'Hesabınızı kalıcı olarak silmek istediğinizi onaylayın.',
                            [
                                { text: 'Vazgeç', style: 'cancel' },
                                {
                                    text: 'Evet, Sil',
                                    style: 'destructive',
                                    onPress: async () => {
                                        setDeletingAccount(true);
                                        try {
                                            await api.delete('/mobile/user/account');
                                            Alert.alert(
                                                'Hesap Silindi',
                                                'Hesabınız başarıyla silindi.',
                                                [{ text: 'Tamam', onPress: () => logout() }]
                                            );
                                        } catch (e: any) {
                                            Alert.alert('Hata', e?.response?.data?.message || 'Hesap silinemedi.');
                                        } finally {
                                            setDeletingAccount(false);
                                        }
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    const displayName = user?.name || user?.handle || t('common.user', language);
    const initials = displayName.slice(0, 2).toUpperCase();

    const statItems = [
        {
            label: t('profile.stats.modules', language),
            value: profileData?.stats?.modules || 0,
            icon: 'document-text-outline' as const,
        },
        {
            label: t('profile.stats.collections', language),
            value: profileData?.stats?.collections || 0,
            icon: 'folder-outline' as const,
        },
        {
            label: t('profile.stats.studyTime', language),
            value: `${analyticsData?.totalStudyMinutes || 0} ${t('dashboard.stats.minutesUnit', language)}`,
            icon: 'time-outline' as const,
        },
    ];

    return (
        <Screen tabScreen style={styles.screen}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: TAB_SCREEN_CONTENT_BOTTOM }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#334155" />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('profile.title', language)}</Text>
                </View>

                {/* Profile Hero */}
                <View style={styles.profileHero}>
                    <View style={styles.heroAvatarRow}>
                        {user?.image ? (
                            <Image source={{ uri: user.image }} style={styles.heroAvatarImage} />
                        ) : (
                            <View style={styles.heroAvatar}>
                                <Text style={styles.heroInitials}>{initials}</Text>
                            </View>
                        )}
                        <View style={styles.heroInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={styles.heroName}>{displayName}</Text>
                                {scoreData && (
                                    <View style={styles.levelBadge}>
                                        <Text style={styles.levelBadgeText}>
                                            Lvl {Math.floor((scoreData.momentum.allTime || 0) / 500) + 1}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {user?.email && <Text style={styles.heroEmail}>{user.email}</Text>}
                            {user?.handle && (
                                <Text style={styles.handleText}>@{user.handle}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Momentum Score */}
                {scoreData && (
                    <View style={styles.momentumCard}>
                        <View style={styles.momentumHeader}>
                            <Text style={styles.momentumLabel}>MOMENTUM</Text>
                            <View style={styles.tierChip}>
                                <Text style={styles.tierChipText}>
                                    {scoreData.tier.thisMonth.label}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.momentumScore}>
                            {scoreData.momentum.thisMonth >= 1000
                                ? `${(scoreData.momentum.thisMonth / 1000).toFixed(1)}K`
                                : scoreData.momentum.thisMonth.toLocaleString('tr-TR')}
                        </Text>

                        <View style={styles.momentumProgressBg}>
                            <View
                                style={[
                                    styles.momentumProgressFill,
                                    { width: `${scoreData.tier.thisMonth.progress}%` }
                                ]}
                            />
                        </View>
                        {scoreData.tier.thisMonth.pointsToNext != null && (
                            <Text style={styles.momentumProgressLabel}>
                                Sonraki seviye için {scoreData.tier.thisMonth.pointsToNext.toLocaleString('tr-TR')}
                            </Text>
                        )}

                        <View style={styles.momentumMetrics}>
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>{scoreData.metrics.studyMinutes}</Text>
                                <Text style={styles.momentumMetricLabel}>Dakika</Text>
                            </View>
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>{scoreData.metrics.cardsReviewed}</Text>
                                <Text style={styles.momentumMetricLabel}>Kart</Text>
                            </View>
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>%{Math.round(scoreData.metrics.accuracyRate * 100)}</Text>
                                <Text style={styles.momentumMetricLabel}>Doğruluk</Text>
                            </View>
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>{scoreData.metrics.activeDays}</Text>
                                <Text style={styles.momentumMetricLabel}>Gün</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Badges Grid */}
                {scoreData?.badges && scoreData.badges.length > 0 && (
                    <View style={styles.badgesSection}>
                        <Text style={styles.sectionTitle}>BAŞARILAR</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
                            {scoreData.badges.map((badge, idx) => (
                                <View key={idx} style={styles.badgeItem}>
                                    <View style={styles.badgeIconBg}>
                                        <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                                    </View>
                                    <Text style={styles.badgeLabel} numberOfLines={2}>{badge.label}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Stats */}
                <View style={styles.statsColumn}>
                    {statItems.map((stat, i) => (
                        <View key={i} style={styles.statRow}>
                            <Ionicons name={stat.icon} size={24} color="#64748B" />
                            <View style={styles.statContent}>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                                <Text style={styles.statValue}>{stat.value}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Settings */}
                <View style={styles.settingsSection}>
                    <Text style={styles.settingsTitle}>{t('profile.settings.title', language)}</Text>

                    <View style={styles.settingsGroup}>
                        <TouchableOpacity style={styles.settingsItem} onPress={handleLanguageChange}>
                            <Text style={styles.settingsItemText}>{t('profile.settings.language', language)}</Text>
                            <View style={styles.settingsItemRight}>
                                <Text style={styles.settingsItemValue}>{language === 'tr' ? 'Türkçe' : 'English'}</Text>
                                <Ionicons name="chevron-forward" size={18} color="#475569" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.settingsDivider} />

                        <TouchableOpacity style={styles.settingsItem} onPress={handleNotificationSettings}>
                            <Text style={styles.settingsItemText}>{t('profile.settings.notifications', language)}</Text>
                            <Ionicons name="chevron-forward" size={18} color="#475569" />
                        </TouchableOpacity>

                        <View style={styles.settingsDivider} />

                        <TouchableOpacity
                            style={styles.settingsItem}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <View>
                                <Text style={styles.settingsItemText}>{t('profile.settings.about', language)}</Text>
                                <Text style={styles.settingsItemSubtext}>v{Constants.expoConfig?.version || '1.0.0'}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#475569" />
                        </TouchableOpacity>

                        <View style={styles.settingsDivider} />

                        <TouchableOpacity
                            style={styles.settingsItem}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                Linking.openURL('https://learnaxia.com/privacy');
                            }}
                        >
                            <Text style={styles.settingsItemText}>Gizlilik Politikası</Text>
                            <Ionicons name="open-outline" size={16} color="#475569" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout */}
                <View style={styles.logoutContainer}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.logoutButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            logout();
                        }}
                    >
                        <Text style={styles.logoutText}>{t('profile.settings.logout', language)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.logoutButton, { marginTop: 12 }]}
                        onPress={handleDeleteAccount}
                        disabled={deletingAccount}
                    >
                        <Text style={[styles.logoutText, { color: '#EF4444' }]}>
                            {deletingAccount ? 'Siliniyor...' : 'Hesabımı Sil'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 64,
        paddingBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#F8FAFC',
        letterSpacing: -0.5,
    },
    profileHero: {
        marginHorizontal: 24,
        marginBottom: 24,
    },
    heroAvatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroAvatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    heroAvatarImage: {
        width: 72,
        height: 72,
        borderRadius: 36,
        marginRight: 16,
    },
    heroInitials: {
        color: '#F8FAFC',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 1,
    },
    heroInfo: {
        flex: 1,
    },
    heroName: {
        color: '#F8FAFC',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    heroEmail: {
        color: '#64748B',
        fontSize: 14,
        marginBottom: 4,
    },
    handleText: {
        color: '#475569',
        fontSize: 13,
        fontWeight: '500',
    },
    levelBadge: {
        marginLeft: 8,
        backgroundColor: '#1E293B',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#334155',
    },
    levelBadgeText: {
        color: '#F8FAFC',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    badgesSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        marginLeft: 24,
        marginBottom: 12,
    },
    badgesScroll: {
        paddingHorizontal: 24,
        gap: 12,
    },
    badgeItem: {
        width: 80,
        alignItems: 'center',
    },
    badgeIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    badgeEmoji: {
        fontSize: 28,
    },
    badgeLabel: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14,
    },
    momentumCard: {
        marginHorizontal: 24,
        marginBottom: 24,
        borderRadius: 20,
        padding: 24,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#111111',
    },
    momentumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    momentumLabel: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
    },
    tierChip: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 99,
        backgroundColor: '#1E293B',
    },
    tierChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#F8FAFC',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    momentumScore: {
        fontSize: 48,
        fontWeight: '700',
        color: '#F8FAFC',
        letterSpacing: -1,
        marginBottom: 12,
    },
    momentumProgressBg: {
        height: 4,
        borderRadius: 99,
        backgroundColor: '#1E293B',
        marginBottom: 8,
        overflow: 'hidden',
    },
    momentumProgressFill: {
        height: '100%',
        borderRadius: 99,
        backgroundColor: '#F8FAFC',
    },
    momentumProgressLabel: {
        color: '#475569',
        fontSize: 12,
        marginBottom: 24,
    },
    momentumMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#111111',
    },
    momentumMetricItem: {
        flex: 1,
        alignItems: 'center',
    },
    momentumMetricVal: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    momentumMetricLabel: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '500',
    },
    statsColumn: {
        marginHorizontal: 24,
        marginBottom: 32,
        gap: 12,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#111111',
    },
    statContent: {
        flex: 1,
        marginLeft: 16,
    },
    statLabel: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '500',
    },
    statValue: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 4,
        letterSpacing: -0.3,
    },
    settingsSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    settingsTitle: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 13,
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    settingsGroup: {
        backgroundColor: '#0A0A0A',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#111111',
        overflow: 'hidden',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    settingsItemText: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '500',
    },
    settingsItemSubtext: {
        color: '#64748B',
        fontSize: 12,
        marginTop: 2,
    },
    settingsItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsItemValue: {
        color: '#64748B',
        marginRight: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    settingsDivider: {
        height: 1,
        backgroundColor: '#111111',
        marginLeft: 20,
    },
    logoutContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    logoutButton: {
        paddingVertical: 16,
        borderRadius: 99,
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#111111',
    },
    logoutText: {
        color: '#F8FAFC',
        fontWeight: '600',
        fontSize: 15,
    },
});
