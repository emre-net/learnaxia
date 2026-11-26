import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView,
    Alert, StatusBar, StyleSheet, Modal, FlatList
} from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import {
    CATEGORIES,
    MAIN_CATEGORIES,
    resolveTrueFalseAnswer,
    extractApiErrorMessage,
} from '@learnaxia/shared';

export type QuestionType = 'FLASHCARD' | 'MC' | 'TRUE_FALSE' | 'GAP';

interface NewItem {
    id: string;
    existingId?: string;
    front: string;
    back: string;
    mcQuestion: string;
    mcOptions: string[];
    mcCorrectIndex: number;
    mcExplanation: string;
    tfStatement: string;
    tfCorrect: boolean;
    tfExplanation: string;
    gapText: string;
    gapExplanation: string;
}

const MODULE_TYPES: { type: QuestionType; label: string; subtext: string; icon: any; color: string }[] = [
    {
        type: 'FLASHCARD',
        label: 'Flashcard',
        subtext: 'Ön & Arka Yüz',
        icon: 'layers-outline',
        color: '#38BDF8',
    },
    {
        type: 'MC',
        label: 'Çoktan Seçmeli',
        subtext: '4 Seçenekli Test',
        icon: 'radio-button-on-outline',
        color: '#3B82F6',
    },
    {
        type: 'TRUE_FALSE',
        label: 'Doğru / Yanlış',
        subtext: 'Önerme Testi',
        icon: 'checkmark-circle-outline',
        color: '#10B981',
    },
    {
        type: 'GAP',
        label: 'Boşluk Doldurma',
        subtext: 'Cümle İçi {{Kelime}}',
        icon: 'create-outline',
        color: '#EC4899',
    },
];

const DEFAULT_MAIN_CAT = MAIN_CATEGORIES[0] || 'Diller';
const DEFAULT_SUB_CAT = (CATEGORIES[DEFAULT_MAIN_CAT] && CATEGORIES[DEFAULT_MAIN_CAT][0]) || 'İngilizce';

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
    const params = useLocalSearchParams<{ ai?: string; editId?: string }>();
    const isAiMode = params?.ai === 'true';
    const editId = params?.editId;
    const isEditing = Boolean(editId);

    const [loadingExisting, setLoadingExisting] = useState(isEditing);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [moduleType, setModuleType] = useState<QuestionType>('FLASHCARD');
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
    const [category, setCategory] = useState<string>(DEFAULT_MAIN_CAT);
    const [subCategory, setSubCategory] = useState<string>(DEFAULT_SUB_CAT);
    const [isForkable, setIsForkable] = useState(true);
    const [items, setItems] = useState<NewItem[]>([createDefaultItem()]);
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [subCategoryModalVisible, setSubCategoryModalVisible] = useState(false);

    const availableSubCategories = category && CATEGORIES[category] ? CATEGORIES[category] : [];
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    useEffect(() => {
        if (!editId) return;
        let active = true;
        (async () => {
            try {
                const res = await api.get(`/modules/${editId}`);
                const mod = res.data;
                if (!active || !mod) return;
                setTitle(mod.title || '');
                setDescription(mod.description || '');
                const modType = (mod.type || 'FLASHCARD').toUpperCase() as QuestionType;
                setModuleType(modType);
                setVisibility(mod.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC');
                const matchedCat =
                    mod.category && CATEGORIES[mod.category] ? mod.category : DEFAULT_MAIN_CAT;
                setCategory(matchedCat);
                const validSubs = CATEGORIES[matchedCat] || [];
                setSubCategory(
                    mod.subCategory && validSubs.includes(mod.subCategory)
                        ? mod.subCategory
                        : validSubs[0] || DEFAULT_SUB_CAT
                );
                setIsForkable(mod.isForkable !== false);

                if (Array.isArray(mod.items) && mod.items.length > 0) {
                    const mapped: NewItem[] = mod.items.map((it: any) => {
                        const c = it.content || {};
                        const base = createDefaultItem();
                        base.existingId = it.id;
                        if (modType === 'FLASHCARD') {
                            base.front = String(c.front || c.question || '');
                            base.back = String(c.back || c.answer || '');
                        } else if (modType === 'MC') {
                            base.mcQuestion = String(c.question || c.front || '');
                            const opts = Array.isArray(c.options) ? c.options.map(String).slice(0, 4) : ['', '', '', ''];
                            while (opts.length < 4) opts.push('');
                            base.mcOptions = opts;
                            const ans = String(c.answer ?? c.correctAnswer ?? '');
                            const idx = opts.indexOf(ans);
                            base.mcCorrectIndex = idx >= 0 ? idx : 0;
                            base.mcExplanation = String(c.explanation || '');
                        } else if (modType === 'TRUE_FALSE') {
                            base.tfStatement = String(c.statement || c.question || c.text || '');
                            base.tfCorrect = resolveTrueFalseAnswer(c);
                            base.tfExplanation = String(c.explanation || '');
                        } else if (modType === 'GAP') {
                            base.gapText = String(c.text || c.question || '');
                            base.gapExplanation = String(c.explanation || '');
                        }
                        return base;
                    });
                    setItems(mapped);
                }
            } catch (err) {
                Alert.alert('Hata', extractApiErrorMessage(err, 'Modül bilgileri yüklenemedi.'));
                router.back();
            } finally {
                if (active) setLoadingExisting(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [editId, router]);

    const handleAiGenerate = async () => {
        const topicPrompt = title.trim();
        if (!topicPrompt || topicPrompt.length < 3) {
            Alert.alert(
                'Konu Başlığı Gerekli',
                'Yapay zekanın soru üretebilmesi için lütfen yukarıdaki "Modül Başlığı" alanına konuyu yazın (örn: Mitoz Bölünme Evreleri).'
            );
            return;
        }

        setIsAiGenerating(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const res = await api.post('/ai/generate', {
                topic: topicPrompt,
                types: [moduleType],
                count: 5,
            });

            if (res.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
                const newItems: NewItem[] = res.data.items.map((it: any) => {
                    const content = it.content || it;
                    const def = createDefaultItem();
                    if (moduleType === 'FLASHCARD') {
                        def.front = content.front || content.question || '';
                        def.back = content.back || content.answer || '';
                    } else if (moduleType === 'MC') {
                        def.mcQuestion = content.question || '';
                        def.mcOptions = Array.isArray(content.options) ? content.options.slice(0, 4).map(String) : ['', '', '', ''];
                        while (def.mcOptions.length < 4) def.mcOptions.push('');
                        const ans = String(content.answer ?? content.correctAnswer ?? '');
                        def.mcCorrectIndex = def.mcOptions.indexOf(ans) !== -1 ? def.mcOptions.indexOf(ans) : 0;
                        def.mcExplanation = content.explanation || '';
                    } else if (moduleType === 'TRUE_FALSE') {
                        def.tfStatement = content.statement || content.question || '';
                        def.tfCorrect = resolveTrueFalseAnswer(content);
                        def.tfExplanation = content.explanation || '';
                    } else if (moduleType === 'GAP') {
                        def.gapText = content.text || '';
                        def.gapExplanation = content.explanation || '';
                    }
                    return def;
                });

                setItems((prev) => {
                    const isFirstEmpty =
                        prev.length === 1 &&
                        !prev[0].front &&
                        !prev[0].mcQuestion &&
                        !prev[0].tfStatement &&
                        !prev[0].gapText;
                    return isFirstEmpty ? newItems : [...prev, ...newItems];
                });

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Tamamlandı', `${newItems.length} adet soru yapay zeka tarafından başarıyla üretildi ve eklendi.`);
            } else {
                throw new Error('İçerik üretilemedi.');
            }
        } catch (error) {
            Alert.alert('Üretim Hatası', extractApiErrorMessage(error, 'Yapay zeka ile içerik üretilirken bir hata oluştu.'));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsAiGenerating(false);
        }
    };

    const handleAddItem = () => {
        setItems((prev) => [...prev, createDefaultItem()]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length === 1) {
            Alert.alert('Uyarı', 'Modül en az 1 soru/kart içermelidir.');
            return;
        }
        setItems((prev) => prev.filter((i) => i.id !== id));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const updateItem = (id: string, updates: Partial<NewItem>) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    };

    const updateMCOption = (itemId: string, optionIndex: number, text: string) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== itemId) return item;
                const newOptions = [...item.mcOptions];
                newOptions[optionIndex] = text;
                return { ...item, mcOptions: newOptions };
            })
        );
    };

    const handleSave = async () => {
        const trimmedTitle = title.trim();
        if (trimmedTitle.length < 3) {
            Alert.alert('Hata', 'Modül başlığı en az 3 karakter olmalıdır.');
            return;
        }

        if (visibility === 'PUBLIC' && (!category || !subCategory)) {
            Alert.alert('Eksik Bilgi', 'Herkese açık modüller için ana kategori ve alt kategori seçmelisiniz.');
            return;
        }

        const validatedItems: any[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const num = i + 1;
            const baseId = item.existingId ? { id: item.existingId } : {};

            if (moduleType === 'FLASHCARD') {
                if (!item.front.trim() || !item.back.trim()) {
                    Alert.alert('Eksik Bilgi', `Kart #${num} için ön ve arka yüz metnini doldurun.`);
                    return;
                }
                validatedItems.push({
                    ...baseId,
                    type: 'FLASHCARD',
                    order: i,
                    content: {
                        front: item.front.trim(),
                        back: item.back.trim(),
                        question: item.front.trim(),
                        answer: item.back.trim(),
                    },
                });
            } else if (moduleType === 'MC') {
                if (!item.mcQuestion.trim()) {
                    Alert.alert('Eksik Bilgi', `Soru #${num} için soru metnini girin.`);
                    return;
                }
                const filledOptions = item.mcOptions.map((o) => o.trim());
                if (filledOptions.some((o) => o === '')) {
                    Alert.alert('Eksik Bilgi', `Soru #${num} için 4 seçeneğin tamamını doldurun.`);
                    return;
                }
                const correctVal = filledOptions[item.mcCorrectIndex] || filledOptions[0];
                validatedItems.push({
                    ...baseId,
                    type: 'MC',
                    order: i,
                    content: {
                        question: item.mcQuestion.trim(),
                        options: filledOptions,
                        answer: correctVal,
                        correctAnswer: correctVal,
                        explanation: item.mcExplanation.trim() || undefined,
                    },
                });
            } else if (moduleType === 'TRUE_FALSE') {
                if (!item.tfStatement.trim()) {
                    Alert.alert('Eksik Bilgi', `Soru #${num} için önerme metnini girin.`);
                    return;
                }
                validatedItems.push({
                    ...baseId,
                    type: 'TRUE_FALSE',
                    order: i,
                    content: {
                        statement: item.tfStatement.trim(),
                        question: item.tfStatement.trim(),
                        isTrue: item.tfCorrect,
                        answer: item.tfCorrect ? 'True' : 'False',
                        correctAnswer: item.tfCorrect,
                        explanation: item.tfExplanation.trim() || undefined,
                    },
                });
            } else if (moduleType === 'GAP') {
                const regex = /\{\{([^}]+)\}\}/g;
                const matches: string[] = [];
                let m: RegExpExecArray | null;
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
                    ...baseId,
                    type: 'GAP',
                    order: i,
                    content: {
                        text: item.gapText.trim(),
                        question: item.gapText.trim(),
                        answers: matches,
                        correctAnswer: matches[0],
                        explanation: item.gapExplanation.trim() || undefined,
                    },
                });
            }
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const resolvedCategory = category && CATEGORIES[category] ? category : DEFAULT_MAIN_CAT;
        const resolvedSub =
            subCategory && CATEGORIES[resolvedCategory]?.includes(subCategory)
                ? subCategory
                : CATEGORIES[resolvedCategory]?.[0] || DEFAULT_SUB_CAT;

        try {
            if (isEditing && editId) {
                await api.patch(`/modules/${editId}`, {
                    title: trimmedTitle,
                    description: description.trim() || '',
                    visibility,
                    category: resolvedCategory,
                    subCategory: resolvedSub,
                    isForkable,
                    items: validatedItems,
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace(`/modules/${editId}` as any);
            } else {
                const res = await api.post('/modules', {
                    title: trimmedTitle,
                    description: description.trim() || undefined,
                    type: moduleType,
                    visibility,
                    category: resolvedCategory,
                    subCategory: resolvedSub,
                    isForkable,
                    status: 'ACTIVE',
                    items: validatedItems,
                });

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                if (res.data?.id) {
                    router.replace(`/study/${res.data.id}` as any);
                } else {
                    router.back();
                }
            }
        } catch (error) {
            Alert.alert('Hata', extractApiErrorMessage(error, 'Modül kaydedilirken bir sorun oluştu.'));
            setSaving(false);
        }
    };

    const isDisabled = saving || title.trim().length < 3;

    if (loadingExisting) {
        return (
            <Screen style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <BrandLoader size="lg" label="Modül yükleniyor..." />
            </Screen>
        );
    }

    return (
        <Screen style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#09090B" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={20} color="#E4E4E7" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Modülü Düzenle' : 'Yeni Modül'}</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isDisabled}
                    style={[styles.saveBtn, isDisabled && styles.saveBtnDisabled]}
                >
                    {saving ? (
                        <BrandLoader size={16} showBlur={false} />
                    ) : (
                        <MaterialIcons name="check" size={16} color="#09090B" />
                    )}
                    <Text style={styles.saveBtnText}>
                        {saving ? 'Kaydediliyor' : isEditing ? 'Güncelle' : 'Kaydet'}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {isAiMode && !isEditing && (
                        <View style={styles.aiModeBanner}>
                            <View style={styles.aiModeBannerIcon}>
                                <Ionicons name="sparkles" size={18} color="#C084FC" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.aiModeBannerTitle}>Yapay Zeka Asistanı Aktif</Text>
                                <Text style={styles.aiModeBannerDesc}>
                                    Modül başlığını yazıp soru tipini belirleyin; ardından alttaki &quot;Yapay Zeka (AI)&quot; butonuna basarak tüm kartları otomatik oluşturun.
                                </Text>
                            </View>
                        </View>
                    )}

                    <Text style={styles.sectionLabel}>
                        {isEditing ? 'Modül Türü (Değiştirilemez)' : 'Modül Türü (Tüm kartlar bu türde olur)'}
                    </Text>
                    <View style={[styles.typeGrid, isEditing && { opacity: 0.6 }]}>
                        {MODULE_TYPES.map((cfg) => {
                            const isSelected = moduleType === cfg.type;
                            return (
                                <TouchableOpacity
                                    key={cfg.type}
                                    disabled={isEditing}
                                    style={[
                                        styles.typeCard,
                                        isSelected && {
                                            borderColor: cfg.color,
                                            backgroundColor: 'rgba(56, 189, 248, 0.08)',
                                        },
                                    ]}
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
                                            color={isSelected ? '#09090B' : '#A1A1AA'}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.typeCardLabel, isSelected && { color: '#F4F4F5' }]}>
                                            {cfg.label}
                                        </Text>
                                        <Text style={styles.typeCardSubtext}>{cfg.subtext}</Text>
                                    </View>
                                    {isSelected && (
                                        <View style={[styles.typeCheckBadge, { backgroundColor: cfg.color }]}>
                                            <MaterialIcons name="check" size={12} color="#09090B" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Modül Bilgileri</Text>

                    <View style={[styles.inputContainer, focusedField === 'title' && styles.inputFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Modül Başlığı (en az 3 karakter)"
                            placeholderTextColor="#52525B"
                            value={title}
                            onChangeText={setTitle}
                            editable={!saving}
                            onFocus={() => setFocusedField('title')}
                            onBlur={() => setFocusedField(null)}
                            returnKeyType="next"
                        />
                    </View>

                    <View style={styles.pickerRow}>
                        <TouchableOpacity
                            style={[styles.pickerButton, styles.halfPicker]}
                            onPress={() => setCategoryModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.pickerHeader}>
                                <Ionicons name="folder-outline" size={14} color="#38BDF8" />
                                <Text style={styles.pickerLabelText}>Kategori</Text>
                            </View>
                            <View style={styles.pickerValueRow}>
                                <Text style={styles.pickerValueText} numberOfLines={1}>
                                    {category || 'Seçin'}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color="#71717A" />
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
                                <Text style={styles.pickerLabelText}>Alt Kategori</Text>
                            </View>
                            <View style={styles.pickerValueRow}>
                                <Text style={styles.pickerValueText} numberOfLines={1}>
                                    {subCategory || 'Seçin'}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color="#71717A" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputContainer, focusedField === 'description' && styles.inputFocused, { minHeight: 64 }]}>
                        <TextInput
                            style={[styles.inputSmall, { textAlignVertical: 'top' }]}
                            placeholder="Açıklama (opsiyonel: Bu set neleri kapsıyor?)"
                            placeholderTextColor="#52525B"
                            value={description}
                            onChangeText={setDescription}
                            editable={!saving}
                            multiline
                            numberOfLines={2}
                            onFocus={() => setFocusedField('description')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <View style={styles.visibilityRow}>
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setVisibility('PUBLIC');
                                setIsForkable(true);
                            }}
                            style={[styles.visibilityCard, visibility === 'PUBLIC' && styles.visibilityCardActive]}
                        >
                            <View style={styles.visibilityHeader}>
                                <Ionicons
                                    name="globe-outline"
                                    size={15}
                                    color={visibility === 'PUBLIC' ? '#38BDF8' : '#71717A'}
                                />
                                <Text style={[styles.visibilityTitle, visibility === 'PUBLIC' && styles.visibilityTitleActive]}>
                                    Herkese Açık
                                </Text>
                            </View>
                            <Text style={styles.visibilityDesc}>Topluluk keşfinde paylaşılır</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setVisibility('PRIVATE');
                                setIsForkable(false);
                            }}
                            style={[styles.visibilityCard, visibility === 'PRIVATE' && styles.visibilityCardActive]}
                        >
                            <View style={styles.visibilityHeader}>
                                <Ionicons
                                    name="lock-closed"
                                    size={15}
                                    color={visibility === 'PRIVATE' ? '#A855F7' : '#71717A'}
                                />
                                <Text style={[styles.visibilityTitle, visibility === 'PRIVATE' && styles.visibilityTitleActive]}>
                                    Gizli
                                </Text>
                            </View>
                            <Text style={styles.visibilityDesc}>Yalnızca siz görebilirsiniz</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionLabel}>
                            {moduleType === 'FLASHCARD' ? 'Kartlar' : 'Sorular'} ({items.length})
                        </Text>
                    </View>

                    {items.map((item, index) => (
                        <View key={item.id} style={styles.cardItem}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <View style={styles.badgeIndex}>
                                        <Text style={styles.badgeIndexText}>#{index + 1}</Text>
                                    </View>
                                    <Text style={styles.cardHeaderTypeText}>
                                        {MODULE_TYPES.find((m) => m.type === moduleType)?.label}
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

                            <View style={styles.cardBody}>
                                {moduleType === 'FLASHCARD' && (
                                    <>
                                        <Text style={styles.fieldLabel}>Ön Yüz (Soru / Kavram)</Text>
                                        <TextInput
                                            style={styles.cardInput}
                                            placeholder="Ön yüzde görünecek soru veya terim..."
                                            placeholderTextColor="#52525B"
                                            value={item.front}
                                            onChangeText={(val) => updateItem(item.id, { front: val })}
                                            editable={!saving}
                                            multiline
                                        />
                                        <View style={styles.cardDivider} />
                                        <Text style={[styles.fieldLabel, { color: '#38BDF8' }]}>Arka Yüz (Cevap / Açıklama)</Text>
                                        <TextInput
                                            style={[styles.cardInput, styles.cardInputBack]}
                                            placeholder="Arka yüzde görünecek açıklama..."
                                            placeholderTextColor="#52525B"
                                            value={item.back}
                                            onChangeText={(val) => updateItem(item.id, { back: val })}
                                            editable={!saving}
                                            multiline
                                        />
                                    </>
                                )}

                                {moduleType === 'MC' && (
                                    <>
                                        <Text style={styles.fieldLabel}>Soru Metni</Text>
                                        <TextInput
                                            style={styles.cardInput}
                                            placeholder="Çoktan seçmeli soru metnini yazın..."
                                            placeholderTextColor="#52525B"
                                            value={item.mcQuestion}
                                            onChangeText={(val) => updateItem(item.id, { mcQuestion: val })}
                                            editable={!saving}
                                            multiline
                                        />

                                        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                                            Seçenekler (Doğru seçeneğe dokunun)
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
                                                        placeholderTextColor="#52525B"
                                                        value={item.mcOptions[optIdx]}
                                                        onChangeText={(val) => updateMCOption(item.id, optIdx, val)}
                                                        editable={!saving}
                                                    />
                                                </View>
                                            );
                                        })}

                                        <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Açıklama (Opsiyonel)</Text>
                                        <TextInput
                                            style={styles.singleLineInput}
                                            placeholder="Cevap açıklandığında gösterilecek not..."
                                            placeholderTextColor="#52525B"
                                            value={item.mcExplanation}
                                            onChangeText={(val) => updateItem(item.id, { mcExplanation: val })}
                                            editable={!saving}
                                        />
                                    </>
                                )}

                                {moduleType === 'TRUE_FALSE' && (
                                    <>
                                        <Text style={styles.fieldLabel}>Önerme / Metin</Text>
                                        <TextInput
                                            style={styles.cardInput}
                                            placeholder="Örnek: Mitokondri hücrenin enerji santralidir."
                                            placeholderTextColor="#52525B"
                                            value={item.tfStatement}
                                            onChangeText={(val) => updateItem(item.id, { tfStatement: val })}
                                            editable={!saving}
                                            multiline
                                        />

                                        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Doğru Cevap</Text>
                                        <View style={styles.tfButtonsRow}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    updateItem(item.id, { tfCorrect: true });
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }}
                                                style={[styles.tfChoiceBtn, item.tfCorrect && styles.tfChoiceCorrectActive]}
                                            >
                                                <MaterialIcons name="check-circle" size={16} color={item.tfCorrect ? '#10B981' : '#71717A'} />
                                                <Text style={[styles.tfChoiceText, item.tfCorrect && styles.tfChoiceTextCorrect]}>Doğru</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => {
                                                    updateItem(item.id, { tfCorrect: false });
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }}
                                                style={[styles.tfChoiceBtn, !item.tfCorrect && styles.tfChoiceWrongActive]}
                                            >
                                                <MaterialIcons name="cancel" size={16} color={!item.tfCorrect ? '#EF4444' : '#71717A'} />
                                                <Text style={[styles.tfChoiceText, !item.tfCorrect && styles.tfChoiceTextWrong]}>Yanlış</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Açıklama (Opsiyonel)</Text>
                                        <TextInput
                                            style={styles.singleLineInput}
                                            placeholder="Neden doğru veya yanlış olduğuna dair açıklama..."
                                            placeholderTextColor="#52525B"
                                            value={item.tfExplanation}
                                            onChangeText={(val) => updateItem(item.id, { tfExplanation: val })}
                                            editable={!saving}
                                        />
                                    </>
                                )}

                                {moduleType === 'GAP' && (
                                    <>
                                        <Text style={styles.fieldLabel}>Metin ve Boşluklar</Text>
                                        <View style={styles.gapHelperBox}>
                                            <Ionicons name="information-circle-outline" size={16} color="#EC4899" />
                                            <Text style={styles.gapHelperText}>
                                                Boş bırakılacak kelimeleri <Text style={{ color: '#F472B6', fontWeight: '700' }}>{'{{kelime}}'}</Text> şeklinde yazın.
                                            </Text>
                                        </View>
                                        <TextInput
                                            style={styles.cardInput}
                                            placeholder="Örnek: Türkiye Cumhuriyeti'nin başkenti {{Ankara}} şehridir."
                                            placeholderTextColor="#52525B"
                                            value={item.gapText}
                                            onChangeText={(val) => updateItem(item.id, { gapText: val })}
                                            editable={!saving}
                                            multiline
                                        />

                                        <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Açıklama (Opsiyonel)</Text>
                                        <TextInput
                                            style={styles.singleLineInput}
                                            placeholder="İpucu veya açıklama..."
                                            placeholderTextColor="#52525B"
                                            value={item.gapExplanation}
                                            onChangeText={(val) => updateItem(item.id, { gapExplanation: val })}
                                            editable={!saving}
                                        />
                                    </>
                                )}
                            </View>
                        </View>
                    ))}

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        <TouchableOpacity
                            style={[styles.addSingleBtn, { flex: 1, marginTop: 0 }]}
                            onPress={handleAddItem}
                            disabled={saving || isAiGenerating}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add-circle-outline" size={20} color="#38BDF8" />
                            <Text style={styles.addSingleBtnText}>
                                {moduleType === 'FLASHCARD' ? 'Yeni Kart' : 'Yeni Soru'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.addSingleBtn,
                                {
                                    flex: 1,
                                    marginTop: 0,
                                    borderColor: '#A855F7',
                                    backgroundColor: 'rgba(168, 85, 247, 0.08)',
                                },
                            ]}
                            onPress={handleAiGenerate}
                            disabled={saving || isAiGenerating}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="sparkles" size={18} color="#C084FC" />
                            <Text style={[styles.addSingleBtnText, { color: '#C084FC' }]}>
                                {isAiGenerating ? 'Üretiliyor...' : 'Yapay Zeka (AI)'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={categoryModalVisible} transparent animationType="fade" onRequestClose={() => setCategoryModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Ana Kategori Seçin</Text>
                            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={MAIN_CATEGORIES}
                            keyExtractor={(cat) => cat}
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
                                        {isSelected && <Ionicons name="checkmark" size={18} color="#38BDF8" />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={subCategoryModalVisible} transparent animationType="fade" onRequestClose={() => setSubCategoryModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{category} - Alt Kategori</Text>
                            <TouchableOpacity onPress={() => setSubCategoryModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={availableSubCategories}
                            keyExtractor={(sub) => sub}
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
                                        {isSelected && <Ionicons name="checkmark" size={18} color="#38BDF8" />}
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
    screen: { flex: 1, backgroundColor: '#09090B' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: '#18181B',
    },
    closeBtn: {
        width: 38, height: 38, borderRadius: 19, backgroundColor: '#121215',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27272A',
    },
    headerTitle: { color: '#F4F4F5', fontWeight: '700', fontSize: 17 },
    saveBtn: {
        backgroundColor: '#38BDF8', paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 5,
    },
    saveBtnDisabled: { backgroundColor: '#27272A', opacity: 0.5 },
    saveBtnText: { color: '#09090B', fontWeight: '700', fontSize: 13 },
    scrollContent: { paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 120 },
    sectionLabel: { color: '#A1A1AA', fontSize: 12, fontWeight: '600', marginBottom: 10, marginLeft: 2 },
    sectionHeaderRow: { marginTop: 18, marginBottom: 6 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
    typeCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A',
        borderRadius: 14, padding: 12, flexBasis: '48%', flexGrow: 1,
    },
    typeIconBox: {
        width: 34, height: 34, borderRadius: 10, backgroundColor: '#18181B',
        alignItems: 'center', justifyContent: 'center',
    },
    typeCardLabel: { color: '#D4D4D8', fontSize: 13, fontWeight: '700' },
    typeCardSubtext: { color: '#71717A', fontSize: 11, marginTop: 1 },
    typeCheckBadge: {
        width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    },
    inputContainer: {
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12,
    },
    inputFocused: { borderColor: '#38BDF8' },
    input: { color: '#F4F4F5', fontSize: 15, fontWeight: '600' },
    inputSmall: { color: '#F4F4F5', fontSize: 13 },
    pickerRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    halfPicker: { flex: 1 },
    pickerButton: {
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A',
        borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
    },
    pickerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    pickerLabelText: { color: '#71717A', fontSize: 11, fontWeight: '600' },
    pickerValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pickerValueText: { color: '#F4F4F5', fontSize: 13, fontWeight: '600', flex: 1 },
    cardItem: {
        backgroundColor: '#121215', borderWidth: 1, borderColor: '#27272A', borderRadius: 18,
        marginBottom: 16, overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#18181B',
        borderBottomWidth: 1, borderBottomColor: '#27272A',
    },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badgeIndex: {
        backgroundColor: '#27272A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
    },
    badgeIndexText: { color: '#E4E4E7', fontSize: 11, fontWeight: '700' },
    cardHeaderTypeText: { color: '#A1A1AA', fontSize: 12, fontWeight: '600' },
    removeBtn: { padding: 4 },
    cardBody: { padding: 14 },
    fieldLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: '600', marginBottom: 6 },
    cardInput: {
        color: '#F4F4F5', fontSize: 14, backgroundColor: '#18181B', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 12, minHeight: 70, textAlignVertical: 'top',
        borderWidth: 1, borderColor: '#27272A',
    },
    cardInputBack: {
        color: '#38BDF8', borderColor: 'rgba(56,189,248,0.28)',
    },
    cardDivider: { height: 1, backgroundColor: '#27272A', marginVertical: 12 },
    singleLineInput: {
        color: '#E4E4E7', fontSize: 13, backgroundColor: '#18181B', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#27272A',
    },
    mcOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    mcCheckBtn: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#18181B',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27272A',
    },
    mcCheckBtnActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    mcLetterText: { color: '#A1A1AA', fontSize: 12, fontWeight: '700' },
    mcLetterTextActive: { color: '#09090B', fontWeight: '800' },
    mcInput: {
        flex: 1, color: '#F4F4F5', fontSize: 13, backgroundColor: '#18181B',
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
        borderWidth: 1, borderColor: '#27272A',
    },
    mcInputCorrect: {
        borderColor: 'rgba(16, 185, 129, 0.45)', backgroundColor: 'rgba(16, 185, 129, 0.06)',
    },
    tfButtonsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    tfChoiceBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#18181B',
        borderWidth: 1, borderColor: '#27272A',
    },
    tfChoiceCorrectActive: { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: '#10B981' },
    tfChoiceWrongActive: { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#EF4444' },
    tfChoiceText: { color: '#A1A1AA', fontSize: 13, fontWeight: '700' },
    tfChoiceTextCorrect: { color: '#10B981', fontWeight: '800' },
    tfChoiceTextWrong: { color: '#EF4444', fontWeight: '800' },
    gapHelperBox: {
        flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(236, 72, 153, 0.08)',
        borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.25)', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8,
    },
    gapHelperText: { color: '#FBCFE8', fontSize: 11, flex: 1 },
    addSingleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#121215', borderWidth: 1.5, borderColor: '#3F3F46', borderStyle: 'dashed',
        borderRadius: 16, paddingVertical: 14, marginTop: 8,
    },
    addSingleBtnText: { color: '#F4F4F5', fontSize: 14, fontWeight: '700' },
    visibilityRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    visibilityCard: {
        flex: 1, backgroundColor: '#121215', borderWidth: 1.5, borderColor: '#27272A',
        borderRadius: 14, padding: 12,
    },
    visibilityCardActive: { borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.08)' },
    visibilityHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    visibilityTitle: { color: '#71717A', fontSize: 13, fontWeight: '700' },
    visibilityTitleActive: { color: '#F4F4F5' },
    visibilityDesc: { color: '#71717A', fontSize: 11, lineHeight: 15 },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(9, 9, 11, 0.8)',
        justifyContent: 'center', padding: 20,
    },
    modalContent: {
        backgroundColor: '#121215', borderRadius: 20, borderWidth: 1, borderColor: '#27272A',
        maxHeight: '75%', padding: 18,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#27272A', marginBottom: 8,
    },
    modalTitle: { color: '#F4F4F5', fontSize: 16, fontWeight: '700' },
    modalItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10,
    },
    modalItemSelected: { backgroundColor: 'rgba(56, 189, 248, 0.1)' },
    modalItemText: { color: '#D4D4D8', fontSize: 14, fontWeight: '500' },
    modalItemTextSelected: { color: '#F4F4F5', fontWeight: '700' },
    aiModeBanner: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.25)', borderRadius: 16,
        padding: 14, marginBottom: 20,
    },
    aiModeBannerIcon: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(168, 85, 247, 0.15)',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    aiModeBannerTitle: { fontSize: 13, fontWeight: '700', color: '#C084FC', marginBottom: 2 },
    aiModeBannerDesc: { fontSize: 12, color: '#D4D4D8', lineHeight: 16 },
});
