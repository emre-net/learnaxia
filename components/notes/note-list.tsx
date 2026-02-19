"use client";

import { useNotes } from "@/hooks/use-notes";
import { NoteEditor } from "./note-editor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";

interface NoteListProps {
    moduleId?: string;
    itemId?: string;
}

export function NoteList({ moduleId, itemId }: NoteListProps) {
    const { notes, isLoading, deleteNote } = useNotes({ moduleId, itemId });
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

    if (isLoading) {
        return <div className="text-center py-4 text-muted-foreground">Loading notes...</div>;
    }

    if (!notes || notes.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No notes yet.</div>;
    }

    return (
        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
            <div className="space-y-4">
                {notes.map((note) => (
                    <div key={note.id}>
                        {editingNoteId === note.id ? (
                            <NoteEditor
                                existingNote={note}
                                onSaved={() => setEditingNoteId(null)}
                                onClose={() => setEditingNoteId(null)}
                            />
                        ) : (
                            <Card>
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-semibold leading-none">
                                                {note.title || "Untitled Note"}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => setEditingNoteId(note.id)}
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteNote(note.id)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 text-sm whitespace-pre-wrap text-foreground/90">
                                    {note.content}
                                </CardContent>
                                {note.module && !moduleId && (
                                    <CardFooter className="p-4 pt-0">
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                            Module: {note.module.title}
                                        </span>
                                    </CardFooter>
                                )}
                            </Card>
                        )}
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
