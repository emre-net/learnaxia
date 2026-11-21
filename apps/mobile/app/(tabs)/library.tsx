import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    RefreshControl, TextInput, StyleSheet, ScrollView
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { TAB_SCREEN_CONTENT_BOTTOM } from '@/constants/layout';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';
import { SolutionModal } from '@/components/create/solution-modal';

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
type ListItem = ModuleData | CollectionData | NoteData | JourneyData | SolvedQuestionData;

export default function LibraryScreen() {
    const { language } = useLanguage();
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
            setJourneys(response.data.journeys || []);
            setSolutions(response.data.solvedQuestions || []);
        } catch (error) {
            console.error('Failed to fetch library', error);
            setFetchError(true);
        } finally {
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

    const filteredModules = modules.filter(m =>
        !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCollections = collections.filter(c =>
        !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredNotes = notes.filter(n =>
        !searchQuery || (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredJourneys = journeys.filter(j =>
        !searchQuery || j.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSolutions = solutions.filter(s =>
        !searchQuery || s.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || s.solution.toLowerCase().includes(searchQuery.toLowerCase())
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

    const loadMore = () => setVisibleCount(prev => prev + PAGE_SIZE);

    const tabs: { id: TabType; label: string; count: number; icon: string }[] = [
        { id: 'modules', label: t('library.tabs.modules', language), count: modules.length, icon: 'layers-outline' },
        { id: 'collections', label: t('library.tabs.collections', language), count: collections.length, icon: 'folder-open-outline' },
        { id: 'notes', label: t('library.tabs.notes', language), count: notes.length, icon: 'document-text-outline' },
        { id: 'journeys', label: 'Rotalar', count: journeys.length, icon: 'map-outline' },
        { id: 'solutions', label: 'AI Çözümleri', count: solutions.length, icon: 'sparkles-outline' },
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
            onPress={() => router.push(`/modules/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.badgeWrapper}>
                    <Text style={styles.badgeText}>
                        {item.type === 'MC'
                            ? t('library.types.mc', language)
                            : item.type === 'FLASHCARD'
                                ? t('library.types.flashcard', language)
                                : item.type === 'TRUE_FALSE'
                                    ? t('library.types.true_false', language)
                                    : item.type === 'GAP'
                                        ? t('library.types.gap', language)
                                        : item.type || t('library.types.module', language)}
                    </Text>
                </View>
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
                    <Ionicons name="document-text-outline" size={15} color="#94A3B8" />
                    <Text style={styles.footerInfoText}>
                        {item._count?.items || 0} {t('library.items', language)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
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
                <View style={[styles.badgeWrapper, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#38BDF8' }]}>{t('library.types.collection', language)}</Text>
                </View>
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
                    <Ionicons name="folder-outline" size={15} color="#94A3B8" />
                    <Text style={styles.footerInfoText}>
                        {item._count?.items || 0} Set
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
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
                <View style={[styles.badgeWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#F59E0B' }]}>{t('library.types.note', language)}</Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title || t('library.notes.untitledNote', language)}
            </Text>

            {(() => {
                if (!item.content) return null;
                let hasDrawing = false;
                try {
                    const parsed = JSON.parse(item.content);
                    if (parsed?.drawing) hasDrawing = true;
                    if (Array.isArray(parsed)) {
                        const txt = parsed.map((b: any) => {
                            if (b.type === 'drawing') hasDrawing = true;
                            return Array.isArray(b.content) ? b.content.map((c: any) => c.text || '').join('') : '';
                        }).filter(Boolean).join(' ');
                        return (
                            <>
                                {hasDrawing && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                        <Ionicons name="create-outline" size={13} color="#F59E0B" />
                                        <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '600' }}>El Yazısı / Çizim</Text>
                                    </View>
                                )}
                                {txt ? <Text style={styles.cardDescription} numberOfLines={2}>{txt}</Text> : null}
                            </>
                        );
                    }
                    if (parsed && typeof parsed === 'object') {
                        return (
                            <>
                                {hasDrawing && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                        <Ionicons name="create-outline" size={13} color="#F59E0B" />
                                        <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '600' }}>El Yazısı / Çizim</Text>
                                    </View>
                                )}
                                {parsed.text ? <Text style={styles.cardDescription} numberOfLines={2}>{parsed.text}</Text> : null}
                            </>
                        );
                    }
                } catch { }
                const clean = item.content.replace(/<[^>]*>?/gm, '').trim();
                return clean ? <Text style={styles.cardDescription} numberOfLines={2}>{clean}</Text> : null;
            })()}

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <Ionicons name="pencil-outline" size={15} color="#94A3B8" />
                    <Text style={styles.footerInfoText}>Düzenle</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </View>
        </TouchableOpacity>
    );

    const renderJourneyItem = ({ item }: { item: JourneyData }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cardContainer}
            onPress={() => router.push(`/journey/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.badgeWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                        <Text style={[styles.badgeText, { color: '#A855F7' }]}>ÖĞRENME ROTASI</Text>
                    </View>
                    {item.completedAt && (
                        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#10B981' }}>TAMAMLANDI</Text>
                        </View>
                    )}
                </View>
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
                    <Ionicons name="map-outline" size={15} color="#A855F7" />
                    <Text style={styles.footerInfoText}>
                        {item._count?.slides || 0} Adım
                    </Text>
                </View>
                <Ionicons name="play-circle-outline" size={18} color="#A855F7" />
            </View>
        </TouchableOpacity>
    );

    const renderSolutionItem = ({ item }: { item: SolvedQuestionData }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cardContainer}
            onPress={() => {
                setSelectedSolution(item);
                setSolutionModalVisible(true);
            }}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.badgeWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <Ionicons name="sparkles" size={10} color="#818CF8" style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: '#818CF8' }]}>AI ÇÖZÜMÜ</Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
                {item.questionText || 'Fotoğrafla Çözülen Soru'}
            </Text>

            <Text style={styles.cardDescription} numberOfLines={2}>
                {item.solution}
            </Text>

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <Ionicons name="eye-outline" size={15} color="#818CF8" />
                    <Text style={[styles.footerInfoText, { color: '#818CF8' }]}>Çözümü Gör</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
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

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#71717A" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Kütüphanende ara..."
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

            {/* Tab Bar - Fluid Horizontal Scrollable Pill Track (No Text Truncation) */}
            <View style={styles.tabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScrollContent}
                >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                                onPress={() => handleTabChange(tab.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={tab.icon as any}
                                    size={14}
                                    color={isActive ? '#09090B' : '#A1A1AA'}
                                />
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
                                color="#818CF8"
                            />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {searchQuery ? 'Sonuç Bulunamadı' : 'Burada henüz bir içerik yok'}
                        </Text>
                        <Text style={styles.emptyDesc}>
                            {searchQuery
                                ? `"${searchQuery}" ile eşleşen içerik bulunamadı.`
                                : activeTab === 'modules'
                                ? 'Kendi modülünüzü oluşturun veya Keşfet sekmesinden yeni setler keşfedin.'
                                : activeTab === 'collections'
                                ? 'Modüllerinizi düzenli tutmak için yeni bir koleksiyon başlatın.'
                                : activeTab === 'notes'
                                ? 'Hızlı notlar alarak öğrenme sürecinizi hızlandırın.'
                                : activeTab === 'journeys'
                                ? 'Yapay zeka ile adım adım interaktif bir öğrenme rotası oluşturun.'
                                : 'Kameradan veya galeriden bir soru çözdürdüğünüzde burada arşivlenecektir.'}
                        </Text>
                        {!searchQuery && !fetchError && (
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
                            <Text style={styles.loadMoreText}>Daha Fazla Göster</Text>
                        </TouchableOpacity>
                    ) : null
                }
                onEndReached={hasMore ? loadMore : undefined}
                onEndReachedThreshold={0.3}
            />

            {/* AI Çözüm Detay Modalı */}
            <SolutionModal
                visible={solutionModalVisible}
                result={selectedSolution ? { questionText: selectedSolution.questionText, solution: selectedSolution.solution } : null}
                onClose={() => {
                    setSolutionModalVisible(false);
                    setSelectedSolution(null);
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121215',
        marginHorizontal: 20,
        marginBottom: 14,
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
        marginBottom: 14,
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
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
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
