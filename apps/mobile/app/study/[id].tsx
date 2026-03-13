import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../lib/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

import { StudyModule, ModuleItem } from '@learnaxia/shared';

export default function StudyScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [studyModule, setStudyModule] = useState<StudyModule | null>(null);
    const [loading, setLoading] = useState(true);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => {
        const fetchModule = async () => {
            try {
                const response = await api.get(`/mobile/study/${id}`);
                setStudyModule(response.data.module);
            } catch (error) {
                console.error('Failed to fetch module', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchModule();
    }, [id]);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-neutral-900 justify-center items-center">
                <BrandLoader size={80} label="İçerik Hazırlanıyor..." />
            </SafeAreaView>
        );
    }

    if (!studyModule || studyModule.items.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-neutral-900 justify-center items-center px-6">
                <Text className="text-white text-xl text-center mb-4">Module not found or empty.</Text>
                <TouchableOpacity onPress={() => router.back()} className="px-6 py-3 bg-neutral-800 rounded-xl">
                    <Text className="text-white">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const currentItem = studyModule.items[currentIndex];
    const isFlashcard = currentItem.type === 'FLASHCARD' || currentItem.type === 'question';
    const progress = ((currentIndex + 1) / studyModule.items.length) * 100;

    const nextCard = () => {
        if (currentIndex < studyModule.items.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
        } else {
            // Completed module
            router.back();
        }
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowAnswer(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-neutral-900">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <IconSymbol name="xmark" size={24} color="#D1D5DB" />
                </TouchableOpacity>
                <Text className="text-white font-semibold text-base flex-1 text-center" numberOfLines={1}>
                    {studyModule.title}
                </Text>
                <TouchableOpacity className="p-2 -mr-2">
                    <IconSymbol name="ellipsis.circle" size={24} color="#D1D5DB" />
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View className="px-6 mb-6">
                <View className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <View
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </View>
                <Text className="text-gray-400 text-xs mt-2 text-center">
                    {currentIndex + 1} of {studyModule.items.length} completed
                </Text>
            </View>

            {/* Card Container */}
            <View className="flex-1 px-6 justify-center">
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => isFlashcard ? setShowAnswer(!showAnswer) : null}
                    className={`w-full min-h-[400px] bg-neutral-800 rounded-3xl p-8 justify-center items-center shadow-lg border ${showAnswer ? 'border-indigo-500/30' : 'border-neutral-700'}`}
                >
                    {isFlashcard ? (
                        <View className="w-full flex-1 justify-center items-center">
                            {!showAnswer ? (
                                <>
                                    <Text className="text-gray-300 font-medium mb-4 uppercase tracking-widest text-xs">Question</Text>
                                    <Text className="text-white text-2xl font-bold text-center leading-9">
                                        {currentItem.content.question || 'Missing question'}
                                    </Text>
                                    <Text className="text-gray-500 mt-10 text-sm">Tap to flip</Text>
                                </>
                            ) : (
                                <>
                                    <Text className="text-indigo-400 font-medium mb-4 uppercase tracking-widest text-xs">Answer</Text>
                                    <Text className="text-white text-xl text-center leading-8">
                                        {currentItem.content.answer || currentItem.content.content || 'Missing answer'}
                                    </Text>
                                </>
                            )}
                        </View>
                    ) : (
                        <ScrollView className="w-full flex-1" showsVerticalScrollIndicator={false}>
                            <Text className="text-gray-300 font-medium mb-4 uppercase tracking-widest text-xs">Note</Text>
                            <Text className="text-white text-lg leading-8">
                                {currentItem.content.content || 'Missing content'}
                            </Text>
                        </ScrollView>
                    )}
                </TouchableOpacity>
            </View>

            {/* Footer Controls */}
            <View className="flex-row items-center justify-between px-6 pb-10 pt-6">
                <TouchableOpacity
                    onPress={prevCard}
                    disabled={currentIndex === 0}
                    className={`w-14 h-14 rounded-full items-center justify-center border ${currentIndex === 0 ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-700 bg-neutral-800'}`}
                >
                    <IconSymbol name="chevron.left" size={20} color={currentIndex === 0 ? '#4B5563' : '#D1D5DB'} />
                </TouchableOpacity>

                {isFlashcard && showAnswer && (
                    <View className="flex-row space-x-4">
                        <TouchableOpacity onPress={nextCard} className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/30 items-center justify-center">
                            <IconSymbol name="xmark" size={24} color="#EF4444" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={nextCard} className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 items-center justify-center">
                            <IconSymbol name="checkmark" size={24} color="#22C55E" />
                        </TouchableOpacity>
                    </View>
                )}

                {!isFlashcard && (
                    <TouchableOpacity onPress={nextCard} className="bg-indigo-600 px-8 py-4 rounded-full">
                        <Text className="text-white font-bold text-base">Next Items</Text>
                    </TouchableOpacity>
                )}

                {isFlashcard && !showAnswer && (
                    <View className="w-14 h-14" /> /* Spacer if not showing action buttons */
                )}

                <TouchableOpacity
                    onPress={nextCard}
                    className="w-14 h-14 rounded-full items-center justify-center border border-neutral-700 bg-neutral-800"
                >
                    <IconSymbol name="chevron.right" size={20} color="#D1D5DB" />
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}
