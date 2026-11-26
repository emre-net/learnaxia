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

interface RecentModule {
  id: string;
  title: string;
  type: string;
  lastStudied: string;
  itemCount?: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [recentModules, setRecentModules] = useState<RecentModule[]>([]);
  const [scoreData, setScoreData] = useState<any>(null);
  const [journeys, setJourneys] = useState<{ id: string; title: string; _count: { slides: number } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [recentRes, scoreRes, journeysRes] = await Promise.all([
        api.get('/mobile/library/recent').catch(() => ({ data: { modules: [] } })),
        api.get('/scores/me').catch(() => ({ data: null })),
        api.get('/mobile/journeys').catch(() => ({ data: { journeys: [] } })),
      ]);

      setScoreData(scoreRes.data || null);
      setRecentModules(recentRes.data?.modules || []);
      setJourneys(journeysRes.data?.journeys || []);
    } catch (error) {
      if (__DEV__) console.error('[HomeScreen] Error fetching dashboard data:', error);
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
    const subscription = AppState.addEventListener('change', (nextAppState) => {
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
  const isTr = language === 'tr';

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'GAP': return t('library.types.gap', language);
      case 'MC': return t('library.types.mc', language);
      case 'TRUE_FALSE': return t('library.types.true_false', language);
      default: return t('library.types.flashcard', language);
    }
  };

  return (
    <Screen style={styles.container} tabScreen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: TAB_SCREEN_CONTENT_BOTTOM, paddingTop: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#71717A" />}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Üst Bar */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingSub}>{isTr ? 'Öğrenme Alanın' : 'Learning Hub'}</Text>
            <Text style={styles.greetingTitle}>
              {isTr ? `İyi çalışmalar, ${firstName}` : `Welcome back, ${firstName}`}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/profile' as any);
            }}
            style={styles.avatarButton}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Hızlı Keşif Balonları (Web ile %100 ortak aksiyon şeridi) */}
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
              <Text style={styles.storyLabel}>{isTr ? 'Soru Çöz' : 'Solve Photo'}</Text>
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
              <Text style={styles.storyLabel}>{isTr ? 'AI Rotası' : 'AI Journey'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.storyBubble}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/explore' as any);
              }}
            >
              <View style={[styles.storyIconCircle, { borderColor: '#10B981' }]}>
                <Ionicons name="compass" size={20} color="#10B981" />
              </View>
              <Text style={styles.storyLabel}>{isTr ? 'Keşfet' : 'Explore'}</Text>
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
              <Text style={styles.storyLabel}>{isTr ? 'Yeni Not' : 'New Note'}</Text>
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
              <Text style={styles.storyLabel}>{isTr ? 'Sıralama' : 'Ranking'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 3. Hero: Kaldığın Yerden Devam Et */}
        {mostRecentModule ? (
          <View style={styles.heroCard}>
            <View style={styles.heroCardHeader}>
              <View style={styles.heroBadge}>
                <Ionicons name="play" size={12} color="#38BDF8" style={{ marginRight: 4 }} />
                <Text style={styles.heroBadgeText}>
                  {isTr ? 'Kaldığın Yerden Devam Et' : 'Jump Back In'}
                </Text>
              </View>
              <Text style={styles.heroDate}>
                {new Date(mostRecentModule.lastStudied).toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
              </Text>
            </View>

            <Text style={styles.heroModuleTitle} numberOfLines={2}>
              {mostRecentModule.title}
            </Text>

            <View style={styles.heroActionRow}>
              <View style={styles.heroTagGroup}>
                <View style={styles.heroTypeTag}>
                  <Text style={styles.heroTypeTagText}>{getTypeLabel(mostRecentModule.type)}</Text>
                </View>
                {typeof mostRecentModule.itemCount === 'number' && (
                  <View style={styles.heroTypeTag}>
                    <Text style={styles.heroTypeTagText}>
                      {mostRecentModule.itemCount} {isTr ? 'içerik' : 'items'}
                    </Text>
                  </View>
                )}
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
                <Text style={styles.heroPlayButtonText}>{isTr ? 'Hemen Çalış' : 'Study Now'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyHeroCard}>
            <View style={styles.emptyHeroLeft}>
              <Text style={styles.emptyHeroTitle}>
                {isTr ? 'Bugün Yeni Bir Şey Öğren' : 'Learn Something New Today'}
              </Text>
              <Text style={styles.emptyHeroDesc}>
                {isTr
                  ? 'İlk modülünü oluşturabilir, kamerayla soru çözdürebilir veya topluluk setlerini keşfedebilirsin.'
                  : 'Create your first module, solve a photo question with AI, or explore public sets.'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.emptyHeroBtn}
                onPress={() => router.push('/create')}
              >
                <Ionicons name="add" size={16} color="#09090B" />
                <Text style={styles.emptyHeroBtnText}>{isTr ? 'İçerik Üret' : 'Create Content'}</Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="school-outline" size={48} color="#27272A" />
          </View>
        )}

        {/* 4. Zarif Momentum Şeridi */}
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
                  <Text style={styles.momentumTierTitle}>
                    {scoreData.tier.thisMonth.label} {isTr ? 'Ligi' : 'League'}
                  </Text>
                  <View style={styles.momentumPointsPill}>
                    <Text style={styles.momentumPointsText}>
                      {(scoreData.momentum?.thisMonth || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US')} pts
                    </Text>
                  </View>
                </View>
                <Text style={styles.momentumSubtitle}>
                  {scoreData.tier.thisMonth.pointsToNext != null
                    ? (isTr
                        ? `Sonraki seviyeye ${scoreData.tier.thisMonth.pointsToNext.toLocaleString('tr-TR')} pts kaldı`
                        : `${scoreData.tier.thisMonth.pointsToNext.toLocaleString('en-US')} pts to next tier`)
                    : (isTr ? 'En yüksek seviyedesin!' : 'Top tier achieved!')}
                </Text>
              </View>
            </View>

            <View style={styles.momentumRight}>
              <Text style={styles.momentumLinkText}>{isTr ? 'Sıralama' : 'Ranking'}</Text>
              <Ionicons name="chevron-forward" size={14} color="#38BDF8" />
            </View>
          </TouchableOpacity>
        )}

        {/* 5. Akıllı Tekrar & Odak Bileşenleri */}
        <View style={styles.widgetWrapper}>
          <DailyReviewWidget />
        </View>
        <View style={styles.widgetWrapper}>
          <FocusWidget />
        </View>

        {/* 6. Son Aktiviteler */}
        {recentModules.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>{isTr ? 'Son Aktiviteler' : 'Recent Activity'}</Text>
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
                    index === recentModules.slice(0, 4).length - 1 && { borderBottomWidth: 0 },
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
                      {getTypeLabel(mod.type)}
                      {typeof mod.itemCount === 'number' ? ` • ${mod.itemCount} ${isTr ? 'içerik' : 'items'}` : ''}
                      {' • '}
                      {new Date(mod.lastStudied).toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#3F3F46" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 7. Öğrenme Yolculukları */}
        {journeys.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>{isTr ? 'Öğrenme Yolculukları' : 'Learning Journeys'}</Text>
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
                    index === Math.min(journeys.length, 3) - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/journey/${journey.id}` as any);
                  }}
                >
                  <View style={[styles.recentDot, { backgroundColor: '#A855F7' }]} />
                  <View style={styles.recentTextContainer}>
                    <Text style={styles.recentItemTitle} numberOfLines={1}>{journey.title}</Text>
                    <Text style={styles.recentItemDate}>
                      {journey._count.slides} {isTr ? 'slayt' : 'slides'}
                    </Text>
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
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
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
    gap: 8,
  },
  heroTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
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
