import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as DocumentPicker from 'expo-document-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CreateScreen() {
    const router = useRouter();
    const [cameraPermission, requestPermission] = useCameraPermissions();
    const [showCamera, setShowCamera] = useState(false);

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
                    Create Module (Preview)
                </Text>
                <View className="p-2 -mr-2 opacity-0">
                    <IconSymbol name="ellipsis.circle" size={24} color="#D1D5DB" />
                </View>
            </View>

            <ScrollView className="flex-1 px-6">
                <Text className="text-3xl font-bold text-white mb-8 mt-4 text-center">
                    What would you like to learn today?
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
                            <Text className="text-white text-xl font-bold mb-1">Scan Document</Text>
                            <Text className="text-gray-400 text-sm">Use your camera to scan physical notes and books</Text>
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
                            <Text className="text-white text-xl font-bold mb-1">Upload PDF</Text>
                            <Text className="text-gray-400 text-sm">Generate a module from your existing PDF files</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => Alert.alert('Yakında', 'Yapay zeka ile metin üzerinden müfredat oluşturma arayüzü yakında eklenecektir.')}
                        className="w-full bg-purple-600/20 border border-purple-500/30 rounded-3xl p-6 items-center flex-row"
                    >
                        <View className="w-16 h-16 rounded-full bg-purple-500/20 items-center justify-center mr-4">
                            <IconSymbol name="keyboard" size={32} color="#C084FC" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white text-xl font-bold mb-1">Type Topic</Text>
                            <Text className="text-gray-400 text-sm">Tell the AI what you want to learn right now</Text>
                        </View>
                    </TouchableOpacity>
                </View>

            </ScrollView>

        </SafeAreaView>
    );
}
