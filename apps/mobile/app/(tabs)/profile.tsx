import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, Image, ScrollView,
    RefreshControl, StyleSheet, Linking, Alert, ActionSheetIOS,
    Platform, Modal, TextInput, KeyboardAvoidingView, Switch
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import {
    t,
    BADGE_DEFINITIONS,
    type BadgeKey,
    type Badge,
    ProfileUpdateSchema,
    ChangePasswordSchema,
    extractApiErrorMessage,
} from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import { useTokenWallet } from '@/hooks/use-token-wallet';
import { TokenWalletBanner } from '@/components/tokens/token-wallet-banner';
import { OfflineStorageService } from '@/services/offline-storage.service';
import api from '@/lib/api';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';

const ALL_BADGE_KEYS = Object.keys(BADGE_DEFINITIONS) as BadgeKey[];

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, refreshProfile } = useAuth();
    const { language, setLanguage } = useLanguage();
    const { refreshWallet } = useTokenWallet();
    const isTr = language === 'tr';
    const [syncCounts, setSyncCounts] = useState({ pending: 0, dead: 0 });
    const [syncingQueue, setSyncingQueue] = useState(false);

    const [profileData, setProfileData] = useState<{
        stats?: { modules: number; collections: number; notes?: number; journeys?: number; solvedQuestions?: number };
    } | null>(null);
    const [scoreData, setScoreData] = useState<{
        momentum: { thisMonth: number; allTime: number };
        tier: {
            thisMonth: { key: string; label: string; emoji: string; color: string; progress: number; pointsToNext: number | null };
            allTime?: { key: string; label: string; emoji: string; color: string; progress: number; pointsToNext: number | null };
        };
        metrics: { studyMinutes: number; cardsReviewed: number; accuracyRate: number; activeDays: number };
        badges: Badge[];
    } | null>(null);
    const [momentumView, setMomentumView] = useState<'thisMonth' | 'allTime'>('thisMonth');

    const [userSettings, setUserSettings] = useState({
        soundEnabled: true,
        showStudyTimer: true,
        emailNotifications: true,
        moduleNotifications: true,
    });

    const [refreshing, setRefreshing] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [avatarFailed, setAvatarFailed] = useState(false);

    // Edit Profile Modal
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editHandle, setEditHandle] = useState('');
    const [editImage, setEditImage] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    // Change Password Modal
    const [pwModalVisible, setPwModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [savingPw, setSavingPw] = useState(false);

    // Badge Detail Modal
    const [selectedBadge, setSelectedBadge] = useState<(Badge & { earned: boolean }) | null>(null);

    const openEditModal = () => {
        setEditName(user?.name || '');
        setEditHandle(user?.handle || '');
        setEditImage(user?.image || '');
        setAvatarFailed(false);
        setEditModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleSaveProfile = async () => {
        const trimmedName = editName.trim();
        const trimmedHandle = editHandle.trim().replace(/^@/, '');
        const trimmedImage = editImage.trim();

        const parsed = ProfileUpdateSchema.safeParse({
            name: trimmedName || null,
            handle: trimmedHandle,
            image: trimmedImage || '',
        });

        if (!parsed.success) {
            Alert.alert('Hata', parsed.error.issues[0]?.message || 'Geçersiz profil bilgisi');
            return;
        }

        setSavingProfile(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await api.patch('/mobile/user/profile', {
                name: trimmedName || null,
                handle: trimmedHandle,
                image: trimmedImage || '',
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setAvatarFailed(false);
            await refreshProfile();
            setEditModalVisible(false);
            Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
        } catch (error) {
            Alert.alert('Hata', extractApiErrorMessage(error, 'Profil güncellenirken bir hata oluştu.'));
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmNewPassword) {
            Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
            return;
        }
        const parsed = ChangePasswordSchema.safeParse({ currentPassword, newPassword });
        if (!parsed.success) {
            Alert.alert('Hata', parsed.error.issues[0]?.message || 'Geçersiz şifre.');
            return;
        }

        setSavingPw(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const res = await api.post('/user/password', { currentPassword, newPassword });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPwModalVisible(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            Alert.alert('Başarılı', res.data?.message || 'Şifreniz başarıyla güncellendi.');
        } catch (err) {
            Alert.alert('Hata', extractApiErrorMessage(err, 'Şifre güncellenemedi.'));
        } finally {
            setSavingPw(false);
        }
    };

    const updateSetting = async (key: keyof typeof userSettings, val: boolean) => {
        Haptics.selectionAsync();
        const prev = userSettings[key];
        setUserSettings((s) => ({ ...s, [key]: val }));
        try {
            await api.patch('/user/settings', { [key]: val });
        } catch {
            setUserSettings((s) => ({ ...s, [key]: prev }));
            Alert.alert('Hata', 'Tercih kaydedilemedi.');
        }
    };

    const fetchProfile = useCallback(async () => {
        try {
            const [profileRes, scoreRes, settingsRes, pending, dead] = await Promise.all([
                api.get('/mobile/user/profile').catch(() => ({ data: null })),
                api.get('/scores/me').catch(() => ({ data: null })),
                api.get('/user/settings').catch(() => ({ data: null })),
                OfflineStorageService.getPendingQueueCount(),
                OfflineStorageService.getDeadLetterCount(),
            ]);
            setProfileData(profileRes.data);
            setScoreData(scoreRes.data);
            setSyncCounts({ pending, dead });
            refreshWallet();
            if (settingsRes.data) {
                setUserSettings({
                    soundEnabled: settingsRes.data.soundEnabled ?? true,
                    showStudyTimer: settingsRes.data.showStudyTimer ?? true,
                    emailNotifications: settingsRes.data.emailNotifications ?? true,
                    moduleNotifications: settingsRes.data.moduleNotifications ?? true,
                });
            }
        } catch (error) {
            if (__DEV__) console.error('[ProfileScreen] Error fetching profile:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [fetchProfile])
    );

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
                    options: [...langs.map((l) => l.label), 'İptal'],
                    cancelButtonIndex: langs.length,
                    title: 'Dil Seçin',
                },
                (idx) => {
                    if (idx < langs.length) {
                        const chosen = langs[idx].value as 'tr' | 'en';
                        setLanguage(chosen);
                        refreshProfile();
                    }
                }
            );
        } else {
            Alert.alert('Dil Seçin', undefined, [
                ...langs.map((l) => ({
                    text: l.label,
                    onPress: async () => {
                        await setLanguage(l.value as 'tr' | 'en');
                        refreshProfile();
                    },
                })),
                { text: 'İptal', style: 'cancel' as const },
            ]);
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
                                            Alert.alert('Hesap Silindi', 'Hesabınız başarıyla silindi.', [
                                                { text: 'Tamam', onPress: () => logout() },
                                            ]);
                                        } catch (e) {
                                            Alert.alert('Hata', extractApiErrorMessage(e, 'Hesap silinemedi.'));
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

    const displayName = user?.name?.trim() || (user?.handle ? `@${user.handle}` : t('common.user', language));
    const initials = (user?.name?.trim() || user?.handle || 'LX').slice(0, 2).toUpperCase();

    const activeTier =
        momentumView === 'allTime' && scoreData?.tier?.allTime
            ? scoreData.tier.allTime
            : scoreData?.tier?.thisMonth;
    const activeMomentum =
        momentumView === 'allTime'
            ? scoreData?.momentum?.allTime || 0
            : scoreData?.momentum?.thisMonth || 0;

    const earnedBadgeKeys = new Set((scoreData?.badges || []).map((b) => b.key));

    const statItems = [
        {
            tab: 'modules',
            label: t('profile.stats.modules', language),
            value: profileData?.stats?.modules || 0,
            icon: 'document-text-outline' as const,
        },
        {
            tab: 'collections',
            label: t('profile.stats.collections', language),
            value: profileData?.stats?.collections || 0,
            icon: 'folder-outline' as const,
        },
        {
            tab: 'notes',
            label: t('profile.stats.notes', language),
            value: profileData?.stats?.notes || 0,
            icon: 'book-outline' as const,
        },
        {
            tab: 'journeys',
            label: t('library.tabs.journeys', language),
            value: profileData?.stats?.journeys || 0,
            icon: 'map-outline' as const,
        },
        {
            tab: 'solutions',
            label: t('library.tabs.aiSolutions', language),
            value: profileData?.stats?.solvedQuestions || 0,
            icon: 'sparkles-outline' as const,
        },
    ];

    return (
        <Screen tabScreen style={styles.screen}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: TAB_SCREEN_CONTENT_BOTTOM }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#71717A" />}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('profile.title', language)}</Text>
                </View>

                {/* Profile Hero */}
                <View style={styles.profileHero}>
                    <View style={styles.heroAvatarRow}>
                        {Boolean(user?.image) && !avatarFailed ? (
                            <Image
                                source={{ uri: user!.image! }}
                                style={styles.heroAvatarImage}
                                onError={() => setAvatarFailed(true)}
                            />
                        ) : (
                            <View style={styles.heroAvatar}>
                                <Text style={styles.heroInitials}>{initials}</Text>
                            </View>
                        )}
                        <View style={styles.heroInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                                <Text style={styles.heroName} numberOfLines={1}>{displayName}</Text>
                                {activeTier && (
                                    <View style={styles.levelBadge}>
                                        <Text style={[styles.levelBadgeText, { color: activeTier.color || '#38BDF8' }]}>
                                            {activeTier.emoji} {activeTier.label}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {user?.handle && <Text style={styles.handleText}>@{user.handle}</Text>}
                            {user?.email && <Text style={styles.heroEmail}>{user.email}</Text>}
                        </View>
                    </View>
                    <TouchableOpacity style={styles.editProfileBtn} onPress={openEditModal} activeOpacity={0.7}>
                        <Ionicons name="pencil" size={13} color="#F4F4F5" style={{ marginRight: 6 }} />
                        <Text style={styles.editProfileBtnText}>{isTr ? 'Profili Düzenle' : 'Edit Profile'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Momentum Score with Month / All-Time Toggle */}
                {scoreData && activeTier && (
                    <View style={styles.momentumCard}>
                        <View style={styles.momentumHeader}>
                            <View style={styles.viewToggleRow}>
                                <TouchableOpacity
                                    onPress={() => setMomentumView('thisMonth')}
                                    style={[styles.viewToggleBtn, momentumView === 'thisMonth' && styles.viewToggleBtnActive]}
                                >
                                    <Text style={[styles.viewToggleText, momentumView === 'thisMonth' && styles.viewToggleTextActive]}>
                                        {isTr ? 'Bu Ay' : 'This Month'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setMomentumView('allTime')}
                                    style={[styles.viewToggleBtn, momentumView === 'allTime' && styles.viewToggleBtnActive]}
                                >
                                    <Text style={[styles.viewToggleText, momentumView === 'allTime' && styles.viewToggleTextActive]}>
                                        {isTr ? 'Tüm Zamanlar' : 'All Time'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.tierChip}>
                                <Text style={styles.tierChipText}>{activeTier.emoji} {activeTier.label}</Text>
                            </View>
                        </View>

                        <Text style={styles.momentumScore}>
                            {activeMomentum >= 1000
                                ? `${(activeMomentum / 1000).toFixed(1)}K`
                                : activeMomentum.toLocaleString(isTr ? 'tr-TR' : 'en-US')}
                        </Text>

                        <View style={styles.momentumProgressBg}>
                            <View
                                style={[
                                    styles.momentumProgressFill,
                                    { width: `${activeTier.progress}%`, backgroundColor: activeTier.color || '#38BDF8' },
                                ]}
                            />
                        </View>
                        {activeTier.pointsToNext != null && (
                            <Text style={styles.momentumProgressLabel}>
                                {isTr
                                    ? `Sonraki seviye için ${activeTier.pointsToNext.toLocaleString('tr-TR')} pts`
                                    : `${activeTier.pointsToNext.toLocaleString('en-US')} pts to next tier`}
                            </Text>
                        )}

                        <View style={styles.momentumMetrics}>
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>{scoreData.metrics.studyMinutes}</Text>
                                <Text style={styles.momentumMetricLabel}>{isTr ? 'Dakika' : 'Min'}</Text>
                            </View>
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>{scoreData.metrics.cardsReviewed}</Text>
                                <Text style={styles.momentumMetricLabel}>{isTr ? 'Kart' : 'Cards'}</Text>
                            </View>
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>%{Math.round(scoreData.metrics.accuracyRate * 100)}</Text>
                                <Text style={styles.momentumMetricLabel}>{isTr ? 'Doğruluk' : 'Accuracy'}</Text>
                            </View>
                            <View style={styles.momentumMetricItem}>
                                <Text style={styles.momentumMetricVal}>{scoreData.metrics.activeDays}</Text>
                                <Text style={styles.momentumMetricLabel}>{isTr ? 'Gün' : 'Days'}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Shared Badges Showcase */}
                <View style={styles.badgesSection}>
                    <View style={styles.badgesHeader}>
                        <Text style={styles.sectionTitle}>{isTr ? 'Başarı Rozetleri' : 'Achievement Badges'}</Text>
                        <Text style={styles.badgeCountText}>
                            {earnedBadgeKeys.size} / {ALL_BADGE_KEYS.length}
                        </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
                        {ALL_BADGE_KEYS.map((key) => {
                            const badge = BADGE_DEFINITIONS[key];
                            const earned = earnedBadgeKeys.has(key);
                            return (
                                <TouchableOpacity
                                    key={key}
                                    activeOpacity={0.75}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedBadge({ ...badge, earned });
                                    }}
                                    style={[styles.badgeItem, !earned && { opacity: 0.45 }]}
                                >
                                    <View
                                        style={[
                                            styles.badgeIconBg,
                                            earned && { borderColor: badge.color || '#38BDF8', backgroundColor: `${badge.color}18` },
                                        ]}
                                    >
                                        <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                                    </View>
                                    <Text style={styles.badgeLabel} numberOfLines={2}>{badge.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* AI Token Wallet & Rewarded Ads */}
                <TokenWalletBanner variant="card" />

                {/* Performance & Competition Actions */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        activeOpacity={0.75}
                        style={styles.actionCard}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/leaderboard' as any);
                        }}
                    >
                        <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]}>
                            <Ionicons name="trophy" size={20} color="#EAB308" />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>{isTr ? 'Liderlik Sıralaması' : 'Leaderboard'}</Text>
                            <Text style={styles.actionSubtitle}>{isTr ? 'Sıralamadaki yerini gör' : 'View your ranking'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#71717A" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.75}
                        style={styles.actionCard}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/analytics' as any);
                        }}
                    >
                        <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                            <Ionicons name="stats-chart" size={20} color="#38BDF8" />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>{isTr ? 'Detaylı Analiz' : 'Detailed Analytics'}</Text>
                            <Text style={styles.actionSubtitle}>{isTr ? 'Çalışma verilerini incele' : 'Inspect study insights'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#71717A" />
                    </TouchableOpacity>
                </View>

                {/* 5 Library Entities Quick Jump Track */}
                <View style={{ marginBottom: 28 }}>
                    <Text style={[styles.sectionTitle, { marginLeft: 24, marginBottom: 12 }]}>
                        {isTr ? 'Kütüphanem' : 'My Library'}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                        {statItems.map((stat) => (
                            <TouchableOpacity
                                key={stat.tab}
                                activeOpacity={0.75}
                                style={styles.statCard}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    router.push(`/(tabs)/library?tab=${stat.tab}` as any);
                                }}
                            >
                                <View style={styles.statIconCircle}>
                                    <Ionicons name={stat.icon} size={20} color="#38BDF8" />
                                </View>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Settings */}
                <View style={styles.settingsSection}>
                    <Text style={styles.settingsTitle}>{t('profile.settings.title', language)}</Text>

                    <View style={styles.settingsGroup}>
                        <TouchableOpacity style={styles.settingsItem} onPress={openEditModal}>
                            <Text style={styles.settingsItemText}>{isTr ? 'Profili Düzenle' : 'Edit Profile'}</Text>
                            <View style={styles.settingsItemRight}>
                                <Text style={styles.settingsItemValue}>{user?.handle ? `@${user.handle}` : 'Ad & Handle'}</Text>
                                <Ionicons name="chevron-forward" size={18} color="#71717A" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.settingsDivider} />

                        <TouchableOpacity
                            style={styles.settingsItem}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setPwModalVisible(true);
                            }}
                        >
                            <Text style={styles.settingsItemText}>{isTr ? 'Şifre Değiştir' : 'Change Password'}</Text>
                            <Ionicons name="lock-closed-outline" size={17} color="#71717A" />
                        </TouchableOpacity>

                        <View style={styles.settingsDivider} />

                        <TouchableOpacity style={styles.settingsItem} onPress={handleLanguageChange}>
                            <Text style={styles.settingsItemText}>{t('profile.settings.language', language)}</Text>
                            <View style={styles.settingsItemRight}>
                                <Text style={styles.settingsItemValue}>{language === 'tr' ? 'Türkçe' : 'English'}</Text>
                                <Ionicons name="chevron-forward" size={18} color="#71717A" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.settingsDivider} />

                        <View style={styles.settingsItem}>
                            <Text style={styles.settingsItemText}>{isTr ? 'Çalışma Sesleri' : 'Study Sounds'}</Text>
                            <Switch
                                value={userSettings.soundEnabled}
                                onValueChange={(v) => updateSetting('soundEnabled', v)}
                                trackColor={{ false: '#27272A', true: '#0284C7' }}
                                thumbColor={userSettings.soundEnabled ? '#38BDF8' : '#71717A'}
                            />
                        </View>

                        <View style={styles.settingsDivider} />

                        <View style={styles.settingsItem}>
                            <Text style={styles.settingsItemText}>{isTr ? 'Çalışma Zamanlayıcısı' : 'Study Timer'}</Text>
                            <Switch
                                value={userSettings.showStudyTimer}
                                onValueChange={(v) => updateSetting('showStudyTimer', v)}
                                trackColor={{ false: '#27272A', true: '#0284C7' }}
                                thumbColor={userSettings.showStudyTimer ? '#38BDF8' : '#71717A'}
                            />
                        </View>

                        <View style={styles.settingsDivider} />

                        <View style={styles.settingsItem}>
                            <Text style={styles.settingsItemText}>{isTr ? 'E-posta Bildirimleri' : 'Email Notifications'}</Text>
                            <Switch
                                value={userSettings.emailNotifications}
                                onValueChange={(v) => updateSetting('emailNotifications', v)}
                                trackColor={{ false: '#27272A', true: '#0284C7' }}
                                thumbColor={userSettings.emailNotifications ? '#38BDF8' : '#71717A'}
                            />
                        </View>

                        <View style={styles.settingsDivider} />

                        <TouchableOpacity style={styles.settingsItem} onPress={handleNotificationSettings}>
                            <Text style={styles.settingsItemText}>{t('profile.settings.notifications', language)}</Text>
                            <Ionicons name="chevron-forward" size={18} color="#71717A" />
                        </TouchableOpacity>

                        {(syncCounts.pending > 0 || syncCounts.dead > 0) && (
                            <>
                                <View style={styles.settingsDivider} />
                                <TouchableOpacity
                                    style={styles.settingsItem}
                                    disabled={syncingQueue}
                                    onPress={async () => {
                                        setSyncingQueue(true);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        try {
                                            if (syncCounts.dead > 0) {
                                                await OfflineStorageService.retryDeadLetters();
                                            }
                                            const res = await OfflineStorageService.processSyncQueue(api);
                                            const [pending, dead] = await Promise.all([
                                                OfflineStorageService.getPendingQueueCount(),
                                                OfflineStorageService.getDeadLetterCount(),
                                            ]);
                                            setSyncCounts({ pending, dead });
                                            Alert.alert(
                                                'Senkronizasyon',
                                                `${res.synced} cevap gönderildi, ${pending + dead} bekliyor.`
                                            );
                                        } finally {
                                            setSyncingQueue(false);
                                        }
                                    }}
                                >
                                    <View>
                                        <Text style={styles.settingsItemText}>
                                            {isTr ? 'Çevrimdışı Senkron Kuyruğu' : 'Offline Sync Queue'}
                                        </Text>
                                        <Text style={styles.settingsItemSubtext}>
                                            {isTr
                                                ? `Bekleyen: ${syncCounts.pending} • Yeniden denenecek: ${syncCounts.dead}`
                                                : `Pending: ${syncCounts.pending} • Failed: ${syncCounts.dead}`}
                                        </Text>
                                    </View>
                                    <Text style={{ color: '#38BDF8', fontSize: 13, fontWeight: '700' }}>
                                        {syncingQueue ? '...' : (isTr ? 'Eşitle' : 'Sync')}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <View style={styles.settingsDivider} />

                        <TouchableOpacity
                            style={styles.settingsItem}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                Alert.alert(
                                    'LearnAxia',
                                    `Sürüm: v${Constants.expoConfig?.version || '1.0.0'}\n\nAkıllı ve kişiselleştirilmiş eğitim platformu.\nhttps://learnaxia.com`
                                );
                            }}
                        >
                            <View>
                                <Text style={styles.settingsItemText}>{t('profile.settings.about', language)}</Text>
                                <Text style={styles.settingsItemSubtext}>v{Constants.expoConfig?.version || '1.0.0'}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#71717A" />
                        </TouchableOpacity>

                        <View style={styles.settingsDivider} />

                        <TouchableOpacity
                            style={styles.settingsItem}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                Linking.openURL('https://learnaxia.com/privacy');
                            }}
                        >
                            <Text style={styles.settingsItemText}>{isTr ? 'Gizlilik Politikası' : 'Privacy Policy'}</Text>
                            <Ionicons name="open-outline" size={16} color="#71717A" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.logoutContainer}>
                    <TouchableOpacity
                        activeOpacity={0.75}
                        style={styles.logoutButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            logout();
                        }}
                    >
                        <Text style={styles.logoutText}>{t('profile.settings.logout', language)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.75}
                        style={[styles.logoutButton, { marginTop: 12 }]}
                        onPress={handleDeleteAccount}
                        disabled={deletingAccount}
                    >
                        <Text style={[styles.logoutText, { color: '#EF4444' }]}>
                            {deletingAccount ? 'Siliniyor...' : (isTr ? 'Hesabımı Sil' : 'Delete Account')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Profili Düzenle</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={20} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Kullanıcı Adı (@handle) *</Text>
                                <View style={styles.handleInputWrapper}>
                                    <Text style={styles.handlePrefix}>@</Text>
                                    <TextInput
                                        style={[styles.modalInput, styles.handleInputText]}
                                        placeholder="kullanici_adi"
                                        placeholderTextColor="#52525B"
                                        value={editHandle}
                                        onChangeText={(txt) => setEditHandle(txt.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Görünen Ad (İsteğe Bağlı)</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Emre Yılmaz"
                                    placeholderTextColor="#52525B"
                                    value={editName}
                                    onChangeText={setEditName}
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.modalInputGroup}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <Text style={[styles.modalLabel, { marginBottom: 0 }]}>Profil Resmi URL (İsteğe Bağlı)</Text>
                                    {editImage.length > 0 && (
                                        <TouchableOpacity onPress={() => setEditImage('')}>
                                            <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Temizle</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="https://example.com/avatar.jpg"
                                    placeholderTextColor="#52525B"
                                    value={editImage}
                                    onChangeText={setEditImage}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <View style={styles.modalActionRow}>
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)} disabled={savingProfile}>
                                    <Text style={styles.modalCancelText}>Vazgeç</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalSaveBtn, savingProfile && { opacity: 0.7 }]}
                                    onPress={handleSaveProfile}
                                    disabled={savingProfile}
                                >
                                    {savingProfile ? <BrandLoader size={18} showBlur={false} /> : <Text style={styles.modalSaveText}>Kaydet</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Change Password Modal */}
            <Modal visible={pwModalVisible} animationType="slide" transparent onRequestClose={() => setPwModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Şifre Değiştir</Text>
                            <TouchableOpacity onPress={() => setPwModalVisible(false)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={20} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalLabel}>Mevcut Şifre</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="••••••••"
                                placeholderTextColor="#52525B"
                                secureTextEntry
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                        </View>
                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalLabel}>Yeni Şifre (En az 8 karakter)</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="••••••••"
                                placeholderTextColor="#52525B"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                        </View>
                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalLabel}>Yeni Şifre (Tekrar)</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="••••••••"
                                placeholderTextColor="#52525B"
                                secureTextEntry
                                value={confirmNewPassword}
                                onChangeText={setConfirmNewPassword}
                            />
                        </View>

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPwModalVisible(false)} disabled={savingPw}>
                                <Text style={styles.modalCancelText}>Vazgeç</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSaveBtn, savingPw && { opacity: 0.7 }]}
                                onPress={handleChangePassword}
                                disabled={savingPw}
                            >
                                {savingPw ? <BrandLoader size={18} showBlur={false} /> : <Text style={styles.modalSaveText}>Güncelle</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Badge Detail Modal */}
            <Modal visible={Boolean(selectedBadge)} transparent animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setSelectedBadge(null)} style={styles.badgeModalOverlay}>
                    <View style={styles.badgeModalCard}>
                        <Text style={{ fontSize: 42, marginBottom: 10 }}>{selectedBadge?.emoji}</Text>
                        <Text style={styles.badgeModalTitle}>{selectedBadge?.label}</Text>
                        <Text style={styles.badgeModalDesc}>{selectedBadge?.description}</Text>
                        <View
                            style={[
                                styles.badgeStatusPill,
                                {
                                    backgroundColor: selectedBadge?.earned
                                        ? 'rgba(16, 185, 129, 0.14)'
                                        : '#18181B',
                                },
                            ]}
                        >
                            <Text
                                style={{
                                    color: selectedBadge?.earned ? '#10B981' : '#71717A',
                                    fontSize: 12,
                                    fontWeight: '700',
                                }}
                            >
                                {selectedBadge?.earned ? 'Kazanıldı' : 'Henüz Kazanılmadı'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#09090B' },
    header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 18 },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#F4F4F5', letterSpacing: -0.5 },
    profileHero: { marginHorizontal: 24, marginBottom: 22 },
    heroAvatarRow: { flexDirection: 'row', alignItems: 'center' },
    heroAvatar: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: '#18181B',
        alignItems: 'center', justifyContent: 'center', marginRight: 16,
        borderWidth: 1, borderColor: '#27272A',
    },
    heroAvatarImage: { width: 72, height: 72, borderRadius: 36, marginRight: 16 },
    heroInitials: { color: '#38BDF8', fontSize: 24, fontWeight: '700' },
    heroInfo: { flex: 1 },
    heroName: { color: '#F4F4F5', fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
    heroEmail: { color: '#71717A', fontSize: 13, marginTop: 2 },
    handleText: { color: '#38BDF8', fontSize: 13, fontWeight: '600' },
    levelBadge: {
        backgroundColor: '#18181B', paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 8, borderWidth: 1, borderColor: '#27272A',
    },
    levelBadgeText: { fontSize: 11, fontWeight: '700' },
    badgesSection: { marginBottom: 26 },
    badgesHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, marginBottom: 12,
    },
    sectionTitle: { color: '#A1A1AA', fontSize: 12, fontWeight: '700' },
    badgeCountText: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
    badgesScroll: { paddingHorizontal: 24, gap: 12 },
    badgeItem: { width: 80, alignItems: 'center' },
    badgeIconBg: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#121215',
        borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    },
    badgeEmoji: { fontSize: 26 },
    badgeLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
    momentumCard: {
        marginHorizontal: 24, marginBottom: 24, borderRadius: 20, padding: 20,
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A',
    },
    momentumHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8,
    },
    viewToggleRow: {
        flexDirection: 'row', backgroundColor: '#18181B', borderRadius: 10, padding: 3,
        borderWidth: 1, borderColor: '#27272A',
    },
    viewToggleBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
    viewToggleBtnActive: { backgroundColor: '#27272A' },
    viewToggleText: { fontSize: 11, fontWeight: '600', color: '#71717A' },
    viewToggleTextActive: { color: '#38BDF8' },
    tierChip: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
        backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A',
    },
    tierChipText: { fontSize: 12, fontWeight: '600', color: '#F4F4F5' },
    momentumScore: {
        fontSize: 42, fontWeight: '800', color: '#F4F4F5', letterSpacing: -1, marginBottom: 10,
    },
    momentumProgressBg: {
        height: 5, borderRadius: 99, backgroundColor: '#27272A', marginBottom: 8, overflow: 'hidden',
    },
    momentumProgressFill: { height: '100%', borderRadius: 99, backgroundColor: '#38BDF8' },
    momentumProgressLabel: { color: '#A1A1AA', fontSize: 12, marginBottom: 20 },
    momentumMetrics: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 16, borderTopWidth: 1, borderTopColor: '#27272A',
    },
    momentumMetricItem: { flex: 1, alignItems: 'center' },
    momentumMetricVal: { color: '#F4F4F5', fontSize: 16, fontWeight: '700', marginBottom: 2 },
    momentumMetricLabel: { color: '#71717A', fontSize: 11, fontWeight: '500' },
    statsScroll: { paddingHorizontal: 24, gap: 12 },
    statCard: {
        width: 104, backgroundColor: '#121215', borderRadius: 18, padding: 14,
        borderWidth: 1, borderColor: '#27272A', alignItems: 'center',
    },
    statIconCircle: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(56, 189, 248, 0.12)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    statValue: { color: '#F4F4F5', fontSize: 20, fontWeight: '700', marginBottom: 2 },
    statLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: '600' },
    settingsSection: { paddingHorizontal: 24, marginBottom: 28 },
    settingsTitle: { color: '#A1A1AA', fontWeight: '700', fontSize: 13, marginBottom: 12, marginLeft: 4 },
    settingsGroup: {
        backgroundColor: '#121215', borderRadius: 20, borderWidth: 1, borderColor: '#27272A', overflow: 'hidden',
    },
    settingsItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 15,
    },
    settingsItemText: { color: '#F4F4F5', fontSize: 15, fontWeight: '500' },
    settingsItemSubtext: { color: '#71717A', fontSize: 12, marginTop: 2 },
    settingsItemRight: { flexDirection: 'row', alignItems: 'center' },
    settingsItemValue: { color: '#A1A1AA', marginRight: 8, fontSize: 14, fontWeight: '500' },
    settingsDivider: { height: 1, backgroundColor: '#27272A', marginLeft: 18 },
    logoutContainer: { paddingHorizontal: 24, paddingBottom: 24 },
    logoutButton: {
        paddingVertical: 16, borderRadius: 16, alignItems: 'center',
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A',
    },
    logoutText: { color: '#F4F4F5', fontWeight: '600', fontSize: 15 },
    actionGrid: { paddingHorizontal: 24, marginBottom: 24, gap: 10 },
    actionCard: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
        borderRadius: 16, backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A',
    },
    actionIconCircle: {
        width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    actionTextContainer: { flex: 1 },
    actionTitle: { fontSize: 14, fontWeight: '600', color: '#F4F4F5' },
    actionSubtitle: { fontSize: 11, color: '#A1A1AA', marginTop: 2 },
    editProfileBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14,
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#18181B',
        borderWidth: 1, borderColor: '#27272A', alignSelf: 'flex-start',
    },
    editProfileBtnText: { color: '#F4F4F5', fontSize: 12, fontWeight: '600' },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(9, 9, 11, 0.8)' },
    modalContent: {
        backgroundColor: '#121215', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        borderWidth: 1, borderColor: '#27272A', padding: 24, maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#F4F4F5' },
    modalCloseBtn: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#18181B',
        alignItems: 'center', justifyContent: 'center',
    },
    modalInputGroup: { marginBottom: 16 },
    modalLabel: { fontSize: 12, fontWeight: '600', color: '#A1A1AA', marginBottom: 6 },
    modalInput: {
        backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#F4F4F5',
    },
    handleInputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B',
        borderWidth: 1, borderColor: '#27272A', borderRadius: 12, paddingLeft: 14,
    },
    handlePrefix: { fontSize: 15, fontWeight: '600', color: '#38BDF8', marginRight: 4 },
    handleInputText: { flex: 1, backgroundColor: 'transparent', borderWidth: 0, paddingLeft: 0 },
    modalActionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
    modalCancelBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#18181B',
        borderWidth: 1, borderColor: '#27272A', alignItems: 'center',
    },
    modalCancelText: { fontSize: 14, fontWeight: '600', color: '#A1A1AA' },
    modalSaveBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#38BDF8',
        alignItems: 'center', justifyContent: 'center',
    },
    modalSaveText: { fontSize: 14, fontWeight: '700', color: '#09090B' },
    badgeModalOverlay: {
        flex: 1, backgroundColor: 'rgba(9, 9, 11, 0.8)', justifyContent: 'center',
        alignItems: 'center', paddingHorizontal: 28,
    },
    badgeModalCard: {
        width: '100%', backgroundColor: '#121215', borderRadius: 22,
        borderWidth: 1, borderColor: '#27272A', padding: 24, alignItems: 'center',
    },
    badgeModalTitle: { color: '#F4F4F5', fontSize: 18, fontWeight: '800', marginBottom: 8 },
    badgeModalDesc: { color: '#A1A1AA', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
    badgeStatusPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
});
