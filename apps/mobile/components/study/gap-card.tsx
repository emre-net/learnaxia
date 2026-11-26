import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { parseGapSegments, evaluateGapAnswers } from '@learnaxia/shared';
import { NativeRichText } from '@/components/ui/rich-math-text';

interface GapCardProps {
    text: string;
    answers: string[];
    explanation?: string;
    imageUrl?: string;
    onAnswer: (isCorrect: boolean) => void;
}

export function GapCard({ text, answers, explanation, imageUrl, onAnswer }: GapCardProps) {
    const parsed = useMemo(() => parseGapSegments(text, answers), [text, answers]);
    const gapCount = useMemo(
        () => Math.max(parsed.answers.length, answers.length),
        [parsed.answers.length, answers.length]
    );
    const expectedAnswers = useMemo(
        () => (parsed.answers.length > 0 ? parsed.answers : answers),
        [parsed.answers, answers]
    );

    const [userAnswers, setUserAnswers] = useState<string[]>(() => new Array(gapCount).fill(''));
    const [revealed, setRevealed] = useState(false);
    const [evalResult, setEvalResult] = useState<{ allCorrect: boolean; perGap: boolean[] } | null>(null);

    useEffect(() => {
        setUserAnswers(new Array(gapCount).fill(''));
        setRevealed(false);
        setEvalResult(null);
    }, [text, gapCount]);

    const updateAnswer = useCallback((index: number, value: string) => {
        setUserAnswers((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (revealed) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const evaluation = evaluateGapAnswers(userAnswers, expectedAnswers);
        setEvalResult(evaluation);
        setRevealed(true);

        if (evaluation.allCorrect) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        onAnswer(evaluation.allCorrect);
    }, [revealed, expectedAnswers, userAnswers, onAnswer]);

    const isGapCorrect = (index: number): boolean => Boolean(evalResult?.perGap?.[index]);
    const allFilled = gapCount > 0 && userAnswers.slice(0, gapCount).every((a) => a.trim().length > 0);
    const hasValidImage = Boolean(imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('http')));

    return (
        <View style={styles.container}>
            <View style={styles.label}>
                <Text style={styles.labelText}>Boşluk Doldurma</Text>
            </View>

            {hasValidImage && (
                <View style={styles.imageWrap}>
                    <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="contain" />
                </View>
            )}

            <Animated.View entering={FadeInDown.duration(350)} style={styles.sentenceContainer}>
                <View style={styles.sentenceWrap}>
                    {parsed.segments.map((seg, i) => {
                        if (seg.type === 'text') {
                            return (
                                <Text key={i} style={styles.sentenceText}>
                                    {seg.content}
                                </Text>
                            );
                        }
                        const gapIdx = seg.gapIndex ?? 0;
                        const borderColor = !revealed
                            ? userAnswers[gapIdx]?.trim()
                                ? '#38BDF8'
                                : '#27272A'
                            : isGapCorrect(gapIdx)
                                ? '#10B981'
                                : '#EF4444';

                        return (
                            <View key={i} style={[styles.gapInputContainer, { borderColor }]}>
                                <TextInput
                                    style={styles.gapInput}
                                    placeholder="..."
                                    placeholderTextColor="#52525B"
                                    value={revealed && !isGapCorrect(gapIdx) ? expectedAnswers[gapIdx] || '' : userAnswers[gapIdx]}
                                    onChangeText={(val) => updateAnswer(gapIdx, val)}
                                    editable={!revealed}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                {revealed && (
                                    <MaterialIcons
                                        name={isGapCorrect(gapIdx) ? 'check' : 'close'}
                                        size={16}
                                        color={isGapCorrect(gapIdx) ? '#10B981' : '#EF4444'}
                                        style={{ marginLeft: 4 }}
                                    />
                                )}
                            </View>
                        );
                    })}
                </View>
            </Animated.View>

            {revealed && evalResult && (
                <Animated.View entering={FadeIn.duration(250)} style={styles.resultRow}>
                    {evalResult.allCorrect ? (
                        <>
                            <MaterialIcons name="check-circle" size={18} color="#10B981" />
                            <Text style={[styles.resultText, { color: '#10B981' }]}>Tüm boşluklar doğru!</Text>
                        </>
                    ) : (
                        <>
                            <MaterialIcons name="info-outline" size={18} color="#F59E0B" />
                            <Text style={[styles.resultText, { color: '#F59E0B' }]}>
                                Doğru cevap: {expectedAnswers.join(', ')}
                            </Text>
                        </>
                    )}
                </Animated.View>
            )}

            {revealed && explanation && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.explanationBox}>
                    <MaterialIcons name="lightbulb-outline" size={16} color="#F59E0B" />
                    <View style={{ flex: 1 }}>
                        <NativeRichText text={explanation} style={styles.explanationText} compact />
                    </View>
                </Animated.View>
            )}

            {!revealed && (
                <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={!allFilled}
                    style={[styles.confirmBtn, !allFilled && { opacity: 0.35 }]}
                >
                    <Text style={styles.confirmBtnText}>Kontrol Et</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    label: {
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 99,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        marginBottom: 18,
    },
    labelText: {
        color: '#38BDF8',
        fontWeight: '700',
        fontSize: 12,
    },
    imageWrap: {
        height: 150,
        width: '100%',
        borderRadius: 14,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        marginBottom: 16,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    sentenceContainer: {
        backgroundColor: '#121215',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    sentenceWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
    },
    sentenceText: {
        color: '#F4F4F5',
        fontSize: 17,
        fontWeight: '500',
        lineHeight: 30,
    },
    gapInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#18181B',
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        minWidth: 92,
    },
    gapInput: {
        color: '#38BDF8',
        fontSize: 15,
        fontWeight: '600',
        minWidth: 68,
        paddingVertical: 2,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    resultText: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    explanationBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.28)',
    },
    explanationText: {
        color: '#FDE68A',
        fontSize: 13,
        lineHeight: 19,
    },
    confirmBtn: {
        marginTop: 22,
        backgroundColor: '#38BDF8',
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#09090B',
        fontSize: 15,
        fontWeight: '700',
    },
});
