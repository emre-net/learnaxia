import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet, StatusBar } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeInDown, Layout,
    SlideInRight, SlideOutLeft,
    useSharedValue, useAnimatedStyle, withTiming,
    interpolate, Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';

const { width } = Dimensions.get('window');

type QualityOption = { quality: number; label: string; icon: string; color: string; bgColor: string; size: number };

const QUALITY_OPTIONS: QualityOption[] = [
    { quality: 1, label: 'Bilmiyorum', icon: 'close',    color: '#EF4444', bgColor: '#1A0A0A', size: 24 },
    { quality: 3, label: 'Zordu',     icon: 'remove',    color: '#F59E0B', bgColor: '#1A1400', size: 24 },
    { quality: 5, label: 'Kolay',     icon: 'done-all',  color: '#10B981', bgColor: '#0A1A10', size: 28 },
];

export default function StudyScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { language } = useLanguage();

    const [studyModule, setStudyModule] = useState<{
        title: string;
        items: Array<{
            id: string;
            type: string;
            content: { question?: string; answer?: string; content?: string; correctAnswer?: string };
        }>;
    } | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [sessionComplete, setSessionComplete] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());

    // ─── 3D Flip Animation ───────────────────────────────────────────────────
    const flipProgress = useSharedValue(0);

    const frontAnimStyle = useAnimatedStyle(() => ({
        transform: [{ rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180], Extrapolation.CLAMP)}deg` }],
        backfaceVisibility: 'hidden',
    }));

    const backAnimStyle = useAnimatedStyle(() => ({
        transform: [{ rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360], Extrapolation.CLAMP)}deg` }],
        backfaceVisibility: 'hidden',
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    }));

    const triggerFlip = useCallback((toAnswer: boolean) => {
        flipProgress.value = withTiming(toAnswer ? 1 : 0, { duration: 380 });
    }, [flipProgress]);

    useEffect(() => {
        const initStudy = async () => {
            try {
                const moduleRes = await api.get(`/mobile/study/${id}`);
                setStudyModule(moduleRes.data.module);

                const sessionRes = await api.post('/mobile/study/start', {
                    moduleId: id,
                    mode: 'NORMAL'
                });
                setSessionId(sessionRes.data.sessionId);
                setStartTime(Date.now());
            } catch (error) {
                console.error('[StudyScreen] Failed to initialize study:', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) initStudy();
    }, [id]);

    const handleFlip = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowAnswer(prev => {
            const next = !prev;
            triggerFlip(next);
            return next;
        });
    }, [triggerFlip]);

    const nextCard = useCallback(async (quality: number = 3) => {
        const isCorrect = quality >= 3;
        setTotalAnswered(prev => prev + 1);
        if (isCorrect) setCorrectCount(prev => prev + 1);

        if (quality >= 3) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        if (sessionId && studyModule?.items?.[currentIndex]) {
            const itemId = studyModule.items[currentIndex].id;
            const durationMs = Date.now() - startTime;

            api.post('/mobile/study/log', {
                sessionId,
                itemId,
                quality,
                durationMs
            }).catch(err => console.error('[StudyScreen] Failed to log result:', err));
        }

        if (currentIndex < (studyModule?.items?.length || 0) - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
            triggerFlip(false);
            setStartTime(Date.now());
        } else {
            setSessionComplete(true);
        }
    }, [currentIndex, studyModule, sessionId, startTime, triggerFlip]);

    const prevCard = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowAnswer(false);
            triggerFlip(false);
        }
    }, [currentIndex, triggerFlip]);

    const toggleBookmark = useCallback((itemId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const wasBookmarked = bookmarkedItems.has(itemId);

        setBookmarkedItems(prev => {
            const next = new Set(prev);
            if (wasBookmarked) next.delete(itemId);
            else next.add(itemId);
            return next;
        });

        const method = wasBookmarked ? 'delete' : 'post';
        api[method](`/mobile/items/${itemId}/bookmark`).catch(() => {
            setBookmarkedItems(prev => {
                const next = new Set(prev);
                if (wasBookmarked) next.add(itemId);
                else next.delete(itemId);
                return next;
            });
        });
    }, [bookmarkedItems]);

    if (loading) {
        return (
            <Screen style={{ backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
                <BrandLoader size="lg" label={t('common.loading', language)} />
            </Screen>
        );
    }

    if (!studyModule || !studyModule.items || studyModule.items.length === 0) {
        return (
            <Screen style={{ backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                <MaterialIcons name="menu-book" size={64} color="#1E293B" style={{ marginBottom: 16 }} />
                <Text style={{ color: '#F8FAFC', fontSize: 20, textAlign: 'center', marginBottom: 8, fontWeight: '700' }}>
                    Modül içeriği bulunamadı
                </Text>
                <Text style={{ color: '#64748B', textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
                    Bu modüle henüz kart eklenmemiş olabilir.
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ paddingHorizontal: 32, paddingVertical: 16, backgroundColor: '#0A0A0A', borderRadius: 99, borderWidth: 1, borderColor: '#111111' }}
                >
                    <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>Geri Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    if (sessionComplete) {
        const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
        
        return (
            <Screen style={{ backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                <StatusBar barStyle="light-content" />
                <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', width: '100%' }}>
                    <View style={{
                        width: 80, height: 80, borderRadius: 40,
                        backgroundColor: '#0A0A0A',
                        borderWidth: 1, borderColor: '#111111',
                        alignItems: 'center', justifyContent: 'center', marginBottom: 24
                    }}>
                        <MaterialIcons
                            name="check"
                            size={40}
                            color="#F8FAFC"
                        />
                    </View>

                    <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '700', marginBottom: 8, letterSpacing: -0.5 }}>
                        Oturum Tamamlandı
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 40, textAlign: 'center' }}>
                        {studyModule.title}
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 40 }}>
                        <View style={styles.resultCard}>
                            <Text style={styles.resultValue}>{accuracy}%</Text>
                            <Text style={styles.resultLabel}>Doğruluk</Text>
                        </View>
                        <View style={styles.resultCard}>
                            <Text style={styles.resultValue}>{totalAnswered}</Text>
                            <Text style={styles.resultLabel}>Kart</Text>
                        </View>
                        <View style={styles.resultCard}>
                            <Text style={styles.resultValue}>{correctCount}</Text>
                            <Text style={styles.resultLabel}>Doğru</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.primaryBtn}
                    >
                        <Text style={styles.primaryBtnText}>Ana Ekrana Dön</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentIndex(0);
                            setShowAnswer(false);
                            setSessionComplete(false);
                            setCorrectCount(0);
                            setTotalAnswered(0);
                            setStartTime(Date.now());
                        }}
                        style={styles.secondaryBtn}
                    >
                        <Text style={styles.secondaryBtnText}>Tekrar Çalış</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Screen>
        );
    }

    const currentItem = studyModule.items[currentIndex];
    const isFlashcard = currentItem.type === 'FLASHCARD' || currentItem.type === 'question';
    const progress = ((currentIndex + 1) / studyModule.items.length) * 100;

    return (
        <Screen style={{ backgroundColor: '#000000' }}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.back();
                    }}
                    style={styles.iconBtn}
                >
                    <Ionicons name="close" size={24} color="#F8FAFC" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.moduleName} numberOfLines={1}>{studyModule.title}</Text>
                    <View style={styles.progressRow}>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{currentIndex + 1} / {studyModule.items.length}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => {
                        const currentItemId = studyModule?.items[currentIndex]?.id;
                        if (currentItemId) toggleBookmark(currentItemId);
                    }}
                    style={styles.iconBtn}
                >
                    <Ionicons
                        name={bookmarkedItems.has(studyModule?.items[currentIndex]?.id ?? '') ? 'bookmark' : 'bookmark-outline'}
                        size={20}
                        color={bookmarkedItems.has(studyModule?.items[currentIndex]?.id ?? '') ? '#F8FAFC' : '#64748B'}
                    />
                </TouchableOpacity>
            </View>

            {/* Main Content Area */}
            <View style={styles.cardArea}>
                <Animated.View
                    key={currentIndex}
                    entering={SlideInRight.duration(400)}
                    exiting={SlideOutLeft.duration(400)}
                    layout={Layout.springify()}
                    style={{ width: '100%' }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => isFlashcard ? handleFlip() : null}
                        style={[styles.flashcard, { transform: [{ perspective: 1200 }] }]}
                    >
                        {isFlashcard ? (
                            <View style={{ flex: 1, width: '100%' }}>
                                {/* SORU YÜZÜ */}
                                <Animated.View style={[styles.cardFace, frontAnimStyle]}>
                                    <View style={styles.label}>
                                        <Text style={styles.labelText}>SORU</Text>
                                    </View>
                                    <Text style={styles.cardText}>
                                        {currentItem.content.question || 'Soru eksik'}
                                    </Text>
                                    <View style={styles.tapHint}>
                                        <Ionicons name="hand-right-outline" size={14} color="#64748B" />
                                        <Text style={styles.tapHintText}>Cevap için dokun</Text>
                                    </View>
                                </Animated.View>

                                {/* CEVAP YÜZÜ */}
                                <Animated.View style={[styles.cardFace, backAnimStyle]}>
                                    <View style={[styles.label, { backgroundColor: '#111111' }]}>
                                        <Text style={[styles.labelText, { color: '#F8FAFC' }]}>CEVAP</Text>
                                    </View>
                                    <Text style={[styles.cardText, { color: '#F8FAFC' }]}>
                                        {currentItem.content.answer || currentItem.content.content || 'Cevap eksik'}
                                    </Text>
                                </Animated.View>
                            </View>
                        ) : (
                            <ScrollView
                                style={{ width: '100%', flex: 1 }}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: 20 }}
                            >
                                <View style={styles.label}>
                                    <Text style={styles.labelText}>NOT</Text>
                                </View>
                                <Text style={styles.noteText}>
                                    {currentItem.content.content || 'İçerik eksik'}
                                </Text>
                            </ScrollView>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Bottom Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    onPress={prevCard}
                    disabled={currentIndex === 0}
                    style={[styles.navBtn, currentIndex === 0 && { opacity: 0.25 }]}
                >
                    <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>

                {isFlashcard && showAnswer ? (
                    <View style={styles.ratingRow}>
                        {QUALITY_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.quality}
                                onPress={() => nextCard(opt.quality)}
                                style={[
                                    styles.ratingBtn,
                                    {
                                        backgroundColor: opt.bgColor,
                                        width: opt.quality === 5 ? 72 : 56,
                                        height: opt.quality === 5 ? 72 : 56,
                                    }
                                ]}
                            >
                                <MaterialIcons name={opt.icon as any} size={opt.size} color={opt.color} />
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => nextCard(3)}
                        activeOpacity={0.8}
                        style={styles.nextBtn}
                    >
                        <Text style={styles.nextBtnText}>
                            {currentIndex === studyModule.items.length - 1 ? 'BİTİR' : 'SIRADAKİ'}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#000000" />
                    </TouchableOpacity>
                )}

                <View style={[styles.navBtn, { opacity: 0 }]} />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 99,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#111111',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    moduleName: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressTrack: {
        height: 4,
        width: 80,
        backgroundColor: '#1E293B',
        borderRadius: 99,
        overflow: 'hidden',
        marginRight: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 99,
    },
    progressText: {
        color: '#475569',
        fontSize: 11,
        fontWeight: '600',
    },
    cardArea: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    flashcard: {
        width: '100%',
        minHeight: 460,
        borderRadius: 32,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#111111',
        overflow: 'hidden',
    },
    cardFace: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backfaceVisibility: 'hidden',
        backgroundColor: '#0A0A0A',
    },
    label: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 99,
        backgroundColor: '#1E293B',
        marginBottom: 32,
    },
    labelText: {
        color: '#94A3B8',
        fontWeight: '700',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    cardText: {
        color: '#F8FAFC',
        fontSize: 26,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: -0.5,
        lineHeight: 36,
    },
    tapHint: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        bottom: 32,
    },
    tapHintText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 8,
    },
    noteText: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '500',
        lineHeight: 28,
        paddingHorizontal: 24,
    },
    controls: {
        paddingHorizontal: 24,
        paddingBottom: 48,
        paddingTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navBtn: {
        width: 56,
        height: 56,
        borderRadius: 99,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#111111',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    ratingBtn: {
        borderRadius: 99,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextBtn: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 32,
        height: 56,
        borderRadius: 99,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextBtnText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 14,
        marginRight: 8,
    },
    resultCard: {
        flex: 1,
        backgroundColor: '#0A0A0A',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#111111',
    },
    resultValue: {
        color: '#F8FAFC',
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -1,
    },
    resultLabel: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },
    primaryBtn: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        paddingVertical: 18,
        borderRadius: 99,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryBtnText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 15,
    },
    secondaryBtn: {
        width: '100%',
        backgroundColor: '#0A0A0A',
        paddingVertical: 18,
        borderRadius: 99,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#111111',
    },
    secondaryBtnText: {
        color: '#F8FAFC',
        fontWeight: '600',
        fontSize: 15,
    },
});
