import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    RefreshControl, StyleSheet, Alert, Modal, ActivityIndicator, TextInput
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { t, extractApiErrorMessage } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';

type ModuleData = {
    id: string;
    title: string;
    type: string;
    _count?: { items: number };
    items?: { id: string }[];
};

type CollectionDetail = {
    id: string;
    title: string;
    description: string | null;
    visibility?: 'PUBLIC' | 'PRIVATE';
    category?: string | null;
    subCategory?: string | null;
    isOwner?: boolean;
    isSaved?: boolean;
    ownerId?: string;
    owner: { id?: string; handle: string | null; name?: string | null; image: string | null };
    modules: ModuleData[];
};

export default function CollectionDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { language } = useLanguage();
    const [collection, setCollection] = useState<CollectionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    const [addModalVisible, setAddModalVisible] = useState(false);
    const [userModules, setUserModules] = useState<ModuleData[]>([]);
    const [loadingUserModules, setLoadingUserModules] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Edit metadata modal (owner)
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const fetchCollection = useCallback(async () => {
        setFetchError(false);
        try {
            const response = await api.get(`/mobile/collections/${id}`);
            setCollection(response.data);
        } catch (error) {
            if (__DEV__) console.error('[CollectionDetail] Failed to fetch collection:', error);
            setFetchError(true);
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

    const isOwner = Boolean(
        collection &&
        (collection.isOwner ?? (user?.id && (collection.ownerId === user.id || collection.owner?.id === user.id)))
    );

    const handleOpenAddModal = async () => {
        if (!isOwner) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAddModalVisible(true);
        setLoadingUserModules(true);
        try {
            const res = await api.get('/mobile/library?type=MODULE');
            const allModules: ModuleData[] = Array.isArray(res.data?.modules)
                ? res.data.modules
                : Array.isArray(res.data?.items)
                    ? res.data.items
                    : Array.isArray(res.data)
                        ? res.data
                        : [];
            const existingIds = new Set((collection?.modules || []).map((m) => m.id));
            setUserModules(allModules.filter((m) => !existingIds.has(m.id)));
        } catch {
            setUserModules([]);
        } finally {
            setLoadingUserModules(false);
        }
    };

    const handleAddModuleToCollection = async (moduleId: string) => {
        if (!collection || !isOwner) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActionLoading(true);
        try {
            const currentModuleIds = (collection.modules || []).map((m) => m.id);
            await api.patch(`/mobile/collections/${collection.id}`, {
                moduleIds: [...currentModuleIds, moduleId],
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setAddModalVisible(false);
            fetchCollection();
        } catch (err) {
            Alert.alert('Hata', extractApiErrorMessage(err, 'Modül koleksiyona eklenirken bir hata oluştu.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveModule = (moduleId: string, moduleTitle: string) => {
        if (!collection || !isOwner) return;
        Alert.alert(
            'Modülü Çıkar',
            `"${moduleTitle}" modülünü bu koleksiyondan çıkarmak istediğinize emin misiniz?`,
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Çıkar',
                    style: 'destructive',
                    onPress: async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        try {
                            const updatedModuleIds = collection.modules
                                .map((m) => m.id)
                                .filter((mId) => mId !== moduleId);

                            await api.patch(`/mobile/collections/${collection.id}`, {
                                moduleIds: updatedModuleIds,
                            });

                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            fetchCollection();
                        } catch {
                            Alert.alert('Hata', 'Modül çıkarılamadı.');
                        }
                    },
                },
            ]
        );
    };

    const handleSaveMetadata = async () => {
        if (!collection || !isOwner || editTitle.trim().length < 3) {
            Alert.alert('Hata', 'Koleksiyon adı en az 3 karakter olmalıdır.');
            return;
        }
        setActionLoading(true);
        try {
            await api.patch(`/mobile/collections/${collection.id}`, {
                title: editTitle.trim(),
                description: editDescription.trim(),
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setEditModalVisible(false);
            fetchCollection();
        } catch (err) {
            Alert.alert('Hata', extractApiErrorMessage(err, 'Koleksiyon güncellenemedi.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleSaveCollection = async () => {
        if (!collection || isOwner) return;
        setActionLoading(true);
        try {
            await api.post(`/collections/${collection.id}/save`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCollection((prev) => (prev ? { ...prev, isSaved: !prev.isSaved } : prev));
        } catch (err) {
            Alert.alert('Hata', extractApiErrorMessage(err, 'Koleksiyon kütüphaneye kaydedilemedi.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCollection = () => {
        if (!collection || !isOwner) return;
        Alert.alert(
            'Koleksiyonu Sil',
            `"${collection.title}" koleksiyonunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Koleksiyonu Sil',
                    style: 'destructive',
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        try {
                            await api.delete(`/mobile/collections/${collection.id}`);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.back();
                        } catch {
                            Alert.alert('Hata', 'Koleksiyon silinirken bir hata oluştu.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <Screen style={styles.centered}>
                <BrandLoader size="lg" />
            </Screen>
        );
    }

    if (fetchError || !collection) {
        return (
            <Screen style={styles.centered}>
                <View style={styles.errorIconWrapper}>
                    <MaterialIcons name={fetchError ? 'wifi-off' : 'folder-open'} size={40} color="#71717A" />
                </View>
                <Text style={styles.errorTitle}>
                    {fetchError ? 'Koleksiyon Yüklenemedi' : 'Koleksiyon Bulunamadı'}
                </Text>
                <Text style={styles.errorDesc}>
                    {fetchError ? 'İnternet bağlantınızı kontrol edin' : 'Bu koleksiyon artık mevcut olmayabilir'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {fetchError && (
                        <TouchableOpacity onPress={onRefresh} style={[styles.backButton, { borderColor: '#38BDF8' }]}>
                            <Ionicons name="refresh" size={18} color="#38BDF8" />
                            <Text style={[styles.backButtonText, { color: '#38BDF8' }]}>Tekrar Dene</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={18} color="#F4F4F5" />
                        <Text style={styles.backButtonText}>Geri Dön</Text>
                    </TouchableOpacity>
                </View>
            </Screen>
        );
    }

    const getModuleTypeLabel = (type: string): string => {
        switch (type) {
            case 'MC': return t('library.types.mc', language);
            case 'FLASHCARD': return t('library.types.flashcard', language);
            case 'TRUE_FALSE': return t('library.types.true_false', language);
            case 'GAP': return t('library.types.gap', language);
            default: return t('library.types.module', language);
        }
    };

    const renderModuleItem = ({ item }: { item: ModuleData }) => {
        const count = item._count?.items ?? item.items?.length ?? 0;
        return (
            <View style={styles.moduleCard}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/modules/${item.id}` as any)}
                >
                    <View style={styles.moduleCardHeader}>
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{getModuleTypeLabel(item.type)}</Text>
                        </View>
                        <View style={styles.itemsRow}>
                            <MaterialIcons name="description" size={12} color="#38BDF8" />
                            <Text style={styles.itemsText}>{count} öğe</Text>
                        </View>
                    </View>
                    <Text style={styles.moduleName} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>

                {isOwner && (
                    <TouchableOpacity
                        onPress={() => handleRemoveModule(item.id, item.title)}
                        style={styles.removeBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#71717A" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const modulesList = collection.modules || [];

    return (
        <Screen style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={22} color="#F4F4F5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{collection.title}</Text>
                <View style={styles.headerActions}>
                    {isOwner ? (
                        <>
                            <TouchableOpacity
                                onPress={() => {
                                    setEditTitle(collection.title);
                                    setEditDescription(collection.description || '');
                                    setEditModalVisible(true);
                                }}
                                style={styles.headerIconBtn}
                            >
                                <Ionicons name="create-outline" size={18} color="#38BDF8" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleOpenAddModal} style={styles.headerIconBtn}>
                                <Ionicons name="add" size={22} color="#38BDF8" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDeleteCollection} style={styles.headerIconBtn}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            onPress={handleToggleSaveCollection}
                            disabled={actionLoading}
                            style={styles.headerIconBtn}
                        >
                            <Ionicons
                                name={collection.isSaved ? 'bookmark' : 'bookmark-outline'}
                                size={18}
                                color="#38BDF8"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={modulesList}
                keyExtractor={(item) => item.id}
                renderItem={renderModuleItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#71717A" />}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, flexGrow: 1 }}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <View style={styles.badgesMetaRow}>
                            <View style={styles.metaChip}>
                                <Ionicons
                                    name={collection.visibility === 'PUBLIC' ? 'globe-outline' : 'lock-closed-outline'}
                                    size={12}
                                    color={collection.visibility === 'PUBLIC' ? '#10B981' : '#A1A1AA'}
                                />
                                <Text style={styles.metaChipText}>
                                    {collection.visibility === 'PUBLIC' ? 'Herkese Açık' : 'Özel'}
                                </Text>
                            </View>
                            {collection.category && (
                                <View style={styles.metaChip}>
                                    <Ionicons name="pricetag-outline" size={12} color="#38BDF8" />
                                    <Text style={styles.metaChipText}>
                                        {collection.category}
                                        {collection.subCategory ? ` / ${collection.subCategory}` : ''}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {collection.description && (
                            <Text style={styles.description}>{collection.description}</Text>
                        )}

                        <View style={styles.ownerCard}>
                            <View style={styles.ownerAvatar}>
                                <Text style={styles.ownerAvatarText}>
                                    {(collection.owner?.handle || collection.owner?.name || '?')[0].toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.ownerInfo}>
                                <Text style={styles.ownerLabel}>Oluşturan</Text>
                                <Text style={styles.ownerHandle}>
                                    @{collection.owner?.handle || 'learnaxia'}
                                </Text>
                            </View>
                            <View style={styles.moduleCountBadge}>
                                <Text style={styles.moduleCountText}>{modulesList.length} Modül</Text>
                            </View>
                        </View>

                        <View style={styles.actionBar}>
                            {isOwner ? (
                                <TouchableOpacity style={styles.addModuleBtn} onPress={handleOpenAddModal} activeOpacity={0.8}>
                                    <Ionicons name="add-circle" size={18} color="#38BDF8" />
                                    <Text style={styles.addModuleBtnText}>Modül Ekle</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.addModuleBtn}
                                    onPress={handleToggleSaveCollection}
                                    disabled={actionLoading}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={collection.isSaved ? 'bookmark' : 'bookmark-outline'}
                                        size={18}
                                        color="#38BDF8"
                                    />
                                    <Text style={styles.addModuleBtnText}>
                                        {collection.isSaved ? 'Kitaplıkta Kayıtlı' : 'Kitaplığa Kaydet'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {modulesList.length > 0 && (
                                <TouchableOpacity
                                    style={styles.studyAllBtn}
                                    onPress={() => router.push(`/study/${modulesList[0].id}` as any)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="play" size={16} color="#09090B" />
                                    <Text style={styles.studyAllBtnText}>Çalış</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="folder-open" size={48} color="#3F3F46" />
                        <Text style={styles.emptyText}>Bu koleksiyonda henüz modül yok.</Text>
                        {isOwner && (
                            <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAddModal} activeOpacity={0.8}>
                                <Ionicons name="add" size={18} color="#38BDF8" />
                                <Text style={styles.emptyAddBtnText}>Kitaplığından Modül Ekle</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />

            {/* Modal: Add Module From Library */}
            <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Koleksiyona Modül Ekle</Text>
                            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        {loadingUserModules ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color="#38BDF8" />
                            </View>
                        ) : userModules.length === 0 ? (
                            <View style={{ padding: 32, alignItems: 'center' }}>
                                <Text style={{ color: '#71717A', textAlign: 'center', fontSize: 14 }}>
                                    Koleksiyona eklenebilecek yeni modül bulunamadı.
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={userModules}
                                keyExtractor={(item) => item.id}
                                style={{ maxHeight: 360 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalModuleItem}
                                        onPress={() => handleAddModuleToCollection(item.id)}
                                        disabled={actionLoading}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.modalModuleTitle} numberOfLines={1}>{item.title}</Text>
                                            <Text style={styles.modalModuleSub}>{getModuleTypeLabel(item.type)}</Text>
                                        </View>
                                        <Ionicons name="add-circle-outline" size={22} color="#38BDF8" />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal: Edit Collection Metadata */}
            <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Koleksiyonu Düzenle</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.editFieldLabel}>Başlık</Text>
                        <TextInput
                            style={styles.editInput}
                            value={editTitle}
                            onChangeText={setEditTitle}
                            placeholder="Koleksiyon adı"
                            placeholderTextColor="#52525B"
                        />

                        <Text style={styles.editFieldLabel}>Açıklama</Text>
                        <TextInput
                            style={[styles.editInput, { minHeight: 80, textAlignVertical: 'top' }]}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            placeholder="Açıklama (opsiyonel)"
                            placeholderTextColor="#52525B"
                            multiline
                        />

                        <TouchableOpacity
                            style={[styles.studyAllBtn, { marginTop: 8 }]}
                            onPress={handleSaveMetadata}
                            disabled={actionLoading}
                        >
                            <Text style={styles.studyAllBtnText}>
                                {actionLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#09090B',
    },
    centered: {
        flex: 1,
        backgroundColor: '#09090B',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#18181B',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    headerTitle: {
        flex: 1,
        color: '#F4F4F5',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    listHeader: {
        marginBottom: 16,
        paddingTop: 16,
    },
    badgesMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    metaChipText: {
        color: '#D4D4D8',
        fontSize: 12,
        fontWeight: '600',
    },
    description: {
        color: '#A1A1AA',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    ownerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121215',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#27272A',
        marginBottom: 16,
    },
    ownerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    ownerAvatarText: {
        color: '#38BDF8',
        fontWeight: '700',
        fontSize: 15,
    },
    ownerInfo: {
        flex: 1,
    },
    ownerLabel: {
        color: '#71717A',
        fontSize: 11,
    },
    ownerHandle: {
        color: '#F4F4F5',
        fontSize: 14,
        fontWeight: '600',
    },
    moduleCountBadge: {
        backgroundColor: '#18181B',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    moduleCountText: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
    },
    actionBar: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    addModuleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#121215',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    addModuleBtnText: {
        color: '#38BDF8',
        fontSize: 13,
        fontWeight: '700',
    },
    studyAllBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#38BDF8',
        paddingVertical: 12,
        borderRadius: 12,
    },
    studyAllBtnText: {
        color: '#09090B',
        fontSize: 13,
        fontWeight: '700',
    },
    moduleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121215',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    moduleCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    typeBadge: {
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    typeBadgeText: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '700',
    },
    itemsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemsText: {
        color: '#71717A',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    moduleName: {
        color: '#F4F4F5',
        fontSize: 15,
        fontWeight: '700',
    },
    removeBtn: {
        padding: 8,
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 48,
        paddingHorizontal: 20,
    },
    emptyText: {
        color: '#71717A',
        marginTop: 14,
        fontWeight: '500',
        fontSize: 14,
    },
    emptyAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#121215',
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    emptyAddBtnText: {
        color: '#38BDF8',
        fontSize: 13,
        fontWeight: '700',
    },
    errorIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    errorTitle: {
        color: '#F4F4F5',
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    errorDesc: {
        color: '#A1A1AA',
        fontSize: 13,
        marginBottom: 20,
        textAlign: 'center',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121215',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#27272A',
        gap: 8,
    },
    backButtonText: {
        color: '#F4F4F5',
        fontWeight: '700',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(9, 9, 11, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#121215',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        borderTopWidth: 1,
        borderColor: '#27272A',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#27272A',
    },
    modalTitle: {
        color: '#F4F4F5',
        fontSize: 17,
        fontWeight: '700',
    },
    modalModuleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#27272A',
    },
    modalModuleTitle: {
        color: '#F4F4F5',
        fontSize: 14,
        fontWeight: '600',
    },
    modalModuleSub: {
        color: '#71717A',
        fontSize: 12,
        marginTop: 2,
    },
    editFieldLabel: {
        color: '#A1A1AA',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    editInput: {
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#F4F4F5',
        fontSize: 14,
        marginBottom: 14,
    },
});
