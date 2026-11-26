import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    PanResponder, GestureResponderEvent, Alert, LayoutChangeEvent
} from 'react-native';
import Svg, { Path, G, Rect } from 'react-native-svg';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DrawingPath, DrawingCanvasData } from '@learnaxia/shared';

interface DrawingCanvasProps {
    initialData?: DrawingCanvasData;
    onChange?: (data: DrawingCanvasData) => void;
    readOnly?: boolean;
    height?: number;
}

const PRESET_COLORS = [
    '#F4F4F5',
    '#38BDF8',
    '#A855F7',
    '#34D399',
    '#F59E0B',
    '#EF4444',
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

    const [activeTool, setActiveTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
    const [selectedColor, setSelectedColor] = useState<string>('#38BDF8');
    const [selectedWidth, setSelectedWidth] = useState<number>(4);
    const [measuredWidth, setMeasuredWidth] = useState<number>(initialData?.canvasWidth || 340);

    // Coordinate space width/height used for SVG viewBox parity across Mobile & Web
    const baseWidth = initialData?.canvasWidth || measuredWidth || 340;
    const baseHeight = initialData?.canvasHeight || height;

    // Mutable refs so PanResponder never captures stale tool/path/handler closures
    const pathsRef = useRef<DrawingPath[]>(paths);
    pathsRef.current = paths;

    const currentPathRef = useRef<DrawingPath | null>(currentPath);
    currentPathRef.current = currentPath;

    const activeToolRef = useRef(activeTool);
    activeToolRef.current = activeTool;

    const selectedColorRef = useRef(selectedColor);
    selectedColorRef.current = selectedColor;

    const selectedWidthRef = useRef(selectedWidth);
    selectedWidthRef.current = selectedWidth;

    const readOnlyRef = useRef(readOnly);
    readOnlyRef.current = readOnly;

    const baseWidthRef = useRef(baseWidth);
    baseWidthRef.current = baseWidth;

    const baseHeightRef = useRef(baseHeight);
    baseHeightRef.current = baseHeight;

    const measuredWidthRef = useRef(measuredWidth);
    measuredWidthRef.current = measuredWidth;

    const heightRef = useRef(height);
    heightRef.current = height;

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (initialData?.paths) {
            setPaths(initialData.paths);
        }
    }, [initialData]);

    const handleSurfaceLayout = useCallback((e: LayoutChangeEvent) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0) setMeasuredWidth(w);
    }, []);

    const toSvgCoords = useCallback((locationX: number, locationY: number) => {
        const w = Math.max(measuredWidthRef.current, 1);
        const h = Math.max(heightRef.current, 1);
        return {
            x: (locationX / w) * baseWidthRef.current,
            y: (locationY / h) * baseHeightRef.current,
        };
    }, []);

    const notifyChange = useCallback((updatedPaths: DrawingPath[]) => {
        if (onChangeRef.current) {
            onChangeRef.current({
                version: 1,
                paths: updatedPaths,
                canvasWidth: baseWidthRef.current,
                canvasHeight: baseHeightRef.current,
                updatedAt: Date.now(),
            });
        }
    }, []);

    const handleEraseAt = useCallback((x: number, y: number) => {
        const threshold = Math.max(18, (baseWidthRef.current / Math.max(measuredWidthRef.current, 1)) * 18);
        const remaining = pathsRef.current.filter((p) => {
            const coords = p.d.match(/[-+]?[0-9]*\.?[0-9]+/g);
            if (!coords) return true;
            for (let i = 0; i < coords.length; i += 2) {
                const px = parseFloat(coords[i]);
                const py = parseFloat(coords[i + 1]);
                if (Math.hypot(px - x, py - y) < threshold) {
                    return false;
                }
            }
            return true;
        });

        if (remaining.length !== pathsRef.current.length) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            pathsRef.current = remaining;
            setPaths(remaining);
            notifyChange(remaining);
        }
    }, [notifyChange]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !readOnlyRef.current,
            onMoveShouldSetPanResponder: () => !readOnlyRef.current,
            onStartShouldSetPanResponderCapture: () => !readOnlyRef.current,
            onMoveShouldSetPanResponderCapture: () => !readOnlyRef.current,
            onPanResponderTerminationRequest: () => false,

            onPanResponderGrant: (evt: GestureResponderEvent) => {
                if (readOnlyRef.current) return;
                const { x, y } = toSvgCoords(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
                lastPointRef.current = { x, y };

                const tool = activeToolRef.current;
                if (tool === 'eraser') {
                    handleEraseAt(x, y);
                    return;
                }

                const newPath: DrawingPath = {
                    id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    d: `M ${x.toFixed(1)} ${y.toFixed(1)}`,
                    color: selectedColorRef.current,
                    strokeWidth: tool === 'highlighter' ? selectedWidthRef.current * 3.5 : selectedWidthRef.current,
                    tool,
                    opacity: tool === 'highlighter' ? 0.35 : 1.0,
                };
                currentPathRef.current = newPath;
                setCurrentPath(newPath);
            },

            onPanResponderMove: (evt: GestureResponderEvent) => {
                if (readOnlyRef.current) return;
                const { x, y } = toSvgCoords(evt.nativeEvent.locationX, evt.nativeEvent.locationY);

                if (activeToolRef.current === 'eraser') {
                    handleEraseAt(x, y);
                    return;
                }

                if (!lastPointRef.current || !currentPathRef.current) {
                    lastPointRef.current = { x, y };
                    return;
                }

                const prev = lastPointRef.current;
                const midX = ((prev.x + x) / 2).toFixed(1);
                const midY = ((prev.y + y) / 2).toFixed(1);
                const updatedPath: DrawingPath = {
                    ...currentPathRef.current,
                    d: `${currentPathRef.current.d} Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)}, ${midX} ${midY}`,
                };

                currentPathRef.current = updatedPath;
                setCurrentPath(updatedPath);
                lastPointRef.current = { x, y };
            },

            onPanResponderRelease: () => {
                if (readOnlyRef.current) return;
                if (activeToolRef.current === 'eraser') {
                    lastPointRef.current = null;
                    return;
                }

                const finishedPath = currentPathRef.current;
                if (finishedPath) {
                    const updated = [...pathsRef.current, finishedPath];
                    pathsRef.current = updated;
                    setPaths(updated);
                    setRedoStack([]);
                    currentPathRef.current = null;
                    setCurrentPath(null);
                    notifyChange(updated);
                }
                lastPointRef.current = null;
            },

            onPanResponderTerminate: () => {
                const finishedPath = currentPathRef.current;
                if (finishedPath && activeToolRef.current !== 'eraser') {
                    const updated = [...pathsRef.current, finishedPath];
                    pathsRef.current = updated;
                    setPaths(updated);
                    currentPathRef.current = null;
                    setCurrentPath(null);
                    notifyChange(updated);
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
        setRedoStack((prev) => [...prev, last]);
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
            {!readOnly && (
                <View style={styles.toolbar}>
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
                                color={activeTool === 'pen' ? '#38BDF8' : '#71717A'}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveTool('highlighter');
                            }}
                            style={[styles.toolBtn, activeTool === 'highlighter' && styles.toolBtnActive]}
                        >
                            <MaterialIcons
                                name="border-color"
                                size={17}
                                color={activeTool === 'highlighter' ? '#F59E0B' : '#71717A'}
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
                                color={activeTool === 'eraser' ? '#EF4444' : '#71717A'}
                            />
                        </TouchableOpacity>
                    </View>

                    {activeTool !== 'eraser' && (
                        <View style={styles.widthGroup}>
                            {STROKE_WIDTHS.map((w) => (
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
                                            backgroundColor: selectedWidth === w.value ? '#F4F4F5' : '#71717A',
                                        }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={styles.actionGroup}>
                        <TouchableOpacity
                            onPress={handleUndo}
                            disabled={paths.length === 0}
                            style={[styles.actionBtn, paths.length === 0 && styles.btnDisabled]}
                        >
                            <Ionicons name="arrow-undo" size={17} color={paths.length > 0 ? '#E4E4E7' : '#3F3F46'} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleRedo}
                            disabled={redoStack.length === 0}
                            style={[styles.actionBtn, redoStack.length === 0 && styles.btnDisabled]}
                        >
                            <Ionicons name="arrow-redo" size={17} color={redoStack.length > 0 ? '#E4E4E7' : '#3F3F46'} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleClear}
                            disabled={paths.length === 0}
                            style={[styles.actionBtn, paths.length === 0 && styles.btnDisabled]}
                        >
                            <Ionicons name="trash-outline" size={17} color={paths.length > 0 ? '#EF4444' : '#3F3F46'} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {!readOnly && activeTool !== 'eraser' && (
                <View style={styles.colorPalette}>
                    {PRESET_COLORS.map((c) => {
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

            <View
                style={[styles.canvasSurface, { height }]}
                onLayout={handleSurfaceLayout}
                {...panResponder.panHandlers}
            >
                <Svg
                    style={StyleSheet.absoluteFillObject}
                    width="100%"
                    height={height}
                    viewBox={`0 0 ${baseWidth} ${baseHeight}`}
                    preserveAspectRatio="xMidYMid meet"
                >
                    <Rect width={baseWidth} height={baseHeight} fill="#09090B" />

                    <G>
                        {paths.map((p) => (
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
                        <Ionicons name="finger-print-outline" size={26} color="#3F3F46" />
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
        backgroundColor: '#121215',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#27272A',
        overflow: 'hidden',
        marginVertical: 10,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#18181B',
        borderBottomWidth: 1,
        borderBottomColor: '#27272A',
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
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    toolBtnActive: {
        borderColor: '#38BDF8',
        backgroundColor: 'rgba(56, 189, 248, 0.14)',
    },
    widthGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#121215',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    widthBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    widthBtnActive: {
        backgroundColor: '#27272A',
    },
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionBtn: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#121215',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    btnDisabled: {
        opacity: 0.4,
    },
    colorPalette: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        paddingVertical: 8,
        backgroundColor: '#18181B',
        borderBottomWidth: 1,
        borderBottomColor: '#27272A',
    },
    colorDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorDotSelected: {
        borderColor: '#38BDF8',
        transform: [{ scale: 1.2 }],
    },
    canvasSurface: {
        width: '100%',
        position: 'relative',
        backgroundColor: '#09090B',
    },
    emptyPlaceholder: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    placeholderText: {
        color: '#52525B',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});
