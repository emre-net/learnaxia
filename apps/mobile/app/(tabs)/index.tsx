import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl, AppState, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/screen';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { user, logout } = useAuth();
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
      <Screen className="bg-ocean-bg justify-center items-center">
        <BrandLoader size="lg" label={t('common.loading', currentLang)} />
      </Screen>
    );
  }

  return (
    <Screen className="bg-ocean-bg" tabScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_SCREEN_CONTENT_BOTTOM }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
        }
      >
        {/* Header Section */}
        <View className="px-6 pt-10 pb-6 flex-row justify-between items-center">
          <View>
            <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="font-bold text-xs uppercase tracking-[4px] mb-1">LEARNAXIA</Text>
            <Text className="text-white text-3xl font-black tracking-tighter">
              Merhaba, {user?.name?.split(' ')[0] || user?.handle || 'Gezgin'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-14 h-14 rounded-[22px] bg-ocean-panel items-center justify-center border border-ocean-border"
            style={{ 
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile');
            }}
          >
            <View 
              className="w-10 h-10 rounded-xl items-center justify-center border"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(96, 165, 250, 0.2)' }}
            >
               <MaterialIcons name="person" size={24} color="#00D2FF" />
            </View>
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
        <View className="px-6 mb-8 mt-4">
          <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="font-bold text-[10px] uppercase tracking-[4px] ml-1 mb-4">GÜNLÜK İSTATİSTİKLER</Text>
          
          {/* Top block */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            className="w-full bg-ocean-panel rounded-[32px] p-6 mb-4 border border-ocean-border overflow-hidden flex-row items-center justify-between"
            style={{ 
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20
            }}
          >
            <LinearGradient
                colors={['rgba(52, 211, 153, 0.05)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View>
              <View className="flex-row items-center mb-2">
                 <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                 <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-[10px] font-black uppercase tracking-widest">{t('dashboard.stats.studyTime', currentLang)}</Text>
              </View>
              <Text className="text-4xl font-black text-white tracking-tighter">
                {stats ? stats.totalStudyMinutes : '0'} <Text style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-lg font-bold uppercase tracking-widest">{t('dashboard.stats.minutesUnit', currentLang)}</Text>
              </Text>
            </View>
            <View 
              className="h-14 w-14 rounded-2xl items-center justify-center border"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
            >
              <MaterialIcons name="timer" size={28} color="#34D399" />
            </View>
          </TouchableOpacity>

          {/* Bottom row */}
          <View className="flex-row justify-between">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              className="bg-ocean-panel rounded-[32px] p-6 border border-ocean-border overflow-hidden"
              style={{ 
                width: (width - 64) / 2,
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20
              }}
            >
               <LinearGradient
                  colors={['rgba(59, 130, 246, 0.05)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
               />
               <View 
                className="h-12 w-12 rounded-2xl items-center justify-center mb-4 border"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
               >
                 <MaterialIcons name="menu-book" size={24} color="#00D2FF" />
               </View>
               <Text className="text-3xl font-black text-white tracking-tighter mb-1">{stats ? stats.modulesStarted : '0'}</Text>
               <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-[10px] font-black uppercase tracking-widest">{t('dashboard.stats.modules', currentLang)}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              className="bg-ocean-panel rounded-[32px] p-6 border border-ocean-border overflow-hidden"
              style={{ 
                width: (width - 64) / 2,
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20
              }}
            >
               <LinearGradient
                  colors={['rgba(168, 85, 247, 0.05)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
               />
               <View 
                className="h-12 w-12 rounded-2xl items-center justify-center mb-4 border"
                style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.2)' }}
               >
                 <MaterialIcons name="track-changes" size={24} color="#A855F7" />
               </View>
               <Text className="text-3xl font-black text-white tracking-tighter mb-1">{stats ? `%${stats.averageAccuracy}` : '%0'}</Text>
               <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-[10px] font-black uppercase tracking-widest">{t('dashboard.stats.accuracy', currentLang)}</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </Screen>
  );
}
