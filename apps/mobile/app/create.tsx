import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as DocumentPicker from 'expo-document-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '@/lib/api';

export default function CreateScreen() {
    const router = useRouter();
    const [cameraPermission, requestPermission] = useCameraPermissions();
    const [showCamera, setShowCamera] = useState(false);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDocumentPick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
            });
            if (!result.canceled) {
                Alert.alert('PDF Seçildi', `${result.assets[0].name}\n\nPDF yükleme ve analiz özelliği yakında eklenecektir.`);
                // Here you would use FormData to upload the PDF to /api/modules/generate
            }
        } catch (err) {
            console.log('Error picking document', err);
        }
    };

    const handleTopicGenerate = async () => {
        if (topic.length < 3) {
            Alert.alert('Geçersiz Konu', 'Lütfen en az 3 karakterli bir konu girin.');
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

            if (!genRes.data.syllabus) throw new Error('Müfredat oluşturulamadı.');

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
                throw new Error('Yolculuk başlatılamadı.');
            }
        } catch (error: any) {
            console.error('Mobile AI Generation Error:', error);
            Alert.alert('Hata', error.response?.data?.error || 'Beklenmeyen bir hata oluştu.');
        } finally {
            setIsGenerating(false);
        }
    };

    const openCamera = async () => {
        if (!cameraPermission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert('İzin Gerekli', 'Belgeleri taramak için kamera iznine ihtiyacımız var.');
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
                                    Alert.alert('Fotoğraf Çekildi', 'OCR (Metin Tanıma) özelliği yakında eklenecektir.');
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
                    Yeni İçerik Oluştur
                </Text>
                <View className="p-2 -mr-2 opacity-0">
                    <IconSymbol name="ellipsis.circle" size={24} color="#D1D5DB" />
                </View>
            </View>

            <ScrollView className="flex-1 px-6">
                <Text className="text-3xl font-bold text-white mb-8 mt-4 text-center">
                    Bugün ne öğrenmek istersin?
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
                            <Text className="text-white text-xl font-bold mb-1">Belge Tara</Text>
                            <Text className="text-gray-400 text-sm">Kitap veya notlarının fotoğrafını çekerek çalış.</Text>
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
                            <Text className="text-white text-xl font-bold mb-1">PDF Yükle</Text>
                            <Text className="text-gray-400 text-sm">Mevcut PDF dosyalarından otomatik içerik üret.</Text>
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
                            <Text className="text-white text-xl font-bold mb-1">Konu Gir</Text>
                            <Text className="text-gray-400 text-sm">Yapay zekaya ne öğrenmek istediğini söyle.</Text>
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
                            <Text className="text-2xl font-bold text-white">Konu Belirle</Text>
                            <TouchableOpacity onPress={() => setShowTopicModal(false)}>
                                <IconSymbol name="xmark.circle.fill" size={28} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-400 mb-4 font-medium">Öğrenmek istediğin konuyu yaz, senin için özel bir müfredat hazırlayalım.</Text>
                        
                        <TextInput
                            className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5 text-white text-lg mb-8"
                            placeholder="Örn: Roma İmparatorluğu Tarihi"
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
                                    <ActivityIndicator color="white" className="mr-3" />
                                    <Text className="text-white font-bold text-lg">Hazırlanıyor...</Text>
                                </>
                            ) : (
                                <>
                                    <View className="mr-2">
                                        <IconSymbol name="sparkles" size={20} color="white" />
                                    </View>
                                    <Text className="text-white font-bold text-lg">Yolculuğu Başlat</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}
