import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet, StatusBar } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, Layout, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { t } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';

const { width } = Dimensions.get('window');

export default function DailyStudyScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    
    const [studyModule, setStudyModule] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [sessionComplete, setSessionComplete] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);

    useEffect(() => {
        const initStudy = async () => {
            try {
                // Start Daily Session
                const sessionRes = await api.post('/mobile/study/start-daily');
                
                if (sessionRes.data.items && sessionRes.data.items.length > 0) {
                    setStudyModule({
                        title: t('dashboard.dailyReview.title', language),
                        items: sessionRes.data.items
                    });
                    setSessionId(sessionRes.data.sessionId);
                    setStartTime(Date.now());
                } else {
                    setError('Tekrar edilecek kart bulunamadı.');
                }
            } catch (err: any) {
                console.error('[DailyStudyScreen] Failed to initialize daily study:', err);
                let msg = 'Bir hata oluştu.';
                if (err?.response?.data?.error) {
                    msg = err.response.data.error;
                }
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        initStudy();
    }, []);

    const handleFlip = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowAnswer(prev => !prev); // Functional update — dependency sorununu önler
    }, []);

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
            }).catch(err => console.error('[DailyStudyScreen] Failed to log result:', err));
        }

        if (currentIndex < (studyModule?.items?.length || 0) - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
            setStartTime(Date.now());
        } else {
            // Son kart — sonuç ekranı göster
            setSessionComplete(true);
        }
    }, [currentIndex, studyModule, sessionId, startTime]);

    const prevCard = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowAnswer(false);
        }
    }, [currentIndex]);

    if (loading) {
        return (
            <Screen style={{ backgroundColor: '#050A14', justifyContent: 'center', alignItems: 'center' }}>
                <BrandLoader size="lg" label={t('common.loading', language)} />
            </Screen>
        );
    }

    if (error || !studyModule || !studyModule.items || studyModule.items.length === 0) {
        return (
            <Screen style={{ backgroundColor: '#050A14', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                <MaterialIcons name="psychology" size={64} color="#06B6D4" style={{ marginBottom: 20, opacity: 0.5 }} />
                <Text style={{ color: '#F8FAFC', fontSize: 24, textAlign: 'center', marginBottom: 8, fontWeight: '800' }}>Harika İş Çıkardın!</Text>
                <Text style={{ color: '#64748B', textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
                    {error || 'Bugün için tekrar edilecek kart kalmadı.'}
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ paddingHorizontal: 32, paddingVertical: 16, backgroundColor: '#090F1D', borderRadius: 16, borderWidth: 1, borderColor: '#182234', flexDirection: 'row', alignItems: 'center' }}
                >
                    <MaterialIcons name="arrow-back" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>Ana Ekrana Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    // ─── Sonuç Ekranı ──────────────────────────────────────────────────────
    if (sessionComplete) {
        const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
        const accentColor = accuracy >= 80 ? '#10B981' : accuracy >= 50 ? '#F59E0B' : '#EF4444';

        return (
            <Screen style={{ backgroundColor: '#050A14', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                <StatusBar barStyle="light-content" />
                <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', width: '100%' }}>
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
                        Günlük tekrar tamamlandı
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 40 }}>
                        <View style={{ flex: 1, backgroundColor: '#090F1D', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#182234' }}>
                            <Text style={{ color: accentColor, fontSize: 28, fontWeight: '900', marginBottom: 4 }}>{accuracy}%</Text>
                            <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>Doğruluk</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#090F1D', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#182234' }}>
                            <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '900', marginBottom: 4 }}>{correctCount}</Text>
                            <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>Doğru</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ width: '100%', backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
                    >
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Ana Ekrana Dön</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Screen>
        );
    }

    const currentItem = studyModule.items[currentIndex];
    const isFlashcard = currentItem.type === 'FLASHCARD' || currentItem.type === 'question' || currentItem.type === 'MC';
    const progress = ((currentIndex + 1) / studyModule.items.length) * 100;

    return (
        <Screen style={{ backgroundColor: '#050A14' }}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.back();
                    }}
                    style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#090F1D', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#182234' }}
                >
                    <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>

                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 12 }}>
                    <Text style={{ color: '#00D2FF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 8 }}>
                        {studyModule.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ height: 4, width: 80, backgroundColor: '#182234', borderRadius: 2, overflow: 'hidden', marginRight: 8 }}>
                            <View style={{ height: '100%', backgroundColor: '#3B82F6', borderRadius: 2, width: `${progress}%` }} />
                        </View>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' }}>
                            {currentIndex + 1} / {studyModule.items.length}
                        </Text>
                    </View>
                </View>

                <View style={{ width: 44, height: 44 }} />
            </View>

            {/* Background Glow */}
            <View
                style={{ position: 'absolute', top: '20%', left: '-20%', width: '120%', height: '50%', borderRadius: 999, opacity: 0.08, backgroundColor: showAnswer ? '#A855F7' : '#00D2FF', transform: [{ scale: 1.2 }] }}
            />

            {/* Main Content Area */}
            <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
                <Animated.View
                    key={currentIndex}
                    entering={SlideInRight.duration(400)}
                    exiting={SlideOutLeft.duration(400)}
                    layout={Layout.springify()}
                    style={{ width: '100%' }}
                >
                    <TouchableOpacity
                        activeOpacity={0.95}
                        onPress={() => isFlashcard ? handleFlip() : null}
                        style={{ width: '100%', minHeight: 440, borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: '#182234', padding: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.8)', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 30 }}
                    >
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.03)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />

                        {isFlashcard ? (
                            <Animated.View
                                key={showAnswer ? 'answer' : 'question'}
                                entering={FadeIn.duration(300)}
                                style={{ width: '100%', flex: 1, justifyContent: 'center', alignItems: 'center' }}
                            >
                                <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginBottom: 32, borderWidth: 1, backgroundColor: showAnswer ? 'rgba(168, 85, 247, 0.1)' : 'rgba(0, 210, 255, 0.1)', borderColor: showAnswer ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 210, 255, 0.2)' }}>
                                    <Text style={{ color: showAnswer ? '#A855F7' : '#00D2FF', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 4 }}>
                                        {showAnswer ? 'CEVAP' : 'SORU'}
                                    </Text>
                                </View>

                                <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, lineHeight: 40 }}>
                                    {showAnswer
                                        ? (currentItem.content.answer || currentItem.content.content || currentItem.content.correctAnswer)
                                        : (currentItem.content.question || 'Soru eksik')}
                                </Text>

                                {!showAnswer && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 48, opacity: 0.3 }}>
                                        <MaterialIcons name="touch-app" size={16} color="white" />
                                        <Text style={{ color: 'white', fontSize: 11, fontWeight: '700', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Çevirmek için dokun</Text>
                                    </View>
                                )}
                            </Animated.View>
                        ) : (
                            <ScrollView
                                style={{ width: '100%', flex: 1 }}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: 20 }}
                            >
                                <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginBottom: 24, borderWidth: 1, alignSelf: 'flex-start', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                    <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 4 }}>NOT</Text>
                                </View>
                                <Text style={{ color: '#F8FAFC', fontSize: 22, fontWeight: '700', lineHeight: 36, letterSpacing: -0.3 }}>
                                    {currentItem.content.content || 'İçerik eksik'}
                                </Text>
                            </ScrollView>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Bottom Controls */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity
                    onPress={prevCard}
                    disabled={currentIndex === 0}
                    style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#090F1D', borderWidth: 1, borderColor: '#182234', alignItems: 'center', justifyContent: 'center', opacity: currentIndex === 0 ? 0.25 : 1 }}
                >
                    <MaterialIcons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>

                {isFlashcard && showAnswer ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity
                            onPress={() => nextCard(1)}
                            style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <MaterialIcons name="close" size={26} color="#EF4444" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => nextCard(3)}
                            style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <MaterialIcons name="remove" size={24} color="#F59E0B" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => nextCard(5)}
                            style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <MaterialIcons name="done-all" size={32} color="#10B981" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => nextCard(3)}
                        activeOpacity={0.8}
                        style={{ backgroundColor: '#3B82F6', paddingHorizontal: 28, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }}
                    >
                        <Text style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 }}>
                            {currentIndex === (studyModule?.items?.length || 1) - 1 ? 'BİTİR' : 'SIRADAKİ'}
                        </Text>
                        <MaterialIcons name="arrow-forward" size={24} color="white" />
                    </TouchableOpacity>
                )}

                <View style={{ width: 56, height: 56 }} />
            </View>
        </Screen>
    );
}
