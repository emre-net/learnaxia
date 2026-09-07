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

export default function NewCollectionScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSave = async () => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            Alert.alert('Hata', 'Koleksiyon adı boş olamaz.');
            return;
        }
        if (trimmedTitle.length < 2) {
            Alert.alert('Hata', 'Koleksiyon adı en az 2 karakter olmalıdır.');
            return;
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const res = await api.post('/mobile/collections', {
                title: trimmedTitle,
                description: description.trim() || undefined,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Oluşturulan koleksiyona doğrudan git
            if (res.data?.id) {
                router.replace(`/collections/${res.data.id}` as any);
            } else {
                router.back();
            }
        } catch (error) {
            console.error('[NewCollectionScreen] Error saving collection:', error);
            Alert.alert('Hata', 'Koleksiyon oluşturulurken bir sorun oluştu.');
            setSaving(false);
        }
    };

    const isDisabled = saving || title.trim().length < 2;

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
                <Text style={styles.headerTitle}>Yeni Koleksiyon</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isDisabled}
                    style={[styles.saveBtn, isDisabled && styles.saveBtnDisabled]}
                >
                    {saving
                        ? <BrandLoader size={16} showBlur={false} />
                        : <MaterialIcons name="check" size={16} color="white" />
                    }
                    <Text style={styles.saveBtnText}>
                        {saving ? 'Oluşturuluyor' : 'Oluştur'}
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
                    {/* Ikon */}
                    <View style={styles.iconWrapper}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="folder-special" size={40} color="#A855F7" />
                        </View>
                    </View>

                    {/* Koleksiyon Adı */}
                    <Text style={styles.fieldLabel}>Koleksiyon Adı</Text>
                    <View style={[styles.inputContainer, focusedField === 'title' && styles.inputFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: İngilizce Kelimeler"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            value={title}
                            onChangeText={setTitle}
                            editable={!saving}
                            onFocus={() => setFocusedField('title')}
                            onBlur={() => setFocusedField(null)}
                            returnKeyType="next"
                        />
                        {title.length >= 2 && (
                            <MaterialIcons name="check-circle" size={20} color="#10B981" />
                        )}
                    </View>
                    {title.length > 0 && title.length < 2 && (
                        <Text style={styles.fieldHint}>En az 2 karakter gerekli</Text>
                    )}

                    {/* Açıklama */}
                    <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Açıklama (İsteğe Bağlı)</Text>
                    <View style={[styles.inputContainer, styles.textareaContainer, focusedField === 'desc' && styles.inputFocused]}>
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Bu koleksiyon ne hakkında?"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            textAlignVertical="top"
                            editable={!saving}
                            onFocus={() => setFocusedField('desc')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>
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
        gap: 4,
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
        paddingBottom: 80,
    },
    iconWrapper: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 8,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 32,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fieldLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#090F1D',
        borderWidth: 1,
        borderColor: '#182234',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    textareaContainer: {
        alignItems: 'flex-start',
        paddingTop: 14,
    },
    inputFocused: {
        borderColor: '#3B82F6',
    },
    input: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '600',
    },
    textarea: {
        minHeight: 120,
        fontSize: 16,
        fontWeight: '400',
        textAlignVertical: 'top',
    },
    fieldHint: {
        color: '#EF4444',
        fontSize: 11,
        marginTop: 4,
        marginLeft: 4,
        fontWeight: '500',
    },
});
