import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView,
    Alert, StatusBar, StyleSheet
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';

export type QuestionType = 'FLASHCARD' | 'MC' | 'TRUE_FALSE' | 'GAP';

interface NewItem {
    id: string;
    type: QuestionType;
    // Flashcard
    front: string;
    back: string;
    // MC
    mcQuestion: string;
    mcOptions: string[];
    mcCorrectIndex: number;
    mcExplanation: string;
    // True/False
    tfStatement: string;
    tfCorrect: boolean;
    tfExplanation: string;
    // Gap Fill
    gapText: string;
    gapExplanation: string;
}

const TYPE_CONFIG = [
    { type: 'FLASHCARD' as QuestionType, label: 'Flashcard', icon: 'layers' },
    { type: 'MC' as QuestionType, label: 'Çoktan Seçmeli', icon: 'radio-button-on' },
    { type: 'TRUE_FALSE' as QuestionType, label: 'Doğru/Yanlış', icon: 'checkmark-circle' },
    { type: 'GAP' as QuestionType, label: 'Boşluk Doldurma', icon: 'create' },
];

function createDefaultItem(type: QuestionType = 'FLASHCARD'): NewItem {
    return {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        type,
        front: '',
        back: '',
        mcQuestion: '',
        mcOptions: ['', '', '', ''],
        mcCorrectIndex: 0,
        mcExplanation: '',
        tfStatement: '',
        tfCorrect: true,
        tfExplanation: '',
        gapText: '',
        gapExplanation: '',
    };
}

export default function NewModuleScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [items, setItems] = useState<NewItem[]>([createDefaultItem('FLASHCARD')]);
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleAddItem = (type: QuestionType = 'FLASHCARD') => {
        setItems(prev => [...prev, createDefaultItem(type)]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length === 1) {
            Alert.alert('Uyarı', 'Modül en az 1 soru/kart içermelidir.');
            return;
        }
        setItems(prev => prev.filter(i => i.id !== id));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const setItemType = (id: string, type: QuestionType) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, type } : item));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const updateItem = (id: string, updates: Partial<NewItem>) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const updateMCOption = (itemId: string, optionIndex: number, text: string) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            const newOptions = [...item.mcOptions];
            newOptions[optionIndex] = text;
            return { ...item, mcOptions: newOptions };
        }));
    };

    const handleSave = async () => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            Alert.alert('Hata', 'Modül başlığı boş olamaz.');
            return;
        }

        // Validate items according to their types
        const validatedItems = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const num = i + 1;

            if (item.type === 'FLASHCARD') {
                if (!item.front.trim() || !item.back.trim()) {
                    Alert.alert('Eksik Bilgi', `Soru ${num} (Flashcard) için ön ve arka yüz metnini doldurun.`);
                    return;
                }
                validatedItems.push({
                    type: 'FLASHCARD',
                    order: i,
                    content: {
                        front: item.front.trim(),
                        back: item.back.trim(),
                        question: item.front.trim(),
                        answer: item.back.trim(),
                    }
                });
            } else if (item.type === 'MC') {
                if (!item.mcQuestion.trim()) {
                    Alert.alert('Eksik Bilgi', `Soru ${num} (Çoktan Seçmeli) için soru metnini girin.`);
                    return;
                }
                const filledOptions = item.mcOptions.map(o => o.trim());
                if (filledOptions.some(o => o === '')) {
                    Alert.alert('Eksik Bilgi', `Soru ${num} için 4 seçeneğin tamamını doldurun.`);
                    return;
                }
                validatedItems.push({
                    type: 'MC',
                    order: i,
                    content: {
                        question: item.mcQuestion.trim(),
                        options: filledOptions,
                        correctAnswer: filledOptions[item.mcCorrectIndex] || filledOptions[0],
                        explanation: item.mcExplanation.trim() || undefined,
                    }
                });
            } else if (item.type === 'TRUE_FALSE') {
                if (!item.tfStatement.trim()) {
                    Alert.alert('Eksik Bilgi', `Soru ${num} (Doğru/Yanlış) için önerme metnini girin.`);
                    return;
                }
                validatedItems.push({
                    type: 'TRUE_FALSE',
                    order: i,
                    content: {
                        statement: item.tfStatement.trim(),
                        question: item.tfStatement.trim(),
                        correctAnswer: item.tfCorrect,
                        explanation: item.tfExplanation.trim() || undefined,
                    }
                });
            } else if (item.type === 'GAP') {
                const regex = /\{\{([^}]+)\}\}/g;
                const matches = [];
                let m;
                while ((m = regex.exec(item.gapText)) !== null) {
                    matches.push(m[1].trim());
                }
                if (!item.gapText.trim() || matches.length === 0) {
                    Alert.alert(
                        'Eksik Bilgi',
                        `Soru ${num} (Boşluk Doldurma) içinde en az bir {{kelime}} formatında boşluk olmalıdır.\n\nÖrnek: Başkentimiz {{Ankara}} şehridir.`
                    );
                    return;
                }
                validatedItems.push({
                    type: 'GAP',
                    order: i,
                    content: {
                        text: item.gapText.trim(),
                        question: item.gapText.trim(),
                        answers: matches,
                        correctAnswer: matches[0],
                        explanation: item.gapExplanation.trim() || undefined,
                    }
                });
            }
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const primaryType = validatedItems[0]?.type || 'FLASHCARD';

            const res = await api.post('/modules', {
                title: trimmedTitle,
                type: primaryType,
                category: category.trim() || 'Genel',
                subCategory: subCategory.trim() || 'Genel',
                isForkable: true,
                status: 'ACTIVE',
                items: validatedItems
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            if (res.data?.id) {
                router.replace(`/study/${res.data.id}` as any);
            } else {
                router.back();
            }
        } catch (error) {
            console.error('[NewModuleScreen] Error saving module:', error);
            Alert.alert('Hata', 'Modül kaydedilirken bir sorun oluştu.');
            setSaving(false);
        }
    };

    const isDisabled = saving || title.trim().length < 1;

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#09090b" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={20} color="#D1D5DB" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Modül Oluştur</Text>
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
                    {/* Temel Bilgiler */}
                    <Text style={styles.sectionLabel}>MODÜL BİLGİLERİ</Text>

                    <View style={[styles.inputContainer, focusedField === 'title' && styles.inputFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Modül Başlığı (örn: Hücre Bölünmeleri)"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            value={title}
                            onChangeText={setTitle}
                            editable={!saving}
                            onFocus={() => setFocusedField('title')}
                            onBlur={() => setFocusedField(null)}
                            returnKeyType="next"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, styles.halfInput, focusedField === 'category' && styles.inputFocused]}>
                            <TextInput
                                style={styles.inputSmall}
                                placeholder="Kategori (Biyoloji, Tarih...)"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                value={category}
                                onChangeText={setCategory}
                                editable={!saving}
                                onFocus={() => setFocusedField('category')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                        <View style={[styles.inputContainer, styles.halfInput, focusedField === 'subCategory' && styles.inputFocused]}>
                            <TextInput
                                style={styles.inputSmall}
                                placeholder="Alt Kategori"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                value={subCategory}
                                onChangeText={setSubCategory}
                                editable={!saving}
                                onFocus={() => setFocusedField('subCategory')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    {/* Soru Listesi */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionLabel}>SORULAR & KARTLAR ({items.length})</Text>
                    </View>

                    {items.map((item, index) => (
                        <View key={item.id} style={styles.cardItem}>
                            {/* Card Top Bar */}
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <View style={styles.badgeIndex}>
                                        <Text style={styles.badgeIndexText}>#{index + 1}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleRemoveItem(item.id)}
                                    style={styles.removeBtn}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="trash-outline" size={17} color="#EF4444" />
                                </TouchableOpacity>
                            </View>

                            {/* Type Selector Tabs */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.typeTabsContainer}
                            >
                                {TYPE_CONFIG.map(cfg => {
                                    const active = item.type === cfg.type;
                                    return (
                                        <TouchableOpacity
                                            key={cfg.type}
                                            onPress={() => setItemType(item.id, cfg.type)}
                                            style={[styles.typeTab, active && styles.typeTabActive]}
                                        >
                                            <Ionicons
                                                name={cfg.icon as any}
                                                size={13}
                                                color={active ? '#6366F1' : '#71717A'}
                                            />
                                            <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>
                                                {cfg.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Conditional Form per Question Type */}
                            <View style={styles.cardBody}>
                                {item.type === 'FLASHCARD' && (
                                    <>
                                        <Text style={styles.fieldLabel}>ÖN YÜZ (SORU / KAVRAM)</Text>
                                        <TextInput
                                            style={styles.cardInput}
                                            placeholder="Ön yüzde görünecek soru veya terim..."
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            value={item.front}
                                            onChangeText={val => updateItem(item.id, { front: val })}
                                            editable={!saving}
                                            multiline
                                        />
                                        <View style={styles.cardDivider} />
                                        <Text style={[styles.fieldLabel, { color: '#38BDF8' }]}>ARKA YÜZ (CEVAP / AÇIKLAMA)</Text>
                                        <TextInput
                                            style={[styles.cardInput, styles.cardInputBack]}
                                            placeholder="Arka yüzde görünecek açıklama..."
                                            placeholderTextColor="rgba(56,189,248,0.4)"
                                            value={item.back}
                                            onChangeText={val => updateItem(item.id, { back: val })}
                                            editable={!saving}
                                            multiline
                                        />
                                    </>
                                )}

                                {item.type === 'MC' && (
                                    <>
                                        <Text style={styles.fieldLabel}>SORU METNİ</Text>
                                        <TextInput
                                            style={styles.cardInput}
                                            placeholder="Çoktan seçmeli soru metnini yazın..."
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            value={item.mcQuestion}
                                            onChangeText={val => updateItem(item.id, { mcQuestion: val })}
                                            editable={!saving}
                                            multiline
                                        />

                                        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                                            SEÇENEKLER (Doğru olanı işaretleyin)
                                        </Text>

                                        {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                                            const isCorrect = item.mcCorrectIndex === optIdx;
                                            return (
                                                <View key={letter} style={styles.mcOptionRow}>
                                                    <TouchableOpacity
                                                        onPress={() => updateItem(item.id, { mcCorrectIndex: optIdx })}
                                                        style={[styles.mcCheckBtn, isCorrect && styles.mcCheckBtnActive]}
                                                    >
                                                        <Text style={[styles.mcLetterText, isCorrect && styles.mcLetterTextActive]}>
                                                            {letter}
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <TextInput
                                                        style={[styles.mcInput, isCorrect && styles.mcInputCorrect]}
                                                        placeholder={`${letter} seçeneği`}
                                                        placeholderTextColor="rgba(255,255,255,0.25)"
                                                        value={item.mcOptions[optIdx]}
                                                        onChangeText={val => updateMCOption(item.id, optIdx, val)}
                                                        editable={!saving}
                                                    />
                                                </View>
                                            );
                                        })}

                                        <Text style={[styles.fieldLabel, { marginTop: 8 }]}>AÇIKLAMA (OPSİYONEL)</Text>
                                        <TextInput
                                            style={styles.singleLineInput}
                                            placeholder="Cevap açıklandığında gösterilecek not..."
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={item.mcExplanation}
                                            onChangeText={val => updateItem(item.id, { mcExplanation: val })}
                                            editable={!saving}
                                        />
                                    </>
                                )}

                                {item.type === 'TRUE_FALSE' && (
                                    <>
                                        <Text style={styles.fieldLabel}>ÖNERME / METİN</Text>
                                        <TextInput
                                            style={styles.cardInput}
                                            placeholder="Örnek: Mitokondri hücrenin enerji santralidir."
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            value={item.tfStatement}
                                            onChangeText={val => updateItem(item.id, { tfStatement: val })}
                                            editable={!saving}
                                            multiline
                                        />

                                        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>DOĞRU CEVAP</Text>
                                        <View style={styles.tfButtonsRow}>
                                            <TouchableOpacity
                                                onPress={() => updateItem(item.id, { tfCorrect: true })}
                                                style={[styles.tfChoiceBtn, item.tfCorrect && styles.tfChoiceCorrectActive]}
                                            >
                                                <MaterialIcons
                                                    name="check-circle"
                                                    size={16}
                                                    color={item.tfCorrect ? '#10B981' : '#71717A'}
                                                />
                                                <Text style={[styles.tfChoiceText, item.tfCorrect && styles.tfChoiceTextCorrect]}>
                                                    DOĞRU
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => updateItem(item.id, { tfCorrect: false })}
                                                style={[styles.tfChoiceBtn, !item.tfCorrect && styles.tfChoiceWrongActive]}
                                            >
                                                <MaterialIcons
                                                    name="cancel"
                                                    size={16}
                                                    color={!item.tfCorrect ? '#EF4444' : '#71717A'}
                                                />
                                                <Text style={[styles.tfChoiceText, !item.tfCorrect && styles.tfChoiceTextWrong]}>
                                                    YANLIŞ
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        <Text style={[styles.fieldLabel, { marginTop: 8 }]}>AÇIKLAMA (OPSİYONEL)</Text>
                                        <TextInput
                                            style={styles.singleLineInput}
                                            placeholder="Neden doğru veya yanlış olduğuna dair açıklama..."
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={item.tfExplanation}
                                            onChangeText={val => updateItem(item.id, { tfExplanation: val })}
                                            editable={!saving}
                                        />
                                    </>
                                )}

                                {item.type === 'GAP' && (
                                    <>
                                        <Text style={styles.fieldLabel}>METİN VE BOŞLUKLAR</Text>
                                        <View style={styles.gapHelperBox}>
                                            <Ionicons name="information-circle-outline" size={16} color="#6366F1" />
                                            <Text style={styles.gapHelperText}>
                                                Boş bırakılacak kelimeleri <Text style={{ color: '#A5B4FC', fontWeight: '700' }}>{"{{kelime}}"}</Text> şeklinde yazın.
                                            </Text>
                                        </View>
                                        <TextInput
                                            style={styles.cardInput}
                                            placeholder="Örnek: Türkiye Cumhuriyeti'nin başkenti {{Ankara}} şehridir."
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            value={item.gapText}
                                            onChangeText={val => updateItem(item.id, { gapText: val })}
                                            editable={!saving}
                                            multiline
                                        />

                                        <Text style={[styles.fieldLabel, { marginTop: 8 }]}>AÇIKLAMA (OPSİYONEL)</Text>
                                        <TextInput
                                            style={styles.singleLineInput}
                                            placeholder="İpucu veya açıklama..."
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={item.gapExplanation}
                                            onChangeText={val => updateItem(item.id, { gapExplanation: val })}
                                            editable={!saving}
                                        />
                                    </>
                                )}
                            </View>
                        </View>
                    ))}

                    {/* Hızlı Ekleme Butonları */}
                    <View style={styles.addButtonsSection}>
                        <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>YENİ SORU EKLE</Text>
                        <View style={styles.addGrid}>
                            {TYPE_CONFIG.map(cfg => (
                                <TouchableOpacity
                                    key={cfg.type}
                                    style={styles.addGridBtn}
                                    onPress={() => handleAddItem(cfg.type)}
                                    disabled={saving}
                                >
                                    <Ionicons name={cfg.icon as any} size={16} color="#6366F1" />
                                    <Text style={styles.addGridBtnText}>{cfg.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#09090b' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: '#27272a',
    },
    closeBtn: {
        width: 38, height: 38, borderRadius: 19, backgroundColor: '#18181b',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27272a',
    },
    headerTitle: { color: '#f4f4f5', fontWeight: '700', fontSize: 17 },
    saveBtn: {
        backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 9,
        borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    saveBtnDisabled: { backgroundColor: '#27272a', opacity: 0.5 },
    saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
    scrollContent: { paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 120 },
    sectionLabel: { color: '#71717a', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginLeft: 2 },
    sectionHeaderRow: { marginTop: 24, marginBottom: 4 },
    inputContainer: {
        backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12,
    },
    inputFocused: { borderColor: '#6366F1' },
    input: { color: '#f4f4f5', fontSize: 15, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 10 },
    halfInput: { flex: 1 },
    inputSmall: { color: '#f4f4f5', fontSize: 13 },
    cardItem: {
        backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 18,
        marginBottom: 16, overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#1F2430',
        borderBottomWidth: 1, borderBottomColor: '#2A3040',
    },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badgeIndex: {
        backgroundColor: '#2D3748', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
    },
    badgeIndexText: { color: '#A0AEC0', fontSize: 11, fontWeight: '700' },
    removeBtn: { padding: 4 },
    typeTabsContainer: {
        flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: '#141822', borderBottomWidth: 1, borderBottomColor: '#222838',
    },
    typeTab: {
        flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10,
        paddingVertical: 6, borderRadius: 20, backgroundColor: '#1E2433',
        borderWidth: 1, borderColor: '#2D3548',
    },
    typeTabActive: {
        backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366F1',
    },
    typeTabText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
    typeTabTextActive: { color: '#A5B4FC', fontWeight: '700' },
    cardBody: { padding: 14 },
    fieldLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
    cardInput: {
        color: '#f4f4f5', fontSize: 14, backgroundColor: '#11141E', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 12, minHeight: 70, textAlignVertical: 'top',
        borderWidth: 1, borderColor: '#222838',
    },
    cardInputBack: {
        color: '#38bdf8', borderColor: 'rgba(56,189,248,0.25)',
    },
    cardDivider: { height: 1, backgroundColor: '#222838', marginVertical: 12 },
    singleLineInput: {
        color: '#E2E8F0', fontSize: 13, backgroundColor: '#11141E', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#222838',
    },
    // MC Options
    mcOptionRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
    },
    mcCheckBtn: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#1F2430',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2D3548',
    },
    mcCheckBtnActive: {
        backgroundColor: '#10B981', borderColor: '#10B981',
    },
    mcLetterText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
    mcLetterTextActive: { color: '#FFFFFF', fontWeight: '800' },
    mcInput: {
        flex: 1, color: '#F1F5F9', fontSize: 13, backgroundColor: '#11141E',
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
        borderWidth: 1, borderColor: '#222838',
    },
    mcInputCorrect: {
        borderColor: 'rgba(16, 185, 129, 0.4)', backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    // True/False
    tfButtonsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    tfChoiceBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#11141E',
        borderWidth: 1, borderColor: '#222838',
    },
    tfChoiceCorrectActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: '#10B981',
    },
    tfChoiceWrongActive: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#EF4444',
    },
    tfChoiceText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
    tfChoiceTextCorrect: { color: '#10B981', fontWeight: '800' },
    tfChoiceTextWrong: { color: '#EF4444', fontWeight: '800' },
    // Gap Fill
    gapHelperBox: {
        flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99, 102, 241, 0.08)',
        borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.25)', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8,
    },
    gapHelperText: { color: '#C7D2FE', fontSize: 11, flex: 1 },
    // Add Buttons Grid
    addButtonsSection: { marginTop: 16 },
    addGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    addGridBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#18181b',
        borderWidth: 1, borderColor: '#27272a', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 12, flexBasis: '48%', flexGrow: 1,
    },
    addGridBtnText: { color: '#f4f4f5', fontSize: 12, fontWeight: '600' },
});
