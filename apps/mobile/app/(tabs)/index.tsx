import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Theme as SharedTheme, t, Language } from '@learnaxia/shared';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { BrandLoader } from '@/components/ui/brand-loader';
import { FocusWidget } from '@/components/dashboard/focus-widget';
import { DailyReviewWidget } from '@/components/dashboard/daily-review-widget';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalStudyMinutes: number;
  modulesStarted: number;
  totalSolved: number;
  averageAccuracy: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const currentLang = 'tr' as Language;
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const analyticsRes = await api.get('/mobile/analytics').catch(() => ({ data: { stats: {} } }));

      const data = analyticsRes.data?.stats || {};

      setStats({
        totalStudyMinutes: data.totalStudyMinutes || 0,
        modulesStarted: data.modulesStarted || 0,
        totalSolved: data.totalSolved || 0,
        averageAccuracy: data.averageAccuracy || 0,
      });
    } catch (error) {
      console.error('[HomeScreen] Error fetching dashboard data:', error);
      setStats({
        totalStudyMinutes: 0,
        modulesStarted: 0,
        totalSolved: 0,
        averageAccuracy: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        fetchDashboardData();
      }
    });

    return () => subscription.remove();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    { label: t('dashboard.stats.studyTime', currentLang), value: stats ? `${stats.totalStudyMinutes} ${t('dashboard.stats.minutesUnit', currentLang)}` : `0 ${t('dashboard.stats.minutesUnit', currentLang)}`, icon: 'schedule', color: SharedTheme.colors.brandEmerald },
    { label: t('dashboard.stats.modules', currentLang), value: stats ? stats.modulesStarted.toString() : '0', icon: 'menu-book', color: SharedTheme.colors.brandBlue },
    { label: t('dashboard.stats.accuracy', currentLang), value: stats ? `%${stats.averageAccuracy}` : '%0', icon: 'track-changes', color: SharedTheme.colors.primary },
    { label: t('dashboard.stats.solved', currentLang), value: stats ? stats.totalSolved.toString() : '0', icon: 'psychology', color: '#A855F7' },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-ocean-bg justify-center items-center">
        <BrandLoader size="lg" label={t('common.loading', currentLang)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-ocean-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
        }
      >
        {/* Header Section */}
        <View className="px-6 pt-10 pb-6 flex-row justify-between items-center">
          <View>
            <Text className="text-white text-3xl font-bold tracking-tight">
              {t('dashboard.greeting', currentLang, { name: user?.name?.split(' ')[0] || user?.handle || t('common.user', currentLang) })}
            </Text>
          </View>
          <TouchableOpacity
            className="w-12 h-12 rounded-[20px] bg-ocean-panel items-center justify-center border border-ocean-border shadow-lg"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile');
            }}
          >
            <IconSymbol name="person.fill" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Daily Review Widget */}
        <View className="px-6 mb-2">
          <DailyReviewWidget />
        </View>

        {/* Focus Widget */}
        <View className="px-6">
          <FocusWidget />
        </View>

        {/* Quick Stats Grid - Premium Bento Style */}
        <View className="px-6 mb-8 mt-2">
          {/* Top block */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            className="w-full bg-ocean-panel rounded-3xl p-5 mb-4 border border-ocean-border shadow-lg overflow-hidden flex-row items-center justify-between"
          >
            <View>
              <View className="flex-row items-center mb-2">
                 <MaterialIcons name="schedule" size={18} color="#34D399" />
                 <Text className="text-slate-300 text-sm font-medium ml-2">{t('dashboard.stats.studyTime', currentLang)}</Text>
              </View>
              <Text className="text-3xl font-extrabold text-white">
                {stats ? stats.totalStudyMinutes : '0'} <Text className="text-lg font-medium text-slate-400">{t('dashboard.stats.minutesUnit', currentLang)}</Text>
              </Text>
            </View>
            <View className="h-12 w-12 rounded-full bg-[#34D399]/20 items-center justify-center">
              <MaterialIcons name="timer" size={24} color="#34D399" />
            </View>
          </TouchableOpacity>

          {/* Bottom row */}
          <View className="flex-row justify-between">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              className="bg-ocean-panel rounded-3xl p-5 border border-ocean-border shadow-lg"
              style={{ width: (width - 60) / 2 }}
            >
               <View className="h-10 w-10 rounded-[16px] bg-blue-500/20 items-center justify-center mb-3">
                 <MaterialIcons name="menu-book" size={20} color="#60A5FA" />
               </View>
               <Text className="text-2xl font-bold text-white mb-1">{stats ? stats.modulesStarted : '0'}</Text>
               <Text className="text-slate-400 text-xs font-medium">{t('dashboard.stats.modules', currentLang)}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              className="bg-ocean-panel rounded-3xl p-5 border border-ocean-border shadow-lg"
              style={{ width: (width - 60) / 2 }}
            >
               <View className="h-10 w-10 rounded-[16px] bg-purple-500/20 items-center justify-center mb-3">
                 <MaterialIcons name="track-changes" size={20} color="#C084FC" />
               </View>
               <Text className="text-2xl font-bold text-white mb-1">{stats ? `%${stats.averageAccuracy}` : '%0'}</Text>
               <Text className="text-slate-400 text-xs font-medium">{t('dashboard.stats.accuracy', currentLang)}</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
