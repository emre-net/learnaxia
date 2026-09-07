import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SolutionResult {
    questionText: string;
    solution: string;
}

interface SolutionModalProps {
    visible: boolean;
    result: SolutionResult | null;
    onClose: () => void;
}

/**
 * AI fotoğraf/galeri soru çözümü sonuç modalı.
 * create.tsx'ten ayrı bileşene alındı.
 */
export function SolutionModal({ visible, result, onClose }: SolutionModalProps) {
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
                            <MaterialIcons name="auto-awesome" size={24} color="#00D2FF" />
                            <Text style={styles.title}>Çözüm Hazır</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialIcons name="cancel" size={28} color="#4B5563" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 16 }}
                    >
                        {/* Tespit Edilen Soru */}
                        <View style={styles.questionBox}>
                            <Text style={styles.questionBoxLabel}>TESPİT EDİLEN SORU</Text>
                            <Text style={styles.questionText}>{result?.questionText}</Text>
                        </View>

                        {/* Yapay Zeka Çözümü */}
                        <View style={styles.answerBox}>
                            <View style={styles.answerBoxHeader}>
                                <MaterialIcons name="psychology" size={18} color="#818CF8" />
                                <Text style={styles.answerBoxLabel}>YAPAY ZEKA ÇÖZÜMÜ</Text>
                            </View>
                            <Text style={styles.answerText}>{result?.solution}</Text>
                        </View>
                    </ScrollView>

                    <TouchableOpacity onPress={onClose} style={styles.okBtn}>
                        <Text style={styles.okBtnText}>Anladım</Text>
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
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    sheet: {
        backgroundColor: '#0D0D0D',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 32,
        maxHeight: '85%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    closeBtn: {
        padding: 4,
    },
    questionBox: {
        backgroundColor: 'rgba(38, 38, 38, 0.6)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#404040',
    },
    questionBoxLabel: {
        color: '#60A5FA',
        fontWeight: '700',
        fontSize: 10,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    questionText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 16,
        lineHeight: 26,
        fontWeight: '500',
    },
    answerBox: {
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    answerBoxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    answerBoxLabel: {
        color: '#818CF8',
        fontWeight: '700',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginLeft: 8,
    },
    answerText: {
        color: '#F8FAFC',
        fontSize: 16,
        lineHeight: 28,
        fontWeight: '500',
    },
    okBtn: {
        width: '100%',
        height: 56,
        backgroundColor: '#090F1D',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#182234',
    },
    okBtnText: {
        color: '#F8FAFC',
        fontWeight: '700',
        fontSize: 16,
    },
});
