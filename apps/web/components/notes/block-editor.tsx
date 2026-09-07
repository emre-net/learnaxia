"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { PartialBlock } from "@blocknote/core";

interface BlockEditorProps {
    initialContent?: string;
    onChange: (content: string) => void;
    readOnly?: boolean;
}

export function BlockEditor({ initialContent, onChange, readOnly = false }: BlockEditorProps) {
    const { theme } = useTheme();
    const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | undefined | "loading">("loading");

    useEffect(() => {
        if (!initialContent) {
            setInitialBlocks(undefined);
            return;
        }

        // 1. Check if it's already a BlockNote JSON array
        try {
            const parsed = JSON.parse(initialContent);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setInitialBlocks(parsed as PartialBlock[]);
                return;
            }
        } catch (e) {
            // Not JSON, continue to HTML check
        }

        // 2. Fallback to Content (could be HTML or plain text)
        setInitialBlocks(undefined); // Let the editor initialize empty, then we'll try to convert if it's HTML
    }, [initialContent]);

    const editor = useCreateBlockNote();

    useEffect(() => {
        if (editor && initialContent && initialBlocks === undefined) {
            // If it's HTML, try to parse it
            if (initialContent.trim().startsWith("<")) {
                const blocks = editor.tryParseHTMLToBlocks(initialContent);
                if (blocks && blocks.length > 0) {
                    editor.replaceBlocks(editor.document, blocks);
                }
            } else {
                // Otherwise treat as plain text
                editor.replaceBlocks(editor.document, [
                    {
                        type: "paragraph",
                        content: initialContent,
                    },
                ]);
            }
        }
    }, [editor, initialContent, initialBlocks]);

    if (initialBlocks === "loading") {
        return <div className="animate-pulse h-40 bg-zinc-900/50 rounded-lg w-full"></div>;
    }

    return (
        <div className="w-full relative -mx-[54px] sm:mx-0">
            {/* The -mx-[54px] offsets BlockNote's default deep padding to align it with the title */}
            <BlockNoteView
                editor={editor}
                theme={theme === "dark" || theme === "system" ? "dark" : "light"}
                editable={!readOnly}
                onChange={() => {
                    const documentJson = JSON.stringify(editor.document);
                    onChange(documentJson);
                }}
            />
        </div>
    );
}
