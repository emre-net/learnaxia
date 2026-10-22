import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface GapCardProps {
    /** Metin: "Türkiye'nin başkenti {{Ankara}}'dır." — {{...}} boşluk yerleri */
    text: string;
    /** Doğru cevaplar sırasıyla */
    answers: string[];
    onAnswer: (isCorrect: boolean) => void;
}

/** {{...}} paternini parse edip segmentlere böler */
function parseGapText(text: string): Array<{ type: 'text' | 'gap'; value: string; index: number }> {
    const regex = /\{\{([^}]+)\}\}/g;
    const segments: Array<{ type: 'text' | 'gap'; value: string; index: number }> = [];
    let lastIndex = 0;
    let gapIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: 'text', value: text.slice(lastIndex, match.index), index: -1 });
        }
        segments.push({ type: 'gap', value: match[1], index: gapIndex });
        gapIndex++;
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        segments.push({ type: 'text', value: text.slice(lastIndex), index: -1 });
    }

    return segments;
}

export function GapCard({ text, answers, onAnswer }: GapCardProps) {
    const segments = useMemo(() => parseGapText(text), [text]);
    const gapCount = segments.filter(s => s.type === 'gap').length;
    const [userAnswers, setUserAnswers] = useState<string[]>(new Array(gapCount).fill(''));
    const [revealed, setRevealed] = useState(false);

    const updateAnswer = useCallback((index: number, value: string) => {
        setUserAnswers(prev => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }, []);

    const handleConfirm = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRevealed(true);

        const allCorrect = answers.every((answer, i) =>
            userAnswers[i]?.trim().toLowerCase() === answer.trim().toLowerCase()
        );

        if (allCorrect) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        onAnswer(allCorrect);
    }, [userAnswers, answers, onAnswer]);

    const isGapCorrect = (index: number): boolean => {
        return userAnswers[index]?.trim().toLowerCase() === answers[index]?.trim().toLowerCase();
    };

    const allFilled = userAnswers.every(a => a.trim().length > 0);

    return (
        <View style={styles.container}>
            {/* Etiket */}
            <View style={styles.label}>
                <Text style={styles.labelText}>BOŞ DOLDURMA</Text>
            </View>

            {/* Cümle + Boşluklar */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.sentenceContainer}>
                <View style={styles.sentenceWrap}>
                    {segments.map((seg, i) => {
                        if (seg.type === 'text') {
                            return (
                                <Text key={i} style={styles.sentenceText}>{seg.value}</Text>
                            );
                        }
                        const gapIdx = seg.index;
                        const borderColor = !revealed
                            ? (userAnswers[gapIdx]?.trim() ? '#2563EB' : '#1E293B')
                            : (isGapCorrect(gapIdx) ? '#10B981' : '#EF4444');

                        return (
                            <View key={i} style={[styles.gapInputContainer, { borderColor }]}>
                                <TextInput
                                    style={styles.gapInput}
                                    placeholder="..."
                                    placeholderTextColor="#475569"
                                    value={revealed && !isGapCorrect(gapIdx) ? answers[gapIdx] : userAnswers[gapIdx]}
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

            {/* Sonuç */}
            {revealed && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.resultRow}>
                    {answers.every((_, i) => isGapCorrect(i)) ? (
                        <>
                            <MaterialIcons name="emoji-events" size={18} color="#10B981" />
                            <Text style={[styles.resultText, { color: '#10B981' }]}>Tüm boşluklar doğru!</Text>
                        </>
                    ) : (
                        <>
                            <MaterialIcons name="info-outline" size={18} color="#EF4444" />
                            <Text style={[styles.resultText, { color: '#EF4444' }]}>
                                {answers.filter((_, i) => isGapCorrect(i)).length}/{answers.length} doğru
                            </Text>
                        </>
                    )}
                </Animated.View>
            )}

            {/* Onayla Butonu */}
            {!revealed && (
                <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={!allFilled}
                    style={[styles.confirmBtn, !allFilled && { opacity: 0.3 }]}
                >
                    <Text style={styles.confirmBtnText}>Cevabı Onayla</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 24,
        paddingVertical: 24,
        alignItems: 'center',
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
    sentenceContainer: {
        width: '100%',
        paddingHorizontal: 8,
    },
    sentenceWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    sentenceText: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '500',
        lineHeight: 36,
    },
    gapInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        paddingBottom: 2,
        minWidth: 80,
    },
    gapInput: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        minWidth: 60,
        paddingVertical: 2,
        flex: 1,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 32,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 99,
        backgroundColor: '#0A0A0A',
        borderWidth: 1,
        borderColor: '#111111',
    },
    resultText: {
        fontSize: 14,
        fontWeight: '600',
    },
    confirmBtn: {
        marginTop: 32,
        width: '100%',
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 99,
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
