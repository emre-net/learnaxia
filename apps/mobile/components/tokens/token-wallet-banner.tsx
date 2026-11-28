import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKEN_CONFIG, TokenTransactionRecord, getTokenTransactionLabel } from '@learnaxia/shared';
import { useTokenWallet } from '@/hooks/use-token-wallet';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';

interface TokenWalletBannerProps {
    variant?: 'compact' | 'card';
}

export function TokenWalletBanner({ variant = 'compact' }: TokenWalletBannerProps) {
    const { wallet, loading, watchingAd, watchRewardedAd } = useTokenWallet();
    const { language } = useLanguage();
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [history, setHistory] = useState<TokenTransactionRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const openHistoryModal = async () => {
        setHistoryModalVisible(true);
        setLoadingHistory(true);
        try {
            const res = await api.get<{ transactions?: TokenTransactionRecord[] }>('/tokens/history?limit=20');
            setHistory(Array.isArray(res.data?.transactions) ? res.data.transactions : []);
        } catch {
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const total = wallet?.totalAvailable ?? TOKEN_CONFIG.DAILY_FREE_TOKENS;
    const dailyRemaining = wallet?.dailyFreeRemaining ?? TOKEN_CONFIG.DAILY_FREE_TOKENS;
    const dailyLimit = wallet?.dailyFreeLimit ?? TOKEN_CONFIG.DAILY_FREE_TOKENS;
    const bonus = wallet?.bonusTokens ?? 0;
    const adsRemaining = wallet?.dailyAdsRemaining ?? TOKEN_CONFIG.MAX_DAILY_REWARDED_ADS;

    if (variant === 'compact') {
        return (
            <View style={styles.compactBox}>
                <View style={styles.compactLeft}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="flash" size={16} color="#38BDF8" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.compactTitle}>
                            {loading ? 'Jeton yükleniyor...' : `${total} AI Jetonu`}
                        </Text>
                        <Text style={styles.compactSub}>
                            Günlük {dailyRemaining}/{dailyLimit} + {bonus} bonus
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.adBtn, (watchingAd || adsRemaining <= 0) && styles.adBtnDisabled]}
                    onPress={watchRewardedAd}
                    disabled={watchingAd || adsRemaining <= 0}
                    activeOpacity={0.8}
                >
                    {watchingAd ? (
                        <ActivityIndicator size="small" color="#09090B" />
                    ) : (
                        <>
                            <Ionicons name="play-circle" size={15} color="#09090B" />
                            <Text style={styles.adBtnText}>+{TOKEN_CONFIG.REWARDED_AD_BONUS} Jeton</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="flash" size={18} color="#38BDF8" />
                    </View>
                    <View>
                        <Text style={styles.cardTitle}>AI Jeton Cüzdanı</Text>
                        <Text style={styles.cardSub}>Elle oluşturma, tekrar ve notlar sınırsızdır</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.historyBtn}
                        onPress={openHistoryModal}
                        activeOpacity={0.75}
                    >
                        <Ionicons name="time-outline" size={14} color="#A1A1AA" />
                        <Text style={styles.historyBtnText}>Hareketler</Text>
                    </TouchableOpacity>
                    <Text style={styles.bigTotal}>{loading ? '—' : total}</Text>
                </View>
            </View>

            <View style={styles.splitRow}>
                <View style={styles.splitCell}>
                    <Text style={styles.splitLabel}>GÜNLÜK ÜCRETSİZ</Text>
                    <Text style={styles.splitValue}>{dailyRemaining} / {dailyLimit}</Text>
                </View>
                <View style={styles.splitCell}>
                    <Text style={styles.splitLabel}>BONUS JETON</Text>
                    <Text style={[styles.splitValue, { color: '#34D399' }]}>+{bonus}</Text>
                </View>
                <View style={styles.splitCell}>
                    <Text style={styles.splitLabel}>KALAN REKLAM</Text>
                    <Text style={styles.splitValue}>{adsRemaining} / {wallet?.maxDailyAds ?? TOKEN_CONFIG.MAX_DAILY_REWARDED_ADS}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.fullAdBtn, (watchingAd || adsRemaining <= 0) && styles.adBtnDisabled]}
                onPress={watchRewardedAd}
                disabled={watchingAd || adsRemaining <= 0}
                activeOpacity={0.8}
            >
                {watchingAd ? (
                    <ActivityIndicator size="small" color="#09090B" />
                ) : (
                    <>
                        <Ionicons name="play-circle" size={18} color="#09090B" />
                        <Text style={styles.fullAdBtnText}>
                            {adsRemaining > 0
                                ? `Kısa Reklam İzle (+${TOKEN_CONFIG.REWARDED_AD_BONUS} Bonus Jeton)`
                                : 'Bugünkü Reklam Ödülü Sınırı Doldu'}
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            <Modal
                visible={historyModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setHistoryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Jeton Hareketleri</Text>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setHistoryModalVisible(false)}
                            >
                                <Ionicons name="close" size={20} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        {loadingHistory ? (
                            <View style={styles.modalState}>
                                <ActivityIndicator size="small" color="#38BDF8" />
                            </View>
                        ) : history.length === 0 ? (
                            <View style={styles.modalState}>
                                <Text style={styles.emptyHistoryText}>Henüz jeton hareketi kaydı yok.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={history}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
                                renderItem={({ item }) => (
                                    <View style={styles.txRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.txTitle} numberOfLines={1}>
                                                {getTokenTransactionLabel(item.source, item.action, language)}
                                            </Text>
                                            <Text style={styles.txSub}>
                                                {new Date(item.createdAt).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')} • Bakiye: {item.balanceAfter}
                                            </Text>
                                        </View>
                                        <Text style={[styles.txAmount, { color: item.amount >= 0 ? '#34D399' : '#E4E4E7' }]}>
                                            {item.amount >= 0 ? `+${item.amount}` : item.amount}
                                        </Text>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    compactBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 20,
        gap: 10,
    },
    compactLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    compactTitle: {
        color: '#F4F4F5',
        fontSize: 13,
        fontWeight: '700',
    },
    compactSub: {
        color: '#A1A1AA',
        fontSize: 11,
    },
    adBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#38BDF8',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    adBtnDisabled: {
        opacity: 0.55,
    },
    adBtnText: {
        color: '#09090B',
        fontSize: 12,
        fontWeight: '800',
    },
    card: {
        marginHorizontal: 24,
        marginBottom: 24,
        backgroundColor: '#121215',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#27272A',
        padding: 18,
        gap: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    cardTitle: {
        color: '#F4F4F5',
        fontSize: 15,
        fontWeight: '700',
    },
    cardSub: {
        color: '#A1A1AA',
        fontSize: 11,
        marginTop: 2,
    },
    bigTotal: {
        color: '#38BDF8',
        fontSize: 26,
        fontWeight: '800',
    },
    splitRow: {
        flexDirection: 'row',
        gap: 8,
    },
    splitCell: {
        flex: 1,
        backgroundColor: '#18181B',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#27272A',
        padding: 10,
    },
    splitLabel: {
        color: '#71717A',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    splitValue: {
        color: '#F4F4F5',
        fontSize: 14,
        fontWeight: '700',
    },
    fullAdBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#38BDF8',
        borderRadius: 14,
        paddingVertical: 13,
    },
    fullAdBtnText: {
        color: '#09090B',
        fontSize: 13,
        fontWeight: '800',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    historyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    historyBtnText: {
        color: '#A1A1AA',
        fontSize: 11,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(9, 9, 11, 0.8)',
    },
    modalSheet: {
        backgroundColor: '#121215',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: '#27272A',
        padding: 20,
        maxHeight: '75%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: {
        color: '#F4F4F5',
        fontSize: 18,
        fontWeight: '700',
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#18181B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalState: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    emptyHistoryText: {
        color: '#71717A',
        fontSize: 13,
    },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        borderRadius: 12,
        padding: 12,
        gap: 10,
    },
    txTitle: {
        color: '#F4F4F5',
        fontSize: 13,
        fontWeight: '600',
    },
    txSub: {
        color: '#71717A',
        fontSize: 11,
        marginTop: 2,
    },
    txAmount: {
        fontSize: 14,
        fontWeight: '800',
    },
});
