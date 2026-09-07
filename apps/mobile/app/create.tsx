import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Dimensions } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '@/lib/api';
import { t } from '@learnaxia/shared';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/use-language';
import { SolutionModal } from '@/components/create/solution-modal';
import { CameraScreen } from '@/components/create/camera-screen';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function CreateScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const [cameraPermission, requestPermission] = useCameraPermissions();
    const [showCamera, setShowCamera] = useState(false);
    const [showSolutionModal, setShowSolutionModal] = useState(false);
    const [visionResult, setVisionResult] = useState<{ questionText: string, solution: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const cameraRef = React.useRef<CameraView>(null);

    const handleDocumentPick = async () => {
        if (isGenerating) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/plain'],
            });

            if (!result.canceled && result.assets[0]) {
                setIsGenerating(true);
                const asset = result.assets[0];

                const formData = new FormData();
                // @ts-ignore
                formData.append('file', {
                    uri: asset.uri,
                    type: asset.mimeType || 'application/pdf',
                    name: asset.name || 'document.pdf',
                });

                // 1. Extract Text
                const extractRes = await api.post('/mobile/file/extract', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const extractedText = extractRes.data.text;
                if (!extractedText) throw new Error('Metin bulunamadı');

                // 2. Generate Note
                const genRes = await api.post('/mobile/ai/generate-note', {
                    text: extractedText,
                    title: asset.name ? asset.name.split('.')[0] : 'PDF Notu',
                    language
                });

                if (genRes.data.noteId) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Başarılı', 'Not başarıyla üretildi!');
                    router.push(`/notes/${genRes.data.noteId}`);
                } else {
                    throw new Error('Not oluşturulamadı.');
                }
            }
        } catch (err: any) {
            console.error('Error processing document', err);
            let msg = 'Bir hata oluştu';
            if (err?.response?.data?.error) {
                msg = err.response.data.error;
            }
            Alert.alert('Hata', msg);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsGenerating(false);
        }
    };

    const takePhoto = async () => {
        if (!cameraRef.current || isGenerating) return;

        setIsGenerating(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                base64: true,
            });

            if (photo) {
                const formData = new FormData();
                // @ts-ignore
                formData.append('file', {
                    uri: photo.uri,
                    type: 'image/jpeg',
                    name: 'photo.jpg',
                });

                const response = await api.post('/mobile/ai/solve-photo', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setVisionResult(response.data);
                setShowCamera(false);
                setShowSolutionModal(true);
            }
        } catch (error) {
            console.error('Vision Error:', error);
            Alert.alert('Hata', 'Fotoğraf işlenemedi.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsGenerating(false);
        }
    };

    const pickFromGallery = async () => {
        if (isGenerating) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7, 
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                setIsGenerating(true);
                const asset = result.assets[0];

                const formData = new FormData();
                // @ts-ignore
                formData.append('file', {
                    uri: asset.uri,
                    type: 'image/jpeg',
                    name: 'gallery.jpg',
                });

                const response = await api.post('/mobile/ai/solve-photo', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setVisionResult(response.data);
                setShowSolutionModal(true);
            }
        } catch (error) {
            console.error('Gallery Vision Error:', error);
            Alert.alert('Hata', 'Galeri görüntüsü işlenemedi.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsGenerating(false);
        }
    };

    const openCamera = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!cameraPermission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert('Kamera İzni Gerekli', 'Soruyu çekmek için kameraya izin vermelisin.');
                return;
            }
        }
        setShowCamera(true);
    };

    if (showCamera) {
        return (
            <CameraScreen
                cameraRef={cameraRef}
                isGenerating={isGenerating}
                onCapture={takePhoto}
                onClose={() => setShowCamera(false)}
            />
        );
    }

    return (
        <Screen style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerCloseBtn}>
                    <Ionicons name="close" size={24} color="#F8FAFC" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>Atölye</Text>
                    <Text style={styles.heroSubtitle}>
                        Öğrenme materyallerini zeka ile dönüştür veya kendi notlarını oluştur.
                    </Text>
                </View>

                {/* Primary AI Actions (Shortcuts Style Bento) */}
                <View style={styles.bentoGrid}>
                    <TouchableOpacity style={[styles.bentoCard, styles.bentoLarge]} onPress={openCamera}>
                        <View style={styles.bentoIconTop}>
                            <Ionicons name="camera" size={32} color="#F8FAFC" />
                        </View>
                        <View style={styles.bentoTextContainer}>
                            <Text style={styles.bentoTitle}>Kameradan Çöz</Text>
                            <Text style={styles.bentoDesc}>Soruyu çek, AI çözsün.</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.bentoCol}>
                        <TouchableOpacity style={[styles.bentoCard, styles.bentoSmall]} onPress={handleDocumentPick}>
                            <Ionicons name="document-text" size={24} color="#F8FAFC" style={{ marginBottom: 12 }} />
                            <Text style={styles.bentoTitleSmall}>PDF Yükle</Text>
                            <Text style={styles.bentoDescSmall}>Özet ve Not Çıkar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.bentoCard, styles.bentoSmall]} onPress={() => router.push('/journey/new')}>
                            <Ionicons name="sparkles" size={24} color="#F8FAFC" style={{ marginBottom: 12 }} />
                            <Text style={styles.bentoTitleSmall}>Zeka ile Üret</Text>
                            <Text style={styles.bentoDescSmall}>Konudan Rotaya</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Section Divider */}
                <Text style={styles.sectionTitle}>Klasik Araçlar</Text>

                {/* List Actions */}
                <View style={styles.listContainer}>
                    <TouchableOpacity style={styles.listItem} onPress={pickFromGallery}>
                        <View style={styles.listIconWrapper}>
                            <Ionicons name="image" size={20} color="#F8FAFC" />
                        </View>
                        <View style={styles.listTextContainer}>
                            <Text style={styles.listTitle}>Galeriden Seç</Text>
                            <Text style={styles.listDesc}>Mevcut fotoğrafı çözdür</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#475569" />
                    </TouchableOpacity>

                    <View style={styles.listDivider} />

                    <TouchableOpacity style={styles.listItem} onPress={() => router.push('/modules/new')}>
                        <View style={styles.listIconWrapper}>
                            <Ionicons name="add-circle" size={20} color="#F8FAFC" />
                        </View>
                        <View style={styles.listTextContainer}>
                            <Text style={styles.listTitle}>Manuel Modül Oluştur</Text>
                            <Text style={styles.listDesc}>Kendi flashcard'larını yaz</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#475569" />
                    </TouchableOpacity>

                    <View style={styles.listDivider} />

                    <TouchableOpacity style={styles.listItem} onPress={() => router.push('/notes/new')}>
                        <View style={styles.listIconWrapper}>
                            <Ionicons name="create" size={20} color="#F8FAFC" />
                        </View>
                        <View style={styles.listTextContainer}>
                            <Text style={styles.listTitle}>Yeni Not Yaz</Text>
                            <Text style={styles.listDesc}>Zengin metin editörü ile yaz</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#475569" />
                    </TouchableOpacity>

                    <View style={styles.listDivider} />

                    <TouchableOpacity style={styles.listItem} onPress={() => router.push('/collections/new' as any)}>
                        <View style={styles.listIconWrapper}>
                            <Ionicons name="folder" size={20} color="#F8FAFC" />
                        </View>
                        <View style={styles.listTextContainer}>
                            <Text style={styles.listTitle}>Yeni Koleksiyon</Text>
                            <Text style={styles.listDesc}>Modüllerini gruplandır</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#475569" />
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <SolutionModal
                visible={showSolutionModal}
                result={visionResult}
                onClose={() => setShowSolutionModal(false)}
            />

        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 64,
        paddingBottom: 16,
    },
    headerCloseBtn: {
        width: 44,
        height: 44,
        borderRadius: 99,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#111111',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 80,
        paddingHorizontal: 24,
    },
    heroSection: {
        marginBottom: 32,
        marginTop: 8,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#F8FAFC',
        letterSpacing: -1,
        marginBottom: 8,
    },
    heroSubtitle: {
        color: '#64748B',
        fontSize: 15,
        lineHeight: 22,
    },
    bentoGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    bentoCard: {
        backgroundColor: '#0A0A0A',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#111111',
        padding: 20,
    },
    bentoLarge: {
        flex: 1,
        justifyContent: 'space-between',
        minHeight: 220,
    },
    bentoIconTop: {
        alignItems: 'flex-start',
    },
    bentoTextContainer: {
        marginTop: 'auto',
    },
    bentoTitle: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    bentoDesc: {
        color: '#64748B',
        fontSize: 13,
        lineHeight: 18,
    },
    bentoCol: {
        flex: 1,
        gap: 12,
    },
    bentoSmall: {
        flex: 1,
        justifyContent: 'center',
    },
    bentoTitleSmall: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    bentoDescSmall: {
        color: '#64748B',
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 8,
    },
    listContainer: {
        backgroundColor: '#0A0A0A',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#111111',
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    listIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    listTextContainer: {
        flex: 1,
    },
    listTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    listDesc: {
        color: '#64748B',
        fontSize: 13,
    },
    listDivider: {
        height: 1,
        backgroundColor: '#111111',
        marginLeft: 76,
    },
});
