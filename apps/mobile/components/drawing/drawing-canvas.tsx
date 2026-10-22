import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    PanResponder, GestureResponderEvent, Alert
} from 'react-native';
import Svg, { Path, G, Rect } from 'react-native-svg';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DrawingPath, DrawingCanvasData } from '@learnaxia/shared';

interface DrawingCanvasProps {
    initialData?: DrawingCanvasData;
    onChange?: (data: DrawingCanvasData) => void;
    readOnly?: boolean;
    height?: number;
}

const PRESET_COLORS = [
    '#F8FAFC', // White
    '#38BDF8', // Cyan / Light Blue
    '#A855F7', // Purple
    '#34D399', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
];

const STROKE_WIDTHS = [
    { label: 'İnce', value: 2 },
    { label: 'Orta', value: 4 },
    { label: 'Kalın', value: 8 },
];

export function DrawingCanvas({
    initialData,
    onChange,
    readOnly = false,
    height = 360,
}: DrawingCanvasProps) {
    const [paths, setPaths] = useState<DrawingPath[]>(initialData?.paths || []);
    const [redoStack, setRedoStack] = useState<DrawingPath[]>([]);
    const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);

    // Active Tool State
    const [activeTool, setActiveTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
    const [selectedColor, setSelectedColor] = useState<string>('#38BDF8');
    const [selectedWidth, setSelectedWidth] = useState<number>(4);

    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const pathsRef = useRef<DrawingPath[]>(paths);
    pathsRef.current = paths;

    const notifyChange = useCallback((updatedPaths: DrawingPath[]) => {
        if (onChange) {
            onChange({
                version: 1,
                paths: updatedPaths,
                canvasHeight: height,
                updatedAt: Date.now(),
            });
        }
    }, [onChange, height]);

    // Handle Eraser hit detection
    const handleEraseAt = useCallback((x: number, y: number) => {
        // Approximate distance check to strokes
        const threshold = 18;
        const remaining = pathsRef.current.filter(p => {
            // Simple bounding box or coord check from SVG path string
            const coords = p.d.match(/[-+]?[0-9]*\.?[0-9]+/g);
            if (!coords) return true;
            for (let i = 0; i < coords.length; i += 2) {
                const px = parseFloat(coords[i]);
                const py = parseFloat(coords[i + 1]);
                const dist = Math.hypot(px - x, py - y);
                if (dist < threshold) {
                    return false; // Erase this path
                }
            }
            return true;
        });

        if (remaining.length !== pathsRef.current.length) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPaths(remaining);
            notifyChange(remaining);
        }
    }, [notifyChange]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !readOnly,
            onMoveShouldSetPanResponder: () => !readOnly,

            onPanResponderGrant: (evt: GestureResponderEvent) => {
                if (readOnly) return;
                const { locationX, locationY } = evt.nativeEvent;
                lastPointRef.current = { x: locationX, y: locationY };

                if (activeTool === 'eraser') {
                    handleEraseAt(locationX, locationY);
                    return;
                }

                const newPath: DrawingPath = {
                    id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    d: `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`,
                    color: selectedColor,
                    strokeWidth: activeTool === 'highlighter' ? selectedWidth * 3.5 : selectedWidth,
                    tool: activeTool,
                    opacity: activeTool === 'highlighter' ? 0.35 : 1.0,
                };
                setCurrentPath(newPath);
            },

            onPanResponderMove: (evt: GestureResponderEvent) => {
                if (readOnly) return;
                const { locationX, locationY } = evt.nativeEvent;

                if (activeTool === 'eraser') {
                    handleEraseAt(locationX, locationY);
                    return;
                }

                if (!lastPointRef.current) {
                    lastPointRef.current = { x: locationX, y: locationY };
                    return;
                }

                const prev = lastPointRef.current;
                const midX = ((prev.x + locationX) / 2).toFixed(1);
                const midY = ((prev.y + locationY) / 2).toFixed(1);

                setCurrentPath(prevPath => {
                    if (!prevPath) return null;
                    // Quadratic bezier curve to midpoint
                    const newD = `${prevPath.d} Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)}, ${midX} ${midY}`;
                    return { ...prevPath, d: newD };
                });

                lastPointRef.current = { x: locationX, y: locationY };
            },

            onPanResponderRelease: () => {
                if (readOnly) return;
                if (activeTool === 'eraser') {
                    lastPointRef.current = null;
                    return;
                }

                if (currentPath) {
                    setPaths(prev => {
                        const updated = [...prev, currentPath];
                        notifyChange(updated);
                        return updated;
                    });
                    setRedoStack([]); // Clear redo after new stroke
                    setCurrentPath(null);
                }
                lastPointRef.current = null;
            },
        })
    ).current;

    const handleUndo = useCallback(() => {
        if (paths.length === 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const last = paths[paths.length - 1];
        const newPaths = paths.slice(0, -1);
        setPaths(newPaths);
        setRedoStack(prev => [...prev, last]);
        notifyChange(newPaths);
    }, [paths, notifyChange]);

    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const restored = redoStack[redoStack.length - 1];
        const newRedo = redoStack.slice(0, -1);
        const newPaths = [...paths, restored];
        setPaths(newPaths);
        setRedoStack(newRedo);
        notifyChange(newPaths);
    }, [paths, redoStack, notifyChange]);

    const handleClear = useCallback(() => {
        if (paths.length === 0) return;
        Alert.alert(
            'Çizimi Temizle',
            'Tüm çizimi silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        setPaths([]);
                        setRedoStack([]);
                        notifyChange([]);
                    },
                },
            ]
        );
    }, [paths, notifyChange]);

    return (
        <View style={styles.container}>
            {/* Toolbar (Only in edit mode) */}
            {!readOnly && (
                <View style={styles.toolbar}>
                    {/* Tool Chooser */}
                    <View style={styles.toolGroup}>
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveTool('pen');
                            }}
                            style={[styles.toolBtn, activeTool === 'pen' && styles.toolBtnActive]}
                        >
                            <MaterialIcons
                                name="edit"
                                size={18}
                                color={activeTool === 'pen' ? '#38BDF8' : '#64748B'}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveTool('highlighter');
                            }}
                            style={[styles.toolBtn, activeTool === 'highlighter' && styles.toolBtnActive]}
                        >
                            <FontAwesome5
                                name="highlighter"
                                size={15}
                                color={activeTool === 'highlighter' ? '#F59E0B' : '#64748B'}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveTool('eraser');
                            }}
                            style={[styles.toolBtn, activeTool === 'eraser' && styles.toolBtnActive]}
                        >
                            <MaterialIcons
                                name="auto-fix-normal"
                                size={18}
                                color={activeTool === 'eraser' ? '#EF4444' : '#64748B'}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Width Selector */}
                    {activeTool !== 'eraser' && (
                        <View style={styles.widthGroup}>
                            {STROKE_WIDTHS.map(w => (
                                <TouchableOpacity
                                    key={w.value}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSelectedWidth(w.value);
                                    }}
                                    style={[styles.widthBtn, selectedWidth === w.value && styles.widthBtnActive]}
                                >
                                    <View
                                        style={{
                                            width: w.value * 2.2,
                                            height: w.value * 2.2,
                                            borderRadius: (w.value * 2.2) / 2,
                                            backgroundColor: selectedWidth === w.value ? '#F8FAFC' : '#64748B',
                                        }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Undo / Redo / Clear */}
                    <View style={styles.actionGroup}>
                        <TouchableOpacity
                            onPress={handleUndo}
                            disabled={paths.length === 0}
                            style={[styles.actionBtn, paths.length === 0 && styles.btnDisabled]}
                        >
                            <Ionicons name="arrow-undo" size={17} color={paths.length > 0 ? '#CBD5E1' : '#334155'} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleRedo}
                            disabled={redoStack.length === 0}
                            style={[styles.actionBtn, redoStack.length === 0 && styles.btnDisabled]}
                        >
                            <Ionicons name="arrow-redo" size={17} color={redoStack.length > 0 ? '#CBD5E1' : '#334155'} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleClear}
                            disabled={paths.length === 0}
                            style={[styles.actionBtn, paths.length === 0 && styles.btnDisabled]}
                        >
                            <Ionicons name="trash-outline" size={17} color={paths.length > 0 ? '#EF4444' : '#334155'} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Color Palette (When Pen or Highlighter is active) */}
            {!readOnly && activeTool !== 'eraser' && (
                <View style={styles.colorPalette}>
                    {PRESET_COLORS.map(c => {
                        const isSelected = selectedColor === c;
                        return (
                            <TouchableOpacity
                                key={c}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedColor(c);
                                }}
                                style={[
                                    styles.colorDot,
                                    { backgroundColor: c },
                                    isSelected && styles.colorDotSelected,
                                ]}
                            />
                        );
                    })}
                </View>
            )}

            {/* Interactive SVG Canvas Surface */}
            <View
                style={[styles.canvasSurface, { height }]}
                {...panResponder.panHandlers}
            >
                <Svg style={StyleSheet.absoluteFillObject} width="100%" height={height}>
                    {/* Grid dots background for drafting */}
                    <Rect width="100%" height="100%" fill="#0C1019" />

                    <G>
                        {paths.map(p => (
                            <Path
                                key={p.id}
                                d={p.d}
                                stroke={p.color}
                                strokeWidth={p.strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                                opacity={p.opacity ?? 1.0}
                            />
                        ))}

                        {/* Stroke currently being drawn */}
                        {currentPath && (
                            <Path
                                d={currentPath.d}
                                stroke={currentPath.color}
                                strokeWidth={currentPath.strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                                opacity={currentPath.opacity ?? 1.0}
                            />
                        )}
                    </G>
                </Svg>

                {paths.length === 0 && !currentPath && !readOnly && (
                    <View style={styles.emptyPlaceholder} pointerEvents="none">
                        <Ionicons name="finger-print-outline" size={26} color="#334155" />
                        <Text style={styles.placeholderText}>
                            Parmağınız veya Stylus kaleminizle çizim yapın
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#0F172A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
        overflow: 'hidden',
        marginVertical: 10,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#141E33',
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    toolGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    toolBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    toolBtnActive: {
        backgroundColor: '#1E293B',
        borderColor: '#38BDF8',
    },
    widthGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#0F172A',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    widthBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    widthBtnActive: {
        backgroundColor: '#1E293B',
    },
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    btnDisabled: {
        opacity: 0.35,
    },
    colorPalette: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 8,
        backgroundColor: '#0C1322',
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    colorDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
    },
    colorDotSelected: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
        transform: [{ scale: 1.2 }],
    },
    canvasSurface: {
        width: '100%',
        backgroundColor: '#0C1019',
        position: 'relative',
    },
    emptyPlaceholder: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    placeholderText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '500',
    },
});
