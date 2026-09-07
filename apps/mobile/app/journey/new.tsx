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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import { useLanguage } from '@/hooks/use-language';

export default function NewJourneyScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const [topic, setTopic] = useState('');
    const [depth, setDepth] = useState<'basic' | 'standard' | 'deep'>('standard');
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleGenerate = async () => {
        const trimmedTopic = topic.trim();
        if (trimmedTopic.length < 3) {
            Alert.alert('Hata', 'Lütfen geçerli bir konu girin (en az 3 karakter).');
            return;
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // 1. Syllabus Üretimi
            const genRes = await api.post('/ai/learning-path/generate', {
                topic: trimmedTopic,
                depth,
                language
            });

            if (!genRes.data.syllabus) throw new Error('Yol haritası üretilemedi.');

            // 2. Yolculuğu Başlat (Veritabanına kaydet ve arka planda slaytları üretmeye başla)
            const startRes = await api.post('/ai/learning-path/start', {
                topic: trimmedTopic,
                depth,
                syllabus: genRes.data.syllabus
            });

            if (startRes.data.journeyId) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace(`/study/${startRes.data.journeyId}` as any);
            } else {
                throw new Error('Yolculuk başlatılamadı.');
            }
        } catch (error: any) {
            console.error('[NewJourneyScreen] Error:', error);
            const errorMsg = error.response?.data?.error || 'Öğrenme rotası oluşturulurken bir sorun yaşandı.';
            Alert.alert('Hata', errorMsg);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setSaving(false);
        }
    };

    const isDisabled = saving || topic.trim().length < 3;

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#050A14', '#090F1D']} style={StyleSheet.absoluteFillObject} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} disabled={saving}>
                    <MaterialIcons name="close" size={20} color="#D1D5DB" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yeni Yolculuk</Text>
                <View style={styles.placeholderBtn} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    
                    <View style={styles.iconWrapper}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="sparkles" size={40} color="#6366f1" />
                        </View>
                    </View>
                    
                    <Text style={styles.pageTitle}>Yapay Zeka ile Öğrenme Rotası Çiz</Text>
                    <Text style={styles.pageDesc}>
                        Hangi konuyu öğrenmek istersen sadece yaz. AI senin için adım adım bir çalışma planı ve içerik oluşturacak.
                    </Text>

                    <Text style={styles.sectionLabel}>ÖĞRENMEK İSTEDİĞİN KONU</Text>
                    <View style={[styles.inputContainer, focusedField === 'topic' && styles.inputFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: Kuantum Fiziği, React Native..."
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            value={topic}
                            onChangeText={setTopic}
                            editable={!saving}
                            onFocus={() => setFocusedField('topic')}
                            onBlur={() => setFocusedField(null)}
                            returnKeyType="done"
                        />
                    </View>

                    <Text style={[styles.sectionLabel, { marginTop: 24 }]}>DERİNLİK (ZORLUK SEVİYESİ)</Text>
                    <View style={styles.depthContainer}>
                        {(['basic', 'standard', 'deep'] as const).map((d) => (
                            <TouchableOpacity
                                key={d}
                                onPress={() => setDepth(d)}
                                disabled={saving}
                                style={[
                                    styles.depthBtn,
                                    depth === d && styles.depthBtnActive
                                ]}
                            >
                                <Text style={[
                                    styles.depthBtnText,
                                    depth === d && styles.depthBtnTextActive
                                ]}>
                                    {d === 'basic' ? 'Temel' : d === 'standard' ? 'Standart' : 'Derinlemesine'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                </ScrollView>

                {/* Bottom Action Area */}
                <View style={styles.bottomArea}>
                    <TouchableOpacity
                        onPress={handleGenerate}
                        disabled={isDisabled}
                        style={[styles.generateBtn, isDisabled && styles.generateBtnDisabled]}
                    >
                        {saving ? (
                            <>
                                <BrandLoader size={20} showBlur={false} />
                                <Text style={styles.generateBtnText}>Syllabus Üretiliyor...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="color-wand" size={20} color="white" />
                                <Text style={styles.generateBtnText}>Yolculuk Oluştur</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#050A14' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingTop: 64, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    closeBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#090F1D',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#182234',
    },
    headerTitle: { color: '#F8FAFC', fontWeight: '600', fontSize: 18 },
    placeholderBtn: { width: 40, height: 40 },
    scrollContent: { paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 100 },
    iconWrapper: { alignItems: 'center', marginBottom: 24 },
    iconContainer: {
        width: 96, height: 96, borderRadius: 32, backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)', alignItems: 'center', justifyContent: 'center',
    },
    pageTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
    pageDesc: { color: '#94A3B8', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 16 },
    sectionLabel: { color: '#64748B', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
    inputContainer: {
        backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#111111', borderRadius: 16,
        paddingHorizontal: 16, paddingVertical: 18, marginBottom: 12,
    },
    inputFocused: { borderColor: '#6366f1' },
    input: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
    depthContainer: { flexDirection: 'row', gap: 8, marginTop: 4 },
    depthBtn: {
        flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#111111', borderRadius: 12,
    },
    depthBtnActive: { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366f1' },
    depthBtnText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    depthBtnTextActive: { color: '#6366f1', fontWeight: '700' },
    bottomArea: {
        paddingHorizontal: 24, paddingVertical: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: '#050A14',
    },
    generateBtn: {
        backgroundColor: '#6366f1', height: 60, borderRadius: 16, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    generateBtnDisabled: { backgroundColor: '#1E293B', shadowOpacity: 0, elevation: 0 },
    generateBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
