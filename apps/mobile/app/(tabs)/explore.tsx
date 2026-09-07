import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, TextInput, StyleSheet
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
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

  // 500ms debounce — her harf girişinde API çağrısı yapılmaz
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

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'MODULE', label: t('library.tabs.modules', language), icon: 'menu-book' },
    { id: 'COLLECTION', label: t('library.tabs.collections', language), icon: 'folder-special' },
  ];

  // ── İçerik tipi renk kimliği ───────────────────────────────────────────────────
  const TYPE_IDENTITY: Record<TabType, {
    color: string; bg: string; border: string;
    icon: string; badgeLabel: string;
  }> = {
    MODULE: {
      color: '#00D2FF', bg: 'rgba(0,210,255,0.08)', border: 'rgba(0,210,255,0.25)',
      icon: 'menu-book', badgeLabel: t('library.types.module', language),
    },
    COLLECTION: {
      color: '#A855F7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)',
      icon: 'folder-special', badgeLabel: t('library.types.collection', language),
    },
  };

  const renderItem = ({ item }: { item: DiscoverItem }) => {
    const identity = TYPE_IDENTITY[activeTab];
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.cardContainer, {
          borderLeftWidth: 3,
          borderLeftColor: identity.color,
          backgroundColor: identity.bg,
        }]}
        onPress={() => {
          if (activeTab === 'MODULE') {
            router.push(`/study/${item.id}` as any);
          } else {
            router.push(`/collections/${item.id}` as any);
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.badgeWrapper, {
            backgroundColor: identity.bg,
            borderColor: identity.border,
          }]}>
            <MaterialIcons name={identity.icon as any} size={12} color={identity.color} />
            <Text style={[styles.badgeText, { color: identity.color, marginLeft: 4 }]}>
              {identity.badgeLabel}
            </Text>
          </View>
          {item.owner?.handle && (
            <Text style={styles.ownerText}>@{item.owner.handle}</Text>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <MaterialIcons name="layers" size={14} color={identity.color} />
            <Text style={[styles.footerItemsText, { color: identity.color }]}>
              {item._count?.items || 0} {t('library.items', language).toLowerCase()}
            </Text>
          </View>
          <View style={styles.footerInfo}>
            <MaterialIcons name="schedule" size={12} color="rgba(255,255,255,0.2)" />
            <Text style={styles.footerDateText}>
              {new Date(item.createdAt).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen style={styles.screen} tabScreen>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('discover.title', language)}</Text>
        <Text style={styles.subtitle}>{t('discover.subtitle', language)}</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <MaterialIcons style={styles.searchIcon} name="search" size={20} color="rgba(255,255,255,0.3)" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('discover.searchPlaceholder', language)}
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeTab === tab.id ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 1)',
                borderColor: activeTab === tab.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 41, 59, 1)'
              }
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.id ? '#00D2FF' : 'rgba(255,255,255,0.3)'}
            />
            <Text
              style={[styles.tabButtonText, { color: activeTab === tab.id ? '#60A5FA' : 'rgba(255, 255, 255, 0.3)' }]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        <Text style={styles.totalResultsText}>
          {t('discover.totalResults', language, { count: total })}
        </Text>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <BrandLoader size="lg" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: '#050A14' }}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: TAB_SCREEN_CONTENT_BOTTOM }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                {fetchError ? (
                  <MaterialIcons name="wifi-off" size={32} color="rgba(255,255,255,0.1)" />
                ) : (
                  <MaterialIcons name="explore" size={32} color="rgba(255,255,255,0.1)" />
                )}
              </View>
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
                  <MaterialIcons name="refresh" size={16} color="#60A5FA" />
                  <Text style={styles.retryText}>Tekrar Dene</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050A14',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090F1D',
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#182234',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingLeft: 24,
    alignItems: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalResultsText: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingRight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 32,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  badgeText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  ownerText: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItemsText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  footerDateText: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 10,
    marginLeft: 6,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 64,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptyDesc: {
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  retryText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});
