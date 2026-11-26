import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeRichText } from '@/components/ui/rich-math-text';

interface MCCardProps {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    imageUrl?: string;
    onAnswer: (isCorrect: boolean) => void;
}

export function MCCard({ question, options, correctAnswer, explanation, imageUrl, onAnswer }: MCCardProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        setSelectedIndex(null);
        setRevealed(false);
    }, [question, correctAnswer]);

    const handleSelect = useCallback(
        (index: number) => {
            if (revealed) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedIndex(index);
        },
        [revealed]
    );

    const handleConfirm = useCallback(() => {
        if (selectedIndex === null || revealed) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRevealed(true);
        const isCorrect = String(options[selectedIndex]) === String(correctAnswer);
        if (isCorrect) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        onAnswer(isCorrect);
    }, [selectedIndex, revealed, options, correctAnswer, onAnswer]);

    const getOptionStyle = (index: number) => {
        if (!revealed) {
            return selectedIndex === index ? styles.optionSelected : styles.option;
        }
        if (String(options[index]) === String(correctAnswer)) return styles.optionCorrect;
        if (index === selectedIndex) return styles.optionWrong;
        return styles.option;
    };

    const getOptionIcon = (index: number): string | null => {
        if (!revealed) return null;
        if (String(options[index]) === String(correctAnswer)) return 'check-circle';
        if (index === selectedIndex) return 'cancel';
        return null;
    };

    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const hasValidImage = Boolean(imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('http')));

    return (
        <View style={styles.container}>
            <View style={styles.label}>
                <Text style={styles.labelText}>Çoktan Seçmeli</Text>
            </View>

            {hasValidImage && (
                <View style={styles.imageWrap}>
                    <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="contain" />
                </View>
            )}

            <View style={styles.questionBox}>
                <NativeRichText text={question} style={styles.questionText} />
            </View>

            <View style={styles.optionsContainer}>
                {options.map((option, index) => (
                    <Animated.View key={index} entering={FadeInDown.delay(index * 60).duration(250)}>
                        <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => handleSelect(index)}
                            disabled={revealed}
                            style={getOptionStyle(index)}
                        >
                            <View style={styles.optionLetterBadge}>
                                <Text style={styles.optionLetter}>{optionLetters[index] || String(index + 1)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <NativeRichText text={String(option)} style={styles.optionText} compact />
                            </View>
                            {getOptionIcon(index) && (
                                <MaterialIcons
                                    name={getOptionIcon(index) as any}
                                    size={20}
                                    color={String(options[index]) === String(correctAnswer) ? '#10B981' : '#EF4444'}
                                    style={{ marginLeft: 8 }}
                                />
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>

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
                    disabled={selectedIndex === null}
                    style={[styles.confirmBtn, selectedIndex === null && { opacity: 0.35 }]}
                >
                    <Text style={styles.confirmBtnText}>Cevabı Onayla</Text>
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
        height: 160,
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
    questionBox: {
        marginBottom: 22,
        alignItems: 'center',
    },
    questionText: {
        color: '#F4F4F5',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 28,
    },
    optionsContainer: {
        gap: 10,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    optionSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderWidth: 1,
        borderColor: '#38BDF8',
    },
    optionCorrect: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    optionWrong: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    optionLetterBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    optionLetter: {
        color: '#A1A1AA',
        fontSize: 13,
        fontWeight: '700',
    },
    optionText: {
        color: '#F4F4F5',
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 21,
    },
    explanationBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 18,
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
