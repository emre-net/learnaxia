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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import { CATEGORIES, MAIN_CATEGORIES } from '@learnaxia/shared';

export default function NewCollectionScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
    const [category, setCategory] = useState<string>('Diller');
    const [subCategory, setSubCategory] = useState<string>('İngilizce');
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Modal states for Category and SubCategory
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [subCategoryModalVisible, setSubCategoryModalVisible] = useState(false);

    const availableSubCategories = category && CATEGORIES[category] ? CATEGORIES[category] : [];

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

        if (visibility === 'PUBLIC') {
            if (!category) {
                Alert.alert('Eksik Bilgi', 'Herkese açık koleksiyonlar için bir ana kategori seçmelisiniz.');
                return;
            }
            if (!subCategory) {
                Alert.alert('Eksik Bilgi', 'Lütfen bir alt kategori seçin.');
                return;
            }
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const res = await api.post('/mobile/collections', {
                title: trimmedTitle,
                description: description.trim() || undefined,
                visibility,
                category: category || undefined,
                subCategory: subCategory || undefined,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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

                    {/* Görünürlük Seçimi */}
                    <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Görünürlük</Text>
                    <View style={styles.visibilityRow}>
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setVisibility('PRIVATE');
                            }}
                            style={[
                                styles.visibilityCard,
                                visibility === 'PRIVATE' && styles.visibilityCardActive
                            ]}
                        >
                            <View style={styles.visibilityHeader}>
                                <Ionicons
                                    name="lock-closed"
                                    size={16}
                                    color={visibility === 'PRIVATE' ? '#A855F7' : '#64748B'}
                                />
                                <Text style={[
                                    styles.visibilityTitle,
                                    visibility === 'PRIVATE' && styles.visibilityTitleActive
                                ]}>Gizli</Text>
                            </View>
                            <Text style={styles.visibilityDesc}>Sadece siz görebilir ve çalışabilirsiniz</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setVisibility('PUBLIC');
                            }}
                            style={[
                                styles.visibilityCard,
                                visibility === 'PUBLIC' && styles.visibilityCardActive
                            ]}
                        >
                            <View style={styles.visibilityHeader}>
                                <Ionicons
                                    name="globe-outline"
                                    size={16}
                                    color={visibility === 'PUBLIC' ? '#3B82F6' : '#64748B'}
                                />
                                <Text style={[
                                    styles.visibilityTitle,
                                    visibility === 'PUBLIC' && styles.visibilityTitleActive
                                ]}>Herkese Açık</Text>
                            </View>
                            <Text style={styles.visibilityDesc}>Topluluk keşfinde yayınlanır</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Kategori Seçimi */}
                    <View style={styles.categoryRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>
                                Ana Kategori {visibility === 'PUBLIC' && <Text style={{ color: '#EF4444' }}>*</Text>}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setCategoryModalVisible(true)}
                                style={styles.pickerTrigger}
                            >
                                <Ionicons name="folder-outline" size={16} color="#A855F7" />
                                <Text style={styles.pickerTriggerText} numberOfLines={1}>
                                    {category || 'Seçiniz'}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>
                                Alt Kategori {visibility === 'PUBLIC' && <Text style={{ color: '#EF4444' }}>*</Text>}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (!category) {
                                        Alert.alert('Bilgi', 'Önce bir ana kategori seçmelisiniz.');
                                        return;
                                    }
                                    setSubCategoryModalVisible(true);
                                }}
                                style={styles.pickerTrigger}
                            >
                                <Ionicons name="pricetag-outline" size={16} color="#3B82F6" />
                                <Text style={styles.pickerTriggerText} numberOfLines={1}>
                                    {subCategory || 'Seçiniz'}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                    </View>

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

            {/* Modal: Ana Kategori Seçimi */}
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
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        category === item && styles.modalItemActive
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setCategory(item);
                                        const subs = CATEGORIES[item] || [];
                                        setSubCategory(subs[0] || '');
                                        setCategoryModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        category === item && styles.modalItemTextActive
                                    ]}>{item}</Text>
                                    {category === item && (
                                        <Ionicons name="checkmark" size={18} color="#3B82F6" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal: Alt Kategori Seçimi */}
            <Modal
                visible={subCategoryModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSubCategoryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{category} — Alt Kategori</Text>
                            <TouchableOpacity onPress={() => setSubCategoryModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={availableSubCategories}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        subCategory === item && styles.modalItemActive
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSubCategory(item);
                                        setSubCategoryModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        subCategory === item && styles.modalItemTextActive
                                    ]}>{item}</Text>
                                    {subCategory === item && (
                                        <Ionicons name="checkmark" size={18} color="#3B82F6" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
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
        backgroundColor: '#A855F7',
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
        marginBottom: 28,
        marginTop: 4,
    },
    iconContainer: {
        width: 88,
        height: 88,
        borderRadius: 28,
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
        borderColor: '#A855F7',
    },
    input: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '600',
    },
    textarea: {
        minHeight: 100,
        fontSize: 15,
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
    visibilityRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    visibilityCard: {
        flex: 1,
        backgroundColor: '#090F1D',
        borderWidth: 1.5,
        borderColor: '#182234',
        borderRadius: 16,
        padding: 14,
    },
    visibilityCardActive: {
        borderColor: '#A855F7',
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
    },
    visibilityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    visibilityTitle: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '700',
    },
    visibilityTitleActive: {
        color: '#F8FAFC',
    },
    visibilityDesc: {
        color: '#64748B',
        fontSize: 11,
        lineHeight: 15,
    },
    categoryRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 4,
    },
    pickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#090F1D',
        borderWidth: 1,
        borderColor: '#182234',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 6,
    },
    pickerTriggerText: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    modalContent: {
        backgroundColor: '#0F172A',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
        maxHeight: '70%',
        paddingVertical: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    modalTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    modalItemActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    modalItemText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '500',
    },
    modalItemTextActive: {
        color: '#60A5FA',
        fontWeight: '700',
    },
});
