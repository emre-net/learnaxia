import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, Image, ScrollView,
    RefreshControl, StyleSheet, Linking, Alert, ActionSheetIOS,
    Platform, Modal, TextInput, KeyboardAvoidingView
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, refreshProfile } = useAuth();
    const { language, setLanguage } = useLanguage();
    const [profileData, setProfileData] = useState<{
        stats?: { modules: number; collections: number; notes?: number; journeys?: number; solvedQuestions?: number };
    } | null>(null);
    const [scoreData, setScoreData] = useState<{
        momentum: { thisMonth: number; allTime: number };
        tier: { thisMonth: { key: string; label: string; emoji: string; color: string; progress: number; pointsToNext: number | null } };
        metrics: { studyMinutes: number; cardsReviewed: number; accuracyRate: number; activeDays: number };
        badges: { key: string; emoji: string; label: string }[];
    } | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [avatarFailed, setAvatarFailed] = useState(false);

    // Edit Profile Modal States
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editHandle, setEditHandle] = useState('');
    const [editImage, setEditImage] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    const openEditModal = () => {
        setEditName(user?.name || '');
        setEditHandle(user?.handle || '');
        setEditImage(user?.image || '');
        setEditModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleSaveProfile = async () => {
        const trimmedName = editName.trim();
        const trimmedHandle = editHandle.trim().replace(/^@/, '');

        if (!trimmedName) {
            Alert.alert('Hata', 'Ad Soyad alanı boş bırakılamaz.');
            return;
        }

        if (trimmedHandle && (trimmedHandle.length < 3 || trimmedHandle.length > 20)) {
            Alert.alert('Hata', 'Kullanıcı adı 3 ile 20 karakter arasında olmalıdır.');
            return;
        }

        if (trimmedHandle && !/^[a-zA-Z0-9_-]+$/.test(trimmedHandle)) {
            Alert.alert('Hata', 'Kullanıcı adı sadece harf, rakam, tire ve alt çizgi içerebilir.');
            return;
        }

        setSavingProfile(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await api.patch('/mobile/user/profile', {
                name: trimmedName,
                handle: trimmedHandle || undefined,
                image: editImage.trim() || undefined,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await refreshProfile();
            setEditModalVisible(false);
            Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
        } catch (error: any) {
            const msg = error?.response?.data?.error || 'Profil güncellenirken bir hata oluştu.';
            Alert.alert('Hata', msg);
        } finally {
            setSavingProfile(false);
        }
    };

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
            label: t('profile.stats.notes', language),
            value: profileData?.stats?.notes || 0,
            icon: 'book-outline' as const,
        },
        {
            label: language === 'tr' ? 'Rotalar' : 'Journeys',
            value: profileData?.stats?.journeys || 0,
            icon: 'map-outline' as const,
        },
        {
            label: language === 'tr' ? 'AI Çözümleri' : 'AI Solutions',
            value: profileData?.stats?.solvedQuestions || 0,
            icon: 'sparkles-outline' as const,
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
                    <TouchableOpacity
                        style={styles.editProfileBtn}
                        onPress={openEditModal}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="pencil" size={13} color="#F4F4F5" style={{ marginRight: 6 }} />
                        <Text style={styles.editProfileBtnText}>Profili Düzenle</Text>
                    </TouchableOpacity>
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

                {/* Performance & Competition Actions */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.actionCard}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/leaderboard' as any);
                        }}
                    >
                        <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
                            <Ionicons name="trophy" size={20} color="#EAB308" />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Liderlik Sıralaması</Text>
                            <Text style={styles.actionSubtitle}>Sıralamadaki yerini gör</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.actionCard}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/analytics' as any);
                        }}
                    >
                        <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                            <Ionicons name="stats-chart" size={20} color="#6366F1" />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Detaylı Analiz</Text>
                            <Text style={styles.actionSubtitle}>Çalışma verilerini incele</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* 5 Library Entities Stats Track */}
                <View style={{ marginBottom: 28 }}>
                    <Text style={styles.sectionTitle}>{language === 'tr' ? 'KÜTÜPHANEM' : 'MY LIBRARY'}</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.statsScroll}
                    >
                        {statItems.map((stat, i) => (
                            <TouchableOpacity
                                key={i}
                                activeOpacity={0.7}
                                style={styles.statCard}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    router.push('/(tabs)/library' as any);
                                }}
                            >
                                <View style={styles.statIconCircle}>
                                    <Ionicons name={stat.icon} size={20} color="#818CF8" />
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
                            <Text style={styles.settingsItemText}>Profili Düzenle</Text>
                            <View style={styles.settingsItemRight}>
                                <Text style={styles.settingsItemValue}>{user?.handle ? `@${user.handle}` : 'Ad & Handle'}</Text>
                                <Ionicons name="chevron-forward" size={18} color="#475569" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.settingsDivider} />

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

            {/* Edit Profile Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Profili Düzenle</Text>
                            <TouchableOpacity
                                onPress={() => setEditModalVisible(false)}
                                style={styles.modalCloseBtn}
                            >
                                <Ionicons name="close" size={20} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Ad Soyad</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Adınız ve Soyadınız"
                                    placeholderTextColor="#52525B"
                                    value={editName}
                                    onChangeText={setEditName}
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Kullanıcı Adı (Handle)</Text>
                                <View style={styles.handleInputWrapper}>
                                    <Text style={styles.handlePrefix}>@</Text>
                                    <TextInput
                                        style={[styles.modalInput, styles.handleInputText]}
                                        placeholder="kullanici_adi"
                                        placeholderTextColor="#52525B"
                                        value={editHandle}
                                        onChangeText={(t) => setEditHandle(t.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Profil Resmi URL (İsteğe Bağlı)</Text>
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
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => setEditModalVisible(false)}
                                    disabled={savingProfile}
                                >
                                    <Text style={styles.modalCancelText}>Vazgeç</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalSaveBtn, savingProfile && { opacity: 0.7 }]}
                                    onPress={handleSaveProfile}
                                    disabled={savingProfile}
                                >
                                    {savingProfile ? (
                                        <BrandLoader size={18} showBlur={false} />
                                    ) : (
                                        <Text style={styles.modalSaveText}>Kaydet</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#09090B',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#F4F4F5',
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
        backgroundColor: '#18181B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    heroAvatarImage: {
        width: 72,
        height: 72,
        borderRadius: 36,
        marginRight: 16,
    },
    heroInitials: {
        color: '#F4F4F5',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 1,
    },
    heroInfo: {
        flex: 1,
    },
    heroName: {
        color: '#F4F4F5',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    heroEmail: {
        color: '#A1A1AA',
        fontSize: 14,
        marginBottom: 4,
    },
    handleText: {
        color: '#71717A',
        fontSize: 13,
        fontWeight: '500',
    },
    levelBadge: {
        marginLeft: 8,
        backgroundColor: '#18181B',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    levelBadgeText: {
        color: '#818CF8',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    badgesSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        color: '#71717A',
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
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    badgeEmoji: {
        fontSize: 28,
    },
    badgeLabel: {
        color: '#A1A1AA',
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
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    momentumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    momentumLabel: {
        color: '#71717A',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
    },
    tierChip: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 99,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    tierChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#F4F4F5',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    momentumScore: {
        fontSize: 48,
        fontWeight: '700',
        color: '#F4F4F5',
        letterSpacing: -1,
        marginBottom: 12,
    },
    momentumProgressBg: {
        height: 5,
        borderRadius: 99,
        backgroundColor: '#27272A',
        marginBottom: 8,
        overflow: 'hidden',
    },
    momentumProgressFill: {
        height: '100%',
        borderRadius: 99,
        backgroundColor: '#6366F1',
    },
    momentumProgressLabel: {
        color: '#A1A1AA',
        fontSize: 12,
        marginBottom: 24,
    },
    momentumMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#27272A',
    },
    momentumMetricItem: {
        flex: 1,
        alignItems: 'center',
    },
    momentumMetricVal: {
        color: '#F4F4F5',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    momentumMetricLabel: {
        color: '#71717A',
        fontSize: 11,
        fontWeight: '500',
    },
    statsScroll: {
        paddingHorizontal: 24,
        gap: 12,
    },
    statCard: {
        width: 104,
        backgroundColor: '#121215',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#27272A',
        alignItems: 'center',
    },
    statIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        color: '#F4F4F5',
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    statLabel: {
        color: '#A1A1AA',
        fontSize: 11,
        fontWeight: '600',
    },
    settingsSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    settingsTitle: {
        color: '#71717A',
        fontWeight: '600',
        fontSize: 13,
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    settingsGroup: {
        backgroundColor: '#121215',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#27272A',
        overflow: 'hidden',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    settingsItemText: {
        color: '#F4F4F5',
        fontSize: 15,
        fontWeight: '500',
    },
    settingsItemSubtext: {
        color: '#71717A',
        fontSize: 12,
        marginTop: 2,
    },
    settingsItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsItemValue: {
        color: '#A1A1AA',
        marginRight: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    settingsDivider: {
        height: 1,
        backgroundColor: '#27272A',
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
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    logoutText: {
        color: '#F4F4F5',
        fontWeight: '600',
        fontSize: 15,
    },
    actionGrid: {
        paddingHorizontal: 24,
        marginBottom: 24,
        gap: 10,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    actionIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F4F4F5',
    },
    actionSubtitle: {
        fontSize: 11,
        color: '#A1A1AA',
        marginTop: 2,
    },
    editProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        alignSelf: 'flex-start',
    },
    editProfileBtnText: {
        color: '#F4F4F5',
        fontSize: 12,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
    modalContent: {
        backgroundColor: '#121215',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: '#27272A',
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#F4F4F5',
        letterSpacing: -0.5,
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#18181B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalInputGroup: {
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#A1A1AA',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalInput: {
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: '#F4F4F5',
    },
    handleInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        borderRadius: 12,
        paddingLeft: 14,
    },
    handlePrefix: {
        fontSize: 15,
        fontWeight: '600',
        color: '#71717A',
        marginRight: 4,
    },
    handleInputText: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0,
        paddingLeft: 0,
    },
    modalActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#A1A1AA',
    },
    modalSaveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#6366F1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSaveText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});