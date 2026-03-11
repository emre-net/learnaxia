import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  SafeAreaView, RefreshControl, TextInput, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme as SharedTheme } from '@learnaxia/shared';
import api from '@/lib/api';

const { width } = Dimensions.get('window');

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
    { id: 'MODULE', label: 'Modüller', icon: 'menu-book' },
    { id: 'COLLECTION', label: 'Koleksiyonlar', icon: 'folder-special' },
  ];

  const renderItem = ({ item }: { item: DiscoverItem }) => (
    <TouchableOpacity
      className="bg-slate-900 rounded-3xl p-5 mb-4 border border-slate-800 active:bg-slate-800"
      onPress={() => {
        if (activeTab === 'MODULE') {
          router.push(`/study/${item.id}`);
        }
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
          <Text className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
            {activeTab === 'MODULE' ? 'Modül' : 'Koleksiyon'}
          </Text>
        </View>
        {item.owner?.handle && (
          <Text className="text-slate-600 text-[10px] font-bold">@{item.owner.handle}</Text>
        )}
      </View>

      <Text className="text-lg font-bold text-white mb-1.5 tracking-tight" numberOfLines={2}>
        {item.title}
      </Text>

      {item.description && (
        <Text className="text-slate-500 text-sm mb-4 leading-5" numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View className="flex-row items-center justify-between mt-auto pt-3 border-t border-slate-800/50">
        <View className="flex-row items-center">
          <MaterialIcons name="layers" size={14} color={SharedTheme.colors.primary} />
          <Text className="text-slate-400 text-xs ml-1.5 font-bold">{item._count?.items || 0} içerik</Text>
        </View>
        <View className="flex-row items-center">
          <MaterialIcons name="schedule" size={12} color="#64748b" />
          <Text className="text-slate-600 text-[10px] ml-1 font-medium">
            {new Date(item.createdAt).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950" style={{ backgroundColor: SharedTheme.colors.background }}>
      {/* Header */}
      <View className="px-6 pt-10 pb-4">
        <Text className="text-3xl font-bold text-white mb-1 tracking-tight">Keşfet</Text>
        <Text className="text-slate-500 font-medium">Topluluktan en yeni üretimler</Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-4">
        <View className="flex-row items-center bg-slate-900 rounded-2xl border border-slate-800 px-4 py-3">
          <MaterialIcons name="search" size={20} color="#64748b" />
          <TextInput
            className="flex-1 text-white ml-3 text-base"
            placeholder="İçeriklerde ara..."
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
      <View className="flex-row px-6 mb-4">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            className={`flex-row items-center mr-3 px-5 py-2.5 rounded-xl border ${activeTab === tab.id
              ? 'bg-indigo-600/20 border-indigo-500/30'
              : 'bg-slate-900/50 border-slate-800'
              }`}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.id ? '#818cf8' : '#64748b'}
            />
            <Text className={`ml-2 text-sm font-bold ${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View className="flex-1" />
        <View className="justify-center">
          <Text className="text-slate-600 text-xs font-bold">{total} sonuç</Text>
        </View>
      </View>

      {/* Content List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={SharedTheme.colors.primary} />
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
            <View className="items-center mt-16 px-10">
              <View className="w-20 h-20 bg-slate-900 rounded-full items-center justify-center mb-6 border border-slate-800">
                <MaterialIcons name="explore" size={32} color="#475569" />
              </View>
              <Text className="text-white text-lg font-bold mb-2">Henüz İçerik Yok</Text>
              <Text className="text-slate-500 text-center leading-5 font-medium">
                {searchQuery
                  ? `"${searchQuery}" için sonuç bulunamadı. Farklı bir arama deneyin.`
                  : 'Topluluk üretimleri burada görünecek.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
