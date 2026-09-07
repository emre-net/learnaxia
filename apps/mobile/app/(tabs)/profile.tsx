import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, RefreshControl, StyleSheet, Linking, Alert, ActionSheetIOS, Platform } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Theme as SharedTheme, t } from '@learnaxia/shared';
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

    // Dil değiştirme
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

    // Bildirim ayarları — sistem ayarlarına yönlendir
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

    // Hesap silme
    const handleDeleteAccount = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            'Hesabımı Sil',
            'Tüm verileriniz (modüller, istatistikler, Momentum puanları) 30 gün içinde kalıcı olarak silinecek. Bu işlem geri alınamaz.',
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

    // Gradient avatar rengi — ismin ilk harfine göre deterministik
    const AVATAR_COLORS: [string, string][] = [
        ['#3B82F6', '#8B5CF6'], ['#06B6D4', '#3B82F6'],
        ['#10B981', '#06B6D4'], ['#F59E0B', '#EF4444'], ['#8B5CF6', '#EC4899'],
    ];
    const displayName = user?.name || user?.handle || t('common.user', language);
    const colorPair = AVATAR_COLORS[(displayName.charCodeAt(0) || 0) % AVATAR_COLORS.length];
    const initials = displayName.slice(0, 2).toUpperCase();

    /** Profil istatistikleri — 3 kart için düzenli grid yerine column layout */
    const statItems = [
        {
            label: t('profile.stats.modules', language),
            value: profileData?.stats?.modules || 0,
            icon: 'menu-book' as const,
            color: SharedTheme.colors.brandBlue,
        },
        {
            label: t('profile.stats.collections', language),
            value: profileData?.stats?.collections || 0,
            icon: 'folder-special' as const,
            color: SharedTheme.colors.brandPurple,
        },
        {
            label: t('profile.stats.studyTime', language),
            value: `${analyticsData?.totalStudyMinutes || 0} ${t('dashboard.stats.minutesUnit', language)}`,
            icon: 'schedule' as const,
            color: SharedTheme.colors.brandEmerald,
        },
    ];

    return (
        <Screen tabScreen style={{ backgroundColor: SharedTheme.colors.background }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: TAB_SCREEN_CONTENT_BOTTOM }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('profile.title', language)}</Text>
                </View>

                {/* ─── HERO PROFILE HEADER ─────────────────────────────────────── */}
                <View style={styles.profileHero}>
                    {/* Gradient arkaplan */}
                    <LinearGradient
                        colors={[`${colorPair[0]}25`, `${colorPair[1]}10`, 'transparent']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
                    />

                    {/* Avatar + isim */}
                    <View style={styles.heroAvatarRow}>
                        {user?.image ? (
                            <Image source={{ uri: user.image }} style={styles.heroAvatarImage} />
                        ) : (
                            <LinearGradient colors={colorPair} style={styles.heroAvatar}>
                                <Text style={styles.heroInitials}>{initials}</Text>
                            </LinearGradient>
                        )}
                        <View style={styles.heroInfo}>
                            <Text style={styles.heroName}>{displayName}</Text>
                            {user?.email && <Text style={styles.heroEmail}>{user.email}</Text>}
                            {user?.handle && (
                                <View style={styles.handleBadge}>
                                    <Text style={styles.handleText}>@{user.handle}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* ─── MOMENTUM SCORE CARD ────────────────────────────────────── */}
                {scoreData && (
                    <View style={styles.momentumCard}>
                        <LinearGradient
                            colors={[`${scoreData.tier.thisMonth.color}20`, 'transparent']}
                            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                        />

                        {/* Başlık */}
                        <View style={styles.momentumHeader}>
                            <Text style={styles.momentumLabel}>MOMENTUM</Text>
                            <View style={[styles.tierChip, { borderColor: `${scoreData.tier.thisMonth.color}40`, backgroundColor: `${scoreData.tier.thisMonth.color}15` }]}>
                                <Text style={styles.tierChipText}>
                                    {scoreData.tier.thisMonth.emoji} {scoreData.tier.thisMonth.label}
                                </Text>
                            </View>
                        </View>

                        {/* Büyük skor */}
                        <Text style={[styles.momentumScore, { color: scoreData.tier.thisMonth.color }]}>
                            {scoreData.momentum.thisMonth >= 1000
                                ? `${(scoreData.momentum.thisMonth / 1000).toFixed(1)}K`
                                : scoreData.momentum.thisMonth.toLocaleString('tr-TR')}
                        </Text>

                        {/* Progress bar */}
                        <View style={styles.momentumProgressBg}>
                            <View
                                style={[
                                    styles.momentumProgressFill,
                                    {
                                        width: `${scoreData.tier.thisMonth.progress}%`,
                                        backgroundColor: scoreData.tier.thisMonth.color,
                                    }
                                ]}
                            />
                        </View>
                        {scoreData.tier.thisMonth.pointsToNext != null && (
                            <Text style={styles.momentumProgressLabel}>
                                Sonraki tier için {scoreData.tier.thisMonth.pointsToNext.toLocaleString('tr-TR')} puan
                            </Text>
                        )}

                        {/* Mini metrikler */}
                        <View style={styles.momentumMetrics}>
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>{scoreData.metrics.studyMinutes} dk</Text>
                                <Text style={styles.momentumMetricLabel}>Çalışma</Text>
                            </View>
                            <View style={styles.momentumMetricDivider} />
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>{scoreData.metrics.cardsReviewed}</Text>
                                <Text style={styles.momentumMetricLabel}>Kart</Text>
                            </View>
                            <View style={styles.momentumMetricDivider} />
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>%{Math.round(scoreData.metrics.accuracyRate * 100)}</Text>
                                <Text style={styles.momentumMetricLabel}>Doğruluk</Text>
                            </View>
                            <View style={styles.momentumMetricDivider} />
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>{scoreData.metrics.activeDays} gün</Text>
                                <Text style={styles.momentumMetricLabel}>Aktif</Text>
                            </View>
                        </View>

                        {/* Rozetler */}
                        {scoreData.badges.length > 0 && (
                            <View style={styles.momentumBadges}>
                                {scoreData.badges.slice(0, 5).map(badge => (
                                    <View key={badge.key} style={styles.momentumBadgeChip}>
                                        <Text style={styles.momentumBadgeEmoji}>{badge.emoji}</Text>
                                        <Text style={styles.momentumBadgeLabel}>{badge.label}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Stats — 3 kart tek sütun olarak */}
                <View style={styles.statsColumn}>
                    {statItems.map((stat, i) => (
                        <View key={i} style={styles.statRow}>
                            <View style={[styles.statIcon, { backgroundColor: `${stat.color}18` }]}>
                                <MaterialIcons name={stat.icon} size={20} color={stat.color} />
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                                <Text style={styles.statValue}>{stat.value}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Settings Section */}
                <View style={styles.settingsSection}>
                    <Text style={styles.settingsTitle}>{t('profile.settings.title', language)}</Text>

                    {/* Dil */}
                    <TouchableOpacity
                        style={styles.settingsItem}
                        onPress={handleLanguageChange}
                    >
                        <View style={styles.settingsItemLeft}>
                            <View style={[styles.settingsIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <MaterialIcons name="language" size={20} color="#60A5FA" />
                            </View>
                            <Text style={styles.settingsItemText}>{t('profile.settings.language', language)}</Text>
                        </View>
                        <View style={styles.settingsItemRight}>
                            <Text style={styles.settingsItemValue}>{language === 'tr' ? 'Türkçe' : 'English'}</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
                        </View>
                    </TouchableOpacity>

                    {/* Bildirimler */}
                    <TouchableOpacity
                        style={styles.settingsItem}
                        onPress={handleNotificationSettings}
                    >
                        <View style={styles.settingsItemLeft}>
                            <View style={[styles.settingsIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                <MaterialIcons name="notifications" size={20} color="#FBBF24" />
                            </View>
                            <Text style={styles.settingsItemText}>{t('profile.settings.notifications', language)}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
                    </TouchableOpacity>

                    {/* Hakkında — Statik bilgi, çalışır hale getirildi */}
                    <TouchableOpacity
                        style={styles.settingsItem}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const appVersion = Constants.expoConfig?.version || '1.0.0';
                            const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';
                        }}
                    >
                        <View style={styles.settingsItemLeft}>
                            <View style={[styles.settingsIconContainer, { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                                <MaterialIcons name="info-outline" size={20} color="#2DD4BF" />
                            </View>
                            <View>
                                <Text style={styles.settingsItemText}>{t('profile.settings.about', language)}</Text>
                                <Text style={styles.settingsItemSubtext}>
                                    Learnaxia v{Constants.expoConfig?.version || '1.0.0'}
                                </Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
                    </TouchableOpacity>

                    {/* Gizlilik Politikası */}
                    <TouchableOpacity
                        style={styles.settingsItem}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Linking.openURL('https://learnaxia.com/privacy');
                        }}
                    >
                        <View style={styles.settingsItemLeft}>
                            <View style={[styles.settingsIconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                <MaterialIcons name="privacy-tip" size={20} color="#818CF8" />
                            </View>
                            <Text style={styles.settingsItemText}>Gizlilik Politikası</Text>
                        </View>
                        <MaterialIcons name="open-in-new" size={16} color="#4B5563" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <View style={styles.logoutContainer}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.logoutButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            logout();
                        }}
                    >
                        <View style={styles.logoutContent}>
                            <MaterialIcons name="logout" size={20} color="#ef4444" />
                            <Text style={styles.logoutText}>{t('profile.settings.logout', language)}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Hesabımı Sil */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.logoutButton, { borderColor: 'rgba(239, 68, 68, 0.15)', marginTop: 8 }]}
                        onPress={handleDeleteAccount}
                        disabled={deletingAccount}
                    >
                        <View style={styles.logoutContent}>
                            <MaterialIcons name="delete-forever" size={20} color="#7f1d1d" />
                            <Text style={[styles.logoutText, { color: '#7f1d1d' }]}>
                                {deletingAccount ? 'Siliniyor...' : 'Hesabımı Sil'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#F8FAFC',
        letterSpacing: -0.5,
    },
    profileCard: {
        marginHorizontal: 24,
        marginTop: 16,
        backgroundColor: '#090F1D',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#182234',
    },
    // ─── HERO PROFILE ─────────────────────────────────────────────────────────
    profileHero: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 28,
        padding: 24,
        backgroundColor: 'rgba(9, 15, 29, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    heroAvatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    heroAvatar: {
        width: 72,
        height: 72,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    heroAvatarImage: {
        width: 72,
        height: 72,
        borderRadius: 22,
        marginRight: 16,
    },
    heroInitials: {
        color: 'white',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 1,
    },
    heroInfo: {
        flex: 1,
    },
    heroName: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    heroEmail: {
        color: '#64748B',
        fontSize: 12,
        marginBottom: 6,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        marginBottom: 20,
        gap: 6,
    },
    levelText: {
        fontSize: 12,
        fontWeight: '700',
    },
    levelXp: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11,
        fontWeight: '500',
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'nowrap',
    },
    badgeItem: {
        alignItems: 'center',
        flex: 1,
    },
    badgeIcon: {
        fontSize: 22,
        marginBottom: 4,
    },
    badgeLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 9,
        fontWeight: '600',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // ─────────────────────────────────────────────────────────────────────────
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: 'rgba(30,144,255,0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,

    },
    avatarImage: {
        width: 64,
        height: 64,
        borderRadius: 16,
    },
    avatarText: {
        color: '#F8FAFC',
        fontSize: 24,
        fontWeight: '800',
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    profileEmail: {
        color: '#64748B',
        fontSize: 13,
        marginTop: 2,
        fontWeight: '500',
    },
    handleBadge: {
        marginTop: 6,
        alignSelf: 'flex-start',
        backgroundColor: '#182234',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    handleText: {
        color: '#60A5FA',
        fontSize: 11,
        fontWeight: '600',
    },
    // Stats — Tek sütun, 3 kart için ideal
    statsColumn: {
        marginHorizontal: 24,
        marginTop: 16,
        gap: 12,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#090F1D',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#182234',
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    statContent: {
        flex: 1,
    },
    statLabel: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '800',
        marginTop: 2,
    },
    settingsSection: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
    settingsTitle: {
        color: '#F8FAFC',
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 12,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#090F1D',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#182234',
        marginBottom: 12,
    },
    settingsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    settingsItemText: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '600',
    },
    settingsItemSubtext: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 1,
    },
    settingsItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsItemValue: {
        color: '#64748B',
        marginRight: 8,
        fontSize: 13,
        fontWeight: '500',
    },
    logoutContainer: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
    logoutButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 8,
    },
    // ─── MOMENTUM CARD ────────────────────────────────────────────────────────
    momentumCard: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 24,
        padding: 20,
        backgroundColor: 'rgba(9, 15, 29, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
    momentumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    momentumLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
    },
    tierChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 99,
        borderWidth: 1,
    },
    tierChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    momentumScore: {
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: -1,
        marginBottom: 12,
    },
    momentumProgressBg: {
        height: 4,
        borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginBottom: 6,
        overflow: 'hidden',
    },
    momentumProgressFill: {
        height: '100%',
        borderRadius: 99,
    },
    momentumProgressLabel: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 11,
        marginBottom: 16,
    },
    momentumMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    momentumMetricItem: {
        flex: 1,
        alignItems: 'center',
    },
    momentumMetricVal: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '800',
    },
    momentumMetricLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    momentumMetricDivider: {
        width: 1,
        height: 28,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    momentumBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    momentumBadgeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    momentumBadgeEmoji: {
        fontSize: 13,
    },
    momentumBadgeLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontWeight: '600',
    },
});
