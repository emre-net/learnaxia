import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView,
    Alert, StatusBar, StyleSheet
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawingCanvas } from '@/components/drawing';
import { DrawingCanvasData, serializeNoteContent } from '@learnaxia/shared';

const NOTE_CACHE_PREFIX = 'learnaxia_note_';

export default function NewNoteScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
    const [drawingData, setDrawingData] = useState<DrawingCanvasData | null>(null);
    const [showDrawing, setShowDrawing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const hasContent = content.trim().length > 0 || (drawingData && drawingData.paths.length > 0);

    const handleSave = async () => {
        if (!hasContent) {
            Alert.alert('Hata', 'Not metni veya bir çizim eklemelisiniz.');
            return;
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const finalContent = serializeNoteContent({
            editedText: content.trim(),
            textWasEdited: true,
            drawing: drawingData,
        });

        const noteTitle = title.trim() || 'İsimsiz Not';

        try {
            const res = await api.post('/mobile/notes', {
                title: noteTitle,
                content: finalContent,
                visibility,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            if (res.data?.id) {
                await AsyncStorage.setItem(
                    `${NOTE_CACHE_PREFIX}${res.data.id}`,
                    JSON.stringify({ id: res.data.id, title: noteTitle, content: finalContent, visibility })
                );
                router.replace(`/notes/${res.data.id}` as any);
            } else {
                router.back();
            }
        } catch (error) {
            if (__DEV__) console.warn('[NewNoteScreen] Remote save failed, saving locally:', error);
            const localId = `local_note_${Date.now()}`;
            await AsyncStorage.setItem(
                `${NOTE_CACHE_PREFIX}${localId}`,
                JSON.stringify({ id: localId, title: noteTitle, content: finalContent, visibility })
            );
            Alert.alert(
                'Çevrimdışı Kaydedildi',
                'İnternet bağlantısı kurulamadığı için not cihazınıza kaydedildi.',
                [{ text: 'Tamam', onPress: () => router.back() }]
            );
            setSaving(false);
        }
    };

    const toggleDrawingArea = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowDrawing((prev) => !prev);
    };

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#09090B" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={20} color="#E4E4E7" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yeni Not</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setVisibility((v) => (v === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'));
                        }}
                        style={styles.visBtn}
                    >
                        <Ionicons
                            name={visibility === 'PUBLIC' ? 'globe-outline' : 'lock-closed-outline'}
                            size={17}
                            color={visibility === 'PUBLIC' ? '#10B981' : '#A1A1AA'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving || !hasContent}
                        style={[styles.saveBtn, (saving || !hasContent) && styles.saveBtnDisabled]}
                    >
                        {saving ? (
                            <BrandLoader size={16} showBlur={false} />
                        ) : (
                            <MaterialIcons name="check" size={16} color="#09090B" />
                        )}
                        <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor' : 'Kaydet'}</Text>
                    </TouchableOpacity>
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
                        style={[styles.titleInput, focusedField === 'title' && styles.titleInputFocused]}
                        placeholder="Not Başlığı"
                        placeholderTextColor="#52525B"
                        value={title}
                        onChangeText={setTitle}
                        editable={!saving}
                        onFocus={() => setFocusedField('title')}
                        onBlur={() => setFocusedField(null)}
                        returnKeyType="next"
                        maxLength={100}
                    />

                    <View style={styles.divider} />

                    <TextInput
                        style={styles.contentInput}
                        placeholder="Notunuzu buraya yazın..."
                        placeholderTextColor="#52525B"
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                        editable={!saving}
                        onFocus={() => setFocusedField('content')}
                        onBlur={() => setFocusedField(null)}
                    />

                    {showDrawing ? (
                        <View style={styles.drawingSection}>
                            <View style={styles.drawingSectionHeader}>
                                <View style={styles.drawingTitleRow}>
                                    <MaterialIcons name="brush" size={16} color="#38BDF8" />
                                    <Text style={styles.drawingSectionTitle}>El Yazısı ve Çizim Alanı</Text>
                                </View>
                                <TouchableOpacity onPress={toggleDrawingArea} style={styles.hideDrawingBtn}>
                                    <Text style={styles.hideDrawingText}>Gizle</Text>
                                </TouchableOpacity>
                            </View>

                            <DrawingCanvas
                                initialData={drawingData || undefined}
                                onChange={setDrawingData}
                                height={320}
                            />
                        </View>
                    ) : (
                        <TouchableOpacity onPress={toggleDrawingArea} style={styles.addDrawingBtn}>
                            <MaterialIcons name="gesture" size={18} color="#38BDF8" />
                            <Text style={styles.addDrawingBtnText}>
                                {drawingData && drawingData.paths.length > 0
                                    ? 'Çizimi Görüntüle / Düzenle'
                                    : '+ El Yazısı veya Çizim Alanı Ekle'}
                            </Text>
                        </TouchableOpacity>
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
    closeBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    headerTitle: {
        color: '#F4F4F5',
        fontSize: 16,
        fontWeight: '700',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    visBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#38BDF8',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 16,
        gap: 6,
    },
    saveBtnDisabled: {
        backgroundColor: '#18181B',
        opacity: 0.5,
    },
    saveBtnText: {
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
        fontSize: 22,
        fontWeight: '700',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent',
    },
    titleInputFocused: {
        borderBottomColor: '#38BDF8',
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
        minHeight: 160,
    },
    drawingSection: {
        marginTop: 24,
    },
    drawingSectionHeader: {
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
