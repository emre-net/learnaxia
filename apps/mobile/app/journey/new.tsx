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
import { useLanguage } from '@/hooks/use-language';
import { extractApiErrorMessage } from '@learnaxia/shared';

interface SyllabusStep {
    order: number;
    title: string;
    overview?: string;
    estimatedMinutes?: number;
}

export default function NewJourneyScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const [topic, setTopic] = useState('');
    const [goal, setGoal] = useState('');
    const [depth, setDepth] = useState<'shallow' | 'standard' | 'deep'>('standard');
    const [syllabus, setSyllabus] = useState<SyllabusStep[] | null>(null);
    const [instruction, setInstruction] = useState('');
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleGenerateSyllabus = async () => {
        const trimmedTopic = topic.trim();
        if (trimmedTopic.length < 3) {
            Alert.alert('Hata', 'Lütfen geçerli bir konu girin (en az 3 karakter).');
            return;
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const genRes = await api.post('/ai/learning-path/generate', {
                topic: trimmedTopic,
                goal: goal.trim() || undefined,
                depth,
                language,
            });

            if (!Array.isArray(genRes.data?.syllabus) || genRes.data.syllabus.length === 0) {
                throw new Error('Yol haritası üretilemedi.');
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSyllabus(genRes.data.syllabus);
        } catch (error) {
            Alert.alert('Hata', extractApiErrorMessage(error, 'Yol haritası üretilirken bir sorun yaşandı.'));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setSaving(false);
        }
    };

    const handleModifySyllabus = async (presetInstruction: string) => {
        if (!syllabus || !presetInstruction.trim()) return;
        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const res = await api.post('/ai/learning-path/modify', {
                topic: topic.trim(),
                depth,
                instruction: presetInstruction.trim(),
                syllabus,
                language,
            });
            if (Array.isArray(res.data?.syllabus) && res.data.syllabus.length > 0) {
                setSyllabus(res.data.syllabus);
                setInstruction('');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            Alert.alert('Hata', extractApiErrorMessage(error, 'Müfredat güncellenemedi.'));
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveStep = (order: number) => {
        if (!syllabus || syllabus.length <= 1) {
            Alert.alert('Uyarı', 'Öğrenme rotasında en az 1 adım kalmalıdır.');
            return;
        }
        setSyllabus(
            syllabus
                .filter((s) => s.order !== order)
                .map((s, idx) => ({ ...s, order: idx + 1 }))
        );
    };

    const handleStartJourney = async () => {
        if (!syllabus || syllabus.length === 0) return;
        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const startRes = await api.post('/ai/learning-path/start', {
                topic: topic.trim(),
                depth,
                syllabus,
            });

            if (startRes.data?.journeyId) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace(`/journey/${startRes.data.journeyId}` as any);
            } else {
                throw new Error('Yolculuk başlatılamadı.');
            }
        } catch (error) {
            Alert.alert('Hata', extractApiErrorMessage(error, 'Öğrenme rotası başlatılamadı.'));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setSaving(false);
        }
    };

    const isDisabled = saving || topic.trim().length < 3;

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#09090B" />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => (syllabus ? setSyllabus(null) : router.back())}
                    style={styles.closeBtn}
                    disabled={saving}
                >
                    <MaterialIcons name={syllabus ? 'arrow-back' : 'close'} size={20} color="#E4E4E7" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {syllabus ? 'Müfredatı İncele' : 'Yeni Yolculuk'}
                </Text>
                <View style={styles.placeholderBtn} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {!syllabus ? (
                    <>
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                            <View style={styles.iconWrapper}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="sparkles" size={38} color="#38BDF8" />
                                </View>
                            </View>

                            <Text style={styles.pageTitle}>Yapay Zeka ile Öğrenme Rotası</Text>
                            <Text style={styles.pageDesc}>
                                Öğrenmek istediğin konuyu ve varsa hedefini yaz. AI senin için adım adım bir müfredat oluştursun.
                            </Text>

                            <Text style={styles.sectionLabel}>Öğrenmek İstediğin Konu</Text>
                            <View style={[styles.inputContainer, focusedField === 'topic' && styles.inputFocused]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Örn: Kuantum Fiziği, React Native..."
                                    placeholderTextColor="#52525B"
                                    value={topic}
                                    onChangeText={setTopic}
                                    editable={!saving}
                                    onFocus={() => setFocusedField('topic')}
                                    onBlur={() => setFocusedField(null)}
                                    returnKeyType="next"
                                />
                            </View>

                            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Hedefin (İsteğe Bağlı)</Text>
                            <View style={[styles.inputContainer, focusedField === 'goal' && styles.inputFocused]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Örn: YKS sınavına yönelik temel kavramlar"
                                    placeholderTextColor="#52525B"
                                    value={goal}
                                    onChangeText={setGoal}
                                    editable={!saving}
                                    onFocus={() => setFocusedField('goal')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>

                            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Derinlik Seviyesi</Text>
                            <View style={styles.depthContainer}>
                                {(['shallow', 'standard', 'deep'] as const).map((d) => (
                                    <TouchableOpacity
                                        key={d}
                                        onPress={() => setDepth(d)}
                                        disabled={saving}
                                        style={[styles.depthBtn, depth === d && styles.depthBtnActive]}
                                    >
                                        <Text style={[styles.depthBtnText, depth === d && styles.depthBtnTextActive]}>
                                            {d === 'shallow' ? 'Temel' : d === 'standard' ? 'Standart' : 'Derinlemesine'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={styles.bottomArea}>
                            <TouchableOpacity
                                onPress={handleGenerateSyllabus}
                                disabled={isDisabled}
                                style={[styles.generateBtn, isDisabled && styles.generateBtnDisabled]}
                            >
                                {saving ? (
                                    <>
                                        <BrandLoader size={20} showBlur={false} />
                                        <Text style={styles.generateBtnText}>Müfredat Hazırlanıyor...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="color-wand" size={20} color="#09090B" />
                                        <Text style={styles.generateBtnText}>Müfredat Oluştur</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
                            <Text style={styles.previewTopic}>{topic}</Text>
                            <Text style={styles.previewSub}>
                                {syllabus.length} adım oluşturuldu. Başlatmadan önce adımları düzenleyebilirsin.
                            </Text>

                            <View style={styles.quickModifyRow}>
                                <TouchableOpacity
                                    style={styles.quickModifyBtn}
                                    onPress={() => handleModifySyllabus('Daha fazla detay ve pratik örnek ekleyerek genişlet')}
                                    disabled={saving}
                                >
                                    <Text style={styles.quickModifyText}>+ Genişlet</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.quickModifyBtn}
                                    onPress={() => handleModifySyllabus('Daha kısa, öz ve hızlı öğrenilecek şekilde sadeleştir')}
                                    disabled={saving}
                                >
                                    <Text style={styles.quickModifyText}>Kısalt</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.quickModifyBtn}
                                    onPress={() => handleModifySyllabus('Akademik ve derinlemesine terminoloji kullan')}
                                    disabled={saving}
                                >
                                    <Text style={styles.quickModifyText}>Akademik</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.customInstructRow}>
                                <TextInput
                                    style={styles.customInstructInput}
                                    placeholder="AI'a özel düzenleme komutu ver..."
                                    placeholderTextColor="#52525B"
                                    value={instruction}
                                    onChangeText={setInstruction}
                                    editable={!saving}
                                />
                                <TouchableOpacity
                                    style={[styles.applyInstructBtn, (!instruction.trim() || saving) && { opacity: 0.4 }]}
                                    onPress={() => handleModifySyllabus(instruction)}
                                    disabled={!instruction.trim() || saving}
                                >
                                    <Ionicons name="send" size={16} color="#09090B" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.stepsList}>
                                {syllabus.map((step, idx) => (
                                    <View key={`${step.order}-${idx}`} style={styles.stepCard}>
                                        <View style={styles.stepNumBadge}>
                                            <Text style={styles.stepNumText}>{idx + 1}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.stepTitle}>{step.title}</Text>
                                            {step.overview && (
                                                <Text style={styles.stepOverview}>{step.overview}</Text>
                                            )}
                                        </View>
                                        <TouchableOpacity onPress={() => handleRemoveStep(step.order)} style={{ padding: 6 }}>
                                            <Ionicons name="close-circle-outline" size={20} color="#71717A" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={styles.bottomArea}>
                            <TouchableOpacity
                                onPress={handleStartJourney}
                                disabled={saving}
                                style={[styles.generateBtn, saving && styles.generateBtnDisabled]}
                            >
                                {saving ? (
                                    <>
                                        <BrandLoader size={20} showBlur={false} />
                                        <Text style={styles.generateBtnText}>Rota Başlatılıyor...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="play" size={18} color="#09090B" />
                                        <Text style={styles.generateBtnText}>Yolculuğu Başlat</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#09090B' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: '#18181B',
    },
    closeBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#121215',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27272A',
    },
    headerTitle: { color: '#F4F4F5', fontWeight: '700', fontSize: 17 },
    placeholderBtn: { width: 40, height: 40 },
    scrollContent: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 60 },
    iconWrapper: { alignItems: 'center', marginBottom: 18 },
    iconContainer: {
        width: 84, height: 84, borderRadius: 28, backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.28)', alignItems: 'center', justifyContent: 'center',
    },
    pageTitle: { color: '#F4F4F5', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    pageDesc: { color: '#A1A1AA', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
    sectionLabel: { color: '#A1A1AA', fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
    inputContainer: {
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A', borderRadius: 14,
        paddingHorizontal: 16, paddingVertical: 14,
    },
    inputFocused: { borderColor: '#38BDF8' },
    input: { color: '#F4F4F5', fontSize: 15, fontWeight: '500' },
    depthContainer: { flexDirection: 'row', gap: 8, marginTop: 4 },
    depthBtn: {
        flex: 1, paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A', borderRadius: 12,
    },
    depthBtnActive: { backgroundColor: 'rgba(56, 189, 248, 0.14)', borderColor: '#38BDF8' },
    depthBtnText: { color: '#71717A', fontSize: 13, fontWeight: '600' },
    depthBtnTextActive: { color: '#38BDF8', fontWeight: '700' },
    bottomArea: {
        paddingHorizontal: 20, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 18,
        borderTopWidth: 1, borderTopColor: '#18181B', backgroundColor: '#09090B',
    },
    generateBtn: {
        backgroundColor: '#38BDF8', height: 54, borderRadius: 14, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    generateBtnDisabled: { backgroundColor: '#18181B', opacity: 0.6 },
    generateBtnText: { color: '#09090B', fontSize: 16, fontWeight: '700' },
    previewTopic: { color: '#F4F4F5', fontSize: 20, fontWeight: '800', marginBottom: 4 },
    previewSub: { color: '#A1A1AA', fontSize: 13, marginBottom: 16 },
    quickModifyRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    quickModifyBtn: {
        flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: '#121215',
        borderWidth: 1, borderColor: '#27272A', alignItems: 'center',
    },
    quickModifyText: { color: '#38BDF8', fontSize: 12, fontWeight: '600' },
    customInstructRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
    customInstructInput: {
        flex: 1, backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#F4F4F5', fontSize: 13,
    },
    applyInstructBtn: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#38BDF8',
        alignItems: 'center', justifyContent: 'center',
    },
    stepsList: { gap: 10 },
    stepCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#121215',
        borderWidth: 1, borderColor: '#27272A', borderRadius: 14, padding: 14,
    },
    stepNumBadge: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(56, 189, 248, 0.14)',
        alignItems: 'center', justifyContent: 'center',
    },
    stepNumText: { color: '#38BDF8', fontSize: 13, fontWeight: '700' },
    stepTitle: { color: '#F4F4F5', fontSize: 15, fontWeight: '700', marginBottom: 4 },
    stepOverview: { color: '#A1A1AA', fontSize: 13, lineHeight: 18 },
});
