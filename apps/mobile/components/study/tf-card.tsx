import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface TrueFalseCardProps {
    statement: string;
    correctAnswer: boolean; // true = Doğru, false = Yanlış
    explanation?: string;
    onAnswer: (isCorrect: boolean) => void;
}

export function TrueFalseCard({ statement, correctAnswer, explanation, onAnswer }: TrueFalseCardProps) {
    const [selected, setSelected] = useState<boolean | null>(null);
    const [revealed, setRevealed] = useState(false);

    const handleSelect = useCallback((value: boolean) => {
        if (revealed) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelected(value);
        setRevealed(true);

        const isCorrect = value === correctAnswer;
        if (isCorrect) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        onAnswer(isCorrect);
    }, [revealed, correctAnswer, onAnswer]);

    const getButtonStyle = (value: boolean) => {
        if (!revealed) return styles.choiceBtn;
        if (value === correctAnswer) return styles.choiceBtnCorrect;
        if (value === selected) return styles.choiceBtnWrong;
        return [styles.choiceBtn, { opacity: 0.4 }];
    };

    const getTextColor = (value: boolean) => {
        if (!revealed) return '#F8FAFC';
        if (value === correctAnswer) return '#10B981';
        if (value === selected) return '#EF4444';
        return '#475569';
    };

    return (
        <View style={styles.container}>
            {/* Etiket */}
            <View style={styles.label}>
                <Text style={styles.labelText}>DOĞRU / YANLIŞ</Text>
            </View>

            {/* Önerme Metni */}
            <Text style={styles.statementText}>{statement}</Text>

            {/* Seçim Butonları */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.choiceRow}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSelect(true)}
                    disabled={revealed}
                    style={getButtonStyle(true)}
                >
                    <MaterialIcons
                        name={revealed && true === correctAnswer ? 'check-circle' : 'check'}
                        size={28}
                        color={getTextColor(true)}
                    />
                    <Text style={[styles.choiceText, { color: getTextColor(true) }]}>Doğru</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSelect(false)}
                    disabled={revealed}
                    style={getButtonStyle(false)}
                >
                    <MaterialIcons
                        name={revealed && false === correctAnswer ? 'check-circle' : 'close'}
                        size={28}
                        color={getTextColor(false)}
                    />
                    <Text style={[styles.choiceText, { color: getTextColor(false) }]}>Yanlış</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Sonuç göstergesi */}
            {revealed && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.resultBadge}>
                    <MaterialIcons
                        name={selected === correctAnswer ? 'emoji-events' : 'info-outline'}
                        size={18}
                        color={selected === correctAnswer ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.resultText, { color: selected === correctAnswer ? '#10B981' : '#EF4444' }]}>
                        {selected === correctAnswer ? 'Doğru cevap!' : `Yanlış — Doğru cevap: ${correctAnswer ? 'Doğru' : 'Yanlış'}`}
                    </Text>
                </Animated.View>
            )}

            {/* Açıklama */}
            {revealed && explanation && (
                <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.explanationBox}>
                    <MaterialIcons name="lightbulb-outline" size={16} color="#F59E0B" />
                    <Text style={styles.explanationText}>{explanation}</Text>
                </Animated.View>
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
    statementText: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 32,
        letterSpacing: -0.3,
        marginBottom: 40,
        paddingHorizontal: 8,
    },
    choiceRow: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    choiceBtn: {
        flex: 1,
        paddingVertical: 28,
        borderRadius: 20,
        backgroundColor: '#0F0F0F',
        borderWidth: 1,
        borderColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    choiceBtnCorrect: {
        flex: 1,
        paddingVertical: 28,
        borderRadius: 20,
        backgroundColor: '#052E16',
        borderWidth: 1,
        borderColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    choiceBtnWrong: {
        flex: 1,
        paddingVertical: 28,
        borderRadius: 20,
        backgroundColor: '#1C0A0A',
        borderWidth: 1,
        borderColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    choiceText: {
        fontSize: 16,
        fontWeight: '700',
    },
    resultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
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
    explanationBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#1A1400',
        borderWidth: 1,
        borderColor: '#422006',
        width: '100%',
    },
    explanationText: {
        color: '#FCD34D',
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 20,
        flex: 1,
    },
});
