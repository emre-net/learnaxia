import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView,
    Alert, StatusBar, StyleSheet
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawingCanvas } from '@/components/drawing';
import { DrawingCanvasData } from '@learnaxia/shared';

const NOTE_CACHE_PREFIX = 'learnaxia_note_';

export default function NoteEditorScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [drawingData, setDrawingData] = useState<DrawingCanvasData | null>(null);
    const [showDrawing, setShowDrawing] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [savedIndicator, setSavedIndicator] = useState<string | null>(null);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 1. Fetch Note Data with Offline Fallback
    useEffect(() => {
        const fetchNote = async () => {
            if (!id || id === 'new') {
                setTitle('');
                setContent('');
                setDrawingData(null);
                setIsLoading(false);
                return;
            }

            try {
                const res = await api.get(`/mobile/notes/${id}`);
                const data = res.data;
                setTitle(data.title || '');

                // Parse content: check if it contains serialized drawing
                if (typeof data.content === 'string') {
                    try {
                        const parsed = JSON.parse(data.content);
                        if (parsed && typeof parsed === 'object' && (parsed.text !== undefined || parsed.drawing !== undefined)) {
                            setContent(parsed.text || '');
                            if (parsed.drawing) {
                                setDrawingData(parsed.drawing);
                                setShowDrawing(true);
                            }
                        } else {
                            setContent(data.content);
                        }
                    } catch {
                        setContent(data.content);
                    }
                }

                setIsOffline(false);
                // Cache note locally
                await AsyncStorage.setItem(`${NOTE_CACHE_PREFIX}${id}`, JSON.stringify(data));
            } catch (error) {
                console.warn('[NoteEditor] Network fetch failed, checking offline cache:', error);
                // Fallback to offline cache
                const cached = await AsyncStorage.getItem(`${NOTE_CACHE_PREFIX}${id}`);
                if (cached) {
                    const data = JSON.parse(cached);
                    setTitle(data.title || '');
                    if (typeof data.content === 'string') {
                        try {
                            const parsed = JSON.parse(data.content);
                            if (parsed && typeof parsed === 'object') {
                                setContent(parsed.text || '');
                                if (parsed.drawing) {
                                    setDrawingData(parsed.drawing);
                                    setShowDrawing(true);
                                }
                            } else {
                                setContent(data.content);
                            }
                        } catch {
                            setContent(data.content);
                        }
                    }
                    setIsOffline(true);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchNote();
    }, [id]);

    // 2. Debounced Auto-Save
    const triggerAutoSave = useCallback((newTitle: string, newContent: string, newDrawing: DrawingCanvasData | null) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        setIsSaving(true);
        setSavedIndicator('Kaydediliyor...');

        saveTimeoutRef.current = setTimeout(async () => {
            // Bundle text and drawing
            let finalContent: string;
            if (newDrawing && newDrawing.paths && newDrawing.paths.length > 0) {
                finalContent = JSON.stringify({
                    text: newContent,
                    drawing: newDrawing,
                });
            } else {
                finalContent = newContent;
            }

            const payload = {
                title: newTitle.trim() || 'İsimsiz Not',
                content: finalContent,
            };

            // Always update local cache immediately
            if (id && id !== 'new') {
                await AsyncStorage.setItem(`${NOTE_CACHE_PREFIX}${id}`, JSON.stringify({ id, ...payload }));
            }

            try {
                if (id === 'new') {
                    const res = await api.post('/mobile/notes', payload);
                    if (res.data?.id) {
                        router.setParams({ id: res.data.id });
                    }
                } else {
                    await api.patch(`/mobile/notes/${id}`, payload);
                }
                setIsOffline(false);
                setSavedIndicator('Kaydedildi');
            } catch (err) {
                console.warn('[NoteEditor] Save failed remotely, stored locally:', err);
                setIsOffline(true);
                setSavedIndicator('Cihaza Kaydedildi (Çevrimdışı)');
            } finally {
                setIsSaving(false);
                setTimeout(() => setSavedIndicator(null), 3000);
            }
        }, 1200);
    }, [id, router]);

    const handleTitleChange = (val: string) => {
        setTitle(val);
        triggerAutoSave(val, content, drawingData);
    };

    const handleContentChange = (val: string) => {
        setContent(val);
        triggerAutoSave(title, val, drawingData);
    };

    const handleDrawingChange = (data: DrawingCanvasData) => {
        setDrawingData(data);
        triggerAutoSave(title, content, data);
    };

    const toggleDrawingArea = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowDrawing(prev => !prev);
    };

    if (isLoading) {
        return (
            <Screen style={styles.loadingScreen}>
                <BrandLoader size={70} label="Not Yükleniyor..." />
            </Screen>
        );
    }

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#09090b" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                >
                    <MaterialIcons name="arrow-back-ios" size={18} color="#94A3B8" />
                    <Text style={styles.backBtnText}>Notlar</Text>
                </TouchableOpacity>

                {/* Auto-save & Offline Indicator */}
                <View style={styles.headerStatus}>
                    {savedIndicator ? (
                        <View style={styles.savedBadge}>
                            {isSaving ? (
                                <BrandLoader size={12} showBlur={false} />
                            ) : (
                                <MaterialIcons
                                    name={isOffline ? 'cloud-off' : 'cloud-done'}
                                    size={14}
                                    color={isOffline ? '#F59E0B' : '#10B981'}
                                />
                            )}
                            <Text style={[styles.savedText, isOffline && { color: '#FCD34D' }]}>
                                {savedIndicator}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* Drawing Toggle Button */}
                <TouchableOpacity
                    onPress={toggleDrawingArea}
                    style={[styles.drawingToggleBtn, showDrawing && styles.drawingToggleBtnActive]}
                >
                    <MaterialIcons
                        name="gesture"
                        size={20}
                        color={showDrawing ? '#38BDF8' : '#94A3B8'}
                    />
                </TouchableOpacity>
            </View>

            {/* Offline Alert Strip */}
            {isOffline && (
                <View style={styles.offlineStrip}>
                    <MaterialIcons name="cloud-off" size={13} color="#F59E0B" />
                    <Text style={styles.offlineStripText}>
                        Çevrimdışı — Not yerel belleğe kaydediliyor
                    </Text>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Note Title */}
                    <TextInput
                        style={styles.titleInput}
                        placeholder="Başlık..."
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={title}
                        onChangeText={handleTitleChange}
                        returnKeyType="next"
                        maxLength={120}
                    />

                    {/* Note Text Content */}
                    <TextInput
                        style={styles.contentInput}
                        placeholder="Notunuzu yazın..."
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={content}
                        onChangeText={handleContentChange}
                        multiline
                        textAlignVertical="top"
                    />

                    {/* Native Vector Drawing Canvas */}
                    {showDrawing ? (
                        <View style={styles.drawingSection}>
                            <View style={styles.drawingSectionHeader}>
                                <View style={styles.drawingSectionTitleRow}>
                                    <MaterialIcons name="brush" size={16} color="#38BDF8" />
                                    <Text style={styles.drawingSectionTitle}>EL YAZISI VE ÇİZİM</Text>
                                </View>
                                <TouchableOpacity onPress={toggleDrawingArea} style={styles.hideDrawingBtn}>
                                    <Text style={styles.hideDrawingText}>Gizle</Text>
                                </TouchableOpacity>
                            </View>

                            <DrawingCanvas
                                initialData={drawingData || undefined}
                                onChange={handleDrawingChange}
                                height={320}
                            />
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={toggleDrawingArea}
                            style={styles.addDrawingBtn}
                        >
                            <MaterialIcons name="gesture" size={18} color="#38BDF8" />
                            <Text style={styles.addDrawingBtnText}>
                                {drawingData && drawingData.paths.length > 0 ? 'Çizimi Görüntüle / Düzenle' : '+ El Yazısı veya Çizim Alanı Ekle'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#09090b' },
    loadingScreen: { flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#1E293B',
    },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4,
    },
    backBtnText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginLeft: 2 },
    headerStatus: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    savedBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1E293B',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    },
    savedText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
    drawingToggleBtn: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: '#18181b',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27272a',
    },
    drawingToggleBtnActive: {
        backgroundColor: '#1E293B', borderColor: '#38BDF8',
    },
    offlineStrip: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingVertical: 5,
        borderBottomWidth: 1, borderBottomColor: 'rgba(245, 158, 11, 0.25)',
    },
    offlineStripText: { color: '#FCD34D', fontSize: 11, fontWeight: '600' },
    scrollContent: { paddingHorizontal: 18, paddingVertical: 16, paddingBottom: 100 },
    titleInput: {
        color: '#F8FAFC', fontSize: 22, fontWeight: '700', paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: '#1E293B', marginBottom: 14,
    },
    contentInput: {
        color: '#E2E8F0', fontSize: 15, lineHeight: 24, minHeight: 180,
        textAlignVertical: 'top', paddingVertical: 8,
    },
    drawingSection: { marginTop: 16 },
    drawingSectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8,
    },
    drawingSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    drawingSectionTitle: { color: '#38BDF8', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
    hideDrawingBtn: { padding: 4 },
    hideDrawingText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
    addDrawingBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#111827', borderWidth: 1, borderColor: '#1E293B',
        borderRadius: 14, paddingVertical: 14, marginTop: 24,
    },
    addDrawingBtnText: { color: '#38BDF8', fontSize: 13, fontWeight: '600' },
});
