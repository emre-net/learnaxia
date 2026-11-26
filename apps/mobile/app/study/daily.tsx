import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeInDown, Layout,
    SlideInRight, SlideOutLeft,
    useSharedValue, useAnimatedStyle, withTiming, withSpring,
    interpolate, Extrapolation, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { t, resolveTrueFalseAnswer } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { MCCard } from '@/components/study/mc-card';
import { TrueFalseCard } from '@/components/study/tf-card';
import { GapCard } from '@/components/study/gap-card';
import { NativeRichText } from '@/components/ui/rich-math-text';

interface DailyStudyItem {
    id: string;
    type: string;
    moduleId?: string;
    sessionId?: string;
    content: {
        question?: string;
        answer?: string | boolean;
        front?: string;
        back?: string;
        content?: string;
        correctAnswer?: string | boolean;
        options?: string[];
        explanation?: string;
        statement?: string;
        text?: string;
        answers?: string[];
        isTrue?: boolean;
        image?: string;
        imageUrl?: string;
    };
}

const SM2_BUTTONS = [
    { quality: 1, key: 'study.again', fallback: 'Tekrar', color: '#FB7185', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.35)' },
    { quality: 2, key: 'study.hard', fallback: 'Zor', color: '#FBBF24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' },
    { quality: 4, key: 'study.good', fallback: 'İyi', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)' },
    { quality: 5, key: 'study.easy', fallback: 'Kolay', color: '#34D399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)' },
] as const;

export default function DailyStudyScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const { user } = useAuth();
    const showTimer = (user as any)?.settings?.showStudyTimer !== false;

    const [studyModule, setStudyModule] = useState<{ title: string; items: DailyStudyItem[] } | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionMap, setSessionMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);

    const flipProgress = useSharedValue(0);
    const dragX = useSharedValue(0);

    const frontAnimStyle = useAnimatedStyle(() => ({
        transform: [{ rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180], Extrapolation.CLAMP)}deg` }],
        backfaceVisibility: 'hidden',
    }));

    const backAnimStyle = useAnimatedStyle(() => ({
        transform: [{ rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360], Extrapolation.CLAMP)}deg` }],
        backfaceVisibility: 'hidden',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    }));

    const swipeCardStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: dragX.value },
            { rotateZ: `${interpolate(dragX.value, [-180, 0, 180], [-7, 0, 7], Extrapolation.CLAMP)}deg` },
        ],
    }));

    const rightOverlayStyle = useAnimatedStyle(() => ({
        opacity: interpolate(dragX.value, [25, 110], [0, 1], Extrapolation.CLAMP),
    }));

    const leftOverlayStyle = useAnimatedStyle(() => ({
        opacity: interpolate(dragX.value, [-110, -25], [1, 0], Extrapolation.CLAMP),
    }));

    const triggerFlip = useCallback(
        (toAnswer: boolean) => {
            flipProgress.value = withTiming(toAnswer ? 1 : 0, { duration: 360 });
        },
        [flipProgress]
    );

    useEffect(() => {
        if (loading || sessionComplete || !showTimer) return;
        const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        return () => clearInterval(timer);
    }, [loading, sessionComplete, showTimer]);

    useEffect(() => {
        const initStudy = async () => {
            try {
                const sessionRes = await api.post('/mobile/study/start-daily');
                if (sessionRes.data?.items && sessionRes.data.items.length > 0) {
                    setStudyModule({
                        title: t('dashboard.dailyReview.title', language) || 'Günlük Tekrar',
                        items: sessionRes.data.items,
                    });
                    setSessionId(sessionRes.data.sessionId || null);
                    setSessionMap(sessionRes.data.sessionMap || {});
                    setStartTime(Date.now());
                } else {
                    setError('Bugün için tekrar edilecek kart kalmadı.');
                }
            } catch (err: any) {
                setError(err?.response?.data?.error || 'Günlük tekrar yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        initStudy();
    }, [language]);

    const logItemAnswer = useCallback(
        (quality: number) => {
            const isCorrect = quality >= 3;
            setTotalAnswered((prev) => prev + 1);
            if (isCorrect) setCorrectCount((prev) => prev + 1);

            const item = studyModule?.items?.[currentIndex];
            const targetSessionId =
                (item?.moduleId && sessionMap[item.moduleId]) ||
                item?.sessionId ||
                sessionId;

            if (targetSessionId && item) {
                const durationMs = Date.now() - startTime;
                api.post('/mobile/study/log', {
                    sessionId: targetSessionId,
                    itemId: item.id,
                    quality,
                    durationMs,
                }).catch((err) => {
                    if (__DEV__) console.error('[DailyStudyScreen] Failed to log result:', err);
                });
            }
            return isCorrect;
        },
        [studyModule, currentIndex, sessionMap, sessionId, startTime]
    );

    const advanceCard = useCallback(() => {
        if (currentIndex < (studyModule?.items?.length || 0) - 1) {
            setCurrentIndex((prev) => prev + 1);
            setShowAnswer(false);
            triggerFlip(false);
            dragX.value = 0;
            setStartTime(Date.now());
        } else {
            setSessionComplete(true);
        }
    }, [currentIndex, studyModule?.items?.length, triggerFlip, dragX]);

    const gradeFlashcard = useCallback(
        (quality: number) => {
            const isCorrect = logItemAnswer(quality);
            if (isCorrect) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            advanceCard();
        },
        [logItemAnswer, advanceCard]
    );

    const handleInteractiveAnswer = useCallback(
        (isCorrect: boolean) => {
            logItemAnswer(isCorrect ? 4 : 1);
            setShowAnswer(true);
        },
        [logItemAnswer]
    );

    const handleFlip = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowAnswer((prev) => {
            const next = !prev;
            triggerFlip(next);
            return next;
        });
    }, [triggerFlip]);

    const handleExitPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (totalAnswered > 0 && !sessionComplete) {
            Alert.alert(
                'Günlük Tekrardan Çık',
                'İlerlemeniz kaydedildi. Oturumu sonlandırmak istiyor musunuz?',
                [
                    { text: 'Devam Et', style: 'cancel' },
                    { text: 'Çık', style: 'destructive', onPress: () => router.back() },
                ]
            );
        } else {
            router.back();
        }
    }, [totalAnswered, sessionComplete, router]);

    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .activeOffsetX([-20, 20])
                .failOffsetY([-15, 15])
                .onUpdate((e) => {
                    dragX.value = e.translationX;
                })
                .onEnd((e) => {
                    if (e.translationX > 105) {
                        dragX.value = withTiming(380, { duration: 180 }, () => {
                            dragX.value = 0;
                            runOnJS(gradeFlashcard)(4);
                        });
                    } else if (e.translationX < -105) {
                        dragX.value = withTiming(-380, { duration: 180 }, () => {
                            dragX.value = 0;
                            runOnJS(gradeFlashcard)(1);
                        });
                    } else {
                        dragX.value = withSpring(0, { damping: 16, stiffness: 160 });
                    }
                }),
        [dragX, gradeFlashcard]
    );

    const formatTimer = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <Screen style={styles.centerScreen}>
                <BrandLoader size="lg" label="Günlük tekrar hazırlanıyor..." />
            </Screen>
        );
    }

    if (error || !studyModule || !studyModule.items || studyModule.items.length === 0) {
        return (
            <Screen style={styles.centerScreen}>
                <View style={styles.iconCircle}>
                    <MaterialIcons name="done-all" size={44} color="#10B981" />
                </View>
                <Text style={styles.emptyTitle}>Harika İş Çıkardın!</Text>
                <Text style={styles.emptyDesc}>
                    {error || 'Bugün için tekrar edilecek kart kalmadı.'}
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={18} color="#F4F4F5" style={{ marginRight: 8 }} />
                    <Text style={styles.backBtnText}>Ana Ekrana Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    if (sessionComplete) {
        const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
        return (
            <Screen style={styles.centerScreen}>
                <StatusBar barStyle="light-content" backgroundColor="#09090B" />
                <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: 'center', width: '100%', paddingHorizontal: 24 }}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="emoji-events" size={42} color="#38BDF8" />
                    </View>
                    <Text style={styles.sessionTitle}>Günlük Tekrar Tamamlandı!</Text>
                    <Text style={styles.sessionSub}>Bugünkü hedefine başarıyla ulaştın.</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>%{accuracy}</Text>
                            <Text style={styles.statLbl}>Doğruluk</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>{correctCount}/{totalAnswered}</Text>
                            <Text style={styles.statLbl}>Doğru</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>{formatTimer(elapsedSeconds)}</Text>
                            <Text style={styles.statLbl}>Süre</Text>
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => router.back()} style={styles.doneBtn}>
                        <Text style={styles.doneBtnText}>Ana Ekrana Dön</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Screen>
        );
    }

    const currentItem = studyModule.items[currentIndex];
    const itemType = (currentItem.type || '').toUpperCase();
    const isMC = itemType === 'MC';
    const isTrueFalse = itemType === 'TRUE_FALSE' || itemType === 'TF';
    const isGap = itemType === 'GAP';
    const isInteractive = isMC || isTrueFalse || isGap;
    const isFlashcard = !isInteractive;

    const c = currentItem.content || {};
    const img = c.image || c.imageUrl || '';
    const hasValidImage = Boolean(img && (img.startsWith('data:') || img.startsWith('http')));
    const progress = ((currentIndex + 1) / studyModule.items.length) * 100;

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#09090B" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleExitPress} style={styles.closeBtn}>
                        <Ionicons name="close" size={22} color="#F4F4F5" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.moduleTitle} numberOfLines={1}>{studyModule.title}</Text>
                        <View style={styles.progressRow}>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${progress}%` }]} />
                            </View>
                            <Text style={styles.progressText}>
                                {currentIndex + 1} / {studyModule.items.length}
                            </Text>
                            {showTimer && (
                                <Text style={styles.timerBadge}>{formatTimer(elapsedSeconds)}</Text>
                            )}
                        </View>
                    </View>

                    <View style={{ width: 40, height: 40 }} />
                </View>

                <View style={styles.cardArea}>
                    <Animated.View
                        key={currentIndex}
                        entering={SlideInRight.duration(300)}
                        exiting={SlideOutLeft.duration(260)}
                        layout={Layout.springify()}
                        style={{ flex: 1, width: '100%' }}
                    >
                        {isMC ? (
                            <ScrollView contentContainerStyle={styles.scrollCardInner} keyboardShouldPersistTaps="handled">
                                <MCCard
                                    question={c.question || 'Soru eksik'}
                                    options={c.options || []}
                                    correctAnswer={String(c.answer ?? c.correctAnswer ?? '')}
                                    explanation={c.explanation}
                                    imageUrl={img}
                                    onAnswer={handleInteractiveAnswer}
                                />
                            </ScrollView>
                        ) : isTrueFalse ? (
                            <ScrollView contentContainerStyle={styles.scrollCardInner} keyboardShouldPersistTaps="handled">
                                <TrueFalseCard
                                    statement={c.statement || c.question || c.text || 'Önerme eksik'}
                                    correctAnswer={resolveTrueFalseAnswer(c)}
                                    explanation={c.explanation}
                                    imageUrl={img}
                                    onAnswer={handleInteractiveAnswer}
                                />
                            </ScrollView>
                        ) : isGap ? (
                            <ScrollView contentContainerStyle={styles.scrollCardInner} keyboardShouldPersistTaps="handled">
                                <GapCard
                                    text={c.text || c.question || ''}
                                    answers={c.answers || (c.answer ? [String(c.answer)] : [])}
                                    explanation={c.explanation}
                                    imageUrl={img}
                                    onAnswer={handleInteractiveAnswer}
                                />
                            </ScrollView>
                        ) : (
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <GestureDetector gesture={panGesture}>
                                    <Animated.View style={swipeCardStyle}>
                                        <TouchableOpacity activeOpacity={0.96} onPress={handleFlip} style={styles.flashcard}>
                                            <Animated.View style={[styles.cardFace, frontAnimStyle]}>
                                                <View style={styles.label}>
                                                    <Text style={styles.labelText}>{t('study.question', language)}</Text>
                                                </View>
                                                {hasValidImage && (
                                                    <View style={styles.cardImageWrap}>
                                                        <Image source={{ uri: img }} style={styles.cardImage} resizeMode="contain" />
                                                    </View>
                                                )}
                                                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                                                    <NativeRichText
                                                        text={String(c.front || c.question || c.content || 'Soru yok')}
                                                        style={styles.cardText}
                                                    />
                                                </ScrollView>
                                                <View style={styles.tapHint}>
                                                    <Ionicons name="sync-outline" size={14} color="#71717A" />
                                                    <Text style={styles.tapHintText}>{t('study.tapToFlip', language)}</Text>
                                                </View>
                                            </Animated.View>

                                            <Animated.View style={[styles.cardFace, styles.cardFaceBack, backAnimStyle]}>
                                                <View style={[styles.label, { borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                                                    <Text style={[styles.labelText, { color: '#38BDF8' }]}>
                                                        {t('study.answer', language)}
                                                    </Text>
                                                </View>
                                                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                                                    <NativeRichText
                                                        text={String(c.back || c.answer || 'Cevap yok')}
                                                        style={styles.cardText}
                                                    />
                                                </ScrollView>
                                                <View style={styles.tapHint}>
                                                    <Ionicons name="sync-outline" size={14} color="#38BDF8" />
                                                    <Text style={[styles.tapHintText, { color: '#38BDF8' }]}>
                                                        {t('study.swipeHint', language)}
                                                    </Text>
                                                </View>
                                            </Animated.View>

                                            <Animated.View style={[styles.swipeTagRight, rightOverlayStyle]} pointerEvents="none">
                                                <Text style={styles.swipeTagRightText}>İyi</Text>
                                            </Animated.View>
                                            <Animated.View style={[styles.swipeTagLeft, leftOverlayStyle]} pointerEvents="none">
                                                <Text style={styles.swipeTagLeftText}>Tekrar</Text>
                                            </Animated.View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                </GestureDetector>
                            </View>
                        )}
                    </Animated.View>
                </View>

                <View style={styles.controls}>
                    {isFlashcard && showAnswer ? (
                        <View style={styles.sm2Grid}>
                            {SM2_BUTTONS.map((btn) => (
                                <TouchableOpacity
                                    key={btn.quality}
                                    onPress={() => gradeFlashcard(btn.quality)}
                                    style={[styles.sm2Btn, { backgroundColor: btn.bg, borderColor: btn.border }]}
                                >
                                    <Text style={[styles.sm2BtnText, { color: btn.color }]}>
                                        {t(btn.key as any, language) || btn.fallback}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : isFlashcard ? (
                        <TouchableOpacity onPress={handleFlip} activeOpacity={0.8} style={styles.nextBtn}>
                            <Text style={styles.nextBtnText}>{t('study.showAnswer', language) || 'Cevabı Göster'}</Text>
                            <Ionicons name="eye-outline" size={18} color="#09090B" />
                        </TouchableOpacity>
                    ) : showAnswer ? (
                        <TouchableOpacity onPress={advanceCard} activeOpacity={0.8} style={styles.nextBtn}>
                            <Text style={styles.nextBtnText}>
                                {currentIndex === studyModule.items.length - 1 ? 'Bitir' : 'Sıradaki'}
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color="#09090B" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#09090B' },
    centerScreen: {
        flex: 1, backgroundColor: '#09090B', justifyContent: 'center',
        alignItems: 'center', paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    },
    closeBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#121215',
        borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
    moduleTitle: { color: '#A1A1AA', fontSize: 12, fontWeight: '700', marginBottom: 6 },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    progressTrack: {
        height: 4, width: 76, backgroundColor: '#27272A', borderRadius: 99, overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: '#38BDF8', borderRadius: 99 },
    progressText: { color: '#71717A', fontSize: 11, fontWeight: '600' },
    timerBadge: { color: '#38BDF8', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
    cardArea: { flex: 1, paddingHorizontal: 18 },
    scrollCardInner: { flexGrow: 1, justifyContent: 'center', paddingVertical: 12 },
    flashcard: {
        width: '100%', minHeight: 420, borderRadius: 28,
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A', overflow: 'hidden',
    },
    cardFace: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'space-between', alignItems: 'center', padding: 26,
        backfaceVisibility: 'hidden', backgroundColor: '#121215',
    },
    cardFaceBack: { backgroundColor: '#141418' },
    label: {
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99,
        backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A',
    },
    labelText: { color: '#A1A1AA', fontWeight: '700', fontSize: 11 },
    cardImageWrap: {
        width: '100%', height: 130, borderRadius: 12, backgroundColor: '#18181B',
        overflow: 'hidden', marginTop: 10,
    },
    cardImage: { width: '100%', height: '100%' },
    cardText: {
        color: '#F4F4F5', fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 31,
    },
    tapHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tapHintText: { color: '#71717A', fontSize: 12, fontWeight: '500' },
    swipeTagRight: {
        position: 'absolute', top: 22, left: 22, paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 10, borderWidth: 1.5, borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.16)',
    },
    swipeTagRightText: { color: '#38BDF8', fontWeight: '800', fontSize: 13 },
    swipeTagLeft: {
        position: 'absolute', top: 22, right: 22, paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 10, borderWidth: 1.5, borderColor: '#FB7185', backgroundColor: 'rgba(244, 63, 94, 0.16)',
    },
    swipeTagLeftText: { color: '#FB7185', fontWeight: '800', fontSize: 13 },
    controls: {
        paddingHorizontal: 18, paddingBottom: 30, paddingTop: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    },
    sm2Grid: { flex: 1, flexDirection: 'row', gap: 6 },
    sm2Btn: {
        flex: 1, height: 48, borderRadius: 14, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    sm2BtnText: { fontSize: 12, fontWeight: '700' },
    nextBtn: {
        backgroundColor: '#38BDF8', paddingHorizontal: 28, height: 48, borderRadius: 24,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    nextBtnText: { color: '#09090B', fontWeight: '700', fontSize: 14 },
    iconCircle: {
        width: 82, height: 82, borderRadius: 28, backgroundColor: '#121215',
        borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    },
    emptyTitle: { color: '#F4F4F5', fontSize: 22, fontWeight: '800', marginBottom: 8 },
    emptyDesc: { color: '#A1A1AA', fontSize: 14, textAlign: 'center', marginBottom: 24 },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#121215',
        borderWidth: 1, borderColor: '#27272A', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 14,
    },
    backBtnText: { color: '#F4F4F5', fontWeight: '700', fontSize: 14 },
    sessionTitle: { color: '#F4F4F5', fontSize: 24, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
    sessionSub: { color: '#A1A1AA', fontSize: 14, marginBottom: 22, textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 24 },
    statBox: {
        flex: 1, backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A',
        borderRadius: 16, padding: 14, alignItems: 'center',
    },
    statVal: { color: '#F4F4F5', fontSize: 20, fontWeight: '800', marginBottom: 4 },
    statLbl: { color: '#71717A', fontSize: 12, fontWeight: '600' },
    doneBtn: {
        width: '100%', backgroundColor: '#38BDF8', paddingVertical: 16, borderRadius: 16, alignItems: 'center',
    },
    doneBtnText: { color: '#09090B', fontWeight: '700', fontSize: 15 },
});
