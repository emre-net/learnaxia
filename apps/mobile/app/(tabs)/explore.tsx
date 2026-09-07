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
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import { useDebounce } from '@/hooks/use-debounce';
import api from '@/lib/api';

type DiscoverItem = {
  id: string;
  title: string;
  description: string | null;
  type?: string;
  owner?: { name?: string; handle?: string; image?: string | null };
  _count?: { items: number };
  createdAt: string;
};

type TabType = 'MODULE' | 'COLLECTION';

export default function ExploreScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('MODULE');
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [fetchError, setFetchError] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchDiscover = useCallback(async () => {
    setFetchError(false);
    try {
      const params = new URLSearchParams();
      params.set('type', activeTab);
      params.set('limit', '20');
      params.set('offset', '0');
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }

      const res = await api.get(`/mobile/discover?${params.toString()}`);
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('[ExploreScreen] Error:', error);
      setItems([]);
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    fetchDiscover();
  }, [fetchDiscover]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiscover();
  }, [fetchDiscover]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'MODULE', label: t('library.tabs.modules', language) },
    { id: 'COLLECTION', label: t('library.tabs.collections', language) },
  ];

  const renderItem = ({ item }: { item: DiscoverItem }) => {
    const isModule = activeTab === 'MODULE';
    const badgeLabel = isModule ? t('library.types.module', language) : t('library.types.collection', language);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.cardContainer}
        onPress={() => {
          if (isModule) {
            router.push(`/study/${item.id}` as any);
          } else {
            router.push(`/collections/${item.id}` as any);
          }
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
          {item.owner?.handle && (
            <Text style={styles.ownerText}>@{item.owner.handle}</Text>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <Ionicons name={isModule ? "document-text-outline" : "folder-outline"} size={16} color="#64748B" />
            <Text style={styles.footerItemsText}>
              {item._count?.items || 0} {t('library.items', language).toLowerCase()}
            </Text>
          </View>
          <View style={styles.footerInfo}>
            <Ionicons name="time-outline" size={14} color="#475569" />
            <Text style={styles.footerDateText}>
              {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
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
        <Ionicons style={styles.searchIcon} name="search" size={18} color="#475569" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('discover.searchPlaceholder', language)}
          placeholderTextColor="#475569"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#475569" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#334155" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {fetchError ? 'Bağlantı Hatası' : t('discover.emptyTitle', language)}
              </Text>
              <Text style={styles.emptyDesc}>
                {fetchError
                  ? 'İçerikler yüklenemedi. İnternet bağlantınızı kontrol edin.'
                  : searchQuery
                    ? t('discover.emptyNoResults', language, { query: searchQuery })
                    : t('discover.emptyDesc', language)}
              </Text>
              {fetchError && (
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                  <Ionicons name="refresh" size={16} color="#000000" />
                  <Text style={styles.retryText}>Tekrar Dene</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            items.length > 0 ? (
              <View style={styles.footerNoteContainer}>
                <Text style={styles.totalResultsText}>
                  {t('discover.totalResults', language, { count: total })}
                </Text>
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
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#111111',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '500',
  },
  tabsContainer: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#111111',
    backgroundColor: '#000000',
  },
  tabButtonActive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F8FAFC',
  },
  tabButtonText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  tabButtonTextActive: {
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: TAB_SCREEN_CONTENT_BOTTOM,
    gap: 12,
  },
  cardContainer: {
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#111111',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ownerText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#111111',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItemsText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  footerDateText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'flex-start',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 99,
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  retryText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  footerNoteContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  totalResultsText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
