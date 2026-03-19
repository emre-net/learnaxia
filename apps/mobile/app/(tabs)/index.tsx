import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme as SharedTheme } from '@learnaxia/shared';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

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
    { label: 'Süre', value: stats ? `${stats.totalStudyMinutes} dk` : '0 dk', icon: 'schedule', color: SharedTheme.colors.brandEmerald },
    { label: 'Setler', value: stats ? stats.modulesStarted.toString() : '0', icon: 'menu-book', color: SharedTheme.colors.brandBlue },
    { label: 'Başarı', value: stats ? `%${stats.averageAccuracy}` : '%0', icon: 'track-changes', color: SharedTheme.colors.primary },
    { label: 'Çözüm', value: stats ? stats.totalSolved.toString() : '0', icon: 'psychology', color: '#A855F7' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-950" style={{ backgroundColor: SharedTheme.colors.background }}>
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
              Merhaba, {user?.name?.split(' ')[0] || user?.handle || 'Kullanıcı'}
            </Text>
          </View>
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-slate-900 items-center justify-center border border-slate-800 shadow-xl"
            onPress={() => router.push('/profile')}
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

        {/* Quick Stats Grid */}
        <View className="px-6 flex-row flex-wrap justify-between mt-2 mb-8">
          {statCards.map((stat, i) => {
            const isLastOdd = statCards.length % 2 !== 0 && i === statCards.length - 1;
            return (
              <View
                key={i}
                className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 mb-4"
                style={{ width: isLastOdd ? width - 48 : (width - 60) / 2 }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-200 text-xs font-medium">{stat.label}</Text>
                  <MaterialIcons name={stat.icon as any} size={16} color={stat.color} />
                </View>
                <Text className="text-2xl font-bold text-white">
                  {stat.value}
                </Text>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
