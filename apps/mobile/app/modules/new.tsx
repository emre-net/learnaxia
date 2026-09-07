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

export default function NewModuleScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [items, setItems] = useState([{ id: Date.now().toString(), front: '', back: '' }]);
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleAddItem = () => {
        setItems([...items, { id: Date.now().toString(), front: '', back: '' }]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length === 1) {
            Alert.alert('Hata', 'Modül en az 1 kart içermelidir.');
            return;
        }
        setItems(items.filter(i => i.id !== id));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const updateItem = (id: string, field: 'front' | 'back', text: string) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: text } : item));
    };

    const handleSave = async () => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            Alert.alert('Hata', 'Modül başlığı boş olamaz.');
            return;
        }

        const validItems = items.filter(i => i.front.trim() !== '' && i.back.trim() !== '');
        if (validItems.length === 0) {
            Alert.alert('Hata', 'En az bir adet geçerli (ön ve arka yüzü dolu) kart eklemelisiniz.');
            return;
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const formattedItems = validItems.map((item, index) => ({
                content: { front: item.front.trim(), back: item.back.trim() },
                type: 'FLASHCARD',
                order: index
            }));

            const res = await api.post('/modules', {
                title: trimmedTitle,
                type: 'FLASHCARD',
                category: category.trim() || 'Genel',
                subCategory: subCategory.trim() || 'Genel',
                isForkable: true,
                status: 'ACTIVE',
                items: formattedItems
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
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#050A14', '#090F1D']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={20} color="#D1D5DB" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manuel Modül</Text>
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
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    
                    <Text style={styles.sectionLabel}>TEMEL BİLGİLER</Text>
                    
                    <View style={[styles.inputContainer, focusedField === 'title' && styles.inputFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Modül Başlığı (örn: İspanyolca Kelimeler)"
                            placeholderTextColor="rgba(255,255,255,0.2)"
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
                                placeholder="Kategori"
                                placeholderTextColor="rgba(255,255,255,0.2)"
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
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                value={subCategory}
                                onChangeText={setSubCategory}
                                editable={!saving}
                                onFocus={() => setFocusedField('subCategory')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    <Text style={[styles.sectionLabel, { marginTop: 24 }]}>KARTLAR (FLASHCARDS)</Text>

                    {items.map((item, index) => (
                        <View key={item.id} style={styles.cardItem}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardLabel}>KART {index + 1}</Text>
                                <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                            
                            <TextInput
                                style={styles.cardInput}
                                placeholder="Ön Yüz (Soru)"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={item.front}
                                onChangeText={(val) => updateItem(item.id, 'front', val)}
                                editable={!saving}
                                multiline
                            />
                            
                            <View style={styles.cardDivider} />
                            
                            <TextInput
                                style={[styles.cardInput, styles.cardInputBack]}
                                placeholder="Arka Yüz (Cevap)"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={item.back}
                                onChangeText={(val) => updateItem(item.id, 'back', val)}
                                editable={!saving}
                                multiline
                            />
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addCardBtn} onPress={handleAddItem} disabled={saving}>
                        <Ionicons name="add" size={20} color="#3B82F6" />
                        <Text style={styles.addCardBtnText}>Yeni Kart Ekle</Text>
                    </TouchableOpacity>

                </ScrollView>
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
    saveBtn: {
        backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    saveBtnDisabled: { backgroundColor: '#182234', opacity: 0.5 },
    saveBtnText: { color: 'white', fontWeight: '700', fontSize: 13, marginLeft: 4 },
    scrollContent: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 100 },
    sectionLabel: { color: '#64748B', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
    inputContainer: {
        backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#111111', borderRadius: 16,
        paddingHorizontal: 16, paddingVertical: 16, marginBottom: 12,
    },
    inputFocused: { borderColor: '#3B82F6' },
    input: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    inputSmall: { color: '#F8FAFC', fontSize: 14 },
    cardItem: {
        backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#111111', borderRadius: 20,
        marginBottom: 16, overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0F172A',
    },
    cardLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    removeBtn: { padding: 4 },
    cardInput: {
        color: '#F8FAFC', fontSize: 16, paddingHorizontal: 16, paddingVertical: 16,
        minHeight: 80, textAlignVertical: 'top',
    },
    cardInputBack: {
        color: '#A855F7',
    },
    cardDivider: { height: 1, backgroundColor: '#111111', marginHorizontal: 16 },
    addCardBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)',
        borderRadius: 20, paddingVertical: 16, gap: 8, marginTop: 8,
    },
    addCardBtnText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
});
