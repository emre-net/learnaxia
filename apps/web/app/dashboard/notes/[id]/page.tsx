import { NoteEditor } from "@/components/notes/note-editor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/auth";

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return notFound();

    const resolvedParams = await params;
    const note = await prisma.note.findUnique({
        where: { id: resolvedParams.id }
    });

    if (!note || note.userId !== session.user.id) {
        return notFound();
    }

    // Ensure we only pass necessary sterile props to the Client Component
    const safeNote = {
        id: note.id,
        title: note.title ?? undefined,
        content: note.content,
    };

    return (
        <div className="flex flex-col h-full min-h-screen mx-auto max-w-5xl">
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
                <NoteEditor existingNote={safeNote} />
            </div>
        </div>
    );
}
