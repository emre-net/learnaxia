import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, AppState, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { useRouter, useFocusEffect } from 'expo-router';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { Ionicons } from '@expo/vector-icons';
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
  const [scoreData, setScoreData] = useState<any>(null);
  const [journeys, setJourneys] = useState<{ id: string; title: string; _count: { slides: number } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [analyticsRes, recentRes, scoreRes, journeysRes] = await Promise.all([
        api.get('/mobile/analytics').catch(() => ({ data: { stats: {} } })),
        api.get('/mobile/library/recent').catch(() => ({ data: { modules: [] } })),
        api.get('/scores/me').catch(() => ({ data: null })),
        api.get('/mobile/journeys').catch(() => ({ data: { journeys: [] } })),
      ]);

      const data = analyticsRes.data?.stats || {};
      setScoreData(scoreRes.data || null);
      setStats({
        totalStudyMinutes: data.totalStudyMinutes || 0,
        modulesStarted: data.modulesStarted || 0,
        totalSolved: data.totalSolved || 0,
        averageAccuracy: data.averageAccuracy || 0,
      });
      setRecentModules(recentRes.data?.modules || []);
      setJourneys(journeysRes.data?.journeys || []);
    } catch (error) {
      console.error('[HomeScreen] Error fetching dashboard data:', error);
      setScoreData(null);
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

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  useEffect(() => {
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
  const mostRecentModule = recentModules[0] || null;

  return (
    <Screen style={styles.container} tabScreen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: TAB_SCREEN_CONTENT_BOTTOM, paddingTop: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#71717A" />}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. ÜST BAR: Sıcak Karşılama ve Profil Geçişi */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingSub}>Öğrenme Alanın</Text>
            <Text style={styles.greetingTitle}>İyi çalışmalar, {firstName}! ✨</Text>
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

        {/* 2. KEŞİF BALONLARI (Story Bubbles - Yeni & Aktif Kullanıcı Keşif Akışı) */}
        <View style={styles.storySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storyScrollContent}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.storyBubble}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/create');
              }}
            >
              <View style={[styles.storyIconCircle, { borderColor: '#38BDF8' }]}>
                <Ionicons name="camera" size={20} color="#38BDF8" />
              </View>
              <Text style={styles.storyLabel}>Soru Çöz</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.storyBubble}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/journey/new' as any);
              }}
            >
              <View style={[styles.storyIconCircle, { borderColor: '#A855F7' }]}>
                <Ionicons name="sparkles" size={20} color="#A855F7" />
              </View>
              <Text style={styles.storyLabel}>AI Rotası</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.storyBubble}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/explore' as any);
              }}
            >
              <View style={[styles.storyIconCircle, { borderColor: '#34D399' }]}>
                <Ionicons name="compass" size={20} color="#34D399" />
              </View>
              <Text style={styles.storyLabel}>Keşfet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.storyBubble}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/notes/new' as any);
              }}
            >
              <View style={[styles.storyIconCircle, { borderColor: '#F59E0B' }]}>
                <Ionicons name="create" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.storyLabel}>Yeni Not</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.storyBubble}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/leaderboard' as any);
              }}
            >
              <View style={[styles.storyIconCircle, { borderColor: '#FB7185' }]}>
                <Ionicons name="trophy" size={20} color="#FB7185" />
              </View>
              <Text style={styles.storyLabel}>Sıralama</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 3. HERO: KALDIĞIN YERDEN DEVAM ET (İçerik Odaklı) */}
        {mostRecentModule ? (
          <View style={styles.heroCard}>
            <View style={styles.heroCardHeader}>
              <View style={styles.heroBadge}>
                <Ionicons name="play" size={12} color="#38BDF8" style={{ marginRight: 4 }} />
                <Text style={styles.heroBadgeText}>KALDIĞIN YERDEN DEVAM ET</Text>
              </View>
              <Text style={styles.heroDate}>
                {new Date(mostRecentModule.lastStudied).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </Text>
            </View>

            <Text style={styles.heroModuleTitle} numberOfLines={2}>
              {mostRecentModule.title}
            </Text>

            <View style={styles.heroActionRow}>
              <View style={styles.heroTypeTag}>
                <Text style={styles.heroTypeTagText}>
                  {mostRecentModule.type === 'GAP'
                    ? 'Boşluk Doldurma'
                    : mostRecentModule.type === 'MC'
                    ? 'Çoktan Seçmeli'
                    : mostRecentModule.type === 'TRUE_FALSE'
                    ? 'Doğru / Yanlış'
                    : 'Flashcard'}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.heroPlayButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push(`/study/${mostRecentModule.id}` as any);
                }}
              >
                <Ionicons name="play" size={16} color="#09090B" />
                <Text style={styles.heroPlayButtonText}>Hemen Çalış</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyHeroCard}>
            <View style={styles.emptyHeroLeft}>
              <Text style={styles.emptyHeroTitle}>Bugün Yeni Bir Şey Öğren</Text>
              <Text style={styles.emptyHeroDesc}>
                İlk modülünü oluşturabilir, kamerayla soru çözdürebilir veya topluluk setlerini keşfedebilirsin.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.emptyHeroBtn}
                onPress={() => router.push('/create')}
              >
                <Ionicons name="add" size={16} color="#09090B" />
                <Text style={styles.emptyHeroBtnText}>İçerik Üret</Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="school-outline" size={48} color="#27272A" />
          </View>
        )}

        {/* 4. ZARİF MOMENTUM ŞERİDİ (Minimalist Lig & Puan Göstergesi) */}
        {scoreData?.tier?.thisMonth && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.momentumCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/leaderboard' as any);
            }}
          >
            <View style={styles.momentumLeft}>
              <Text style={styles.momentumEmoji}>{scoreData.tier.thisMonth.emoji || '⚡'}</Text>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.momentumTierTitle}>{scoreData.tier.thisMonth.label} Ligi</Text>
                  <View style={styles.momentumPointsPill}>
                    <Text style={styles.momentumPointsText}>
                      {(scoreData.momentum?.thisMonth || 0).toLocaleString('tr-TR')} pts
                    </Text>
                  </View>
                </View>
                <Text style={styles.momentumSubtitle}>
                  {scoreData.tier.thisMonth.pointsToNext != null
                    ? `Sonraki seviyeye ${scoreData.tier.thisMonth.pointsToNext.toLocaleString('tr-TR')} pts kaldı`
                    : 'En yüksek seviyedesin!'}
                </Text>
              </View>
            </View>

            <View style={styles.momentumRight}>
              <Text style={styles.momentumLinkText}>Sıralama</Text>
              <Ionicons name="chevron-forward" size={14} color="#38BDF8" />
            </View>
          </TouchableOpacity>
        )}

        {/* 5. AKILLI TEKRAR & ODAK BİLEŞENLERİ */}
        <View style={styles.widgetWrapper}>
          <DailyReviewWidget />
        </View>
        <View style={styles.widgetWrapper}>
          <FocusWidget />
        </View>

        {/* 6. SON AKTİVİTELER */}
        {recentModules.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Son Aktiviteler</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/library' as any)}>
                <Ionicons name="arrow-forward" size={18} color="#71717A" />
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
                    router.push(`/modules/${mod.id}` as any);
                  }}
                >
                  <View style={styles.recentDot} />
                  <View style={styles.recentTextContainer}>
                    <Text style={styles.recentItemTitle} numberOfLines={1}>{mod.title}</Text>
                    <Text style={styles.recentItemDate}>
                      {new Date(mod.lastStudied).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#3F3F46" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 7. ÖĞRENME YOLCULUKLARI */}
        {journeys.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Öğrenme Yolculukları</Text>
              <View style={styles.journeyBadge}>
                <Text style={styles.journeyBadgeText}>{journeys.length}</Text>
              </View>
            </View>
            <View style={styles.recentList}>
              {journeys.slice(0, 3).map((journey, index) => (
                <TouchableOpacity
                  key={journey.id}
                  activeOpacity={0.6}
                  style={[
                    styles.recentRow,
                    index === Math.min(journeys.length, 3) - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/journey/${journey.id}` as any);
                  }}
                >
                  <View style={[styles.recentDot, { backgroundColor: '#A855F7' }]} />
                  <View style={styles.recentTextContainer}>
                    <Text style={styles.recentItemTitle} numberOfLines={1}>{journey.title}</Text>
                    <Text style={styles.recentItemDate}>{journey._count.slides} slayt</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#3F3F46" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090B',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F4F4F5',
    letterSpacing: -0.3,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#F4F4F5',
    fontWeight: '800',
    fontSize: 15,
  },
  storySection: {
    marginBottom: 20,
  },
  storyScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  storyBubble: {
    alignItems: 'center',
    gap: 6,
  },
  storyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#121215',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  heroCard: {
    backgroundColor: '#121215',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#27272A',
    marginHorizontal: 20,
    padding: 18,
    marginBottom: 18,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  heroDate: {
    fontSize: 11,
    fontWeight: '500',
    color: '#71717A',
  },
  heroModuleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F4F4F5',
    lineHeight: 26,
    marginBottom: 14,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTypeTag: {
    backgroundColor: '#18181B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  heroTypeTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  heroPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  heroPlayButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#09090B',
  },
  emptyHeroCard: {
    backgroundColor: '#121215',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#27272A',
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyHeroLeft: {
    flex: 1,
    marginRight: 12,
  },
  emptyHeroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F4F4F5',
    marginBottom: 4,
  },
  emptyHeroDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#71717A',
    marginBottom: 12,
  },
  emptyHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyHeroBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#09090B',
  },
  momentumCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  momentumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  momentumEmoji: {
    fontSize: 26,
  },
  momentumTierTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  momentumPointsPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  momentumPointsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  momentumSubtitle: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  momentumRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  momentumLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
  },
  widgetWrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  recentSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F4F4F5',
    letterSpacing: -0.2,
  },
  journeyBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  journeyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A855F7',
  },
  recentList: {
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    marginRight: 12,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F4F4F5',
    marginBottom: 2,
  },
  recentItemDate: {
    fontSize: 11,
    color: '#71717A',
  },
});
