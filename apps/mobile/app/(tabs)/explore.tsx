import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, TextInput,
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { t } from '@learnaxia/shared';
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
      activeOpacity={0.8}
      className="bg-ocean-panel rounded-[32px] p-6 mb-4 border border-ocean-border"
      style={{ 
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
      }}
      onPress={() => {
        if (activeTab === 'MODULE') {
          router.push(`/study/${item.id}` as any);
        } else {
          router.push(`/collections/${item.id}` as any);
        }
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View 
          className="px-3 py-1 rounded-lg border"
          style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
        >
          <Text className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">
            {activeTab === 'MODULE' ? t('library.types.module', currentLang) : t('library.types.collection', currentLang)}
          </Text>
        </View>
        {item.owner?.handle && (
          <Text style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-[10px] font-bold tracking-tight">@{item.owner.handle}</Text>
        )}
      </View>

      <Text className="text-xl font-bold text-white mb-2 tracking-tight" numberOfLines={2}>
        {item.title}
      </Text>

      {item.description && (
        <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-sm mb-4 leading-5" numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View 
        className="flex-row items-center justify-between mt-auto pt-4 border-t"
        style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="layers" size={14} color="#00D2FF" />
          <Text style={{ color: 'rgba(255, 255, 255, 0.3)' }} className="text-xs ml-2 font-bold uppercase tracking-tighter">
            {item._count?.items || 0} {t('library.items', currentLang).toLowerCase()}
          </Text>
        </View>
        <View className="flex-row items-center">
          <MaterialIcons name="schedule" size={12} color="rgba(255,255,255,0.2)" />
          <Text style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-[10px] ml-1.5 font-bold">
            {new Date(item.createdAt).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen className="bg-ocean-bg" tabScreen>
      {/* Header */}
      <View className="px-6 pt-10 pb-4">
        <Text className="text-3xl font-bold text-white tracking-tight">{t('discover.title', currentLang)}</Text>
        <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="font-medium">{t('discover.subtitle', currentLang)}</Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-3">
        <View className="flex-row items-center bg-ocean-panel rounded-2xl border border-ocean-border px-4 py-3">
          <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.3)" />
          <TextInput
            className="flex-1 text-white ml-3 text-base"
            placeholder={t('discover.searchPlaceholder', currentLang)}
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
      <View className="flex-row px-6 mb-4 items-center">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            className={`flex-row items-center mr-3 px-4 py-2.5 rounded-xl border`}
            style={{ 
              backgroundColor: activeTab === tab.id ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 1)',
              borderColor: activeTab === tab.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 41, 59, 1)'
            }}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.id ? '#00D2FF' : 'rgba(255,255,255,0.3)'}
            />
            <Text 
              className="ml-2 text-sm font-bold"
              style={{ color: activeTab === tab.id ? '#60A5FA' : 'rgba(255, 255, 255, 0.3)' }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View className="flex-1" />
        <Text style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-[10px] font-black tracking-widest uppercase">
          {total} SONUÇ
        </Text>
      </View>

      {/* Content List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <BrandLoader size="lg" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: TAB_SCREEN_CONTENT_BOTTOM }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
          }
          ListEmptyComponent={
            <View className="items-center mt-16 px-10">
              <View 
                className="w-20 h-20 bg-ocean-panel rounded-full items-center justify-center mb-6 border"
                style={{ 
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderColor: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <MaterialIcons name="explore" size={32} color="rgba(255,255,255,0.1)" />
              </View>
              <Text className="text-white text-lg font-bold mb-2 tracking-tight">{t('discover.emptyTitle', currentLang)}</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-center leading-5 font-medium">
                {searchQuery
                  ? t('discover.emptyNoResults', currentLang, { query: searchQuery })
                  : t('discover.emptyDesc', currentLang)}
              </Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}
