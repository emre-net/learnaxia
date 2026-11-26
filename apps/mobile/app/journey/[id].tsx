import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet, Alert } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight, Layout, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { t, resolveTrueFalseAnswer } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import { NativeRichText } from '@/components/ui/rich-math-text';
import api from '@/lib/api';

interface JourneySlide {
    id?: string;
    title: string;
    content: string;
    order?: number;
    peekingQuestion?: {
        question: string;
        options?: string[];
        answer?: string | boolean;
        explanation?: string;
    } | null;
}

interface SyllabusItem {
    order: number;
    title: string;
    overview?: string;
    estimatedMinutes?: number;
}

interface Journey {
    id: string;
    title: string;
    topic?: string;
    depth?: string;
    status?: string;
    syllabus?: SyllabusItem[];
    slides: JourneySlide[];
}

function StorySegment({ state, flex }: { state: 'done' | 'active' | 'empty'; flex: number }) {
    const fillWidth = useSharedValue(state === 'done' ? 100 : 0);

    useEffect(() => {
        if (state === 'active') {
            fillWidth.value = withTiming(100, { duration: 350 });
        } else if (state === 'done') {
            fillWidth.value = 100;
        } else {
            fillWidth.value = 0;
        }
    }, [state]);

    const fillStyle = useAnimatedStyle(() => ({
        width: `${fillWidth.value}%` as any,
    }));

    return (
        <View style={[styles.storySegment, { flex }]}>
            <Animated.View style={[styles.storySegmentFill, fillStyle]} />
        </View>
    );
}

export default function JourneyPlayerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { language } = useLanguage();
    const [journey, setJourney] = useState<Journey | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [generatingSlide, setGeneratingSlide] = useState(false);
    const [slideGenError, setSlideGenError] = useState(false);
    const [retryTrigger, setRetryTrigger] = useState(0);

    // Interactive peeking question state per slide
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [revealedExplanations, setRevealedExplanations] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchJourney = async () => {
            try {
                const response = await api.get(`/mobile/journeys/${id}`);
                const loaded: Journey = response.data.journey;
                setJourney(loaded);
                setIsOwner(Boolean(response.data.isOwner));
                const savedIdx = typeof response.data.lastSlideIndex === 'number' ? response.data.lastSlideIndex : 0;
                if (loaded?.slides?.length > 0) {
                    setCurrentIndex(Math.min(Math.max(savedIdx, 0), loaded.slides.length - 1));
                }
            } catch (error) {
                if (__DEV__) console.error('[JourneyPlayer] Failed to fetch journey:', error);
                setFetchError(true);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchJourney();
    }, [id]);

    // Live AI Slide Orchestrator for Mobile
    useEffect(() => {
        let isMounted = true;
        if (!journey || !journey.syllabus || journey.syllabus.length === 0) return;

        const currentSlidesCount = journey.slides?.length || 0;
        const totalExpected = journey.syllabus.length;

        if (currentSlidesCount >= totalExpected) {
            if (journey.status === 'GENERATING') {
                api.post('/ai/learning-path/complete', { journeyId: journey.id }).catch(() => {});
            }
            return;
        }

        const nextSyllabusItem = journey.syllabus[currentSlidesCount];
        if (!nextSyllabusItem) return;

        const generateNext = async () => {
            setGeneratingSlide(true);
            setSlideGenError(false);
            try {
                const res = await api.post('/ai/learning-path/generate-slide', {
                    journeyId: journey.id,
                    topic: journey.topic || journey.title,
                    depth: journey.depth || 'standard',
                    language: language || 'tr',
                    item: nextSyllabusItem,
                });

                if (res.data?.slide && isMounted) {
                    setJourney((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  slides: [...prev.slides, res.data.slide],
                              }
                            : prev
                    );
                }
            } catch {
                if (isMounted) setSlideGenError(true);
            } finally {
                if (isMounted) setGeneratingSlide(false);
            }
        };

        generateNext();

        return () => {
            isMounted = false;
        };
    }, [journey?.id, journey?.slides?.length, journey?.status, language, retryTrigger]);

    const nextSlide = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!journey) return;

        const nextIdx = currentIndex < journey.slides.length - 1 ? currentIndex + 1 : currentIndex;
        api.post(`/mobile/journeys/${id}/progress`, { slideIndex: nextIdx }).catch(() => {});

        if (currentIndex < journey.slides.length - 1) {
            setCurrentIndex(nextIdx);
        } else {
            api.post(`/mobile/journeys/${id}/complete`).catch(() => {});
            router.back();
        }
    }, [currentIndex, journey, router, id]);

    const prevSlide = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    }, [currentIndex]);

    const handleDeleteJourney = () => {
        if (!id || !isOwner) return;
        Alert.alert(
            'Rotayı Sil',
            'Bu öğrenme rotasını kalıcı olarak silmek istediğinizden emin misiniz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/mobile/journeys/${id}`);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.back();
                        } catch {
                            Alert.alert('Hata', 'Rota silinemedi.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <Screen style={styles.centered}>
                <BrandLoader size="lg" label={t('common.loading', language)} />
            </Screen>
        );
    }

    if (!fetchError && journey && (!journey.slides || journey.slides.length === 0) && (journey.syllabus?.length || 0) > 0) {
        return (
            <Screen style={styles.centered}>
                {slideGenError ? (
                    <>
                        <Ionicons name="alert-circle-outline" size={44} color="#F59E0B" style={{ marginBottom: 12 }} />
                        <Text style={styles.errorTitle}>İlk Slayt Üretilemedi</Text>
                        <Text style={styles.errorDesc}>Bağlantı kesintisi yaşanmış olabilir.</Text>
                        <TouchableOpacity
                            onPress={() => setRetryTrigger((c) => c + 1)}
                            style={[styles.backButton, { borderColor: '#38BDF8' }]}
                        >
                            <Ionicons name="refresh" size={18} color="#38BDF8" />
                            <Text style={[styles.backButtonText, { color: '#38BDF8' }]}>Tekrar Dene</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <BrandLoader size="lg" label="Yapay zeka rotanızı hazırlıyor..." />
                        <Text style={[styles.errorDesc, { marginTop: 12 }]}>
                            İlk adım oluşturuluyor, lütfen bekleyin...
                        </Text>
                    </>
                )}
            </Screen>
        );
    }

    if (fetchError || !journey || !journey.slides || journey.slides.length === 0) {
        return (
            <Screen style={styles.centered}>
                <View style={styles.errorIconWrapper}>
                    <Ionicons
                        name={fetchError ? 'wifi-outline' : 'document-text-outline'}
                        size={32}
                        color="#71717A"
                    />
                </View>
                <Text style={styles.errorTitle}>
                    {fetchError ? 'Yolculuk Yüklenemedi' : 'Yolculuk İçeriği Bulunamadı'}
                </Text>
                <Text style={styles.errorDesc}>
                    {fetchError ? 'İnternet bağlantınızı kontrol edin' : 'Bu yolculuğa henüz içerik eklenmemiş'}
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={18} color="#F4F4F5" />
                    <Text style={styles.backButtonText}>Geri Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    const currentSlide = journey.slides[currentIndex];
    const peeking = currentSlide.peekingQuestion;
    const selectedAnswer = selectedAnswers[currentIndex];
    const isRevealed = Boolean(revealedExplanations[currentIndex] || selectedAnswer);

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#09090B" />

            <View style={styles.storyProgressRow}>
                {journey.slides.map((_, i) => (
                    <StorySegment
                        key={i}
                        state={i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'empty'}
                        flex={1}
                    />
                ))}
            </View>

            <View style={styles.headerRow}>
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.back();
                    }}
                    style={styles.iconBtn}
                >
                    <Ionicons name="close" size={22} color="#F4F4F5" />
                </TouchableOpacity>

                <Text style={styles.journeyTitle} numberOfLines={1}>{journey.title}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.progressText}>
                        {currentIndex + 1}/{journey.syllabus?.length || journey.slides.length}
                    </Text>
                    {isOwner && (
                        <TouchableOpacity onPress={handleDeleteJourney} style={styles.iconBtn}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {generatingSlide && (
                <View style={styles.genBanner}>
                    <Ionicons name="sparkles" size={14} color="#38BDF8" />
                    <Text style={styles.genBannerText}>
                        Sonraki adımlar arka planda hazırlanıyor ({journey.slides.length}/{journey.syllabus?.length || journey.slides.length})...
                    </Text>
                </View>
            )}

            {slideGenError && (
                <TouchableOpacity style={styles.retryBanner} onPress={() => setRetryTrigger((c) => c + 1)}>
                    <Ionicons name="refresh" size={14} color="#FBBF24" />
                    <Text style={styles.retryBannerText}>Bir slayt üretilemedi. Tekrar denemek için dokun.</Text>
                </TouchableOpacity>
            )}

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
                <Animated.View
                    key={currentIndex}
                    entering={SlideInRight.duration(350)}
                    exiting={FadeIn.duration(200)}
                    layout={Layout.springify()}
                    style={{ paddingVertical: 20 }}
                >
                    <Text style={styles.slideTitle}>{currentSlide.title}</Text>

                    <View style={styles.slideContentCard}>
                        <NativeRichText text={currentSlide.content || ''} />
                    </View>

                    {peeking && (
                        <View style={styles.peekingCard}>
                            <View style={styles.peekingHeader}>
                                <Ionicons name="sparkles" size={15} color="#38BDF8" />
                                <Text style={styles.peekingBadge}>Mini Kontrol Sorusu</Text>
                            </View>
                            <NativeRichText text={peeking.question} compact />

                            {Array.isArray(peeking.options) && peeking.options.length > 0 ? (
                                <View style={{ gap: 8, marginTop: 12 }}>
                                    {peeking.options.map((opt, idx) => {
                                        const isPicked = selectedAnswer === opt;
                                        const expected = peeking.answer != null ? String(peeking.answer) : '';
                                        const isRight = expected ? opt === expected : false;
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                onPress={() => {
                                                    if (selectedAnswer) return;
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: opt }));
                                                }}
                                                style={[
                                                    styles.peekOption,
                                                    selectedAnswer && isRight && styles.peekOptionRight,
                                                    selectedAnswer && isPicked && !isRight && styles.peekOptionWrong,
                                                ]}
                                            >
                                                <Text style={styles.peekOptionText}>{opt}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() =>
                                        setRevealedExplanations((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }))
                                    }
                                    style={styles.revealBtn}
                                >
                                    <Text style={styles.revealBtnText}>
                                        {isRevealed ? 'Cevabı Gizle' : 'Cevabı Göster'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {isRevealed && (
                                <View style={styles.peekExplanationBox}>
                                    {peeking.answer !== undefined && (
                                        <Text style={styles.peekAnswerLine}>
                                            Doğru Cevap:{' '}
                                            {typeof peeking.answer === 'boolean'
                                                ? (resolveTrueFalseAnswer({ answer: peeking.answer }) ? 'Doğru' : 'Yanlış')
                                                : String(peeking.answer)}
                                        </Text>
                                    )}
                                    {peeking.explanation && (
                                        <NativeRichText text={peeking.explanation} compact />
                                    )}
                                </View>
                            )}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            <View style={styles.controls}>
                <TouchableOpacity
                    onPress={prevSlide}
                    disabled={currentIndex === 0}
                    style={[styles.navBtn, currentIndex === 0 && { opacity: 0.25 }]}
                >
                    <Ionicons name="arrow-back" size={22} color="#F4F4F5" />
                </TouchableOpacity>

                <TouchableOpacity onPress={nextSlide} activeOpacity={0.8} style={styles.nextBtn}>
                    <Text style={styles.nextBtnText}>
                        {currentIndex === journey.slides.length - 1 ? 'Bitir' : 'Sıradaki'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#09090B" />
                </TouchableOpacity>

                <View style={[styles.navBtn, { opacity: 0 }]} />
            </View>
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
    storyProgressRow: {
        flexDirection: 'row',
        gap: 4,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
    },
    storySegment: {
        height: 3,
        backgroundColor: '#27272A',
        borderRadius: 2,
        overflow: 'hidden',
    },
    storySegmentFill: {
        height: '100%',
        backgroundColor: '#38BDF8',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    journeyTitle: {
        flex: 1,
        textAlign: 'center',
        color: '#F4F4F5',
        fontSize: 15,
        fontWeight: '700',
        marginHorizontal: 10,
    },
    progressText: {
        color: '#38BDF8',
        fontSize: 13,
        fontWeight: '700',
    },
    genBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginHorizontal: 20,
        borderRadius: 10,
    },
    genBannerText: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '600',
    },
    retryBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        paddingVertical: 8,
        marginHorizontal: 20,
        borderRadius: 10,
    },
    retryBannerText: {
        color: '#FBBF24',
        fontSize: 12,
        fontWeight: '600',
    },
    slideTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#F4F4F5',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    slideContentCard: {
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
    },
    peekingCard: {
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderRadius: 18,
        padding: 16,
    },
    peekingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    peekingBadge: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
    },
    peekOption: {
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        borderRadius: 12,
        padding: 12,
    },
    peekOptionRight: {
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.14)',
    },
    peekOptionWrong: {
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.14)',
    },
    peekOptionText: {
        color: '#F4F4F5',
        fontSize: 14,
        fontWeight: '600',
    },
    revealBtn: {
        marginTop: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    revealBtnText: {
        color: '#38BDF8',
        fontSize: 13,
        fontWeight: '600',
    },
    peekExplanationBox: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#27272A',
        gap: 6,
    },
    peekAnswerLine: {
        color: '#10B981',
        fontSize: 13,
        fontWeight: '700',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#18181B',
        backgroundColor: '#09090B',
    },
    navBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#38BDF8',
        paddingHorizontal: 28,
        height: 48,
        borderRadius: 24,
    },
    nextBtnText: {
        color: '#09090B',
        fontSize: 15,
        fontWeight: '700',
    },
    errorIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    errorTitle: {
        color: '#F4F4F5',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    errorDesc: {
        color: '#A1A1AA',
        fontSize: 13,
        marginBottom: 24,
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
});
