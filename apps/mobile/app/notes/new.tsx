import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView,
    Alert, StatusBar, StyleSheet
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';

export default function NewNoteScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSave = async () => {
        const trimmedContent = content.trim();
        if (!trimmedContent) {
            Alert.alert('Hata', 'Not içeriği boş olamaz.');
            return;
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const res = await api.post('/mobile/notes', {
                title: title.trim() || 'İsimsiz Not',
                content: trimmedContent,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Kaydedilen nota doğrudan git
            if (res.data?.id) {
                router.replace(`/notes/${res.data.id}` as any);
            } else {
                router.back();
            }
        } catch (error) {
            console.error('[NewNoteScreen] Error saving note:', error);
            Alert.alert('Hata', 'Not kaydedilirken bir sorun oluştu.');
            setSaving(false);
        }
    };

    const charCount = content.length;

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#050A14', '#090F1D']}
                style={StyleSheet.absoluteFillObject}
            />

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
                    disabled={saving || !content.trim()}
                    style={[
                        styles.saveBtn,
                        (saving || !content.trim()) && styles.saveBtnDisabled
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
                        placeholderTextColor="rgba(255,255,255,0.2)"
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

                    {/* İçerik */}
                    <TextInput
                        style={[styles.contentInput]}
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

                    {/* Karakter sayacı */}
                    {charCount > 0 && (
                        <View style={styles.charCounter}>
                            <MaterialIcons name="edit" size={12} color="#475569" />
                            <Text style={styles.charCountText}>{charCount} karakter</Text>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#050A14',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#090F1D',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#182234',
    },
    headerTitle: {
        color: '#F8FAFC',
        fontWeight: '600',
        fontSize: 18,
    },
    saveBtn: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveBtnDisabled: {
        backgroundColor: '#182234',
        opacity: 0.5,
    },
    saveBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 4,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingVertical: 24,
        paddingBottom: 120,
        flexGrow: 1,
    },
    titleInput: {
        color: '#F8FAFC',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 8,
        paddingVertical: 4,
    },
    titleInputFocused: {
        // Fokus state'i için geri bildirim — underline yerine subtle renk değişimi
        color: '#FFFFFF',
    },
    divider: {
        height: 1,
        backgroundColor: '#182234',
        marginBottom: 20,
    },
    contentInput: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 17,
        lineHeight: 28,
        minHeight: 240,
        fontWeight: '400',
    },
    charCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        opacity: 0.5,
    },
    charCountText: {
        color: '#475569',
        fontSize: 11,
        marginLeft: 4,
        fontWeight: '500',
    },
});
