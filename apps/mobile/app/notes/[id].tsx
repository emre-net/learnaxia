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
import {
    DrawingCanvasData,
    parseNoteContent,
    serializeNoteContent,
    ParsedNoteContent,
} from '@learnaxia/shared';
import { useAuth } from '@/context/AuthContext';

const NOTE_CACHE_PREFIX = 'learnaxia_note_';

export default function NoteEditorScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
    const [drawingData, setDrawingData] = useState<DrawingCanvasData | null>(null);
    const [showDrawing, setShowDrawing] = useState(false);
    const [isOwner, setIsOwner] = useState(true);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [savedIndicator, setSavedIndicator] = useState<string | null>(null);

    const parsedOriginalRef = useRef<ParsedNoteContent | null>(null);
    const textWasEditedRef = useRef(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const fetchNote = async () => {
            if (!id) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await api.get(`/mobile/notes/${id}`);
                const data = res.data;
                setTitle(data.title || '');
                setVisibility(data.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE');
                const noteOwnerId = data.userId || data.owner?.id;
                setIsOwner(!user?.id || !noteOwnerId || noteOwnerId === user.id);

                if (typeof data.content === 'string') {
                    const parsed = parseNoteContent(data.content);
                    parsedOriginalRef.current = parsed;
                    setContent(parsed.plainText);
                    if (parsed.drawing) {
                        setDrawingData(parsed.drawing);
                        setShowDrawing(true);
                    }
                }

                setIsOffline(false);
                await AsyncStorage.setItem(`${NOTE_CACHE_PREFIX}${id}`, JSON.stringify(data));
            } catch (error) {
                if (__DEV__) console.warn('[NoteEditor] Offline cache fallback:', error);
                const cached = await AsyncStorage.getItem(`${NOTE_CACHE_PREFIX}${id}`);
                if (cached) {
                    const data = JSON.parse(cached);
                    setTitle(data.title || '');
                    setVisibility(data.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE');
                    if (typeof data.content === 'string') {
                        const parsed = parseNoteContent(data.content);
                        parsedOriginalRef.current = parsed;
                        setContent(parsed.plainText);
                        if (parsed.drawing) {
                            setDrawingData(parsed.drawing);
                            setShowDrawing(true);
                        }
                    }
                    setIsOffline(true);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchNote();
    }, [id, user?.id]);

    const saveNote = useCallback(
        async (
            newTitle: string,
            newText: string,
            newDrawing: DrawingCanvasData | null,
            newVisibility: 'PUBLIC' | 'PRIVATE'
        ) => {
            if (!id || !isOwner) return;
            setIsSaving(true);

            const serializedContent = serializeNoteContent({
                editedText: newText,
                parsedOriginal: parsedOriginalRef.current,
                textWasEdited: textWasEditedRef.current,
                drawing: newDrawing,
            });

            try {
                await api.patch(`/mobile/notes/${id}`, {
                    title: newTitle || 'İsimsiz Not',
                    content: serializedContent,
                    visibility: newVisibility,
                });

                await AsyncStorage.setItem(
                    `${NOTE_CACHE_PREFIX}${id}`,
                    JSON.stringify({ id, title: newTitle, content: serializedContent, visibility: newVisibility })
                );

                setIsOffline(false);
                setSavedIndicator('Kaydedildi');
                setTimeout(() => setSavedIndicator(null), 2000);
            } catch {
                await AsyncStorage.setItem(
                    `${NOTE_CACHE_PREFIX}${id}`,
                    JSON.stringify({ id, title: newTitle, content: serializedContent, visibility: newVisibility })
                );
                setIsOffline(true);
                setSavedIndicator('Cihazda Kaydedildi');
            } finally {
                setIsSaving(false);
            }
        },
        [id, isOwner]
    );

    const scheduleSave = useCallback(
        (
            newTitle: string,
            newText: string,
            newDrawing: DrawingCanvasData | null,
            newVisibility: 'PUBLIC' | 'PRIVATE'
        ) => {
            if (!isOwner) return;
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            setSavedIndicator('Yazılıyor...');
            saveTimeoutRef.current = setTimeout(() => {
                saveNote(newTitle, newText, newDrawing, newVisibility);
            }, 900);
        },
        [isOwner, saveNote]
    );

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const handleTitleChange = (text: string) => {
        if (!isOwner) return;
        setTitle(text);
        scheduleSave(text, content, drawingData, visibility);
    };

    const handleContentChange = (text: string) => {
        if (!isOwner) return;
        textWasEditedRef.current = true;
        setContent(text);
        scheduleSave(title, text, drawingData, visibility);
    };

    const handleDrawingChange = (data: DrawingCanvasData) => {
        if (!isOwner) return;
        setDrawingData(data);
        scheduleSave(title, content, data, visibility);
    };

    const toggleVisibility = () => {
        if (!isOwner) return;
        const nextVis = visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setVisibility(nextVis);
        scheduleSave(title, content, drawingData, nextVis);
    };

    const handleDeleteNote = () => {
        if (!id || !isOwner) return;
        Alert.alert(
            'Notu Sil',
            'Bu notu kalıcı olarak silmek istediğinizden emin misiniz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/mobile/notes/${id}`);
                            await AsyncStorage.removeItem(`${NOTE_CACHE_PREFIX}${id}`);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.back();
                        } catch {
                            Alert.alert('Hata', 'Not silinemedi.');
                        }
                    },
                },
            ]
        );
    };

    const toggleDrawingArea = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowDrawing((prev) => !prev);
    };

    if (isLoading) {
        return (
            <Screen style={styles.centerContainer}>
                <BrandLoader size="lg" label="Not yükleniyor..." />
            </Screen>
        );
    }

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#09090B" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={20} color="#E4E4E7" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    {isOffline ? (
                        <View style={styles.offlineBadge}>
                            <MaterialIcons name="cloud-off" size={14} color="#F59E0B" />
                            <Text style={styles.offlineText}>Çevrimdışı</Text>
                        </View>
                    ) : (
                        <Text style={styles.saveStatusText}>
                            {isSaving ? 'Kaydediliyor...' : savedIndicator || (isOwner ? 'Otomatik Kayıt' : 'Salt Okunur')}
                        </Text>
                    )}
                </View>

                <View style={styles.headerRight}>
                    {isOwner && (
                        <>
                            <TouchableOpacity onPress={toggleVisibility} style={styles.iconPillBtn}>
                                <Ionicons
                                    name={visibility === 'PUBLIC' ? 'globe-outline' : 'lock-closed-outline'}
                                    size={17}
                                    color={visibility === 'PUBLIC' ? '#10B981' : '#A1A1AA'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    saveNote(title, content, drawingData, visibility);
                                }}
                                style={styles.doneBtn}
                                disabled={isSaving}
                            >
                                <Text style={styles.doneBtnText}>Kaydet</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleDeleteNote} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <TextInput
                        style={styles.titleInput}
                        placeholder="Başlıksız Not"
                        placeholderTextColor="#52525B"
                        value={title}
                        onChangeText={handleTitleChange}
                        editable={isOwner}
                        maxLength={120}
                    />

                    <View style={styles.divider} />

                    <TextInput
                        style={styles.contentInput}
                        placeholder={isOwner ? 'Notlarınızı buraya yazmaya başlayın...' : 'Not içeriği boş.'}
                        placeholderTextColor="#52525B"
                        value={content}
                        onChangeText={handleContentChange}
                        editable={isOwner}
                        multiline
                        textAlignVertical="top"
                    />

                    {showDrawing ? (
                        <View style={styles.drawingSection}>
                            <View style={styles.drawingHeader}>
                                <View style={styles.drawingTitleRow}>
                                    <MaterialIcons name="brush" size={16} color="#38BDF8" />
                                    <Text style={styles.drawingSectionTitle}>El Yazısı ve Çizim Alanı</Text>
                                </View>
                                {isOwner && (
                                    <TouchableOpacity onPress={toggleDrawingArea} style={styles.hideDrawingBtn}>
                                        <Text style={styles.hideDrawingText}>Gizle</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <DrawingCanvas
                                initialData={drawingData || undefined}
                                onChange={handleDrawingChange}
                                readOnly={!isOwner}
                                height={340}
                            />
                        </View>
                    ) : (
                        isOwner && (
                            <TouchableOpacity onPress={toggleDrawingArea} style={styles.addDrawingBtn}>
                                <MaterialIcons name="gesture" size={18} color="#38BDF8" />
                                <Text style={styles.addDrawingBtnText}>
                                    {drawingData && drawingData.paths.length > 0
                                        ? 'Çizimi Görüntüle / Düzenle'
                                        : '+ El Yazısı veya Çizim Alanı Ekle'}
                                </Text>
                            </TouchableOpacity>
                        )
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#09090B',
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#09090B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#18181B',
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconPillBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    offlineText: {
        color: '#F59E0B',
        fontSize: 12,
        fontWeight: '600',
    },
    saveStatusText: {
        color: '#71717A',
        fontSize: 12,
        fontWeight: '600',
    },
    doneBtn: {
        backgroundColor: '#38BDF8',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
    },
    doneBtnText: {
        color: '#09090B',
        fontSize: 13,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 60,
    },
    titleInput: {
        color: '#F4F4F5',
        fontSize: 24,
        fontWeight: '800',
        paddingVertical: 8,
        letterSpacing: -0.3,
    },
    divider: {
        height: 1,
        backgroundColor: '#18181B',
        marginVertical: 14,
    },
    contentInput: {
        color: '#E4E4E7',
        fontSize: 16,
        lineHeight: 24,
        minHeight: 180,
    },
    drawingSection: {
        marginTop: 24,
    },
    drawingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    drawingTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    drawingSectionTitle: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
    },
    hideDrawingBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#18181B',
    },
    hideDrawingText: {
        color: '#A1A1AA',
        fontSize: 12,
        fontWeight: '600',
    },
    addDrawingBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.25)',
        borderStyle: 'dashed',
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 24,
    },
    addDrawingBtnText: {
        color: '#38BDF8',
        fontSize: 14,
        fontWeight: '600',
    },
});
