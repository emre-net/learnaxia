import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandLoader } from '@/components/ui/brand-loader';
import { MaterialIcons } from '@expo/vector-icons';

interface TopicModalProps {
    visible: boolean;
    topic: string;
    isGenerating: boolean;
    onChangeTopic: (text: string) => void;
    onGenerate: () => void;
    onClose: () => void;
}

/**
 * AI konu tabanlı modül üretme modalı.
 * create.tsx'ten ayrı bileşene alındı.
 */
export function TopicModal({
    visible,
    topic,
    isGenerating,
    onChangeTopic,
    onGenerate,
    onClose,
}: TopicModalProps) {
    const isDisabled = isGenerating || topic.length < 3;

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
                        <Text style={styles.title}>Zeka ile Üret</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <IconSymbol name="xmark" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.desc}>
                        Öğrenmek istediğiniz konuyu yazın, yapay zeka size özel modül oluştursun.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Örn: İngilizce phrasal verbs"
                        placeholderTextColor="#475569"
                        value={topic}
                        onChangeText={onChangeTopic}
                        autoFocus={true}
                        editable={!isGenerating}
                        returnKeyType="done"
                        onSubmitEditing={isDisabled ? undefined : onGenerate}
                    />

                    {topic.length > 0 && topic.length < 3 && (
                        <Text style={styles.hint}>En az 3 karakter gerekli</Text>
                    )}

                    <TouchableOpacity
                        onPress={onGenerate}
                        disabled={isDisabled}
                        style={[styles.actionBtn, isDisabled ? styles.actionBtnDisabled : styles.actionBtnActive]}
                    >
                        {isGenerating ? (
                            <>
                                <BrandLoader size={24} showBlur={false} />
                                <Text style={[styles.actionBtnText, { marginLeft: 12 }]}>Üretiliyor...</Text>
                            </>
                        ) : (
                            <>
                                <MaterialIcons name="auto-awesome" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.actionBtnText}>Üret</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    sheet: {
        backgroundColor: '#090F1D',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 32,
        paddingBottom: 48,
        borderTopWidth: 1,
        borderTopColor: 'rgba(59, 130, 246, 0.3)',
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    closeBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    desc: {
        color: '#94A3B8',
        marginBottom: 16,
        fontWeight: '500',
        fontSize: 15,
        lineHeight: 22,
    },
    input: {
        backgroundColor: '#050A14',
        borderWidth: 1,
        borderColor: '#182234',
        borderRadius: 16,
        padding: 20,
        color: '#FFFFFF',
        fontSize: 18,
        marginBottom: 12,
    },
    hint: {
        color: '#EF4444',
        fontSize: 11,
        marginBottom: 20,
        marginLeft: 4,
        fontWeight: '500',
    },
    actionBtn: {
        width: '100%',
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginTop: 8,
    },
    actionBtnActive: {
        backgroundColor: '#3B82F6',
    },
    actionBtnDisabled: {
        backgroundColor: '#182234',
        opacity: 0.6,
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 18,
    },
});
