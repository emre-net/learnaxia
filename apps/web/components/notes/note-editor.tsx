"use client";

import { useNotes } from "@/hooks/use-notes";
import { BlockEditor } from "@/components/notes/block-editor";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, X } from "lucide-react";

interface NoteEditorProps {
    moduleId?: string;
    itemId?: string;
    existingNote?: { id: string; title?: string; content: string } | null;
    onClose?: () => void;
    onSaved?: () => void;
}

export function NoteEditor({ moduleId, itemId, existingNote, onClose, onSaved }: NoteEditorProps) {
    const { createNote, updateNote, isCreating, isUpdating } = useNotes();
    const [title, setTitle] = useState(existingNote?.title || "");
    const [content, setContent] = useState(existingNote?.content || "");

    useEffect(() => {
        if (existingNote) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTitle(existingNote.title || "");
            setContent(existingNote.content || "");
        }
    }, [existingNote]);

    const [isSaving, setIsSaving] = useState(false);

    // Auto-save logic
    const saveChanges = useCallback(
        async (currentTitle: string, currentContent: string) => {
            if (!currentContent.trim() || currentContent === "[]" || currentContent === '[{"type":"paragraph"}]') return;

            setIsSaving(true);
            try {
                if (existingNote) {
                    await new Promise(resolve => updateNote({ id: existingNote.id, title: currentTitle, content: currentContent }, { onSuccess: resolve }));
                } else {
                    await new Promise(resolve => createNote({ moduleId, itemId, title: currentTitle, content: currentContent }, { onSuccess: resolve }));
                }
            } finally {
                setIsSaving(false);
            }
        },
        [existingNote, moduleId, itemId, createNote, updateNote]
    );

    // Debounce save when content changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (content && content !== existingNote?.content) {
                saveChanges(title, content);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [title, content, saveChanges, existingNote]);

    return (
        <div className="w-full h-full flex flex-col bg-background/50 rounded-xl overflow-hidden pt-4 pb-20">
            {/* Minimal Header */}
            <div className="flex justify-between items-center px-4 mb-6">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {isSaving ? (
                        <span className="flex items-center"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Kaydediliyor...</span>
                    ) : (
                        <span className="flex items-center"><Save className="h-3 w-3 mr-1 opacity-50" /> Kaydedildi</span>
                    )}
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-muted-foreground hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Document Flow (Apple Notes Minimal Style) */}
            <div className="flex-1 overflow-y-auto px-6 md:px-12 xl:px-24">
                <div className="max-w-3xl mx-auto pb-32">
                    <Input
                        placeholder="Not Başlığı (İsteğe bağlı)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="border-none px-0 mb-4 h-auto font-bold text-3xl md:text-4xl lg:text-[42px] focus-visible:ring-0 shadow-none bg-transparent rounded-none placeholder:opacity-40"
                    />

                    <div className="mt-8 text-lg">
                        <BlockEditor
                            initialContent={content}
                            onChange={setContent}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
