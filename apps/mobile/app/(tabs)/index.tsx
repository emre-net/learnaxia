import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, AppState, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { t } from '@learnaxia/shared';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';
import { BrandLoader } from '@/components/ui/brand-loader';
import { FocusWidget } from '@/components/dashboard/focus-widget';
import { DailyReviewWidget } from '@/components/dashboard/daily-review-widget';

interface DashboardStats {
  totalStudyMinutes: number;
  modulesStarted: number;
  totalSolved: number;
  averageAccuracy: number;
}

interface RecentModule {
  id: string;
  title: string;
  type: string;
  lastStudied: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentModules, setRecentModules] = useState<RecentModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [analyticsRes, recentRes, scoreRes] = await Promise.all([
        api.get('/mobile/analytics').catch(() => ({ data: { stats: {} } })),
        api.get('/mobile/library/recent').catch(() => ({ data: { modules: [] } })),
        api.get('/scores/me').catch(() => ({ data: null })),
      ]);

      const data = analyticsRes.data?.stats || {};
      setStreak(scoreRes.data?.metrics?.activeDays || 0);
      setStats({
        totalStudyMinutes: data.totalStudyMinutes || 0,
        modulesStarted: data.modulesStarted || 0,
        totalSolved: data.totalSolved || 0,
        averageAccuracy: data.averageAccuracy || 0,
      });
      setRecentModules(recentRes.data?.modules || []);
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
      if (nextAppState === 'active') fetchDashboardData();
    });
    return () => subscription.remove();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <BrandLoader size="lg" label={t('common.loading', language)} />
      </View>
    );
  }

  const firstName = user?.name?.split(' ')[0] || user?.handle || 'Kullanıcı';
  const initials = firstName.slice(0, 2).toUpperCase();

  // Saat ve Dakika hesaplama (Büyük tipografi için)
  const hours = Math.floor((stats?.totalStudyMinutes || 0) / 60);
  const minutes = (stats?.totalStudyMinutes || 0) % 60;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: TAB_SCREEN_CONTENT_BOTTOM, paddingTop: 64 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#334155" />}
      >
        {/* ÜST BAR */}
        <View style={styles.header}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{streak} Günlük Seri</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile');
            }}
            style={styles.avatarButton}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* HERO METRİK - DEVASA TİPOGRAFİ (Apple Health Tarzı) */}
        <View style={styles.heroSection}>
          <Text style={styles.heroGreeting}>İyi çalışmalar, {firstName}!</Text>
          <Text style={styles.heroLabel}>TOPLAM ÇALIŞMA</Text>
          <View style={styles.timeRow}>
            {hours > 0 && (
              <>
                <Text style={styles.timeValue}>{hours}</Text>
                <Text style={styles.timeUnit}>sa</Text>
              </>
            )}
            <Text style={styles.timeValue}>{minutes}</Text>
            <Text style={styles.timeUnit}>dk</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* ASİMETRİK BENTO BOX İSTATİSTİKLERİ */}
        <View style={styles.bentoSection}>
          
          {/* Sol Büyük Kutu (Doğruluk) */}
          <View style={[styles.bentoBox, styles.bentoLarge]}>
            <Text style={styles.bentoLabel}>DOĞRULUK</Text>
            <Text style={styles.bentoMainValue}>%{stats?.averageAccuracy || 0}</Text>
            <View style={styles.bentoFooter}>
              <Ionicons name="trending-up" size={14} color="#10B981" />
              <Text style={styles.bentoTrendText}> İyi gidiyorsun</Text>
            </View>
          </View>

          {/* Sağ Taraftaki 2 Küçük Kutu */}
          <View style={styles.bentoRightColumn}>
            <View style={[styles.bentoBox, styles.bentoSmall]}>
              <Text style={styles.bentoLabel}>ÇÖZÜLEN</Text>
              <View style={styles.bentoValueRow}>
                  <Text style={styles.bentoSecondaryValue}>{stats?.totalSolved || 0}</Text>
                  <Ionicons name="caret-up" size={16} color="#10B981" />
              </View>
            </View>
            <View style={[styles.bentoBox, styles.bentoSmall]}>
              <Text style={styles.bentoLabel}>SETLER</Text>
              <View style={styles.bentoValueRow}>
                  <Text style={styles.bentoSecondaryValue}>{stats?.modulesStarted || 0}</Text>
                  <Ionicons name="caret-up" size={16} color="#10B981" />
              </View>
            </View>
          </View>

        </View>

        {/* WIDGETS */}
        <View style={styles.widgetWrapper}>
          <DailyReviewWidget />
        </View>
        <View style={styles.widgetWrapper}>
          <FocusWidget />
        </View>

        {/* SON ÇALIŞILANLAR (Liste Görünümü - Clean) */}
        {recentModules.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Son Aktiviteler</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/library' as any)}>
                <Ionicons name="arrow-forward" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.recentList}>
              {recentModules.slice(0, 4).map((mod, index) => (
                <TouchableOpacity
                  key={mod.id}
                  activeOpacity={0.6}
                  style={[
                    styles.recentRow,
                    index === recentModules.slice(0, 4).length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/study/${mod.id}` as any);
                  }}
                >
                  <View style={styles.recentDot} />
                  <View style={styles.recentTextContainer}>
                    <Text style={styles.recentItemTitle} numberOfLines={1}>{mod.title}</Text>
                    <Text style={styles.recentItemDate}>
                      {new Date(mod.lastStudied).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#331A00',
  },
  streakEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  streakText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  heroSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  heroGreeting: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  heroLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: -2,
  },
  timeUnit: {
    color: '#64748B',
    fontSize: 24,
    fontWeight: '400',
    marginLeft: 4,
    marginRight: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#111111',
    marginHorizontal: 24,
    marginBottom: 32,
  },
  bentoSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  bentoBox: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#111111',
    justifyContent: 'space-between',
  },
  bentoLarge: {
    flex: 1,
    aspectRatio: 1,
  },
  bentoRightColumn: {
    flex: 1,
    gap: 12,
  },
  bentoSmall: {
    flex: 1,
    padding: 16,
  },
  bentoLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bentoMainValue: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '400',
    letterSpacing: -1,
  },
  bentoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  bentoSecondaryValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: -0.5,
  },
  bentoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bentoTrendText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
  },
  widgetWrapper: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  recentSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  recentList: {
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#111111',
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  recentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333333',
    marginRight: 16,
  },
  recentTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentItemTitle: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '400',
    flex: 1,
    marginRight: 12,
  },
  recentItemDate: {
    color: '#64748B',
    fontSize: 13,
  },
});
