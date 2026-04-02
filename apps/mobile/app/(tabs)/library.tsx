import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    RefreshControl, TextInput,
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme as SharedTheme, t } from '@learnaxia/shared';
import api from '../../lib/api';

const currentLang = 'tr'; // Default to Turkish for now

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
        { id: 'modules', label: t('library.tabs.modules', currentLang), icon: 'menu-book', count: modules.length },
        { id: 'collections', label: t('library.tabs.collections', currentLang), icon: 'folder-special', count: collections.length },
        { id: 'notes', label: t('library.tabs.notes', currentLang), icon: 'edit-note', count: notes.length },
    ];

    if (loading) {
        return (
            <Screen className="bg-ocean-bg justify-center items-center">
                <BrandLoader size="lg" />
            </Screen>
        );
    }

    const renderModuleItem = ({ item }: { item: ModuleData }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            className="bg-ocean-panel rounded-3xl p-6 mb-4 border border-ocean-border"
            style={{ 
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8
            }}
            onPress={() => router.push(`/study/${item.id}`)}
        >
            <View className="flex-row items-center justify-between mb-3">
                <View 
                    className="px-3 py-1 rounded-lg border"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
                >
                    <Text className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        {item.type === 'MC' ? t('library.types.mc', currentLang) : item.type === 'FLASHCARD' ? t('library.types.flashcard', currentLang) : item.type || t('library.types.module', currentLang)}
                    </Text>
                </View>
                <Text style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-[10px] font-bold">
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </Text>
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
                    <IconSymbol name="doc.text.fill" size={14} color="#3B82F6" />
                    <Text style={{ color: 'rgba(255, 255, 255, 0.3)' }} className="text-xs ml-2 font-bold uppercase tracking-tighter">
                        {item._count?.items || 0} {t('library.items', currentLang)}
                    </Text>
                </View>
                <View className="bg-blue-600 px-5 py-2 rounded-full">
                    <Text className="text-white text-xs font-bold">{t('study.moduleActions.study', currentLang)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderCollectionItem = ({ item }: { item: CollectionData }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            className="bg-ocean-panel rounded-3xl p-6 mb-4 border border-ocean-border"
            style={{ 
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8
            }}
            onPress={() => router.push(`/collections/${item.id}` as any)}
        >
            <View className="flex-row items-center justify-between mb-3">
                <View 
                    className="px-3 py-1 rounded-lg border"
                    style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.2)' }}
                >
                    <Text className="text-purple-400 text-[10px] font-bold uppercase tracking-wider">{t('library.types.collection', currentLang)}</Text>
                </View>
                <Text style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-[10px] font-bold">
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </Text>
            </View>

            <Text className="text-xl font-bold text-white mb-2 tracking-tight" numberOfLines={2}>
                {item.title}
            </Text>

            {item.description && (
                <Text className="text-white/40 text-sm mb-4 leading-5" numberOfLines={2}>
                    {item.description}
                </Text>
            )}

            <View 
                className="flex-row items-center pt-4 border-t"
                style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
            >
                <MaterialIcons name="layers" size={14} color="#A855F7" />
                <Text style={{ color: 'rgba(255, 255, 255, 0.3)' }} className="text-xs ml-2 font-bold uppercase tracking-tighter">
                    {item._count?.items || 0} {t('library.types.module', currentLang).toLowerCase()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderNoteItem = ({ item }: { item: NoteData }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            className="bg-ocean-panel rounded-3xl p-6 mb-4 border border-ocean-border"
            style={{ 
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8
            }}
            onPress={() => router.push(`/notes/${item.id}`)}
        >
            <View className="flex-row items-center justify-between mb-3">
                <View 
                    className="px-3 py-1 rounded-lg border"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                >
                    <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">{t('library.types.note', currentLang)}</Text>
                </View>
                <Text style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-[10px] font-bold">
                    {new Date(item.updatedAt).toLocaleDateString('tr-TR')}
                </Text>
            </View>

            <Text className="text-xl font-bold text-white mb-2 tracking-tight" numberOfLines={2}>
                {item.title || "İsimsiz Not"}
            </Text>

            <View 
                className="flex-row items-center justify-between mt-auto pt-4 border-t"
                style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
            >
                <View className="flex-row items-center">
                    <MaterialIcons name="edit-note" size={16} color="#10B981" />
                    <Text style={{ color: 'rgba(255, 255, 255, 0.3)' }} className="text-xs ml-1.5 font-bold uppercase tracking-tighter">
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
        <Screen className="bg-ocean-bg" tabScreen>
            {/* Header */}
            <View className="px-6 pt-10 pb-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-3xl font-bold text-white mb-1 tracking-tight">{t('library.title', currentLang)}</Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="font-medium">{t('library.subtitle', currentLang)}</Text>
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
                <View className="flex-row items-center bg-ocean-panel rounded-2xl border border-ocean-border px-4 py-3">
                    <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.3)" />
                        <TextInput
                            className="flex-1 text-white ml-3 text-base"
                            placeholder={t('library.searchPlaceholder', currentLang)}
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
            <View className="flex-row px-6 mb-4">
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
                        <View 
                            className="ml-2 px-1.5 py-0.5 rounded-md"
                            style={{ backgroundColor: activeTab === tab.id ? 'rgba(37, 99, 235, 0.3)' : 'rgba(255, 255, 255, 0.05)' }}
                        >
                            <Text 
                                className="text-[10px] font-bold"
                                style={{ color: activeTab === tab.id ? 'rgba(147, 197, 253, 1)' : 'rgba(255, 255, 255, 0.1)' }}
                            >
                                {tab.count}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content List */}
            <FlatList
                data={currentData as any[]}
                keyExtractor={(item) => item.id}
                renderItem={activeTab === 'modules' 
                    ? (renderModuleItem as any) 
                    : activeTab === 'collections' 
                        ? (renderCollectionItem as any) 
                        : (renderNoteItem as any)
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SharedTheme.colors.primary} />
                }
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, paddingBottom: TAB_SCREEN_CONTENT_BOTTOM }}
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
                            {searchQuery ? t('library.empty.noResults', currentLang) : activeTab === 'modules' ? t('library.empty.noModules', currentLang) : activeTab === 'collections' ? t('library.empty.noCollections', currentLang) : t('library.empty.noNotes', currentLang)}
                        </Text>
                        <Text className="text-slate-500 text-center leading-5 font-medium">
                            {searchQuery
                                ? t('library.empty.noResults', currentLang) // Simplified for now since we don't have query-based desc in dict
                                : activeTab === 'modules'
                                    ? t('library.empty.noModulesDesc', currentLang)
                                    : activeTab === 'collections'
                                        ? t('library.empty.noCollectionsDesc', currentLang)
                                        : t('library.empty.noNotesDesc', currentLang)}
                        </Text>
                    </View>
                }
            />
        </Screen>
    );
}
