import { NoteEditorDynamic } from "@/components/notes/note-editor-dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewNotePage() {
    return (
        <div className="flex flex-col h-full h-screen mx-auto max-w-5xl">
            <div className="py-4 px-6 flex items-center">
                <Link
                    href="/dashboard/notes"
                    className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Notlara Dön
                </Link>
            </div>
            <div className="flex-1 overflow-hidden">
                <NoteEditorDynamic />
            </div>
        </div>
    );
}
