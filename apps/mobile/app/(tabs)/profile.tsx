import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, RefreshControl } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { useAuth } from '../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme as SharedTheme, t, Language } from '@learnaxia/shared';
import api from '@/lib/api';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const currentLang = 'tr' as Language;
    const [profileData, setProfileData] = useState<any>(null);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const [profileRes, analyticsRes] = await Promise.all([
                api.get('/mobile/user/profile').catch(() => ({ data: null })),
                api.get('/mobile/analytics').catch(() => ({ data: { stats: {} } })),
            ]);
            setProfileData(profileRes.data);
            setAnalyticsData(analyticsRes.data?.stats || {});
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

    const statItems = [
        { label: t('profile.stats.modules', currentLang), value: profileData?.stats?.modules || 0, icon: 'menu-book', color: SharedTheme.colors.brandBlue },
        { label: t('profile.stats.collections', currentLang), value: profileData?.stats?.collections || 0, icon: 'folder-special', color: SharedTheme.colors.brandPurple },
        { label: t('profile.stats.studyTime', currentLang), value: `${analyticsData?.totalStudyMinutes || 0} ${t('dashboard.stats.minutesUnit', currentLang)}`, icon: 'schedule', color: SharedTheme.colors.brandEmerald },
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
                <View className="px-6 pt-10 pb-2">
                    <Text className="text-3xl font-bold text-white tracking-tight">{t('profile.title', currentLang)}</Text>
                </View>

                {/* Profile Card */}
                <View className="mx-6 mt-4 bg-slate-900 rounded-3xl p-6 border border-slate-800">
                    <View className="flex-row items-center">
                        <View 
                            className="w-16 h-16 rounded-2xl bg-indigo-600 items-center justify-center"
                            style={{ 
                              elevation: 10,
                              shadowColor: 'rgba(99, 102, 241, 0.2)',
                              shadowOffset: { width: 0, height: 10 },
                              shadowOpacity: 1,
                              shadowRadius: 20
                            }}
                        >
                            {user?.image ? (
                                <Image source={{ uri: user.image }} className="w-16 h-16 rounded-2xl" />
                            ) : (
                                <Text className="text-white text-2xl font-bold">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            )}
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-xl font-bold text-white">
                                {user?.name || user?.handle || t('common.user', currentLang)}
                            </Text>
                            <Text className="text-slate-500 text-sm mt-0.5">{user?.email || ''}</Text>
                            {user?.handle && (
                                <View className="mt-1.5 self-start bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
                                    <Text className="text-indigo-400 text-[11px] font-medium">@{user.handle}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View className="flex-row flex-wrap px-6 mt-4">
                    {statItems.map((stat, i) => (
                        <View
                            key={i}
                            className="rounded-2xl p-4 border mb-3"
                            style={{ 
                                width: '48%', 
                                marginRight: i % 2 === 0 ? '4%' : 0,
                                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                borderColor: 'rgba(30, 41, 59, 1)'
                            }}
                        >
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-slate-400 text-xs font-medium">{stat.label}</Text>
                                <MaterialIcons name={stat.icon as any} size={16} color={stat.color} />
                            </View>
                            <Text className="text-white text-2xl font-bold">{stat.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Settings Section */}
                <View className="px-6 mt-4">
                    <Text className="text-white font-bold text-lg mb-3">{t('profile.settings.title', currentLang)}</Text>

                    <TouchableOpacity className="flex-row items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-3">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-4">
                                <MaterialIcons name="language" size={20} color="#D1D5DB" />
                            </View>
                            <Text className="text-white text-base font-medium">{t('profile.settings.language', currentLang)}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Text className="text-slate-500 mr-2">{currentLang === 'tr' ? 'Türkçe' : 'English'}</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-3">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-4">
                                <MaterialIcons name="notifications" size={20} color="#D1D5DB" />
                            </View>
                            <Text className="text-white text-base font-medium">{t('profile.settings.notifications', currentLang)}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-3">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-4">
                                <MaterialIcons name="info-outline" size={20} color="#D1D5DB" />
                            </View>
                            <Text className="text-white text-base font-medium">{t('profile.settings.about', currentLang)}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Text className="text-slate-600 mr-2 text-xs">v1.0.0</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <View className="px-6 mt-6">
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className="py-4 rounded-2xl items-center border"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        onPress={logout}
                    >
                        <View className="flex-row items-center">
                            <MaterialIcons name="logout" size={20} color="#ef4444" />
                            <Text className="text-red-500 font-bold text-base ml-2">{t('profile.settings.logout', currentLang)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </Screen>
    );
}
