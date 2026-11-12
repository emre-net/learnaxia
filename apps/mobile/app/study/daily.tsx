import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, Dimensions, StyleSheet, StatusBar,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeInDown, Layout, SlideInRight, SlideOutLeft,
    useSharedValue, useAnimatedStyle, withTiming,
    interpolate, Extrapolation
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';
import { MCCard } from '@/components/study/mc-card';
import { TrueFalseCard } from '@/components/study/tf-card';
import { GapCard } from '@/components/study/gap-card';

const { width } = Dimensions.get('window');

type QualityOption = { quality: number; label: string; icon: string; color: string; bgColor: string };

const QUALITY_OPTIONS: QualityOption[] = [
    { quality: 1, label: 'Bilmiyorum', icon: 'close', color: '#EF4444', bgColor: '#1A0A0A' },
    { quality: 3, label: 'Zordu', icon: 'remove', color: '#F59E0B', bgColor: '#1A1400' },
    { quality: 5, label: 'Kolay', icon: 'done-all', color: '#10B981', bgColor: '#0A1A10' },
];

export default function DailyStudyScreen() {
    const router = useRouter();
    const { language } = useLanguage();

    const [studyModule, setStudyModule] = useState<{
        title: string;
        items: Array<{
            id: string;
            type: string;
            content: {
                question?: string; answer?: string; front?: string; back?: string;
                content?: string; correctAnswer?: string; options?: string[];
                explanation?: string; statement?: string; text?: string; answers?: string[];
                isTrue?: boolean;
            };
        }>;
    } | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [sessionComplete, setSessionComplete] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);

    // ─── 3D Flip Animation for Flashcard ─────────────────────────────────────
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
                const sessionRes = await api.post('/mobile/study/start-daily');
                if (sessionRes.data.items && sessionRes.data.items.length > 0) {
                    setStudyModule({
                        title: t('dashboard.dailyReview.title', language) || 'Günlük Tekrar',
                        items: sessionRes.data.items
                    });
                    setSessionId(sessionRes.data.sessionId);
                    setStartTime(Date.now());
                } else {
                    setError('Tekrar edilecek kart bulunamadı.');
                }
            } catch (err: any) {
                console.error('[DailyStudyScreen] Failed to initialize daily study:', err);
                setError(err?.response?.data?.error || 'Günlük tekrar yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        initStudy();
    }, [language]);

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

        if (isCorrect) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        // Log result
        if (sessionId && studyModule?.items?.[currentIndex]) {
            const itemId = studyModule.items[currentIndex].id;
            const durationMs = Date.now() - startTime;
            api.post('/mobile/study/log', {
                sessionId,
                itemId,
                quality,
                durationMs
            }).catch(err => console.error('[DailyStudyScreen] Failed to log result:', err));
        }

        if (currentIndex < (studyModule?.items?.length || 0) - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
            triggerFlip(false);
            setStartTime(Date.now());
        } else {
            setSessionComplete(true);
        }
    }, [currentIndex, sessionId, startTime, studyModule, triggerFlip]);

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
                    <MaterialIcons name="done-all" size={48} color="#10B981" />
                </View>
                <Text style={styles.emptyTitle}>Harika İş Çıkardın!</Text>
                <Text style={styles.emptyDesc}>
                    {error || 'Bugün için tekrar edilecek kart kalmadı.'}
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={18} color="#F8FAFC" style={{ marginRight: 8 }} />
                    <Text style={styles.backBtnText}>Ana Ekrana Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    if (sessionComplete) {
        const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
        return (
            <Screen style={styles.centerScreen}>
                <StatusBar barStyle="light-content" />
                <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', width: '100%', paddingHorizontal: 24 }}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="emoji-events" size={44} color="#38BDF8" />
                    </View>
                    <Text style={styles.sessionTitle}>Günlük Tekrar Tamamlandı!</Text>
                    <Text style={styles.sessionSub}>Bugünkü hedefine başarıyla ulaştın.</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>%{accuracy}</Text>
                            <Text style={styles.statLbl}>Doğruluk</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>{totalAnswered}</Text>
                            <Text style={styles.statLbl}>Toplam</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statVal}>{correctCount}</Text>
                            <Text style={styles.statLbl}>Doğru</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.doneBtn}
                    >
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
    const progress = ((currentIndex + 1) / studyModule.items.length) * 100;

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.back();
                        }}
                        style={styles.closeBtn}
                    >
                        <Ionicons name="close" size={22} color="#F8FAFC" />
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
                        </View>
                    </View>

                    <View style={{ width: 40, height: 40 }} />
                </View>

                {/* Main Content Area */}
                <View style={styles.cardArea}>
                    <Animated.View
                        key={currentIndex}
                        entering={SlideInRight.duration(350)}
                        exiting={SlideOutLeft.duration(350)}
                        layout={Layout.springify()}
                        style={{ width: '100%' }}
                    >
                        {/* MC — Çoktan Seçmeli */}
                        {isMC ? (
                            <View style={[styles.cardWrapper, { justifyContent: 'flex-start' }]}>
                                <MCCard
                                    question={currentItem.content.question || 'Soru eksik'}
                                    options={currentItem.content.options || []}
                                    correctAnswer={currentItem.content.correctAnswer || currentItem.content.answer || ''}
                                    explanation={currentItem.content.explanation}
                                    onAnswer={(isCorrect) => {
                                        setShowAnswer(true);
                                        if (isCorrect) setCorrectCount(prev => prev + 1);
                                        setTotalAnswered(prev => prev + 1);
                                    }}
                                />
                            </View>
                        ) : isTrueFalse ? (
                            /* TRUE_FALSE — Doğru / Yanlış */
                            <View style={[styles.cardWrapper, { justifyContent: 'center' }]}>
                                <TrueFalseCard
                                    statement={currentItem.content.statement || currentItem.content.question || 'Önerme eksik'}
                                    correctAnswer={
                                        typeof currentItem.content.isTrue === 'boolean'
                                            ? currentItem.content.isTrue
                                            : (currentItem.content.answer || currentItem.content.correctAnswer || 'True').toString().toLowerCase() === 'true'
                                    }
                                    explanation={currentItem.content.explanation}
                                    onAnswer={(isCorrect) => {
                                        setShowAnswer(true);
                                        if (isCorrect) setCorrectCount(prev => prev + 1);
                                        setTotalAnswered(prev => prev + 1);
                                    }}
                                />
                            </View>
                        ) : isGap ? (
                            /* GAP — Boşluk Doldurma */
                            <View style={[styles.cardWrapper, { justifyContent: 'center' }]}>
                                <GapCard
                                    text={currentItem.content.text || currentItem.content.question || ''}
                                    answers={currentItem.content.answers || [currentItem.content.answer || '']}
                                    onAnswer={(isCorrect) => {
                                        setShowAnswer(true);
                                        if (isCorrect) setCorrectCount(prev => prev + 1);
                                        setTotalAnswered(prev => prev + 1);
                                    }}
                                />
                            </View>
                        ) : (
                            /* FLASHCARD — 3D Flip */
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={handleFlip}
                                style={[styles.cardWrapper, { transform: [{ perspective: 1200 }] }]}
                            >
                                <View style={{ flex: 1, width: '100%' }}>
                                    {/* Soru Yüzü */}
                                    <Animated.View style={[styles.cardFace, frontAnimStyle]}>
                                        <View style={styles.badgeLabel}>
                                            <Text style={styles.badgeLabelText}>SORU</Text>
                                        </View>
                                        <Text style={styles.cardText}>
                                            {currentItem.content.question || currentItem.content.front || 'Soru eksik'}
                                        </Text>
                                        <View style={styles.tapHint}>
                                            <Ionicons name="hand-right-outline" size={14} color="#64748B" />
                                            <Text style={styles.tapHintText}>Cevap için dokun</Text>
                                        </View>
                                    </Animated.View>

                                    {/* Cevap Yüzü */}
                                    <Animated.View style={[styles.cardFace, backAnimStyle]}>
                                        <View style={[styles.badgeLabel, { backgroundColor: '#111111' }]}>
                                            <Text style={[styles.badgeLabelText, { color: '#10B981' }]}>CEVAP</Text>
                                        </View>
                                        <Text style={[styles.cardText, { color: '#F8FAFC' }]}>
                                            {currentItem.content.answer || currentItem.content.back || 'Cevap eksik'}
                                        </Text>
                                        {currentItem.content.explanation ? (
                                            <Text style={styles.cardExplanation}>{currentItem.content.explanation}</Text>
                                        ) : null}
                                    </Animated.View>
                                </View>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                </View>

                {/* Bottom Controls */}
                <View style={styles.bottomBar}>
                    {isInteractive ? (
                        /* Etkileşimli Kartlar: Doğrudan Sıradaki / Bitir Butonu */
                        <TouchableOpacity
                            onPress={() => nextCard(3)}
                            activeOpacity={0.8}
                            disabled={!showAnswer}
                            style={[
                                styles.nextBtn,
                                !showAnswer && { opacity: 0.35, backgroundColor: '#1E293B' }
                            ]}
                        >
                            <Text style={styles.nextBtnText}>
                                {currentIndex === (studyModule?.items?.length || 1) - 1 ? 'BİTİR' : 'SIRADAKİ'}
                            </Text>
                            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : showAnswer ? (
                        /* Flashcard Çevrildiğinde: SM2 Değerlendirme Butonları */
                        <View style={styles.qualityRow}>
                            {QUALITY_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.quality}
                                    onPress={() => nextCard(opt.quality)}
                                    style={[styles.qualityBtn, { borderColor: `${opt.color}40`, backgroundColor: opt.bgColor }]}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons name={opt.icon as any} size={22} color={opt.color} />
                                    <Text style={[styles.qualityBtnText, { color: opt.color }]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        /* Flashcard Kapalıyken: Çevir Butonu */
                        <TouchableOpacity
                            onPress={handleFlip}
                            activeOpacity={0.8}
                            style={styles.flipBtn}
                        >
                            <Ionicons name="sync-outline" size={18} color="#F8FAFC" style={{ marginRight: 8 }} />
                            <Text style={styles.flipBtnText}>Cevabı Göster</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#000000',
    },
    centerScreen: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyDesc: {
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    backBtn: {
        paddingHorizontal: 28,
        paddingVertical: 14,
        backgroundColor: '#0A0A0A',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#1E293B',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtnText: {
        color: '#F8FAFC',
        fontWeight: '700',
    },
    sessionTitle: {
        color: '#F8FAFC',
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 6,
    },
    sessionSub: {
        color: '#64748B',
        fontSize: 14,
        marginBottom: 32,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 36,
        width: '100%',
    },
    statBox: {
        flex: 1,
        backgroundColor: '#0A0A0A',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    statVal: {
        color: '#38BDF8',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    statLbl: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    doneBtn: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#111111',
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    moduleTitle: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressTrack: {
        height: 4,
        width: 90,
        backgroundColor: '#1E293B',
        borderRadius: 2,
        overflow: 'hidden',
        marginRight: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#38BDF8',
        borderRadius: 2,
    },
    progressText: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '700',
    },
    cardArea: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    cardWrapper: {
        width: '100%',
        minHeight: 380,
        borderRadius: 28,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#1E293B',
        padding: 24,
        alignItems: 'center',
    },
    cardFace: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeLabel: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 99,
        backgroundColor: '#1E293B',
        marginBottom: 24,
    },
    badgeLabelText: {
        color: '#38BDF8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
    },
    cardText: {
        color: '#F8FAFC',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 36,
    },
    cardExplanation: {
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 20,
    },
    tapHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 32,
        opacity: 0.5,
    },
    tapHintText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },
    bottomBar: {
        paddingHorizontal: 20,
        paddingBottom: 32,
        paddingTop: 16,
        alignItems: 'center',
    },
    nextBtn: {
        width: '100%',
        backgroundColor: '#2563EB',
        height: 54,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    nextBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 1,
    },
    qualityRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    qualityBtn: {
        flex: 1,
        height: 60,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    qualityBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    flipBtn: {
        width: '100%',
        backgroundColor: '#0A0A0A',
        height: 54,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flipBtnText: {
        color: '#F8FAFC',
        fontWeight: '700',
        fontSize: 15,
    },
});
