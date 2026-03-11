import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, ActivityIndicator,
    SafeAreaView, RefreshControl, TextInput, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme as SharedTheme } from '@learnaxia/shared';
import api from '../../lib/api';

const { width } = Dimensions.get('window');

type ModuleData = {
    id: string;
    title: string;
    description: string | null;
    type?: string;
    owner?: { name: string; image: string | null };
    _count: { items: number };
    createdAt: string;
};

type CollectionData = {
    id: string;
    title: string;
    description: string | null;
    owner?: { name: string; image: string | null };
    _count: { items: number };
    createdAt: string;
};

type NoteData = {
    id: string;
    title: string | null;
    content: string;
    updatedAt: string;
};

type TabType = 'modules' | 'collections' | 'notes';

export default function LibraryScreen() {
    const [modules, setModules] = useState<ModuleData[]>([]);
    const [collections, setCollections] = useState<CollectionData[]>([]);
    const [notes, setNotes] = useState<NoteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('modules');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const fetchLibrary = useCallback(async () => {
        try {
            const response = await api.get('/mobile/library');
            setModules(response.data.modules || []);
            setCollections(response.data.collections || []);
            setNotes(response.data.notes || []);
        } catch (error) {
            console.error('Failed to fetch library', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLibrary();
    }, [fetchLibrary]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLibrary();
    }, [fetchLibrary]);

    const filteredModules = modules.filter(m =>
        !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCollections = collections.filter(c =>
        !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredNotes = notes.filter(n =>
        !searchQuery || (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const currentData = activeTab === 'modules' ? filteredModules : activeTab === 'collections' ? filteredCollections : filteredNotes;

    const tabs: { id: TabType; label: string; icon: string; count: number }[] = [
        { id: 'modules', label: 'Modüller', icon: 'menu-book', count: modules.length },
        { id: 'collections', label: 'Koleksiyonlar', icon: 'folder-special', count: collections.length },
        { id: 'notes', label: 'Notlar', icon: 'edit-note', count: notes.length },
    ];

    if (loading) {
        return (
            <View className="flex-1 bg-slate-950 justify-center items-center" style={{ backgroundColor: SharedTheme.colors.background }}>
                <ActivityIndicator size="large" color={SharedTheme.colors.primary} />
            </View>
        );
    }

    const renderModuleItem = ({ item }: { item: ModuleData }) => (
        <TouchableOpacity
            className="bg-slate-900 rounded-3xl p-6 mb-4 border border-slate-800 active:bg-slate-800 shadow-sm"
            onPress={() => router.push(`/study/${item.id}`)}
        >
            <View className="flex-row items-center justify-between mb-3">
                <View className="bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                    <Text className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        {item.type === 'MC' ? 'Çoktan Seçmeli' : item.type === 'FLASHCARD' ? 'Kart' : item.type || 'Module'}
                    </Text>
                </View>
                <Text className="text-slate-600 text-[10px] font-bold">
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </Text>
            </View>

            <Text className="text-xl font-bold text-white mb-2 tracking-tight" numberOfLines={2}>
                {item.title}
            </Text>

            {item.description && (
                <Text className="text-slate-500 text-sm mb-4 leading-5" numberOfLines={2}>
                    {item.description}
                </Text>
            )}

            <View className="flex-row items-center justify-between mt-auto pt-4 border-t border-slate-800/50">
                <View className="flex-row items-center">
                    <IconSymbol name="doc.text.fill" size={14} color={SharedTheme.colors.primary} />
                    <Text className="text-slate-400 text-xs ml-2 font-bold uppercase tracking-tighter">
                        {item._count?.items || 0} ITEMS
                    </Text>
                </View>
                <View className="bg-indigo-600 px-5 py-2 rounded-full">
                    <Text className="text-white text-xs font-bold">Çalış</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderCollectionItem = ({ item }: { item: CollectionData }) => (
        <TouchableOpacity
            className="bg-slate-900 rounded-3xl p-6 mb-4 border border-slate-800 active:bg-slate-800 shadow-sm"
            onPress={() => {/* TODO: Navigate to collection detail */ }}
        >
            <View className="flex-row items-center justify-between mb-3">
                <View className="bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
                    <Text className="text-purple-400 text-[10px] font-bold uppercase tracking-wider">Koleksiyon</Text>
                </View>
                <Text className="text-slate-600 text-[10px] font-bold">
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </Text>
            </View>

            <Text className="text-xl font-bold text-white mb-2 tracking-tight" numberOfLines={2}>
                {item.title}
            </Text>

            {item.description && (
                <Text className="text-slate-500 text-sm mb-4 leading-5" numberOfLines={2}>
                    {item.description}
                </Text>
            )}

            <View className="flex-row items-center pt-4 border-t border-slate-800/50">
                <MaterialIcons name="layers" size={14} color={SharedTheme.colors.brandPurple} />
                <Text className="text-slate-400 text-xs ml-2 font-bold uppercase tracking-tighter">
                    {item._count?.items || 0} modül
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderNoteItem = ({ item }: { item: NoteData }) => (
        <TouchableOpacity
            className="bg-slate-900 rounded-3xl p-6 mb-4 border border-slate-800 active:bg-slate-800 shadow-sm"
            onPress={() => router.push(`/notes/${item.id}`)}
        >
            <View className="flex-row items-center justify-between mb-3">
                <View className="bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Not</Text>
                </View>
                <Text className="text-slate-600 text-[10px] font-bold">
                    {new Date(item.updatedAt).toLocaleDateString('tr-TR')}
                </Text>
            </View>

            <Text className="text-xl font-bold text-white mb-2 tracking-tight" numberOfLines={2}>
                {item.title || "İsimsiz Not"}
            </Text>

            <View className="flex-row items-center justify-between mt-auto pt-4 border-t border-slate-800/50">
                <View className="flex-row items-center">
                    <MaterialIcons name="edit-note" size={16} color={SharedTheme.colors.brandEmerald} />
                    <Text className="text-slate-400 text-xs ml-1.5 font-bold uppercase tracking-tighter">
                        BLOKLAR
                    </Text>
                </View>
                <View className="bg-emerald-600 px-5 py-2 rounded-full">
                    <Text className="text-white text-xs font-bold w-12 text-center">Aç</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-950" style={{ backgroundColor: SharedTheme.colors.background }}>
            {/* Header */}
            <View className="px-6 pt-10 pb-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-3xl font-bold text-white mb-1 tracking-tight">Kütüphane</Text>
                    <Text className="text-slate-500 font-medium">Öğrenme modüllerin ve koleksiyonların</Text>
                </View>
                {activeTab === 'notes' && (
                    <TouchableOpacity
                        className="bg-emerald-600 w-10 h-10 rounded-full items-center justify-center"
                        onPress={() => router.push('/notes/new')}
                    >
                        <MaterialIcons name="add" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Search Bar */}
            <View className="px-6 mb-3">
                <View className="flex-row items-center bg-slate-900 rounded-2xl border border-slate-800 px-4 py-3">
                    <MaterialIcons name="search" size={20} color="#64748b" />
                    <TextInput
                        className="flex-1 text-white ml-3 text-base"
                        placeholder="Kütüphanede ara..."
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
                        className={`flex-row items-center mr-3 px-4 py-2.5 rounded-xl border ${activeTab === tab.id
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
                        <View className={`ml-2 px-1.5 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-indigo-600/30' : 'bg-slate-800'}`}>
                            <Text className={`text-[10px] font-bold ${activeTab === tab.id ? 'text-indigo-300' : 'text-slate-600'}`}>
                                {tab.count}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content List */}
            <FlatList
                data={currentData as any}
                keyExtractor={(item: any) => item.id}
                renderItem={activeTab === 'modules' ? renderModuleItem as any : activeTab === 'collections' ? renderCollectionItem as any : renderNoteItem as any}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SharedTheme.colors.primary} />
                }
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View className="items-center mt-16 px-10">
                        <View className="w-20 h-20 bg-slate-900 rounded-full items-center justify-center mb-6 border border-slate-800">
                            <MaterialIcons
                                name={activeTab === 'modules' ? 'menu-book' : activeTab === 'collections' ? 'folder-special' : 'edit-note'}
                                size={32}
                                color="#475569"
                            />
                        </View>
                        <Text className="text-white text-lg font-bold mb-2">
                            {searchQuery ? 'Sonuç Bulunamadı' : activeTab === 'modules' ? 'Modül Yok' : activeTab === 'collections' ? 'Koleksiyon Yok' : 'Not Yok'}
                        </Text>
                        <Text className="text-slate-500 text-center leading-5 font-medium">
                            {searchQuery
                                ? `"${searchQuery}" aramasına uygun ${activeTab === 'modules' ? 'modül' : activeTab === 'collections' ? 'koleksiyon' : 'not'} bulunamadı.`
                                : activeTab === 'modules'
                                    ? 'Web üzerinden yeni modüller ekleyerek kütüphaneni canlandırabilirsin.'
                                    : activeTab === 'collections'
                                        ? 'Henüz koleksiyon oluşturmadın. Web üzerinden koleksiyon oluşturabilirsin.'
                                        : 'Henüz not oluşturmadın. Sağ üstteki + butonuna basarak modern blok editörüyle dilediğini yaz!'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
