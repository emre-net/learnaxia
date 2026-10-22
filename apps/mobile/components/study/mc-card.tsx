import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface MCCardProps {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    onAnswer: (isCorrect: boolean) => void;
}

export function MCCard({ question, options, correctAnswer, explanation, onAnswer }: MCCardProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);

    const handleSelect = useCallback((index: number) => {
        if (revealed) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedIndex(index);
    }, [revealed]);

    const handleConfirm = useCallback(() => {
        if (selectedIndex === null) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRevealed(true);
        const isCorrect = options[selectedIndex] === correctAnswer;
        if (isCorrect) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        onAnswer(isCorrect);
    }, [selectedIndex, options, correctAnswer, onAnswer]);

    const getOptionStyle = (index: number) => {
        if (!revealed) {
            return selectedIndex === index ? styles.optionSelected : styles.option;
        }
        if (options[index] === correctAnswer) return styles.optionCorrect;
        if (index === selectedIndex) return styles.optionWrong;
        return styles.option;
    };

    const getOptionIcon = (index: number): string | null => {
        if (!revealed) return null;
        if (options[index] === correctAnswer) return 'check-circle';
        if (index === selectedIndex) return 'cancel';
        return null;
    };

    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    return (
        <View style={styles.container}>
            {/* Soru Etiketi */}
            <View style={styles.label}>
                <Text style={styles.labelText}>ÇOKTAN SEÇMELİ</Text>
            </View>

            {/* Soru Metni */}
            <Text style={styles.questionText}>{question}</Text>

            {/* Seçenekler */}
            <View style={styles.optionsContainer}>
                {options.map((option, index) => (
                    <Animated.View
                        key={index}
                        entering={FadeInDown.delay(index * 80).duration(300)}
                    >
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleSelect(index)}
                            disabled={revealed}
                            style={getOptionStyle(index)}
                        >
                            <View style={styles.optionLetterBadge}>
                                <Text style={styles.optionLetter}>{optionLetters[index]}</Text>
                            </View>
                            <Text style={styles.optionText}>{option}</Text>
                            {getOptionIcon(index) && (
                                <MaterialIcons
                                    name={getOptionIcon(index) as any}
                                    size={20}
                                    color={options[index] === correctAnswer ? '#10B981' : '#EF4444'}
                                    style={{ marginLeft: 'auto' }}
                                />
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>

            {/* Açıklama (cevap sonrası) */}
            {revealed && explanation && (
                <Animated.View entering={FadeIn.duration(400)} style={styles.explanationBox}>
                    <MaterialIcons name="lightbulb-outline" size={16} color="#F59E0B" />
                    <Text style={styles.explanationText}>{explanation}</Text>
                </Animated.View>
            )}

            {/* Onayla Butonu */}
            {!revealed && (
                <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={selectedIndex === null}
                    style={[styles.confirmBtn, selectedIndex === null && { opacity: 0.3 }]}
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
    },
    label: {
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 99,
        backgroundColor: '#1E293B',
        marginBottom: 24,
    },
    labelText: {
        color: '#94A3B8',
        fontWeight: '700',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    questionText: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 32,
        letterSpacing: -0.3,
        marginBottom: 32,
    },
    optionsContainer: {
        gap: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: '#0F0F0F',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    optionSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#2563EB',
    },
    optionCorrect: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: '#052E16',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    optionWrong: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: '#1C0A0A',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    optionLetterBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    optionLetter: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '700',
    },
    optionText: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    explanationBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#1A1400',
        borderWidth: 1,
        borderColor: '#422006',
    },
    explanationText: {
        color: '#FCD34D',
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 20,
        flex: 1,
    },
    confirmBtn: {
        marginTop: 24,
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
