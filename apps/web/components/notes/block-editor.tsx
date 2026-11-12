"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { PartialBlock } from "@blocknote/core";
import { PenTool } from "lucide-react";

interface BlockEditorProps {
    initialContent?: string;
    onChange: (content: string) => void;
    readOnly?: boolean;
}

export function BlockEditor({ initialContent, onChange, readOnly = false }: BlockEditorProps) {
    const { theme } = useTheme();
    const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | undefined | "loading">("loading");
    const [plainTextFallback, setPlainTextFallback] = useState<string>("");
    const [embeddedDrawing, setEmbeddedDrawing] = useState<any>(null);

    useEffect(() => {
        if (!initialContent) {
            setInitialBlocks(undefined);
            return;
        }

        // 1. Check if it's already a BlockNote JSON array or a Mobile hybrid object
        try {
            const parsed = JSON.parse(initialContent);

            // BlockNote array
            if (Array.isArray(parsed) && parsed.length > 0) {
                setInitialBlocks(parsed as PartialBlock[]);
                return;
            }

            // Mobile hybrid object: { text, drawing }
            if (parsed && typeof parsed === 'object') {
                if (parsed.drawing) {
                    setEmbeddedDrawing(parsed.drawing);
                }
                const textStr = typeof parsed.text === 'string' ? parsed.text : '';

                // Try if text is itself a serialized BlockNote array
                try {
                    const nested = JSON.parse(textStr);
                    if (Array.isArray(nested) && nested.length > 0) {
                        setInitialBlocks(nested as PartialBlock[]);
                        return;
                    }
                } catch { }

                setPlainTextFallback(textStr);
                setInitialBlocks(undefined);
                return;
            }
        } catch (e) {
            // Not JSON, continue to HTML check
        }

        // 2. Fallback to Content (could be HTML or plain text)
        setPlainTextFallback(initialContent);
        setInitialBlocks(undefined);
    }, [initialContent]);

    const editor = useCreateBlockNote();

    useEffect(() => {
        if (editor && initialBlocks === undefined) {
            const textToInsert = plainTextFallback || "";
            if (textToInsert.trim().startsWith("<")) {
                editor.tryParseHTMLToBlocks(textToInsert).then((blocks) => {
                    if (blocks && blocks.length > 0) {
                        editor.replaceBlocks(editor.document, blocks);
                    }
                }).catch(console.error);
            } else if (textToInsert.length > 0) {
                // Split multi-line text into paragraphs
                const lines = textToInsert.split("\n\n").filter(Boolean);
                const blocks = lines.map(line => ({
                    type: "paragraph" as const,
                    content: line,
                }));
                editor.replaceBlocks(editor.document, blocks.length > 0 ? blocks : [
                    { type: "paragraph", content: textToInsert }
                ]);
            }
        }
    }, [editor, plainTextFallback, initialBlocks]);

    if (initialBlocks === "loading") {
        return <div className="animate-pulse h-40 bg-zinc-900/50 rounded-lg w-full"></div>;
    }

    return (
        <div className="w-full relative mx-0 sm:-mx-[54px] space-y-6">
            {/* Offsets BlockNote's default deep padding on desktop to align it with the title */}
            <BlockNoteView
                editor={editor}
                theme={theme === "dark" || theme === "system" ? "dark" : "light"}
                editable={!readOnly}
                onChange={() => {
                    const documentJson = JSON.stringify(editor.document);
                    if (embeddedDrawing) {
                        onChange(JSON.stringify({
                            text: documentJson,
                            drawing: embeddedDrawing
                        }));
                    } else {
                        onChange(documentJson);
                    }
                }}
            />

            {/* Embedded Drawing Canvas Preview (Vector SVG) */}
            {embeddedDrawing && embeddedDrawing.paths && embeddedDrawing.paths.length > 0 && (
                <div className="mx-4 sm:mx-14 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-sky-500 uppercase tracking-wider">
                        <PenTool className="h-3.5 w-3.5" />
                        Mobilde Çizilen El Yazısı & Çizim
                    </div>
                    <div className="w-full overflow-hidden rounded-xl bg-black border border-zinc-800 p-3">
                        <svg
                            viewBox={`0 0 400 ${embeddedDrawing.canvasHeight || 320}`}
                            className="w-full h-auto max-h-[420px]"
                        >
                            {embeddedDrawing.paths.map((p: any) => (
                                <path
                                    key={p.id}
                                    d={p.d}
                                    stroke={p.color || '#38BDF8'}
                                    strokeWidth={p.strokeWidth || 3}
                                    opacity={p.opacity ?? 1}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ))}
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}
