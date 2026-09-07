import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    RefreshControl, TextInput, StyleSheet, ScrollView
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MaterialIcons } from '@expo/vector-icons';
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
    // Client-side pagination — sayfa başına gösterilecek öğe sayısı
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

    // Pagination: sadece visibleCount kadar öğe göster
    const pagedData = currentData.slice(0, visibleCount);
    const hasMore = visibleCount < currentData.length;

    const loadMore = () => setVisibleCount(prev => prev + PAGE_SIZE);

    const tabs: { id: TabType; label: string; icon: string; count: number }[] = [
        { id: 'modules', label: t('library.tabs.modules', language), icon: 'menu-book', count: modules.length },
        { id: 'collections', label: t('library.tabs.collections', language), icon: 'folder-special', count: collections.length },
        { id: 'notes', label: t('library.tabs.notes', language), icon: 'edit-note', count: notes.length },
    ];

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        // Sekme değişince sayacı sıfırla
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
            activeOpacity={0.8}
            style={styles.cardContainer}
            onPress={() => router.push(`/study/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.badgeModule}>
                    <Text style={styles.badgeModuleText}>
                        {item.type === 'MC'
                            ? t('library.types.mc', language)
                            : item.type === 'FLASHCARD'
                                ? t('library.types.flashcard', language)
                                : item.type || t('library.types.module', language)}
                    </Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </Text>
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
                    <MaterialIcons name="description" size={14} color="#3B82F6" />
                    <Text style={styles.footerInfoText}>
                        {item._count?.items || 0} {t('library.items', language)}
                    </Text>
                </View>
                <View style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>{t('study.moduleActions.study', language)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderCollectionItem = ({ item }: { item: CollectionData }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            style={styles.cardContainer}
            onPress={() => router.push(`/collections/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.badgeCollection}>
                    <Text style={styles.badgeCollectionText}>{t('library.types.collection', language)}</Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </Text>
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
                    <MaterialIcons name="layers" size={14} color="#A855F7" />
                    <Text style={styles.footerInfoText}>
                        {item._count?.items || 0} {t('library.types.module', language).toLowerCase()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderNoteItem = ({ item }: { item: NoteData }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            style={styles.cardContainer}
            onPress={() => router.push(`/notes/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.badgeNote}>
                    <Text style={styles.badgeNoteText}>{t('library.types.note', language)}</Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.updatedAt).toLocaleDateString('tr-TR')}
                </Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title || t('library.notes.untitledNote', language)}
            </Text>

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <MaterialIcons name="edit-note" size={16} color="#10B981" />
                    <Text style={styles.footerInfoText}>
                        {t('library.notes.blocks', language)}
                    </Text>
                </View>
                <View style={styles.actionButtonEmerald}>
                    <Text style={styles.actionButtonText}>{t('library.notes.open', language)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    /** Hangi sekmedeyiz ve veriler boşsa gösterilecek liste öğesi */
    const renderListItem = ({ item }: { item: ListItem }) => {
        if (activeTab === 'modules') return renderModuleItem({ item: item as ModuleData });
        if (activeTab === 'collections') return renderCollectionItem({ item: item as CollectionData });
        return renderNoteItem({ item: item as NoteData });
    };

    return (
        <Screen style={styles.screen} tabScreen>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{t('library.title', language)}</Text>
                    <Text style={styles.headerSubtitle}>{t('library.subtitle', language)}</Text>
                </View>
                {(activeTab === 'notes' || activeTab === 'collections') && (
                    <TouchableOpacity
                        style={styles.headerAddBtn}
                        onPress={() => {
                            if (activeTab === 'notes') router.push('/notes/new' as any);
                            else if (activeTab === 'collections') router.push('/collections/new' as any);
                        }}
                    >
                        <MaterialIcons name="add" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.3)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('library.searchPlaceholder', language)}
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={searchQuery}
                        onChangeText={(text) => { setSearchQuery(text); setVisibleCount(PAGE_SIZE); }}
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                            onPress={() => handleTabChange(tab.id)}
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
                            <View
                                style={[styles.tabCountBadge, { backgroundColor: activeTab === tab.id ? 'rgba(37, 99, 235, 0.3)' : 'rgba(255, 255, 255, 0.05)' }]}
                            >
                                <Text
                                    style={[styles.tabCountText, { color: activeTab === tab.id ? 'rgba(147, 197, 253, 1)' : 'rgba(255, 255, 255, 0.1)' }]}
                                >
                                    {tab.count}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content List */}
            <FlatList
                style={{ flex: 1, backgroundColor: '#050A14' }}
                data={pagedData}
                keyExtractor={(item) => item.id}
                renderItem={renderListItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
                }
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 8, paddingBottom: TAB_SCREEN_CONTENT_BOTTOM }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconWrapper}>
                            {fetchError ? (
                                <MaterialIcons name="wifi-off" size={32} color="#475569" />
                            ) : (
                                <MaterialIcons
                                    name={activeTab === 'modules' ? 'menu-book' : activeTab === 'collections' ? 'folder-special' : 'edit-note'}
                                    size={32}
                                    color="#475569"
                                />
                            )}
                        </View>
                        <Text style={styles.emptyTitle}>
                            {fetchError
                                ? 'Bağlantı Hatası'
                                : searchQuery
                                    ? t('library.empty.noResults', language)
                                    : activeTab === 'modules'
                                        ? t('library.empty.noModules', language)
                                        : activeTab === 'collections'
                                            ? t('library.empty.noCollections', language)
                                            : t('library.empty.noNotes', language)}
                        </Text>
                        <Text style={styles.emptyDesc}>
                            {fetchError
                                ? 'İçerikler yüklenemedi. Yenilemek için aşağı çekin.'
                                : searchQuery
                                    ? t('library.empty.noResults', language)
                                    : activeTab === 'modules'
                                        ? t('library.empty.noModulesDesc', language)
                                        : activeTab === 'collections'
                                            ? t('library.empty.noCollectionsDesc', language)
                                            : t('library.empty.noNotesDesc', language)}
                        </Text>

                        {/* ─── Aksiyon Butonları ─────────────────────────────── */}
                        {!searchQuery && !fetchError && (
                            <TouchableOpacity
                                style={styles.emptyActionBtn}
                                activeOpacity={0.8}
                                onPress={() => {
                                    if (activeTab === 'modules') router.push('/create' as any);
                                    else if (activeTab === 'collections') router.push('/collections/new' as any);
                                    else router.push('/notes/new' as any);
                                }}
                            >
                                <MaterialIcons
                                    name={activeTab === 'modules' ? 'auto-awesome' : 'add'}
                                    size={18}
                                    color="white"
                                />
                                <Text style={styles.emptyActionBtnText}>
                                    {activeTab === 'modules'
                                        ? 'İçerik Oluştur'
                                        : activeTab === 'collections'
                                        ? 'Koleksiyon Oluştur'
                                        : 'Not Oluştur'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {fetchError && (
                            <TouchableOpacity
                                style={[styles.emptyActionBtn, { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.3)' }]}
                                activeOpacity={0.8}
                                onPress={onRefresh}
                            >
                                <MaterialIcons name="refresh" size={18} color="#60A5FA" />
                                <Text style={[styles.emptyActionBtnText, { color: '#60A5FA' }]}>Yenile</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                ListFooterComponent={
                    hasMore ? (
                        <TouchableOpacity
                            onPress={loadMore}
                            style={styles.loadMoreBtn}
                        >
                            <MaterialIcons name="expand-more" size={20} color="#60A5FA" />
                            <Text style={styles.loadMoreText}>
                                Daha Fazla Göster ({currentData.length - visibleCount} öğe)
                            </Text>
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
        backgroundColor: '#050A14',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#F8FAFC',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    headerAddBtn: {
        backgroundColor: '#3B82F6',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: 'rgba(30,144,255,0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(9, 15, 29, 0.6)',
        marginHorizontal: 24,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 12,
    },
    tabsContainer: {
        marginBottom: 16,
        paddingLeft: 24,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(9, 15, 29, 0.6)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.15)',
    },
    tabButtonText: {
        color: '#94A3B8',
        fontWeight: '600',
        fontSize: 13,
        marginLeft: 6,
    },
    tabCountBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    tabCountText: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '700',
    },
    cardContainer: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        elevation: 4,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgeModule: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    badgeModuleText: {
        color: '#60A5FA',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    badgeCollection: {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.2)',
    },
    badgeCollectionText: {
        color: '#A855F7',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    badgeNote: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    badgeNoteText: {
        color: '#FBBF24',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateText: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    cardDescription: {
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 18,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#182234',
        paddingTop: 16,
        marginTop: 8,
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerInfoText: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 6,
        letterSpacing: 0.5,
    },
    actionButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    actionButtonEmerald: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    actionButtonText: {
        color: '#F8FAFC',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#090F1D',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#182234',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 8,
    },
    emptyDesc: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 20,
        marginBottom: 24,
    },
    emptyActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#3B82F6',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.5)',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    emptyActionBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#050A14',
    },
    loadMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginVertical: 8,
        backgroundColor: 'rgba(59, 130, 246, 0.06)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.15)',
        marginHorizontal: 24,
        marginBottom: 24,
    },
    loadMoreText: {
        color: '#60A5FA',
        fontWeight: '600',
        fontSize: 13,
        marginLeft: 6,
    },
});

