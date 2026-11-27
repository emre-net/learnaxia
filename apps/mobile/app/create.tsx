import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/use-language';
import { useTokenWallet } from '@/hooks/use-token-wallet';
import { TokenWalletBanner } from '@/components/tokens/token-wallet-banner';
import { SolutionModal } from '@/components/create/solution-modal';
import { CameraScreen } from '@/components/create/camera-screen';
import * as Haptics from 'expo-haptics';

export default function CreateScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const { refreshWallet, handleAiError } = useTokenWallet();
    const [cameraPermission, requestPermission] = useCameraPermissions();
    const [showCamera, setShowCamera] = useState(false);
    const [showSolutionModal, setShowSolutionModal] = useState(false);
    const [visionResult, setVisionResult] = useState<{
        id?: string;
        questionText: string;
        solution: string;
        imageUrl?: string;
    } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingText, setLoadingText] = useState('Yapay zeka işliyor...');
    const cameraRef = React.useRef<CameraView>(null);

    const handleDocumentPick = async () => {
        if (isGenerating) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'text/plain',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                ],
            });

            if (!result.canceled && result.assets[0]) {
                setLoadingText('Belgeden not çıkarılıyor...');
                setIsGenerating(true);
                const asset = result.assets[0];

                const formData = new FormData();
                // @ts-ignore
                formData.append('file', {
                    uri: asset.uri,
                    type: asset.mimeType || 'application/pdf',
                    name: asset.name || 'document.pdf',
                });

                const extractRes = await api.post('/mobile/file/extract', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const extractedText = extractRes.data.text;
                if (!extractedText) throw new Error('Belgeden metin okunamadı.');

                const genRes = await api.post('/mobile/ai/generate-note', {
                    text: extractedText,
                    title: asset.name ? asset.name.split('.')[0] : 'Belge Notu',
                    language
                });

                if (genRes.data.noteId) {
                    refreshWallet();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Başarılı', 'Not başarıyla üretildi!');
                    router.push(`/notes/${genRes.data.noteId}` as any);
                } else {
                    throw new Error('Not oluşturulamadı.');
                }
            }
        } catch (err) {
            handleAiError(err, 'Belge işlenirken bir hata oluştu.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsGenerating(false);
        }
    };

    const takePhoto = async () => {
        if (!cameraRef.current || isGenerating) return;

        setLoadingText('Soru analiz ediliyor...');
        setIsGenerating(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.45,
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
                if (photo.base64 && photo.base64.length <= 240_000) {
                    formData.append('thumbnail', `data:image/jpeg;base64,${photo.base64}`);
                }

                const response = await api.post('/mobile/ai/solve-photo', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                refreshWallet();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setVisionResult(response.data);
                setShowCamera(false);
                setShowSolutionModal(true);
            }
        } catch (error) {
            handleAiError(error, 'Fotoğraf işlenemedi.');
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
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.45,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                setLoadingText('Görüntü analiz ediliyor...');
                setIsGenerating(true);
                const asset = result.assets[0];
                const formData = new FormData();
                // @ts-ignore
                formData.append('file', {
                    uri: asset.uri,
                    type: 'image/jpeg',
                    name: 'gallery.jpg',
                });
                if (asset.base64 && asset.base64.length <= 240_000) {
                    formData.append('thumbnail', `data:image/jpeg;base64,${asset.base64}`);
                }

                const response = await api.post('/mobile/ai/solve-photo', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                refreshWallet();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setVisionResult(response.data);
                setShowSolutionModal(true);
            }
        } catch (error) {
            handleAiError(error, 'Galeri görüntüsü işlenemedi.');
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerCloseBtn}>
                    <Ionicons name="close" size={24} color="#F4F4F5" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>Atölye</Text>
                    <Text style={styles.heroSubtitle}>
                        Öğrenme materyallerini zeka ile dönüştür veya kendi notlarını oluştur.
                    </Text>
                </View>

                <TokenWalletBanner variant="compact" />

                <View style={styles.bentoGrid}>
                    <TouchableOpacity style={[styles.bentoCard, styles.bentoLarge]} onPress={openCamera}>
                        <View style={styles.bentoIconTop}>
                            <View style={styles.cameraIconCircle}>
                                <Ionicons name="camera" size={24} color="#38BDF8" />
                            </View>
                            <View style={styles.liveAiBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveAiText}>AI Görüş</Text>
                            </View>
                        </View>

                        <View style={styles.scannerGraphic}>
                            <View style={styles.scannerCornerTL} />
                            <View style={styles.scannerCornerTR} />
                            <View style={styles.scannerCornerBL} />
                            <View style={styles.scannerCornerBR} />
                            <Ionicons name="scan-outline" size={32} color="#38BDF8" style={{ opacity: 0.9 }} />
                        </View>

                        <View style={styles.bentoTextContainer}>
                            <Text style={styles.bentoTitle}>Kameradan Çöz</Text>
                            <Text style={styles.bentoDesc}>Soruyu çek, AI çözsün.</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.bentoCol}>
                        <TouchableOpacity style={[styles.bentoCard, styles.bentoSmall]} onPress={handleDocumentPick}>
                            <Ionicons name="document-text" size={24} color="#F4F4F5" style={{ marginBottom: 12 }} />
                            <Text style={styles.bentoTitleSmall}>Belge Yükle</Text>
                            <Text style={styles.bentoDescSmall}>PDF, DOCX, PPTX</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.bentoCard, styles.bentoSmall]} onPress={() => router.push('/journey/new')}>
                            <Ionicons name="sparkles" size={24} color="#38BDF8" style={{ marginBottom: 12 }} />
                            <Text style={styles.bentoTitleSmall}>Zeka ile Üret</Text>
                            <Text style={styles.bentoDescSmall}>Konudan Rotaya</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Klasik Araçlar</Text>

                <View style={styles.listContainer}>
                    <TouchableOpacity style={styles.listItem} onPress={pickFromGallery}>
                        <View style={styles.listIconWrapper}>
                            <Ionicons name="image" size={20} color="#F4F4F5" />
                        </View>
                        <View style={styles.listTextContainer}>
                            <Text style={styles.listTitle}>Galeriden Seç</Text>
                            <Text style={styles.listDesc}>Mevcut fotoğrafı çözdür</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#71717A" />
                    </TouchableOpacity>

                    <View style={styles.listDivider} />

                    <TouchableOpacity
                        style={styles.listItem}
                        onPress={() => router.push({ pathname: '/modules/new', params: { ai: 'true' } } as any)}
                    >
                        <View style={[styles.listIconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                            <Ionicons name="sparkles" size={20} color="#A855F7" />
                        </View>
                        <View style={styles.listTextContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.listTitle}>AI ile Modül Üret</Text>
                                <View style={styles.aiBadgePill}>
                                    <Text style={styles.aiBadgePillText}>Otomatik</Text>
                                </View>
                            </View>
                            <Text style={styles.listDesc}>Konudan anında Flashcard, Test veya Soru üret</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#71717A" />
                    </TouchableOpacity>

                    <View style={styles.listDivider} />

                    <TouchableOpacity style={styles.listItem} onPress={() => router.push('/modules/new')}>
                        <View style={styles.listIconWrapper}>
                            <Ionicons name="add-circle" size={20} color="#F4F4F5" />
                        </View>
                        <View style={styles.listTextContainer}>
                            <Text style={styles.listTitle}>Manuel Modül Oluştur</Text>
                            <Text style={styles.listDesc}>Kart, test, D/Y veya boşluk doldurma</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#71717A" />
                    </TouchableOpacity>

                    <View style={styles.listDivider} />

                    <TouchableOpacity style={styles.listItem} onPress={() => router.push('/notes/new')}>
                        <View style={styles.listIconWrapper}>
                            <Ionicons name="create" size={20} color="#F4F4F5" />
                        </View>
                        <View style={styles.listTextContainer}>
                            <Text style={styles.listTitle}>Yeni Not Yaz</Text>
                            <Text style={styles.listDesc}>Metin ve el yazısı editörü ile yaz</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#71717A" />
                    </TouchableOpacity>

                    <View style={styles.listDivider} />

                    <TouchableOpacity style={styles.listItem} onPress={() => router.push('/collections/new' as any)}>
                        <View style={styles.listIconWrapper}>
                            <Ionicons name="folder" size={20} color="#F4F4F5" />
                        </View>
                        <View style={styles.listTextContainer}>
                            <Text style={styles.listTitle}>Yeni Koleksiyon</Text>
                            <Text style={styles.listDesc}>Modüllerini gruplandır</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#71717A" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <SolutionModal
                visible={showSolutionModal}
                result={visionResult}
                onClose={() => setShowSolutionModal(false)}
            />

            {isGenerating && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#38BDF8" />
                    <Text style={styles.loadingText}>{loadingText}</Text>
                </View>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#09090B',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 14,
    },
    headerCloseBtn: {
        width: 44,
        height: 44,
        borderRadius: 99,
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 80,
        paddingHorizontal: 24,
    },
    heroSection: {
        marginBottom: 28,
        marginTop: 8,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#F4F4F5',
        letterSpacing: -0.8,
        marginBottom: 8,
    },
    heroSubtitle: {
        color: '#A1A1AA',
        fontSize: 15,
        lineHeight: 22,
    },
    bentoGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    bentoCard: {
        backgroundColor: '#121215',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#27272A',
        padding: 20,
    },
    bentoLarge: {
        flex: 1,
        justifyContent: 'space-between',
        minHeight: 220,
    },
    bentoIconTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cameraIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    liveAiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.2)',
    },
    liveDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#38BDF8',
    },
    liveAiText: {
        color: '#38BDF8',
        fontSize: 10,
        fontWeight: '700',
    },
    scannerGraphic: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        height: 50,
        position: 'relative',
    },
    scannerCornerTL: {
        position: 'absolute',
        top: 0,
        left: '28%',
        width: 9,
        height: 9,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderColor: '#38BDF8',
    },
    scannerCornerTR: {
        position: 'absolute',
        top: 0,
        right: '28%',
        width: 9,
        height: 9,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderColor: '#38BDF8',
    },
    scannerCornerBL: {
        position: 'absolute',
        bottom: 0,
        left: '28%',
        width: 9,
        height: 9,
        borderBottomWidth: 2,
        borderLeftWidth: 2,
        borderColor: '#38BDF8',
    },
    scannerCornerBR: {
        position: 'absolute',
        bottom: 0,
        right: '28%',
        width: 9,
        height: 9,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderColor: '#38BDF8',
    },
    bentoTextContainer: {
        marginTop: 'auto',
    },
    bentoTitle: {
        color: '#F4F4F5',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.4,
    },
    bentoDesc: {
        color: '#A1A1AA',
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
        color: '#F4F4F5',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    bentoDescSmall: {
        color: '#A1A1AA',
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#71717A',
        marginBottom: 14,
        marginLeft: 6,
    },
    listContainer: {
        backgroundColor: '#121215',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#27272A',
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
    },
    listIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#18181B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    listTextContainer: {
        flex: 1,
    },
    listTitle: {
        color: '#F4F4F5',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    listDesc: {
        color: '#A1A1AA',
        fontSize: 13,
    },
    listDivider: {
        height: 1,
        backgroundColor: '#27272A',
        marginLeft: 74,
    },
    aiBadgePill: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    aiBadgePillText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#C084FC',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(9, 9, 11, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
    },
    loadingText: {
        color: '#F4F4F5',
        fontSize: 15,
        fontWeight: '600',
    },
});
