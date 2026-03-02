"use client";

import { useNotes } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Save, X } from "lucide-react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface NoteEditorProps {
    moduleId?: string;
    itemId?: string;
    existingNote?: { id: string; title?: string; content: string } | null;
    onClose?: () => void;
    onSaved?: () => void;
}

export function NoteEditor({ moduleId, itemId, existingNote, onClose, onSaved }: NoteEditorProps) {
    const { createNote, updateNote, isCreating, isUpdating } = useNotes();
    const router = useRouter();
    const [title, setTitle] = useState(existingNote?.title || "");
    const [content, setContent] = useState(existingNote?.content || "");

    useEffect(() => {
        if (existingNote) {
            setTitle(existingNote.title || "");
            setContent(existingNote.content || "");
        }
    }, [existingNote]);

    const handleMagicWand = () => {
        // Strip out HTML formatting for AI text input
        const rawText = content.replace(/<[^>]*>?/gm, '').trim();
        if (!rawText) return;

        // Use sessionStorage to bypass URL length limits for huge notes
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('magic_wand_text', rawText);
            router.push('/dashboard/create/ai');
        }
    };

    const handleSave = () => {
        if (!content.trim()) return;

        if (existingNote) {
            updateNote({ id: existingNote.id, title, content }, {
                onSuccess: () => {
                    if (onSaved) onSaved();
                    if (onClose) onClose();
                }
            });
        } else {
            createNote({ moduleId, itemId, title, content }, {
                onSuccess: () => {
                    setTitle("");
                    setContent("");
                    if (onSaved) onSaved();
                    if (onClose) onClose();
                }
            });
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Card className="w-full border-0 shadow-none">
            <CardHeader className="px-0 py-2">
                <CardTitle className="text-sm font-medium flex justify-between items-center">
                    {existingNote ? "Edit Note" : "New Note"}
                    {onClose && (
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0 py-2 space-y-2">
                <Input
                    placeholder="Not Başlığı (İsteğe bağlı)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-none px-2 font-bold text-lg md:text-xl focus-visible:ring-0 shadow-none bg-transparent"
                />

                <div className="px-2 pt-2">
                    <RichTextEditor
                        value={content}
                        onChange={setContent}
                        placeholder="Notunuzu buraya yazın..."
                    />
                </div>
            </CardContent>
            <CardFooter className="px-0 py-2 flex justify-between gap-2 border-t mt-4 pt-4">
                <div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMagicWand}
                        disabled={isLoading || !content.replace(/<[^>]*>?/gm, '').trim()}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:text-purple-400 dark:border-purple-800"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Magic Wand
                    </Button>
                </div>
                <div className="flex gap-2">
                    {onClose && (
                        <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                    )}
                    <Button size="sm" onClick={handleSave} disabled={isLoading || !content.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Note
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
