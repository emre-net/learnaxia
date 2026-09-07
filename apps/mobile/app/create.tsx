import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '@/lib/api';
import { t } from '@learnaxia/shared';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/hooks/use-language';
import { TopicModal } from '@/components/create/topic-modal';
import { SolutionModal } from '@/components/create/solution-modal';
import { CameraScreen } from '@/components/create/camera-screen';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function CreateScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const [cameraPermission, requestPermission] = useCameraPermissions();
    const [showCamera, setShowCamera] = useState(false);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showSolutionModal, setShowSolutionModal] = useState(false);
    const [topic, setTopic] = useState('');
    const [visionResult, setVisionResult] = useState<{ questionText: string, solution: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const cameraRef = React.useRef<CameraView>(null);

    const handleDocumentPick = async () => {
        if (isGenerating) return;

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
        } finally {
            setIsGenerating(false);
        }
    };

    const handleTopicGenerate = async () => {
        if (topic.length < 3) {
            Alert.alert('Geçersiz Konu', 'Lütfen en az 3 karakter girin.');
            return;
        }

        setIsGenerating(true);
        try {
            const genRes = await api.post('/ai/learning-path/generate', {
                topic,
                depth: 'standard',
                language
            });

            if (!genRes.data.syllabus) throw new Error('Syllabus üretilemedi.');

            const startRes = await api.post('/ai/learning-path/start', {
                topic,
                depth: 'standard',
                syllabus: genRes.data.syllabus
            });

            if (startRes.data.journeyId) {
                setShowTopicModal(false);
                setTopic('');
                router.push(`/study/${startRes.data.journeyId}`);
            } else {
                throw new Error('Yolculuk başlatılamadı.');
            }
        } catch (error) {
            console.error('Mobile AI Generation Error:', error);
            Alert.alert('Hata', 'İçerik üretilirken bir sorun oluştu.');
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

                setVisionResult(response.data);
                setShowCamera(false);
                setShowSolutionModal(true);
            }
        } catch (error) {
            console.error('Vision Error:', error);
            Alert.alert('Hata', 'Fotoğraf işlenemedi.');
        } finally {
            setIsGenerating(false);
        }
    };

    const pickFromGallery = async () => {
        if (isGenerating) return;
        
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

                setVisionResult(response.data);
                setShowSolutionModal(true);
            }
        } catch (error) {
            console.error('Gallery Vision Error:', error);
            Alert.alert('Hata', 'Galeri görüntüsü işlenemedi.');
        } finally {
            setIsGenerating(false);
        }
    };

    const openCamera = async () => {
        if (!cameraPermission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert('Kamera İzni Gerekli', 'Soruyu çekmek için kameraya izin vermelisin.');
                return;
            }
        }
        setShowCamera(true);
    };

    const NotImplemented = () => {
        Alert.alert("Çok Yakında", "Bu özellik yakında mobil uygulamamıza da eklenecek!");
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
            <LinearGradient colors={['#050A14', '#090F1D']} style={StyleSheet.absoluteFillObject} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerCloseBtn}>
                    <IconSymbol name="xmark" size={20} color="#D1D5DB" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroGlowBlue} />
                    <View style={styles.heroGlowPurple} />
                    <View style={styles.heroContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <LinearGradient colors={['#2563EB', '#9333EA']} style={styles.heroIconWrapper}>
                                <MaterialIcons name="bolt" size={28} color="white" />
                            </LinearGradient>
                            <Text style={styles.heroTitle}>Atölye</Text>
                        </View>
                        <Text style={styles.heroSubtitle}>
                            Öğrenme sistemini inşa et. Modüller üret, koleksiyonlar kur ve AI destekli notlar al.
                        </Text>
                    </View>
                </View>

                {/* Modules Pillar */}
                <View style={styles.pillarContainer}>
                    <View style={styles.pillarHeader}>
                        <MaterialIcons name="psychology" size={18} color="#60A5FA" style={{ marginRight: 8 }} />
                        <Text style={styles.pillarTitle}>MODÜLLER ATÖLYESİ</Text>
                    </View>
                    <View style={styles.pillarCard}>
                        <TouchableOpacity style={[styles.actionItem, { backgroundColor: '#1E293B', borderColor: '#334155' }]} onPress={NotImplemented}>
                            <View style={[styles.actionIconWrapper, { backgroundColor: '#334155' }]}>
                                <Feather name="pen-tool" size={20} color="#E2E8F0" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionTitle}>Manuel Oluştur</Text>
                                <Text style={styles.actionDesc}>Kendi içeriğinizi elle girin.</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color="#64748B" />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionItem, { backgroundColor: 'rgba(88, 28, 135, 0.4)', borderColor: 'rgba(168, 85, 247, 0.3)' }]} onPress={() => setShowTopicModal(true)}>
                            <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.3)' }]}>
                                <MaterialIcons name="auto-awesome" size={20} color="#D8B4FE" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionTitle, { color: '#E9D5FF' }]}>Zeka ile Üret</Text>
                                <Text style={styles.actionDesc}>Konu girerek AI ile modül üretin.</Text>
                            </View>
                            <View style={styles.aiBadge}>
                                <MaterialIcons name="auto-awesome" size={10} color="#C084FC" />
                                <Text style={styles.aiBadgeText}>AI</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Collections Pillar */}
                <View style={styles.pillarContainer}>
                    <View style={styles.pillarHeader}>
                        <MaterialIcons name="create-new-folder" size={18} color="#818CF8" style={{ marginRight: 8 }} />
                        <Text style={styles.pillarTitle}>KOLEKSİYONLAR ATÖLYESİ</Text>
                    </View>
                    <View style={styles.pillarCard}>
                        <TouchableOpacity style={[styles.actionItem, { backgroundColor: '#1E293B', borderColor: '#334155' }]} onPress={() => router.push('/collections/new' as any)}>
                            <View style={[styles.actionIconWrapper, { backgroundColor: '#334155' }]}>
                                <MaterialIcons name="add" size={20} color="#E2E8F0" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionTitle}>Yeni Koleksiyon</Text>
                                <Text style={styles.actionDesc}>Modüllerinizi gruplandırın.</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Notes Pillar */}
                <View style={styles.pillarContainer}>
                    <View style={styles.pillarHeader}>
                        <MaterialIcons name="description" size={18} color="#FBBF24" style={{ marginRight: 8 }} />
                        <Text style={styles.pillarTitle}>NOTLAR ATÖLYESİ</Text>
                    </View>
                    <View style={styles.pillarCard}>
                        <TouchableOpacity style={[styles.actionItem, { backgroundColor: '#1E293B', borderColor: '#334155' }]} onPress={() => router.push('/notes/new')}>
                            <View style={[styles.actionIconWrapper, { backgroundColor: '#334155' }]}>
                                <Feather name="pen-tool" size={20} color="#E2E8F0" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionTitle}>Not Yaz</Text>
                                <Text style={styles.actionDesc}>Zengin metin editörü ile not alın.</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color="#64748B" />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionItem, { backgroundColor: 'rgba(88, 28, 135, 0.4)', borderColor: 'rgba(168, 85, 247, 0.3)' }]} onPress={handleDocumentPick}>
                            <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.3)' }]}>
                                <MaterialIcons name="picture-as-pdf" size={20} color="#D8B4FE" />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionTitle, { color: '#E9D5FF' }]}>PDF'den Not Çıkar</Text>
                                <Text style={styles.actionDesc}>AI PDF içeriğini notlara dönüştürsün.</Text>
                            </View>
                            <View style={styles.aiBadge}>
                                <MaterialIcons name="auto-awesome" size={10} color="#C084FC" />
                                <Text style={styles.aiBadgeText}>AI</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Extra Tools Section */}
                <View style={styles.extraToolsContainer}>
                    <View style={styles.pillarHeader}>
                        <MaterialIcons name="camera-alt" size={18} color="#2DD4BF" style={{ marginRight: 8 }} />
                        <Text style={styles.pillarTitle}>HIZLI ARAÇLAR</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity style={styles.quickToolCard} onPress={openCamera}>
                            <View style={[styles.quickToolIcon, { backgroundColor: 'rgba(45, 212, 191, 0.2)' }]}>
                                <MaterialIcons name="camera-alt" size={24} color="#2DD4BF" />
                            </View>
                            <Text style={styles.quickToolTitle}>Kameradan Çöz</Text>
                            <Text style={styles.quickToolDesc}>Soruyu çek, AI çözsün.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickToolCard} onPress={pickFromGallery}>
                            <View style={[styles.quickToolIcon, { backgroundColor: 'rgba(45, 212, 191, 0.2)' }]}>
                                <MaterialIcons name="photo-library" size={24} color="#2DD4BF" />
                            </View>
                            <Text style={styles.quickToolTitle}>Galeriden Seç</Text>
                            <Text style={styles.quickToolDesc}>Hazır fotoğrafları kullan.</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            <TopicModal
                visible={showTopicModal}
                topic={topic}
                isGenerating={isGenerating}
                onChangeTopic={setTopic}
                onGenerate={handleTopicGenerate}
                onClose={() => { setShowTopicModal(false); setTopic(''); }}
            />

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
        backgroundColor: '#050A14',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 8,
    },
    headerCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#090F1D',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 80,
        paddingHorizontal: 20,
    },
    heroSection: {
        backgroundColor: '#0F172A',
        borderRadius: 32,
        padding: 24,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1E293B',
        marginTop: 8,
    },
    heroGlowBlue: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 150,
        height: 150,
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderRadius: 75,
        opacity: 0.8,
    },
    heroGlowPurple: {
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 150,
        height: 150,
        backgroundColor: 'rgba(147, 51, 234, 0.2)',
        borderRadius: 75,
        opacity: 0.8,
    },
    heroContent: {
        zIndex: 10,
    },
    heroIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    heroSubtitle: {
        color: '#94A3B8',
        fontSize: 15,
        lineHeight: 22,
        marginTop: 12,
        paddingLeft: 4,
    },
    pillarContainer: {
        marginBottom: 24,
    },
    pillarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    pillarTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 1.5,
    },
    pillarCard: {
        backgroundColor: '#0F172A',
        borderRadius: 24,
        padding: 12,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
        position: 'relative',
        overflow: 'hidden',
    },
    actionIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    actionDesc: {
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 16,
    },
    aiBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderBottomLeftRadius: 12,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
    },
    aiBadgeText: {
        color: '#C084FC',
        fontSize: 10,
        fontWeight: '800',
        marginLeft: 4,
    },
    extraToolsContainer: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
        paddingTop: 24,
    },
    quickToolCard: {
        flex: 1,
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(20, 184, 166, 0.2)',
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
    },
    quickToolIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    quickToolTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    quickToolDesc: {
        color: '#94A3B8',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
    },
    cameraScreen: {
        flex: 1,
        backgroundColor: '#000000',
    },
    cameraOverlay: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 24,
    },
    cameraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
    },
    cameraCloseBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraTitle: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 18,
    },
    cameraFooter: {
        alignItems: 'center',
        marginBottom: 64,
    },
    cameraCaptureBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    cameraCaptureInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalContent: {
        backgroundColor: '#090F1D',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 32,
        paddingBottom: 48,
        borderTopWidth: 1,
        borderTopColor: 'rgba(59, 130, 246, 0.3)',
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitleText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    modalCloseBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalDescText: {
        color: '#94A3B8',
        marginBottom: 16,
        fontWeight: '500',
        fontSize: 15,
    },
    modalInput: {
        backgroundColor: '#050A14',
        borderWidth: 1,
        borderColor: '#182234',
        borderRadius: 16,
        padding: 20,
        color: '#FFFFFF',
        fontSize: 18,
        marginBottom: 32,
    },
    modalActionBtn: {
        width: '100%',
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    modalActionBtnActive: {
        backgroundColor: '#3B82F6',
    },
    modalActionBtnDisabled: {
        backgroundColor: '#182234',
    },
    modalActionBtnTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 18,
    },
    modalOverlaySolution: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContentSolution: {
        backgroundColor: '#171717',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 32,
        maxHeight: '85%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    solutionQuestionBox: {
        backgroundColor: 'rgba(38, 38, 38, 0.5)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#404040',
    },
    solutionBoxTitleBlue: {
        color: '#60A5FA',
        fontWeight: '700',
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    solutionQuestionText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        lineHeight: 24,
    },
    solutionAnswerBox: {
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    solutionBoxTitleIndigo: {
        color: '#818CF8',
        fontWeight: '700',
        fontSize: 12,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    solutionAnswerText: {
        color: '#FFFFFF',
        fontSize: 18,
        lineHeight: 28,
        fontWeight: '500',
    },
    solutionOkBtn: {
        width: '100%',
        height: 64,
        borderRadius: 16,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    solutionOkBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 18,
    }
});
