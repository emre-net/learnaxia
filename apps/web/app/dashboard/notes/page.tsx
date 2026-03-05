"use client";

import { NoteList } from "@/components/notes/note-list";
import { NoteEditor } from "@/components/notes/note-editor";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function NotesPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
                    <p className="text-muted-foreground">
                        All your learning notes in one place.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Note
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Note</DialogTitle>
                            <DialogDescription>
                                Add a personal note unrelated to specific modules.
                            </DialogDescription>
                        </DialogHeader>
                        <NoteEditor
                            onSaved={() => setIsCreateOpen(false)}
                            onClose={() => setIsCreateOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md p-4 min-h-[500px] bg-background">
                <NoteList />
            </div>
        </div>
    );
}
