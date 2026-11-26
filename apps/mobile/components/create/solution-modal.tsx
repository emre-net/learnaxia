import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    TextInput,
    Alert,
    Image,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { NativeRichText } from '@/components/ui/rich-math-text';
import api from '@/lib/api';
import { extractApiErrorMessage } from '@learnaxia/shared';
import * as Haptics from 'expo-haptics';

interface VisionResult {
    id?: string;
    questionText: string;
    solution: string;
    imageUrl?: string;
    notes?: { id: string; title: string }[];
}

interface SolutionModalProps {
    visible: boolean;
    result: VisionResult | null;
    onClose: () => void;
    onDeleted?: (id: string) => void;
    onNoteSaved?: () => void;
}

export function SolutionModal({
    visible,
    result,
    onClose,
    onDeleted,
    onNoteSaved,
}: SolutionModalProps) {
    const [noteText, setNoteText] = useState('');
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [savingNote, setSavingNote] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!visible) {
            setNoteText('');
            setShowNoteInput(false);
        }
    }, [visible]);

    const handleSaveNote = async () => {
        if (!result?.id || !noteText.trim()) return;
        setSavingNote(true);
        try {
            await api.patch(`/solved-questions/${result.id}`, {
                note: noteText.trim(),
                title: 'AI Çözüm Notu',
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setNoteText('');
            setShowNoteInput(false);
            Alert.alert('Başarılı', 'Çözüm notun kütüphanene eklendi.');
            onNoteSaved?.();
        } catch (err) {
            Alert.alert('Hata', extractApiErrorMessage(err, 'Not kaydedilemedi.'));
        } finally {
            setSavingNote(false);
        }
    };

    const handleDelete = () => {
        if (!result?.id) return;
        Alert.alert(
            'Çözümü Sil',
            'Bu AI çözüm kaydını silmek istediğinizden emin misiniz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await api.delete(`/solved-questions/${result.id}`);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            onDeleted?.(result.id!);
                            onClose();
                        } catch (err) {
                            Alert.alert('Hata', extractApiErrorMessage(err, 'Çözüm silinemedi.'));
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const hasValidImage =
        Boolean(result?.imageUrl) &&
        (result!.imageUrl!.startsWith('data:') || result!.imageUrl!.startsWith('http'));

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <MaterialIcons name="auto-awesome" size={22} color="#38BDF8" />
                            <Text style={styles.title}>Çözüm Hazır</Text>
                        </View>
                        <View style={styles.headerRight}>
                            {result?.id && (
                                <TouchableOpacity
                                    onPress={handleDelete}
                                    disabled={deleting}
                                    style={styles.deleteIconBtn}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={22} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 16 }}
                    >
                        {hasValidImage && (
                            <View style={styles.imageWrapper}>
                                <Image
                                    source={{ uri: result!.imageUrl }}
                                    style={styles.previewImage}
                                    resizeMode="contain"
                                />
                            </View>
                        )}

                        <View style={styles.questionBox}>
                            <Text style={styles.questionBoxLabel}>Tespit Edilen Soru</Text>
                            <NativeRichText text={result?.questionText || ''} compact />
                        </View>

                        <View style={styles.answerBox}>
                            <View style={styles.answerBoxHeader}>
                                <MaterialIcons name="psychology" size={18} color="#38BDF8" />
                                <Text style={styles.answerBoxLabel}>Yapay Zeka Çözümü</Text>
                            </View>
                            <NativeRichText text={result?.solution || ''} />
                        </View>

                        {result?.notes && result.notes.length > 0 && (
                            <View style={styles.notesTagBox}>
                                <Text style={styles.notesTagTitle}>İlişkili Notlar ({result.notes.length})</Text>
                                {result.notes.map((n) => (
                                    <Text key={n.id} style={styles.noteRefText}>• {n.title}</Text>
                                ))}
                            </View>
                        )}

                        {result?.id && showNoteInput && (
                            <View style={styles.noteInputBox}>
                                <TextInput
                                    style={styles.noteTextInput}
                                    placeholder="Bu çözümle ilgili kendi notunu ekle..."
                                    placeholderTextColor="#52525B"
                                    value={noteText}
                                    onChangeText={setNoteText}
                                    multiline
                                    textAlignVertical="top"
                                />
                                <View style={styles.noteActionRow}>
                                    <TouchableOpacity
                                        onPress={() => setShowNoteInput(false)}
                                        style={styles.cancelNoteBtn}
                                    >
                                        <Text style={styles.cancelNoteText}>İptal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSaveNote}
                                        disabled={savingNote || !noteText.trim()}
                                        style={[styles.saveNoteBtn, (!noteText.trim() || savingNote) && { opacity: 0.5 }]}
                                    >
                                        <Text style={styles.saveNoteText}>
                                            {savingNote ? 'Kaydediliyor...' : 'Notu Kaydet'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footerRow}>
                        {result?.id && !showNoteInput && (
                            <TouchableOpacity
                                onPress={() => setShowNoteInput(true)}
                                style={styles.secondaryBtn}
                            >
                                <Ionicons name="create-outline" size={18} color="#38BDF8" />
                                <Text style={styles.secondaryBtnText}>Not Ekle</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} style={[styles.okBtn, { flex: 1 }]}>
                            <Text style={styles.okBtnText}>Anladım</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(9, 9, 11, 0.8)',
    },
    sheet: {
        backgroundColor: '#121215',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        maxHeight: '88%',
        borderTopWidth: 1,
        borderTopColor: '#27272A',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#F4F4F5',
    },
    deleteIconBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#18181B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageWrapper: {
        height: 160,
        width: '100%',
        borderRadius: 14,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        marginBottom: 14,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    questionBox: {
        backgroundColor: '#18181B',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    questionBoxLabel: {
        color: '#38BDF8',
        fontWeight: '700',
        fontSize: 12,
        marginBottom: 8,
    },
    answerBox: {
        backgroundColor: 'rgba(56, 189, 248, 0.06)',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.2)',
    },
    answerBoxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 6,
    },
    answerBoxLabel: {
        color: '#38BDF8',
        fontWeight: '700',
        fontSize: 12,
    },
    notesTagBox: {
        marginTop: 14,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
        gap: 4,
    },
    notesTagTitle: {
        color: '#A1A1AA',
        fontSize: 12,
        fontWeight: '700',
    },
    noteRefText: {
        color: '#F4F4F5',
        fontSize: 13,
    },
    noteInputBox: {
        marginTop: 14,
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#38BDF8',
        gap: 10,
    },
    noteTextInput: {
        color: '#F4F4F5',
        fontSize: 14,
        minHeight: 72,
    },
    noteActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    cancelNoteBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#121215',
    },
    cancelNoteText: {
        color: '#A1A1AA',
        fontSize: 13,
        fontWeight: '600',
    },
    saveNoteBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#38BDF8',
    },
    saveNoteText: {
        color: '#09090B',
        fontSize: 13,
        fontWeight: '700',
    },
    footerRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 52,
        paddingHorizontal: 18,
        borderRadius: 14,
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    secondaryBtnText: {
        color: '#38BDF8',
        fontWeight: '700',
        fontSize: 14,
    },
    okBtn: {
        height: 52,
        backgroundColor: '#38BDF8',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    okBtnText: {
        color: '#09090B',
        fontWeight: '700',
        fontSize: 15,
    },
});
