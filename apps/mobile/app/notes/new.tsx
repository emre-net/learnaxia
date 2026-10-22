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
import { DrawingCanvasData } from '@learnaxia/shared';

const NOTE_CACHE_PREFIX = 'learnaxia_note_';

export default function NewNoteScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
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

        let finalContent: string;
        if (drawingData && drawingData.paths.length > 0) {
            finalContent = JSON.stringify({
                text: content.trim(),
                drawing: drawingData,
            });
        } else {
            finalContent = content.trim();
        }

        const noteTitle = title.trim() || 'İsimsiz Not';

        try {
            const res = await api.post('/mobile/notes', {
                title: noteTitle,
                content: finalContent,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            if (res.data?.id) {
                // Cache note locally
                await AsyncStorage.setItem(
                    `${NOTE_CACHE_PREFIX}${res.data.id}`,
                    JSON.stringify({ id: res.data.id, title: noteTitle, content: finalContent })
                );
                router.replace(`/notes/${res.data.id}` as any);
            } else {
                router.back();
            }
        } catch (error) {
            console.warn('[NewNoteScreen] Remote save failed, saving locally:', error);
            // Save locally if offline
            const localId = `local_note_${Date.now()}`;
            await AsyncStorage.setItem(
                `${NOTE_CACHE_PREFIX}${localId}`,
                JSON.stringify({ id: localId, title: noteTitle, content: finalContent })
            );
            Alert.alert(
                'Çevrimdışı Kaydedildi',
                'İnternet bağlantısı kurulamadı ancak notunuz cihazınıza başarıyla kaydedildi.',
                [{ text: 'Tamam', onPress: () => router.back() }]
            );
            setSaving(false);
        }
    };

    const toggleDrawingArea = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowDrawing(prev => !prev);
    };

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#09090b" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.closeBtn}
                >
                    <MaterialIcons name="close" size={20} color="#D1D5DB" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yeni Not</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving || !hasContent}
                    style={[
                        styles.saveBtn,
                        (saving || !hasContent) && styles.saveBtnDisabled
                    ]}
                >
                    {saving
                        ? <BrandLoader size={16} showBlur={false} />
                        : <MaterialIcons name="check" size={16} color="white" />
                    }
                    <Text style={styles.saveBtnText}>
                        {saving ? 'Kaydediliyor' : 'Kaydet'}
                    </Text>
                </TouchableOpacity>
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
                    {/* Başlık */}
                    <TextInput
                        style={[
                            styles.titleInput,
                            focusedField === 'title' && styles.titleInputFocused
                        ]}
                        placeholder="Not Başlığı"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={title}
                        onChangeText={setTitle}
                        editable={!saving}
                        onFocus={() => setFocusedField('title')}
                        onBlur={() => setFocusedField(null)}
                        returnKeyType="next"
                        maxLength={100}
                    />

                    {/* Ayırıcı */}
                    <View style={styles.divider} />

                    {/* Metin İçeriği */}
                    <TextInput
                        style={styles.contentInput}
                        placeholder="Notunuzu buraya yazın..."
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                        editable={!saving}
                        onFocus={() => setFocusedField('content')}
                        onBlur={() => setFocusedField(null)}
                    />

                    {/* Çizim Tuvali / Alanı */}
                    {showDrawing ? (
                        <View style={styles.drawingSection}>
                            <View style={styles.drawingSectionHeader}>
                                <View style={styles.drawingTitleRow}>
                                    <MaterialIcons name="brush" size={16} color="#38BDF8" />
                                    <Text style={styles.drawingSectionTitle}>EL YAZISI VE ÇİZİM ALANI</Text>
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
    screen: {
        flex: 1,
        backgroundColor: '#09090b',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    closeBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#18181b',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#27272a',
    },
    headerTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#38BDF8',
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 20,
        gap: 6,
    },
    saveBtnDisabled: {
        backgroundColor: '#1E293B',
        opacity: 0.5,
    },
    saveBtnText: {
        color: '#09090b',
        fontSize: 13,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 100,
    },
    titleInput: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '700',
        paddingVertical: 10,
    },
    titleInputFocused: {
        color: '#FFFFFF',
    },
    divider: {
        height: 1,
        backgroundColor: '#1E293B',
        marginVertical: 12,
    },
    contentInput: {
        color: '#E2E8F0',
        fontSize: 15,
        lineHeight: 24,
        minHeight: 180,
        textAlignVertical: 'top',
        paddingVertical: 8,
    },
    drawingSection: {
        marginTop: 18,
    },
    drawingSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    drawingTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    drawingSectionTitle: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    hideDrawingBtn: {
        padding: 4,
    },
    hideDrawingText: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '600',
    },
    addDrawingBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#1E293B',
        borderRadius: 14,
        paddingVertical: 14,
        marginTop: 24,
    },
    addDrawingBtnText: {
        color: '#38BDF8',
        fontSize: 13,
        fontWeight: '600',
    },
});
