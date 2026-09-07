"use client";

import { NoteList } from "@/components/notes/note-list";
import { NoteEditor } from "@/components/notes/note-editor";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function NotesPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notlarım</h1>
                    <p className="text-muted-foreground">
                        Tüm çalışmalarınız, fikirleriniz ve notlarınız tek bir yerde.
                    </p>
                </div>
                <Link href="/dashboard/notes/new">
                    <Button className="rounded-xl h-10 px-5">
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Not Oluştur
                    </Button>
                </Link>
            </div>

            <div className="mt-8">
                <NoteList />
            </div>
        </div>
    );
}
