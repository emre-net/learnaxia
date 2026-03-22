import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, TextInput,
} from 'react-native';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme as SharedTheme, t } from '@learnaxia/shared';
import api from '@/lib/api';

const currentLang = 'tr'; // Default to Turkish for now

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
  const [activeTab, setActiveTab] = useState<TabType>('MODULE');
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);

  const fetchDiscover = useCallback(async (reset = false) => {
    try {
      const params = new URLSearchParams();
      params.set('type', activeTab);
      params.set('limit', '20');
      params.set('offset', '0');
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await api.get(`/mobile/discover?${params.toString()}`);
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('[ExploreScreen] Error:', error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    setLoading(true);
    fetchDiscover(true);
  }, [fetchDiscover]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiscover(true);
  }, [fetchDiscover]);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'MODULE', label: t('library.tabs.modules', currentLang), icon: 'menu-book' },
    { id: 'COLLECTION', label: t('library.tabs.collections', currentLang), icon: 'folder-special' },
  ];

  const renderItem = ({ item }: { item: DiscoverItem }) => (
    <TouchableOpacity
      style={{ backgroundColor: '#0f172a', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' }}
      onPress={() => {
        if (activeTab === 'MODULE') {
          router.push(`/study/${item.id}` as any);
        } else {
          router.push(`/collections/${item.id}` as any);
        }
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.2)' }}>
          <Text style={{ color: '#818cf8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
            {activeTab === 'MODULE' ? t('library.types.module', currentLang) : t('library.types.collection', currentLang)}
          </Text>
        </View>
        {item.owner?.handle && (
          <Text style={{ color: '#475569', fontSize: 10, fontWeight: 'bold' }}>@{item.owner.handle}</Text>
        )}
      </View>

      <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 6, letterSpacing: -0.5 }} numberOfLines={2}>
        {item.title}
      </Text>

      {item.description && (
        <Text style={{ color: '#64748b', fontSize: 14, marginBottom: 16, lineHeight: 20 }} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(30, 41, 59, 0.5)' }}>
        <View className="flex-row items-center">
          <MaterialIcons name="layers" size={14} color={SharedTheme.colors.primary} />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 6, fontWeight: 'bold' }}>{item._count?.items || 0} {t('library.items', currentLang).toLowerCase()}</Text>
        </View>
        <View className="flex-row items-center">
          <MaterialIcons name="schedule" size={12} color="#64748b" />
          <Text style={{ color: '#64748b', fontSize: 10, marginLeft: 4, fontWeight: '500' }}>
            {new Date(item.createdAt).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SharedTheme.colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16 }}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', color: 'white', marginBottom: 4, letterSpacing: -0.5 }}>{t('discover.title', currentLang)}</Text>
        <Text style={{ color: '#64748b', fontWeight: '500' }}>{t('discover.subtitle', currentLang)}</Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 12 }}>
          <MaterialIcons name="search" size={20} color="#64748b" />
          <TextInput
            style={{ flex: 1, color: 'white', marginLeft: 12, fontSize: 16 }}
            placeholder={t('discover.searchPlaceholder', currentLang)}
            placeholderTextColor="#475569"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Bar */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, marginBottom: 16 }}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              { flexDirection: 'row', alignItems: 'center', marginRight: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
              activeTab === tab.id ? { backgroundColor: 'rgba(79, 70, 229, 0.2)', borderColor: 'rgba(99, 102, 241, 0.3)' } : { backgroundColor: 'rgba(15, 23, 42, 0.5)', borderColor: '#1e293b' }
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.id ? '#818cf8' : '#64748b'}
            />
            <Text style={[{ marginLeft: 8, fontSize: 14, fontWeight: 'bold' }, activeTab === tab.id ? { color: '#818cf8' } : { color: '#64748b' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        <View style={{ justifyContent: 'center' }}>
          <Text style={{ color: '#475569', fontSize: 12, fontWeight: 'bold' }}>{t('discover.totalResults', currentLang, { count: total })}</Text>
        </View>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <BrandLoader size="lg" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SharedTheme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 64, paddingHorizontal: 40 }}>
              <View style={{ width: 80, height: 80, backgroundColor: '#0f172a', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1e293b' }}>
                <MaterialIcons name="explore" size={32} color="#475569" />
              </View>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>{t('discover.emptyTitle', currentLang)}</Text>
              <Text style={{ color: '#64748b', textAlign: 'center', lineHeight: 20, fontWeight: '500' }}>
                {searchQuery
                  ? t('discover.emptyNoResults', currentLang, { query: searchQuery })
                  : t('discover.emptyDesc', currentLang)}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
