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
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [collection, setCollection] = useState<CollectionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    // Add module modal
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [userModules, setUserModules] = useState<ModuleData[]>([]);
    const [loadingUserModules, setLoadingUserModules] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchCollection = useCallback(async () => {
        setFetchError(false);
        try {
            const response = await api.get(`/mobile/collections/${id}`);
            setCollection(response.data);
        } catch (error) {
            console.error('[CollectionDetail] Failed to fetch collection:', error);
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

    // Open add module modal & load library modules
    const handleOpenAddModal = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAddModalVisible(true);
        setLoadingUserModules(true);
        try {
            const res = await api.get('/mobile/library?type=MODULE');
            const allModules: ModuleData[] = res.data?.items || res.data || [];
            // Filter out modules already in this collection
            const existingIds = new Set(collection?.modules.map(m => m.id) || []);
            setUserModules(allModules.filter(m => !existingIds.has(m.id)));
        } catch (err) {
            console.error('[CollectionDetail] Failed to fetch library modules:', err);
        } finally {
            setLoadingUserModules(false);
        }
    };

    // Add selected module to collection
    const handleAddModuleToCollection = async (moduleId: string) => {
        if (!collection) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActionLoading(true);
        try {
            const currentModuleIds = collection.modules.map(m => m.id);
            const updatedModuleIds = [...currentModuleIds, moduleId];

            await api.patch(`/mobile/collections/${collection.id}`, {
                moduleIds: updatedModuleIds
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setAddModalVisible(false);
            fetchCollection();
        } catch (err) {
            console.error('[CollectionDetail] Failed to add module:', err);
            Alert.alert('Hata', 'Modül koleksiyona eklenirken bir hata oluştu.');
        } finally {
            setActionLoading(false);
        }
    };

    // Remove module from collection
    const handleRemoveModule = (moduleId: string, moduleTitle: string) => {
        if (!collection) return;
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
                                .map(m => m.id)
                                .filter(mId => mId !== moduleId);

                            await api.patch(`/mobile/collections/${collection.id}`, {
                                moduleIds: updatedModuleIds
                            });

                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            fetchCollection();
                        } catch (err) {
                            Alert.alert('Hata', 'Modül çıkarılamadı.');
                        }
                    }
                }
            ]
        );
    };

    // Delete entire collection
    const handleDeleteCollection = () => {
        if (!collection) return;
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
                        } catch (err) {
                            Alert.alert('Hata', 'Koleksiyon silinirken bir hata oluştu.');
                        }
                    }
                }
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
                    <MaterialIcons
                        name={fetchError ? 'wifi-off' : 'folder-open'}
                        size={40}
                        color="#475569"
                    />
                </View>
                <Text style={styles.errorTitle}>
                    {fetchError ? 'Koleksiyon Yüklenemedi' : 'Koleksiyon Bulunamadı'}
                </Text>
                <Text style={styles.errorDesc}>
                    {fetchError ? 'İnternet bağlantınızı kontrol edin' : 'Bu koleksiyon artık mevcut olmayabilir'}
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={18} color="white" />
                    <Text style={styles.backButtonText}>Geri Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    const getModuleTypeLabel = (type: string): string => {
        switch (type) {
            case 'MC': return 'Çoktan Seçmeli';
            case 'FLASHCARD': return 'Flashcard';
            case 'TRUE_FALSE': return 'Doğru / Yanlış';
            case 'GAP': return 'Boşluk Doldurma';
            default: return 'Modül';
        }
    };

    const renderModuleItem = ({ item }: { item: ModuleData }) => (
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
                        <MaterialIcons name="description" size={12} color="#60A5FA" />
                        <Text style={styles.itemsText}>{item._count?.items || 0} ÖĞE</Text>
                    </View>
                </View>
                <Text style={styles.moduleName} numberOfLines={1}>{item.title}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => handleRemoveModule(item.id, item.title)}
                style={styles.removeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="close-circle-outline" size={20} color="#64748B" />
            </TouchableOpacity>
        </View>
    );

    return (
        <Screen style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={22} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{collection.title}</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={handleOpenAddModal} style={styles.headerIconBtn}>
                        <Ionicons name="add" size={22} color="#38BDF8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDeleteCollection} style={styles.headerIconBtn}>
                        <Ionicons name="trash-outline" size={19} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={collection.modules}
                keyExtractor={(item) => item.id}
                renderItem={renderModuleItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
                }
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, flexGrow: 1 }}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        {collection.description && (
                            <Text style={styles.description}>{collection.description}</Text>
                        )}

                        {/* Owner card */}
                        <View style={styles.ownerCard}>
                            <View style={styles.ownerAvatar}>
                                <Text style={styles.ownerAvatarText}>
                                    {collection.owner?.handle?.[0]?.toUpperCase() || '?'}
                                </Text>
                            </View>
                            <View style={styles.ownerInfo}>
                                <Text style={styles.ownerLabel}>Sahibi</Text>
                                <Text style={styles.ownerHandle}>@{collection.owner.handle}</Text>
                            </View>
                            <View style={styles.moduleCountBadge}>
                                <Text style={styles.moduleCountText}>{collection.modules.length} Modül</Text>
                            </View>
                        </View>

                        {/* Action Bar */}
                        <View style={styles.actionBar}>
                            <TouchableOpacity
                                style={styles.addModuleBtn}
                                onPress={handleOpenAddModal}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add-circle" size={18} color="#38BDF8" />
                                <Text style={styles.addModuleBtnText}>Modül Ekle</Text>
                            </TouchableOpacity>

                            {collection.modules.length > 0 && (
                                <TouchableOpacity
                                    style={styles.studyAllBtn}
                                    onPress={() => router.push(`/study/${collection.modules[0].id}` as any)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="play" size={16} color="#000000" />
                                    <Text style={styles.studyAllBtnText}>Çalış</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="folder-open" size={48} color="#334155" />
                        <Text style={styles.emptyText}>Bu koleksiyonda henüz modül yok.</Text>
                        <TouchableOpacity
                            style={styles.emptyAddBtn}
                            onPress={handleOpenAddModal}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={18} color="#38BDF8" />
                            <Text style={styles.emptyAddBtnText}>Kitaplığından Modül Ekle</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Modal: Add Module From Library */}
            <Modal
                visible={addModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Koleksiyona Modül Ekle</Text>
                            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {loadingUserModules ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color="#38BDF8" />
                            </View>
                        ) : userModules.length === 0 ? (
                            <View style={{ padding: 32, alignItems: 'center' }}>
                                <Text style={{ color: '#64748B', textAlign: 'center', fontSize: 14 }}>
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
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#000000',
    },
    centered: {
        flex: 1,
        backgroundColor: '#000000',
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
        borderBottomColor: '#1E293B',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#262626',
    },
    headerTitle: {
        flex: 1,
        color: '#F8FAFC',
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
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#262626',
    },
    listHeader: {
        marginBottom: 16,
        paddingTop: 16,
    },
    description: {
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    ownerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
        marginBottom: 16,
    },
    ownerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#6366F1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    ownerAvatarText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
    ownerInfo: {
        flex: 1,
    },
    ownerLabel: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    ownerHandle: {
        color: '#F8FAFC',
        fontWeight: '600',
        fontSize: 13,
        marginTop: 1,
    },
    moduleCountBadge: {
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.25)',
    },
    moduleCountText: {
        color: '#818CF8',
        fontSize: 11,
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
        backgroundColor: '#0A0A0A',
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
        backgroundColor: '#F8FAFC',
        paddingVertical: 12,
        borderRadius: 12,
    },
    studyAllBtnText: {
        color: '#000000',
        fontSize: 13,
        fontWeight: '700',
    },
    moduleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    moduleCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    typeBadge: {
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.2)',
    },
    typeBadgeText: {
        color: '#38BDF8',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    itemsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemsText: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 4,
    },
    moduleName: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.2,
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
        color: '#64748B',
        marginTop: 14,
        fontWeight: '500',
        fontSize: 14,
    },
    emptyAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#0A0A0A',
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
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    errorTitle: {
        color: '#F8FAFC',
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    errorDesc: {
        color: '#64748B',
        fontSize: 13,
        marginBottom: 20,
        textAlign: 'center',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    backButtonText: {
        color: '#F8FAFC',
        fontWeight: '700',
        fontSize: 14,
        marginLeft: 8,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#0A0A0A',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        borderTopWidth: 1,
        borderColor: '#262626',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    modalTitle: {
        color: '#F8FAFC',
        fontSize: 17,
        fontWeight: '700',
    },
    modalModuleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    modalModuleTitle: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '600',
    },
    modalModuleSub: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 2,
    },
});