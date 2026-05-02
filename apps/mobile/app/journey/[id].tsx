import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import api from '../../lib/api';


export default function JourneyPlayerScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const currentLang = 'tr' as Language;
    
    const [journey, setJourney] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchJourney = async () => {
            try {
                const response = await api.get(`/mobile/journeys/${id}`);
                setJourney(response.data.journey);
            } catch (error) {
                console.error('[JourneyPlayer] Failed to fetch journey:', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchJourney();
    }, [id]);

    const nextSlide = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < journey.slides.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            router.back();
        }
    }, [currentIndex, journey, router]);

    const prevSlide = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    if (loading) {
        return (
            <Screen className="bg-ocean-bg justify-center items-center">
                <BrandLoader size="lg" label="Yolculuk yükleniyor..." />
            </Screen>
        );
    }

    if (!journey || !journey.slides || journey.slides.length === 0) {
        return (
            <Screen className="bg-ocean-bg justify-center items-center px-6">
                <Text className="text-white text-xl text-center mb-6 font-bold">Yolculuk içeriği bulunamadı.</Text>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    className="px-8 py-4 bg-ocean-panel rounded-2xl border border-ocean-border"
                >
                    <Text className="text-white font-bold">Geri Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    const currentSlide = journey.slides[currentIndex];
    const progress = ((currentIndex + 1) / journey.slides.length) * 100;

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
                        {journey.title}
                    </Text>
                    <View className="flex-row items-center justify-center">
                        <View className="h-1 w-20 bg-ocean-border rounded-full overflow-hidden mr-2">
                            <View 
                                className="h-full bg-brand-blue" 
                                style={{ width: `${progress}%` }} 
                            />
                        </View>
                        <Text className="text-white/60 text-[10px] font-bold">
                            {currentIndex + 1} / {journey.slides.length}
                        </Text>
                    </View>
                </View>

                <View className="w-11 h-11 opacity-0" />
            </View>

            {/* Slide Content */}
            <ScrollView className="flex-1 px-6">
                <Animated.View 
                    key={currentIndex}
                    entering={SlideInRight.duration(400)}
                    exiting={FadeIn.duration(200)}
                    layout={Layout.springify()}
                    className="py-10"
                >
                    <Text className="text-white text-3xl font-black mb-8 leading-tight tracking-tight">
                        {currentSlide.title}
                    </Text>
                    
                    <View className="bg-ocean-panel/50 border border-ocean-border/30 rounded-[30px] p-8">
                        <Text className="text-white/80 text-lg leading-8 font-medium">
                            {currentSlide.content}
                        </Text>
                    </View>

                    {currentSlide.peekingQuestion && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            className="mt-8 bg-blue-600/10 border border-blue-500/20 rounded-[30px] p-8"
                        >
                            <View className="flex-row items-center mb-4">
                                <MaterialIcons name="auto-awesome" size={20} color="#00D2FF" />
                                <Text className="text-blue-400 font-black text-xs ml-2 uppercase tracking-[2px]">AI SORUSU</Text>
                            </View>
                            <Text className="text-white text-xl font-bold mb-4">
                                {(currentSlide.peekingQuestion as any).question}
                            </Text>
                            <Text className="text-white/40 text-sm font-bold uppercase tracking-widest">Cevabı görmek için çalışmaya devam et</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Bottom Controls */}
            <View className="px-6 pb-12 pt-6">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={prevSlide}
                        disabled={currentIndex === 0}
                        className={`w-16 h-16 rounded-[24px] items-center justify-center border ${currentIndex === 0 ? 'bg-ocean-bg border-ocean-border opacity-30' : 'bg-ocean-panel border-ocean-border'}`}
                    >
                        <MaterialIcons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={nextSlide}
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
                            {currentIndex === journey.slides.length - 1 ? 'BİTİR' : 'SIRADAKİ'}
                        </Text>
                        <MaterialIcons name="arrow-forward" size={24} color="white" />
                    </TouchableOpacity>

                    <View className="w-16 h-16 opacity-0" />
                </View>
            </View>
        </Screen>
    );
}
