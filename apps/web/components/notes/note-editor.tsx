"use client";

import { useNotes } from "@/hooks/use-notes";
import { BlockEditor } from "@/components/notes/block-editor";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback, useRef } from "react";
import { Save, X, Globe, Lock } from "lucide-react";
import { BrandLoader } from "@/components/ui/brand-loader";

interface NoteEditorProps {
    moduleId?: string;
    itemId?: string;
    existingNote?: { id: string; title?: string; content: string; visibility?: "PUBLIC" | "PRIVATE" } | null;
    readOnly?: boolean;
    onClose?: () => void;
    onSaved?: () => void;
}

export function NoteEditor({ moduleId, itemId, existingNote, readOnly = false, onClose, onSaved }: NoteEditorProps) {
    const { createNote, updateNote } = useNotes();
    const [noteId, setNoteId] = useState<string | undefined>(existingNote?.id);
    const [title, setTitle] = useState(existingNote?.title || "");
    const [content, setContent] = useState(existingNote?.content || "");
    const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(existingNote?.visibility || "PRIVATE");
    const lastSavedRef = useRef<string>(existingNote ? `${existingNote.title || ""}|${existingNote.content}|${existingNote.visibility || "PRIVATE"}` : "");
    const isCreatingRef = useRef(false);

    useEffect(() => {
        if (existingNote) {
            setNoteId(existingNote.id);
            setTitle(existingNote.title || "");
            setContent(existingNote.content || "");
            setVisibility(existingNote.visibility || "PRIVATE");
            lastSavedRef.current = `${existingNote.title || ""}|${existingNote.content}|${existingNote.visibility || "PRIVATE"}`;
        }
    }, [existingNote]);

    const [isSaving, setIsSaving] = useState(false);

    const saveChanges = useCallback(
        async (currentTitle: string, currentContent: string, currentVis: "PUBLIC" | "PRIVATE") => {
            if (readOnly) return;
            if (!currentContent.trim() || currentContent === "[]" || currentContent === '[{"type":"paragraph"}]') return;

            const fingerprint = `${currentTitle}|${currentContent}|${currentVis}`;
            if (fingerprint === lastSavedRef.current) return;

            if (!noteId && isCreatingRef.current) return;
            setIsSaving(true);
            if (!noteId) isCreatingRef.current = true;

            try {
                if (noteId) {
                    await new Promise<void>((resolve, reject) => {
                        updateNote(
                            { id: noteId, title: currentTitle, content: currentContent, visibility: currentVis },
                            { onSuccess: () => resolve(), onError: reject }
                        );
                    });
                    lastSavedRef.current = fingerprint;
                    onSaved?.();
                } else {
                    const created: any = await new Promise((resolve, reject) => {
                        createNote(
                            { moduleId, itemId, title: currentTitle, content: currentContent },
                            { onSuccess: (data) => resolve(data), onError: reject }
                        );
                    });
                    if (created?.id) {
                        setNoteId(created.id);
                        if (currentVis === "PUBLIC") {
                            updateNote({ id: created.id, visibility: "PUBLIC" });
                        }
                        lastSavedRef.current = fingerprint;
                        onSaved?.();
                    }
                }
            } catch (e) {
                console.error("Auto-save note error:", e);
            } finally {
                isCreatingRef.current = false;
                setIsSaving(false);
            }
        },
        [readOnly, noteId, moduleId, itemId, createNote, updateNote, onSaved]
    );

    useEffect(() => {
        if (readOnly) return;
        const fingerprint = `${title}|${content}|${visibility}`;
        if (!content || fingerprint === lastSavedRef.current) return;

        const timer = setTimeout(() => {
            saveChanges(title, content, visibility);
        }, 1500);
        return () => clearTimeout(timer);
    }, [readOnly, title, content, visibility, saveChanges]);

    return (
        <div className="w-full h-full flex flex-col bg-[#09090b] rounded-xl overflow-hidden pt-4 pb-20">
            {/* Minimal Header */}
            <div className="flex justify-between items-center px-4 mb-6">
                <div className="flex items-center space-x-3 text-xs text-zinc-400">
                    {readOnly ? (
                        <span>Salt okunur mod</span>
                    ) : isSaving ? (
                        <span className="flex items-center text-sky-400"><BrandLoader size="sm" className="mr-2" /> Kaydediliyor...</span>
                    ) : (
                        <span className="flex items-center"><Save className="h-3 w-3 mr-1 opacity-60" /> Kaydedildi</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={() => setVisibility(v => (v === "PUBLIC" ? "PRIVATE" : "PUBLIC"))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#121215] border border-white/10 hover:border-sky-500/40 text-zinc-200 transition-colors"
                        >
                            {visibility === "PUBLIC" ? (
                                <><Globe className="h-3.5 w-3.5 text-sky-400" /> Herkese Açık</>
                            ) : (
                                <><Lock className="h-3.5 w-3.5 text-zinc-400" /> Gizli</>
                            )}
                        </button>
                    )}

                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-100">
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Document Flow */}
            <div className="flex-1 overflow-y-auto px-6 md:px-12 xl:px-24">
                <div className="max-w-3xl mx-auto pb-32">
                    <Input
                        placeholder="Not Başlığı (İsteğe bağlı)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        readOnly={readOnly}
                        className="border-none px-0 mb-4 h-auto font-bold text-3xl md:text-4xl lg:text-[42px] text-zinc-100 focus-visible:ring-0 shadow-none bg-transparent rounded-none placeholder:text-zinc-600"
                    />

                    <div className="mt-8 text-lg">
                        <BlockEditor
                            initialContent={content}
                            onChange={setContent}
                            readOnly={readOnly}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
