import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import { NativeRichText } from '@/components/ui/rich-math-text';

interface TrueFalseCardProps {
    statement: string;
    correctAnswer: boolean;
    explanation?: string;
    imageUrl?: string;
    onAnswer: (isCorrect: boolean) => void;
}

export function TrueFalseCard({ statement, correctAnswer, explanation, imageUrl, onAnswer }: TrueFalseCardProps) {
    const { language } = useLanguage();
    const [selected, setSelected] = useState<boolean | null>(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        setSelected(null);
        setRevealed(false);
    }, [statement, correctAnswer]);

    const handleSelect = useCallback(
        (value: boolean) => {
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
        },
        [revealed, correctAnswer, onAnswer]
    );

    const getButtonStyle = (value: boolean) => {
        if (!revealed) return styles.choiceBtn;
        if (value === correctAnswer) return styles.choiceBtnCorrect;
        if (value === selected) return styles.choiceBtnWrong;
        return [styles.choiceBtn, { opacity: 0.4 }];
    };

    const getTextColor = (value: boolean) => {
        if (!revealed) return '#F4F4F5';
        if (value === correctAnswer) return '#10B981';
        if (value === selected) return '#EF4444';
        return '#52525B';
    };

    const trueLabel = t('study.true', language);
    const falseLabel = t('study.false', language);
    const hasValidImage = Boolean(imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('http')));

    return (
        <View style={styles.container}>
            <View style={styles.label}>
                <Text style={styles.labelText}>{trueLabel} / {falseLabel}</Text>
            </View>

            {hasValidImage && (
                <View style={styles.imageWrap}>
                    <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="contain" />
                </View>
            )}

            <View style={styles.statementBox}>
                <NativeRichText text={statement} style={styles.statementText} />
            </View>

            <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.choiceRow}>
                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleSelect(true)}
                    disabled={revealed}
                    style={getButtonStyle(true)}
                >
                    <MaterialIcons
                        name={revealed && correctAnswer === true ? 'check-circle' : 'check'}
                        size={26}
                        color={getTextColor(true)}
                    />
                    <Text style={[styles.choiceText, { color: getTextColor(true) }]}>{trueLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleSelect(false)}
                    disabled={revealed}
                    style={getButtonStyle(false)}
                >
                    <MaterialIcons
                        name={revealed && correctAnswer === false ? 'check-circle' : 'close'}
                        size={26}
                        color={getTextColor(false)}
                    />
                    <Text style={[styles.choiceText, { color: getTextColor(false) }]}>{falseLabel}</Text>
                </TouchableOpacity>
            </Animated.View>

            {revealed && (
                <Animated.View entering={FadeIn.duration(250)} style={styles.resultBadge}>
                    <MaterialIcons
                        name={selected === correctAnswer ? 'emoji-events' : 'info-outline'}
                        size={18}
                        color={selected === correctAnswer ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.resultText, { color: selected === correctAnswer ? '#10B981' : '#EF4444' }]}>
                        {selected === correctAnswer
                            ? t('study.correct', language)
                            : t('study.wrong', language, { answer: correctAnswer ? trueLabel : falseLabel })}
                    </Text>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    label: {
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
    statementBox: {
        width: '100%',
        marginBottom: 24,
        alignItems: 'center',
    },
    statementText: {
        color: '#F4F4F5',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 29,
    },
    choiceRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    choiceBtn: {
        flex: 1,
        paddingVertical: 24,
        borderRadius: 18,
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    choiceBtnCorrect: {
        flex: 1,
        paddingVertical: 24,
        borderRadius: 18,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 1.5,
        borderColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    choiceBtnWrong: {
        flex: 1,
        paddingVertical: 24,
        borderRadius: 18,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderWidth: 1.5,
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
        marginTop: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    resultText: {
        fontSize: 14,
        fontWeight: '600',
    },
    explanationBox: {
        width: '100%',
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
});
