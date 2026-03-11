import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme as SharedTheme } from '@learnaxia/shared';
import api from '@/lib/api';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
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
        { label: 'Modüller', value: profileData?.stats?.modules || 0, icon: 'menu-book', color: SharedTheme.colors.brandBlue },
        { label: 'Koleksiyonlar', value: profileData?.stats?.collections || 0, icon: 'folder-special', color: SharedTheme.colors.brandPurple },
        { label: 'Çalışma Süresi', value: `${analyticsData?.totalStudyMinutes || 0} dk`, icon: 'schedule', color: SharedTheme.colors.brandEmerald },
    ];

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: SharedTheme.colors.background }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
                }
            >
                {/* Header */}
                <View className="px-6 pt-10 pb-2">
                    <Text className="text-3xl font-bold text-white tracking-tight">Profil</Text>
                </View>

                {/* Profile Card */}
                <View className="mx-6 mt-4 bg-slate-900 rounded-3xl p-6 border border-slate-800">
                    <View className="flex-row items-center">
                        <View className="w-16 h-16 rounded-2xl bg-indigo-600 items-center justify-center shadow-xl shadow-indigo-500/20">
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
                                {user?.name || user?.handle || 'Kullanıcı'}
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
                            className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 mb-3"
                            style={{ width: '48%', marginRight: i % 2 === 0 ? '4%' : 0 }}
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
                    <Text className="text-white font-bold text-lg mb-3">Hesap Ayarları</Text>

                    <TouchableOpacity className="flex-row items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-3">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-4">
                                <MaterialIcons name="language" size={20} color="#D1D5DB" />
                            </View>
                            <Text className="text-white text-base font-medium">Dil</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Text className="text-slate-500 mr-2">Türkçe</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-3">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-4">
                                <MaterialIcons name="notifications" size={20} color="#D1D5DB" />
                            </View>
                            <Text className="text-white text-base font-medium">Bildirimler</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="#4B5563" />
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-3">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-4">
                                <MaterialIcons name="info-outline" size={20} color="#D1D5DB" />
                            </View>
                            <Text className="text-white text-base font-medium">Hakkında</Text>
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
                        className="bg-red-500/10 border border-red-500/20 py-4 rounded-2xl items-center"
                        onPress={logout}
                    >
                        <View className="flex-row items-center">
                            <MaterialIcons name="logout" size={20} color="#ef4444" />
                            <Text className="text-red-500 font-bold text-base ml-2">Çıkış Yap</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
