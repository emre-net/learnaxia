import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CameraView } from 'expo-camera';
interface CameraScreenProps {
    cameraRef: React.RefObject<CameraView | null>;
    isGenerating: boolean;
    onCapture: () => void;
    onClose: () => void;
}

/**
 * Tam ekran kamera görünümü.
 * create.tsx'ten ayrı bileşene alındı.
 */
export function CameraScreen({ cameraRef, isGenerating, onCapture, onClose }: CameraScreenProps) {
    return (
        <Screen style={styles.screen}>
            <CameraView style={{ flex: 1 }} facing="back" ref={cameraRef}>
                <View style={styles.overlay}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <IconSymbol name="xmark" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Sorunu Kareye Al</Text>
                        {/* Simetri için boş alan */}
                        <View style={{ width: 48 }} />
                    </View>

                    {/* Çerçeve rehberi */}
                    <View style={styles.frameGuide}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>

                    {/* Hint */}
                    <Text style={styles.hint}>Soruyu çerçeve içine al</Text>

                    {/* Capture Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={onCapture}
                            disabled={isGenerating}
                            style={[styles.captureBtn, isGenerating && { opacity: 0.6 }]}
                        >
                            {isGenerating ? (
                                <BrandLoader size={30} showBlur={false} />
                            ) : (
                                <View style={styles.captureInner} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#000000',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
    },
    closeBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 18,
    },
    frameGuide: {
        position: 'absolute',
        top: '25%',
        left: '10%',
        right: '10%',
        bottom: '30%',
    },
    corner: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderColor: 'rgba(255,255,255,0.7)',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderTopLeftRadius: 6,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderTopRightRadius: 6,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderBottomLeftRadius: 6,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderBottomRightRadius: 6,
    },
    hint: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '500',
        position: 'absolute',
        bottom: '28%',
        left: 0,
        right: 0,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 64,
    },
    captureBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    captureInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
    },
});
