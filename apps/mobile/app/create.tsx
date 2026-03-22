import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as DocumentPicker from 'expo-document-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '@/lib/api';
import { t, Language } from '@learnaxia/shared';

export default function CreateScreen() {
    const router = useRouter();
    const [cameraPermission, requestPermission] = useCameraPermissions();
    const [showCamera, setShowCamera] = useState(false);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const currentLang = 'tr' as Language;

    const handleDocumentPick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
            });
            if (!result.canceled) {
                Alert.alert(t('create.modal.pdfInfo', currentLang).split('.')[0], t('create.modal.pdfInfo', currentLang));
                // Here you would use FormData to upload the PDF to /api/modules/generate
            }
        } catch (err) {
            console.log('Error picking document', err);
        }
    };

    const handleTopicGenerate = async () => {
        if (topic.length < 3) {
            Alert.alert(t('create.modal.invalidTopic', currentLang), t('create.modal.minChars', currentLang));
            return;
        }

        setIsGenerating(true);
        try {
            // 1. Generate Syllabus
            const genRes = await api.post('/ai/learning-path/generate', { 
                topic,
                depth: 'standard',
                language: 'tr'
            });

            if (!genRes.data.syllabus) throw new Error(t('create.modal.syllabusError', currentLang));

            // 2. Start Journey (Directly for mobile convenience)
            const startRes = await api.post('/ai/learning-path/start', {
                topic,
                depth: 'standard',
                syllabus: genRes.data.syllabus
            });

            if (startRes.data.journeyId) {
                setShowTopicModal(false);
                setTopic('');
                router.push(`/study/${startRes.data.journeyId}`); // Journeys are treated as modules in study flow
            } else {
                throw new Error(t('create.modal.journeyError', currentLang));
            }
        } catch (error) {
            console.error('Mobile AI Generation Error:', error);
            let errorMessage = t('common.error', currentLang);
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { error?: string } } };
                errorMessage = axiosError.response?.data?.error || errorMessage;
            }
            Alert.alert(t('common.error', currentLang), errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const openCamera = async () => {
        if (!cameraPermission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert(t('create.modal.cameraPermission', currentLang), t('create.modal.cameraPermissionDesc', currentLang));
                return;
            }
        }
        setShowCamera(true);
    };

    if (showCamera) {
        return (
            <SafeAreaView className="flex-1 bg-black">
                <CameraView style={{ flex: 1 }} facing="back">
                    <View className="flex-1 justify-between p-6">
                        <TouchableOpacity
                            onPress={() => setShowCamera(false)}
                            className="w-12 h-12 rounded-full bg-black/50 items-center justify-center mt-10"
                        >
                            <IconSymbol name="xmark" size={24} color="white" />
                        </TouchableOpacity>

                        <View className="items-center mb-10">
                            <TouchableOpacity
                                onPress={() => {
                                    setShowCamera(false);
                                    Alert.alert(t('create.modal.ocrInfo', currentLang).split('.')[0], t('create.modal.ocrInfo', currentLang));
                                }}
                                className="w-20 h-20 rounded-full bg-white/20 items-center justify-center border-4 border-white"
                            >
                                <View className="w-16 h-16 rounded-full bg-white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </CameraView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-neutral-900">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <IconSymbol name="xmark" size={24} color="#D1D5DB" />
                </TouchableOpacity>
                <Text className="text-white font-semibold text-base flex-1 text-center">
                    {t('create.title', currentLang)}
                </Text>
                <View className="p-2 -mr-2 opacity-0">
                    <IconSymbol name="ellipsis.circle" size={24} color="#D1D5DB" />
                </View>
            </View>

            <ScrollView className="flex-1 px-6">
                <Text className="text-3xl font-bold text-white mb-8 mt-4 text-center">
                    {t('create.subtitle', currentLang)}
                </Text>

                <View className="space-y-4">
                    <TouchableOpacity
                        onPress={openCamera}
                        className="w-full bg-indigo-600/20 border border-indigo-500/30 rounded-3xl p-6 items-center flex-row mb-4"
                    >
                        <View className="w-16 h-16 rounded-full bg-indigo-500/20 items-center justify-center mr-4">
                            <IconSymbol name="camera.fill" size={32} color="#818CF8" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white text-xl font-bold mb-1">{t('create.scanDoc.title', currentLang)}</Text>
                            <Text className="text-gray-400 text-sm">{t('create.scanDoc.desc', currentLang)}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleDocumentPick}
                        className="w-full bg-blue-600/20 border border-blue-500/30 rounded-3xl p-6 items-center flex-row mb-4"
                    >
                        <View className="w-16 h-16 rounded-full bg-blue-500/20 items-center justify-center mr-4">
                            <IconSymbol name="doc.fill" size={32} color="#60A5FA" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white text-xl font-bold mb-1">{t('create.uploadPdf.title', currentLang)}</Text>
                            <Text className="text-gray-400 text-sm">{t('create.uploadPdf.desc', currentLang)}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowTopicModal(true)}
                        className="w-full bg-purple-600/20 border border-purple-500/30 rounded-3xl p-6 items-center flex-row"
                    >
                        <View className="w-16 h-16 rounded-full bg-purple-500/20 items-center justify-center mr-4">
                            <IconSymbol name="keyboard" size={32} color="#C084FC" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white text-xl font-bold mb-1">{t('create.enterTopic.title', currentLang)}</Text>
                            <Text className="text-gray-400 text-sm">{t('create.enterTopic.desc', currentLang)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Topic Modal */}
            <Modal
                visible={showTopicModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowTopicModal(false)}
            >
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-neutral-900 rounded-t-[40px] p-8 pb-12 border-t border-white/10">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-white">{t('create.modal.title', currentLang)}</Text>
                            <TouchableOpacity onPress={() => setShowTopicModal(false)}>
                                <IconSymbol name="xmark.circle.fill" size={28} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-400 mb-4 font-medium">{t('create.modal.desc', currentLang)}</Text>
                        
                        <TextInput
                            className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5 text-white text-lg mb-8"
                            placeholder={t('create.modal.placeholder', currentLang)}
                            placeholderTextColor="#6B7280"
                            value={topic}
                            onChangeText={setTopic}
                            autoFocus={true}
                            editable={!isGenerating}
                        />

                        <TouchableOpacity 
                            onPress={handleTopicGenerate}
                            disabled={isGenerating || topic.length < 3}
                            className={`w-full h-16 rounded-2xl items-center justify-center flex-row ${isGenerating || topic.length < 3 ? 'bg-neutral-800' : 'bg-purple-600'}`}
                        >
                            {isGenerating ? (
                                <>
                                    <BrandLoader size={24} showBlur={false} className="mr-3" />
                                    <Text className="text-white font-bold text-lg">{t('create.modal.generating', currentLang)}</Text>
                                </>
                            ) : (
                                <>
                                    <View className="mr-2">
                                        <IconSymbol name="sparkles" size={20} color="white" />
                                    </View>
                                    <Text className="text-white font-bold text-lg">{t('create.modal.button', currentLang)}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}
