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

        try {
            const parsed = JSON.parse(initialContent);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setInitialBlocks(parsed as PartialBlock[]);
            } else {
                setInitialBlocks(undefined);
            }
        } catch (e) {
            console.error("Failed to parse initial note content:", e);
            // Fallback to text if it was legacy string content
            setInitialBlocks([
                {
                    type: "paragraph",
                    content: initialContent,
                },
            ]);
        }
    }, [initialContent]);

    const editor = useCreateBlockNote({
        initialContent: initialBlocks === "loading" ? undefined : initialBlocks,
    });

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
