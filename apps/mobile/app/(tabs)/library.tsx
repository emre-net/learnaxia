import React, { useEffect, useState, useCallback } from 'react';
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
import api from '@/lib/api';

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
type ListItem = ModuleData | CollectionData | NoteData;

export default function LibraryScreen() {
    const { language } = useLanguage();
    const [modules, setModules] = useState<ModuleData[]>([]);
    const [collections, setCollections] = useState<CollectionData[]>([]);
    const [notes, setNotes] = useState<NoteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('modules');
    const [searchQuery, setSearchQuery] = useState('');
    const [fetchError, setFetchError] = useState(false);
    const router = useRouter();
    const PAGE_SIZE = 12;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const fetchLibrary = useCallback(async () => {
        setFetchError(false);
        try {
            const response = await api.get('/mobile/library');
            setModules(response.data.modules || []);
            setCollections(response.data.collections || []);
            setNotes(response.data.notes || []);
        } catch (error) {
            console.error('Failed to fetch library', error);
            setFetchError(true);
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

    const currentData: ListItem[] =
        activeTab === 'modules'
            ? filteredModules
            : activeTab === 'collections'
                ? filteredCollections
                : filteredNotes;

    const pagedData = currentData.slice(0, visibleCount);
    const hasMore = visibleCount < currentData.length;

    const loadMore = () => setVisibleCount(prev => prev + PAGE_SIZE);

    const tabs: { id: TabType; label: string; count: number }[] = [
        { id: 'modules', label: t('library.tabs.modules', language), count: modules.length },
        { id: 'collections', label: t('library.tabs.collections', language), count: collections.length },
        { id: 'notes', label: t('library.tabs.notes', language), count: notes.length },
    ];

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setVisibleCount(PAGE_SIZE);
    };

    if (loading) {
        return (
            <Screen style={styles.loadingContainer}>
                <BrandLoader size="lg" />
            </Screen>
        );
    }

    const renderModuleItem = ({ item }: { item: ModuleData }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cardContainer}
            onPress={() => router.push(`/study/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.badgeText}>
                    {item.type === 'MC'
                        ? t('library.types.mc', language)
                        : item.type === 'FLASHCARD'
                            ? t('library.types.flashcard', language)
                            : item.type || t('library.types.module', language)}
                </Text>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            {item.description && (
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <Ionicons name="document-text-outline" size={16} color="#64748B" />
                    <Text style={styles.footerInfoText}>
                        {item._count?.items || 0} {t('library.items', language)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#475569" />
            </View>
        </TouchableOpacity>
    );

    const renderCollectionItem = ({ item }: { item: CollectionData }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cardContainer}
            onPress={() => router.push(`/collections/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.badgeText}>{t('library.types.collection', language)}</Text>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            {item.description && (
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <Ionicons name="folder-outline" size={16} color="#64748B" />
                    <Text style={styles.footerInfoText}>
                        {item._count?.items || 0} Set
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#475569" />
            </View>
        </TouchableOpacity>
    );

    const renderNoteItem = ({ item }: { item: NoteData }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cardContainer}
            onPress={() => router.push(`/notes/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.badgeText}>{t('library.types.note', language)}</Text>
                <Text style={styles.dateText}>
                    {new Date(item.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title || t('library.notes.untitledNote', language)}
            </Text>

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <Ionicons name="pencil-outline" size={16} color="#64748B" />
                    <Text style={styles.footerInfoText}>Düzenle</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#475569" />
            </View>
        </TouchableOpacity>
    );

    const renderListItem = ({ item }: { item: ListItem }) => {
        if (activeTab === 'modules') return renderModuleItem({ item: item as ModuleData });
        if (activeTab === 'collections') return renderCollectionItem({ item: item as CollectionData });
        return renderNoteItem({ item: item as NoteData });
    };

    return (
        <Screen style={styles.screen} tabScreen>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('library.title', language)}</Text>
                {(activeTab === 'notes' || activeTab === 'collections') && (
                    <TouchableOpacity
                        style={styles.headerAddBtn}
                        onPress={() => {
                            if (activeTab === 'notes') router.push('/notes/new' as any);
                            else if (activeTab === 'collections') router.push('/collections/new' as any);
                        }}
                    >
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#475569" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Ara..."
                    placeholderTextColor="#475569"
                    value={searchQuery}
                    onChangeText={(text) => { setSearchQuery(text); setVisibleCount(PAGE_SIZE); }}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#475569" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Tab Bar - Minimal Pill */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                                onPress={() => handleTabChange(tab.id)}
                            >
                                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                                    {tab.label}
                                </Text>
                                <View style={[styles.tabCountBadge, isActive && styles.tabCountBadgeActive]}>
                                    <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                                        {tab.count}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <FlatList
                style={styles.list}
                data={pagedData}
                keyExtractor={(item) => item.id}
                renderItem={renderListItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#334155" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>Burada henüz bir şey yok.</Text>
                        <Text style={styles.emptyDesc}>Öğrenmeye başlamak için yeni içerikler oluşturun.</Text>
                        {!searchQuery && !fetchError && (
                            <TouchableOpacity
                                style={styles.emptyActionBtn}
                                onPress={() => {
                                    if (activeTab === 'modules') router.push('/create' as any);
                                    else if (activeTab === 'collections') router.push('/collections/new' as any);
                                    else router.push('/notes/new' as any);
                                }}
                            >
                                <Ionicons name="add" size={18} color="#000000" />
                                <Text style={styles.emptyActionBtnText}>Oluştur</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                ListFooterComponent={
                    hasMore ? (
                        <TouchableOpacity onPress={loadMore} style={styles.loadMoreBtn}>
                            <Text style={styles.loadMoreText}>Daha Fazla Göster</Text>
                        </TouchableOpacity>
                    ) : null
                }
                onEndReached={hasMore ? loadMore : undefined}
                onEndReachedThreshold={0.3}
            />
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#F8FAFC',
        letterSpacing: -0.5,
    },
    headerAddBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
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
    searchInput: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 10,
    },
    tabsContainer: {
        marginBottom: 24,
        paddingHorizontal: 24,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
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
    tabCountBadge: {
        backgroundColor: '#111111',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    tabCountBadgeActive: {
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    tabCountText: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '700',
    },
    tabCountTextActive: {
        color: '#000000',
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgeText: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    dateText: {
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#111111',
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerInfoText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 6,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
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
        marginBottom: 24,
        lineHeight: 20,
    },
    emptyActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 99,
        backgroundColor: '#F8FAFC',
        gap: 8,
    },
    emptyActionBtnText: {
        color: '#000000',
        fontSize: 14,
        fontWeight: '600',
    },
    loadMoreBtn: {
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#111111',
        borderRadius: 16,
    },
    loadMoreText: {
        color: '#64748B',
        fontWeight: '500',
        fontSize: 13,
    },
});
