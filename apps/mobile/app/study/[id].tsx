import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet, StatusBar } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeIn, FadeInDown, FadeOut, Layout,
    SlideInRight, SlideOutLeft,
    useSharedValue, useAnimatedStyle, withTiming,
    interpolate, Extrapolation,
    runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';

const { width } = Dimensions.get('window');

/** SM-2 algoritması için kalite seçenekleri */
type QualityOption = { quality: number; label: string; icon: string; color: string; bgColor: string; size: number };

const QUALITY_OPTIONS: QualityOption[] = [
    { quality: 1, label: 'Bilmiyorum', icon: 'close',    color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)',  size: 28 },
    { quality: 3, label: 'Zordu',     icon: 'remove',    color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', size: 24 },
    { quality: 5, label: 'Kolay',     icon: 'done-all',  color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)', size: 32 },
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
    // Bookmark: Set of item id'leri — optimistic UI, backend'e arka planda senkronize edilir
    const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());

    // ─── 3D Flip Animation ───────────────────────────────────────────────────
    // flipProgress: 0 = soru yüzü, 1 = cevap yüzü
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

    // Flip progress'i showAnswer ile senkronize et
    const triggerFlip = useCallback((toAnswer: boolean) => {
        flipProgress.value = withTiming(toAnswer ? 1 : 0, { duration: 380 });
    }, [flipProgress]);

    useEffect(() => {
        const initStudy = async () => {
            try {
                // 1. Fetch Module
                const moduleRes = await api.get(`/mobile/study/${id}`);
                setStudyModule(moduleRes.data.module);

                // 2. Start Session
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

        // Log locally if we have a session
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
            triggerFlip(false); // kart geçişinde flip sıfırla
            setStartTime(Date.now());
        } else {
            // Son kart — sonuç ekranı göster
            setSessionComplete(true);
        }
    }, [currentIndex, studyModule, sessionId, startTime, triggerFlip]);

    const prevCard = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowAnswer(false);
            triggerFlip(false); // kart geçişinde flip sıfırla
        }
    }, [currentIndex, triggerFlip]);

    /**
     * Optimistic bookmark toggle:
     * 1. UI anında güncellenir (star dolar / boşalır)
     * 2. Arka planda API'ye istek gider
     * 3. Hata olursa UI geri döner
     */
    const toggleBookmark = useCallback((itemId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const wasBookmarked = bookmarkedItems.has(itemId);

        // Optimistic update
        setBookmarkedItems(prev => {
            const next = new Set(prev);
            if (wasBookmarked) next.delete(itemId);
            else next.add(itemId);
            return next;
        });

        // Background sync
        const method = wasBookmarked ? 'delete' : 'post';
        api[method](`/mobile/items/${itemId}/bookmark`).catch(() => {
            // Revert on failure
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
            <Screen style={{ backgroundColor: '#050A14', justifyContent: 'center', alignItems: 'center' }}>
                <BrandLoader size="lg" label={t('common.loading', language)} />
            </Screen>
        );
    }

    if (!studyModule || !studyModule.items || studyModule.items.length === 0) {
        return (
            <Screen style={{ backgroundColor: '#050A14', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                <MaterialIcons name="menu-book" size={64} color="#334155" style={{ marginBottom: 16 }} />
                <Text style={{ color: '#F8FAFC', fontSize: 20, textAlign: 'center', marginBottom: 8, fontWeight: '700' }}>
                    Modül içeriği bulunamadı
                </Text>
                <Text style={{ color: '#64748B', textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
                    Bu modüle henüz kart eklenmemiş olabilir.
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ paddingHorizontal: 32, paddingVertical: 16, backgroundColor: '#090F1D', borderRadius: 16, borderWidth: 1, borderColor: '#182234' }}
                >
                    <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>Geri Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    // ─── Sonuç Ekranı ────────────────────────────────────────────────────────
    if (sessionComplete) {
        const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
        const accentColor = accuracy >= 80 ? '#10B981' : accuracy >= 50 ? '#F59E0B' : '#EF4444';

        return (
            <Screen style={{ backgroundColor: '#050A14', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                <StatusBar barStyle="light-content" />
                <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', width: '100%' }}>
                    {/* Başarı ikonu */}
                    <View style={{
                        width: 100, height: 100, borderRadius: 50,
                        backgroundColor: `${accentColor}18`,
                        borderWidth: 2, borderColor: `${accentColor}40`,
                        alignItems: 'center', justifyContent: 'center', marginBottom: 24
                    }}>
                        <MaterialIcons
                            name={accuracy >= 80 ? 'emoji-events' : accuracy >= 50 ? 'star' : 'school'}
                            size={48}
                            color={accentColor}
                        />
                    </View>

                    <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 }}>
                        {accuracy >= 80 ? 'Harika İş!' : accuracy >= 50 ? 'Güzel Çalışma!' : 'Devam Et!'}
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 15, marginBottom: 40, textAlign: 'center' }}>
                        {studyModule.title} tamamlandı
                    </Text>

                    {/* Stats */}
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 40 }}>
                        <View style={styles.resultCard}>
                            <Text style={[styles.resultValue, { color: accentColor }]}>{accuracy}%</Text>
                            <Text style={styles.resultLabel}>Doğruluk</Text>
                        </View>
                        <View style={styles.resultCard}>
                            <Text style={styles.resultValue}>{totalAnswered}</Text>
                            <Text style={styles.resultLabel}>Kart</Text>
                        </View>
                        <View style={styles.resultCard}>
                            <Text style={[styles.resultValue, { color: '#10B981' }]}>{correctCount}</Text>
                            <Text style={styles.resultLabel}>Doğru</Text>
                        </View>
                    </View>

                    {/* Butonlar */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ width: '100%', backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 }}
                    >
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Ana Ekrana Dön</Text>
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
                        style={{ width: '100%', backgroundColor: '#090F1D', paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#182234' }}
                    >
                        <Text style={{ color: '#94A3B8', fontWeight: '700', fontSize: 16 }}>Tekrar Çalış</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Screen>
        );
    }

    const currentItem = studyModule.items[currentIndex];
    const isFlashcard = currentItem.type === 'FLASHCARD' || currentItem.type === 'question';
    const progress = ((currentIndex + 1) / studyModule.items.length) * 100;

    return (
        <Screen style={{ backgroundColor: '#050A14' }}>
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
                    <MaterialIcons name="close" size={24} color="white" />
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

                {/* Yıldız — optimistic bookmark toggle */}
                <TouchableOpacity
                    onPress={() => {
                        const currentItemId = studyModule?.items[currentIndex]?.id;
                        if (currentItemId) toggleBookmark(currentItemId);
                    }}
                    style={styles.iconBtn}
                >
                    <MaterialIcons
                        name={bookmarkedItems.has(studyModule?.items[currentIndex]?.id ?? '') ? 'star' : 'star-outline'}
                        size={24}
                        color={bookmarkedItems.has(studyModule?.items[currentIndex]?.id ?? '') ? '#F59E0B' : '#64748B'}
                    />
                </TouchableOpacity>
            </View>

            {/* Background Glow */}
            <View
                style={[styles.glow, { backgroundColor: showAnswer ? '#A855F7' : '#00D2FF' }]}
            />

            {/* Main Content Area */}
            <View style={styles.cardArea}>
                <Animated.View
                    key={currentIndex}
                    entering={SlideInRight.duration(400)}
                    exiting={SlideOutLeft.duration(400)}
                    layout={Layout.springify()}
                    style={{ width: '100%' }}
                >
                    {/* 3D Flip Card Container */}
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => isFlashcard ? handleFlip() : null}
                        style={[styles.flashcard, { transform: [{ perspective: 1200 }] }]}
                    >
                        {isFlashcard ? (
                            // ─── FLASHCARD: 3D Flip ──────────────────────────────────────────────────────
                            <View style={{ flex: 1, width: '100%' }}>

                                {/* SORU YÜZÜ (Front) */}
                                <Animated.View style={[styles.cardFace, frontAnimStyle]}>
                                    <LinearGradient
                                        colors={['rgba(0,210,255,0.08)', 'rgba(0,210,255,0.02)', 'transparent']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                    <View style={[styles.label, {
                                        backgroundColor: 'rgba(0, 210, 255, 0.1)',
                                        borderColor: 'rgba(0, 210, 255, 0.25)'
                                    }]}>
                                        <Text style={[styles.labelText, { color: '#00D2FF' }]}>SORU</Text>
                                    </View>
                                    <Text style={styles.cardText}>
                                        {currentItem.content.question || 'Soru eksik'}
                                    </Text>
                                    <View style={styles.tapHint}>
                                        <MaterialIcons name="touch-app" size={16} color="rgba(0,210,255,0.5)" />
                                        <Text style={[styles.tapHintText, { color: 'rgba(0,210,255,0.5)' }]}>Cevap için dokun</Text>
                                    </View>
                                </Animated.View>

                                {/* CEVAP YÜZÜ (Back) */}
                                <Animated.View style={[styles.cardFace, backAnimStyle]}>
                                    <LinearGradient
                                        colors={['rgba(168,85,247,0.12)', 'rgba(168,85,247,0.04)', 'transparent']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                    <View style={[styles.label, {
                                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                        borderColor: 'rgba(168, 85, 247, 0.25)'
                                    }]}>
                                        <Text style={[styles.labelText, { color: '#A855F7' }]}>CEVAP</Text>
                                    </View>
                                    <Text style={styles.cardText}>
                                        {currentItem.content.answer || currentItem.content.content || 'Cevap eksik'}
                                    </Text>
                                </Animated.View>

                            </View>
                        ) : (
                            // ─── NOTE: Scrollable ────────────────────────────────────────────────────────
                            <ScrollView
                                style={{ width: '100%', flex: 1 }}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: 20 }}
                            >
                                <View style={[styles.label, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', alignSelf: 'flex-start' }]}>
                                    <Text style={[styles.labelText, { color: '#10B981' }]}>NOT</Text>
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
                {/* Geri */}
                <TouchableOpacity
                    onPress={prevCard}
                    disabled={currentIndex === 0}
                    style={[styles.navBtn, currentIndex === 0 && { opacity: 0.25 }]}
                >
                    <MaterialIcons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>

                {/* Center: Rating butonları veya İleri */}
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
                                        borderColor: `${opt.color}30`,
                                        width: opt.quality === 5 ? 80 : 64,
                                        height: opt.quality === 5 ? 80 : 64,
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
                        <MaterialIcons name="arrow-forward" size={24} color="white" />
                    </TouchableOpacity>
                )}

                {/* Sağ placeholder */}
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
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 16,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#090F1D',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#182234',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    moduleName: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 4,
        marginBottom: 8,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressTrack: {
        height: 4,
        width: 80,
        backgroundColor: '#182234',
        borderRadius: 2,
        overflow: 'hidden',
        marginRight: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 2,
    },
    progressText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '700',
    },
    glow: {
        position: 'absolute',
        top: '15%',
        left: '-25%',
        width: '120%',
        height: '50%',
        borderRadius: 999,
        opacity: 0.07,
        transform: [{ scale: 1.3 }],
    },
    cardArea: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    flashcard: {
        width: '100%',
        minHeight: 440,
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#182234',
        padding: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
    },
    // 3D flip yapısı için: her yüz tam karta yayılır
    cardFace: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backfaceVisibility: 'hidden',
    },
    cardInner: {
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 999,
        marginBottom: 32,
        borderWidth: 1,
    },
    labelText: {
        fontWeight: '900',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 4,
    },
    cardText: {
        color: '#F8FAFC',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: -0.5,
        lineHeight: 40,
    },
    tapHint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 48,
        opacity: 0.3,
    },
    tapHintText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    noteText: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '700',
        lineHeight: 36,
        letterSpacing: -0.3,
    },
    controls: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navBtn: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#090F1D',
        borderWidth: 1,
        borderColor: '#182234',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ratingBtn: {
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    nextBtn: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 28,
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    nextBtnText: {
        color: 'white',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginRight: 8,
    },
    // Sonuç ekranı
    resultCard: {
        flex: 1,
        backgroundColor: '#090F1D',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#182234',
    },
    resultValue: {
        color: '#F8FAFC',
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 4,
    },
    resultLabel: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
