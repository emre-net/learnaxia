import { NoteEditorDynamic } from "@/components/notes/note-editor-dynamic";
import Link from "next/link";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/auth";

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const userId = session?.user?.id || null;

    const resolvedParams = await params;
    const note = await prisma.note.findUnique({
        where: { id: resolvedParams.id },
        include: {
            user: { select: { name: true, handle: true } }
        }
    });

    if (!note) {
        return notFound();
    }

    const isOwner = Boolean(userId && note.userId === userId);
    if (note.visibility !== "PUBLIC" && !isOwner) {
        return notFound();
    }

    const safeNote = {
        id: note.id,
        title: note.title ?? undefined,
        content: note.content,
        visibility: note.visibility as "PUBLIC" | "PRIVATE",
    };

    return (
        <div className="flex flex-col h-full min-h-screen mx-auto max-w-5xl">
            <div className="py-4 px-6 flex items-center justify-between gap-4 border-b border-white/[0.06]">
                <Link
                    href={isOwner ? "/dashboard/library?tab=notes" : "/dashboard/discover"}
                    className="flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {isOwner ? "Notlara Dön" : "Keşfet'e Dön"}
                </Link>

                <div className="flex items-center gap-3">
                    {!isOwner && (
                        <span className="text-xs text-zinc-400">
                            @{note.user?.handle || note.user?.name || "anonim"}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#121215] border border-white/[0.08] text-zinc-300">
                        {note.visibility === "PUBLIC" ? (
                            <><Globe className="h-3.5 w-3.5 text-sky-400" /> Herkese Açık</>
                        ) : (
                            <><Lock className="h-3.5 w-3.5 text-zinc-400" /> Gizli</>
                        )}
                    </span>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <NoteEditorDynamic existingNote={safeNote} readOnly={!isOwner} />
            </div>
        </div>
    );
}
