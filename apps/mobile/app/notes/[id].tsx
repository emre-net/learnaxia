import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api, { API_BASE_URL } from '@/lib/api';

interface Note {
    id?: string;
    title: string;
    content: string;
}

export default function NoteEditorScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const webViewRef = useRef<WebView>(null);

    const [note, setNote] = useState<Note | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSavedIndicator, setShowSavedIndicator] = useState(false);

    // Save timeout ref for debouncing
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 1. Fetch Note Data
    useEffect(() => {
        const fetchNote = async () => {
            if (!id || id === 'new') {
                setNote({ title: '', content: '' });
                setIsLoading(false);
                return;
            }

            try {
                // GET endpoint for a single note
                const res = await api.get(`/mobile/notes/${id}`);
                setNote(res.data);
            } catch (error) {
                console.error('[NoteEditor] Error fetching note:', error);
                // Fallback to empty if not found
                setNote({ title: '', content: '' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchNote();
    }, [id]);

    // 2. Handle Messages from WebView (Content Updates)
    const handleMessage = async (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'READY') {
                // WebView is ready, send the initial content
                webViewRef.current?.injectJavaScript(`
                    window.postMessage(JSON.stringify({
                        type: 'INIT',
                        content: ${JSON.stringify(note?.content || '')}
                    }), '*');
                    true;
                `);
            } else if (data.type === 'CONTENT_CHANGED') {
                // Content updated from BlockNote
                saveNote(note?.title || '', data.content);
            }
        } catch (error) {
            console.error('[NoteEditor] Error parsing WebView message:', error);
        }
    };

    // 3. Save Logic
    const saveNote = async (title: string, content: string) => {
        if (!content.trim() || content === "[]" || content === '[{"type":"paragraph"}]') return;

        setIsSaving(true);
        setShowSavedIndicator(false);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                if (id === 'new') {
                    // Create new
                    const res = await api.post('/mobile/notes', { title, content });
                    // To do: update the router params to point to the new ID without pushing a new screen
                    router.setParams({ id: res.data.id });
                } else {
                    // Update existing
                 const res = await api.patch(`/mobile/notes/${id}`, { title, content });
                }

                setIsSaving(false);
                setShowSavedIndicator(true);

                // Hide the "Saved" indicator after 2 seconds
                setTimeout(() => setShowSavedIndicator(false), 2000);
            } catch (error) {
                console.error('[NoteEditor] Save failed:', error);
                setIsSaving(false);
            }
        }, 1000);
    };

    if (isLoading) {
        return (
            <Screen style={{ flex: 1, backgroundColor: '#04101A', alignItems: 'center', justifyContent: 'center' }}>
                <BrandLoader size={80} label="Not Yükleniyor..." />
            </Screen>
        );
    }

    return (
        <Screen style={{ flex: 1, backgroundColor: '#04101A' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Minimal Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 8, marginLeft: -8, borderRadius: 20 }}
                    >
                        <MaterialIcons name="arrow-back-ios" size={20} color="#9CA3AF" />
                        <Text style={{ color: '#9CA3AF', fontWeight: '500', marginLeft: 4 }}>Notlar</Text>
                    </TouchableOpacity>

                    {/* Auto-save Status Indicator */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isSaving ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <BrandLoader size={16} showBlur={false} />
                                <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 8 }}>Kaydediliyor...</Text>
                            </View>
                        ) : showSavedIndicator ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialIcons name="cloud-done" size={14} color="#9CA3AF" />
                                <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 4 }}>Kaydedildi</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* WebView Editor Canvas */}
                <View style={{ flex: 1 }}>
                    <WebView
                        ref={webViewRef}
                        source={{ uri: API_BASE_URL.replace('/api', '/mobile-editor') }}
                        style={{ flex: 1, backgroundColor: '#04101A' }}
                        onMessage={handleMessage}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        hideKeyboardAccessoryView={true}
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
}
