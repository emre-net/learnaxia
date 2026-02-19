"use client";

import { useNotes } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Loader2, Plus, Save, X } from "lucide-react";
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
    const [title, setTitle] = useState(existingNote?.title || "");
    const [content, setContent] = useState(existingNote?.content || "");

    useEffect(() => {
        if (existingNote) {
            setTitle(existingNote.title || "");
            setContent(existingNote.content || "");
        }
    }, [existingNote]);

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
                    placeholder="Title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-none px-0 font-medium focus-visible:ring-0"
                />
                <Textarea
                    placeholder="Write your note here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[150px] resize-none focus-visible:ring-1"
                />
            </CardContent>
            <CardFooter className="px-0 py-2 flex justify-end gap-2">
                {onClose && (
                    <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                )}
                <Button size="sm" onClick={handleSave} disabled={isLoading || !content.trim()}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Note
                </Button>
            </CardFooter>
        </Card>
    );
}
