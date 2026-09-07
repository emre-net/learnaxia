import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    RefreshControl, StyleSheet
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
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

    const fetchCollection = useCallback(async () => {
        setFetchError(false);
        try {
            // Endpoint düzeltildi: /collections/:id → /mobile/collections/:id
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
            case 'MC': return 'Test';
            case 'FLASHCARD': return 'Kart';
            default: return 'Modül';
        }
    };

    const renderModuleItem = ({ item }: { item: ModuleData }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            style={styles.moduleCard}
            onPress={() => router.push(`/study/${item.id}` as any)}
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
    );

    return (
        <Screen style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{collection.title}</Text>
            </View>

            <FlatList
                data={collection.modules}
                keyExtractor={(item) => item.id}
                renderItem={renderModuleItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
                }
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48, flexGrow: 1 }}
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
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="folder-open" size={48} color="#475569" />
                        <Text style={styles.emptyText}>Bu koleksiyonda henüz modül yok.</Text>
                    </View>
                }
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#050A14',
    },
    centered: {
        flex: 1,
        backgroundColor: '#050A14',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 16,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#090F1D',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#182234',
    },
    headerTitle: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    listHeader: {
        marginBottom: 20,
        paddingTop: 8,
    },
    description: {
        color: '#94A3B8',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
    ownerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#090F1D',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#182234',
        marginBottom: 20,
    },
    ownerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6366F1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    ownerAvatarText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
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
        fontSize: 14,
        marginTop: 1,
    },
    moduleCountBadge: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    moduleCountText: {
        color: '#818CF8',
        fontSize: 12,
        fontWeight: '700',
    },
    moduleCard: {
        backgroundColor: '#090F1D',
        borderRadius: 24,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#182234',
    },
    moduleCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    typeBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    typeBadgeText: {
        color: '#60A5FA',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
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
        letterSpacing: 0.5,
    },
    moduleName: {
        color: '#F8FAFC',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    // Hata ekranı
    errorIconWrapper: {
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
    errorTitle: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    errorDesc: {
        color: '#64748B',
        fontSize: 13,
        marginBottom: 24,
        textAlign: 'center',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#090F1D',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#182234',
    },
    backButtonText: {
        color: '#F8FAFC',
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: '#64748B',
        marginTop: 16,
        fontWeight: '500',
        fontSize: 14,
    },
});
