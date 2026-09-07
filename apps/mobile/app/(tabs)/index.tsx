import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, AppState, StyleSheet, Animated as RNAnimated } from 'react-native';
import { useRouter } from 'expo-router';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Theme as SharedTheme, t } from '@learnaxia/shared';
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
  const [fetchError, setFetchError] = useState(false);

  // ─── Hero Banner — motivasyon cümleleri ───────────────────────────────────────────────────
  const MOTIVATION_QUOTES = [
    { text: 'Her gün küçük bir adım — büyük değişimler yaratır.', emoji: '🎯' },
    { text: 'Tekrar, ustalığın anasidır.', emoji: '🧠' },
    { text: 'Bugün öğrendiğin, yarın silahın olur.', emoji: '⚡' },
    { text: 'Sabr eden, bilgiye kavuşur.', emoji: '🌱' },
    { text: 'Her doruğu bilmek, seni bir adım öteye taşır.', emoji: '🚀' },
  ];
  const [quoteIndex, setQuoteIndex] = useState(0);
  const quoteOpacity = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      RNAnimated.timing(quoteOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setQuoteIndex(prev => (prev + 1) % MOTIVATION_QUOTES.length);
        RNAnimated.timing(quoteOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [quoteOpacity]);

  const fetchDashboardData = useCallback(async () => {
    setFetchError(false);
    try {
      const [analyticsRes, recentRes] = await Promise.all([
        api.get('/mobile/analytics').catch(() => ({ data: { stats: {} } })),
        api.get('/mobile/library/recent').catch(() => ({ data: { modules: [] } })),
      ]);

      const data = analyticsRes.data?.stats || {};
      setStats({
        totalStudyMinutes: data.totalStudyMinutes || 0,
        modulesStarted: data.modulesStarted || 0,
        totalSolved: data.totalSolved || 0,
        averageAccuracy: data.averageAccuracy || 0,
      });
      setRecentModules(recentRes.data?.modules || []);
    } catch (error) {
      console.error('[HomeScreen] Error fetching dashboard data:', error);
      setFetchError(true);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <BrandLoader size="lg" label={t('common.loading', language)} />
      </View>
    );
  }

  const firstName = user?.name?.split(' ')[0] || user?.handle || 'Kullanıcı';
  // Gradient avatar rengi: ismin ilk iki harfine göre
  const avatarColors = [
    ['#3B82F6', '#8B5CF6'], ['#06B6D4', '#3B82F6'], ['#10B981', '#06B6D4'],
    ['#F59E0B', '#EF4444'], ['#8B5CF6', '#EC4899'],
  ];
  const avatarColorPair = avatarColors[(firstName.charCodeAt(0) || 0) % avatarColors.length];
  const initials = firstName.slice(0, 2).toUpperCase();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: TAB_SCREEN_CONTENT_BOTTOM }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
        }
      >
        {/* ─── HERO BANNER ─────────────────────────────────────────────────────────── */}
        <View style={styles.heroBanner}>
          {/* Üst gradient şerit */}
          <LinearGradient
            colors={['rgba(59,130,246,0.15)', 'transparent']}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              {fetchError && (
                <Text style={styles.errorHint}>Veriler yüklenemedi — yenilemek için çekin.</Text>
              )}
              <Text style={styles.heroGreeting}>Merhaba, {firstName} 👋</Text>
              <RNAnimated.View style={{ opacity: quoteOpacity }}>
                <Text style={styles.heroQuoteEmoji}>{MOTIVATION_QUOTES[quoteIndex].emoji}</Text>
                <Text style={styles.heroQuote}>{MOTIVATION_QUOTES[quoteIndex].text}</Text>
              </RNAnimated.View>
            </View>

            {/* Gradient Avatar */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/profile');
              }}
            >
              <LinearGradient
                colors={avatarColorPair as [string, string]}
                style={styles.gradientAvatar}
              >
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Stats özet şeridi */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats?.totalStudyMinutes ?? '0'}</Text>
              <Text style={styles.heroStatLabel}>dk çalışma</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats?.modulesStarted ?? '0'}</Text>
              <Text style={styles.heroStatLabel}>modül</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: '#A855F7' }]}>
                %{stats?.averageAccuracy ?? '0'}
              </Text>
              <Text style={styles.heroStatLabel}>doğruluk</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: '#F59E0B' }]}>
                {stats?.totalSolved ?? '0'}
              </Text>
              <Text style={styles.heroStatLabel}>soru</Text>
            </View>
          </View>
        </View>

        {/* Daily Review Widget */}
        <View style={styles.widgetContainer}>
          <DailyReviewWidget />
        </View>

        {/* Focus Widget */}
        <View style={styles.widgetContainer}>
          <FocusWidget />
        </View>

        {/* Quick Stats Grid - 2x2 */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>

            {/* Duration Card (Cyan) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={styles.statCard}
            >
              <LinearGradient colors={['rgba(6, 182, 212, 0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.statHeader}>
                <Text style={styles.statTitle}>{t('settings.duration', language)}</Text>
                <MaterialIcons name="schedule" size={16} color="#06B6D4" />
              </View>
              <View style={styles.statBody}>
                <Text style={styles.statValue}>{stats ? stats.totalStudyMinutes : '0'} dk</Text>
                <Text style={styles.statDesc}>Platformda geçirdiğin süre</Text>
              </View>
            </TouchableOpacity>

            {/* Modules Started Card (Blue) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={styles.statCard}
            >
              <LinearGradient colors={['rgba(59, 130, 246, 0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.statHeader}>
                <Text style={styles.statTitle}>{t('dashboard.modules', language)}</Text>
                <MaterialIcons name="menu-book" size={16} color="#3B82F6" />
              </View>
              <View style={styles.statBody}>
                <Text style={styles.statValue}>{stats ? stats.modulesStarted : '0'}</Text>
                <Text style={styles.statDesc}>İlerleme kaydettiğin setler</Text>
              </View>
            </TouchableOpacity>

            {/* Accuracy Card (Purple) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={styles.statCard}
            >
              <LinearGradient colors={['rgba(168, 85, 247, 0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.statHeader}>
                <Text style={styles.statTitle}>{t('dashboard.stats.accuracy', language)}</Text>
                <MaterialIcons name="trending-up" size={16} color="#A855F7" />
              </View>
              <View style={styles.statBody}>
                <Text style={[styles.statValue, { color: '#C084FC' }]}>%{stats ? stats.averageAccuracy : '0'}</Text>
                <Text style={styles.statDesc}>Genel doğruluk oranınız</Text>
              </View>
            </TouchableOpacity>

            {/* Total Solved Card (Amber) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={styles.statCard}
            >
              <LinearGradient colors={['rgba(245, 158, 11, 0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.statHeader}>
                <Text style={styles.statTitle}>{t('dashboard.stats.solved', language)}</Text>
                <MaterialIcons name="check-circle-outline" size={16} color="#F59E0B" />
              </View>
              <View style={styles.statBody}>
                <Text style={[styles.statValue, { color: '#FBBF24' }]}>{stats ? stats.totalSolved : '0'}</Text>
                <Text style={styles.statDesc}>Çözülen toplam soru sayısı</Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* Son Çalışılan Modüller */}
        {recentModules.length > 0 && (
          <View style={styles.recentContainer}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionLabel}>SON ÇALIŞILANLAR</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/library' as any)}>
                <Text style={styles.sectionLink}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>
            {recentModules.slice(0, 3).map((mod) => (
              <TouchableOpacity
                key={mod.id}
                activeOpacity={0.8}
                style={styles.recentCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/study/${mod.id}` as any);
                }}
              >
                <View style={styles.recentIcon}>
                  <MaterialIcons name="menu-book" size={18} color="#60A5FA" />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle} numberOfLines={1}>{mod.title}</Text>
                  <Text style={styles.recentDate}>
                    {new Date(mod.lastStudied).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#334155" />
              </TouchableOpacity>
            ))}
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
  // Hero Banner styles
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 48,
    marginBottom: 24,
    borderRadius: 28,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  heroLeft: {
    flex: 1,
    marginRight: 16,
  },
  heroGreeting: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroQuoteEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  heroQuote: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  gradientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  // Legacy (artık kullanılmıyor ama silinmedi)
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flex: 1, marginRight: 12 },
  headerTitle: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  errorHint: { color: '#EF4444', fontSize: 11, marginTop: 4, fontWeight: '500' },
  profileButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileIconWrapper: { alignItems: 'center', justifyContent: 'center' },
  widgetContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  statBody: {
    justifyContent: 'center',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statDesc: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  // Son Çalışılanlar
  recentContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  sectionLink: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  recentDate: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: 2,
  },
});
