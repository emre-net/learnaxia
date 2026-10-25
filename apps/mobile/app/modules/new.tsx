import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView,
    Alert, StatusBar, StyleSheet, Modal, FlatList
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import { CATEGORIES, MAIN_CATEGORIES } from '@learnaxia/shared';

export type QuestionType = 'FLASHCARD' | 'MC' | 'TRUE_FALSE' | 'GAP';

interface NewItem {
    id: string;
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

const MODULE_TYPES: { type: QuestionType; label: string; subtext: string; icon: any; color: string }[] = [
    {
        type: 'FLASHCARD',
        label: 'Flashcard',
        subtext: 'Ön & Arka Yüz',
        icon: 'layers-outline',
        color: '#6366F1'
    },
    {
        type: 'MC',
        label: 'Çoktan Seçmeli',
        subtext: '4 Seçenekli Test',
        icon: 'radio-button-on-outline',
        color: '#3B82F6'
    },
    {
        type: 'TRUE_FALSE',
        label: 'Doğru / Yanlış',
        subtext: 'Önerme Testi',
        icon: 'checkmark-circle-outline',
        color: '#10B981'
    },
    {
        type: 'GAP',
        label: 'Boşluk Doldurma',
        subtext: 'Cümle İçi {{Kelime}}',
        icon: 'create-outline',
        color: '#EC4899'
    },
];

function createDefaultItem(): NewItem {
    return {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
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
    const [description, setDescription] = useState('');
    const [moduleType, setModuleType] = useState<QuestionType>('FLASHCARD');
    const [category, setCategory] = useState<string>('Matematik & Fen');
    const [subCategory, setSubCategory] = useState<string>('Biyoloji');
    const [isForkable, setIsForkable] = useState(true);
    const [items, setItems] = useState<NewItem[]>([createDefaultItem()]);
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Modal states for Category and SubCategory
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [subCategoryModalVisible, setSubCategoryModalVisible] = useState(false);

    const availableSubCategories = category && CATEGORIES[category] ? CATEGORIES[category] : [];

    const handleAddItem = () => {
        setItems(prev => [...prev, createDefaultItem()]);
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

        if (!category) {
            Alert.alert('Eksik Bilgi', 'Lütfen bir kategori seçin.');
            return;
        }

        // Validate items according to chosen moduleType
        const validatedItems = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const num = i + 1;

            if (moduleType === 'FLASHCARD') {
                if (!item.front.trim() || !item.back.trim()) {
                    Alert.alert('Eksik Bilgi', `Kart #${num} için ön ve arka yüz metnini doldurun.`);
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
            } else if (moduleType === 'MC') {
                if (!item.mcQuestion.trim()) {
                    Alert.alert('Eksik Bilgi', `Soru #${num} için soru metnini girin.`);
                    return;
                }
                const filledOptions = item.mcOptions.map(o => o.trim());
                if (filledOptions.some(o => o === '')) {
                    Alert.alert('Eksik Bilgi', `Soru #${num} için 4 seçeneğin tamamını doldurun.`);
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
            } else if (moduleType === 'TRUE_FALSE') {
                if (!item.tfStatement.trim()) {
                    Alert.alert('Eksik Bilgi', `Soru #${num} için önerme metnini girin.`);
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
            } else if (moduleType === 'GAP') {
                const regex = /\{\{([^}]+)\}\}/g;
                const matches = [];
                let m;
                while ((m = regex.exec(item.gapText)) !== null) {
                    matches.push(m[1].trim());
                }
                if (!item.gapText.trim() || matches.length === 0) {
                    Alert.alert(
                        'Eksik Bilgi',
                        `Soru #${num} içinde en az bir {{kelime}} formatında boşluk olmalıdır.\n\nÖrnek: Başkentimiz {{Ankara}} şehridir.`
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
            const res = await api.post('/modules', {
                title: trimmedTitle,
                description: description.trim() || undefined,
                type: moduleType,
                category: category.trim() || 'Genel',
                subCategory: subCategory.trim() || 'Genel',
                isForkable,
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
                <Text style={styles.headerTitle}>Yeni Modül</Text>
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
                    {/* Soru / Modül Türü Seçimi */}
                    <Text style={styles.sectionLabel}>MODÜL TÜRÜ (TÜM KARTLAR BU TÜRDE OLUR)</Text>
                    <View style={styles.typeGrid}>
                        {MODULE_TYPES.map(cfg => {
                            const isSelected = moduleType === cfg.type;
                            return (
                                <TouchableOpacity
                                    key={cfg.type}
                                    style={[styles.typeCard, isSelected && { borderColor: cfg.color, backgroundColor: 'rgba(99, 102, 241, 0.08)' }]}
                                    onPress={() => {
                                        setModuleType(cfg.type);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.typeIconBox, isSelected && { backgroundColor: cfg.color }]}>
                                        <Ionicons
                                            name={cfg.icon}
                                            size={18}
                                            color={isSelected ? '#FFFFFF' : '#94A3B8'}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.typeCardLabel, isSelected && { color: '#FFFFFF' }]}>
                                            {cfg.label}
                                        </Text>
                                        <Text style={styles.typeCardSubtext}>
                                            {cfg.subtext}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <View style={[styles.typeCheckBadge, { backgroundColor: cfg.color }]}>
                                            <MaterialIcons name="check" size={12} color="#FFFFFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Temel Bilgiler */}
                    <Text style={[styles.sectionLabel, { marginTop: 20 }]}>MODÜL BİLGİLERİ</Text>

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

                    {/* Kategori ve Alt Kategori Seçimi */}
                    <View style={styles.pickerRow}>
                        <TouchableOpacity
                            style={[styles.pickerButton, styles.halfPicker]}
                            onPress={() => setCategoryModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.pickerHeader}>
                                <Ionicons name="folder-outline" size={14} color="#6366F1" />
                                <Text style={styles.pickerLabelText}>KATEGORİ</Text>
                            </View>
                            <View style={styles.pickerValueRow}>
                                <Text style={styles.pickerValueText} numberOfLines={1}>
                                    {category || 'Seçin'}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color="#64748B" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.pickerButton, styles.halfPicker, !category && { opacity: 0.5 }]}
                            onPress={() => {
                                if (category) setSubCategoryModalVisible(true);
                            }}
                            disabled={!category}
                            activeOpacity={0.7}
                        >
                            <View style={styles.pickerHeader}>
                                <Ionicons name="pricetag-outline" size={14} color="#38BDF8" />
                                <Text style={styles.pickerLabelText}>ALT KATEGORİ</Text>
                            </View>
                            <View style={styles.pickerValueRow}>
                                <Text style={styles.pickerValueText} numberOfLines={1}>
                                    {subCategory || 'Seçin'}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color="#64748B" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Açıklama (Opsiyonel) */}
                    <View style={[styles.inputContainer, focusedField === 'description' && styles.inputFocused, { minHeight: 64 }]}>
                        <TextInput
                            style={[styles.inputSmall, { textAlignVertical: 'top' }]}
                            placeholder="Açıklama (opsiyonel: Bu set neleri kapsıyor?)"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            value={description}
                            onChangeText={setDescription}
                            editable={!saving}
                            multiline
                            numberOfLines={2}
                            onFocus={() => setFocusedField('description')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    {/* Görünürlük Seçimi */}
                    <View style={styles.visibilityRow}>
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setIsForkable(true);
                            }}
                            style={[
                                styles.visibilityCard,
                                isForkable && styles.visibilityCardActive
                            ]}
                        >
                            <View style={styles.visibilityHeader}>
                                <Ionicons
                                    name="globe-outline"
                                    size={15}
                                    color={isForkable ? '#3B82F6' : '#64748B'}
                                />
                                <Text style={[
                                    styles.visibilityTitle,
                                    isForkable && styles.visibilityTitleActive
                                ]}>Herkese Açık</Text>
                            </View>
                            <Text style={styles.visibilityDesc}>Topluluk keşfinde paylaşılır</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setIsForkable(false);
                            }}
                            style={[
                                styles.visibilityCard,
                                !isForkable && styles.visibilityCardActive
                            ]}
                        >
                            <View style={styles.visibilityHeader}>
                                <Ionicons
                                    name="lock-closed"
                                    size={15}
                                    color={!isForkable ? '#A855F7' : '#64748B'}
                                />
                                <Text style={[
                                    styles.visibilityTitle,
                                    !isForkable && styles.visibilityTitleActive
                                ]}>Gizli</Text>
                            </View>
                            <Text style={styles.visibilityDesc}>Yalnızca siz görebilirsiniz</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Soru Listesi */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionLabel}>
                            {moduleType === 'FLASHCARD' ? 'KARTLAR' : 'SORULAR'} ({items.length})
                        </Text>
                    </View>

                    {items.map((item, index) => (
                        <View key={item.id} style={styles.cardItem}>
                            {/* Card Top Bar */}
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <View style={styles.badgeIndex}>
                                        <Text style={styles.badgeIndexText}>#{index + 1}</Text>
                                    </View>
                                    <Text style={styles.cardHeaderTypeText}>
                                        {MODULE_TYPES.find(m => m.type === moduleType)?.label}
                                    </Text>
                                </View>
                                {items.length > 1 && (
                                    <TouchableOpacity
                                        onPress={() => handleRemoveItem(item.id)}
                                        style={styles.removeBtn}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Form Fields for Selected Module Type */}
                            <View style={styles.cardBody}>
                                {moduleType === 'FLASHCARD' && (
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

                                {moduleType === 'MC' && (
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
                                            SEÇENEKLER (Doğru seçeneğe dokunun)
                                        </Text>

                                        {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                                            const isCorrect = item.mcCorrectIndex === optIdx;
                                            return (
                                                <View key={letter} style={styles.mcOptionRow}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            updateItem(item.id, { mcCorrectIndex: optIdx });
                                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                        }}
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

                                {moduleType === 'TRUE_FALSE' && (
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
                                                onPress={() => {
                                                    updateItem(item.id, { tfCorrect: true });
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }}
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
                                                onPress={() => {
                                                    updateItem(item.id, { tfCorrect: false });
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }}
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

                                {moduleType === 'GAP' && (
                                    <>
                                        <Text style={styles.fieldLabel}>METİN VE BOŞLUKLAR</Text>
                                        <View style={styles.gapHelperBox}>
                                            <Ionicons name="information-circle-outline" size={16} color="#EC4899" />
                                            <Text style={styles.gapHelperText}>
                                                Boş bırakılacak kelimeleri <Text style={{ color: '#F472B6', fontWeight: '700' }}>{"{{kelime}}"}</Text> şeklinde yazın.
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

                    {/* Tekil ve Net Ekleme Butonu */}
                    <TouchableOpacity
                        style={styles.addSingleBtn}
                        onPress={handleAddItem}
                        disabled={saving}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#6366F1" />
                        <Text style={styles.addSingleBtnText}>
                            {moduleType === 'FLASHCARD' ? 'Yeni Kart Ekle' : 'Yeni Soru Ekle'}
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Kategori Seçim Modalı */}
            <Modal
                visible={categoryModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCategoryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Ana Kategori Seçin</Text>
                            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={MAIN_CATEGORIES}
                            keyExtractor={cat => cat}
                            renderItem={({ item: cat }) => {
                                const isSelected = category === cat;
                                return (
                                    <TouchableOpacity
                                        style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                                        onPress={() => {
                                            setCategory(cat);
                                            const subCats = CATEGORIES[cat] || [];
                                            setSubCategory(subCats[0] || '');
                                            setCategoryModalVisible(false);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                                            {cat}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark" size={18} color="#6366F1" />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Alt Kategori Seçim Modalı */}
            <Modal
                visible={subCategoryModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSubCategoryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{category} - Alt Kategori</Text>
                            <TouchableOpacity onPress={() => setSubCategoryModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={availableSubCategories}
                            keyExtractor={sub => sub}
                            renderItem={({ item: sub }) => {
                                const isSelected = subCategory === sub;
                                return (
                                    <TouchableOpacity
                                        style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                                        onPress={() => {
                                            setSubCategory(sub);
                                            setSubCategoryModalVisible(false);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                                            {sub}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark" size={18} color="#38BDF8" />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#09090b' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: '#18181b',
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
    sectionHeaderRow: { marginTop: 20, marginBottom: 6 },

    // Module Type Grid
    typeGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6,
    },
    typeCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a',
        borderRadius: 14, padding: 12, flexBasis: '48%', flexGrow: 1,
    },
    typeIconBox: {
        width: 34, height: 34, borderRadius: 10, backgroundColor: '#27272a',
        alignItems: 'center', justifyContent: 'center',
    },
    typeCardLabel: { color: '#D4D4D8', fontSize: 13, fontWeight: '700' },
    typeCardSubtext: { color: '#71717A', fontSize: 10, marginTop: 1 },
    typeCheckBadge: {
        width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    },

    // Inputs
    inputContainer: {
        backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12,
    },
    inputFocused: { borderColor: '#6366F1' },
    input: { color: '#f4f4f5', fontSize: 15, fontWeight: '600' },
    inputSmall: { color: '#f4f4f5', fontSize: 13 },

    // Category Pickers
    pickerRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    halfPicker: { flex: 1 },
    pickerButton: {
        backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a',
        borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
    },
    pickerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    pickerLabelText: { color: '#71717A', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    pickerValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pickerValueText: { color: '#F4F4F5', fontSize: 13, fontWeight: '600', flex: 1 },

    // Cards
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
    cardHeaderTypeText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
    removeBtn: { padding: 4 },
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
        flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(236, 72, 153, 0.08)',
        borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.25)', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8,
    },
    gapHelperText: { color: '#FBCFE8', fontSize: 11, flex: 1 },

    // Single Add Button
    addSingleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#18181b', borderWidth: 1.5, borderColor: '#3F3F46', borderStyle: 'dashed',
        borderRadius: 16, paddingVertical: 14, marginTop: 8,
    },
    addSingleBtnText: { color: '#E4E4E7', fontSize: 14, fontWeight: '700' },

    // Visibility
    visibilityRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    visibilityCard: {
        flex: 1, backgroundColor: '#18181b', borderWidth: 1.5, borderColor: '#27272a',
        borderRadius: 14, padding: 12,
    },
    visibilityCardActive: { borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.08)' },
    visibilityHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    visibilityTitle: { color: '#71717A', fontSize: 13, fontWeight: '700' },
    visibilityTitleActive: { color: '#F4F4F5' },
    visibilityDesc: { color: '#52525B', fontSize: 10, lineHeight: 14 },

    // Modals
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', padding: 20,
    },
    modalContent: {
        backgroundColor: '#18181b', borderRadius: 20, borderWidth: 1, borderColor: '#27272a',
        maxHeight: '75%', padding: 18,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#27272a', marginBottom: 8,
    },
    modalTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    modalItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10,
    },
    modalItemSelected: { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
    modalItemText: { color: '#D4D4D8', fontSize: 14, fontWeight: '500' },
    modalItemTextSelected: { color: '#FFFFFF', fontWeight: '700' },
});
