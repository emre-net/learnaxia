"use client";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StickyNote, Plus } from "lucide-react";
import { NoteList } from "./note-list";
import { NoteEditor } from "./note-editor";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

interface NotesSidebarProps {
    moduleId: string;
    itemId?: string; // Optional: context for specific item notes
}

export function NotesSidebar({ moduleId, itemId }: NotesSidebarProps) {
    const [isCreating, setIsCreating] = useState(false);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <StickyNote className="h-4 w-4" />
                    {/* Optional: Add badge if notes exist? Needs separate query or passed prop */}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>Study Notes</SheetTitle>
                    <SheetDescription>
                        Take notes while you study. These are private to you.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 mt-4 flex flex-col gap-4 overflow-hidden">
                    {!isCreating ? (
                        <Button onClick={() => setIsCreating(true)} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Note
                        </Button>
                    ) : (
                        <NoteEditor
                            moduleId={moduleId}
                            itemId={itemId}
                            onClose={() => setIsCreating(false)}
                            onSaved={() => setIsCreating(false)}
                        />
                    )}

                    <Separator />

                    <div className="flex-1 overflow-hidden">
                        <NoteList moduleId={moduleId} itemId={itemId} />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
