import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, TextInput, StyleSheet, ScrollView
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { t, MAIN_CATEGORIES, CATEGORIES, parseNoteContent } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import { useDebounce } from '@/hooks/use-debounce';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';

type DiscoverItem = {
  id: string;
  title: string;
  description: string | null;
  content?: string | null;
  type?: string;
  category?: string | null;
  subCategory?: string | null;
  owner?: { name?: string; handle?: string; image?: string | null };
  _count?: { items: number };
  createdAt: string;
};

type TabType = 'MODULE' | 'COLLECTION' | 'NOTE';
type ModuleTypeFilter = 'ALL' | 'FLASHCARD' | 'MC' | 'TRUE_FALSE' | 'GAP';

const PAGE_LIMIT = 20;

export default function ExploreScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('MODULE');
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [selectedModuleType, setSelectedModuleType] = useState<ModuleTypeFilter>('ALL');
  const [total, setTotal] = useState(0);
  const [fetchError, setFetchError] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 450);

  const MODULE_TYPE_FILTERS: { id: ModuleTypeFilter; label: string; icon: any }[] = [
    { id: 'ALL', label: language === 'tr' ? 'Tüm Tipler' : 'All Types', icon: 'apps-outline' },
    { id: 'FLASHCARD', label: t('library.types.flashcard', language), icon: 'layers-outline' },
    { id: 'MC', label: t('library.types.mc', language), icon: 'radio-button-on-outline' },
    { id: 'TRUE_FALSE', label: t('library.types.true_false', language), icon: 'checkmark-circle-outline' },
    { id: 'GAP', label: t('library.types.gap', language), icon: 'create-outline' },
  ];

  const availableSubCategories =
    selectedCategory !== 'ALL' && CATEGORIES[selectedCategory] ? CATEGORIES[selectedCategory] : [];

  const fetchDiscover = useCallback(
    async (offset = 0, append = false) => {
      setFetchError(false);
      try {
        const params = new URLSearchParams();
        params.set('type', activeTab);
        params.set('limit', String(PAGE_LIMIT));
        params.set('offset', String(offset));
        if (debouncedSearch.trim()) {
          params.set('search', debouncedSearch.trim());
        }
        if (selectedCategory && selectedCategory !== 'ALL' && activeTab !== 'NOTE') {
          params.set('category', selectedCategory);
          if (selectedSubCategory && selectedSubCategory !== 'ALL') {
            params.set('subCategory', selectedSubCategory);
          }
        }
        if (activeTab === 'MODULE' && selectedModuleType !== 'ALL') {
          params.set('moduleType', selectedModuleType);
        }

        const res = await api.get(`/mobile/discover?${params.toString()}`);
        const fetched: DiscoverItem[] = res.data.items || [];
        setItems((prev) => (append ? [...prev, ...fetched] : fetched));
        setTotal(res.data.total || fetched.length);
      } catch (error) {
        if (__DEV__) console.error('[ExploreScreen] Error:', error);
        if (!append) setItems([]);
        setFetchError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [activeTab, debouncedSearch, selectedCategory, selectedSubCategory, selectedModuleType]
  );

  useEffect(() => {
    setLoading(true);
    fetchDiscover(0, false);
  }, [fetchDiscover]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiscover(0, false);
  }, [fetchDiscover]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || items.length >= total) return;
    setLoadingMore(true);
    fetchDiscover(items.length, true);
  }, [loading, loadingMore, items.length, total, fetchDiscover]);

  const tabs: { id: TabType; label: string; icon: 'document-text' | 'folder' | 'book' }[] = [
    { id: 'MODULE', label: t('library.tabs.modules', language), icon: 'document-text' },
    { id: 'COLLECTION', label: t('library.tabs.collections', language), icon: 'folder' },
    { id: 'NOTE', label: t('library.tabs.notes', language), icon: 'book' },
  ];

  const getTypeBadgeStyle = (itemType?: string, isNoteTab?: boolean, isCollTab?: boolean) => {
    if (isNoteTab) return { bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA' };
    if (isCollTab) return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8' };
    switch (itemType) {
      case 'FLASHCARD': return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8' };
      case 'MC': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399' };
      case 'TRUE_FALSE': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24' };
      case 'GAP': return { bg: 'rgba(244, 63, 94, 0.15)', text: '#FB7185' };
      default: return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8' };
    }
  };

  const renderItem = ({ item }: { item: DiscoverItem }) => {
    const isModule = activeTab === 'MODULE';
    const isNote = activeTab === 'NOTE';
    const isCollection = activeTab === 'COLLECTION';
    const badgeLabel = isNote
      ? t('library.tabs.notes', language)
      : isCollection
        ? t('library.types.collection', language)
        : item.type === 'MC'
          ? t('library.types.mc', language)
          : item.type === 'FLASHCARD'
            ? t('library.types.flashcard', language)
            : item.type === 'TRUE_FALSE'
              ? t('library.types.true_false', language)
              : item.type === 'GAP'
                ? t('library.types.gap', language)
                : (item.type || t('library.types.module', language));

    const badgeStyle = getTypeBadgeStyle(item.type, isNote, isCollection);
    const parsedSnippet = isNote && !item.description && item.content ? parseNoteContent(item.content).plainText : '';
    const snippet = item.description || parsedSnippet || null;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.cardContainer}
        onPress={() => {
          if (isNote) router.push(`/notes/${item.id}` as any);
          else if (isModule) router.push(`/modules/${item.id}` as any);
          else router.push(`/collections/${item.id}` as any);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.badgePill, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{badgeLabel}</Text>
            </View>
            {item.category && (
              <Text style={styles.categoryTag} numberOfLines={1}>
                {item.category}{item.subCategory ? ` / ${item.subCategory}` : ''}
              </Text>
            )}
          </View>
          {item.owner?.handle && (
            <Text style={styles.ownerText}>@{item.owner.handle}</Text>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

        {snippet && (
          <Text style={styles.cardDescription} numberOfLines={2}>{snippet}</Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <Ionicons
              name={isNote ? 'journal-outline' : isModule ? 'document-text-outline' : 'folder-outline'}
              size={16}
              color="#71717A"
            />
            <Text style={styles.footerItemsText}>
              {isNote
                ? (language === 'tr' ? 'Notu Görüntüle' : 'View Note')
                : `${item._count?.items || 0} ${t('library.items', language).toLowerCase()}`}
            </Text>
          </View>
          <View style={styles.footerInfo}>
            <Ionicons name="time-outline" size={14} color="#71717A" />
            <Text style={styles.footerDateText}>
              {new Date(item.createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen style={styles.screen} tabScreen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('discover.title', language)}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons style={styles.searchIcon} name="search" size={18} color="#71717A" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('discover.searchPlaceholder', language)}
          placeholderTextColor="#71717A"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#71717A" />
          </TouchableOpacity>
        )}
      </View>

      {/* Fluid Scrollable Type Pills (No flex:1 text clipping) */}
      <View style={styles.tabsOuter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.id);
                }}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isActive ? '#09090B' : '#A1A1AA'}
                />
                <Text style={[styles.segmentBtnText, isActive && styles.segmentBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Predefined Main Category Chips (Modules & Collections) */}
      {activeTab !== 'NOTE' && (
        <View style={styles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory('ALL');
                setSelectedSubCategory('ALL');
              }}
              style={[styles.categoryChip, selectedCategory === 'ALL' && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryChipText, selectedCategory === 'ALL' && styles.categoryChipTextActive]}>
                {language === 'tr' ? 'Tümü' : 'All'}
              </Text>
            </TouchableOpacity>

            {MAIN_CATEGORIES.map((cat) => {
              const isCatActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(isCatActive ? 'ALL' : cat);
                    setSelectedSubCategory('ALL');
                  }}
                  style={[styles.categoryChip, isCatActive && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, isCatActive && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Dynamic SubCategory Chips */}
      {activeTab !== 'NOTE' && availableSubCategories.length > 0 && (
        <View style={styles.typeFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <TouchableOpacity
              onPress={() => setSelectedSubCategory('ALL')}
              style={[styles.typeChip, selectedSubCategory === 'ALL' && styles.typeChipActive]}
            >
              <Text style={[styles.typeChipText, selectedSubCategory === 'ALL' && styles.typeChipTextActive]}>
                {language === 'tr' ? 'Tüm Alt Kategoriler' : 'All Subcategories'}
              </Text>
            </TouchableOpacity>
            {availableSubCategories.map((sub) => {
              const isSubActive = selectedSubCategory === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedSubCategory(isSubActive ? 'ALL' : sub);
                  }}
                  style={[styles.typeChip, isSubActive && styles.typeChipActive]}
                >
                  <Text style={[styles.typeChipText, isSubActive && styles.typeChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 4 Question Type Filter Chips (Modules) */}
      {activeTab === 'MODULE' && (
        <View style={styles.typeFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {MODULE_TYPE_FILTERS.map((tf) => {
              const isActive = selectedModuleType === tf.id;
              return (
                <TouchableOpacity
                  key={tf.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedModuleType(tf.id);
                  }}
                  style={[styles.typeChip, isActive && styles.typeChipActive]}
                >
                  <Ionicons
                    name={tf.icon}
                    size={13}
                    color={isActive ? '#38BDF8' : '#71717A'}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.typeChipText, isActive && styles.typeChipTextActive]}>
                    {tf.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <BrandLoader size="lg" />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#71717A" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name={fetchError ? 'cloud-offline-outline' : activeTab === 'MODULE' ? 'compass-outline' : 'folder-open-outline'}
                  size={34}
                  color="#38BDF8"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {fetchError ? (language === 'tr' ? 'Bağlantı Hatası' : 'Connection Error') : t('discover.emptyTitle', language)}
              </Text>
              <Text style={styles.emptyDesc}>
                {fetchError
                  ? 'İçerikler yüklenemedi. İnternet bağlantınızı kontrol edin.'
                  : searchQuery
                    ? t('discover.emptyNoResults', language, { query: searchQuery })
                    : t('discover.emptyDesc', language)}
              </Text>
              {fetchError ? (
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                  <Ionicons name="refresh" size={16} color="#09090B" />
                  <Text style={styles.retryText}>{t('common.retry', language)}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.emptyActionBtn} onPress={() => router.push('/create' as any)}>
                  <Ionicons name="add" size={18} color="#09090B" />
                  <Text style={styles.emptyActionBtnText}>{t('nav.create', language)}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            items.length > 0 ? (
              <View style={styles.footerNoteContainer}>
                {loadingMore ? (
                  <BrandLoader size={22} showBlur={false} />
                ) : items.length < total ? (
                  <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreBtn}>
                    <Text style={styles.loadMoreText}>
                      {language === 'tr' ? `Daha Fazla Yükle (${items.length}/${total})` : `Load More (${items.length}/${total})`}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.totalResultsText}>
                    {t('discover.totalResults', language, { count: total })}
                  </Text>
                )}
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F4F4F5',
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121215',
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#F4F4F5',
    fontSize: 15,
    fontWeight: '500',
  },
  tabsOuter: {
    marginBottom: 12,
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  segmentBtnActive: {
    backgroundColor: '#F4F4F5',
    borderColor: '#F4F4F5',
  },
  segmentBtnText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: '#09090B',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090B',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: TAB_SCREEN_CONTENT_BOTTOM,
    gap: 12,
  },
  cardContainer: {
    backgroundColor: '#121215',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryTag: {
    fontSize: 11,
    color: '#71717A',
    flexShrink: 1,
  },
  ownerText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F4F4F5',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 13,
    color: '#A1A1AA',
    lineHeight: 19,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#18181B',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItemsText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  footerDateText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F4F4F5',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    color: '#09090B',
    fontSize: 14,
    fontWeight: '700',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#09090B',
    fontWeight: '700',
    fontSize: 14,
  },
  footerNoteContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  loadMoreText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  totalResultsText: {
    color: '#71717A',
    fontSize: 12,
  },
  categoryContainer: {
    marginBottom: 10,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  categoryChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  categoryChipText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#09090B',
    fontWeight: '700',
  },
  typeFilterContainer: {
    paddingBottom: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  typeChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38BDF8',
  },
  typeChipText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
});
