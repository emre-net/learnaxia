import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    RefreshControl, StyleSheet, Alert, Modal, ActivityIndicator
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';

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

    // Card answer preview toggle
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

    // Add to collection modal
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
            console.error('[ModuleDetail] Error fetching module:', error);
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

    const isOwner = user?.id && module?.ownerId && user.id === module.ownerId;

    const toggleReveal = (itemId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRevealedIds(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    const handleOpenCollectionModal = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCollectionModalVisible(true);
        setLoadingCollections(true);
        try {
            const res = await api.get('/mobile/library');
            setCollections(res.data?.collections || []);
        } catch (err) {
            console.error('[ModuleDetail] Failed to load collections:', err);
        } finally {
            setLoadingCollections(false);
        }
    };

    const handleAddToCollection = async (collectionId: string) => {
        if (!module) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActionLoading(true);
        try {
            // First fetch target collection's current modules
            const colRes = await api.get(`/mobile/collections/${collectionId}`);
            const currentModuleIds: string[] = colRes.data?.modules?.map((m: any) => m.id) || [];
            if (!currentModuleIds.includes(module.id)) {
                await api.patch(`/mobile/collections/${collectionId}`, {
                    moduleIds: [...currentModuleIds, module.id]
                });
            }
            setCollectionModalVisible(false);
            Alert.alert('Başarılı', 'Modül koleksiyona eklendi!');
        } catch (err) {
            console.error('[ModuleDetail] Error adding to collection:', err);
            Alert.alert('Hata', 'Modül koleksiyona eklenemedi.');
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
                        } catch (err) {
                            console.error('[ModuleDetail] Failed to delete module:', err);
                            Alert.alert('Hata', 'Modül silinirken bir hata oluştu.');
                            setActionLoading(false);
                        }
                    }
                }
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
                <Ionicons name="alert-circle-outline" size={56} color="#EF4444" style={{ marginBottom: 16 }} />
                <Text style={styles.errorTitle}>Modül Bulunamadı</Text>
                <Text style={styles.errorDesc}>Bu içerik silinmiş veya erişim yetkiniz olmayabilir.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
                    <Text style={styles.retryBtnText}>Geri Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    const renderCardItem = ({ item, index }: { item: ModuleItem; index: number }) => {
        const isRevealed = revealedIds.has(item.id);
        const c = item.content || {};

        // Question extraction
        const question = c.question || c.front || c.statement || c.text || 'İçerik belirtilmemiş';

        // Answer extraction
        let answer = '';
        if (module.type === 'TRUE_FALSE') {
            const isT = typeof c.isTrue === 'boolean' ? c.isTrue : String(c.answer).toLowerCase() === 'true';
            answer = isT ? 'DOĞRU' : 'YANLIŞ';
        } else if (module.type === 'MC') {
            answer = String(c.correctAnswer || c.answer || '');
        } else if (module.type === 'GAP') {
            answer = Array.isArray(c.answers) ? c.answers.join(', ') : String(c.answer || '');
        } else {
            answer = String(c.back || c.answer || '');
        }

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => toggleReveal(item.id)}
                style={styles.cardItem}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardBadge}>
                        <Text style={styles.cardNumber}>#{index + 1}</Text>
                    </View>
                    <View style={styles.revealHintRow}>
                        <Text style={styles.revealHintText}>
                            {isRevealed ? 'Cevabı gizle' : 'Cevabı göster'}
                        </Text>
                        <Ionicons
                            name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
                            size={14}
                            color="#64748B"
                        />
                    </View>
                </View>

                <Text style={styles.cardQuestion}>{question}</Text>

                {/* Multiple choice options preview */}
                {module.type === 'MC' && Array.isArray(c.options) && c.options.length > 0 && (
                    <View style={styles.mcOptionsContainer}>
                        {c.options.map((opt, optIdx) => {
                            const isCorrectOpt = String(opt) === String(c.correctAnswer || c.answer);
                            return (
                                <View
                                    key={optIdx}
                                    style={[
                                        styles.mcOptionRow,
                                        isRevealed && isCorrectOpt && styles.mcOptionCorrect
                                    ]}
                                >
                                    <View style={styles.mcOptionLetter}>
                                        <Text style={styles.mcOptionLetterText}>
                                            {String.fromCharCode(65 + optIdx)}
                                        </Text>
                                    </View>
                                    <Text
                                        style={[
                                            styles.mcOptionText,
                                            isRevealed && isCorrectOpt && styles.mcOptionTextCorrect
                                        ]}
                                    >
                                        {opt}
                                    </Text>
                                    {isRevealed && isCorrectOpt && (
                                        <MaterialIcons name="check" size={16} color="#10B981" />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Answer reveal box */}
                {isRevealed && (
                    <View style={styles.answerBox}>
                        <View style={styles.answerHeader}>
                            <MaterialIcons name="check-circle" size={16} color="#10B981" />
                            <Text style={styles.answerLabel}>Cevap</Text>
                        </View>
                        <Text style={styles.answerText}>{answer}</Text>
                        {c.explanation ? (
                            <Text style={styles.explanationText}>
                                <Text style={{ fontWeight: '700', color: '#94A3B8' }}>Açıklama: </Text>
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
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.iconButton}
                >
                    <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
                </TouchableOpacity>

                <View style={styles.topBarActions}>
                    <TouchableOpacity
                        onPress={handleOpenCollectionModal}
                        style={styles.iconButton}
                    >
                        <MaterialIcons name="playlist-add" size={22} color="#F8FAFC" />
                    </TouchableOpacity>

                    {isOwner && (
                        <TouchableOpacity
                            onPress={handleDeleteModule}
                            style={[styles.iconButton, { marginLeft: 8 }]}
                        >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={module.items || []}
                keyExtractor={(item) => item.id}
                renderItem={renderCardItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#334155" />
                }
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
                                    color="#64748B"
                                />
                                <Text style={styles.visibilityText}>
                                    {module.visibility === 'PUBLIC' ? 'Herkese Açık' : 'Özel'}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.title}>{module.title}</Text>

                        {module.description ? (
                            <Text style={styles.description}>{module.description}</Text>
                        ) : null}

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
                                <MaterialIcons name="style" size={14} color="#60A5FA" />
                                <Text style={styles.itemCountText}>
                                    {module.items?.length || 0} Kart
                                </Text>
                            </View>
                        </View>

                        {/* Primary Start Study CTA */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.primaryStudyBtn}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                router.push(`/study/${module.id}` as any);
                            }}
                        >
                            <MaterialIcons name="play-arrow" size={22} color="#000000" />
                            <Text style={styles.primaryStudyBtnText}>Çalışmayı Başlat</Text>
                        </TouchableOpacity>

                        <View style={styles.sectionDivider}>
                            <Text style={styles.sectionTitle}>
                                Kartlar ({module.items?.length || 0})
                            </Text>
                            <Text style={styles.sectionSub}>Dokunarak cevabı gör</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="info-outline" size={40} color="#475569" />
                        <Text style={styles.emptyTitle}>Henüz Kart Eklenmemiş</Text>
                        <Text style={styles.emptyDesc}>Bu modülde henüz çalışılacak kart bulunmuyor.</Text>
                    </View>
                }
            />

            {/* Koleksiyona Ekle Modal */}
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
                                <Ionicons name="close" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {loadingCollections ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator color="#38BDF8" />
                            </View>
                        ) : collections.length === 0 ? (
                            <View style={{ padding: 24, alignItems: 'center' }}>
                                <Text style={{ color: '#64748B', textAlign: 'center', marginBottom: 16 }}>
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
                                        <Ionicons name="add-circle-outline" size={22} color="#64748B" />
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
    screen: {
        flex: 1,
        backgroundColor: '#000000',
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#111111',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    topBarActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 16,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#1E293B',
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#38BDF8',
        textTransform: 'uppercase',
    },
    visibilityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    visibilityText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#F8FAFC',
        letterSpacing: -0.5,
        marginBottom: 8,
        lineHeight: 34,
    },
    description: {
        fontSize: 14,
        color: '#94A3B8',
        lineHeight: 22,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#111111',
        marginBottom: 20,
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatarCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '700',
    },
    creatorText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
    },
    itemCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    itemCountText: {
        color: '#60A5FA',
        fontSize: 13,
        fontWeight: '700',
    },
    primaryStudyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        marginBottom: 28,
    },
    primaryStudyBtnText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
    },
    sectionDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    sectionSub: {
        fontSize: 12,
        color: '#64748B',
    },
    cardItem: {
        backgroundColor: '#0A0A0A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
        padding: 16,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    cardBadge: {
        backgroundColor: '#111827',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    cardNumber: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
    },
    revealHintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    revealHintText: {
        fontSize: 11,
        color: '#64748B',
    },
    cardQuestion: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F8FAFC',
        lineHeight: 24,
    },
    mcOptionsContainer: {
        marginTop: 12,
        gap: 6,
    },
    mcOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#050505',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#182234',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    mcOptionCorrect: {
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    mcOptionLetter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    mcOptionLetterText: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: '700',
    },
    mcOptionText: {
        flex: 1,
        color: '#CBD5E1',
        fontSize: 13,
    },
    mcOptionTextCorrect: {
        color: '#10B981',
        fontWeight: '700',
    },
    answerBox: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#182234',
    },
    answerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    answerLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
        textTransform: 'uppercase',
    },
    answerText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#F8FAFC',
        lineHeight: 22,
    },
    explanationText: {
        marginTop: 6,
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },
    emptyContainer: {
        paddingVertical: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#94A3B8',
        marginTop: 12,
        marginBottom: 4,
    },
    emptyDesc: {
        fontSize: 13,
        color: '#475569',
        textAlign: 'center',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 8,
    },
    errorDesc: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryBtn: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryBtnText: {
        color: '#F8FAFC',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#0A0A0A',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    collectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#182234',
    },
    colTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#F8FAFC',
    },
    colItems: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    createColBtn: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createColBtnText: {
        color: '#38BDF8',
        fontWeight: '700',
    },
});

