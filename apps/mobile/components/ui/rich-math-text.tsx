import React from 'react';
import { Text, View, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { parseRichContentBlocks, parseInlineRuns } from '@learnaxia/shared';

interface NativeRichTextProps {
    text: string;
    style?: TextStyle;
    containerStyle?: ViewStyle;
    compact?: boolean;
}

export function NativeRichText({ text, style, containerStyle, compact = false }: NativeRichTextProps) {
    if (!text) return null;

    const blocks = parseRichContentBlocks(text);
    if (blocks.length === 0) return null;

    const renderRuns = (rawLine: string, baseStyle: TextStyle | TextStyle[]) => {
        const runs = parseInlineRuns(rawLine);
        return runs.map((run, idx) => {
            const extraStyles: TextStyle[] = [];
            if (run.bold) extraStyles.push(styles.bold);
            if (run.italic) extraStyles.push(styles.italic);
            if (run.code) extraStyles.push(styles.inlineCode);
            return (
                <Text key={idx} style={[baseStyle, ...extraStyles]}>
                    {run.text}
                </Text>
            );
        });
    };

    return (
        <View style={[styles.container, compact && styles.compactContainer, containerStyle]}>
            {blocks.map((block, index) => {
                if (block.type === 'heading') {
                    const hStyle =
                        block.level === 1
                            ? styles.h1
                            : block.level === 2
                                ? styles.h2
                                : styles.h3;
                    return (
                        <Text key={index} style={[hStyle, style]}>
                            {renderRuns(block.text, hStyle)}
                        </Text>
                    );
                }

                if (block.type === 'list-item') {
                    return (
                        <View key={index} style={styles.listRow}>
                            <Text style={[styles.bullet, style]}>•</Text>
                            <Text style={[styles.paragraph, style, { flex: 1 }]}>
                                {renderRuns(block.text, [styles.paragraph, style || {}])}
                            </Text>
                        </View>
                    );
                }

                if (block.type === 'blockquote') {
                    return (
                        <View key={index} style={styles.quoteBlock}>
                            <Text style={[styles.quoteText, style]}>
                                {renderRuns(block.text, [styles.quoteText, style || {}])}
                            </Text>
                        </View>
                    );
                }

                if (block.type === 'code') {
                    return (
                        <View key={index} style={styles.codeBlock}>
                            <Text style={styles.codeBlockText}>{block.text}</Text>
                        </View>
                    );
                }

                return (
                    <Text key={index} style={[styles.paragraph, style]}>
                        {renderRuns(block.text, [styles.paragraph, style || {}])}
                    </Text>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    compactContainer: {
        gap: 4,
    },
    paragraph: {
        color: '#F4F4F5',
        fontSize: 15,
        lineHeight: 22,
    },
    h1: {
        color: '#F4F4F5',
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 26,
        marginTop: 4,
    },
    h2: {
        color: '#38BDF8',
        fontSize: 17,
        fontWeight: '700',
        lineHeight: 23,
        marginTop: 4,
    },
    h3: {
        color: '#E4E4E7',
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 21,
        marginTop: 2,
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingLeft: 4,
    },
    bullet: {
        color: '#38BDF8',
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '700',
    },
    quoteBlock: {
        borderLeftWidth: 3,
        borderLeftColor: '#38BDF8',
        backgroundColor: '#18181B',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    quoteText: {
        color: '#D4D4D8',
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    codeBlock: {
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 10,
        borderRadius: 10,
    },
    codeBlockText: {
        color: '#38BDF8',
        fontFamily: 'monospace',
        fontSize: 13,
        lineHeight: 19,
    },
    bold: {
        fontWeight: '700',
        color: '#F4F4F5',
    },
    italic: {
        fontStyle: 'italic',
    },
    inlineCode: {
        fontFamily: 'monospace',
        backgroundColor: '#27272A',
        color: '#38BDF8',
        fontSize: 13,
    },
});
