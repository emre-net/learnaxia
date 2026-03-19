import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    SafeAreaView, RefreshControl, Dimensions, Image
} from 'react-native';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme as SharedTheme } from '@learnaxia/shared';
import api from '@/lib/api';

const { width } = Dimensions.get('window');

type ModuleData = {
    id: string;
    title: string;
    type: string;
    _count: { items: number };
};

type CollectionDetail = {
    id: string;
    title: string;
    description: string | null;
    owner: { handle: string; image: string | null };
    modules: ModuleData[];
};

export default function CollectionDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [collection, setCollection] = useState<CollectionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCollection = useCallback(async () => {
        try {
            const response = await api.get(`/collections/${id}`);
            setCollection(response.data);
        } catch (error) {
            console.error('Failed to fetch collection details', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchCollection();
    }, [id, fetchCollection]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCollection();
    }, [fetchCollection]);

    if (loading) {
        return (
            <View className="flex-1 bg-slate-950 justify-center items-center" style={{ backgroundColor: SharedTheme.colors.background }}>
                <BrandLoader size="lg" />
            </View>
        );
    }

    if (!collection) {
        return (
            <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center" style={{ backgroundColor: SharedTheme.colors.background }}>
                <Text className="text-white text-lg font-bold">Koleksiyon bulunamadı.</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-indigo-600 px-6 py-3 rounded-xl">
                    <Text className="text-white font-bold">Geri Dön</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const renderModuleItem = ({ item }: { item: ModuleData }) => (
        <TouchableOpacity
            className="bg-slate-900 rounded-3xl p-5 mb-3 border border-slate-800 active:bg-slate-800"
            onPress={() => router.push(`/study/${item.id}`)}
        >
            <View className="flex-row items-center justify-between mb-2">
                <View className="bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
                    <Text className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        {item.type === 'MC' ? 'Test' : item.type === 'FLASHCARD' ? 'Kart' : 'Modül'}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <IconSymbol name="doc.text.fill" size={12} color={SharedTheme.colors.primary} />
                    <Text className="text-slate-500 text-[10px] font-bold ml-1 uppercase tracking-tighter">
                        {item._count?.items || 0} ITEMS
                    </Text>
                </View>
            </View>
            <Text className="text-lg font-bold text-white mb-1" numberOfLines={1}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-950" style={{ backgroundColor: SharedTheme.colors.background }}>
            {/* Custom Header */}
            <View className="px-6 pt-10 pb-4 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
                    <MaterialIcons name="arrow-back-ios" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-white tracking-tight flex-1" numberOfLines={1}>
                    {collection.title}
                </Text>
            </View>

            <FlatList
                data={collection.modules}
                keyExtractor={(item) => item.id}
                renderItem={renderModuleItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SharedTheme.colors.primary} />
                }
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
                ListHeaderComponent={
                    <View className="mb-8">
                        {collection.description && (
                            <Text className="text-slate-400 text-base leading-6 mb-6">
                                {collection.description}
                            </Text>
                        )}
                        <View className="flex-row items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                            <View className="w-10 h-10 rounded-full bg-indigo-500 items-center justify-center mr-3">
                                <Text className="text-white font-bold">{collection.owner.handle[0].toUpperCase()}</Text>
                            </View>
                            <View>
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">Sahibi</Text>
                                <Text className="text-white font-semibold">@{collection.owner.handle}</Text>
                            </View>
                            <View className="ml-auto bg-indigo-600/20 px-3 py-1 rounded-lg border border-indigo-500/30">
                                <Text className="text-indigo-400 text-xs font-bold">{collection.modules.length} Modül</Text>
                            </View>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View className="items-center mt-10">
                        <MaterialIcons name="folder-open" size={48} color="#475569" />
                        <Text className="text-slate-500 mt-4 font-medium">Bu koleksiyonda henüz modül yok.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
