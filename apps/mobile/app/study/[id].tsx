import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet, StatusBar } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeOut, Layout, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Theme as SharedTheme, t, Language } from '@learnaxia/shared';
import api from '../../lib/api';

const { width } = Dimensions.get('window');

export default function StudyScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const currentLang = 'tr' as Language;
    
    const [studyModule, setStudyModule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => {
        const fetchModule = async () => {
            try {
                const response = await api.get(`/mobile/study/${id}`);
                setStudyModule(response.data.module);
            } catch (error) {
                console.error('[StudyScreen] Failed to fetch module:', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchModule();
    }, [id]);

    const handleFlip = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowAnswer(!showAnswer);
    }, [showAnswer]);

    const nextCard = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (currentIndex < studyModule.items.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
        } else {
            router.back();
        }
    }, [currentIndex, studyModule, router]);

    const prevCard = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowAnswer(false);
        }
    }, [currentIndex]);

    if (loading) {
        return (
            <Screen className="bg-ocean-bg justify-center items-center">
                <BrandLoader size="lg" label={t('common.loading', currentLang)} />
            </Screen>
        );
    }

    if (!studyModule || !studyModule.items || studyModule.items.length === 0) {
        return (
            <Screen className="bg-ocean-bg justify-center items-center px-6">
                <Text className="text-white text-xl text-center mb-6 font-bold tracking-tight">Modül içeriği bulunamadı.</Text>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="px-8 py-4 bg-ocean-panel rounded-2xl border border-ocean-border"
                >
                    <Text className="text-white font-bold">Geri Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    const currentItem = studyModule.items[currentIndex];
    const isFlashcard = currentItem.type === 'FLASHCARD' || currentItem.type === 'question';
    const progress = ((currentIndex + 1) / studyModule.items.length) * 100;

    return (
        <Screen className="bg-ocean-bg">
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
                <TouchableOpacity 
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.back();
                    }} 
                    className="w-11 h-11 rounded-xl bg-ocean-panel items-center justify-center border border-ocean-border"
                >
                    <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>
                
                <View className="flex-1 px-4">
                    <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-[10px] font-black uppercase tracking-[4px] text-center mb-1">
                        {studyModule.title}
                    </Text>
                    <View className="flex-row items-center justify-center">
                        <View className="h-1 w-20 bg-ocean-border rounded-full overflow-hidden mr-2">
                            <View 
                                className="h-full bg-brand-blue" 
                                style={{ width: `${progress}%` }} 
                            />
                        </View>
                        <Text className="text-white/60 text-[10px] font-bold">
                            {currentIndex + 1} / {studyModule.items.length}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity className="w-11 h-11 rounded-xl bg-ocean-panel items-center justify-center border border-ocean-border opacity-50">
                    <MaterialIcons name="more-vert" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Background Glow */}
            <View 
                className="absolute top-[20%] left-[-20%] w-[100%] h-[50%] rounded-full opacity-10" 
                style={{ backgroundColor: showAnswer ? '#A855F7' : '#00D2FF', transform: [{ scale: 1.2 }] }} 
            />

            {/* Main Content Area */}
            <View className="flex-1 px-6 justify-center">
                <Animated.View 
                    key={currentIndex}
                    entering={SlideInRight.duration(400)}
                    exiting={SlideOutLeft.duration(400)}
                    layout={Layout.springify()}
                    className="w-full"
                >
                    <TouchableOpacity
                        activeOpacity={0.95}
                        onPress={() => isFlashcard ? handleFlip() : null}
                        className="w-full min-h-[440px] rounded-[40px] overflow-hidden border border-ocean-border p-8 justify-center items-center"
                        style={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            elevation: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 20 },
                            shadowOpacity: 0.4,
                            shadowRadius: 30
                        }}
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
                                className="w-full flex-1 justify-center items-center"
                            >
                                <View 
                                    className="px-4 py-1.5 rounded-full mb-8 border"
                                    style={{ 
                                        backgroundColor: showAnswer ? 'rgba(168, 85, 247, 0.1)' : 'rgba(0, 210, 255, 0.1)',
                                        borderColor: showAnswer ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 210, 255, 0.2)'
                                    }}
                                >
                                    <Text className="font-black text-[10px] uppercase tracking-[4px]" style={{ color: showAnswer ? '#A855F7' : '#00D2FF' }}>
                                        {showAnswer ? 'CEVAP' : 'SORU'}
                                    </Text>
                                </View>
                                
                                <Text 
                                    className="text-white text-3xl font-black text-center tracking-tighter leading-[42px]"
                                    style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 4 } }}
                                >
                                    {showAnswer 
                                        ? (currentItem.content.answer || currentItem.content.content) 
                                        : (currentItem.content.question || 'Soru eksik')}
                                </Text>

                                <View className="mt-12 flex-row items-center opacity-40">
                                    <MaterialIcons name="touch-app" size={16} color="white" />
                                    <Text className="text-white text-xs font-bold ml-2 uppercase tracking-widest">Çevirmek İçin Dokun</Text>
                                </View>
                            </Animated.View>
                        ) : (
                            <ScrollView 
                                className="w-full flex-1" 
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: 20 }}
                            >
                                <View className="px-4 py-1.5 rounded-full mb-6 border bg-brand-emerald/10 border-brand-emerald/20 self-start">
                                    <Text className="text-brand-emerald font-black text-[10px] uppercase tracking-[4px]">NOT</Text>
                                </View>
                                <Text className="text-white text-2xl font-bold leading-10 tracking-tight">
                                    {currentItem.content.content || 'İçerik eksik'}
                                </Text>
                            </ScrollView>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Bottom Controls */}
            <View className="px-6 pb-12 pt-6">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={prevCard}
                        disabled={currentIndex === 0}
                        className={`w-16 h-16 rounded-[24px] items-center justify-center border ${currentIndex === 0 ? 'bg-ocean-bg border-ocean-border opacity-30' : 'bg-ocean-panel border-ocean-border'}`}
                    >
                        <MaterialIcons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>

                    {isFlashcard && showAnswer ? (
                        <View className="flex-row items-center space-x-6 gap-4">
                            <TouchableOpacity 
                                onPress={nextCard} 
                                className="w-20 h-20 rounded-[30px] bg-red-500/10 border border-red-500/20 items-center justify-center"
                            >
                                <MaterialIcons name="close" size={32} color="#EF4444" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                onPress={nextCard} 
                                className="w-24 h-24 rounded-[36px] bg-brand-emerald/10 border border-brand-emerald/20 items-center justify-center"
                                style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.3)' }}
                            >
                                <MaterialIcons name="done-all" size={40} color="#34D399" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={nextCard}
                            activeOpacity={0.8}
                            className="bg-brand-blue px-10 h-16 rounded-[24px] flex-row items-center justify-center"
                            style={{ 
                                elevation: 8,
                                shadowColor: '#3B82F6',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: 0.3,
                                shadowRadius: 20
                            }}
                        >
                            <Text className="text-white font-black uppercase tracking-widest mr-2">
                                {currentIndex === studyModule.items.length - 1 ? 'BİTİR' : 'SIRADAKİ'}
                            </Text>
                            <MaterialIcons name="arrow-forward" size={24} color="white" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={() => {
                             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                             // Bookmark or star functionality
                        }}
                        className="w-16 h-16 rounded-[24px] bg-ocean-panel border border-ocean-border items-center justify-center"
                    >
                        <MaterialIcons name="star-outline" size={28} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    glow: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width,
        top: -width * 0.5,
        left: -width * 0.25,
        opacity: 0.1,
    }
});
