import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    RefreshControl, TextInput, StyleSheet, ScrollView, Alert
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { t, MAIN_CATEGORIES, parseNoteContent } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { OfflineStorageService } from '@/services/offline-storage.service';
import { SolutionModal } from '@/components/create/solution-modal';

type ModuleData = {
    id: string;
    title: string;
    description: string | null;
    type?: string;
    category?: string | null;
    subCategory?: string | null;
    ownerId?: string;
    owner?: { id?: string; name: string; handle?: string; image: string | null };
    _count: { items: number };
    createdAt: string;
};

type CollectionData = {
    id: string;
    title: string;
    description: string | null;
    category?: string | null;
    ownerId?: string;
    owner?: { id?: string; name: string; handle?: string; image: string | null };
    _count: { items: number };
    createdAt: string;
};

type NoteData = {
    id: string;
    title: string | null;
    content: string;
    updatedAt: string;
};

type JourneyData = {
    id: string;
    title: string;
    description: string | null;
    depth?: string;
    completedAt?: string | null;
    _count?: { slides: number };
    createdAt: string;
};

type SolvedQuestionData = {
    id: string;
    questionText: string;
    solution: string;
    imageUrl?: string;
    createdAt: string;
    notes?: { id: string; title: string }[];
};

type TabType = 'modules' | 'collections' | 'notes' | 'journeys' | 'solutions';
type RoleFilter = 'ALL' | 'CREATED' | 'SAVED';
type TypeFilter = 'ALL' | 'FLASHCARD' | 'MC' | 'TRUE_FALSE' | 'GAP';
type ListItem = ModuleData | CollectionData | NoteData | JourneyData | SolvedQuestionData;

const VALID_TABS: TabType[] = ['modules', 'collections', 'notes', 'journeys', 'solutions'];

export default function LibraryScreen() {
    const { language } = useLanguage();
    const { user } = useAuth();
    const params = useLocalSearchParams<{ tab?: string }>();
    const [modules, setModules] = useState<ModuleData[]>([]);
    const [collections, setCollections] = useState<CollectionData[]>([]);
    const [notes, setNotes] = useState<NoteData[]>([]);
    const [journeys, setJourneys] = useState<JourneyData[]>([]);
    const [solutions, setSolutions] = useState<SolvedQuestionData[]>([]);
    const [selectedSolution, setSelectedSolution] = useState<SolvedQuestionData | null>(null);
    const [solutionModalVisible, setSolutionModalVisible] = useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('modules');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [isOfflineFallback, setIsOfflineFallback] = useState(false);
    const [syncCounts, setSyncCounts] = useState({ pending: 0, dead: 0 });
    const [retryingSync, setRetryingSync] = useState(false);
    const router = useRouter();
    const PAGE_SIZE = 12;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    useEffect(() => {
        if (params.tab && VALID_TABS.includes(params.tab as TabType)) {
            setActiveTab(params.tab as TabType);
        }
    }, [params.tab]);

    const fetchLibrary = useCallback(async () => {
        setIsOfflineFallback(false);
        try {
            const response = await api.get('/mobile/library');
            const fetchedModules: ModuleData[] = response.data.modules || [];
            const fetchedCollections: CollectionData[] = response.data.collections || [];
            const fetchedNotes: NoteData[] = response.data.notes || [];
            const fetchedJourneys: JourneyData[] = response.data.journeys || [];
            const fetchedSolutions: SolvedQuestionData[] = response.data.solvedQuestions || [];

            setModules(fetchedModules);
            setCollections(fetchedCollections);
            setNotes(fetchedNotes);
            setJourneys(fetchedJourneys);
            setSolutions(fetchedSolutions);

            // Non-blocking offline snapshot sync
            OfflineStorageService.cacheNotes(fetchedNotes).catch(() => {});
        } catch (error) {
            if (__DEV__) console.warn('[LibraryScreen] Network fallback:', error);
            const [cachedMods, cachedNotes] = await Promise.all([
                OfflineStorageService.getAllCachedModules(),
                OfflineStorageService.getCachedNotes(),
            ]);
            if (cachedMods.length > 0 || cachedNotes.length > 0) {
                setModules(cachedMods);
                setNotes(cachedNotes);
            }
            setIsOfflineFallback(true);
        } finally {
            const [pending, dead] = await Promise.all([
                OfflineStorageService.getPendingQueueCount(),
                OfflineStorageService.getDeadLetterCount(),
            ]);
            setSyncCounts({ pending, dead });
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchLibrary();
        }, [fetchLibrary])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLibrary();
    }, [fetchLibrary]);

    const q = searchQuery.trim().toLowerCase();

    const filteredModules = modules.filter((m) => {
        if (q && !m.title.toLowerCase().includes(q) && !(m.description || '').toLowerCase().includes(q)) return false;
        const ownerId = m.ownerId || m.owner?.id;
        if (roleFilter === 'CREATED' && user?.id && ownerId !== user.id) return false;
        if (roleFilter === 'SAVED' && user?.id && ownerId === user.id) return false;
        if (typeFilter !== 'ALL' && (m.type || '').toUpperCase() !== typeFilter) return false;
        if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false;
        return true;
    });

    const filteredCollections = collections.filter((c) => {
        if (q && !c.title.toLowerCase().includes(q) && !(c.description || '').toLowerCase().includes(q)) return false;
        const ownerId = c.ownerId || c.owner?.id;
        if (roleFilter === 'CREATED' && user?.id && ownerId !== user.id) return false;
        if (roleFilter === 'SAVED' && user?.id && ownerId === user.id) return false;
        if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
        return true;
    });

    const filteredNotes = notes.filter((n) => {
        if (!q) return true;
        const titleMatch = n.title?.toLowerCase().includes(q);
        const bodyMatch = parseNoteContent(n.content).plainText.toLowerCase().includes(q);
        return Boolean(titleMatch || bodyMatch);
    });

    const filteredJourneys = journeys.filter((j) =>
        !q || j.title.toLowerCase().includes(q)
    );

    const filteredSolutions = solutions.filter((s) =>
        !q || s.questionText.toLowerCase().includes(q) || s.solution.toLowerCase().includes(q)
    );

    const currentData: ListItem[] =
        activeTab === 'modules'
            ? filteredModules
            : activeTab === 'collections'
                ? filteredCollections
                : activeTab === 'notes'
                    ? filteredNotes
                    : activeTab === 'journeys'
                        ? filteredJourneys
                        : filteredSolutions;

    const pagedData = currentData.slice(0, visibleCount);
    const hasMore = visibleCount < currentData.length;
    const loadMore = () => setVisibleCount((prev) => prev + PAGE_SIZE);

    const tabs: { id: TabType; label: string; count: number; icon: any }[] = [
        { id: 'modules', label: t('library.tabs.modules', language), count: modules.length, icon: 'layers-outline' },
        { id: 'collections', label: t('library.tabs.collections', language), count: collections.length, icon: 'folder-open-outline' },
        { id: 'notes', label: t('library.tabs.notes', language), count: notes.length, icon: 'document-text-outline' },
        { id: 'journeys', label: t('library.tabs.journeys', language), count: journeys.length, icon: 'map-outline' },
        { id: 'solutions', label: t('library.tabs.aiSolutions', language), count: solutions.length, icon: 'sparkles-outline' },
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

    const getModuleTypeBadgeLabel = (type?: string) => {
        switch (type?.toUpperCase()) {
            case 'MC': return t('library.types.mc', language);
            case 'FLASHCARD': return t('library.types.flashcard', language);
            case 'TRUE_FALSE': return t('library.types.true_false', language);
            case 'GAP': return t('library.types.gap', language);
            default: return t('library.types.module', language);
        }
    };

    const renderModuleItem = ({ item }: { item: ModuleData }) => (
        <TouchableOpacity
            activeOpacity={0.75}
            style={styles.cardContainer}
            onPress={() => router.push(`/modules/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.badgeWrapper}>
                    <Text style={styles.badgeText}>{getModuleTypeBadgeLabel(item.type)}</Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                </Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

            {item.description && (
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <Ionicons name="albums-outline" size={15} color="#94A3B8" />
                    <Text style={styles.footerInfoText}>
                        {item._count?.items || 0} {t('library.items', language)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#71717A" />
            </View>
        </TouchableOpacity>
    );

    const renderCollectionItem = ({ item }: { item: CollectionData }) => (
        <TouchableOpacity
            activeOpacity={0.75}
            style={styles.cardContainer}
            onPress={() => router.push(`/collections/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.badgeWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#10B981' }]}>{t('library.types.collection', language)}</Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                </Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

            {item.description && (
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <Ionicons name="folder-open-outline" size={15} color="#94A3B8" />
                    <Text style={styles.footerInfoText}>
                        {item._count?.items || 0} {t('library.tabs.modules', language)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#71717A" />
            </View>
        </TouchableOpacity>
    );

    const renderNoteItem = ({ item }: { item: NoteData }) => {
        const parsed = parseNoteContent(item.content);
        return (
            <TouchableOpacity
                activeOpacity={0.75}
                style={styles.cardContainer}
                onPress={() => router.push(`/notes/${item.id}` as any)}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.badgeWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                        <Text style={[styles.badgeText, { color: '#F59E0B' }]}>{t('library.types.note', language)}</Text>
                    </View>
                    <Text style={styles.dateText}>
                        {new Date(item.updatedAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                    </Text>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title || t('library.notes.untitledNote', language)}
                </Text>

                {parsed.drawing && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <Ionicons name="create-outline" size={13} color="#F59E0B" />
                        <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '600' }}>
                            {language === 'tr' ? 'El Yazısı / Çizim' : 'Handwriting / Drawing'}
                        </Text>
                    </View>
                )}

                {parsed.plainText ? (
                    <Text style={styles.cardDescription} numberOfLines={2}>{parsed.plainText}</Text>
                ) : null}

                <View style={styles.cardFooter}>
                    <View style={styles.footerInfo}>
                        <Ionicons name="pencil-outline" size={15} color="#94A3B8" />
                        <Text style={styles.footerInfoText}>{t('common.edit', language)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#71717A" />
                </View>
            </TouchableOpacity>
        );
    };

    const renderJourneyItem = ({ item }: { item: JourneyData }) => (
        <TouchableOpacity
            activeOpacity={0.75}
            style={styles.cardContainer}
            onPress={() => router.push(`/journey/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.badgeWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                        <Text style={[styles.badgeText, { color: '#A855F7' }]}>{t('library.tabs.journeys', language)}</Text>
                    </View>
                    {item.completedAt && (
                        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>
                                {language === 'tr' ? 'Tamamlandı' : 'Completed'}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                </Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            {item.description && (
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <Ionicons name="map-outline" size={15} color="#A855F7" />
                    <Text style={styles.footerInfoText}>
                        {item._count?.slides || 0} {language === 'tr' ? 'Adım' : 'Steps'}
                    </Text>
                </View>
                <Ionicons name="play-circle-outline" size={18} color="#A855F7" />
            </View>
        </TouchableOpacity>
    );

    const renderSolutionItem = ({ item }: { item: SolvedQuestionData }) => (
        <TouchableOpacity
            activeOpacity={0.75}
            style={styles.cardContainer}
            onPress={() => {
                setSelectedSolution(item);
                setSolutionModalVisible(true);
            }}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.badgeWrapper, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                    <Ionicons name="sparkles" size={10} color="#38BDF8" style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: '#38BDF8' }]}>{t('library.tabs.aiSolutions', language)}</Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                </Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
                {item.questionText || (language === 'tr' ? 'Fotoğrafla Çözülen Soru' : 'Solved Photo Question')}
            </Text>

            <Text style={styles.cardDescription} numberOfLines={2}>{item.solution}</Text>

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <Ionicons name="eye-outline" size={15} color="#38BDF8" />
                    <Text style={[styles.footerInfoText, { color: '#38BDF8' }]}>
                        {language === 'tr' ? 'Çözümü Gör' : 'View Solution'}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#71717A" />
            </View>
        </TouchableOpacity>
    );

    const renderListItem = ({ item }: { item: ListItem }) => {
        if (activeTab === 'modules') return renderModuleItem({ item: item as ModuleData });
        if (activeTab === 'collections') return renderCollectionItem({ item: item as CollectionData });
        if (activeTab === 'journeys') return renderJourneyItem({ item: item as JourneyData });
        if (activeTab === 'solutions') return renderSolutionItem({ item: item as SolvedQuestionData });
        return renderNoteItem({ item: item as NoteData });
    };

    return (
        <Screen style={styles.screen} tabScreen>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('library.title', language)}</Text>
                {(activeTab === 'notes' || activeTab === 'collections' || activeTab === 'journeys' || activeTab === 'solutions') && (
                    <TouchableOpacity
                        style={styles.headerAddBtn}
                        onPress={() => {
                            if (activeTab === 'notes') router.push('/notes/new' as any);
                            else if (activeTab === 'collections') router.push('/collections/new' as any);
                            else if (activeTab === 'journeys') router.push('/journey/new' as any);
                            else router.push('/create' as any);
                        }}
                    >
                        <Ionicons name="add" size={20} color="#F4F4F5" />
                    </TouchableOpacity>
                )}
            </View>

            {isOfflineFallback && (
                <View style={styles.offlineBanner}>
                    <Ionicons name="cloud-offline-outline" size={14} color="#FBBF24" />
                    <Text style={styles.offlineBannerText}>
                        {language === 'tr'
                            ? 'Çevrimdışı mod: Yerel önbellekteki içerikler gösteriliyor.'
                            : 'Offline mode: Showing cached library items.'}
                    </Text>
                </View>
            )}

            {(syncCounts.pending > 0 || syncCounts.dead > 0) && (
                <View style={[styles.offlineBanner, { borderColor: 'rgba(56, 189, 248, 0.35)', backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                    <Ionicons name="cloud-upload-outline" size={14} color="#38BDF8" />
                    <Text style={[styles.offlineBannerText, { color: '#E4E4E7' }]}>
                        {syncCounts.dead > 0
                            ? `${syncCounts.pending} bekleyen, ${syncCounts.dead} hata almış çalışma kaydı var.`
                            : `${syncCounts.pending} çevrimdışı çalışma cevabı senkron bekliyor.`}
                    </Text>
                    <TouchableOpacity
                        disabled={retryingSync}
                        onPress={async () => {
                            setRetryingSync(true);
                            try {
                                if (syncCounts.dead > 0) {
                                    await OfflineStorageService.retryDeadLetters();
                                }
                                const res = await OfflineStorageService.processSyncQueue(api);
                                await fetchLibrary();
                                Alert.alert('Senkronizasyon', `${res.synced} kayıt sunucuya aktarıldı.`);
                            } finally {
                                setRetryingSync(false);
                            }
                        }}
                    >
                        <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: '800' }}>
                            {retryingSync ? '...' : (syncCounts.dead > 0 ? 'Yeniden Dene' : 'Şimdi Eşitle')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#71717A" />
                <TextInput
                    style={styles.searchInput}
                    placeholder={language === 'tr' ? 'Kütüphanende ara...' : 'Search in your library...'}
                    placeholderTextColor="#71717A"
                    value={searchQuery}
                    onChangeText={(text) => { setSearchQuery(text); setVisibleCount(PAGE_SIZE); }}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#71717A" />
                    </TouchableOpacity>
                )}
            </View>

            {/* 5 Entities Scrollable Pill Track */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                                onPress={() => handleTabChange(tab.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={tab.icon} size={14} color={isActive ? '#09090B' : '#A1A1AA'} />
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

            {/* Modules & Collections Role / Category / Question Type Filters */}
            {(activeTab === 'modules' || activeTab === 'collections') && (
                <View style={styles.filtersBlock}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
                        {(['ALL', 'CREATED', 'SAVED'] as RoleFilter[]).map((rf) => {
                            const active = roleFilter === rf;
                            const lbl =
                                rf === 'ALL'
                                    ? (language === 'tr' ? 'Tümü' : 'All')
                                    : rf === 'CREATED'
                                        ? t('library.tabs.created', language)
                                        : t('library.tabs.saved', language);
                            return (
                                <TouchableOpacity
                                    key={rf}
                                    style={[styles.subFilterPill, active && styles.subFilterPillActive]}
                                    onPress={() => setRoleFilter(rf)}
                                >
                                    <Text style={[styles.subFilterText, active && styles.subFilterTextActive]}>{lbl}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        {activeTab === 'modules' &&
                            (['FLASHCARD', 'MC', 'TRUE_FALSE', 'GAP'] as TypeFilter[]).map((tf) => {
                                const active = typeFilter === tf;
                                return (
                                    <TouchableOpacity
                                        key={tf}
                                        style={[styles.subFilterPill, active && styles.subFilterPillActive]}
                                        onPress={() => setTypeFilter(active ? 'ALL' : tf)}
                                    >
                                        <Text style={[styles.subFilterText, active && styles.subFilterTextActive]}>
                                            {getModuleTypeBadgeLabel(tf)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        {MAIN_CATEGORIES.map((cat) => {
                            const active = categoryFilter === cat;
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.subFilterPill, active && styles.subFilterPillActive]}
                                    onPress={() => setCategoryFilter(active ? 'ALL' : cat)}
                                >
                                    <Text style={[styles.subFilterText, active && styles.subFilterTextActive]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            <FlatList
                style={styles.list}
                data={pagedData}
                keyExtractor={(item) => item.id}
                renderItem={renderListItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#71717A" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons
                                name={
                                    activeTab === 'modules'
                                        ? 'layers-outline'
                                        : activeTab === 'collections'
                                            ? 'folder-open-outline'
                                            : activeTab === 'notes'
                                                ? 'document-text-outline'
                                                : activeTab === 'journeys'
                                                    ? 'map-outline'
                                                    : 'sparkles-outline'
                                }
                                size={32}
                                color="#38BDF8"
                            />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {searchQuery
                                ? (language === 'tr' ? 'Sonuç Bulunamadı' : 'No Results Found')
                                : (language === 'tr' ? 'Burada henüz bir içerik yok' : 'Nothing here yet')}
                        </Text>
                        <Text style={styles.emptyDesc}>
                            {searchQuery
                                ? `"${searchQuery}" için eşleşme bulunamadı.`
                                : activeTab === 'modules'
                                    ? 'Kendi modülünüzü oluşturun veya Keşfet sekmesinden yeni setler ekleyin.'
                                    : activeTab === 'collections'
                                        ? 'Modüllerinizi düzenli tutmak için yeni bir koleksiyon başlatın.'
                                        : activeTab === 'notes'
                                            ? 'Hızlı notlar alarak öğrenme sürecinizi hızlandırın.'
                                            : activeTab === 'journeys'
                                                ? 'Yapay zeka ile adım adım interaktif bir öğrenme rotası oluşturun.'
                                                : 'Kameradan veya galeriden bir soru çözdürdüğünüzde burada arşivlenecektir.'}
                        </Text>
                        {!searchQuery && !isOfflineFallback && (
                            <TouchableOpacity
                                style={styles.emptyActionBtn}
                                onPress={() => {
                                    if (activeTab === 'modules') router.push('/create' as any);
                                    else if (activeTab === 'collections') router.push('/collections/new' as any);
                                    else if (activeTab === 'notes') router.push('/notes/new' as any);
                                    else if (activeTab === 'journeys') router.push('/journey/new' as any);
                                    else router.push('/create' as any);
                                }}
                            >
                                <Ionicons name="add" size={18} color="#09090B" />
                                <Text style={styles.emptyActionBtnText}>
                                    {activeTab === 'modules'
                                        ? 'Modül Oluştur'
                                        : activeTab === 'collections'
                                            ? 'Koleksiyon Oluştur'
                                            : activeTab === 'notes'
                                                ? 'Not Yaz'
                                                : activeTab === 'journeys'
                                                    ? 'Yeni Rota Başlat'
                                                    : 'Soru Çözdür'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                ListFooterComponent={
                    hasMore ? (
                        <TouchableOpacity onPress={loadMore} style={styles.loadMoreBtn}>
                            <Text style={styles.loadMoreText}>
                                {language === 'tr' ? 'Daha Fazla Göster' : 'Load More'}
                            </Text>
                        </TouchableOpacity>
                    ) : null
                }
                onEndReached={hasMore ? loadMore : undefined}
                onEndReachedThreshold={0.3}
            />

            <SolutionModal
                visible={solutionModalVisible}
                result={selectedSolution}
                onClose={() => {
                    setSolutionModalVisible(false);
                    setSelectedSolution(null);
                }}
                onDeleted={(deletedId) => {
                    setSolutions((prev) => prev.filter((s) => s.id !== deletedId));
                    setSolutionModalVisible(false);
                    setSelectedSolution(null);
                }}
                onNoteSaved={() => {
                    fetchLibrary();
                }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#09090B',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09090B',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#F4F4F5',
        letterSpacing: -0.5,
    },
    headerAddBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        borderWidth: 1,
        marginHorizontal: 20,
        marginBottom: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    offlineBannerText: {
        color: '#FBBF24',
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121215',
        marginHorizontal: 20,
        marginBottom: 12,
        paddingHorizontal: 14,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    searchInput: {
        flex: 1,
        color: '#F4F4F5',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 10,
    },
    tabsContainer: {
        marginBottom: 10,
    },
    filtersBlock: {
        marginBottom: 12,
    },
    tabsScrollContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#27272A',
        backgroundColor: '#121215',
        gap: 7,
    },
    tabButtonActive: {
        backgroundColor: '#F4F4F5',
        borderColor: '#F4F4F5',
    },
    tabButtonText: {
        color: '#A1A1AA',
        fontWeight: '600',
        fontSize: 13,
    },
    tabButtonTextActive: {
        color: '#09090B',
    },
    tabCountBadge: {
        backgroundColor: '#18181B',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
    },
    tabCountBadgeActive: {
        backgroundColor: '#E4E4E7',
    },
    tabCountText: {
        color: '#71717A',
        fontSize: 11,
        fontWeight: '700',
    },
    tabCountTextActive: {
        color: '#09090B',
    },
    subFilterPill: {
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    subFilterPillActive: {
        backgroundColor: 'rgba(56, 189, 248, 0.14)',
        borderColor: '#38BDF8',
    },
    subFilterText: {
        color: '#A1A1AA',
        fontSize: 12,
        fontWeight: '600',
    },
    subFilterTextActive: {
        color: '#38BDF8',
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: TAB_SCREEN_CONTENT_BOTTOM,
        gap: 12,
    },
    cardContainer: {
        backgroundColor: '#121215',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    badgeWrapper: {
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    badgeText: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '700',
    },
    dateText: {
        color: '#71717A',
        fontSize: 11,
        fontWeight: '500',
    },
    cardTitle: {
        color: '#F4F4F5',
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 22,
        marginBottom: 6,
    },
    cardDescription: {
        color: '#A1A1AA',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#18181B',
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerInfoText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        color: '#F4F4F5',
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyDesc: {
        color: '#71717A',
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 20,
    },
    emptyActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F4F4F5',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
    },
    emptyActionBtnText: {
        color: '#09090B',
        fontSize: 13,
        fontWeight: '700',
    },
    loadMoreBtn: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadMoreText: {
        color: '#38BDF8',
        fontSize: 13,
        fontWeight: '600',
    },
});
