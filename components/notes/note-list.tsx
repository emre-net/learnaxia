"use client";

import { useNotes } from "@/hooks/use-notes";
import { NoteEditor } from "./note-editor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Edit2, Trash2, FileText } from "lucide-react";
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
import { LibraryCard } from "@/components/shared/library-card";
import { TypeIcon } from "@/components/shared/type-icon";

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
                            <LibraryCard
                                viewMode="grid"
                                typeIcon={<TypeIcon type="NOTE" size="md" />}
                                title={note.title || "İsimsiz Not"}
                                description={note.content}
                                metadata={[
                                    <span key="date" className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })} güncellendi
                                    </span>,
                                    note.module && !moduleId ? (
                                        <span key="module" className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2 truncate">
                                            Modül: {note.module.title}
                                        </span>
                                    ) : null
                                ]}
                                metrics={[
                                    {
                                        icon: <FileText className="h-4.5 w-4.5" />,
                                        count: note.content.length,
                                        label: "Karakter"
                                    }
                                ]}
                                actionButton={
                                    <div className="flex gap-2 w-full justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-10 rounded-xl px-4 flex-1 xs:flex-none border-primary/20 text-primary hover:bg-primary/5"
                                            onClick={() => setEditingNoteId(note.id)}
                                        >
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            Düzenle
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-10 rounded-xl px-4 flex-1 xs:flex-none border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Sil
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-[2rem]">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Notu Sil?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Bu işlem geri alınamaz. Notunuz tamamen silinecektir.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
                                                    <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteNote(note.id)}>
                                                        Sil
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                }
                            />
                        )}
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
