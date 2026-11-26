import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    RefreshControl, StyleSheet, Alert, Modal, ActivityIndicator, Image
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { t, resolveTrueFalseAnswer, extractApiErrorMessage } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import { NativeRichText } from '@/components/ui/rich-math-text';

type ModuleItem = {
    id: string;
    order: number;
    type?: string;
    content: {
        question?: string;
        answer?: string | boolean;
        front?: string;
        back?: string;
        statement?: string;
        isTrue?: boolean;
        options?: string[];
        correctAnswer?: string | number;
        text?: string;
        answers?: string[];
        explanation?: string;
        image?: string;
        imageUrl?: string;
    };
};

type ModuleDetail = {
    id: string;
    title: string;
    description: string | null;
    type: string;
    category?: string | null;
    subCategory?: string | null;
    visibility: string;
    isForkable?: boolean;
    ownerId: string;
    createdAt: string;
    owner: {
        id: string;
        handle?: string | null;
        name?: string | null;
        image?: string | null;
    };
    items: ModuleItem[];
    isInLibrary?: boolean;
};

type UserCollection = {
    id: string;
    title: string;
    _count?: { items: number };
};

export default function ModuleDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { language } = useLanguage();

    const [module, setModule] = useState<ModuleDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
    const [collectionModalVisible, setCollectionModalVisible] = useState(false);
    const [collections, setCollections] = useState<UserCollection[]>([]);
    const [loadingCollections, setLoadingCollections] = useState(false);

    const fetchModule = useCallback(async () => {
        if (!id) return;
        setFetchError(false);
        try {
            const response = await api.get(`/modules/${id}`);
            setModule(response.data);
        } catch (error) {
            if (__DEV__) console.error('[ModuleDetail] Error fetching module:', error);
            setFetchError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchModule();
    }, [fetchModule]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchModule();
    }, [fetchModule]);

    const isOwner = Boolean(user?.id && module?.ownerId && user.id === module.ownerId);

    const toggleReveal = (itemId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRevealedIds((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const handleToggleSave = async () => {
        if (!module || isOwner) return;
        setActionLoading(true);
        try {
            if (module.isInLibrary) {
                await api.delete(`/modules/${module.id}/save`);
            } else {
                await api.post(`/modules/${module.id}/save`);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setModule((prev) => (prev ? { ...prev, isInLibrary: !prev.isInLibrary } : prev));
        } catch (err) {
            Alert.alert('Hata', extractApiErrorMessage(err, 'Kitaplık durumu güncellenemedi.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleForkModule = async () => {
        if (!module || isOwner) return;
        setActionLoading(true);
        try {
            const res = await api.post(`/modules/${module.id}/fork`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (res.data?.id) {
                Alert.alert('Kopyalandı', 'Modülün kopyası senin hesabında oluşturuldu.');
                router.replace(`/modules/${res.data.id}` as any);
            }
        } catch (err) {
            Alert.alert('Hata', extractApiErrorMessage(err, 'Modül kopyalanamadı.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenCollectionModal = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCollectionModalVisible(true);
        setLoadingCollections(true);
        try {
            const res = await api.get('/mobile/library');
            setCollections(res.data?.collections || []);
        } catch {
            setCollections([]);
        } finally {
            setLoadingCollections(false);
        }
    };

    const handleAddToCollection = async (collectionId: string) => {
        if (!module) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActionLoading(true);
        try {
            const colRes = await api.get(`/mobile/collections/${collectionId}`);
            const currentModuleIds: string[] = colRes.data?.modules?.map((m: any) => m.id) || [];
            if (!currentModuleIds.includes(module.id)) {
                await api.patch(`/mobile/collections/${collectionId}`, {
                    moduleIds: [...currentModuleIds, module.id],
                });
            }
            setCollectionModalVisible(false);
            Alert.alert('Başarılı', 'Modül koleksiyona eklendi!');
        } catch (err) {
            Alert.alert('Hata', extractApiErrorMessage(err, 'Modül koleksiyona eklenemedi.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteModule = () => {
        if (!isOwner) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
            'Modülü Sil',
            'Bu modülü kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await api.delete(`/modules/${id}`);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.back();
                        } catch {
                            Alert.alert('Hata', 'Modül silinirken bir hata oluştu.');
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const getTypeLabel = (type?: string) => {
        switch (type?.toUpperCase()) {
            case 'MC': return t('library.types.mc', language);
            case 'FLASHCARD': return t('library.types.flashcard', language);
            case 'TRUE_FALSE': return t('library.types.true_false', language);
            case 'GAP': return t('library.types.gap', language);
            default: return t('library.types.module', language);
        }
    };

    if (loading) {
        return (
            <Screen style={styles.centerContainer}>
                <BrandLoader size="lg" label="Modül yükleniyor..." />
            </Screen>
        );
    }

    if (fetchError || !module) {
        return (
            <Screen style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={54} color="#EF4444" style={{ marginBottom: 14 }} />
                <Text style={styles.errorTitle}>Modül Bulunamadı</Text>
                <Text style={styles.errorDesc}>Bu içerik silinmiş, çevrimdışı veya erişim yetkiniz olmayabilir.</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {fetchError && (
                        <TouchableOpacity style={[styles.retryBtn, { borderColor: '#38BDF8' }]} onPress={onRefresh}>
                            <Text style={[styles.retryBtnText, { color: '#38BDF8' }]}>Tekrar Dene</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
                        <Text style={styles.retryBtnText}>Geri Dön</Text>
                    </TouchableOpacity>
                </View>
            </Screen>
        );
    }

    const renderCardItem = ({ item, index }: { item: ModuleItem; index: number }) => {
        const isRevealed = revealedIds.has(item.id);
        const c = item.content || {};
        const question = c.question || c.front || c.statement || c.text || 'İçerik belirtilmemiş';
        const img = c.image || c.imageUrl || '';
        const hasValidImage = img.startsWith('data:') || img.startsWith('http');

        let answer = '';
        if (module.type === 'TRUE_FALSE') {
            answer = resolveTrueFalseAnswer(c) ? 'Doğru' : 'Yanlış';
        } else if (module.type === 'MC') {
            answer = String(c.answer ?? c.correctAnswer ?? '');
        } else if (module.type === 'GAP') {
            answer = Array.isArray(c.answers) ? c.answers.join(', ') : String(c.answer ?? '');
        } else {
            answer = String(c.back ?? c.answer ?? '');
        }

        return (
            <TouchableOpacity activeOpacity={0.85} onPress={() => toggleReveal(item.id)} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardBadge}>
                        <Text style={styles.cardNumber}>#{index + 1}</Text>
                    </View>
                    <View style={styles.revealHintRow}>
                        <Text style={styles.revealHintText}>{isRevealed ? 'Cevabı gizle' : 'Cevabı göster'}</Text>
                        <Ionicons name={isRevealed ? 'eye-off-outline' : 'eye-outline'} size={14} color="#71717A" />
                    </View>
                </View>

                {hasValidImage && (
                    <View style={styles.cardImageWrap}>
                        <Image source={{ uri: img }} style={styles.cardImage} resizeMode="contain" />
                    </View>
                )}

                <NativeRichText text={String(question)} compact />

                {module.type === 'MC' && Array.isArray(c.options) && c.options.length > 0 && (
                    <View style={styles.mcOptionsContainer}>
                        {c.options.map((opt, optIdx) => {
                            const isCorrectOpt = String(opt) === String(c.answer ?? c.correctAnswer);
                            return (
                                <View key={optIdx} style={[styles.mcOptionRow, isRevealed && isCorrectOpt && styles.mcOptionCorrect]}>
                                    <View style={styles.mcOptionLetter}>
                                        <Text style={styles.mcOptionLetterText}>{String.fromCharCode(65 + optIdx)}</Text>
                                    </View>
                                    <Text style={[styles.mcOptionText, isRevealed && isCorrectOpt && styles.mcOptionTextCorrect]}>
                                        {opt}
                                    </Text>
                                    {isRevealed && isCorrectOpt && <MaterialIcons name="check" size={16} color="#10B981" />}
                                </View>
                            );
                        })}
                    </View>
                )}

                {isRevealed && (
                    <View style={styles.answerBox}>
                        <View style={styles.answerHeader}>
                            <MaterialIcons name="check-circle" size={16} color="#10B981" />
                            <Text style={styles.answerLabel}>Cevap</Text>
                        </View>
                        <NativeRichText text={answer} compact />
                        {c.explanation ? (
                            <Text style={styles.explanationText}>
                                <Text style={{ fontWeight: '700', color: '#A1A1AA' }}>Açıklama: </Text>
                                {c.explanation}
                            </Text>
                        ) : null}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Screen style={styles.screen}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={20} color="#F4F4F5" />
                </TouchableOpacity>

                <View style={styles.topBarActions}>
                    <TouchableOpacity onPress={handleOpenCollectionModal} style={styles.iconButton}>
                        <MaterialIcons name="playlist-add" size={20} color="#F4F4F5" />
                    </TouchableOpacity>

                    {!isOwner && (
                        <>
                            <TouchableOpacity onPress={handleToggleSave} disabled={actionLoading} style={styles.iconButton}>
                                <Ionicons
                                    name={module.isInLibrary ? 'bookmark' : 'bookmark-outline'}
                                    size={19}
                                    color="#38BDF8"
                                />
                            </TouchableOpacity>
                            {module.isForkable !== false && (
                                <TouchableOpacity onPress={handleForkModule} disabled={actionLoading} style={styles.iconButton}>
                                    <Ionicons name="git-branch-outline" size={19} color="#F4F4F5" />
                                </TouchableOpacity>
                            )}
                        </>
                    )}

                    {isOwner && (
                        <>
                            <TouchableOpacity
                                onPress={() => router.push({ pathname: '/modules/new', params: { editId: module.id } } as any)}
                                style={styles.iconButton}
                            >
                                <Ionicons name="create-outline" size={19} color="#38BDF8" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDeleteModule} style={styles.iconButton}>
                                <Ionicons name="trash-outline" size={19} color="#EF4444" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            <FlatList
                data={module.items || []}
                keyExtractor={(item) => item.id}
                renderItem={renderCardItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#71717A" />}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.metaRow}>
                            <View style={styles.typeBadge}>
                                <Text style={styles.typeBadgeText}>{getTypeLabel(module.type)}</Text>
                            </View>
                            <View style={styles.visibilityBadge}>
                                <Ionicons
                                    name={module.visibility === 'PUBLIC' ? 'globe-outline' : 'lock-closed-outline'}
                                    size={12}
                                    color={module.visibility === 'PUBLIC' ? '#10B981' : '#71717A'}
                                />
                                <Text style={styles.visibilityText}>
                                    {module.visibility === 'PUBLIC' ? 'Herkese Açık' : 'Özel'}
                                </Text>
                            </View>
                            {module.category && (
                                <View style={styles.visibilityBadge}>
                                    <Ionicons name="pricetag-outline" size={12} color="#38BDF8" />
                                    <Text style={styles.visibilityText}>
                                        {module.category}
                                        {module.subCategory ? ` / ${module.subCategory}` : ''}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.title}>{module.title}</Text>

                        {module.description ? <Text style={styles.description}>{module.description}</Text> : null}

                        <View style={styles.infoRow}>
                            {module.owner?.handle ? (
                                <View style={styles.creatorRow}>
                                    <View style={styles.avatarCircle}>
                                        <Text style={styles.avatarText}>
                                            {module.owner.handle.slice(0, 1).toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={styles.creatorText}>@{module.owner.handle}</Text>
                                </View>
                            ) : null}

                            <View style={styles.itemCountBadge}>
                                <MaterialIcons name="style" size={14} color="#38BDF8" />
                                <Text style={styles.itemCountText}>{module.items?.length || 0} İçerik</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.primaryStudyBtn}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                router.push(`/study/${module.id}` as any);
                            }}
                        >
                            <MaterialIcons name="play-arrow" size={22} color="#09090B" />
                            <Text style={styles.primaryStudyBtnText}>Çalışmayı Başlat</Text>
                        </TouchableOpacity>

                        <View style={styles.sectionDivider}>
                            <Text style={styles.sectionTitle}>Kartlar ({module.items?.length || 0})</Text>
                            <Text style={styles.sectionSub}>Dokunarak cevabı gör</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="info-outline" size={40} color="#52525B" />
                        <Text style={styles.emptyTitle}>Henüz Kart Eklenmemiş</Text>
                        <Text style={styles.emptyDesc}>Bu modülde henüz çalışılacak kart bulunmuyor.</Text>
                    </View>
                }
            />

            <Modal
                visible={collectionModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCollectionModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Koleksiyona Ekle</Text>
                            <TouchableOpacity onPress={() => setCollectionModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        {loadingCollections ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator color="#38BDF8" />
                            </View>
                        ) : collections.length === 0 ? (
                            <View style={{ padding: 24, alignItems: 'center' }}>
                                <Text style={{ color: '#71717A', textAlign: 'center', marginBottom: 16 }}>
                                    Henüz bir koleksiyonunuz yok.
                                </Text>
                                <TouchableOpacity
                                    style={styles.createColBtn}
                                    onPress={() => {
                                        setCollectionModalVisible(false);
                                        router.push('/collections/new' as any);
                                    }}
                                >
                                    <Text style={styles.createColBtnText}>Yeni Koleksiyon Oluştur</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={collections}
                                keyExtractor={(c) => c.id}
                                style={{ maxHeight: 320 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.collectionRow}
                                        disabled={actionLoading}
                                        onPress={() => handleAddToCollection(item.id)}
                                    >
                                        <Ionicons name="folder-outline" size={20} color="#38BDF8" style={{ marginRight: 12 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.colTitle} numberOfLines={1}>{item.title}</Text>
                                            <Text style={styles.colItems}>{item._count?.items || 0} Modül</Text>
                                        </View>
                                        <Ionicons name="add-circle-outline" size={22} color="#71717A" />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#09090B' },
    centerContainer: {
        flex: 1, backgroundColor: '#09090B', alignItems: 'center',
        justifyContent: 'center', paddingHorizontal: 24,
    },
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#18181B',
    },
    iconButton: {
        width: 40, height: 40, borderRadius: 14, backgroundColor: '#121215',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27272A',
    },
    topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { paddingTop: 20, paddingBottom: 16 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 },
    typeBadge: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
    },
    typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#38BDF8' },
    visibilityBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A',
    },
    visibilityText: { fontSize: 11, color: '#A1A1AA', fontWeight: '600' },
    title: {
        fontSize: 24, fontWeight: '800', color: '#F4F4F5',
        letterSpacing: -0.4, marginBottom: 8, lineHeight: 32,
    },
    description: { fontSize: 14, color: '#A1A1AA', lineHeight: 20, marginBottom: 16 },
    infoRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1,
        borderColor: '#27272A', marginBottom: 18,
    },
    creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatarCircle: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#18181B',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27272A',
    },
    avatarText: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
    creatorText: { color: '#A1A1AA', fontSize: 13, fontWeight: '600' },
    itemCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    itemCountText: { color: '#38BDF8', fontSize: 13, fontWeight: '700' },
    primaryStudyBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#38BDF8', paddingVertical: 14, borderRadius: 14,
        gap: 8, marginBottom: 24,
    },
    primaryStudyBtnText: { color: '#09090B', fontSize: 16, fontWeight: '700' },
    sectionDivider: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F4F4F5' },
    sectionSub: { fontSize: 12, color: '#71717A' },
    cardItem: {
        backgroundColor: '#121215', borderRadius: 16, borderWidth: 1,
        borderColor: '#27272A', padding: 16, marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
    },
    cardBadge: { backgroundColor: '#18181B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    cardNumber: { fontSize: 11, fontWeight: '700', color: '#71717A' },
    revealHintRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    revealHintText: { fontSize: 11, color: '#71717A' },
    cardImageWrap: {
        height: 150, width: '100%', backgroundColor: '#18181B', borderRadius: 10,
        marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#27272A',
    },
    cardImage: { width: '100%', height: '100%' },
    mcOptionsContainer: { marginTop: 12, gap: 6 },
    mcOptionRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B',
        borderRadius: 10, borderWidth: 1, borderColor: '#27272A', paddingHorizontal: 10, paddingVertical: 9,
    },
    mcOptionCorrect: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.08)' },
    mcOptionLetter: {
        width: 22, height: 22, borderRadius: 11, backgroundColor: '#27272A',
        alignItems: 'center', justifyContent: 'center', marginRight: 8,
    },
    mcOptionLetterText: { color: '#A1A1AA', fontSize: 11, fontWeight: '700' },
    mcOptionText: { flex: 1, color: '#D4D4D8', fontSize: 13 },
    mcOptionTextCorrect: { color: '#10B981', fontWeight: '700' },
    answerBox: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#27272A' },
    answerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    answerLabel: { fontSize: 12, fontWeight: '700', color: '#10B981' },
    explanationText: { marginTop: 6, fontSize: 13, color: '#A1A1AA', lineHeight: 20 },
    emptyContainer: { paddingVertical: 48, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#A1A1AA', marginTop: 12, marginBottom: 4 },
    emptyDesc: { fontSize: 13, color: '#71717A', textAlign: 'center' },
    errorTitle: { fontSize: 20, fontWeight: '700', color: '#F4F4F5', marginBottom: 8 },
    errorDesc: { fontSize: 14, color: '#A1A1AA', textAlign: 'center', marginBottom: 24 },
    retryBtn: {
        backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A',
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
    },
    retryBtnText: { color: '#F4F4F5', fontWeight: '600' },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(9, 9, 11, 0.8)', justifyContent: 'center',
        alignItems: 'center', paddingHorizontal: 24,
    },
    modalCard: {
        width: '100%', backgroundColor: '#121215', borderRadius: 20,
        borderWidth: 1, borderColor: '#27272A', padding: 20,
    },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#F4F4F5' },
    collectionRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8,
        borderBottomWidth: 1, borderBottomColor: '#27272A',
    },
    colTitle: { fontSize: 15, fontWeight: '600', color: '#F4F4F5' },
    colItems: { fontSize: 12, color: '#71717A', marginTop: 2 },
    createColBtn: {
        backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A',
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
    },
    createColBtnText: { color: '#38BDF8', fontWeight: '700' },
});
