import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { BrandLoader } from '@/components/ui/brand-loader';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '@/lib/api';

interface Note {
    id?: string;
    title: string;
    content: string;
}

export default function NoteEditorScreen() {
    const { id } = useLocalSearchParams();
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
                // Assuming we have a standard GET endpoint for a single note
                const res = await api.get(`/notes/${id}`);
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
                    const res = await api.post('/notes', { title, content });
                    // To do: update the router params to point to the new ID without pushing a new screen
                    router.setParams({ id: res.data.id });
                } else {
                    // Update existing
                    await api.patch(`/notes/${id}`, { title, content });
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
            <SafeAreaView className="flex-1 items-center justify-center bg-[#04101A]">
                <BrandLoader size={80} label="Not Yükleniyor..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#04101A]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {/* Minimal Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/5">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex-row items-center p-2 -ml-2 rounded-full"
                    >
                        <MaterialIcons name="arrow-back-ios" size={20} color="#9CA3AF" />
                        <Text className="text-gray-400 font-medium ml-1">Notlar</Text>
                    </TouchableOpacity>

                    {/* Auto-save Status Indicator */}
                    <View className="flex-row items-center">
                        {isSaving ? (
                            <View className="flex-row items-center">
                                <BrandLoader size={16} showBlur={false} className="mr-2" />
                                <Text className="text-xs text-gray-400">Kaydediliyor...</Text>
                            </View>
                        ) : showSavedIndicator ? (
                            <View className="flex-row items-center">
                                <MaterialIcons name="cloud-done" size={14} color="#9CA3AF" className="mr-1" />
                                <Text className="text-xs text-gray-400">Kaydedildi</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* WebView Editor Canvas */}
                <View className="flex-1">
                    <WebView
                        ref={webViewRef}
                        source={{ uri: 'http://10.0.2.2:3000/mobile-editor' }} // Android Emulator to Host localhost
                        className="flex-1 bg-[#04101A]"
                        onMessage={handleMessage}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        hideKeyboardAccessoryView={true} // Crucial for a clean immersive experience
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
